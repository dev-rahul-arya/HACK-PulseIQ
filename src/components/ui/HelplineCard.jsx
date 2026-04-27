import { useState } from 'react';
import { Card } from './Card';
import { HelplineSheet } from './HelplineSheet';
import { HELPLINES, KIND_COLOR, KIND_LABEL } from '../../data/helplines';

export function HelplineCard() {
  const [open, setOpen] = useState(false);
  const top3 = HELPLINES.slice(0, 3);

  return (
    <>
      <Card className="!p-5 mb-4">
        <p className="text-[11px] uppercase tracking-widest text-accent-recovery">
          Talk to someone
        </p>
        <p className="text-sm text-textSecondary/80 mt-2 leading-relaxed">
          PulseIQ doesn't diagnose. If anything feels off — physically or
          mentally — these are free helplines staffed by trained people.
        </p>

        <ul className="mt-4 space-y-2">
          {top3.map((h) => (
            <li
              key={h.id}
              className="flex items-center justify-between gap-3 bg-elevated/40 border border-white/5 rounded-xl px-3 py-2"
            >
              <div className="min-w-0">
                <div className="flex items-center gap-2">
                  <span
                    className="text-[9px] uppercase tracking-widest font-medium px-1.5 py-0.5 rounded-full"
                    style={{
                      color: KIND_COLOR[h.kind],
                      background: `${KIND_COLOR[h.kind]}1A`,
                    }}
                  >
                    {KIND_LABEL[h.kind]}
                  </span>
                </div>
                <p className="text-sm font-medium truncate mt-1">{h.name}</p>
              </div>
              <a
                href={`tel:${h.tel}`}
                className="shrink-0 text-sm font-medium tabular-nums px-3 py-1.5 rounded-lg bg-white/10 hover:bg-white/15 text-textPrimary focus-visible:ring-2 focus-visible:ring-accent-mental/60 outline-none"
                aria-label={`Call ${h.name} at ${h.number}`}
              >
                {h.number}
              </a>
            </li>
          ))}
        </ul>

        <button
          type="button"
          onClick={() => setOpen(true)}
          className="text-xs text-accent-mental mt-3 hover:underline focus-visible:ring-2 focus-visible:ring-accent-mental/60 outline-none rounded"
        >
          See all helplines →
        </button>
      </Card>
      <HelplineSheet open={open} onClose={() => setOpen(false)} />
    </>
  );
}
