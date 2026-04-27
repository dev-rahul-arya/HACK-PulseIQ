// Pure data builder for the weekly report.
// Used by both the in-app WeeklyReport card and the doctor report HTML.

export function buildWeeklyReport({ sleep, hr, hrv, steps }) {
  const hasAny =
    (sleep || []).some((r) => r.value > 0) ||
    (hr || []).some((r) => r.value > 0) ||
    (steps || []).some((r) => r.value > 0);
  if (!hasAny) return { empty: true };

  const last7 = (arr) => arr.slice(-7).map((r) => r.value).filter((v) => v > 0);
  const prior7 = (arr) => arr.slice(-14, -7).map((r) => r.value).filter((v) => v > 0);

  const avg = (a) => (a.length ? a.reduce((s, v) => s + v, 0) / a.length : null);
  const sum = (a) => a.reduce((s, v) => s + v, 0);

  const sleepNow = avg(last7(sleep));
  const sleepPrior = avg(prior7(sleep));
  const hrNow = avg(last7(hr));
  const hrPrior = avg(prior7(hr));
  const hrvNow = avg(last7(hrv));
  const hrvPrior = avg(prior7(hrv));
  const stepsNowTotal = sum(last7(steps));
  const stepsPriorTotal = sum(prior7(steps));
  const stepsPctDelta =
    stepsPriorTotal > 0 ? ((stepsNowTotal - stepsPriorTotal) / stepsPriorTotal) * 100 : null;

  const sleepValues = sleep.slice(-7).map((r) => Number((r.value || 0).toFixed(1)));
  const stepsValues = steps.slice(-7).map((r) => r.value || 0);

  const highlights = computeHighlights({
    sleep: sleep.slice(-7),
    hr: hr.slice(-7),
    hrv: hrv.slice(-7),
    steps: steps.slice(-7),
    sleepNow,
    sleepPrior,
    hrNow,
    hrPrior,
    hrvNow,
    hrvPrior,
  });

  return {
    empty: false,
    range: formatRange(),
    stats: {
      sleep: { value: sleepNow, delta: diff(sleepNow, sleepPrior) },
      restingHR: { value: hrNow, delta: diff(hrNow, hrPrior) },
      hrv: { value: hrvNow, delta: diff(hrvNow, hrvPrior) },
      steps: { total: stepsNowTotal, delta: stepsPctDelta },
    },
    charts: { sleep: sleepValues, steps: stepsValues },
    highlights,
  };
}

function diff(now, prior) {
  if (now == null || prior == null) return null;
  return now - prior;
}

function formatRange() {
  const today = new Date();
  const start = new Date(today);
  start.setDate(start.getDate() - 6);
  const fmt = (d) => d.toLocaleDateString(undefined, { month: 'short', day: 'numeric' });
  return `${fmt(start)} – ${fmt(today)}`;
}

function computeHighlights(d) {
  const out = [];
  const sleep = d.sleep.filter((r) => r.value > 0);
  if (sleep.length >= 3) {
    const best = sleep.reduce((a, b) => (b.value > a.value ? b : a));
    const worst = sleep.reduce((a, b) => (b.value < a.value ? b : a));
    if (best.value - worst.value >= 1.5) {
      out.push({
        color: '#5E5CE6',
        text: `Sleep range was wide this week — ${worst.value.toFixed(1)}h to ${best.value.toFixed(1)}h. Steadier bedtimes typically help recovery markers more than longer single nights.`,
      });
    }
  }

  if (d.sleepNow != null && d.sleepPrior != null) {
    const delta = d.sleepNow - d.sleepPrior;
    if (delta <= -0.4) {
      out.push({
        color: '#FF375F',
        text: `Average sleep dropped by ${Math.abs(delta).toFixed(1)}h vs. the prior week.`,
      });
    } else if (delta >= 0.4) {
      out.push({
        color: '#30D158',
        text: `Sleep improved by ${delta.toFixed(1)}h on average — keep the routine that's working.`,
      });
    }
  }

  if (d.hrNow != null && d.hrPrior != null) {
    const delta = d.hrNow - d.hrPrior;
    if (delta >= 3) {
      out.push({
        color: '#FF375F',
        text: `Resting HR is ${Math.round(delta)} bpm higher than last week — often a sign of accumulated load, illness onset, or alcohol.`,
      });
    } else if (delta <= -3) {
      out.push({
        color: '#30D158',
        text: `Resting HR settled ${Math.round(Math.abs(delta))} bpm lower — a recovery-friendly direction.`,
      });
    }
  }

  if (d.hrvNow != null && d.hrvPrior != null) {
    const delta = d.hrvNow - d.hrvPrior;
    if (delta <= -5) {
      out.push({
        color: '#64D2FF',
        text: `HRV trended down by ~${Math.round(Math.abs(delta))} ms. A few easy days can usually pull it back.`,
      });
    } else if (delta >= 5) {
      out.push({
        color: '#30D158',
        text: `HRV trended up by ~${Math.round(delta)} ms — your nervous system is recovering well.`,
      });
    }
  }

  const steps = d.steps.filter((r) => r.value > 0);
  if (steps.length >= 3) {
    const max = Math.max(...steps.map((s) => s.value));
    const min = Math.min(...steps.map((s) => s.value));
    if (max / Math.max(1, min) >= 4) {
      out.push({
        color: '#FF9F0A',
        text: `Activity was lumpy — biggest day was ${(max / 1000).toFixed(1)}k steps, smallest was ${(min / 1000).toFixed(1)}k. Distributing movement more evenly tends to feel better.`,
      });
    }
  }

  return out.slice(0, 4);
}
