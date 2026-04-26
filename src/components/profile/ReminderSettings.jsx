import { useEffect, useState } from 'react';
import { Card } from '../ui/Card';
import { motion } from 'framer-motion';
import {
  getReminderSettings,
  setReminder,
  requestNotificationPermission,
  previewReminder,
} from '../../services/notifications';

export function ReminderSettings() {
  const [reminders, setReminders] = useState({});
  const [permission, setPermission] = useState(
    typeof Notification !== 'undefined' ? Notification.permission : 'unsupported'
  );

  useEffect(() => {
    (async () => setReminders(await getReminderSettings()))();
  }, []);

  async function toggle(key) {
    const current = reminders[key];
    const next = !current?.enabled;
    if (next && permission !== 'granted') {
      const result = await requestNotificationPermission();
      setPermission(result);
      if (result !== 'granted') return; // user denied
    }
    const updated = await setReminder(key, next);
    setReminders(updated);
    if (next) previewReminder(key);
  }

  return (
    <Card className="!p-5 mt-4">
      <p className="text-[11px] uppercase tracking-widest text-textSecondary/60">
        Reminders
      </p>
      <p className="text-sm text-textSecondary/70 mt-2">
        Tiny nudges, only when you ask for them.
      </p>
      {permission === 'denied' && (
        <p className="text-xs text-warning mt-2">
          Notifications are blocked in your browser settings.
        </p>
      )}
      <ul className="mt-4 space-y-2">
        {Object.entries(reminders).map(([key, r]) => (
          <li
            key={key}
            className="flex items-center justify-between bg-elevated/40 border border-white/5 rounded-xl px-3 py-3"
          >
            <span className="text-sm">{r.label}</span>
            <Toggle on={r.enabled} onChange={() => toggle(key)} />
          </li>
        ))}
      </ul>
      {permission === 'granted' && (
        <p className="text-[11px] text-textSecondary/50 mt-3">
          Toggling on fires a sample notification so you can preview it.
        </p>
      )}
    </Card>
  );
}

function Toggle({ on, onChange }) {
  return (
    <motion.button
      onClick={onChange}
      whileTap={{ scale: 0.95 }}
      className={
        'relative w-11 h-6 rounded-full transition-colors ' +
        (on ? 'bg-success' : 'bg-white/15')
      }
      aria-pressed={on}
    >
      <motion.span
        className="absolute top-0.5 left-0.5 w-5 h-5 rounded-full bg-white shadow-sm"
        animate={{ x: on ? 20 : 0 }}
        transition={{ type: 'spring', stiffness: 500, damping: 30 }}
      />
    </motion.button>
  );
}
