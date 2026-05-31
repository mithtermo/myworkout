import { createClient } from '@supabase/supabase-js';
import { format, subDays } from 'date-fns';

// Use placeholder values if env vars not set — build succeeds,
// data pages show a friendly error, Plans page (no Supabase) works fine.
const supabaseUrl = import.meta.env.VITE_SUPABASE_URL || 'https://placeholder.supabase.co';
const supabaseKey = import.meta.env.VITE_SUPABASE_ANON_KEY || 'placeholder-key';

export const supabase = createClient(supabaseUrl, supabaseKey);

export const isConfigured = () =>
  import.meta.env.VITE_SUPABASE_URL && import.meta.env.VITE_SUPABASE_ANON_KEY;

const today   = () => format(new Date(), 'yyyy-MM-dd');
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
      .order('date', { ascending: false }).order('time', { ascending: false, nullsFirst: false }).limit(1),
    supabase.from('workouts').select('id', { count: 'exact', head: true })
      .gte('date', fromDay(7)).neq('type', 'rest'),
    supabase.from('meals').select('id', { count: 'exact', head: true }).eq('date', today()),
    supabase.from('workouts').select('date')
      .neq('type', 'rest').order('date', { ascending: false }).limit(60),
  ]);

  const dates = [...new Set((streakW.data || []).map(r => r.date))];
  let streak = 0;
  const d = new Date(); d.setHours(0, 0, 0, 0);
  for (const dateStr of dates) {
    const diff = Math.round((d - new Date(dateStr)) / 86400000);
    if (diff === streak) { streak++; } else break;
  }

  const v = latestV.data?.[0] || {};
  return {
    latest_bg:          v.blood_glucose || null,
    latest_weight:      v.weight_kg     || null,
    latest_waist:       v.waist_cm      || null,
    latest_hba1c:       v.hba1c         || null,
    vitals_date:        v.date          || null,
    workouts_this_week: weekW.count     || 0,
    meals_today:        todayM.count    || 0,
    workout_streak:     streak,
  };
}

// ── Analysis — week-over-week trends ─────────────────────────────────────────
export async function getAnalysis() {
  const [bgAll, weightAll, workoutsAll, mealsAll] = await Promise.all([
    supabase.from('vitals').select('date,blood_glucose').not('blood_glucose','is',null)
      .order('date', { ascending: true }),
    supabase.from('vitals').select('date,weight_kg,waist_cm').not('weight_kg','is',null)
      .order('date', { ascending: true }),
    supabase.from('workouts').select('date,type,pre_bg,post_bg').gte('date', fromDay(14))
      .order('date', { ascending: true }),
    supabase.from('meals').select('date,meal_type').gte('date', fromDay(14)),
  ]);

  const bg      = bgAll.data || [];
  const weights = weightAll.data || [];
  const workouts = workoutsAll.data || [];
  const meals   = mealsAll.data || [];

  const thisWeek = fromDay(7);
  const lastWeek = fromDay(14);

  // BG averages
  const bgThisWeek = avg(bg.filter(r => r.date >= thisWeek).map(r => r.blood_glucose));
  const bgLastWeek = avg(bg.filter(r => r.date >= lastWeek && r.date < thisWeek).map(r => r.blood_glucose));
  const bgAllTime  = avg(bg.map(r => r.blood_glucose));

  // Latest vs previous weight
  const w2 = weights.slice(-2);
  const weightChange = w2.length === 2 ? +(w2[1].weight_kg - w2[0].weight_kg).toFixed(1) : null;
  const latestWeight = weights.at(-1)?.weight_kg || null;
  const latestWaist  = weightAll.data?.filter(r=>r.waist_cm).at(-1)?.waist_cm || null;

  // Workout counts
  const wkThisWeek = workouts.filter(r => r.date >= thisWeek && r.type !== 'rest').length;
  const wkLastWeek = workouts.filter(r => r.date >= lastWeek && r.date < thisWeek && r.type !== 'rest').length;

  // Meal logging consistency (days with ≥3 meals logged)
  const mealDaysThis = new Set(meals.filter(r => r.date >= thisWeek).map(r => r.date)).size;
  const mealDaysLast = new Set(meals.filter(r => r.date >= lastWeek && r.date < thisWeek).map(r => r.date)).size;

  // BG response to exercise (pre vs post)
  const bgDropSessions = workouts.filter(r => r.pre_bg && r.post_bg);
  const avgBgDrop = avg(bgDropSessions.map(r => r.pre_bg - r.post_bg));

  // Best/worst BG day this week
  const bgThisWeekRows = bg.filter(r => r.date >= thisWeek);
  const bestBG  = bgThisWeekRows.length ? Math.min(...bgThisWeekRows.map(r=>r.blood_glucose)) : null;
  const worstBG = bgThisWeekRows.length ? Math.max(...bgThisWeekRows.map(r=>r.blood_glucose)) : null;

  return {
    bg: {
      thisWeek: bgThisWeek,
      lastWeek: bgLastWeek,
      allTime:  bgAllTime,
      change:   bgThisWeek && bgLastWeek ? +(bgThisWeek - bgLastWeek).toFixed(1) : null,
      trend:    trend(bgThisWeek, bgLastWeek, 'lower'),   // lower is better for BG
      best:     bestBG,
      worst:    worstBG,
    },
    weight: {
      latest:  latestWeight,
      change:  weightChange,
      trend:   weightChange != null ? (weightChange < 0 ? 'improved' : weightChange > 0 ? 'regressed' : 'stable') : 'nodata',
      waist:   latestWaist,
    },
    workouts: {
      thisWeek: wkThisWeek,
      lastWeek: wkLastWeek,
      change:   wkThisWeek - wkLastWeek,
      trend:    trend(wkThisWeek, wkLastWeek, 'higher'),  // higher is better for workouts
      target:   4,
    },
    meals: {
      daysLoggedThisWeek: mealDaysThis,
      daysLoggedLastWeek: mealDaysLast,
      trend: trend(mealDaysThis, mealDaysLast, 'higher'),
    },
    exercise: {
      avgBgDrop,
      sessions: bgDropSessions.length,
    },
  };
}

