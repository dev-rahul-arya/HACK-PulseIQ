import { db } from '../db/db';

export async function recordInsightFeedback(insightId, rating) {
  if (!insightId) return;
  const row = await db.aiInsights.get(insightId);
  if (!row) return;
  const payload = {
    ...row.payload,
    feedback: { rating, at: new Date().toISOString() },
  };
  await db.aiInsights.update(insightId, { payload });
}

export async function getInsightFeedback(insightId) {
  if (!insightId) return null;
  const row = await db.aiInsights.get(insightId);
  return row?.payload?.feedback ?? null;
}
