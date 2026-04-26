import { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Card } from '../ui/Card';
import { Button } from '../ui/Button';
import { ConnectedApps } from './ConnectedApps';
import { ReminderSettings } from './ReminderSettings';
import { getProfile, saveProfile } from '../../services/profile';
import { clearAllData } from '../../db/db';
import { useStore } from '../../store/useStore';

export function ProfileTab() {
  const [profile, setProfile] = useState(null);
  const [loading, setLoading] = useState(true);
  const [editing, setEditing] = useState(false);
  const [confirmClear, setConfirmClear] = useState(false);
  const [confirmDeleteAccount, setConfirmDeleteAccount] = useState(false);
  const setHasSyncedSampleData = useStore((s) => s.setHasSyncedSampleData);
  const setIsAuthenticated = useStore((s) => s.setIsAuthenticated);

  useEffect(() => {
    let mounted = true;
    (async () => {
      try {
        setLoading(true);
        const p = await getProfile();
        if (mounted) setProfile(p);
      } catch (err) {
        console.error(err);
      } finally {
        if (mounted) setLoading(false);
      }
    })();
    return () => { mounted = false; };
  }, []);

  if (loading) {
    return (
      <div className="px-5 pt-32 safe-top flex justify-center">
        <div className="w-6 h-6 border-2 border-accent-sleep/20 border-t-accent-sleep rounded-full animate-spin" />
      </div>
    );
  }

  if (!profile) {
    return (
      <div className="px-5 pt-32 safe-top text-center flex flex-col items-center">
        <div className="w-12 h-12 rounded-full bg-danger/10 text-danger flex items-center justify-center mb-4 text-xl font-bold">!</div>
        <p className="text-textSecondary/80 text-sm mb-6 max-w-xs leading-relaxed">
          We couldn't load your profile. This usually happens if your Supabase keys haven't been added to your .env.local file yet.
        </p>
        <Button variant="ghost" onClick={() => setIsAuthenticated(false)}>
          Return to Login
        </Button>
      </div>
    );
  }

  return (
    <div className="px-5 pt-12 safe-top">
      <header className="mb-6">
        <h1 className="text-3xl font-semibold">Profile</h1>
        <p className="text-sm text-textSecondary/60 mt-1">
          Manage your data, connections, and reminders.
        </p>
      </header>

      <Card className="!p-5 mb-4">
        <div className="flex items-start justify-between gap-3">
          <div className="min-w-0">
            <p className="text-[11px] uppercase tracking-widest text-textSecondary/60">
              About you
            </p>
            <p className="text-2xl font-semibold mt-1 truncate">{profile.displayName}</p>
            <p className="text-sm text-textSecondary/60 mt-1">
              {profile.age}y · {profile.heightCm} cm · {profile.weightKg} kg
            </p>
          </div>
          <Button variant="ghost" onClick={() => setEditing(true)}>Edit</Button>
        </div>
        {profile.goals?.length > 0 && (
          <div className="mt-4 flex flex-wrap gap-2">
            {profile.goals.map((g) => (
              <span
                key={g}
                className="text-xs px-2.5 py-1 rounded-full bg-elevated/60 border border-white/5 text-textSecondary/80"
              >
                {g}
              </span>
            ))}
          </div>
        )}
      </Card>

      <ConnectedApps />

      <ReminderSettings />

      <Card className="!p-5 mt-4">
        <p className="text-[11px] uppercase tracking-widest text-textSecondary/60">
          Data & privacy
        </p>
        <p className="text-sm text-textSecondary/70 mt-3 leading-relaxed">
          Your health data lives in your browser only — IndexedDB on this device.
          We send aggregated summaries (not raw records) to Claude when you
          request an insight. No tracking, no analytics, no server storage.
        </p>
        <div className="mt-4 flex flex-col gap-3">
          <div>
            {!confirmClear ? (
              <Button variant="danger" onClick={() => setConfirmClear(true)}>
                Clear local data
              </Button>
            ) : (
              <div className="flex items-center gap-2">
                <Button
                  variant="danger"
                  onClick={async () => {
                    await clearAllData();
                    setHasSyncedSampleData(false);
                    setConfirmClear(false);
                    // Trigger a soft refresh-feel
                    setProfile(await getProfile());
                  }}
                >
                  Yes, clear local data
                </Button>
                <Button variant="ghost" onClick={() => setConfirmClear(false)}>
                  Cancel
                </Button>
              </div>
            )}
          </div>
          <div>
            {!confirmDeleteAccount ? (
              <Button variant="danger" onClick={() => setConfirmDeleteAccount(true)}>
                Delete account
              </Button>
            ) : (
              <div className="flex flex-col gap-2">
                <p className="text-xs text-danger">This will permanently delete your account and data from the cloud.</p>
                <div className="flex items-center gap-2">
                  <Button
                    variant="danger"
                    onClick={async () => {
                      const { supabase } = await import('../../services/supabase');
                      await supabase.rpc('delete_user');
                      await supabase.auth.signOut();
                      setIsAuthenticated(false);
                    }}
                  >
                    Yes, delete account
                  </Button>
                  <Button variant="ghost" onClick={() => setConfirmDeleteAccount(false)}>
                    Cancel
                  </Button>
                </div>
              </div>
            )}
          </div>
        </div>
      </Card>

      <div className="mt-6 flex justify-center">
        <Button 
          variant="ghost" 
          className="!text-danger hover:!bg-danger/10 px-8" 
          onClick={async () => {
            const { supabase } = await import('../../services/supabase');
            await supabase.auth.signOut();
            setIsAuthenticated(false);
          }}
        >
          Log Out
        </Button>
      </div>

      <p className="text-[10px] text-textSecondary/40 text-center mt-6 mb-8">
        PulseIQ is educational and not a medical device.
      </p>

      <AnimatePresence>
        {editing && (
          <ProfileEditor
            profile={profile}
            onClose={() => setEditing(false)}
            onSave={async (next) => {
              const saved = await saveProfile(next);
              setProfile(saved);
              setEditing(false);
            }}
          />
        )}
      </AnimatePresence>
    </div>
  );
}

