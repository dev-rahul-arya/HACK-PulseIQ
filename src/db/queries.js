import { db, dayKey } from './db';
import { generateSampleDataset } from '../data/sampleData';

export async function seedSampleData() {
  const { metrics, manualLogs } = generateSampleDataset(new Date());
  await db.transaction('rw', db.healthMetrics, db.manualLogs, async () => {
    await db.healthMetrics.clear();
    await db.manualLogs.clear();
    await db.healthMetrics.bulkAdd(metrics);
    await db.manualLogs.bulkAdd(manualLogs);
  });
}

export async function hasAnyData() {
  const c = await db.healthMetrics.count();
  return c > 0;
}

// Most recent record of a given type (e.g., latest restingHR, latest sleep).
export async function latestMetric(type) {
  return db.healthMetrics
    .where('type')
    .equals(type)
    .reverse()
    .sortBy('timestamp')
    .then((arr) => arr[0]);
}

// All records on a given day, optionally filtered by type.
export async function metricsForDay(date, type = null) {
  const k = dayKey(date);
  let coll = db.healthMetrics.where('dayKey').equals(k);
  if (type) coll = coll.and((r) => r.type === type);
  return coll.sortBy('timestamp');
}

// Last N daily readings of a given type (one per day where present).
// Returns oldest → newest.
export async function dailySeries(type, days = 30) {
  const all = await db.healthMetrics
    .where('type')
    .equals(type)
    .sortBy('timestamp');
  // Keep one per dayKey (last reading wins).
  const byDay = new Map();
  for (const r of all) byDay.set(r.dayKey, r);
  const sorted = [...byDay.values()].sort((a, b) =>
    a.timestamp < b.timestamp ? -1 : 1
  );
  return sorted.slice(-days);
}

// Aggregated summary for a single day — convenience for cards.
export async function daySummary(date) {
  const rows = await metricsForDay(date);
  const byType = {};
  for (const r of rows) {
    if (!byType[r.type]) byType[r.type] = [];
    byType[r.type].push(r);
  }
  const last = (arr) => (arr ? arr[arr.length - 1] : null);
  const avg = (arr) =>
    arr && arr.length
      ? Math.round(arr.reduce((s, x) => s + x.value, 0) / arr.length)
      : null;

  return {
    date: dayKey(date),
    sleep: last(byType.sleep) || null,
    restingHR: last(byType.restingHR) || null,
    hrv: last(byType.hrv) || null,
    avgHR: avg(byType.heartRate),
    steps: last(byType.steps)?.value ?? null,
    activeMinutes: last(byType.activeMinutes)?.value ?? null,
  };
}

export async function manualLogsForDay(date) {
  const k = dayKey(date);
  return db.manualLogs.where('dayKey').equals(k).sortBy('timestamp');
}

export async function recentManualLogs(limit = 20) {
  const all = await db.manualLogs.orderBy('timestamp').reverse().toArray();
  return all.slice(0, limit);
}

export async function addManualLog({ category, value, details = {} }) {
  const ts = new Date();
  return db.manualLogs.add({
    category,
    value,
    details,
    timestamp: ts.toISOString(),
    dayKey: dayKey(ts),
  });
}
