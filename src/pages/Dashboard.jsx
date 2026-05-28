import { useEffect, useState, useCallback } from 'react';
import { Link, useLocation } from 'react-router-dom';
import {
  LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip,
  ResponsiveContainer, ReferenceLine, Legend,
} from 'recharts';
import { format, subDays, eachDayOfInterval, parseISO } from 'date-fns';
import {
  getSummary, getVitals, getWorkoutHeatmap, getMealsToday,
  getAnalysis, isConfigured,
} from '../lib/supabase.js';

// ── Workout heatmap colours ───────────────────────────────────────────────────
const WORKOUT_COLORS = {
  gym_push:        { bg:'#D5E8F4', label:'Push'       },
  gym_pull:        { bg:'#C8E6DC', label:'Pull'       },
  gym_legs:        { bg:'#E8D8F0', label:'Legs'       },
  gym_metabolic:   { bg:'#FEF3D0', label:'Metabolic'  },
  gym_upper:       { bg:'#D5E8F4', label:'Upper'      },
  home_resistance: { bg:'#C8E6DC', label:'Home Gym'   },
  home_cardio:     { bg:'#FEF3D0', label:'Cardio'     },
  football:        { bg:'#D8EFDF', label:'Football'   },
  badminton:       { bg:'#D8EFDF', label:'Badminton'  },
};
const workoutMeta = (types) => types?.length ? (WORKOUT_COLORS[types[0]] || { bg:'#D5E8F4', label:types[0] }) : null;

const MEAL_LABELS = {
  breakfast:'🌅 Breakfast', lunch:'☀️ Lunch', dinner:'🌙 Dinner',
  snack:'🍎 Snack', pre_gym:'💪 Pre-Gym', post_gym:'🥛 Post-Gym',
};

