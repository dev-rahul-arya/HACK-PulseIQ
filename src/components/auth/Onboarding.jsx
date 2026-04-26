import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Button } from '../ui/Button';
import { useStore } from '../../store/useStore';
import { saveProfile, getProfile } from '../../services/profile';

export function Onboarding() {
  const [step, setStep] = useState(1);
  const [form, setForm] = useState({
    displayName: '',
    age: '',
    heightCm: '',
    weightKg: '',
    goals: [],
  });
  const [loading, setLoading] = useState(false);
  const setHasCompletedOnboarding = useStore((s) => s.setHasCompletedOnboarding);

  useEffect(() => {
    // preload name if it exists from trigger or previous session
    getProfile().then(p => {
      if (p) {
        setForm(f => ({ ...f, displayName: p.displayName || '' }));
      }
    });
  }, []);

  const handleNext = () => setStep(step + 1);
  const handleBack = () => setStep(step - 1);

  const handleComplete = async () => {
    setLoading(true);
    try {
      await saveProfile({
        displayName: form.displayName || 'You',
        age: Number(form.age),
        heightCm: Number(form.heightCm),
        weightKg: Number(form.weightKg),
        goals: form.goals,
      });
      setHasCompletedOnboarding(true);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  const toggleGoal = (goal) => {
    if (form.goals.includes(goal)) {
      setForm({ ...form, goals: form.goals.filter(g => g !== goal) });
    } else {
      setForm({ ...form, goals: [...form.goals, goal] });
    }
  };

  const goalsOptions = ['Better sleep', 'Steady energy', 'Reduce stress', 'More activity', 'Understand patterns'];

  return (
    <div className="min-h-screen bg-background text-textPrimary flex flex-col px-6 py-12 safe-top safe-bottom">
      <div className="flex justify-between items-center mb-10 max-w-lg mx-auto w-full">
        {step > 1 ? (
          <button onClick={handleBack} className="p-2 text-textSecondary hover:text-white transition-colors">
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 19l-7-7 7-7"></path></svg>
          </button>
        ) : <div className="w-10" />}
        <div className="flex gap-2">
          {[1, 2, 3].map(i => (
            <div key={i} className={`h-1.5 w-12 rounded-full transition-colors ${i <= step ? 'bg-accent-sleep' : 'bg-white/10'}`} />
          ))}
        </div>
        <div className="w-10" />
      </div>

      <AnimatePresence mode="wait">
        {step === 1 && (
          <motion.div
            key="step1"
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -20 }}
            className="flex-1 max-w-lg mx-auto w-full flex flex-col justify-center pb-20"
          >
            <h1 className="text-3xl font-bold mb-4 tracking-tight">Let's get to know you</h1>
            <p className="text-textSecondary/80 mb-8 leading-relaxed font-light">PulseIQ uses your basic metrics to establish physiological baselines. This helps the AI understand what "normal" looks like for your body type.</p>
            
            <div className="space-y-5">
              <div>
                <label className="block text-[11px] font-bold text-textSecondary/50 mb-1.5 ml-1 uppercase tracking-widest">Preferred Name</label>
                <input
                  type="text"
                  value={form.displayName}
                  onChange={(e) => setForm({ ...form, displayName: e.target.value })}
                  placeholder="e.g., Alex"
                  className="w-full bg-elevated/40 border border-white/5 focus:border-accent-sleep/50 rounded-xl px-4 py-3.5 text-base outline-none transition-all"
                />
              </div>
              <div>
                <label className="block text-[11px] font-bold text-textSecondary/50 mb-1.5 ml-1 uppercase tracking-widest">Age</label>
                <input
                  type="number"
                  value={form.age}
                  onChange={(e) => setForm({ ...form, age: e.target.value })}
                  placeholder="e.g., 30"
                  className="w-full bg-elevated/40 border border-white/5 focus:border-accent-sleep/50 rounded-xl px-4 py-3.5 text-base outline-none transition-all"
                />
              </div>
            </div>
            
            <div className="mt-12">
              <Button onClick={handleNext} disabled={!form.displayName || !form.age} className="w-full text-base py-4">Continue</Button>
            </div>
          </motion.div>
        )}

        {step === 2 && (
          <motion.div
            key="step2"
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -20 }}
            className="flex-1 max-w-lg mx-auto w-full flex flex-col justify-center pb-20"
          >
            <h1 className="text-3xl font-bold mb-4 tracking-tight">Body metrics</h1>
            <p className="text-textSecondary/80 mb-8 leading-relaxed font-light">These numbers are crucial for calculating accurate baseline heart rate variability and expected activity output.</p>
            
            <div className="space-y-5">
              <div>
                <label className="block text-[11px] font-bold text-textSecondary/50 mb-1.5 ml-1 uppercase tracking-widest">Height (cm)</label>
                <input
                  type="number"
                  value={form.heightCm}
                  onChange={(e) => setForm({ ...form, heightCm: e.target.value })}
                  placeholder="e.g., 175"
                  className="w-full bg-elevated/40 border border-white/5 focus:border-accent-sleep/50 rounded-xl px-4 py-3.5 text-base outline-none transition-all"
                />
              </div>
              <div>
                <label className="block text-[11px] font-bold text-textSecondary/50 mb-1.5 ml-1 uppercase tracking-widest">Weight (kg)</label>
                <input
                  type="number"
                  value={form.weightKg}
                  onChange={(e) => setForm({ ...form, weightKg: e.target.value })}
                  placeholder="e.g., 70"
                  className="w-full bg-elevated/40 border border-white/5 focus:border-accent-sleep/50 rounded-xl px-4 py-3.5 text-base outline-none transition-all"
                />
              </div>
            </div>
            
            <div className="mt-12">
              <Button onClick={handleNext} disabled={!form.heightCm || !form.weightKg} className="w-full text-base py-4">Continue</Button>
            </div>
          </motion.div>
        )}

        {step === 3 && (
          <motion.div
            key="step3"
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -20 }}
            className="flex-1 max-w-lg mx-auto w-full flex flex-col justify-center pb-20"
          >
            <h1 className="text-3xl font-bold mb-4 tracking-tight">What are your goals?</h1>
            <p className="text-textSecondary/80 mb-8 leading-relaxed font-light">Select the areas you want Claude to focus on when generating your daily insights.</p>
            
            <div className="flex flex-wrap gap-3">
              {goalsOptions.map(g => (
                <button
                  key={g}
                  onClick={() => toggleGoal(g)}
                  className={`px-5 py-3 rounded-xl border transition-all text-sm font-medium ${form.goals.includes(g) ? 'bg-accent-sleep text-white border-accent-sleep shadow-[0_0_15px_rgba(94,92,230,0.3)]' : 'bg-surface text-textSecondary border-white/10 hover:border-white/20'}`}
                >
                  {g}
                </button>
              ))}
            </div>
            
            <div className="mt-12">
              <Button onClick={handleComplete} disabled={loading || form.goals.length === 0} className="w-full flex justify-center items-center gap-2 text-base py-4">
                {loading && <div className="w-4 h-4 border-2 border-background/20 border-t-background rounded-full animate-spin" />}
                Complete Setup
              </Button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
