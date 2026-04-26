// Lightweight in-app notifications + browser Notification API permission.
// We don't run a real push backend — for the demo we fire local Notifications
// on a setInterval when reminders are enabled. The settings live in Dexie
// (meta key "reminders") so they survive reloads.

import { getMeta, setMeta } from '../db/db';

const DEFAULT_REMINDERS = {
  movement: { enabled: false, label: 'Move every 90 min' },
  symptom: { enabled: false, label: 'Daily symptom check-in' },
  bedtime: { enabled: false, label: 'Bedtime wind-down' },
};

export async function getReminderSettings() {
  const stored = await getMeta('reminders');
  return { ...DEFAULT_REMINDERS, ...(stored || {}) };
}

export async function setReminder(key, enabled) {
  const current = await getReminderSettings();
  current[key] = { ...current[key], enabled };
  await setMeta('reminders', current);
  return current;
}

export async function requestNotificationPermission() {
  if (!('Notification' in window)) return 'unsupported';
  if (Notification.permission === 'granted') return 'granted';
  if (Notification.permission === 'denied') return 'denied';
  try {
    return await Notification.requestPermission();
  } catch {
    return 'denied';
  }
}

export function showLocalNotification(title, body) {
  if (typeof Notification === 'undefined') return false;
  if (Notification.permission !== 'granted') return false;
  try {
    new Notification(title, { body, icon: '/favicon.svg' });
    return true;
  } catch {
    return false;
  }
}

// Demo helper: fire one notification for the toggled reminder so users can
// see what the experience looks like.
export function previewReminder(key) {
  const messages = {
    movement: ['Move reminder', 'Stand up and stretch — even 60 seconds helps.'],
    symptom: ['Daily check-in', 'Take a moment to log how you feel today.'],
    bedtime: ['Bedtime soon', 'Wind down — your sleep window is approaching.'],
  };
  const [title, body] = messages[key] || ['Reminder', 'You set this reminder in PulseIQ.'];
  return showLocalNotification(title, body);
}
