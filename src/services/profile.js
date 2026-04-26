import { supabase } from './supabase';

export async function getProfile() {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return null;

  const { data, error } = await supabase
    .from('user_profiles')
    .select('*')
    .eq('id', user.id)
    .single();

  if (error || !data) {
    return {
      displayName: user.email?.split('@')[0] || 'You',
      age: null,
      heightCm: null,
      weightKg: null,
      goals: [],
    };
  }

  return {
    id: data.id,
    displayName: data.display_name,
    age: data.age,
    heightCm: data.height_cm,
    weightKg: data.weight_kg,
    goals: data.goals || [],
  };
}

export async function saveProfile(updates) {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return null;

  const dbUpdates = {
    id: user.id,
    display_name: updates.displayName,
    age: updates.age,
    height_cm: updates.heightCm,
    weight_kg: updates.weightKg,
    goals: updates.goals,
    updated_at: new Date().toISOString(),
  };

  const { error } = await supabase
    .from('user_profiles')
    .upsert(dbUpdates);

  if (error) {
    console.error('Error saving profile:', error);
    throw error;
  }

  return { ...updates, id: user.id };
}
