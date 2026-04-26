import { useState, useEffect } from 'react';
import { Shell } from './components/layout/Shell';
import { LandingPage } from './components/landing/LandingPage';
import { Login } from './components/auth/Login';
import { Onboarding } from './components/auth/Onboarding';
import { useStore } from './store/useStore';
import { supabase } from './services/supabase';
import { getProfile } from './services/profile';

const getInitialShowLanding = () => {
  if (typeof window !== 'undefined') {
    const isStandalone = window.matchMedia('(display-mode: standalone)').matches || window.navigator.standalone;
    if (isStandalone) return false;
    
    const storedPref = localStorage.getItem('pulseiq_has_seen_landing');
    if (storedPref) return false;
  }
  return true;
};

export default function App() {
  const [showLanding, setShowLanding] = useState(getInitialShowLanding);
  const [isInitializing, setIsInitializing] = useState(true);
  const isAuthenticated = useStore((s) => s.isAuthenticated);
  const setIsAuthenticated = useStore((s) => s.setIsAuthenticated);
  const hasCompletedOnboarding = useStore((s) => s.hasCompletedOnboarding);
  const setHasCompletedOnboarding = useStore((s) => s.setHasCompletedOnboarding);

  useEffect(() => {
    // Initialize Supabase Auth state
    supabase.auth.getSession().then(({ data: { session } }) => {
      setIsAuthenticated(!!session);
      if (!session) setIsInitializing(false);
    });

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, session) => {
      setIsAuthenticated(!!session);
      if (!session) {
        setHasCompletedOnboarding(null);
      }
    });

    return () => subscription.unsubscribe();
  }, [setIsAuthenticated, setHasCompletedOnboarding]);

  useEffect(() => {
    if (isAuthenticated) {
      getProfile().then((profile) => {
        if (profile && profile.age && profile.heightCm && profile.weightKg) {
          setHasCompletedOnboarding(true);
        } else {
          setHasCompletedOnboarding(false);
        }
        setIsInitializing(false);
      });
    }
  }, [isAuthenticated, setHasCompletedOnboarding]);

  const handleEnterApp = () => {
    localStorage.setItem('pulseiq_has_seen_landing', 'true');
    setShowLanding(false);
  };

  if (showLanding) {
    return <LandingPage onEnterApp={handleEnterApp} />;
  }

  if (isInitializing || (isAuthenticated && hasCompletedOnboarding === null)) {
    return <div className="min-h-screen bg-background flex justify-center items-center" />;
  }

  if (!isAuthenticated) {
    return <Login />;
  }

  if (!hasCompletedOnboarding) {
    return <Onboarding />;
  }

  return <Shell />;
}



