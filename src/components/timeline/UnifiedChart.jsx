import { useMemo } from 'react';
import {
  ResponsiveContainer,
  LineChart,
  Line,
  Tooltip,
  CartesianGrid,
  XAxis,
  YAxis,
  ReferenceLine,
} from 'recharts';

// Normalize each series independently so they can share an axis.
// We pass through the raw value too so the tooltip can show real numbers.
function normalize(rawByType) {
  const ranges = {};
  for (const [type, points] of Object.entries(rawByType)) {
    if (!points.length) continue;
    const vals = points.map((p) => p.value);
    ranges[type] = { min: Math.min(...vals), max: Math.max(...vals) };
  }
  return ranges;
}

export function UnifiedChart({ seriesByType, signals, days = 14 }) {
  // Build a single rows array indexed by day (oldest → newest).
  const { rows, ranges } = useMemo(() => {
    const ranges = normalize(seriesByType);
    const dayMap = new Map();
    for (const [type, points] of Object.entries(seriesByType)) {
      for (const p of points) {
        if (!dayMap.has(p.dayKey)) {
          dayMap.set(p.dayKey, { dayKey: p.dayKey });
        }
        const row = dayMap.get(p.dayKey);
        row[`${type}_raw`] = p.value;
        const r = ranges[type];
        if (r && r.max > r.min) {
          row[type] = ((p.value - r.min) / (r.max - r.min)) * 100;
        } else if (r) {
          row[type] = 50;
        }
      }
    }
    const rows = [...dayMap.values()].sort((a, b) =>
      a.dayKey < b.dayKey ? -1 : 1
    );
    return { rows: rows.slice(-days), ranges };
  }, [seriesByType, days]);

  if (!rows.length) {
    return (
      <div className="h-64 flex items-center justify-center text-sm text-textSecondary/60">
        No data for this period.
      </div>
    );
  }

  return (
    <div className="h-72 -mx-2">
      <ResponsiveContainer width="100%" height="100%">
        <LineChart data={rows} margin={{ top: 10, right: 12, left: 0, bottom: 0 }}>
          <CartesianGrid stroke="rgba(255,255,255,0.05)" vertical={false} />
          <XAxis
            dataKey="dayKey"
            tick={{ fill: '#7A7A82', fontSize: 10 }}
            tickFormatter={(k) => k.slice(5)}
            tickLine={false}
            axisLine={{ stroke: 'rgba(255,255,255,0.08)' }}
            interval="preserveStartEnd"
            minTickGap={20}
          />
          <YAxis hide domain={[0, 100]} />
          <Tooltip
            cursor={{ stroke: 'rgba(255,255,255,0.12)', strokeWidth: 1 }}
            content={<UnifiedTooltip signals={signals} ranges={ranges} />}
          />
          {signals
            .filter((sig) => sig.enabled)
            .map((sig) => (
              <Line
                key={sig.key}
                type="monotone"
                dataKey={sig.key}
                stroke={sig.color}
                strokeWidth={2}
                dot={false}
                activeDot={{ r: 4, fill: sig.color, stroke: '#0D0D0D', strokeWidth: 2 }}
                isAnimationActive={true}
                animationDuration={500}
              />
            ))}
          <ReferenceLine y={0} stroke="rgba(255,255,255,0.05)" />
        </LineChart>
      </ResponsiveContainer>
    </div>
  );
}

function UnifiedTooltip({ active, payload, label, signals, ranges }) {
  if (!active || !payload?.length) return null;
  const row = payload[0].payload;
  return (
    <div className="bg-elevated/95 backdrop-blur-md border border-white/10 rounded-xl px-3 py-2 shadow-card text-xs min-w-[160px]">
      <div className="font-medium text-textPrimary mb-1.5">{label}</div>
      <div className="space-y-1">
        {signals
          .filter((sig) => sig.enabled && row[`${sig.key}_raw`] != null)
          .map((sig) => (
            <div key={sig.key} className="flex items-center justify-between gap-3">
              <span className="flex items-center gap-1.5">
                <span
                  className="inline-block w-2 h-2 rounded-full"
                  style={{ background: sig.color }}
                />
                <span className="text-textSecondary/80">{sig.label}</span>
              </span>
              <span className="tabular-nums text-textPrimary">
                {formatRaw(sig.key, row[`${sig.key}_raw`])}
              </span>
            </div>
          ))}
      </div>
    </div>
  );
}

function formatRaw(key, v) {
  if (v == null) return '—';
  if (key === 'sleep') return `${v.toFixed(1)} h`;
  if (key === 'restingHR') return `${Math.round(v)} bpm`;
  if (key === 'hrv') return `${Math.round(v)} ms`;
  if (key === 'steps') return v.toLocaleString();
  return String(v);
}
