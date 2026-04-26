import { db } from '../db/db';
import { dailySeries } from '../db/queries';

function escapeHtml(s) {
  return String(s ?? '')
    .replaceAll('&', '&amp;')
    .replaceAll('<', '&lt;')
    .replaceAll('>', '&gt;')
    .replaceAll('"', '&quot;')
    .replaceAll("'", '&#39;');
}

function stats(values) {
  const xs = values.filter((v) => v != null && !Number.isNaN(v));
  if (!xs.length) return null;
  const min = Math.min(...xs);
  const max = Math.max(...xs);
  const avg = xs.reduce((a, b) => a + b, 0) / xs.length;
  return { min, max, avg, n: xs.length };
}

function fmtRange(s, suffix = '') {
  if (!s) return '<em>no data</em>';
  return `avg ${s.avg.toFixed(1)}${suffix} · min ${s.min}${suffix} · max ${s.max}${suffix} · n=${s.n}`;
}

function sparklineSvg(values, color = '#5E5CE6') {
  if (!values || values.length < 2) return '';
  const w = 320;
  const h = 60;
  const pad = 4;
  const min = Math.min(...values);
  const max = Math.max(...values);
  const range = max - min || 1;
  const dx = (w - pad * 2) / (values.length - 1);
  const points = values
    .map((v, i) => `${(pad + i * dx).toFixed(1)},${(h - pad - ((v - min) / range) * (h - pad * 2)).toFixed(1)}`)
    .join(' ');
  return `<svg viewBox="0 0 ${w} ${h}" width="100%" height="${h}" preserveAspectRatio="none" aria-hidden="true">
    <polyline fill="none" stroke="${color}" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" points="${points}" />
  </svg>`;
}

function tableRow(label, valueHtml, sparkHtml) {
  return `<tr>
    <th scope="row">${escapeHtml(label)}</th>
    <td>${valueHtml}</td>
    <td class="spark">${sparkHtml || ''}</td>
  </tr>`;
}

