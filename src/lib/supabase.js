import { createClient } from '@supabase/supabase-js';
import { format, subDays } from 'date-fns';

export const supabase = createClient(
  import.meta.env.VITE_SUPABASE_URL,
  import.meta.env.VITE_SUPABASE_ANON_KEY
);

const today = () => format(new Date(), 'yyyy-MM-dd');
const fromDay = (days) => format(subDays(new Date(), days), 'yyyy-MM-dd');

// ── Vitals ───────────────────────────────────────────────────────────────────
export async function getVitals(days = 30) {
  const { data } = await supabase
    .from('vitals').select('*')
    .gte('date', fromDay(days))
    .order('date', { ascending: true })
    .order('time', { ascending: true, nullsFirst: false });
  return data || [];
}

export async function getLatestVitals() {
  const { data } = await supabase
    .from('vitals').select('*')
    .order('date', { ascending: false })
    .order('time', { ascending: false, nullsFirst: false })
    .limit(1);
  return data?.[0] || null;
}

export async function logVitals(payload) {
  const { data, error } = await supabase.from('vitals').insert([payload]).select();
  return { data, error };
}

export async function deleteVitals(id) {
  return supabase.from('vitals').delete().eq('id', id);
}

// ── Meals ────────────────────────────────────────────────────────────────────
export async function getMeals(days = 7) {
  const { data } = await supabase
    .from('meals').select('*')
    .gte('date', fromDay(days))
    .order('date', { ascending: false })
    .order('time', { ascending: false, nullsFirst: false });
  return data || [];
}

export async function getMealsToday() {
  const { data } = await supabase
    .from('meals').select('*')
    .eq('date', today())
    .order('time', { ascending: true, nullsFirst: false });
  return data || [];
}

export async function logMeal(payload) {
  const { data, error } = await supabase.from('meals').insert([payload]).select();
  return { data, error };
}

export async function deleteMeal(id) {
  return supabase.from('meals').delete().eq('id', id);
}

// ── Workouts ─────────────────────────────────────────────────────────────────
export async function getWorkouts(days = 90) {
  const { data } = await supabase
    .from('workouts').select('*')
    .gte('date', fromDay(days))
    .order('date', { ascending: false });
  return data || [];
}

export async function getWorkoutHeatmap(days = 84) {
  const { data } = await supabase
    .from('workouts').select('date, type')
    .gte('date', fromDay(days))
    .order('date', { ascending: true });
  const map = {};
  (data || []).forEach(r => {
    if (!map[r.date]) map[r.date] = [];
    map[r.date].push(r.type);
  });
  return map;
}

export async function logWorkout(payload) {
  const { data, error } = await supabase.from('workouts').insert([payload]).select();
  return { data, error };
}

export async function deleteWorkout(id) {
  return supabase.from('workouts').delete().eq('id', id);
}

// ── Dashboard summary ────────────────────────────────────────────────────────
export async function getSummary() {
  const [latestV, weekW, todayM, streakW] = await Promise.all([
    supabase.from('vitals').select('blood_glucose,weight_kg,waist_cm,hba1c,date')
      .order('date',{ascending:false}).order('time',{ascending:false,nullsFirst:false}).limit(1),
    supabase.from('workouts').select('id',{count:'exact',head:true})
      .gte('date', fromDay(7)).neq('type','rest'),
    supabase.from('meals').select('id',{count:'exact',head:true}).eq('date',today()),
    supabase.from('workouts').select('date')
      .neq('type','rest').order('date',{ascending:false}).limit(60),
  ]);

  // Compute streak from distinct dates
  const dates = [...new Set((streakW.data||[]).map(r=>r.date))];
  let streak = 0;
  const d = new Date(); d.setHours(0,0,0,0);
  for (const dateStr of dates) {
    const rd = new Date(dateStr);
    const diff = Math.round((d - rd) / 86400000);
    if (diff === streak) { streak++; } else break;
  }

  const v = latestV.data?.[0] || {};
  return {
    latest_bg:           v.blood_glucose || null,
    latest_weight:       v.weight_kg     || null,
    latest_waist:        v.waist_cm      || null,
    latest_hba1c:        v.hba1c         || null,
    vitals_date:         v.date          || null,
    workouts_this_week:  weekW.count     || 0,
    meals_today:         todayM.count    || 0,
    workout_streak:      streak,
  };
}
