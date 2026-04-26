import Dexie from 'dexie';

export const db = new Dexie('pulseiq');

db.version(1).stores({
  // Indexed columns only; full record is stored as-is.
  healthMetrics: '++id, type, timestamp, dayKey',
  dailySummaries: 'date',
  userProfile: 'id',
  manualLogs: '++id, category, timestamp, dayKey',
  aiInsights: '++id, kind, date',
  reminders: '++id, time',
  meta: 'key',
});

// dayKey helper — stable YYYY-MM-DD in local time
export function dayKey(d) {
  const date = typeof d === 'string' ? new Date(d) : d;
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${y}-${m}-${day}`;
}

export async function clearAllData() {
  await db.transaction(
    'rw',
    db.healthMetrics,
    db.dailySummaries,
    db.manualLogs,
    db.aiInsights,
    db.reminders,
    db.meta,
    async () => {
      await db.healthMetrics.clear();
      await db.dailySummaries.clear();
      await db.manualLogs.clear();
      await db.aiInsights.clear();
      await db.reminders.clear();
      await db.meta.clear();
    }
  );
}

export async function getMeta(key) {
  const row = await db.meta.get(key);
  return row?.value;
}
export async function setMeta(key, value) {
  await db.meta.put({ key, value });
}
