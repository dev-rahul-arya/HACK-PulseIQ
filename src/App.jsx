import { useState, useEffect } from 'react';
import { Shell } from './components/layout/Shell';
import { LandingPage } from './components/landing/LandingPage';

export default function App() {
  const [showLanding, setShowLanding] = useState(true);

  useEffect(() => {
    // Check if installed as PWA or if user already saw landing
    const isStandalone = window.matchMedia('(display-mode: standalone)').matches || window.navigator.standalone;
    if (isStandalone) {
      setShowLanding(false);
    }
    
    const storedPref = localStorage.getItem('pulseiq_has_seen_landing');
    if (storedPref) {
      setShowLanding(false);
    }
  }, []);

  const handleEnterApp = () => {
    localStorage.setItem('pulseiq_has_seen_landing', 'true');
    setShowLanding(false);
  };

  if (showLanding) {
    return <LandingPage onEnterApp={handleEnterApp} />;
  }

  return <Shell />;
}

