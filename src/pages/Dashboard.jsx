import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import {
  LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip,
  ResponsiveContainer, ReferenceLine, Legend,
} from 'recharts';
import { format, subDays, eachDayOfInterval, parseISO } from 'date-fns';
import { getSummary, getVitals, getWorkoutHeatmap, getMealsToday } from '../lib/supabase.js';

const WORKOUT_COLORS = {
  gym_push:        { bg:'#D5E8F4', label:'Push',       dot:'#2E6DA4' },
  gym_pull:        { bg:'#C8E6DC', label:'Pull',       dot:'#1D6A3A' },
  gym_legs:        { bg:'#E8D8F0', label:'Legs',       dot:'#7B3FA0' },
  gym_metabolic:   { bg:'#FEF3D0', label:'Metabolic',  dot:'#E67E22' },
  gym_upper:       { bg:'#D5E8F4', label:'Upper',      dot:'#2E6DA4' },
  home_resistance: { bg:'#C8E6DC', label:'Home Gym',   dot:'#1D6A3A' },
  home_cardio:     { bg:'#FEF3D0', label:'Cardio',     dot:'#E67E22' },
  football:        { bg:'#D8EFDF', label:'Football',   dot:'#27AE60' },
  badminton:       { bg:'#D8EFDF', label:'Badminton',  dot:'#27AE60' },
};

function workoutMeta(types) {
  if (!types?.length) return null;
  return WORKOUT_COLORS[types[0]] || { bg:'#D5E8F4', label:types[0], dot:'#2E6DA4' };
}

function StatCard({ icon, label, value, sub, color='text-brand-700' }) {
  return (
    <div className="stat-card">
      <div className="flex items-center gap-2 text-gray-500 text-sm font-medium"><span>{icon}</span>{label}</div>
      <div className={`text-2xl font-bold ${color}`}>{value ?? '—'}</div>
      {sub && <div className="text-xs text-gray-400">{sub}</div>}
    </div>
  );
}

function bgColor(v) {
  if (v == null) return 'text-gray-400';
  if (v > 10)  return 'text-health-red';
  if (v > 7)   return 'text-health-amber';
  return 'text-health-green';
}

function WorkoutHeatmap({ heatmap }) {
  const today = new Date();
  const days = eachDayOfInterval({ start: subDays(today, 83), end: today });
  const weeks = [];
  let week = [];
  days.forEach((d, i) => {
    week.push(d);
    if (d.getDay() === 6 || i === days.length - 1) { weeks.push(week); week = []; }
  });
  return (
    <div>
      <div className="flex gap-1 flex-wrap">
        {weeks.map((wk, wi) => (
          <div key={wi} className="flex flex-col gap-1">
            {wk.map(d => {
              const key = format(d, 'yyyy-MM-dd');
              const meta = workoutMeta(heatmap[key]);
              const isFuture = d > today;
              return (
                <div key={key}
                  title={`${key}${meta ? ' — '+meta.label : ' — No workout'}`}
                  className="w-4 h-4 rounded-sm transition-transform hover:scale-125 cursor-default"
                  style={{ backgroundColor: isFuture?'transparent':meta?meta.bg:'#F0F0F0', border: isFuture?'none':'1px solid #E5E7EB' }}
                />
              );
            })}
          </div>
        ))}
      </div>
      <div className="flex gap-3 mt-3 flex-wrap">
        {Object.entries(WORKOUT_COLORS).slice(0,6).map(([k,v]) => (
          <span key={k} className="flex items-center gap-1 text-xs text-gray-500">
            <span className="w-3 h-3 rounded-sm inline-block" style={{backgroundColor:v.bg,border:'1px solid #E5E7EB'}} />{v.label}
          </span>
        ))}
        <span className="flex items-center gap-1 text-xs text-gray-500">
          <span className="w-3 h-3 rounded-sm inline-block bg-gray-100 border border-gray-200" />No workout
        </span>
      </div>
    </div>
  );
}

function BGTooltip({ active, payload, label }) {
  if (!active || !payload?.length) return null;
  return (
    <div className="bg-white border border-gray-200 rounded-xl shadow-lg px-3 py-2 text-sm">
      <div className="font-semibold text-gray-700">{label}</div>
      {payload.map(p=>(
        <div key={p.name} style={{color:p.color}}>{p.name}: <b>{p.value} {p.name==='BG'?'mmol/L':'kg'}</b></div>
      ))}
    </div>
  );
}