function avg(arr) {
  if (!arr.length) return null;
  return +(arr.reduce((s, v) => s + v, 0) / arr.length).toFixed(1);
}

function trend(current, previous, direction) {
  if (current == null || previous == null) return 'nodata';
  if (current === previous) return 'stable';
  const improved = direction === 'lower' ? current < previous : current > previous;
  return improved ? 'improved' : 'regressed';
}

// ── Saved Analyses ────────────────────────────────────────────────────────────
export async function saveAnalysis(payload) {
  const { data, error } = await supabase.from('analyses').insert([payload]).select();
  return { data, error };
}

export async function getAnalyses(limit = 20) {
  const { data } = await supabase
    .from('analyses').select('*')
    .order('analysed_at', { ascending: false })
    .limit(limit);
  return data || [];
}

// ── Full deep analysis — BG + Food + Workouts ─────────────────────────────────
export async function getFullAnalysis(days = 14) {
  const since = fromDay(days);
  const thisWeek = fromDay(7);
  const lastWeek = fromDay(14);

  const [vitalsR, mealsR, workoutsR] = await Promise.all([
    supabase.from('vitals').select('*').gte('date', since).order('date').order('time', { nullsFirst: false }),
    supabase.from('meals').select('*').gte('date', since).order('date').order('time', { nullsFirst: false }),
    supabase.from('workouts').select('*').gte('date', since).order('date'),
  ]);

  const vitals   = vitalsR.data   || [];
  const meals    = mealsR.data    || [];
  const workouts = workoutsR.data || [];

  // ── BG analysis ──
  const bgRows     = vitals.filter(v => v.blood_glucose);
  const bgThis     = bgRows.filter(r => r.date >= thisWeek).map(r => +r.blood_glucose);
  const bgLast     = bgRows.filter(r => r.date < thisWeek).map(r => +r.blood_glucose);
  const avgBgThis  = avg(bgThis);
  const avgBgLast  = avg(bgLast);

  // ── Weight ──
  const wRows = vitals.filter(v => v.weight_kg).map(v => +v.weight_kg);
  const latestWeight = wRows.at(-1) || null;
  const firstWeight  = wRows[0] || null;

  // ── Workouts ──
  const wkThis  = workouts.filter(w => w.date >= thisWeek && w.type !== 'rest');
  const wkLast  = workouts.filter(w => w.date < thisWeek && w.type !== 'rest');
  const bgDrops = workouts.filter(w => w.pre_bg && w.post_bg).map(w => +((+w.pre_bg) - (+w.post_bg)).toFixed(1));
  const typeCount = {};
  workouts.forEach(w => { typeCount[w.type] = (typeCount[w.type] || 0) + 1; });

  // ── Food habit analysis ──
  // 1. Meal type frequency
  const mealTypeCount = {};
  meals.forEach(m => { mealTypeCount[m.meal_type] = (mealTypeCount[m.meal_type] || 0) + 1; });

  // 2. Food frequency — parse food_items into individual items
  const foodCount = {};
  meals.forEach(m => {
    if (!m.food_items) return;
    const items = m.food_items.split(/,|;|\+|and/i).map(f => f.trim().toLowerCase()).filter(f => f.length > 2);
    items.forEach(f => { foodCount[f] = (foodCount[f] || 0) + 1; });
  });
  const topFoods = Object.entries(foodCount).sort((a,b) => b[1]-a[1]).slice(0, 10);

  // 3. Meal timing — late dinners (after 21:00)
  const dinners = meals.filter(m => m.meal_type === 'dinner' && m.time);
  const lateDinners = dinners.filter(m => m.time >= '21:00');
  const lateDinnerPct = dinners.length ? Math.round((lateDinners.length / dinners.length) * 100) : null;

  // 4. Breakfast skip rate
  const loggedDates = [...new Set(meals.map(m => m.date))];
  const breakfastDates = new Set(meals.filter(m => m.meal_type === 'breakfast').map(m => m.date));
  const breakfastSkipRate = loggedDates.length
    ? Math.round(((loggedDates.length - breakfastDates.size) / loggedDates.length) * 100) : null;

  // 5. Avg calories (days with calorie data)
  const calDays = {};
  meals.filter(m => m.calories).forEach(m => {
    calDays[m.date] = (calDays[m.date] || 0) + (+m.calories);
  });
  const calVals = Object.values(calDays);
  const avgCalories = avg(calVals);

  // 6. Pre/post gym meals compliance
  const gymDays = new Set(workouts.filter(w => w.type.startsWith('gym_')).map(w => w.date));
  const preGymMeals  = meals.filter(m => m.meal_type === 'pre_gym' && gymDays.has(m.date)).length;
  const postGymMeals = meals.filter(m => m.meal_type === 'post_gym' && gymDays.has(m.date)).length;
  const gymDayCount  = gymDays.size;

  // 7. Bad foods detection (foods known to spike BG)
  const badFoods = ['chicken bun', 'bun', 'white rice', 'fried', 'sugar', 'sweet', 'biscuit', 'juice', 'cake', 'chocolate', 'chips', 'soda'];
  const flaggedFoods = [];
  meals.forEach(m => {
    if (!m.food_items) return;
    const lower = m.food_items.toLowerCase();
    badFoods.forEach(b => { if (lower.includes(b) && !flaggedFoods.includes(b)) flaggedFoods.push(b); });
  });

  // 8. Meal days logged this week
  const mealDaysThis = new Set(meals.filter(m => m.date >= thisWeek).map(m => m.date)).size;
  const mealDaysLast = new Set(meals.filter(m => m.date < thisWeek).map(m => m.date)).size;

  return {
    period: { since, days },
    vitals,
    meals,
    workouts,
    bg: {
      rows:    bgRows,
      avgThis: avgBgThis,
      avgLast: avgBgLast,
      trend:   trend(avgBgThis, avgBgLast, 'lower'),
      best:    bgThis.length ? Math.min(...bgThis) : null,
      worst:   bgThis.length ? Math.max(...bgThis) : null,
      allVals: bgRows.map(r => ({ date: r.date, time: r.time, val: +r.blood_glucose })),
    },
    weight: {
      latest:  latestWeight,
      first:   firstWeight,
      change:  latestWeight && firstWeight ? +(latestWeight - firstWeight).toFixed(1) : null,
      trend:   trend(latestWeight, firstWeight, 'lower'),
      rows:    vitals.filter(v=>v.weight_kg).map(v=>({ date: v.date, val: +v.weight_kg })),
    },
    workouts_: {
      thisWeek: wkThis.length,
      lastWeek: wkLast.length,
      target:   4,
      typeBreakdown: typeCount,
      bgDrops,
      avgBgDrop: avg(bgDrops),
      rows:     workouts,
    },
    food: {
      mealTypeCount,
      topFoods,
      lateDinners:      lateDinners.length,
      totalDinners:     dinners.length,
      lateDinnerPct,
      breakfastSkipRate,
      avgCalories,
      preGymCompliance:  gymDayCount ? Math.round((preGymMeals/gymDayCount)*100) : null,
      postGymCompliance: gymDayCount ? Math.round((postGymMeals/gymDayCount)*100) : null,
      gymDayCount,
      flaggedFoods,
      mealDaysThis,
      mealDaysLast,
      totalMeals: meals.length,
      rows: meals,
    },
  };
}