export async function buildDoctorReport({ profile, days = 30, sections }) {
  const include = {
    vitals: sections?.vitals !== false,
    insights: sections?.insights !== false,
    logs: sections?.logs !== false,
  };

  const [sleep, restingHR, hrv, steps] = await Promise.all([
    dailySeries('sleep', days),
    dailySeries('restingHR', days),
    dailySeries('hrv', days),
    dailySeries('steps', days),
  ]);

  const sinceCutoff = new Date(Date.now() - days * 24 * 60 * 60 * 1000).toISOString();

  const aiInsights = include.insights
    ? (await db.aiInsights.orderBy('id').reverse().toArray()).filter(
        (r) => (r.createdAt || '') >= sinceCutoff
      )
    : [];
  const manualLogs = include.logs
    ? (await db.manualLogs.orderBy('timestamp').reverse().toArray()).filter(
        (r) => r.timestamp >= sinceCutoff
      )
    : [];

  const sleepStats = stats(sleep.map((r) => r.value));
  const hrStats = stats(restingHR.map((r) => r.value));
  const hrvStats = stats(hrv.map((r) => r.value));
  const stepsStats = stats(steps.map((r) => r.value));

  const generatedAt = new Date().toLocaleString();
  const rangeLabel = `${new Date(Date.now() - days * 86400000).toLocaleDateString()} – ${new Date().toLocaleDateString()}`;

  const vitalsBlock = include.vitals
    ? `<section>
        <h2>Vitals trend (${escapeHtml(rangeLabel)})</h2>
        <table>
          <thead>
            <tr><th scope="col">Signal</th><th scope="col">Range</th><th scope="col">Trend</th></tr>
          </thead>
          <tbody>
            ${tableRow('Sleep (h)', fmtRange(sleepStats, ' h'), sparklineSvg(sleep.map((r) => r.value), '#5E5CE6'))}
            ${tableRow('Resting HR (bpm)', fmtRange(hrStats, ' bpm'), sparklineSvg(restingHR.map((r) => r.value), '#FF375F'))}
            ${tableRow('HRV (ms)', fmtRange(hrvStats, ' ms'), sparklineSvg(hrv.map((r) => r.value), '#64D2FF'))}
            ${tableRow('Steps', fmtRange(stepsStats), sparklineSvg(steps.map((r) => r.value), '#FF9F0A'))}
          </tbody>
        </table>
      </section>`
    : '';

  const insightsBlock = include.insights
    ? `<section>
        <h2>AI insights (${aiInsights.length})</h2>
        ${
          aiInsights.length === 0
            ? '<p class="muted">No insights generated in this window.</p>'
            : aiInsights
                .map(
                  (r) => `<article class="insight">
                    <header>
                      <span class="kind">${escapeHtml(r.kind)}</span>
                      <span class="when">${escapeHtml(new Date(r.createdAt).toLocaleString())}</span>
                    </header>
                    <p>${escapeHtml(r.payload?.insight || r.payload?.keyTakeaway || '')}</p>
                    ${r.payload?.story ? `<p class="story">${escapeHtml(r.payload.story).replace(/\n\n/g, '</p><p class="story">')}</p>` : ''}
                    ${r.payload?.nudge ? `<p class="nudge"><strong>Nudge:</strong> ${escapeHtml(r.payload.nudge)}</p>` : ''}
                    ${r.payload?.feedback ? `<p class="muted">User feedback: ${r.payload.feedback.rating === 'up' ? '👍 helpful' : '👎 not helpful'}</p>` : ''}
                  </article>`
                )
                .join('')
        }
      </section>`
    : '';

  const logsBlock = include.logs
    ? `<section>
        <h2>Manual logs (${manualLogs.length})</h2>
        ${
          manualLogs.length === 0
            ? '<p class="muted">No manual logs in this window.</p>'
            : `<table><thead><tr><th>When</th><th>Category</th><th>Value</th><th>Notes</th></tr></thead><tbody>${manualLogs
                .map(
                  (l) => `<tr>
                    <td>${escapeHtml(new Date(l.timestamp).toLocaleString())}</td>
                    <td>${escapeHtml(l.category)}</td>
                    <td>${escapeHtml(typeof l.value === 'object' ? JSON.stringify(l.value) : l.value)}</td>
                    <td>${escapeHtml(l.details?.note || l.details?.severity ? `severity ${l.details.severity}` : '')}</td>
                  </tr>`
                )
                .join('')}</tbody></table>`
        }
      </section>`
    : '';

  const goalsHtml = profile?.goals?.length
    ? `<p><strong>Focus areas:</strong> ${profile.goals.map((g) => escapeHtml(g)).join(', ')}</p>`
    : '';

  return `<!doctype html>
<html lang="en">
<head>
<meta charset="utf-8" />
<meta name="viewport" content="width=device-width, initial-scale=1" />
<title>PulseIQ report — ${escapeHtml(profile?.displayName || 'You')}</title>
<style>
  :root { color-scheme: light; }
  * { box-sizing: border-box; }
  body { font: 15px/1.5 -apple-system, BlinkMacSystemFont, "SF Pro Text", system-ui, sans-serif; color: #111; background: #fff; margin: 0; padding: 32px; max-width: 820px; margin: 0 auto; }
  header.report-header { border-bottom: 2px solid #111; padding-bottom: 16px; margin-bottom: 24px; }
  h1 { font-size: 26px; margin: 0 0 4px; letter-spacing: -0.02em; }
  h2 { font-size: 18px; margin: 28px 0 10px; letter-spacing: -0.01em; border-bottom: 1px solid #ddd; padding-bottom: 6px; }
  .meta { color: #666; font-size: 13px; }
  .disclaimer { background: #fff8e1; border: 1px solid #ffd54f; padding: 12px 14px; border-radius: 8px; font-size: 13px; color: #5d4037; margin: 16px 0 24px; }
  table { border-collapse: collapse; width: 100%; font-size: 14px; }
  th, td { text-align: left; padding: 8px 10px; border-bottom: 1px solid #eee; vertical-align: middle; }
  th[scope="row"] { width: 32%; font-weight: 600; }
  td.spark { width: 36%; padding-right: 0; }
  td.spark svg { display: block; width: 100%; }
  .insight { border: 1px solid #eee; border-radius: 8px; padding: 12px 14px; margin-bottom: 10px; }
  .insight header { display: flex; justify-content: space-between; font-size: 12px; color: #666; margin-bottom: 4px; }
  .insight .kind { text-transform: uppercase; letter-spacing: 0.06em; }
  .insight .nudge { color: #1b5e20; margin-top: 6px; }
  .story + .story { margin-top: 6px; }
  .muted { color: #888; font-size: 13px; }
  footer { margin-top: 36px; border-top: 1px solid #ddd; padding-top: 12px; color: #888; font-size: 12px; }
  @media print { body { padding: 0; } }
</style>
</head>
<body>
  <header class="report-header">
    <h1>PulseIQ health report</h1>
    <p class="meta">Prepared for <strong>${escapeHtml(profile?.displayName || 'You')}</strong> · Range: ${escapeHtml(rangeLabel)} · Generated ${escapeHtml(generatedAt)}</p>
    ${goalsHtml}
  </header>
  <div class="disclaimer">
    <strong>Educational summary.</strong> PulseIQ is not a medical device and does not diagnose. The figures below come from the user's wearable, manual logs, and AI-generated explanations. Use as a discussion starting point with a clinician.
  </div>
  ${vitalsBlock}
  ${insightsBlock}
  ${logsBlock}
  <footer>
    Generated by PulseIQ on ${escapeHtml(generatedAt)}.
  </footer>
</body>
</html>`;
}

export function downloadReport(html, filename = 'pulseiq-report.html') {
  const blob = new Blob([html], { type: 'text/html' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  a.remove();
  setTimeout(() => URL.revokeObjectURL(url), 1000);
}

export function openReport(html) {
  const blob = new Blob([html], { type: 'text/html' });
  const url = URL.createObjectURL(blob);
  const w = window.open(url, '_blank', 'noopener,noreferrer');
  // Browsers may block; the caller can fall back to download.
  return !!w;
}
