import { useEffect, useMemo, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { LEARNING_MODULES, pickRelevantModules } from '../../data/learningModules';

export function LearningStrip({ snapshot }) {
  const ordered = useMemo(() => pickRelevantModules(snapshot), [snapshot]);
  const [activeId, setActiveId] = useState(null);
  const active = activeId ? LEARNING_MODULES.find((m) => m.id === activeId) : null;

  useEffect(() => {
    if (!active) return;
    const onKey = (e) => {
      if (e.key === 'Escape') setActiveId(null);
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [active]);

  return (
    <section className="mb-5" aria-labelledby="learn-heading">
      <div className="flex items-baseline justify-between mb-3">
        <h2
          id="learn-heading"
          className="text-[11px] uppercase tracking-widest text-textSecondary/60"
        >
          Learn
        </h2>
        <p className="text-[10px] text-textSecondary/40">
          Personalized for today's signals
        </p>
      </div>

      <div
        className="-mx-5 px-5 flex gap-3 overflow-x-auto snap-x snap-mandatory"
        role="list"
      >
        {ordered.map((m, i) => (
          <motion.button
            key={m.id}
            type="button"
            onClick={() => setActiveId(m.id)}
            whileTap={{ scale: 0.97 }}
            initial={{ opacity: 0, y: 6 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: i * 0.04 }}
            className="snap-start shrink-0 w-64 text-left bg-surface rounded-2xl p-4 shadow-card border border-white/5 focus-visible:ring-2 focus-visible:ring-accent-mental/60 outline-none"
            role="listitem"
            aria-label={`Read article: ${m.title}`}
          >
            <div className="flex items-center justify-between mb-3">
              <span
                className="text-[10px] uppercase tracking-widest font-medium px-2 py-0.5 rounded-full"
                style={{ color: m.accent, background: `${m.accent}1A` }}
              >
                {m.category}
              </span>
              <span className="text-[10px] text-textSecondary/40">
                {m.readMinutes} min read
              </span>
            </div>
            <p className="text-sm font-semibold leading-tight text-textPrimary">
              {m.title}
            </p>
            <p className="text-xs text-textSecondary/70 leading-relaxed mt-2">
              {m.blurb}
            </p>
            <p className="text-[11px] text-textSecondary/40 mt-3">Read article →</p>
          </motion.button>
        ))}
      </div>

      <AnimatePresence>
        {active && (
          <ArticleSheet
            key={active.id}
            module={active}
            onClose={() => setActiveId(null)}
          />
        )}
      </AnimatePresence>
    </section>
  );
}

function ArticleSheet({ module: m, onClose }) {
  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 z-40 bg-black/70 backdrop-blur-sm flex items-end justify-center"
      onClick={onClose}
      role="dialog"
      aria-modal="true"
      aria-labelledby={`article-${m.id}-title`}
    >
      <motion.article
        initial={{ y: '100%' }}
        animate={{ y: 0 }}
        exit={{ y: '100%' }}
        transition={{ type: 'spring', stiffness: 260, damping: 30 }}
        className="w-full max-w-lg bg-surface rounded-t-3xl border-t border-white/5 max-h-[88vh] overflow-y-auto pb-10"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="sticky top-0 bg-surface/95 backdrop-blur-xl px-5 pt-4 pb-3 border-b border-white/5 flex items-center justify-between gap-3">
          <span
            className="text-[10px] uppercase tracking-widest font-medium px-2 py-0.5 rounded-full"
            style={{ color: m.accent, background: `${m.accent}1A` }}
          >
            {m.category}
          </span>
          <button
            type="button"
            onClick={onClose}
            aria-label="Close article"
            className="text-textSecondary/60 hover:text-textPrimary text-xl leading-none w-8 h-8 flex items-center justify-center rounded-full focus-visible:ring-2 focus-visible:ring-accent-mental/60 outline-none"
          >
            ×
          </button>
        </div>

        <div className="px-5 pt-5">
          <h3
            id={`article-${m.id}-title`}
            className="text-2xl font-semibold leading-tight"
          >
            {m.title}
          </h3>
          <p className="text-xs text-textSecondary/50 mt-2">
            {m.readMinutes} min read · PulseIQ Learn
          </p>
          <div className="mt-5 space-y-4">
            {m.body.map((para, i) => (
              <p
                key={i}
                className="text-sm leading-relaxed text-textSecondary/85"
              >
                {para}
              </p>
            ))}
          </div>
          <p className="text-[10px] text-textSecondary/40 mt-6 leading-relaxed">
            Educational content. Not a substitute for medical advice — talk to
            a clinician about anything that concerns you.
          </p>
        </div>
      </motion.article>
    </motion.div>
  );
}
