import { motion } from 'framer-motion';
import { dayKey } from '../../db/db';

export function DaySelector({ selected, onSelect, days = 14 }) {
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const items = [];
  for (let i = days - 1; i >= 0; i--) {
    const d = new Date(today);
    d.setDate(d.getDate() - i);
    items.push(d);
  }
  return (
    <div className="-mx-5 px-5 overflow-x-auto">
      <div className="flex gap-2 min-w-max pb-2">
        {items.map((d) => {
          const k = dayKey(d);
          const active = selected === k;
          const label = d.toLocaleDateString(undefined, { weekday: 'short' });
          const num = d.getDate();
          const fullLabel = d.toLocaleDateString(undefined, {
            weekday: 'long',
            month: 'long',
            day: 'numeric',
          });
          return (
            <motion.button
              key={k}
              type="button"
              whileTap={{ scale: 0.95 }}
              onClick={() => onSelect(k)}
              aria-label={fullLabel}
              aria-pressed={active}
              className={
                'flex flex-col items-center justify-center w-12 h-16 rounded-2xl border transition-colors ' +
                (active
                  ? 'bg-white text-background border-white'
                  : 'bg-surface text-textPrimary border-white/5')
              }
            >
              <span className="text-[10px] uppercase tracking-wider opacity-70" aria-hidden="true">
                {label}
              </span>
              <span className="text-lg font-semibold tabular-nums mt-0.5" aria-hidden="true">
                {num}
              </span>
            </motion.button>
          );
        })}
      </div>
    </div>
  );
}
