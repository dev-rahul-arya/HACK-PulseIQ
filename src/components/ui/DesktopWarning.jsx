import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';

const STORAGE_KEY = 'pulseiq_desktop_warning_dismissed';
const DESKTOP_BREAKPOINT = 768;

export function DesktopWarning() {
  const [isDesktop, setIsDesktop] = useState(false);
  const [show, setShow] = useState(false);

  useEffect(() => {
    const update = () => {
      const desktop = window.innerWidth > DESKTOP_BREAKPOINT;
      setIsDesktop(desktop);
      if (desktop && localStorage.getItem(STORAGE_KEY) !== 'true') {
        setShow(true);
      }
    };
    update();
    window.addEventListener('resize', update);
    return () => window.removeEventListener('resize', update);
  }, []);

  const dismiss = () => {
    localStorage.setItem(STORAGE_KEY, 'true');
    setShow(false);
  };

  return (
    <AnimatePresence>
      {isDesktop && show && (
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -20 }}
          transition={{ type: 'spring', stiffness: 300, damping: 25 }}
          role="alert"
          className="fixed top-4 left-4 right-4 z-[60] max-w-lg mx-auto bg-surface border border-warning/30 shadow-card rounded-2xl p-4 flex justify-between items-center"
        >
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-full bg-warning/10 flex items-center justify-center shrink-0" aria-hidden="true">
              <span className="text-warning text-sm">⚠️</span>
            </div>
            <p className="text-xs text-textSecondary font-medium leading-snug">
              PulseIQ is a mobile-first PWA. For the intended experience, view on a mobile device or install it.
            </p>
          </div>
          <button
            onClick={dismiss}
            className="text-textSecondary/60 hover:text-textPrimary ml-3 p-2 rounded-full hover:bg-white/5 transition-colors shrink-0"
            aria-label="Dismiss desktop warning"
          >
            <svg width="14" height="14" viewBox="0 0 14 14" fill="none" xmlns="http://www.w3.org/2000/svg" aria-hidden="true">
              <path d="M1 1L13 13M1 13L13 1" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
            </svg>
          </button>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
