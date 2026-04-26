import { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import { Card } from '../ui/Card';
import { Button } from '../ui/Button';
import { RiskRing } from './RiskRing';
import { MetricCard, Spark } from './MetricCard';
import { InsightCard } from './InsightCard';
import {
  daySummary,
  dailySeries,
  hasAnyData,
  manualLogsForDay,
} from '../../db/queries';
import { computeCircadianRisk } from '../../utils/calculations';
import { fmtHours, fmtNumber, moodLabel } from '../../utils/formatters';
import { useStore } from '../../store/useStore';
import { getDailyInsight } from '../../services/ai';
import { getProfile } from '../../services/profile';
import { db, dayKey } from '../../db/db';

export function TodayTab() {
  const openAddModal = useStore((s) => s.openAddModal);
  const [loaded, setLoaded] = useState(false);
  const [hasData, setHasData] = useState(false);
  const [summary, setSummary] = useState(null);
  const [risk, setRisk] = useState({ score: 0, contributors: {} });
  const [hrSpark, setHrSpark] = useState([]);
  const [sleepSpark, setSleepSpark] = useState([]);
  const [stepsSpark, setStepsSpark] = useState([]);
  const [moodToday, setMoodToday] = useState(null);
  const [insight, setInsight] = useState(null);
  const [insightId, setInsightId] = useState(null);
  const [insightLoading, setInsightLoading] = useState(false);

  async function reload() {
    const seeded = await hasAnyData();
    setHasData(seeded);
    if (!seeded) {
      setLoaded(true);
      return;
    }
    const today = new Date();
    const [s, hrSeries, sleepSeries, stepsSeries, todayLogs] = await Promise.all([
      daySummary(today),
      dailySeries('restingHR', 14),
      dailySeries('sleep', 14),
      dailySeries('steps', 14),
      manualLogsForDay(today),
    ]);
    setSummary(s);
    setHrSpark(hrSeries.map((r) => r.value));
    setSleepSpark(sleepSeries.map((r) => r.value));
    setStepsSpark(stepsSeries.map((r) => r.value));
    setMoodToday(todayLogs.find((l) => l.category === 'mood')?.value ?? null);

    const r = computeCircadianRisk({
      sleepHoursLast3: sleepSeries.slice(-3).map((x) => x.value),
      restingHRSeries: hrSeries.map((x) => x.value),
      hrvSeries: (await dailySeries('hrv', 14)).map((x) => x.value),
      stepsLast7: stepsSeries.slice(-7).map((x) => x.value),
    });
    setRisk(r);
    setLoaded(true);

    // Daily insight: cache by date so we only call Claude once per day per device.
    const dk = dayKey(today);
    const cached = await db.aiInsights
      .where('kind')
      .equals('daily')
      .and((row) => row.date === dk)
      .first();
    if (cached) {
      setInsight(cached.payload);
      setInsightId(cached.id);
    } else {
      void fetchDailyInsight(s, hrSeries, sleepSeries, stepsSeries, todayLogs, dk);
    }
  }

  async function fetchDailyInsight(s, hrSeries, sleepSeries, stepsSeries, todayLogs, dk) {
    setInsightLoading(true);
    try {
      const restingHRBaseline =
        hrSeries.length >= 4
          ? Math.round(
              hrSeries.slice(0, -1).reduce((sum, x) => sum + x.value, 0) /
                Math.max(1, hrSeries.length - 1)
            )
          : null;
      const hrvSeries = await dailySeries('hrv', 14);
      const hrvBaseline =
        hrvSeries.length >= 4
          ? Math.round(
              hrvSeries.slice(0, -1).reduce((sum, x) => sum + x.value, 0) /
                Math.max(1, hrvSeries.length - 1)
            )
          : null;
      const avgSleep7d =
        sleepSeries.slice(-7).length
          ? (
              sleepSeries.slice(-7).reduce((sum, x) => sum + x.value, 0) /
              sleepSeries.slice(-7).length
            ).toFixed(1)
          : null;
      const avgRestingHR7d =
        hrSeries.slice(-7).length
          ? Math.round(
              hrSeries.slice(-7).reduce((sum, x) => sum + x.value, 0) /
                hrSeries.slice(-7).length
            )
          : null;
      const symptoms = todayLogs
        .filter((l) => l.category === 'symptom')
        .map((l) => l.value);
      const moodVal = todayLogs.find((l) => l.category === 'mood')?.value;

      const profile = await getProfile().catch(() => null);
      const payload = {
        sleepSummary: s.sleep ? `${s.sleep.value.toFixed(1)}h (deep ${(s.sleep.details?.deepHours ?? 0).toFixed(1)}h)` : null,
        restingHR: s.restingHR?.value,
        restingHRBaseline,
        hrv: s.hrv?.value,
        hrvBaseline,
        steps: s.steps,
        activeMinutes: s.activeMinutes,
        mood: moodVal ? moodLabel(moodVal) : null,
        symptoms,
        avgSleep7d,
        avgRestingHR7d,
        focusGoals: profile?.goals ?? [],
      };
      const result = await getDailyInsight(payload);
      setInsight(result);
      const newId = await db.aiInsights.add({
        kind: 'daily',
        date: dk,
        payload: { ...result, dataSnapshot: payload },
        createdAt: new Date().toISOString(),
      });
      setInsightId(newId);
    } finally {
      setInsightLoading(false);
    }
  }

  async function regenerateInsight() {
    if (!summary) return;
    const today = new Date();
    const dk = dayKey(today);
    // Drop cache for today and refetch.
    const existing = await db.aiInsights
      .where('kind').equals('daily')
      .and((r) => r.date === dk)
      .toArray();
    for (const row of existing) await db.aiInsights.delete(row.id);
    setInsight(null);
    setInsightId(null);
    const [hrSeries, sleepSeries, stepsSeries, todayLogs] = await Promise.all([
      dailySeries('restingHR', 14),
      dailySeries('sleep', 14),
      dailySeries('steps', 14),
      manualLogsForDay(today),
    ]);
    void fetchDailyInsight(summary, hrSeries, sleepSeries, stepsSeries, todayLogs, dk);
  }

  useEffect(() => {
    reload();
  }, []);

  // Re-load when modal closes (manual entry may have changed today's data).
  const addModalOpen = useStore((s) => s.addModalOpen);
  useEffect(() => {
    if (!addModalOpen && loaded) reload();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [addModalOpen]);

  const today = new Date().toLocaleDateString(undefined, {
    weekday: 'long',
    month: 'long',
    day: 'numeric',
  });

  return (
    <div className="px-5 pt-12 safe-top">
      <header className="mb-6">
        <p className="text-sm text-textSecondary/60">{today}</p>
        <h1 className="text-3xl font-semibold mt-1">
          {greeting()}
        </h1>
      </header>

      {!hasData && loaded && (
        <Card className="!p-5">
          <p className="text-base font-medium">No data yet.</p>
          <p className="text-sm text-textSecondary/70 mt-2">
            Connect a sample dataset from Profile → Connected Apps to see
            PulseIQ in action.
          </p>
        </Card>
      )}

      {hasData && summary && (
        <>
          {/* Risk + insight side by side on tall phones, stacked on small */}
          <motion.div
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ type: 'spring', stiffness: 250, damping: 28 }}
            className="flex flex-col items-center mb-5"
          >
            <RiskRing score={risk.score} />
            <p className="text-xs text-textSecondary/60 mt-3 text-center max-w-xs">
              Circadian Risk reflects sleep debt, resting HR drift, HRV trend,
              and activity inconsistency.
            </p>
          </motion.div>

          <div className="mb-5">
            <InsightCard
              loading={insightLoading && !insight}
              insight={insight?.insight}
              nudge={insight?.nudge}
              confidence={insight?.confidence}
              error={!!insight?.error}
              onRefresh={regenerateInsight}
              insightId={insightId}
            />
            {insight?.source === 'fallback' && !insight?.error && (
              <p className="text-[10px] text-textSecondary/40 mt-2 text-center">
                Showing fallback insight (Claude unreachable)
              </p>
            )}
            {insight?.source === 'claude' && (
              <button
                onClick={regenerateInsight}
                className="mt-2 text-[11px] text-textSecondary/50 hover:text-textSecondary/80 block mx-auto"
              >
                Regenerate
              </button>
            )}
          </div>

          <div className="grid grid-cols-2 gap-3 mb-5">
            <MetricCard
              icon="heart"
              label="Resting HR"
              value={summary.restingHR?.value ?? '—'}
              unit="bpm"
              caption={`HRV ${summary.hrv?.value ?? '—'} ms`}
              spark={<Spark values={hrSpark} color="#FF375F" />}
            />
            <MetricCard
              icon="sleep"
              label="Sleep"
              value={summary.sleep ? fmtHours(summary.sleep.value) : '—'}
              caption={
                summary.sleep
                  ? `Deep ${fmtHours(summary.sleep.details?.deepHours)}`
                  : 'No record'
              }
              spark={<Spark values={sleepSpark} color="#5E5CE6" />}
            />
            <MetricCard
              icon="activity"
              label="Steps"
              value={fmtNumber(summary.steps)}
              caption={
                summary.activeMinutes
                  ? `${summary.activeMinutes} active min`
                  : null
              }
              spark={<Spark values={stepsSpark} color="#FF9F0A" />}
            />
            <MetricCard
              icon="mental"
              label="Mood"
              value={moodToday ? moodLabel(moodToday).split(' ')[0] : '—'}
              caption={moodToday ? moodLabel(moodToday).slice(2) : 'Tap + to log'}
            />
          </div>

          <Card className="!p-4 mb-5">
            <p className="text-[11px] uppercase tracking-widest text-textSecondary/60">
              Risk contributors
            </p>
            <div className="mt-3 space-y-2">
              {[
                ['Sleep debt', risk.contributors.sleep, '#5E5CE6'],
                ['Resting HR drift', risk.contributors.restingHR, '#FF375F'],
                ['HRV decline', risk.contributors.hrv, '#64D2FF'],
                ['Activity variance', risk.contributors.activity, '#FF9F0A'],
              ].map(([label, val, color]) => (
                <div key={label}>
                  <div className="flex justify-between text-xs">
                    <span className="text-textSecondary/70">{label}</span>
                    <span className="tabular-nums">{val}</span>
                  </div>
                  <div className="h-1.5 mt-1 rounded-full bg-white/5 overflow-hidden">
                    <motion.div
                      className="h-full rounded-full"
                      style={{ background: color }}
                      initial={{ width: 0 }}
                      animate={{ width: `${val}%` }}
                      transition={{ type: 'spring', stiffness: 80, damping: 20 }}
                    />
                  </div>
                </div>
              ))}
            </div>
          </Card>
        </>
      )}

      {/* Floating add-data button */}
      <motion.button
        whileTap={{ scale: 0.9 }}
        onClick={openAddModal}
        aria-label="Add data"
        className="fixed bottom-24 right-5 z-20 h-14 w-14 rounded-full bg-white text-background shadow-card flex items-center justify-center text-2xl font-light"
      >
        +
      </motion.button>
    </div>
  );
}

function greeting() {
  const h = new Date().getHours();
  if (h < 5) return 'Late night';
  if (h < 12) return 'Good morning';
  if (h < 17) return 'Good afternoon';
  if (h < 21) return 'Good evening';
  return 'Good night';
}
