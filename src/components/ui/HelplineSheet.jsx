import { useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { HELPLINES, KIND_LABEL, KIND_COLOR } from '../../data/helplines';

export function HelplineSheet({ open, onClose, leadingMessage }) {
  useEffect(() => {
    if (!open) return;
    const onKey = (e) => {
      if (e.key === 'Escape') onClose();
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [open, onClose]);

  return (
    <AnimatePresence>
      {open && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 z-50 bg-black/70 backdrop-blur-sm flex items-end justify-center"
          onClick={onClose}
          role="dialog"
          aria-modal="true"
          aria-labelledby="helpline-sheet-title"
        >
          <motion.div
            initial={{ y: '100%' }}
            animate={{ y: 0 }}
            exit={{ y: '100%' }}
            transition={{ type: 'spring', stiffness: 280, damping: 30 }}
            className="w-full max-w-lg bg-surface rounded-t-3xl border-t border-white/5 max-h-[88vh] overflow-y-auto pb-8 safe-bottom"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex justify-center pt-3">
              <div className="h-1 w-10 rounded-full bg-white/15" />
            </div>
            <div className="px-5 pt-4">
              <h2
                id="helpline-sheet-title"
                className="text-xl font-semibold leading-tight"
              >
                Talk to someone
              </h2>
              <p className="text-sm text-textSecondary/70 mt-1.5 leading-relaxed">
                {leadingMessage ||
                  'Free helplines staffed by trained people. PulseIQ is not a clinical tool — if anything feels off, talk to a human.'}
              </p>

              <ul className="mt-5 space-y-2">
                {HELPLINES.map((h) => (
                  <li
                    key={h.id}
                    className="bg-elevated/40 border border-white/5 rounded-xl p-3"
                  >
                    <div className="flex items-start justify-between gap-3">
                      <div className="min-w-0">
                        <div className="flex items-center gap-2 mb-1">
                          <span
                            className="text-[10px] uppercase tracking-widest font-medium px-1.5 py-0.5 rounded-full"
                            style={{
                              color: KIND_COLOR[h.kind],
                              background: `${KIND_COLOR[h.kind]}1A`,
                            }}
                          >
                            {KIND_LABEL[h.kind]}
                          </span>
                          <span className="text-[10px] text-textSecondary/50">
                            {h.hours}
                          </span>
                        </div>
                        <p className="text-sm font-medium truncate">{h.name}</p>
                        <p className="text-[11px] text-textSecondary/60 mt-0.5 leading-relaxed">
                          {h.note}
                        </p>
                      </div>
                      <a
                        href={`tel:${h.tel}`}
                        className="shrink-0 px-3 py-2 rounded-xl bg-white text-background text-sm font-medium tabular-nums focus-visible:ring-2 focus-visible:ring-accent-mental/60 outline-none"
                        aria-label={`Call ${h.name} at ${h.number}`}
                      >
                        {h.number}
                      </a>
                    </div>
                  </li>
                ))}
              </ul>

              <p className="text-[10px] text-textSecondary/40 mt-5 leading-relaxed">
                Numbers are India-region. If you're outside India, dial your
                local emergency number — most countries also have a national
                mental-health line listed at iasp.info/resources/Crisis_Centres.
              </p>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
