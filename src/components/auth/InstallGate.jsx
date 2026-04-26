import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { supabase } from '../../services/supabase';

const DESKTOP_BREAKPOINT = 768;
const BYPASS_KEY = 'pulseiq_install_bypass';

export function shouldGateInstall() {
  if (typeof window === 'undefined') return false;
  const params = new URLSearchParams(window.location.search);
  if (params.get('bypass') === 'install') {
    localStorage.setItem(BYPASS_KEY, 'true');
  }
  if (localStorage.getItem(BYPASS_KEY) === 'true') return false;

  const isStandalone =
    window.matchMedia('(display-mode: standalone)').matches || window.navigator.standalone;
  if (isStandalone) return false;

  // Desktop already gets the warning banner; don't block them out entirely.
  if (window.innerWidth > DESKTOP_BREAKPOINT) return false;

  return true;
}

function detectPlatform() {
  const ua = navigator.userAgent || '';
  if (/iPhone|iPad|iPod/i.test(ua)) return 'ios';
  if (/Android/i.test(ua)) return 'android';
  return 'other';
}

export function InstallGate() {
  const [deferredPrompt, setDeferredPrompt] = useState(null);
  const [installing, setInstalling] = useState(false);
  const platform = detectPlatform();

  useEffect(() => {
    const handler = (e) => {
      e.preventDefault();
      setDeferredPrompt(e);
    };
    window.addEventListener('beforeinstallprompt', handler);
    return () => window.removeEventListener('beforeinstallprompt', handler);
  }, []);

  const handleInstall = async () => {
    if (!deferredPrompt) return;
    setInstalling(true);
    deferredPrompt.prompt();
    await deferredPrompt.userChoice;
    setDeferredPrompt(null);
    setInstalling(false);
  };

  const handleSignOut = async () => {
    await supabase.auth.signOut();
  };

  return (
    <main
      role="main"
      className="min-h-screen bg-background text-textPrimary flex flex-col items-center justify-center px-6 py-10 font-sans"
    >
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ type: 'spring', damping: 22, stiffness: 200 }}
        className="w-full max-w-md"
      >
        <div className="flex items-center gap-3 mb-8 justify-center">
          <div className="w-8 h-8 rounded-full border-[3px] border-accent-sleep opacity-90" />
          <span className="font-semibold tracking-tight text-xl">
            Pulse<span className="text-accent-sleep">IQ</span>
          </span>
        </div>

        <h1 className="text-3xl font-bold tracking-tight text-center mb-3">
          Install PulseIQ to continue
        </h1>
        <p className="text-textSecondary/80 text-center mb-8 leading-relaxed">
          PulseIQ is a mobile-first app. Add it to your home screen for offline access, faster
          load, and the right experience.
        </p>

        {platform === 'android' && deferredPrompt && (
          <button
            onClick={handleInstall}
            disabled={installing}
            className="w-full bg-white text-background font-semibold py-4 rounded-2xl mb-4 shadow-glow active:scale-[0.98] transition-transform disabled:opacity-60"
          >
            {installing ? 'Installing…' : 'Install app'}
          </button>
        )}

        <div className="bg-surface border border-white/5 rounded-2xl p-5 mb-4">
          <p className="text-sm font-semibold mb-3 text-textPrimary">
            {platform === 'ios' ? 'On iPhone / iPad' : 'On your phone'}
          </p>
          <ol className="space-y-3 text-sm text-textSecondary leading-relaxed list-decimal list-inside">
            {platform === 'ios' ? (
              <>
                <li>
                  Tap the <span className="font-semibold text-textPrimary">Share</span> button in
                  Safari (the square with the up arrow).
                </li>
                <li>
                  Scroll down and choose{' '}
                  <span className="font-semibold text-textPrimary">Add to Home Screen</span>.
                </li>
                <li>Confirm, then open PulseIQ from your home screen.</li>
              </>
            ) : platform === 'android' ? (
              <>
                <li>
                  Open the browser menu (
                  <span className="font-semibold text-textPrimary">⋮</span>) in Chrome.
                </li>
                <li>
                  Tap <span className="font-semibold text-textPrimary">Install app</span> or{' '}
                  <span className="font-semibold text-textPrimary">Add to home screen</span>.
                </li>
                <li>Open PulseIQ from your home screen.</li>
              </>
            ) : (
              <>
                <li>Open this page on your phone.</li>
                <li>
                  Use your browser's <span className="font-semibold text-textPrimary">Share</span>{' '}
                  or <span className="font-semibold text-textPrimary">Menu</span> to install.
                </li>
                <li>Launch PulseIQ from your home screen.</li>
              </>
            )}
          </ol>
        </div>

        <button
          onClick={handleSignOut}
          className="w-full text-xs text-textSecondary/60 hover:text-textSecondary py-3"
        >
          Sign out
        </button>

        <p className="text-[10px] text-textSecondary/40 text-center mt-6 leading-relaxed">
          Already installed? Open PulseIQ from your home screen, not your browser.
        </p>
      </motion.div>
    </main>
  );
}
