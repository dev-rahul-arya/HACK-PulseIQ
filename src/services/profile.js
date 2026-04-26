import { db } from '../db/db';

const PROFILE_ID = 'me';

const DEFAULT_PROFILE = {
  id: PROFILE_ID,
  displayName: 'You',
  age: 30,
  heightCm: 172,
  weightKg: 72,
  goals: ['Better sleep', 'Steady energy'],
};

export async function getProfile() {
  const row = await db.userProfile.get(PROFILE_ID);
  return row || DEFAULT_PROFILE;
}

export async function saveProfile(updates) {
  const current = await getProfile();
  const next = { ...current, ...updates, id: PROFILE_ID };
  await db.userProfile.put(next);
  return next;
}
