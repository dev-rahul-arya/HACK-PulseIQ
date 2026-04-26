// Composite "Circadian Risk Score" — 0 (lowest risk) to 100 (highest).
// Inputs: aggregates from the last few days. We weight:
//   - Sleep debt vs 8h baseline over last 3 nights        (35%)
//   - Resting HR delta vs 30-day baseline                  (25%)
//   - HRV delta vs 30-day baseline                         (25%)
//   - Activity inconsistency (stdev/mean of last 7 days)   (15%)
// Each contributor is clipped to [0,1] before weighting so any single
// bad signal can't dominate.

function clamp(x, lo, hi) {
  return Math.max(lo, Math.min(hi, x));
}

function mean(arr) {
  if (!arr.length) return 0;
  return arr.reduce((s, x) => s + x, 0) / arr.length;
}

function stdev(arr) {
  if (arr.length < 2) return 0;
  const m = mean(arr);
  return Math.sqrt(mean(arr.map((x) => (x - m) ** 2)));
}

export function computeCircadianRisk({
  sleepHoursLast3 = [],
  restingHRSeries = [],
  hrvSeries = [],
  stepsLast7 = [],
}) {
  // 1. Sleep debt: 8h baseline, 3 nights at 5h => debt 9h => high risk.
  const debt = Math.max(
    0,
    sleepHoursLast3.reduce((s, h) => s + (8 - h), 0)
  );
  const sleepScore = clamp(debt / 9, 0, 1); // 9h debt = max

  // 2. Resting HR delta vs baseline (use first half as baseline, last 3 as recent).
  let hrScore = 0;
  if (restingHRSeries.length >= 6) {
    const baseline = mean(restingHRSeries.slice(0, restingHRSeries.length - 3));
    const recent = mean(restingHRSeries.slice(-3));
    const delta = recent - baseline; // bpm above baseline
    hrScore = clamp(delta / 10, 0, 1); // +10 bpm = max
  }

  // 3. HRV delta vs baseline (lower = worse).
  let hrvScore = 0;
  if (hrvSeries.length >= 6) {
    const baseline = mean(hrvSeries.slice(0, hrvSeries.length - 3));
    const recent = mean(hrvSeries.slice(-3));
    const delta = baseline - recent; // ms below baseline
    hrvScore = clamp(delta / 15, 0, 1); // -15 ms = max
  }

  // 4. Activity inconsistency.
  let activityScore = 0;
  if (stepsLast7.length >= 3) {
    const m = mean(stepsLast7);
    const cv = m > 0 ? stdev(stepsLast7) / m : 0;
    activityScore = clamp(cv / 0.6, 0, 1); // CV of 0.6 = max
  }

  const composite =
    0.35 * sleepScore +
    0.25 * hrScore +
    0.25 * hrvScore +
    0.15 * activityScore;
  const score = Math.round(composite * 100);

  return {
    score,
    contributors: {
      sleep: Math.round(sleepScore * 100),
      restingHR: Math.round(hrScore * 100),
      hrv: Math.round(hrvScore * 100),
      activity: Math.round(activityScore * 100),
    },
  };
}

export function riskBand(score) {
  if (score < 25) return { label: 'Low', color: '#30D158' };
  if (score < 50) return { label: 'Moderate', color: '#FFD60A' };
  if (score < 75) return { label: 'Elevated', color: '#FF9F0A' };
  return { label: 'High', color: '#FF453A' };
}
