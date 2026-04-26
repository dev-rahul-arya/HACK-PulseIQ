import { motion } from 'framer-motion';
import { Card } from '../ui/Card';

export function InsightCard({ loading, insight, nudge, confidence, error, onRefresh }) {
  if (loading) {
    return (
      <Card className="!p-5">
        <div className="space-y-3">
          <div className="h-3 w-24 rounded shimmer" />
          <div className="h-4 w-full rounded shimmer" />
          <div className="h-4 w-5/6 rounded shimmer" />
          <div className="h-4 w-3/4 rounded shimmer" />
        </div>
      </Card>
    );
  }

  if (error) {
    return (
      <Card className="!p-5">
        <p className="text-[11px] uppercase tracking-widest text-textSecondary/60">
          Daily Insight
        </p>
        <p className="text-sm mt-2 text-textSecondary/70">
          Couldn't reach Claude right now. Showing a generic note.
        </p>
        <p className="text-base mt-3">{insight}</p>
        {onRefresh && (
          <button
            onClick={onRefresh}
            className="mt-3 text-xs text-accent-mental hover:opacity-80"
          >
            Try again
          </button>
        )}
      </Card>
    );
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ type: 'spring', stiffness: 250, damping: 28 }}
    >
      <Card className="!p-5">
        <div className="flex items-center justify-between">
          <p className="text-[11px] uppercase tracking-widest text-accent-mental">
            Daily Insight
          </p>
          {confidence != null && (
            <span className="text-[10px] text-textSecondary/50">
              confidence {confidence}/5
            </span>
          )}
        </div>
        <p className="text-base mt-3 leading-relaxed">{insight}</p>
        {nudge && (
          <div className="mt-4 pt-4 border-t border-white/5">
            <p className="text-[11px] uppercase tracking-widest text-accent-recovery">
              Nudge
            </p>
            <p className="text-sm mt-2 text-textSecondary/85">{nudge}</p>
          </div>
        )}
        <p className="text-[10px] text-textSecondary/40 mt-4">
          Educational, not a diagnosis. Talk to a clinician about anything that worries you.
        </p>
      </Card>
    </motion.div>
  );
}