// ── Trend helpers ─────────────────────────────────────────────────────────────
function TrendBadge({ trend, changeLabel }) {
  if (!trend || trend === 'nodata') return <span className="text-xs text-gray-400">No comparison data</span>;
  const cfg = {
    improved:  { bg:'bg-health-greenBg', text:'text-health-green', arrow:'↑', label:'Improving' },
    regressed: { bg:'bg-health-redBg',   text:'text-health-red',   arrow:'↓', label:'Declining' },
    stable:    { bg:'bg-gray-100',       text:'text-gray-500',     arrow:'→', label:'Stable'    },
  }[trend];
  return (
    <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-semibold ${cfg.bg} ${cfg.text}`}>
      {cfg.arrow} {changeLabel || cfg.label}
    </span>
  );
}

function bgColor(v) {
  if (v == null) return 'text-gray-400';
  if (v > 10) return 'text-health-red';
  if (v > 7)  return 'text-health-amber';
  return 'text-health-green';
}

function getTimeOfDay() {
  const h = new Date().getHours();
  return h < 12 ? 'morning' : h < 17 ? 'afternoon' : 'evening';
}

// ── Analysis card ─────────────────────────────────────────────────────────────
function AnalysisPanel({ analysis }) {
  if (!analysis) return null;
  const { bg, weight, workouts, meals, exercise } = analysis;

  const items = [
    {
      icon: '🩸',
      label: 'Blood Glucose',
      value: bg.thisWeek ? `Avg ${bg.thisWeek} mmol/L this week` : 'No readings this week',
      sub: bg.lastWeek ? `Last week avg: ${bg.lastWeek} mmol/L` : null,
      trend: bg.trend,
      changeLabel: bg.change != null ? `${bg.change > 0 ? '+' : ''}${bg.change} vs last week` : null,
      detail: bg.worst > 10 ? `⚠️ High reading: ${bg.worst} mmol/L` : bg.best ? `✅ Best: ${bg.best} mmol/L` : null,
      detailColor: bg.worst > 10 ? 'text-health-red' : 'text-health-green',
    },
    {
      icon: '⚖️',
      label: 'Weight',
      value: weight.latest ? `${weight.latest} kg` : 'No weight logged',
      sub: weight.waist ? `Waist: ${weight.waist} cm` : null,
      trend: weight.trend,
      changeLabel: weight.change != null ? `${weight.change > 0 ? '+' : ''}${weight.change} kg` : null,
      detail: weight.change < 0 ? `🎉 Lost ${Math.abs(weight.change)} kg since last entry!` : weight.change > 0 ? `📈 Gained ${weight.change} kg — check diet` : null,
      detailColor: weight.change < 0 ? 'text-health-green' : 'text-health-amber',
    },
    {
      icon: '🏋️',
      label: 'Training',
      value: `${workouts.thisWeek} sessions this week`,
      sub: `Last week: ${workouts.lastWeek} sessions`,
      trend: workouts.trend,
      changeLabel: workouts.change !== 0 ? `${workouts.change > 0 ? '+' : ''}${workouts.change} vs last week` : 'Same as last week',
      detail: workouts.thisWeek < workouts.target
        ? `🎯 ${workouts.target - workouts.thisWeek} more session${workouts.target - workouts.thisWeek > 1 ? 's' : ''} needed to hit weekly target`
        : `✅ Weekly target of ${workouts.target} sessions hit!`,
      detailColor: workouts.thisWeek >= workouts.target ? 'text-health-green' : 'text-health-amber',
    },
    {
      icon: '🍽️',
      label: 'Meal Logging',
      value: `${meals.daysLoggedThisWeek}/7 days logged this week`,
      sub: `Last week: ${meals.daysLoggedLastWeek}/7 days`,
      trend: meals.trend,
      changeLabel: meals.daysLoggedThisWeek > meals.daysLoggedLastWeek ? 'More consistent' : meals.daysLoggedThisWeek < meals.daysLoggedLastWeek ? 'Less consistent' : 'Same',
      detail: meals.daysLoggedThisWeek < 5 ? '💡 Log meals daily — patterns reveal BG triggers' : '✅ Good logging consistency!',
      detailColor: meals.daysLoggedThisWeek >= 5 ? 'text-health-green' : 'text-health-amber',
    },
  ];

  return (
    <div className="card">
      <h2 className="text-base font-bold text-brand-700 mb-4">📈 This Week vs Last Week</h2>
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        {items.map(item => (
          <div key={item.label} className="bg-gray-50 rounded-xl p-4 space-y-2">
            <div className="flex items-center justify-between gap-2 flex-wrap">
              <div className="flex items-center gap-2">
                <span className="text-lg">{item.icon}</span>
                <span className="text-sm font-semibold text-brand-700">{item.label}</span>
              </div>
              <TrendBadge trend={item.trend} changeLabel={item.changeLabel} />
            </div>
            <div className="text-sm font-bold text-gray-800">{item.value}</div>
            {item.sub && <div className="text-xs text-gray-400">{item.sub}</div>}
            {item.detail && <div className={`text-xs font-medium ${item.detailColor}`}>{item.detail}</div>}
          </div>
        ))}
      </div>

      {/* Exercise BG response */}
      {exercise.sessions > 0 && (
        <div className="mt-4 p-3 bg-brand-50 rounded-xl flex gap-3 items-center">
          <span className="text-2xl">💉</span>
          <div>
            <div className="text-sm font-semibold text-brand-700">Exercise BG Response</div>
            <div className="text-xs text-brand-600">
              Across {exercise.sessions} logged session{exercise.sessions > 1 ? 's' : ''}, your blood glucose drops an average of{' '}
              <b>{exercise.avgBgDrop} mmol/L</b> per workout.
              {exercise.avgBgDrop >= 2 ? ' 🎉 Excellent insulin response!' : ' Keep consistent for bigger drops.'}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

// ── Goal Progress ─────────────────────────────────────────────────────────────
function GoalProgress({ summary, analysis }) {
  if (!summary || !analysis) return null;

  const goals = [
    {
      label: 'HbA1c', icon: '🩸',
      current: summary.latest_hba1c,
      target: 7.0,
      unit: '%',
      format: v => `${v}%`,
      progress: summary.latest_hba1c ? Math.min(100, Math.round(((8.9 - summary.latest_hba1c) / (8.9 - 7.0)) * 100)) : 0,
      better: 'lower',
      start: 8.9,
    },
    {
      label: 'Weight', icon: '⚖️',
      current: analysis.weight.latest,
      target: (analysis.weight.latest || 78) - 8,
      unit: 'kg',
      format: v => `${v} kg`,
      progress: analysis.weight.latest ? Math.min(100, Math.round(((78 - analysis.weight.latest) / 8) * 100)) : 0,
      better: 'lower',
      start: 78,
    },
    {
      label: 'Weekly Workouts', icon: '🏋️',
      current: analysis.workouts.thisWeek,
      target: 4,
      unit: 'sessions',
      format: v => `${v} sessions`,
      progress: Math.min(100, Math.round((analysis.workouts.thisWeek / 4) * 100)),
      better: 'higher',
      start: 0,
    },
    {
      label: 'Daily BG Avg', icon: '📉',
      current: analysis.bg.thisWeek,
      target: 7.0,
      unit: 'mmol/L',
      format: v => `${v} mmol/L`,
      progress: analysis.bg.thisWeek ? Math.min(100, Math.round(((12 - analysis.bg.thisWeek) / (12 - 7)) * 100)) : 0,
      better: 'lower',
      start: 12,
    },
  ];

  return (
    <div className="card">
      <h2 className="text-base font-bold text-brand-700 mb-4">🎯 Goal Progress</h2>
      <div className="space-y-4">
        {goals.map(g => {
          const onTrack = g.better === 'lower'
            ? (g.current != null && g.current <= g.target)
            : (g.current != null && g.current >= g.target);
          const barColor = onTrack ? 'bg-health-green' : g.progress > 50 ? 'bg-amber-400' : 'bg-red-400';

          return (
            <div key={g.label}>
              <div className="flex items-center justify-between mb-1.5">
                <div className="flex items-center gap-2">
                  <span>{g.icon}</span>
                  <span className="text-sm font-medium text-gray-700">{g.label}</span>
                </div>
                <div className="text-xs text-gray-500">
                  {g.current != null ? g.format(g.current) : '—'} → target {g.format(g.target)}
                </div>
              </div>
              <div className="h-2.5 bg-gray-100 rounded-full overflow-hidden">
                <div
                  className={`h-full rounded-full transition-all duration-700 ${barColor}`}
                  style={{ width: `${Math.max(2, g.progress)}%` }}
                />
              </div>
              <div className="flex justify-between mt-1">
                <span className="text-xs text-gray-400">{g.progress}% to goal</span>
                {onTrack && <span className="text-xs text-health-green font-semibold">✅ On track!</span>}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

// ── Workout Heatmap ───────────────────────────────────────────────────────────
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
                <div key={key} title={`${key}${meta ? ' — '+meta.label : ' — Rest'}`}
                  className="w-4 h-4 rounded-sm transition-transform hover:scale-125 cursor-default"
                  style={{ backgroundColor: isFuture?'transparent':meta?meta.bg:'#F0F0F0', border:isFuture?'none':'1px solid #E5E7EB' }}
                />
              );
            })}
          </div>
        ))}
      </div>
      <div className="flex gap-3 mt-2 flex-wrap">
        {Object.entries(WORKOUT_COLORS).slice(0,5).map(([k,v])=>(
          <span key={k} className="flex items-center gap-1 text-xs text-gray-500">
            <span className="w-3 h-3 rounded-sm inline-block" style={{backgroundColor:v.bg,border:'1px solid #E5E7EB'}}/>{v.label}
          </span>
        ))}
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
        <div key={p.name} style={{color:p.color}}>{p.name}: <b>{p.value}{p.name==='BG'?' mmol/L':' kg'}</b></div>
      ))}
    </div>
  );
}

function EmptyState({ icon, msg, link, linkLabel }) {
  return (
    <div className="flex flex-col items-center justify-center py-8 text-gray-400">
      <div className="text-3xl mb-2">{icon}</div>
      <div className="text-sm mb-3">{msg}</div>
      <Link to={link} className="btn-primary text-sm py-1.5 px-4">{linkLabel}</Link>
    </div>
  );
}

// ── Main Dashboard ────────────────────────────────────────────────────────────
export default function Dashboard() {
  const [summary,  setSummary]  = useState(null);
  const [vitals,   setVitals]   = useState([]);
  const [heatmap,  setHeatmap]  = useState({});
  const [meals,    setMeals]    = useState([]);
  const [analysis, setAnalysis] = useState(null);
  const [loading,  setLoading]  = useState(true);
  const [lastRefresh, setLastRefresh] = useState(null);
  const location = useLocation();

  const loadAll = useCallback(async () => {
    setLoading(true);
    try {
      const [sum, v, hm, m, an] = await Promise.all([
        getSummary(), getVitals(60), getWorkoutHeatmap(84), getMealsToday(), getAnalysis(),
      ]);
      setSummary(sum); setVitals(v); setHeatmap(hm); setMeals(m); setAnalysis(an);
      setLastRefresh(new Date());
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  }, []);

  // Reload every time user navigates back to dashboard
  useEffect(() => { if (isConfigured()) loadAll(); else setLoading(false); }, [location.pathname, loadAll]);

  // Auto-refresh every 5 minutes
  useEffect(() => {
    if (!isConfigured()) return;
    const t = setInterval(loadAll, 5 * 60 * 1000);
    return () => clearInterval(t);
  }, [loadAll]);

  if (!isConfigured()) return (
    <div className="space-y-4">
      <div className="card bg-health-amberBg border-amber-200">
        <div className="flex gap-3 text-health-amber">
          <span className="text-2xl">⚙️</span>
          <div>
            <div className="font-bold text-sm mb-1">Supabase not connected yet</div>
            <div className="text-xs">Add VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY to GitHub repo secrets, then re-run the workflow. Your <Link to="/plans" className="underline font-semibold">📋 Plans page</Link> works now!</div>
          </div>
        </div>
      </div>
    </div>
  );

  if (loading) return (
    <div className="flex items-center justify-center h-64 text-gray-400">
      <div className="text-center"><div className="text-4xl mb-3">💪</div><div className="text-sm">Loading your data…</div></div>
    </div>
  );

  const bgChartData     = vitals.filter(v=>v.blood_glucose).map(v=>({ date:format(parseISO(v.date),'dd MMM'), BG:v.blood_glucose }));
  const weightChartData = vitals.filter(v=>v.weight_kg).map(v=>({ date:format(parseISO(v.date),'dd MMM'), Weight:v.weight_kg, Waist:v.waist_cm }));

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div>
          <h1 className="text-2xl font-bold text-brand-700">Good {getTimeOfDay()}, Mithun 👋</h1>
          <p className="text-gray-500 text-sm">
            {format(new Date(), 'EEEE, d MMMM yyyy')}
            {lastRefresh && <span className="ml-2 text-gray-300">· Updated {format(lastRefresh, 'HH:mm')}</span>}
          </p>
        </div>
        <div className="flex gap-2 flex-wrap">
          <button onClick={loadAll} className="btn-secondary text-sm py-2 px-3">🔄 Refresh</button>
          <Link to="/log/vitals"  className="btn-primary text-sm py-2 px-3">+ Vitals</Link>
          <Link to="/log/meal"    className="btn-secondary text-sm py-2 px-3">+ Meal</Link>
          <Link to="/log/workout" className="btn-secondary text-sm py-2 px-3">+ Workout</Link>
        </div>
      </div>

      {/* Quick Stat Cards */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        {[
          {
            icon:'🩸', label:'Blood Glucose',
            value: summary?.latest_bg ?? '—',
            unit: summary?.latest_bg ? 'mmol/L' : '',
            sub: analysis?.bg.thisWeek ? `7-day avg: ${analysis.bg.thisWeek} mmol/L` : summary?.vitals_date || 'Not logged',
            color: bgColor(summary?.latest_bg),
            trend: analysis?.bg.trend,
            trendLabel: analysis?.bg.change != null ? `${analysis.bg.change > 0 ? '+' : ''}${analysis.bg.change} this week` : null,
          },
          {
            icon:'⚖️', label:'Weight',
            value: summary?.latest_weight ? `${summary.latest_weight} kg` : '—',
            sub: summary?.latest_waist ? `Waist: ${summary.latest_waist} cm` : 'Not logged',
            color: 'text-brand-700',
            trend: analysis?.weight.trend,
            trendLabel: analysis?.weight.change != null ? `${analysis.weight.change > 0 ? '+' : ''}${analysis.weight.change} kg` : null,
          },
          {
            icon:'🏋️', label:'Workouts',
            value: summary?.workouts_this_week ?? 0,
            sub: 'sessions this week',
            color: (summary?.workouts_this_week || 0) >= 4 ? 'text-health-green' : 'text-health-amber',
            trend: analysis?.workouts.trend,
            trendLabel: `${analysis?.workouts.thisWeek || 0}/4 target`,
          },
          {
            icon:'🔥', label:'Streak',
            value: `${summary?.workout_streak ?? 0} days`,
            sub: summary?.latest_hba1c ? `HbA1c: ${summary.latest_hba1c}%` : 'Keep going!',
            color: 'text-orange-500',
            trend: (summary?.workout_streak || 0) >= 3 ? 'improved' : 'stable',
            trendLabel: (summary?.workout_streak || 0) >= 3 ? 'On a roll!' : 'Build streak',
          },
        ].map(card => (
          <div key={card.label} className="stat-card">
            <div className="flex items-center gap-1.5 text-gray-500 text-xs font-medium"><span>{card.icon}</span>{card.label}</div>
            <div className={`text-2xl font-bold ${card.color}`}>{card.value}</div>
            <div className="text-xs text-gray-400">{card.sub}</div>
            <TrendBadge trend={card.trend} changeLabel={card.trendLabel} />
          </div>
        ))}
      </div>

      {/* Smart Analysis Panel */}
      <AnalysisPanel analysis={analysis} />

      {/* Goal Progress */}
      <GoalProgress summary={summary} analysis={analysis} />

      {/* BG Chart */}
      <div className="card">
        <h2 className="text-base font-semibold text-brand-700 mb-1">🩸 Blood Glucose — Last 60 Days</h2>
        {analysis?.bg.thisWeek && (
          <p className="text-xs text-gray-500 mb-3">
            This week avg: <b className={bgColor(analysis.bg.thisWeek)}>{analysis.bg.thisWeek} mmol/L</b>
            {analysis.bg.lastWeek && <> · Last week: <b>{analysis.bg.lastWeek} mmol/L</b></>}
            {analysis.bg.change != null && (
              <span className={analysis.bg.change < 0 ? 'text-health-green' : 'text-health-red'}>
                {' '}({analysis.bg.change > 0 ? '+' : ''}{analysis.bg.change} change)
              </span>
            )}
          </p>
        )}
        {bgChartData.length === 0
          ? <EmptyState icon="🩸" msg="No blood glucose readings yet" link="/log/vitals" linkLabel="Log your first reading" />
          : <ResponsiveContainer width="100%" height={220}>
              <LineChart data={bgChartData} margin={{top:5,right:10,left:0,bottom:5}}>
                <CartesianGrid strokeDasharray="3 3" stroke="#F0F0F0" />
                <XAxis dataKey="date" tick={{fontSize:11}} />
                <YAxis domain={[3,16]} tick={{fontSize:11}} />
                <Tooltip content={<BGTooltip />} />
                <ReferenceLine y={4}  stroke="#1D6A3A" strokeDasharray="4 2" label={{value:'Low 4',  fontSize:10, fill:'#1D6A3A'}} />
                <ReferenceLine y={7}  stroke="#1D6A3A" strokeDasharray="4 2" label={{value:'Target 7',fontSize:10, fill:'#1D6A3A'}} />
                <ReferenceLine y={10} stroke="#8B1A1A" strokeDasharray="4 2" label={{value:'High 10', fontSize:10, fill:'#8B1A1A'}} />
                <Line type="monotone" dataKey="BG" name="BG" stroke="#2E6DA4" strokeWidth={2} dot={{r:4,fill:'#2E6DA4'}} connectNulls />
              </LineChart>
            </ResponsiveContainer>
        }
      </div>

      {/* Weight Chart */}
      <div className="card">
        <h2 className="text-base font-semibold text-brand-700 mb-1">⚖️ Weight & Waist Trend</h2>
        {analysis?.weight.change != null && (
          <p className="text-xs text-gray-500 mb-3">
            Last change: <b className={analysis.weight.change < 0 ? 'text-health-green' : 'text-health-red'}>
              {analysis.weight.change > 0 ? '+' : ''}{analysis.weight.change} kg
            </b> · Goal: lose 8–10 kg total
          </p>
        )}
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
                <Line yAxisId="c" type="monotone" dataKey="Waist" name="Waist (cm)" stroke="#E67E22" strokeWidth={2} dot={{r:3}} connectNulls strokeDasharray="5 3" />
              </LineChart>
            </ResponsiveContainer>
        }
      </div>

      {/* Bottom row: Heatmap + Today meals */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="card">
          <div className="flex items-center justify-between mb-3">
            <h2 className="text-base font-semibold text-brand-700">🏋️ 12-Week Activity</h2>
            <Link to="/log/workout" className="text-xs text-brand-500 hover:underline">+ Log</Link>
          </div>
          <WorkoutHeatmap heatmap={heatmap} />
        </div>
        <div className="card">
          <div className="flex items-center justify-between mb-3">
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
                      <div className="text-xs font-semibold text-brand-600">
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

      {/* Pre-gym reminder */}
      <div className="card bg-brand-50 border-brand-200">
        <div className="flex items-center gap-3 text-sm text-brand-700">
          <span className="text-2xl">⚠️</span>
          <div><span className="font-semibold">Pre-gym reminder: </span>Check BG before every session. Below 5 → eat banana first. Above 13 → light treadmill only.</div>
        </div>
      </div>
    </div>
  );
}
