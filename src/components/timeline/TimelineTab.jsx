import { useEffect, useMemo, useState } from 'react';
import { motion } from 'framer-motion';
import { Card } from '../ui/Card';
import { DaySelector } from './DaySelector';
import { UnifiedChart } from './UnifiedChart';
import {
  dailySeries,
  hasAnyData,
  manualLogsForDay,
  daySummary,
} from '../../db/queries';
import { useStore } from '../../store/useStore';
import { fmtHours, fmtNumber, moodLabel } from '../../utils/formatters';

const SIGNALS_DEFAULT = [
  { key: 'sleep', label: 'Sleep', color: '#5E5CE6', enabled: true },
  { key: 'restingHR', label: 'Resting HR', color: '#FF375F', enabled: true },
  { key: 'hrv', label: 'HRV', color: '#64D2FF', enabled: true },
  { key: 'steps', label: 'Steps', color: '#FF9F0A', enabled: true },
];

export function TimelineTab() {
  const selectedDate = useStore((s) => s.selectedDate);
  const setSelectedDate = useStore((s) => s.setSelectedDate);
  const [signals, setSignals] = useState(SIGNALS_DEFAULT);
  const [seriesByType, setSeriesByType] = useState({});
  const [hasData, setHasData] = useState(false);
  const [daySum, setDaySum] = useState(null);
  const [logsForDay, setLogsForDay] = useState([]);

  useEffect(() => {
    (async () => {
      const seeded = await hasAnyData();
      setHasData(seeded);
      if (!seeded) return;
      const [sleep, hr, hrv, steps] = await Promise.all([
        dailySeries('sleep', 14),
        dailySeries('restingHR', 14),
        dailySeries('hrv', 14),
        dailySeries('steps', 14),
      ]);
      setSeriesByType({ sleep, restingHR: hr, hrv, steps });
    })();
  }, []);

  useEffect(() => {
    if (!hasData) return;
    (async () => {
      const d = new Date(selectedDate);
      const [s, logs] = await Promise.all([
        daySummary(d),
        manualLogsForDay(d),
      ]);
      setDaySum(s);
      setLogsForDay(logs);
    })();
  }, [selectedDate, hasData]);

  const enabledCount = useMemo(
    () => signals.filter((s) => s.enabled).length,
    [signals]
  );

  return (
    <div className="px-5 pt-12 safe-top">
      <header className="mb-4">
        <h1 className="text-3xl font-semibold">Timeline</h1>
        <p className="text-sm text-textSecondary/60 mt-1">
          All your signals on one shared time axis.
        </p>
      </header>

      {!hasData && (
        <Card>
          <p className="text-sm text-textSecondary/70">
            Connect a sample dataset from Profile to populate the timeline.
          </p>
        </Card>
      )}

      {hasData && (
        <>
          <DaySelector selected={selectedDate} onSelect={setSelectedDate} />

          <Card className="!p-4 mt-2 mb-4">
            <UnifiedChart seriesByType={seriesByType} signals={signals} days={14} />
            {/* Legend chips */}
            <div className="flex flex-wrap gap-2 mt-3">
              {signals.map((sig) => (
                <motion.button
                  key={sig.key}
                  whileTap={{ scale: 0.95 }}
                  onClick={() =>
                    setSignals((prev) =>
                      prev.map((p) =>
                        p.key === sig.key ? { ...p, enabled: !p.enabled } : p
                      )
                    )
                  }
                  disabled={sig.enabled && enabledCount === 1}
                  className={
                    'flex items-center gap-1.5 px-3 py-1 rounded-full text-xs border transition-colors ' +
                    (sig.enabled
                      ? 'bg-white/10 border-white/15 text-textPrimary'
                      : 'bg-transparent border-white/10 text-textSecondary/50')
                  }
                  style={
                    sig.enabled
                      ? { boxShadow: `inset 0 0 0 1px ${sig.color}40` }
                      : {}
                  }
                >
                  <span
                    className="inline-block w-2 h-2 rounded-full"
                    style={{ background: sig.color }}
                  />
                  {sig.label}
                </motion.button>
              ))}
            </div>
          </Card>

          <h2 className="text-lg font-semibold mb-2">
            {new Date(selectedDate).toLocaleDateString(undefined, {
              weekday: 'long',
              month: 'long',
              day: 'numeric',
            })}
          </h2>

          {daySum && (
            <Card className="!p-4 mb-3">
              <div className="grid grid-cols-2 gap-3 text-sm">
                <DayStat label="Sleep" value={daySum.sleep ? fmtHours(daySum.sleep.value) : '—'} />
                <DayStat label="Resting HR" value={daySum.restingHR ? `${daySum.restingHR.value} bpm` : '—'} />
                <DayStat label="HRV" value={daySum.hrv ? `${daySum.hrv.value} ms` : '—'} />
                <DayStat label="Steps" value={fmtNumber(daySum.steps)} />
              </div>
            </Card>
          )}

          {logsForDay.length > 0 && (
            <Card className="!p-4">
              <p className="text-[11px] uppercase tracking-widest text-textSecondary/60 mb-2">
                Logged this day
              </p>
              <ul className="divide-y divide-white/5">
                {logsForDay.map((log) => (
                  <li key={log.id} className="py-2 flex justify-between text-sm">
                    <span className="text-textSecondary/80">
                      {logLabel(log)}
                    </span>
                    <span className="text-textSecondary/50 text-xs">
                      {new Date(log.timestamp).toLocaleTimeString([], {
                        hour: '2-digit',
                        minute: '2-digit',
                      })}
                    </span>
                  </li>
                ))}
              </ul>
            </Card>
          )}
        </>
      )}
    </div>
  );
}

function DayStat({ label, value }) {
  return (
    <div>
      <p className="text-[10px] uppercase tracking-wider text-textSecondary/50">
        {label}
      </p>
      <p className="text-base font-medium tabular-nums mt-0.5">{value}</p>
    </div>
  );
}

function logLabel(log) {
  if (log.category === 'mood') return `Mood: ${moodLabel(log.value)}`;
  if (log.category === 'symptom')
    return `Symptom: ${log.value}${log.details?.severity ? ` (sev ${log.details.severity})` : ''}`;
  if (log.category === 'bp') return `Blood pressure: ${log.value}`;
  if (log.category === 'weight') return `Weight: ${log.value} ${log.details?.unit || 'kg'}`;
  if (log.category === 'note') return `Note: ${log.value}`;
  return `${log.category}: ${log.value}`;
}
