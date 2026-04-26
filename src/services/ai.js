// Client-side service that talks to /api/ai (the Vite proxy) which forwards
// to api.anthropic.com/v1/messages. Frontend never sees the API key.

const MODEL = 'claude-haiku-4-5-20251001';

async function callClaude({ system, user, max_tokens = 600 }) {
  if (typeof navigator !== 'undefined' && navigator.onLine === false) {
    throw new Error('offline');
  }
  const res = await fetch('/api/ai', {
    method: 'POST',
    headers: { 'content-type': 'application/json' },
    body: JSON.stringify({
      model: MODEL,
      max_tokens,
      system,
      messages: [{ role: 'user', content: user }],
    }),
  });
  if (!res.ok) {
    const txt = await res.text().catch(() => '');
    throw new Error(`Claude API ${res.status}: ${txt.slice(0, 200)}`);
  }
  const data = await res.json();
  // Anthropic returns { content: [{ type: 'text', text: '...' }, ...] }
  const text = (data.content || [])
    .filter((b) => b.type === 'text')
    .map((b) => b.text)
    .join('\n')
    .trim();
  return { text, raw: data };
}

// Best-effort JSON extractor — Claude sometimes wraps JSON in prose.
function extractJSON(text) {
  if (!text) return null;
  // Try direct parse first.
  try {
    return JSON.parse(text);
  } catch {}
  // Strip ```json fences.
  const fenced = text.match(/```(?:json)?\s*([\s\S]*?)```/);
  if (fenced) {
    try {
      return JSON.parse(fenced[1]);
    } catch {}
  }
  // Find the first {...} block.
  const m = text.match(/\{[\s\S]*\}/);
  if (m) {
    try {
      return JSON.parse(m[0]);
    } catch {}
  }
  return null;
}

const SYSTEM_DAILY = `You are PulseIQ, a careful, kind health co-pilot.
You explain patterns in personal health data. You NEVER diagnose, NEVER prescribe,
and you always frame observations as questions for a clinician when relevant.
You speak in plain, warm language. You always cite the specific signal that
drove an observation (e.g., "your resting HR is 8 bpm above your 14-day baseline").`;

function focusBlock(goals) {
  if (!goals || !goals.length) return '';
  const list = goals.map((g) => `- ${g}`).join('\n');
  return `\n\nUser's current focus areas (tailor your observation and nudge toward these when relevant; do not force the connection if the data does not support it):\n${list}`;
}

export async function getDailyInsight(payload) {
  const user = `Here is the user's recent data. Use it to write today's insight.

Last 24h:
- Sleep: ${payload.sleepSummary || 'no record'}
- Resting HR: ${payload.restingHR ?? 'unknown'} bpm (14-day baseline ${payload.restingHRBaseline ?? '?'})
- HRV: ${payload.hrv ?? 'unknown'} ms (14-day baseline ${payload.hrvBaseline ?? '?'})
- Steps: ${payload.steps ?? 'unknown'}, active minutes: ${payload.activeMinutes ?? 'unknown'}
- Mood (today): ${payload.mood ?? 'not logged'}
- Symptoms logged today: ${payload.symptoms?.length ? payload.symptoms.join(', ') : 'none'}

Trends (last 7 days):
- Avg sleep: ${payload.avgSleep7d ?? '?'} h
- Avg resting HR: ${payload.avgRestingHR7d ?? '?'} bpm

Reply with ONLY a JSON object, no prose, no fences:
{
  "insight": "<one clear, friendly sentence (max 25 words) explaining the most interesting cross-signal pattern>",
  "nudge": "<a short, gentle, actionable suggestion for the next 2 hours (max 15 words)>",
  "confidence": <integer 1-5>
}`;
  try {
    const { text } = await callClaude({
      system: SYSTEM_DAILY + focusBlock(payload.focusGoals),
      user,
      max_tokens: 400,
    });
    const parsed = extractJSON(text);
    if (!parsed?.insight) throw new Error('No insight in response');
    return {
      insight: parsed.insight,
      nudge: parsed.nudge || null,
      confidence: parsed.confidence ?? null,
      generatedAt: new Date().toISOString(),
      source: 'claude',
    };
  } catch (err) {
    return { ...mockDailyInsight(payload), error: String(err.message || err) };
  }
}

