import { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';

export function OfflineBadge() {
  const [online, setOnline] = useState(
    typeof navigator !== 'undefined' ? navigator.onLine : true
  );

  useEffect(() => {
    const update = () => setOnline(navigator.onLine);
    window.addEventListener('online', update);
    window.addEventListener('offline', update);
    return () => {
      window.removeEventListener('online', update);
      window.removeEventListener('offline', update);
    };
  }, []);

  return (
    <AnimatePresence>
      {!online && (
        <motion.div
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: 12 }}
          transition={{ type: 'spring', stiffness: 300, damping: 25 }}
          role="status"
          aria-live="polite"
          className="fixed left-1/2 -translate-x-1/2 bottom-24 z-[55] flex items-center gap-2 bg-elevated/90 backdrop-blur-md border border-warning/30 text-textPrimary text-xs font-medium px-3 py-2 rounded-full shadow-card"
        >
          <span className="w-2 h-2 rounded-full bg-warning" aria-hidden="true" />
          Offline — your data stays here. AI insights resume when you're back.
        </motion.div>
      )}
    </AnimatePresence>
  );
}
