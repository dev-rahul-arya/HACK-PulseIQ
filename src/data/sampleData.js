// Generates a deterministic 30-day sample dataset with a deliberate
// "rough mid-month" stretch so cross-signal correlations are obvious in the
// demo: nights 12-16 have ~5h sleep, which lifts resting HR and drops HRV
// in the same window. Activity dips a couple of days later.
//
// All times are local. Records are ready to insert into Dexie.

import { dayKey } from '../db/db';

// Tiny seeded PRNG so sample data is reproducible across reloads.
function mulberry32(seed) {
  return function () {
    let t = (seed += 0x6d2b79f5);
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

function startOfDay(d) {
  const x = new Date(d);
  x.setHours(0, 0, 0, 0);
  return x;
}

function addMinutes(d, m) {
  return new Date(d.getTime() + m * 60_000);
}

// One synthetic day. dayIndex 0 = oldest, 29 = today.
function buildDay(dayDate, dayIndex, rng) {
  const records = [];
  const isWeekend = [0, 6].includes(dayDate.getDay());
  const inRoughStretch = dayIndex >= 12 && dayIndex <= 16;
  const inRecoveryStretch = dayIndex >= 17 && dayIndex <= 19;

  // ---- Sleep (one record per night, "previous night" semantics) ----
  // Weeknight base 7.2h, weekend 7.8h, rough stretch 5.0h, recovery +0.5h.
  let sleepHours = (isWeekend ? 7.8 : 7.2) + (rng() - 0.5) * 0.6;
  if (inRoughStretch) sleepHours = 5.0 + (rng() - 0.5) * 0.8;
  if (inRecoveryStretch) sleepHours += 0.5;
  sleepHours = Math.max(3.5, Math.min(9.5, sleepHours));

  const deepRatio = inRoughStretch ? 0.10 : 0.18 + (rng() - 0.5) * 0.04;
  const remRatio = inRoughStretch ? 0.14 : 0.22 + (rng() - 0.5) * 0.04;
  const lightRatio = 1 - deepRatio - remRatio - 0.05; // 5% awake

  records.push({
    type: 'sleep',
    value: Number(sleepHours.toFixed(2)),
    unit: 'h',
    timestamp: addMinutes(dayDate, 7 * 60).toISOString(), // 7am log
    dayKey: dayKey(dayDate),
    source: 'sample',
    details: {
      deepHours: Number((sleepHours * deepRatio).toFixed(2)),
      remHours: Number((sleepHours * remRatio).toFixed(2)),
      lightHours: Number((sleepHours * lightRatio).toFixed(2)),
      awakeHours: Number((sleepHours * 0.05).toFixed(2)),
      bedtime: '23:30',
      waketime: '06:30',
    },
  });

  // ---- Resting HR (single morning reading) ----
  // Baseline 58 bpm, +6 during rough stretch, +3 lingering in recovery.
  let restingHR = 58 + (rng() - 0.5) * 4;
  if (inRoughStretch) restingHR += 6;
  if (inRecoveryStretch) restingHR += 3;
  restingHR = Math.round(restingHR);
  records.push({
    type: 'restingHR',
    value: restingHR,
    unit: 'bpm',
    timestamp: addMinutes(dayDate, 7 * 60 + 5).toISOString(),
    dayKey: dayKey(dayDate),
    source: 'sample',
  });

  // ---- HRV (rMSSD-style ms, single morning reading) ----
  let hrv = 52 + (rng() - 0.5) * 8;
  if (inRoughStretch) hrv -= 14;
  if (inRecoveryStretch) hrv -= 6;
  hrv = Math.max(18, Math.round(hrv));
  records.push({
    type: 'hrv',
    value: hrv,
    unit: 'ms',
    timestamp: addMinutes(dayDate, 7 * 60 + 5).toISOString(),
    dayKey: dayKey(dayDate),
    source: 'sample',
  });

  // ---- Heart-rate samples (12 readings spread across the day) ----
  for (let i = 0; i < 12; i++) {
    const minute = 7 * 60 + i * 75; // 7am to ~10pm
    // Daytime HR averages 72–82, dips slightly evening.
    let hr = 74 + Math.sin((i / 12) * Math.PI) * 8 + (rng() - 0.5) * 6;
    if (inRoughStretch) hr += 5;
    records.push({
      type: 'heartRate',
      value: Math.round(hr),
      unit: 'bpm',
      timestamp: addMinutes(dayDate, minute).toISOString(),
      dayKey: dayKey(dayDate),
      source: 'sample',
    });
  }

  // ---- Steps (one daily total) ----
  // Weekday ~8500, weekend ~6500, rough stretch lower (-1500 by day 14+).
  let steps = (isWeekend ? 6500 : 8500) + (rng() - 0.5) * 2000;
  if (dayIndex >= 14 && dayIndex <= 18) steps -= 1500;
  steps = Math.max(1500, Math.round(steps));
  records.push({
    type: 'steps',
    value: steps,
    unit: 'steps',
    timestamp: addMinutes(dayDate, 22 * 60).toISOString(),
    dayKey: dayKey(dayDate),
    source: 'sample',
  });

  // ---- Active minutes ----
  const activeMin = Math.round(steps / 110); // rough proxy
  records.push({
    type: 'activeMinutes',
    value: activeMin,
    unit: 'min',
    timestamp: addMinutes(dayDate, 22 * 60 + 1).toISOString(),
    dayKey: dayKey(dayDate),
    source: 'sample',
  });

  return records;
}

function buildManualLogs(today, rng) {
  // A handful of mood / symptom logs scattered through the month so the
  // manual-data section isn't empty on first load.
  const logs = [];
  const seedLogs = [
    // [daysAgo, category, value, details]
    [2, 'mood', 4, { note: 'Steady day, focused.' }],
    [5, 'mood', 3, { note: 'Tired but okay.' }],
    [8, 'symptom', 'headache', { severity: 2, note: 'Mild, afternoon.' }],
    [11, 'mood', 2, { note: 'Sluggish, hard to concentrate.' }],
    [13, 'symptom', 'fatigue', { severity: 3, note: 'Could not get going.' }],
    [14, 'symptom', 'headache', { severity: 2 }],
    [16, 'mood', 2, { note: 'Worst of the week.' }],
    [18, 'mood', 4, { note: 'Bouncing back.' }],
    [21, 'bp', '118/76', { note: 'Morning reading.' }],
    [25, 'weight', 72.4, { unit: 'kg' }],
  ];
  for (const [daysAgo, category, value, details] of seedLogs) {
    const ts = new Date(today);
    ts.setDate(ts.getDate() - daysAgo);
    ts.setHours(9 + Math.floor(rng() * 10), Math.floor(rng() * 60), 0, 0);
    logs.push({
      category,
      value,
      details,
      timestamp: ts.toISOString(),
      dayKey: dayKey(ts),
    });
  }
  return logs;
}

export function generateSampleDataset(referenceDate = new Date()) {
  const rng = mulberry32(20260426);
  const today = startOfDay(referenceDate);
  const metrics = [];
  for (let i = 0; i < 30; i++) {
    const day = new Date(today);
    day.setDate(day.getDate() - (29 - i));
    metrics.push(...buildDay(day, i, rng));
  }
  const manualLogs = buildManualLogs(today, rng);
  return { metrics, manualLogs };
}