function ProfileEditor({ profile, onClose, onSave }) {
  const [form, setForm] = useState({
    displayName: profile.displayName,
    age: profile.age,
    heightCm: profile.heightCm,
    weightKg: profile.weightKg,
  });
  return (
    <>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        onClick={onClose}
        className="fixed inset-0 z-40 bg-black/60 backdrop-blur-sm"
      />
      <motion.div
        initial={{ y: '100%' }}
        animate={{ y: 0 }}
        exit={{ y: '100%' }}
        transition={{ type: 'spring', stiffness: 320, damping: 32 }}
        className="fixed inset-x-0 bottom-0 z-50 max-w-lg mx-auto bg-surface rounded-t-3xl border-t border-white/5 shadow-card safe-bottom"
      >
        <div className="flex justify-center pt-3">
          <div className="h-1 w-10 rounded-full bg-white/15" />
        </div>
        <div className="px-5 pt-4 pb-6 space-y-3">
          <h2 className="text-xl font-semibold mb-2">Edit profile</h2>
          <Field
            label="Name"
            value={form.displayName}
            onChange={(v) => setForm({ ...form, displayName: v })}
          />
          <div className="grid grid-cols-3 gap-3">
            <Field
              label="Age"
              type="number"
              value={form.age}
              onChange={(v) => setForm({ ...form, age: Number(v) })}
            />
            <Field
              label="Height (cm)"
              type="number"
              value={form.heightCm}
              onChange={(v) => setForm({ ...form, heightCm: Number(v) })}
            />
            <Field
              label="Weight (kg)"
              type="number"
              value={form.weightKg}
              onChange={(v) => setForm({ ...form, weightKg: Number(v) })}
            />
          </div>
          <div className="pt-3 flex justify-end gap-2">
            <Button variant="ghost" onClick={onClose}>Cancel</Button>
            <Button onClick={() => onSave(form)}>Save</Button>
          </div>
        </div>
      </motion.div>
    </>
  );
}

function Field({ label, value, onChange, type = 'text' }) {
  return (
    <label className="block">
      <span className="text-xs text-textSecondary/60">{label}</span>
      <input
        type={type}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="mt-1 w-full bg-elevated/60 border border-white/5 rounded-xl px-3 py-2.5 text-base outline-none focus:border-white/20"
      />
    </label>
  );
}
