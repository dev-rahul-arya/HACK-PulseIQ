import { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import { Card } from '../ui/Card';
import { dailySeries } from '../../db/queries';
import { fmtHours, fmtNumber } from '../../utils/formatters';
import { buildWeeklyReport } from '../../utils/weeklyReport';

export function WeeklyReport() {
  const [report, setReport] = useState(null);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      const [sleep, hr, hrv, steps] = await Promise.all([
        dailySeries('sleep', 14),
        dailySeries('restingHR', 14),
        dailySeries('hrv', 14),
        dailySeries('steps', 14),
      ]);
      if (cancelled) return;
      setReport(buildWeeklyReport({ sleep, hr, hrv, steps }));
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  if (!report) {
    return (
      <Card className="!p-5 mb-4">
        <div className="h-3 w-32 rounded shimmer mb-4" />
        <div className="grid grid-cols-2 gap-3">
          <div className="h-16 rounded-xl shimmer" />
          <div className="h-16 rounded-xl shimmer" />
          <div className="h-16 rounded-xl shimmer" />
          <div className="h-16 rounded-xl shimmer" />
        </div>
      </Card>
    );
  }

  if (report.empty) {
    return (
      <Card className="!p-5 mb-4">
        <p className="text-[11px] uppercase tracking-widest text-accent-recovery">
          Weekly health report
        </p>
        <p className="text-sm text-textSecondary/70 mt-2">
          Not enough data yet — connect a sample dataset to populate the
          weekly report.
        </p>
      </Card>
    );
  }

  return (
    <Card className="!p-5 mb-4">
      <div className="flex items-baseline justify-between mb-1">
        <p className="text-[11px] uppercase tracking-widest text-accent-recovery">
          Weekly health report
        </p>
        <p className="text-[10px] text-textSecondary/40">{report.range}</p>
      </div>
      <p className="text-xs text-textSecondary/60 mb-4">
        Last 7 days vs. the 7 before that.
      </p>

      <div className="grid grid-cols-2 gap-3">
        <Stat
          label="Avg sleep"
          value={report.stats.sleep.value != null ? fmtHours(report.stats.sleep.value) : '—'}
          delta={report.stats.sleep.delta}
          deltaUnit="h"
          color="#5E5CE6"
          higherIsBetter
        />
        <Stat
          label="Avg RHR"
          value={report.stats.restingHR.value != null ? `${Math.round(report.stats.restingHR.value)} bpm` : '—'}
          delta={report.stats.restingHR.delta}
          deltaUnit="bpm"
          color="#FF375F"
          higherIsBetter={false}
        />
        <Stat
          label="Avg HRV"
          value={report.stats.hrv.value != null ? `${Math.round(report.stats.hrv.value)} ms` : '—'}
          delta={report.stats.hrv.delta}
          deltaUnit="ms"
          color="#64D2FF"
          higherIsBetter
        />
        <Stat
          label="Total steps"
          value={fmtNumber(report.stats.steps.total)}
          delta={report.stats.steps.delta}
          deltaUnit=""
          color="#FF9F0A"
          higherIsBetter
          isPercent
        />
      </div>

      {report.charts.sleep.length > 0 && (
        <div className="mt-5">
          <p className="text-[10px] uppercase tracking-widest text-textSecondary/50 mb-2">
            Sleep this week
          </p>
          <DayBars
            values={report.charts.sleep}
            color="#5E5CE6"
            target={7.5}
            unit="h"
          />
        </div>
      )}

      {report.charts.steps.length > 0 && (
        <div className="mt-4">
          <p className="text-[10px] uppercase tracking-widest text-textSecondary/50 mb-2">
            Steps this week
          </p>
          <DayBars values={report.charts.steps} color="#FF9F0A" target={8000} unit="" />
        </div>
      )}

      {report.highlights.length > 0 && (
        <div className="mt-5 pt-4 border-t border-white/5">
          <p className="text-[10px] uppercase tracking-widest text-textSecondary/50 mb-2">
            Highlights
          </p>
          <ul className="space-y-2">
            {report.highlights.map((h, i) => (
              <li key={i} className="flex gap-2 text-xs text-textSecondary/80 leading-relaxed">
                <span aria-hidden="true" style={{ color: h.color }}>•</span>
                <span>{h.text}</span>
              </li>
            ))}
          </ul>
        </div>
      )}
    </Card>
  );
}

function Stat({ label, value, delta, deltaUnit, color, higherIsBetter, isPercent }) {
  const hasDelta = delta != null && Number.isFinite(delta);
  let goodDir = null;
  if (hasDelta) {
    const positive = delta > 0;
    goodDir = (positive && higherIsBetter) || (!positive && !higherIsBetter);
  }
  const arrow = !hasDelta ? '' : delta > 0 ? '↑' : delta < 0 ? '↓' : '·';
  const deltaClass = !hasDelta
    ? 'text-textSecondary/40'
    : goodDir
    ? 'text-accent-recovery'
    : 'text-accent-heart';

  return (
    <div className="bg-white/[0.03] rounded-xl p-3 border border-white/5">
      <div className="flex items-center gap-2">
        <span className="h-1.5 w-1.5 rounded-full" style={{ background: color }} />
        <p className="text-[10px] uppercase tracking-widest text-textSecondary/60">
          {label}
        </p>
      </div>
      <p className="text-lg font-semibold mt-1 tabular-nums">{value}</p>
      <p className={`text-[10px] tabular-nums mt-0.5 ${deltaClass}`}>
        {hasDelta
          ? `${arrow} ${Math.abs(isPercent ? Math.round(delta) : Number(delta.toFixed(deltaUnit === 'bpm' ? 0 : 1)))}${
              isPercent ? '%' : deltaUnit ? ` ${deltaUnit}` : ''
            } vs. prior week`
          : 'No prior-week comparison'}
      </p>
    </div>
  );
}

function DayBars({ values, color, target, unit }) {
  const max = Math.max(...values, target ?? 0) * 1.05 || 1;
  const labels = lastSevenDayLabels();
  return (
    <div className="flex items-end gap-1.5 h-20">
      {values.map((v, i) => {
        const h = max > 0 ? Math.max(2, (v / max) * 100) : 0;
        return (
          <div key={i} className="flex-1 flex flex-col items-center gap-1 h-full">
            <div className="flex-1 w-full flex items-end relative">
              {target != null && (
                <div
                  aria-hidden="true"
                  className="absolute left-0 right-0 border-t border-dashed border-white/10"
                  style={{ bottom: `${(target / max) * 100}%` }}
                />
              )}
              <motion.div
                initial={{ height: 0 }}
                animate={{ height: `${h}%` }}
                transition={{ delay: i * 0.04, type: 'spring', stiffness: 120, damping: 18 }}
                className="w-full rounded-md"
                style={{ background: color, opacity: v ? 0.85 : 0.15 }}
                title={`${v}${unit}`}
              />
            </div>
            <span className="text-[9px] text-textSecondary/50">{labels[i]}</span>
          </div>
        );
      })}
    </div>
  );
}

function lastSevenDayLabels() {
  const days = ['S', 'M', 'T', 'W', 'T', 'F', 'S'];
  const out = [];
  const today = new Date();
  for (let i = 6; i >= 0; i--) {
    const d = new Date(today);
    d.setDate(d.getDate() - i);
    out.push(days[d.getDay()]);
  }
  return out;
}

