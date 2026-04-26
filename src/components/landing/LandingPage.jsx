import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';

export function LandingPage({ onEnterApp }) {
  const [deferredPrompt, setDeferredPrompt] = useState(null);
  const [isStandalone, setIsStandalone] = useState(false);

  useEffect(() => {
    const checkStandalone = () => {
      return window.matchMedia('(display-mode: standalone)').matches || window.navigator.standalone;
    };
    setIsStandalone(checkStandalone());

    const handleBeforeInstallPrompt = (e) => {
      e.preventDefault();
      setDeferredPrompt(e);
    };

    window.addEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
    window.addEventListener('appinstalled', () => {
      setIsStandalone(true);
    });

    return () => window.removeEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
  }, []);

  const handleInstall = async () => {
    if (deferredPrompt) {
      deferredPrompt.prompt();
      const { outcome } = await deferredPrompt.userChoice;
      if (outcome === 'accepted') {
        setDeferredPrompt(null);
      }
    } else {
      alert('To install the app, look for the "Install" or "Add to Home Screen" option in your browser menu. On iOS, tap the Share button and select "Add to Home Screen".');
    }
  };

  return (
    <div className="min-h-screen bg-background text-textPrimary overflow-y-auto font-sans selection:bg-accent-sleep/30 scroll-smooth">
      {/* Navigation */}
      <nav className="fixed top-0 left-0 right-0 z-40 bg-background/80 backdrop-blur-xl border-b border-white/5">
        <div className="max-w-6xl mx-auto px-6 h-16 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-6 h-6 rounded-full border-[3px] border-accent-sleep opacity-90" />
            <span className="font-semibold tracking-tight text-lg">Pulse<span className="text-accent-sleep">IQ</span></span>
          </div>
          <div className="flex items-center gap-4">
            <button 
              onClick={onEnterApp}
              className="text-sm font-medium text-textSecondary hover:text-white transition-colors hidden sm:block"
            >
              Log In
            </button>
            {!isStandalone && (
              <button 
                onClick={handleInstall}
                className="bg-white text-background text-sm font-semibold py-2 px-5 rounded-full hover:bg-white/90 transition-colors shadow-glow"
              >
                Install App
              </button>
            )}
          </div>
        </div>
      </nav>

      <main className="pt-16">
        {/* Hero Section */}
        <section className="relative px-6 pt-24 pb-32 md:pt-32 md:pb-40 overflow-hidden flex flex-col items-center text-center min-h-[90vh] justify-center">
          {/* Ambient Glow */}
          <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[800px] h-[600px] bg-accent-sleep/15 blur-[120px] rounded-full pointer-events-none opacity-60" />
          
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, type: 'spring', damping: 25 }}
            className="relative z-10 max-w-4xl mx-auto"
          >
            <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-surface border border-white/10 text-xs font-semibold uppercase tracking-widest text-accent-sleep mb-8 shadow-card">
              <span className="w-2 h-2 rounded-full bg-accent-sleep animate-pulse" />
              Your Personal Health Co-Pilot
            </div>
            <h1 className="text-5xl md:text-7xl lg:text-8xl font-bold mb-8 tracking-tight leading-[1.1]">
              Understand the <span className="text-textSecondary/50 italic font-serif">why</span> behind your body's numbers.
            </h1>
            <p className="text-lg md:text-2xl text-textSecondary/80 mb-12 max-w-2xl mx-auto leading-relaxed font-light">
              Your doctor sees you once a year. Your fitness app sees your workouts. Your wearable sees your sleep. PulseIQ pulls it all together.
            </p>
            
            <div className="flex flex-col sm:flex-row gap-4 justify-center items-center">
              {(!isStandalone) && (
                <motion.button 
                  whileTap={{ scale: 0.96 }}
                  onClick={handleInstall}
                  className="w-full sm:w-auto bg-white text-background font-semibold py-4 px-10 rounded-full hover:bg-white/90 transition-colors shadow-card text-lg flex items-center justify-center gap-2"
                >
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4"></path></svg>
                  Install Application
                </motion.button>
              )}
              <motion.button 
                whileTap={{ scale: 0.96 }}
                onClick={onEnterApp}
                className={`w-full sm:w-auto font-semibold py-4 px-10 rounded-full transition-colors text-lg flex items-center justify-center gap-2 ${
                  isStandalone 
                  ? 'bg-white text-background hover:bg-white/90 shadow-card' 
                  : 'bg-surface text-textPrimary hover:bg-elevated border border-white/10'
                }`}
              >
                {isStandalone ? 'Open App' : 'Try the Web Version'}
                <svg className="w-5 h-5 opacity-60" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M14 5l7 7m0 0l-7 7m7-7H3"></path></svg>
              </motion.button>
            </div>
          </motion.div>
        </section>

        {/* Abstract Product Showcase */}
        <section className="px-6 pb-32 relative z-20 -mt-10">
          <motion.div 
            initial={{ opacity: 0, y: 40 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, margin: "-100px" }}
            transition={{ duration: 0.8, type: 'spring', damping: 25 }}
            className="max-w-5xl mx-auto relative"
          >
            {/* Highly stylized abstract dashboard representation */}
            <div className="aspect-[16/10] md:aspect-[21/9] bg-surface rounded-[2rem] border border-white/10 shadow-[0_30px_100px_-15px_rgba(0,0,0,1)] overflow-hidden relative flex flex-col p-6 md:p-10">
               {/* Abstract Top Bar */}
               <div className="flex justify-between items-center mb-8 md:mb-12">
                 <div className="h-8 w-32 bg-elevated rounded-lg border border-white/5" />
                 <div className="flex items-center gap-3">
                    <div className="h-8 w-8 bg-elevated rounded-full border border-white/5 hidden md:block" />
                    <div className="h-10 w-10 bg-elevated rounded-full border border-white/5" />
                 </div>
               </div>
               
               {/* Abstract Grid */}
               <div className="grid grid-cols-2 md:grid-cols-4 gap-4 md:gap-6 mb-8 flex-1">
                 <div className="bg-elevated/50 rounded-2xl border border-white/5 p-4 flex flex-col justify-between">
                    <div className="w-8 h-8 rounded-full bg-accent-heart/20 flex items-center justify-center mb-2"><div className="w-3 h-3 rounded-full bg-accent-heart" /></div>
                    <div className="space-y-2">
                        <div className="h-2 w-12 bg-white/20 rounded" />
                        <div className="h-6 w-20 bg-white/80 rounded" />
                    </div>
                 </div>
                 <div className="bg-elevated/50 rounded-2xl border border-white/5 p-4 flex flex-col justify-between">
                    <div className="w-8 h-8 rounded-full bg-accent-sleep/20 flex items-center justify-center mb-2"><div className="w-3 h-3 rounded-full bg-accent-sleep" /></div>
                    <div className="space-y-2">
                        <div className="h-2 w-12 bg-white/20 rounded" />
                        <div className="h-6 w-20 bg-white/80 rounded" />
                    </div>
                 </div>
                 <div className="bg-elevated/50 rounded-2xl border border-white/5 p-4 hidden md:flex flex-col justify-between">
                    <div className="w-8 h-8 rounded-full bg-accent-activity/20 flex items-center justify-center mb-2"><div className="w-3 h-3 rounded-full bg-accent-activity" /></div>
                    <div className="space-y-2">
                        <div className="h-2 w-12 bg-white/20 rounded" />
                        <div className="h-6 w-20 bg-white/80 rounded" />
                    </div>
                 </div>
                 <div className="bg-elevated/50 rounded-2xl border border-white/5 p-4 hidden md:flex flex-col justify-between">
                    <div className="w-8 h-8 rounded-full bg-accent-recovery/20 flex items-center justify-center mb-2"><div className="w-3 h-3 rounded-full bg-accent-recovery" /></div>
                    <div className="space-y-2">
                        <div className="h-2 w-12 bg-white/20 rounded" />
                        <div className="h-6 w-20 bg-white/80 rounded" />
                    </div>
                 </div>
               </div>

               {/* Abstract Chart Area */}
               <div className="flex-[2] bg-elevated/30 rounded-2xl border border-white/5 flex items-end p-4 gap-2 md:gap-4 relative overflow-hidden">
                 <div className="absolute inset-0 bg-gradient-to-t from-surface/50 to-transparent z-10" />
                 {[...Array(16)].map((_, i) => {
                   const height = Math.max(15, Math.sin(i * 0.5) * 40 + 50 + (Math.random() * 20 - 10));
                   return (
                    <motion.div 
                        key={i} 
                        initial={{ height: 0 }}
                        whileInView={{ height: `${height}%` }}
                        viewport={{ once: true }}
                        transition={{ duration: 1, delay: i * 0.05, type: 'spring' }}
                        className="flex-1 bg-accent-sleep/40 rounded-t-sm relative z-0" 
                    >
                        <div className="absolute top-0 inset-x-0 h-1 bg-accent-sleep rounded-t-sm" />
                    </motion.div>
                   )
                 })}
               </div>

               {/* AI Insight Floating Card */}
               <motion.div 
                  initial={{ opacity: 0, y: 20 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true }}
                  transition={{ delay: 0.8, type: 'spring', damping: 20 }}
                  className="absolute bottom-6 md:bottom-12 left-1/2 -translate-x-1/2 w-[90%] md:w-[65%] bg-surface/95 backdrop-blur-xl border border-white/10 rounded-2xl p-5 shadow-[0_10px_40px_rgba(0,0,0,0.5)]"
                >
                 <div className="flex items-center gap-3 mb-3">
                   <div className="w-2 h-2 rounded-full bg-accent-mental shadow-[0_0_8px_rgba(100,210,255,0.8)]" />
                   <div className="text-[10px] font-bold uppercase tracking-[0.2em] text-textSecondary/60">Claude AI Insight</div>
                 </div>
                 <p className="text-sm md:text-[15px] leading-relaxed text-textPrimary/90">
                   "Your deep sleep was only 30 min last night, which may explain why your resting heart rate is 8 bpm above normal today. A 10-minute walk now could help lower your stress and reset your HRV."
                 </p>
               </motion.div>
            </div>
          </motion.div>
        </section>

        {/* Value Proposition Grid */}
        <section className="px-6 py-24 md:py-32 bg-surface/40 border-y border-white/5">
          <div className="max-w-6xl mx-auto">
            <div className="text-center mb-20">
              <h2 className="text-4xl md:text-5xl font-bold mb-6 tracking-tight">Stop guessing. Start knowing.</h2>
              <p className="text-textSecondary/70 max-w-2xl mx-auto text-lg md:text-xl font-light">
                We combine multiple, disconnected data streams to give you a single, complete picture of your physiology.
              </p>
            </div>

            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6 md:gap-8">
              <FeatureBox 
                title="Unified Timeline" 
                desc="Overlay sleep stages, heart rate, steps, and symptoms on a single interactive timeline. Hidden correlations become visually obvious instantly."
                color="bg-accent-activity"
              />
              <FeatureBox 
                title="Circadian Risk Score" 
                desc="A proprietary composite predicting your likelihood of crashing in the next 24 hours based on sleep debt, HRV trends, and logged symptoms."
                color="bg-accent-heart"
              />
              <FeatureBox 
                title="Micro-Nudge Engine" 
                desc="AI-generated, time-specific prompts delivered exactly when you need them. Not just data, but actionable advice for the next 2 hours."
                color="bg-success"
              />
              <FeatureBox 
                title="Weekly Health Story" 
                desc="Every Sunday, Claude turns your raw data into a clear 3-paragraph narrative highlighting patterns, surprises, and what matters most."
                color="bg-accent-mental"
              />
              <FeatureBox 
                title="100% Privacy First" 
                desc="Your data lives locally on your device in IndexedDB. We send only targeted, aggregated summaries to the AI, keeping raw records strictly secure."
                color="bg-white"
              />
              <FeatureBox 
                title="Future-Self Simulator" 
                desc="See educational projections based on your current habits. Understand how changing one variable today impacts your long-term trajectory."
                color="bg-accent-sleep"
              />
            </div>
          </div>
        </section>

        {/* Deep Dive / How it Works Section */}
        <section className="px-6 py-24 md:py-32 overflow-hidden">
          <div className="max-w-6xl mx-auto flex flex-col lg:flex-row items-center gap-16 lg:gap-24">
            <div className="flex-1 space-y-8">
              <div className="w-14 h-14 rounded-2xl bg-surface border border-white/10 flex items-center justify-center shadow-glow">
                <div className="w-5 h-5 rounded-full bg-accent-sleep" />
              </div>
              <h2 className="text-4xl md:text-5xl font-bold tracking-tight leading-[1.1]">AI that actually understands physiology.</h2>
              <p className="text-lg text-textSecondary/80 leading-relaxed font-light">
                PulseIQ doesn't just show you graphs. It uses advanced language models to explain the <span className="text-textPrimary font-medium">relationship</span> between your data points in real-time. 
              </p>
              <p className="text-lg text-textSecondary/80 leading-relaxed font-light">
                It notices when a late workout ruins your overnight recovery, or when poor sleep quality consistently precedes an energy crash. It speaks in plain, warm language, and always cites the specific signal that drove an observation.
              </p>
              <div className="pt-4 flex gap-4">
                <div className="flex items-center gap-2 text-sm font-medium text-textSecondary">
                    <svg className="w-5 h-5 text-success" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7"></path></svg>
                    No Hallucinations
                </div>
                <div className="flex items-center gap-2 text-sm font-medium text-textSecondary">
                    <svg className="w-5 h-5 text-success" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7"></path></svg>
                    Evidence Based
                </div>
              </div>
            </div>
            
            <div className="flex-1 w-full max-w-lg lg:max-w-none">
              <div className="bg-surface rounded-[2rem] border border-white/5 p-6 md:p-10 shadow-2xl relative">
                <div className="absolute inset-0 bg-gradient-to-br from-accent-sleep/10 to-transparent rounded-[2rem] pointer-events-none" />
                
                <div className="space-y-6 relative z-10">
                  {/* Data Input Mockup */}
                  <div className="bg-background/80 p-5 rounded-2xl border border-white/5">
                    <p className="text-[11px] font-bold uppercase tracking-widest text-textSecondary/50 mb-4">Raw Data Payload</p>
                    <div className="font-mono text-sm md:text-base text-accent-mental/90 leading-relaxed">
                      <span className="text-white/40">{"{"}</span><br/>
                      &nbsp;&nbsp;"sleep": <span className="text-success">"5h 12m"</span>,<br/>
                      &nbsp;&nbsp;"hrv": <span className="text-warning">"32ms"</span>,<br/>
                      &nbsp;&nbsp;"symptoms": [<span className="text-accent-heart">"headache"</span>]<br/>
                      <span className="text-white/40">{"}"}</span>
                    </div>
                  </div>
                  
                  <div className="flex justify-center">
                    <div className="w-px h-8 bg-white/10" />
                  </div>
                  
                  {/* AI Output Mockup */}
                  <motion.div 
                    initial={{ scale: 0.95, opacity: 0 }}
                    whileInView={{ scale: 1, opacity: 1 }}
                    viewport={{ once: true }}
                    transition={{ type: 'spring', damping: 20, delay: 0.2 }}
                    className="bg-white text-background p-6 md:p-8 rounded-2xl shadow-glow"
                  >
                    <div className="flex items-center gap-2 mb-4">
                        <div className="w-2 h-2 rounded-full bg-accent-sleep animate-pulse" />
                        <p className="text-[11px] font-bold uppercase tracking-[0.2em] text-background/50">PulseIQ Synthesis</p>
                    </div>
                    <p className="text-base md:text-lg font-medium leading-relaxed">
                      "Your HRV dropped significantly alongside short sleep. A headache often follows this pattern. Hydrate well and prioritize an early bedtime tonight to break the cycle."
                    </p>
                  </motion.div>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* Final CTA Section */}
        <section className="px-6 py-32 bg-surface border-t border-white/5 text-center relative overflow-hidden">
          <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[1000px] h-[500px] bg-accent-sleep/10 blur-[100px] rounded-full pointer-events-none" />
          
          <div className="max-w-3xl mx-auto relative z-10">
            <h2 className="text-4xl md:text-6xl font-bold mb-6 tracking-tight">Ready to listen to your body?</h2>
            <p className="text-xl md:text-2xl text-textSecondary/80 mb-12 font-light max-w-xl mx-auto">
              No subscriptions, no trackers. Just your data, finally making sense.
            </p>
            
            <div className="flex flex-col sm:flex-row gap-4 justify-center items-center">
              {(!isStandalone) && (
                <motion.button 
                  whileTap={{ scale: 0.96 }}
                  onClick={handleInstall}
                  className="w-full sm:w-auto bg-white text-background font-semibold py-4 px-10 rounded-full hover:bg-white/90 transition-colors shadow-card text-lg"
                >
                  Install App Free
                </motion.button>
              )}
              <motion.button 
                whileTap={{ scale: 0.96 }}
                onClick={onEnterApp}
                className={`w-full sm:w-auto font-semibold py-4 px-10 rounded-full transition-colors text-lg ${
                  isStandalone 
                  ? 'bg-white text-background hover:bg-white/90 shadow-card' 
                  : 'bg-elevated text-textPrimary hover:bg-elevated/80 border border-white/5'
                }`}
              >
                {isStandalone ? 'Open Application' : 'Launch Web Preview'}
              </motion.button>
            </div>
          </div>
        </section>
        
        {/* Footer */}
        <footer className="border-t border-white/5 py-12 px-6 flex flex-col items-center">
          <div className="flex items-center gap-2 mb-6 opacity-50 hover:opacity-100 transition-opacity cursor-pointer">
            <div className="w-5 h-5 rounded-full border-2 border-textPrimary" />
            <span className="font-semibold tracking-tight">PulseIQ</span>
          </div>
          <p className="text-textSecondary/40 text-sm text-center max-w-md">
            © {new Date().getFullYear()} PulseIQ Health Intelligence.<br/>
            Built for the hackathon. For educational purposes only; not a medical device.
          </p>
        </footer>
      </main>
    </div>
  );
}

function FeatureBox({ title, desc, color }) {
  return (
    <motion.div 
      initial={{ opacity: 0, y: 20 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, margin: "-50px" }}
      transition={{ duration: 0.5 }}
      className="bg-surface rounded-3xl p-8 border border-white/5 text-left flex flex-col group hover:border-white/10 transition-colors"
    >
      <div className={`w-12 h-12 rounded-xl ${color} mb-6 opacity-80 flex items-center justify-center shadow-lg transition-transform group-hover:scale-110 origin-left`}>
         <div className="w-4 h-4 bg-background/30 rounded-full" />
      </div>
      <h3 className="text-xl font-semibold mb-3 text-textPrimary">{title}</h3>
      <p className="text-textSecondary/70 leading-relaxed text-sm md:text-base font-light">{desc}</p>
    </motion.div>
  );
}
