import { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { recordInsightFeedback, getInsightFeedback } from '../../services/feedback';

export function FeedbackButtons({ insightId, compact = false }) {
  const [rating, setRating] = useState(null);
  const [loaded, setLoaded] = useState(false);

  useEffect(() => {
    let cancelled = false;
    if (!insightId) {
      setLoaded(true);
      return;
    }
    getInsightFeedback(insightId).then((fb) => {
      if (cancelled) return;
      setRating(fb?.rating ?? null);
      setLoaded(true);
    });
    return () => {
      cancelled = true;
    };
  }, [insightId]);

  async function vote(r, e) {
    e?.stopPropagation();
    if (!insightId) return;
    setRating(r);
    await recordInsightFeedback(insightId, r);
  }

  if (!insightId || !loaded) return null;

  const sizeBtn = compact ? 'h-7 px-2 text-[11px]' : 'h-8 px-3 text-xs';
  const sizeText = compact ? 'text-[10px]' : 'text-[11px]';

  return (
    <div className="mt-3 pt-3 border-t border-white/5 flex items-center justify-between">
      <span className={`${sizeText} text-textSecondary/50`}>Was this helpful?</span>
      <AnimatePresence mode="wait">
        {rating ? (
          <motion.span
            key="thanks"
            initial={{ opacity: 0, y: 4 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0 }}
            className={`${sizeText} text-textSecondary/70`}
          >
            {rating === 'up' ? 'Thanks — noted.' : 'Thanks — we’ll improve this.'}
          </motion.span>
        ) : (
          <motion.div
            key="buttons"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="flex gap-2"
          >
            <button
              type="button"
              onClick={(e) => vote('up', e)}
              aria-label="Helpful"
              className={`${sizeBtn} rounded-full bg-white/5 hover:bg-success/15 text-textSecondary hover:text-success transition-colors`}
            >
              👍 Helpful
            </button>
            <button
              type="button"
              onClick={(e) => vote('down', e)}
              aria-label="Not helpful"
              className={`${sizeBtn} rounded-full bg-white/5 hover:bg-danger/15 text-textSecondary hover:text-danger transition-colors`}
            >
              👎 Not for me
            </button>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