function EmptyState({ icon, msg, link, linkLabel }) {
  return (
    <div className="flex flex-col items-center justify-center py-10 text-gray-400">
      <div className="text-4xl mb-2">{icon}</div>
      <div className="text-sm mb-3">{msg}</div>
      <Link to={link} className="btn-primary text-sm py-1.5 px-4">{linkLabel}</Link>
    </div>
  );
}

function getTimeOfDay() {
  const h = new Date().getHours();
  return h < 12 ? 'morning' : h < 17 ? 'afternoon' : 'evening';
}

const MEAL_LABELS = {
  breakfast:'🌅 Breakfast', lunch:'☀️ Lunch', dinner:'🌙 Dinner',
  snack:'🍎 Snack', pre_gym:'💪 Pre-Gym', post_gym:'🥛 Post-Gym',
};

export default function Dashboard() {
  const [summary, setSummary] = useState(null);
  const [vitals,  setVitals]  = useState([]);
  const [heatmap, setHeatmap] = useState({});
  const [meals,   setMeals]   = useState([]);
  const [loading, setLoading] = useState(true);
  const [error,   setError]   = useState(null);

  useEffect(() => {
    Promise.all([getSummary(), getVitals(60), getWorkoutHeatmap(84), getMealsToday()])
      .then(([sum, v, hm, m]) => { setSummary(sum); setVitals(v); setHeatmap(hm); setMeals(m); })
      .catch(e => setError(e.message))
      .finally(() => setLoading(false));
  }, []);

  if (loading) return (
    <div className="flex items-center justify-center h-64 text-gray-400">
      <div className="text-center"><div className="text-4xl mb-3">💪</div><div className="text-sm">Loading…</div></div>
    </div>
  );

  if (error) return (
    <div className="card bg-health-redBg border-red-200 text-health-red text-sm">
      ⚠️ Could not load data. Check your Supabase connection: {error}
    </div>
  );

  const bgChartData    = vitals.filter(v=>v.blood_glucose).map(v=>({ date:format(parseISO(v.date),'dd MMM'), BG:v.blood_glucose }));
  const weightChartData = vitals.filter(v=>v.weight_kg).map(v=>({ date:format(parseISO(v.date),'dd MMM'), Weight:v.weight_kg, Waist:v.waist_cm }));

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div>
          <h1 className="text-2xl font-bold text-brand-700">Good {getTimeOfDay()}, Mithun 👋</h1>
          <p className="text-gray-500 text-sm">{format(new Date(),'EEEE, d MMMM yyyy')}</p>
        </div>
        <div className="flex gap-2 flex-wrap">
          <Link to="/log/vitals"  className="btn-primary text-sm py-2 px-3">+ Vitals</Link>
          <Link to="/log/meal"    className="btn-secondary text-sm py-2 px-3">+ Meal</Link>
          <Link to="/log/workout" className="btn-secondary text-sm py-2 px-3">+ Workout</Link>
        </div>
      </div>

      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        <StatCard icon="🩸" label="Blood Glucose"
          value={summary?.latest_bg ?? '—'}
          sub={summary?.latest_bg ? `mmol/L · ${summary.vitals_date||''}` : 'Not logged yet'}
          color={bgColor(summary?.latest_bg)} />
        <StatCard icon="⚖️" label="Weight"
          value={summary?.latest_weight ? `${summary.latest_weight} kg` : '—'}
          sub={summary?.latest_waist ? `Waist: ${summary.latest_waist} cm` : 'Not logged yet'}
          color="text-brand-700" />
        <StatCard icon="🏋️" label="Workouts This Week"
          value={summary?.workouts_this_week ?? 0}
          sub="sessions in last 7 days"
          color={summary?.workouts_this_week >= 4 ? 'text-health-green' : 'text-health-amber'} />
        <StatCard icon="🔥" label="Streak"
          value={`${summary?.workout_streak ?? 0} days`}
          sub={summary?.latest_hba1c ? `HbA1c: ${summary.latest_hba1c}%` : 'Keep going!'}
          color="text-orange-500" />
      </div>

      <div className="card">
        <h2 className="text-base font-semibold text-brand-700 mb-4">🩸 Blood Glucose — Last 60 Days</h2>
        {bgChartData.length === 0
          ? <EmptyState icon="🩸" msg="No blood glucose readings yet" link="/log/vitals" linkLabel="Log your first reading" />
          : <ResponsiveContainer width="100%" height={220}>
              <LineChart data={bgChartData} margin={{top:5,right:10,left:0,bottom:5}}>
                <CartesianGrid strokeDasharray="3 3" stroke="#F0F0F0" />
                <XAxis dataKey="date" tick={{fontSize:11}} />
                <YAxis domain={[3,16]} tick={{fontSize:11}} />
                <Tooltip content={<BGTooltip />} />
                <ReferenceLine y={4}  stroke="#1D6A3A" strokeDasharray="4 2" label={{value:'Low 4', fontSize:10,fill:'#1D6A3A'}} />
                <ReferenceLine y={7}  stroke="#1D6A3A" strokeDasharray="4 2" label={{value:'Target 7',fontSize:10,fill:'#1D6A3A'}} />
                <ReferenceLine y={10} stroke="#8B1A1A" strokeDasharray="4 2" label={{value:'High 10',fontSize:10,fill:'#8B1A1A'}} />
                <Line type="monotone" dataKey="BG" name="BG" stroke="#2E6DA4" strokeWidth={2} dot={{r:4,fill:'#2E6DA4'}} connectNulls />
              </LineChart>
            </ResponsiveContainer>
        }
        <p className="text-xs text-gray-400 mt-2">Target range 4–7 mmol/L. HbA1c: {summary?.latest_hba1c ? `${summary.latest_hba1c}%` : 'not logged'}. Target &lt;7%.</p>
      </div>

      <div className="card">
        <h2 className="text-base font-semibold text-brand-700 mb-4">⚖️ Weight & Waist Trend</h2>
        {weightChartData.length === 0
          ? <EmptyState icon="⚖️" msg="No weight data yet" link="/log/vitals" linkLabel="Log your weight" />
          : <ResponsiveContainer width="100%" height={220}>
              <LineChart data={weightChartData} margin={{top:5,right:10,left:0,bottom:5}}>
                <CartesianGrid strokeDasharray="3 3" stroke="#F0F0F0" />
                <XAxis dataKey="date" tick={{fontSize:11}} />
                <YAxis yAxisId="w" domain={['auto','auto']} tick={{fontSize:11}} />
                <YAxis yAxisId="c" orientation="right" domain={['auto','auto']} tick={{fontSize:11}} />
                <Tooltip content={<BGTooltip />} />
                <Legend wrapperStyle={{fontSize:12}} />
                <Line yAxisId="w" type="monotone" dataKey="Weight" name="Weight (kg)" stroke="#2E6DA4" strokeWidth={2} dot={{r:3}} connectNulls />
                <Line yAxisId="c" type="monotone" dataKey="Waist"  name="Waist (cm)"  stroke="#E67E22" strokeWidth={2} dot={{r:3}} connectNulls strokeDasharray="5 3" />
              </LineChart>
            </ResponsiveContainer>
        }
        <p className="text-xs text-gray-400 mt-2">Goal: lose 8–10 kg. Waist target &lt;90 cm.</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="card">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-base font-semibold text-brand-700">🏋️ Workout Activity — 12 Weeks</h2>
            <Link to="/log/workout" className="text-xs text-brand-500 hover:underline">+ Log</Link>
          </div>
          <WorkoutHeatmap heatmap={heatmap} />
          <p className="text-xs text-gray-400 mt-3">Hover for session details. Aim 4+ sessions/week.</p>
        </div>

        <div className="card">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-base font-semibold text-brand-700">🍽️ Today's Meals</h2>
            <Link to="/log/meal" className="text-xs text-brand-500 hover:underline">+ Add</Link>
          </div>
          {meals.length === 0
            ? <EmptyState icon="🍽️" msg="No meals logged today" link="/log/meal" linkLabel="Log your first meal" />
            : <div className="space-y-2">
                {meals.map(m => (
                  <div key={m.id} className="flex items-start gap-3 p-2.5 bg-gray-50 rounded-xl">
                    <div className="text-lg">{MEAL_LABELS[m.meal_type]?.split(' ')[0]||'🍽️'}</div>
                    <div className="flex-1 min-w-0">
                      <div className="text-xs font-semibold text-brand-600 uppercase tracking-wide">
                        {MEAL_LABELS[m.meal_type]?.replace(/^\S+\s/,'')||m.meal_type}
                        {m.time && <span className="text-gray-400 font-normal ml-1">· {m.time}</span>}
                      </div>
                      <div className="text-sm text-gray-700 truncate">{m.food_items}</div>
                      {m.calories && <div className="text-xs text-gray-400">{m.calories} kcal</div>}
                    </div>
                  </div>
                ))}
              </div>
          }
        </div>
      </div>

      <div className="card bg-brand-50 border-brand-200">
        <div className="flex items-center gap-3 text-sm text-brand-700">
          <span className="text-2xl">⚠️</span>
          <div><span className="font-semibold">Pre-gym: </span>Check BG before every session. Below 5 → eat banana first. Above 13 → light treadmill only, no weights.</div>
        </div>
      </div>
    </div>
  );
}