const SYSTEM_WEEKLY = `You are a kind, careful health storyteller. You write
3-paragraph reflections on a person's past week of health data. You NEVER
diagnose. You always cite specific signals. You frame patterns gently.`;

export async function getWeeklyStory(payload) {
  const user = `Summarize the user's past 7 days using this data:

${JSON.stringify(payload, null, 2)}

Reply with ONLY a JSON object, no prose, no fences:
{
  "story": "<three short paragraphs separated by \\n\\n. Para 1: biggest positive change. Para 2: pattern that needs attention (no alarm). Para 3: one reflective question for the week ahead.>",
  "keyTakeaway": "<one-sentence summary>"
}`;
  try {
    const { text } = await callClaude({
      system: SYSTEM_WEEKLY + focusBlock(payload.focusGoals),
      user,
      max_tokens: 800,
    });
    const parsed = extractJSON(text);
    if (!parsed?.story) throw new Error('No story in response');
    return {
      story: parsed.story,
      keyTakeaway: parsed.keyTakeaway || '',
      generatedAt: new Date().toISOString(),
      source: 'claude',
    };
  } catch (err) {
    return { ...mockWeeklyStory(), error: String(err.message || err) };
  }
}

const SYSTEM_FOLLOWUP = `You are PulseIQ's follow-up explainer. The user asks
short questions about an insight you previously gave. Answer in 1–3 plain,
warm sentences. Cite the specific signal driving each claim ("your last 3 nights
averaged 6.0h"). Never diagnose, never prescribe. If a question is outside the
data you were given, say so plainly and suggest what they could log to find out.`;

export async function askFollowUp({
  insightSummary,
  contextSummary,
  history = [],
  question,
  focusGoals = [],
}) {
  const messages = [
    {
      role: 'user',
      content: `Original insight: "${insightSummary}"

Relevant data the insight was based on:
${contextSummary}

The user is now asking follow-up questions. Reply concisely.`,
    },
    {
      role: 'assistant',
      content: 'Understood. I will answer follow-ups based on that data, plainly and without diagnosing.',
    },
    ...history.flatMap((turn) => [
      { role: 'user', content: turn.user },
      { role: 'assistant', content: turn.assistant },
    ]),
    { role: 'user', content: question },
  ];

  if (typeof navigator !== 'undefined' && navigator.onLine === false) {
    throw new Error('offline');
  }
  const res = await fetch('/api/ai', {
    method: 'POST',
    headers: { 'content-type': 'application/json' },
    body: JSON.stringify({
      model: MODEL,
      max_tokens: 350,
      system: SYSTEM_FOLLOWUP + focusBlock(focusGoals),
      messages,
    }),
  });
  if (!res.ok) {
    const txt = await res.text().catch(() => '');
    throw new Error(`Claude API ${res.status}: ${txt.slice(0, 200)}`);
  }
  const data = await res.json();
  const text = (data.content || [])
    .filter((b) => b.type === 'text')
    .map((b) => b.text)
    .join('\n')
    .trim();
  if (!text) throw new Error('Empty follow-up response');
  return { answer: text, generatedAt: new Date().toISOString() };
}

// ---- Fallbacks for demo if API fails ----
function mockDailyInsight(p) {
  const sleep = p.sleepSummary || 'about 7h';
  return {
    insight: `Your last night of sleep was ${sleep}; your resting heart rate today (${p.restingHR ?? '—'} bpm) tracks where you'd expect it.`,
    nudge: 'A 5-minute walk outside in the next hour can lift HRV and mood.',
    confidence: 3,
    generatedAt: new Date().toISOString(),
    source: 'fallback',
  };
}

function mockWeeklyStory() {
  return {
    story:
      "This week your activity stayed steady, with a small rebound in the last three days.\n\nMid-week sleep dropped to about 5 hours for several nights, and your resting heart rate climbed in step — a classic short-sleep pattern.\n\nWhat would help you protect bedtime over the next seven days?",
    keyTakeaway: 'Sleep consistency was the week\'s biggest opportunity.',
    generatedAt: new Date().toISOString(),
    source: 'fallback',
  };
}
