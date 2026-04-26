import { useState, useEffect } from 'react';
import { Routes, Route, Navigate, useNavigate, useLocation } from 'react-router-dom';
import { Shell } from './components/layout/Shell';
import { LandingPage } from './components/landing/LandingPage';
import { Login } from './components/auth/Login';
import { Onboarding } from './components/auth/Onboarding';
import { InstallGate, shouldGateInstall } from './components/auth/InstallGate';
import { DesktopWarning } from './components/ui/DesktopWarning';
import { OfflineBadge } from './components/ui/OfflineBadge';
import { useStore } from './store/useStore';
import { supabase } from './services/supabase';
import { getProfile } from './services/profile';

function ProtectedRoute({ children }) {
  const isAuthenticated = useStore((s) => s.isAuthenticated);
  const hasCompletedOnboarding = useStore((s) => s.hasCompletedOnboarding);
  const location = useLocation();

  if (!isAuthenticated) {
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  if (hasCompletedOnboarding === false) {
    return <Navigate to="/onboarding" replace />;
  }

  return children;
}

function LandingRoute() {
  const navigate = useNavigate();
  const isStandalone = window.matchMedia('(display-mode: standalone)').matches || window.navigator.standalone;
  
  useEffect(() => {
    if (isStandalone) {
      navigate('/app/today', { replace: true });
    }
  }, [isStandalone, navigate]);

  if (isStandalone) return null;

  return <LandingPage onEnterApp={() => navigate('/app/today')} />;
}

export default function App() {
  const [isInitializing, setIsInitializing] = useState(true);
  const [needsInstall, setNeedsInstall] = useState(() => shouldGateInstall());

  useEffect(() => {
    const recheck = () => setNeedsInstall(shouldGateInstall());
    window.addEventListener('resize', recheck);
    window.addEventListener('appinstalled', recheck);
    const mql = window.matchMedia('(display-mode: standalone)');
    mql.addEventListener?.('change', recheck);
    return () => {
      window.removeEventListener('resize', recheck);
      window.removeEventListener('appinstalled', recheck);
      mql.removeEventListener?.('change', recheck);
    };
  }, []);

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

  if (isInitializing || (isAuthenticated && hasCompletedOnboarding === null)) {
    return <div className="min-h-screen bg-background flex justify-center items-center" />;
  }

  return (
    <>
      <DesktopWarning />
      <OfflineBadge />
      <Routes>
        <Route path="/" element={<LandingRoute />} />
        <Route path="/login" element={isAuthenticated ? <Navigate to="/app/today" replace /> : <Login />} />
        <Route path="/onboarding" element={!isAuthenticated ? <Navigate to="/login" replace /> : hasCompletedOnboarding ? <Navigate to="/app/today" replace /> : <Onboarding />} />
        <Route path="/app/:tab" element={
          <ProtectedRoute>
            {needsInstall ? <InstallGate /> : <Shell />}
          </ProtectedRoute>
        } />
        <Route path="/app" element={<Navigate to="/app/today" replace />} />
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </>
  );
}
