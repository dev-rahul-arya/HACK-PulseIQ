import { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Card } from '../ui/Card';
import { Button } from '../ui/Button';
import { db } from '../../db/db';
import { dailySeries, hasAnyData, recentManualLogs } from '../../db/queries';
import { getWeeklyStory } from '../../services/ai';
import { getProfile } from '../../services/profile';
import { fmtRelativeDate } from '../../utils/formatters';
import { FeedbackButtons } from './FeedbackButtons';
import { WeeklyReport } from './WeeklyReport';

export function InsightsTab() {
  const [hasData, setHasData] = useState(false);
  const [dailyInsights, setDailyInsights] = useState([]);
  const [weekly, setWeekly] = useState(null);
  const [weeklyId, setWeeklyId] = useState(null);
  const [weeklyLoading, setWeeklyLoading] = useState(false);
  const [expanded, setExpanded] = useState(null);

  async function reload() {
    setHasData(await hasAnyData());
    const all = await db.aiInsights.orderBy('id').reverse().toArray();
    setDailyInsights(all.filter((i) => i.kind === 'daily').slice(0, 7));
    const cachedWeekly = all.find((i) => i.kind === 'weekly');
    if (cachedWeekly) {
      setWeekly(cachedWeekly.payload);
      setWeeklyId(cachedWeekly.id);
    }
  }

  useEffect(() => {
    reload();
  }, []);

  async function generateWeekly() {
    setWeeklyLoading(true);
    try {
      const [sleep, hr, hrv, steps, mood] = await Promise.all([
        dailySeries('sleep', 7),
        dailySeries('restingHR', 7),
        dailySeries('hrv', 7),
        dailySeries('steps', 7),
        recentManualLogs(20),
      ]);
      const profile = await getProfile().catch(() => null);
      const payload = {
        sleepHoursByDay: sleep.map((r) => ({ date: r.dayKey, hours: r.value })),
        restingHRByDay: hr.map((r) => ({ date: r.dayKey, bpm: r.value })),
        hrvByDay: hrv.map((r) => ({ date: r.dayKey, ms: r.value })),
        stepsByDay: steps.map((r) => ({ date: r.dayKey, steps: r.value })),
        recentLogs: mood.slice(0, 10).map((l) => ({
          when: l.timestamp,
          category: l.category,
          value: l.value,
        })),
        focusGoals: profile?.goals ?? [],
      };
      const result = await getWeeklyStory(payload);
      setWeekly(result);
      const newId = await db.aiInsights.add({
        kind: 'weekly',
        date: new Date().toISOString().slice(0, 10),
        payload: result,
        createdAt: new Date().toISOString(),
      });
      setWeeklyId(newId);
    } finally {
      setWeeklyLoading(false);
    }
  }

  return (
    <div className="px-5 pt-12 safe-top">
      <header className="mb-6">
        <h1 className="text-3xl font-semibold">Insights</h1>
        <p className="text-sm text-textSecondary/60 mt-1">
          Patterns Claude has noticed in your data.
        </p>
      </header>

      {!hasData && (
        <Card>
          <p className="text-sm text-textSecondary/70">
            Connect a sample dataset from Profile to populate insights.
          </p>
        </Card>
      )}

      {hasData && (
        <>
          <WeeklyReport />

          <Card className="!p-5 mb-4">
            <div className="flex items-start justify-between gap-3">
              <div>
                <p className="text-[11px] uppercase tracking-widest text-accent-mental">
                  Weekly story
                </p>
                <p className="text-sm text-textSecondary/70 mt-1">
                  A 3-paragraph reflection on the past 7 days.
                </p>
              </div>
              {!weeklyLoading && (
                <Button
                  variant="ghost"
                  onClick={generateWeekly}
                  className="!px-4 !py-2 text-xs"
                >
                  {weekly ? 'Regenerate' : 'Generate'}
                </Button>
              )}
            </div>

            <AnimatePresence mode="wait">
              {weeklyLoading && (
                <motion.div
                  key="loading"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  className="mt-4 space-y-2"
                >
                  <div className="h-4 w-full rounded shimmer" />
                  <div className="h-4 w-5/6 rounded shimmer" />
                  <div className="h-4 w-4/6 rounded shimmer" />
                </motion.div>
              )}
              {!weeklyLoading && weekly && (
                <motion.div
                  key="story"
                  initial={{ opacity: 0, y: 6 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0 }}
                  className="mt-4"
                >
                  {weekly.keyTakeaway && (
                    <p className="text-sm font-medium mb-3 text-textPrimary">
                      “{weekly.keyTakeaway}”
                    </p>
                  )}
                  {weekly.story.split(/\n\s*\n/).map((para, i) => (
                    <p
                      key={i}
                      className="text-sm leading-relaxed text-textSecondary/80 mb-3 last:mb-0"
                    >
                      {para}
                    </p>
                  ))}
                  {weekly.source === 'fallback' && (
                    <p className="text-[10px] text-textSecondary/40 mt-2">
                      Showing fallback story (Claude unreachable).
                    </p>
                  )}
                  <FeedbackButtons insightId={weeklyId} />
                </motion.div>
              )}
            </AnimatePresence>
          </Card>

          <h2 className="text-xs uppercase tracking-widest text-textSecondary/60 mb-2 mt-6">
            Recent daily insights
          </h2>
          {dailyInsights.length === 0 && (
            <Card>
              <p className="text-sm text-textSecondary/70">
                No daily insights yet. Open Today to generate one.
              </p>
            </Card>
          )}
          <div className="space-y-3">
            {dailyInsights.map((row) => {
              const open = expanded === row.id;
              return (
                <Card
                  key={row.id}
                  interactive
                  onClick={() => setExpanded(open ? null : row.id)}
                  className="!p-4"
                >
                  <div className="flex items-start justify-between gap-3">
                    <p className="text-sm leading-relaxed flex-1">
                      {row.payload.insight}
                    </p>
                    <span className="text-[10px] text-textSecondary/40 shrink-0">
                      {fmtRelativeDate(row.payload.generatedAt)}
                    </span>
                  </div>
                  <AnimatePresence initial={false}>
                    {open && row.payload.nudge && (
                      <motion.div
                        initial={{ opacity: 0, height: 0 }}
                        animate={{ opacity: 1, height: 'auto' }}
                        exit={{ opacity: 0, height: 0 }}
                        className="overflow-hidden"
                      >
                        <div className="mt-3 pt-3 border-t border-white/5">
                          <p className="text-[11px] uppercase tracking-widest text-accent-recovery">
                            Nudge
                          </p>
                          <p className="text-xs text-textSecondary/80 mt-1">
                            {row.payload.nudge}
                          </p>
                          <p className="text-[10px] text-textSecondary/40 mt-2">
                            Source: {row.payload.source}
                            {row.payload.confidence != null
                              ? ` · confidence ${row.payload.confidence}/5`
                              : ''}
                          </p>
                          <FeedbackButtons insightId={row.id} compact />
                        </div>
                      </motion.div>
                    )}
                  </AnimatePresence>
                </Card>
              );
            })}
          </div>
        </>
      )}
    </div>
  );
}
