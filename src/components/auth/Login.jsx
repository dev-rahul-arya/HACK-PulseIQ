import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Button } from '../ui/Button';
import { useStore } from '../../store/useStore';
import { supabase } from '../../services/supabase';

export function Login() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [isLogin, setIsLogin] = useState(true);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const setIsAuthenticated = useStore((s) => s.setIsAuthenticated);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError(null);
    
    if (!email.trim() || password.length < 6) {
      setError('Please enter a valid email and a password of at least 6 characters.');
      return;
    }

    setLoading(true);
    
    try {
      let result;
      if (isLogin) {
        result = await supabase.auth.signInWithPassword({
          email,
          password,
        });
      } else {
        result = await supabase.auth.signUp({
          email,
          password,
        });
      }

      if (result.error) {
        setError(result.error.message);
      } else {
        setIsAuthenticated(true);
      }
    } catch (err) {
      setError('An unexpected error occurred. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-background text-textPrimary flex flex-col justify-center items-center p-6 selection:bg-accent-sleep/30">
      <motion.div
        initial={{ opacity: 0, scale: 0.95, y: 20 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        transition={{ type: 'spring', damping: 25, stiffness: 300 }}
        className="w-full max-w-sm bg-surface p-8 rounded-3xl border border-white/5 shadow-card relative z-10"
      >
        <div className="flex justify-center mb-8">
          <div className="w-12 h-12 rounded-2xl border border-white/10 bg-elevated flex items-center justify-center shadow-glow">
            <div className="w-5 h-5 rounded-full border-4 border-accent-sleep opacity-90" />
          </div>
        </div>
        
        <h1 className="text-2xl font-bold text-center mb-2 tracking-tight">
          {isLogin ? 'Welcome back' : 'Create an account'}
        </h1>
        <p className="text-sm text-textSecondary/70 text-center mb-6 font-light">
          {isLogin ? 'Enter your details to access your health data.' : 'Set up your profile to get started.'}
        </p>

        <AnimatePresence>
          {error && (
            <motion.div
              initial={{ opacity: 0, height: 0, marginBottom: 0 }}
              animate={{ opacity: 1, height: 'auto', marginBottom: 16 }}
              exit={{ opacity: 0, height: 0, marginBottom: 0 }}
              className="bg-danger/10 border border-danger/20 text-danger text-xs p-3 rounded-xl text-center"
            >
              {error}
            </motion.div>
          )}
        </AnimatePresence>

        <form onSubmit={handleSubmit} className="space-y-5">
          <div>
            <label className="block text-[11px] font-bold text-textSecondary/50 mb-1.5 ml-1 uppercase tracking-widest">
              Email Address
            </label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="you@example.com"
              className="w-full bg-elevated/40 border border-white/5 focus:border-accent-sleep/50 rounded-xl px-4 py-3.5 text-base outline-none transition-all placeholder:text-textSecondary/30 focus:shadow-[0_0_15px_rgba(94,92,230,0.15)]"
              required
            />
          </div>
          <div>
            <label className="block text-[11px] font-bold text-textSecondary/50 mb-1.5 ml-1 uppercase tracking-widest">
              Password
            </label>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="••••••••"
              className="w-full bg-elevated/40 border border-white/5 focus:border-accent-sleep/50 rounded-xl px-4 py-3.5 text-base outline-none transition-all placeholder:text-textSecondary/30 focus:shadow-[0_0_15px_rgba(94,92,230,0.15)]"
              required
              minLength={6}
            />
          </div>

          <div className="pt-2">
            <Button 
              type="submit" 
              className="w-full bg-white hover:bg-white/90 text-background font-semibold py-3.5 flex justify-center items-center gap-2"
              disabled={loading}
            >
              {loading && <div className="w-4 h-4 border-2 border-background/20 border-t-background rounded-full animate-spin" />}
              {isLogin ? 'Log In to PulseIQ' : 'Sign Up'}
            </Button>
          </div>
        </form>

        <div className="mt-8 text-center">
          <button 
            type="button"
            onClick={() => {
              setIsLogin(!isLogin);
              setError(null);
            }}
            className="text-xs text-textSecondary/60 hover:text-white transition-colors"
          >
            {isLogin ? "Don't have an account? Create one" : "Already have an account? Log in"}
          </button>
        </div>
      </motion.div>
      
      {/* Background glow */}
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] bg-accent-sleep/10 blur-[100px] rounded-full pointer-events-none opacity-60" />

      <p className="fixed bottom-8 text-[10px] text-textSecondary/40 text-center max-w-[260px] leading-relaxed">
        We use Supabase for secure authentication. Your data remains encrypted.
      </p>
    </div>
  );
}
