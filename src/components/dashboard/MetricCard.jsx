import { Card } from '../ui/Card';

const ACCENT = {
  heart: 'text-accent-heart',
  sleep: 'text-accent-sleep',
  activity: 'text-accent-activity',
  recovery: 'text-accent-recovery',
  mental: 'text-accent-mental',
};

export function MetricCard({
  icon = 'heart',
  label,
  value,
  unit,
  caption,
  spark,
  onClick,
}) {
  return (
    <Card interactive={!!onClick} onClick={onClick} className="!p-4">
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0 flex-1">
          <p className={'text-[11px] uppercase tracking-widest font-medium ' + (ACCENT[icon] || '')}>
            {label}
          </p>
          <div className="mt-2 flex items-baseline gap-1">
            <span className="text-3xl font-semibold tabular-nums">
              {value ?? '—'}
            </span>
            {unit && (
              <span className="text-sm text-textSecondary/60">{unit}</span>
            )}
          </div>
          {caption && (
            <p className="text-xs text-textSecondary/50 mt-1 truncate">{caption}</p>
          )}
        </div>
        {spark && (
          <div className="shrink-0 opacity-90" aria-hidden="true">
            {spark}
          </div>
        )}
      </div>
    </Card>
  );
}

// Tiny inline sparkline (no Recharts dep needed for the small one).
export function Spark({ values = [], width = 64, height = 28, color = '#FFFFFF' }) {
  if (!values.length) return null;
  const min = Math.min(...values);
  const max = Math.max(...values);
  const range = max - min || 1;
  const stepX = width / Math.max(1, values.length - 1);
  const points = values
    .map((v, i) => `${i * stepX},${height - ((v - min) / range) * height}`)
    .join(' ');
  return (
    <svg width={width} height={height} className="overflow-visible" aria-hidden="true">
      <polyline
        points={points}
        fill="none"
        stroke={color}
        strokeWidth="1.6"
        strokeLinecap="round"
        strokeLinejoin="round"
        opacity="0.85"
      />
    </svg>
  );
}
