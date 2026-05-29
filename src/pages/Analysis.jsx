import { useState, useEffect } from 'react';
import { format, parseISO } from 'date-fns';
import { getAnalysis, saveAnalysis, getAnalyses, isConfigured } from '../lib/supabase';

// Baseline from blood test (May 2025)
const BASELINE = {
  hba1c:  8.9,   // target <7%
  ldl:    4.12,  // target <3.0
  hdl:    0.95,  // target >1.0
  vitD:   15.8,  // target >30
  alt:    48,    // target <40
};

// ── Score ring ────────────────────────────────────────────────────────────────
function ScoreRing({ score }) {
  const r   = 52;
  const circ = 2 * Math.PI * r;
  const fill = (score / 100) * circ;
  const color = score >= 75 ? '#22c55e' : score >= 50 ? '#f59e0b' : '#ef4444';
  return (
    <div className="flex flex-col items-center">
      <svg width="130" height="130" viewBox="0 0 130 130">
        <circle cx="65" cy="65" r={r} fill="none" stroke="#e5e7eb" strokeWidth="12" />
        <circle cx="65" cy="65" r={r} fill="none" stroke={color} strokeWidth="12"
          strokeDasharray={`${fill} ${circ}`} strokeLinecap="round"
          transform="rotate(-90 65 65)" style={{transition:'stroke-dasharray 0.6s ease'}}/>
        <text x="65" y="60" textAnchor="middle" fontSize="28" fontWeight="bold" fill={color}>{score}</text>
        <text x="65" y="78" textAnchor="middle" fontSize="11" fill="#6b7280">/ 100</text>
      </svg>
      <span className="text-sm font-semibold mt-1" style={{color}}>
        {score >= 75 ? 'Good Progress' : score >= 50 ? 'Moderate' : 'Needs Attention'}
      </span>
    </div>
  );
}

// ── Trend badge ───────────────────────────────────────────────────────────────
function Badge({ trend }) {
  if (!trend || trend === 'nodata') return <span className="text-xs text-gray-400">—</span>;
  const map = {
    improved:  ['↑ Improved',  'bg-green-100 text-green-700'],
    stable:    ['→ Stable',    'bg-gray-100 text-gray-600'],
    regressed: ['↓ Regressed', 'bg-red-100 text-red-700'],
  };
  const [label, cls] = map[trend] || ['—', ''];
  return <span className={`text-xs font-semibold px-2 py-0.5 rounded-full ${cls}`}>{label}</span>;
}

// ── Stat row ──────────────────────────────────────────────────────────────────
function StatRow({ label, value, unit, trend, note }) {
  return (
    <div className="flex items-center justify-between py-2 border-b border-gray-100 last:border-0">
      <div>
        <span className="text-sm text-gray-700">{label}</span>
        {note && <span className="text-xs text-gray-400 ml-1">({note})</span>}
      </div>
      <div className="flex items-center gap-2">
        <span className="text-sm font-semibold">
          {value != null ? `${value}${unit || ''}` : '—'}
        </span>
        <Badge trend={trend} />
      </div>
    </div>
  );
}

// ── Compute health score from analysis data ───────────────────────────────────
function computeScore(data) {
  let score = 50;
  const insights = [];
  const recs = [];

  // BG score (0-30 pts)
  if (data.bg.thisWeek != null) {
    if      (data.bg.thisWeek <= 7)  { score += 30; insights.push('🟢 BG average is in excellent target range (<7 mmol/L).'); }
    else if (data.bg.thisWeek <= 10) { score += 18; insights.push('🟡 BG average is elevated (7–10 mmol/L). Push toward <7.'); recs.push('Cut white rice and sugary drinks. Aim for 2 chapati max at dinner.'); }
    else                             { score += 5;  insights.push('🔴 BG average is high (>10 mmol/L). Needs urgent attention.'); recs.push('Urgent: increase metformin compliance, reduce carbs at every meal, increase cardio sessions.'); }
    if (data.bg.trend === 'improved') { score += 5; insights.push('📉 BG is trending down vs last week — keep going!'); }
    if (data.bg.trend === 'regressed'){ score -= 5; insights.push('📈 BG is higher than last week. Review meals and activity.'); }
  } else {
    recs.push('Log blood glucose readings — at least fasting morning and post-gym readings every day.');
  }

  // Weight score (0-20 pts)
  if (data.weight.change != null) {
    if      (data.weight.change < -0.3) { score += 20; insights.push(`⚖️ Lost ${Math.abs(data.weight.change)} kg since last reading — great trend!`); }
    else if (data.weight.change < 0.2)  { score += 12; insights.push('⚖️ Weight is holding steady.'); }
    else                                { score += 4;  insights.push(`⚖️ Weight increased by ${data.weight.change} kg. Reassess portion sizes.`); recs.push('Track your dinner portion — aim for 3 chapati max. Weigh yourself every morning after using the bathroom.'); }
  } else {
    recs.push('Log your weight every morning. It\'s the fastest way to spot trends early.');
  }

  // Workout score (0-20 pts)
  const wkPct = data.workouts.target ? data.workouts.thisWeek / data.workouts.target : 0;
  if      (wkPct >= 1)    { score += 20; insights.push(`💪 Hit workout target this week (${data.workouts.thisWeek}/${data.workouts.target} sessions)!`); }
  else if (wkPct >= 0.75) { score += 14; insights.push(`💪 Almost at workout target (${data.workouts.thisWeek}/${data.workouts.target}). One more session makes a big difference.`); }
  else if (wkPct >= 0.5)  { score += 8;  insights.push(`💪 Only ${data.workouts.thisWeek} workout(s) this week. Target is ${data.workouts.target}.`); recs.push('Block gym time in your calendar like a work meeting. Even 30 min home sessions count.'); }
  else                    { score += 2;  insights.push('⚠️ Very few workouts logged this week.'); recs.push('Start with home cardio if gym is not accessible. 20 min on the elliptical beats zero.'); }

  // Exercise BG drop bonus (0-5 pts)
  if (data.exercise.avgBgDrop > 1.5) {
    score += 5;
    insights.push(`🎯 Exercise is lowering your BG by avg ${data.exercise.avgBgDrop} mmol/L per session — excellent response!`);
  }

  // Meal logging (0-5 pts)
  if (data.meals.daysLoggedThisWeek >= 5) { score += 5; insights.push('📝 Good meal logging consistency this week.'); }
  else if (data.meals.daysLoggedThisWeek > 0) { score += 2; insights.push(`📝 Logged meals on ${data.meals.daysLoggedThisWeek} day(s) this week. Try to log every day.`); }
  else { recs.push('Log every meal — it builds pattern awareness and helps correlate food with blood glucose spikes.'); }

  // Blood test comparison reminders
  if (data.bg.allTime && data.bg.allTime > 8.5) {
    recs.push('Your all-time BG average suggests HbA1c is still elevated. Check HbA1c monthly. Target: below 7%.');
  }
  recs.push('Take Vitamin D3 1000 IU daily — your baseline was 15.8 ng/mL (target >30).');
  recs.push('Avoid fried eggs — switch to boiled or poached to help bring LDL down from 4.12 mmol/L.');

  score = Math.min(100, Math.max(0, score));
  return { score, insights, recs };
}

// ── Saved analysis card ───────────────────────────────────────────────────────
function AnalysisCard({ a, onExpand, isOpen }) {
  const score  = a.health_score;
  const color  = score >= 75 ? 'text-green-600' : score >= 50 ? 'text-amber-600' : 'text-red-600';
  const bgColor= score >= 75 ? 'bg-green-50 border-green-200' : score >= 50 ? 'bg-amber-50 border-amber-200' : 'bg-red-50 border-red-200';
  return (
    <div className={`rounded-2xl border p-4 cursor-pointer transition-all ${bgColor}`} onClick={onExpand}>
      <div className="flex items-center justify-between">
        <div>
          <div className="font-semibold text-gray-800 text-sm">
            Analysis — {a.period_label || format(parseISO(a.analysed_at), 'd MMM yyyy')}
          </div>
          <div className="text-xs text-gray-500 mt-0.5">
            {format(parseISO(a.analysed_at), 'd MMM yyyy, HH:mm')}
          </div>
        </div>
        <div className="flex items-center gap-3">
          <div className="text-right">
            <div className={`text-2xl font-bold ${color}`}>{score}<span className="text-sm font-normal">/100</span></div>
            <div className={`text-xs font-medium ${color}`}>{score >= 75 ? 'Good' : score >= 50 ? 'Moderate' : 'Needs Work'}</div>
          </div>
          <span className="text-gray-400">{isOpen ? '▲' : '▼'}</span>
        </div>
      </div>

      {isOpen && (
        <div className="mt-4 pt-4 border-t border-gray-200 space-y-3">
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-sm">
            {a.bg_avg   != null && <div className="bg-white rounded-xl p-3 text-center shadow-sm"><div className="text-xs text-gray-400">Avg BG</div><div className="font-bold text-brand-700">{a.bg_avg} <span className="text-xs font-normal">mmol/L</span></div><Badge trend={a.bg_trend}/></div>}
            {a.weight_kg!= null && <div className="bg-white rounded-xl p-3 text-center shadow-sm"><div className="text-xs text-gray-400">Weight</div><div className="font-bold text-brand-700">{a.weight_kg} <span className="text-xs font-normal">kg</span></div>{a.weight_change != null && <span className="text-xs text-gray-500">{a.weight_change > 0 ? '+' : ''}{a.weight_change} kg</span>}</div>}
            {a.workouts_count != null && <div className="bg-white rounded-xl p-3 text-center shadow-sm"><div className="text-xs text-gray-400">Workouts</div><div className="font-bold text-brand-700">{a.workouts_count}<span className="text-xs font-normal">/{a.workouts_target}</span></div><Badge trend={a.workout_trend}/></div>}
            {a.avg_bg_drop != null && <div className="bg-white rounded-xl p-3 text-center shadow-sm"><div className="text-xs text-gray-400">BG Drop/session</div><div className="font-bold text-brand-700">{a.avg_bg_drop} <span className="text-xs font-normal">mmol/L</span></div></div>}
          </div>
          {a.insights?.length > 0 && (
            <div>
              <div className="text-xs font-semibold text-gray-500 uppercase mb-1.5">Insights</div>
              <ul className="space-y-1">{a.insights.map((ins, i) => <li key={i} className="text-sm text-gray-700">{ins}</li>)}</ul>
            </div>
          )}
          {a.recommendations?.length > 0 && (
            <div>
              <div className="text-xs font-semibold text-gray-500 uppercase mb-1.5">Recommendations</div>
              <ul className="space-y-1">{a.recommendations.map((r, i) => <li key={i} className="text-sm text-gray-600">→ {r}</li>)}</ul>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

// ── Main Analysis page ────────────────────────────────────────────────────────
export default function Analysis() {
  const [running,   setRunning]   = useState(false);
  const [latest,    setLatest]    = useState(null);
  const [history,   setHistory]   = useState([]);
  const [openCard,  setOpenCard]  = useState(null);
  const [loadingH,  setLoadingH]  = useState(true);
  const [saveMsg,   setSaveMsg]   = useState(null);

  const configured = isConfigured();

  const loadHistory = async () => {
    setLoadingH(true);
    const list = await getAnalyses(20);
    setHistory(list);
    setLoadingH(false);
  };

  useEffect(() => { loadHistory(); }, []);

  const runAnalysis = async () => {
    if (!configured) return;
    setRunning(true); setSaveMsg(null); setLatest(null);
    try {
      const data = await getAnalysis();
      const { score, insights, recs } = computeScore(data);

      const payload = {
        period_label:    format(new Date(), 'd MMM yyyy'),
        period_days:     14,
        health_score:    score,
        bg_avg:          data.bg.thisWeek,
        bg_trend:        data.bg.trend,
        bg_best:         data.bg.best,
        bg_worst:        data.bg.worst,
        weight_kg:       data.weight.latest,
        weight_change:   data.weight.change,
        weight_trend:    data.weight.trend,
        waist_cm:        data.weight.waist,
        workouts_count:  data.workouts.thisWeek,
        workouts_target: data.workouts.target,
        workout_trend:   data.workouts.trend,
        meals_days:      data.meals.daysLoggedThisWeek,
        avg_bg_drop:     data.exercise.avgBgDrop,
        insights,
        recommendations: recs,
        raw_data:        data,
      };

      setLatest({ ...payload, score, insights, recs, data });

      const { error } = await saveAnalysis(payload);
      if (error) setSaveMsg({ ok: false, msg: 'Analysis run — but failed to save: ' + error.message });
      else       { setSaveMsg({ ok: true, msg: 'Analysis saved to your history!' }); await loadHistory(); }
    } catch (e) {
      setSaveMsg({ ok: false, msg: 'Error running analysis: ' + e.message });
    } finally {
      setRunning(false);
    }
  };

  if (!configured) return (
    <div className="max-w-2xl mx-auto">
      <h1 className="text-xl font-bold text-brand-700 mb-1">🔬 Analysis</h1>
      <div className="card bg-amber-50 border-amber-200 mt-4">
        <p className="text-sm text-amber-800 font-medium">⚠️ Supabase not connected yet.</p>
        <p className="text-xs text-amber-700 mt-1">Add your <code>VITE_SUPABASE_URL</code> and <code>VITE_SUPABASE_ANON_KEY</code> as GitHub secrets to enable data logging and analysis.</p>
      </div>
    </div>
  );

  return (
    <div className="max-w-2xl mx-auto">
      <h1 className="text-xl font-bold text-brand-700 mb-1">🔬 Analysis</h1>
      <p className="text-sm text-gray-500 mb-5">Run a health analysis on your logged data. Results are saved to your history so you can track progress over time.</p>

      {/* Run button */}
      <div className="card mb-6">
        <div className="flex items-start justify-between gap-4">
          <div>
            <div className="font-semibold text-brand-700 text-sm mb-1">Run New Analysis</div>
            <p className="text-xs text-gray-500">Analyses your last 14 days of vitals, meals and workouts. Computes a health score (0–100) with personalised insights and recommendations based on your blood test baseline.</p>
          </div>
          <button onClick={runAnalysis} disabled={running}
            className="btn-primary whitespace-nowrap text-sm py-2 px-4 min-w-[120px]">
            {running ? '⏳ Analysing…' : '▶ Run Now'}
          </button>
        </div>

        {saveMsg && (
          <div className={`mt-3 p-3 rounded-xl text-sm font-medium ${saveMsg.ok ? 'bg-health-greenBg text-health-green' : 'bg-health-redBg text-health-red'}`}>
            {saveMsg.ok ? '✅' : '❌'} {saveMsg.msg}
          </div>
        )}
      </div>

      {/* Latest result (just run) */}
      {latest && (
        <div className="card mb-6 bg-brand-50 border-brand-200">
          <div className="text-sm font-semibold text-brand-700 mb-4">Latest Analysis Result</div>
          <div className="flex flex-col sm:flex-row items-center gap-6 mb-4">
            <ScoreRing score={latest.score} />
            <div className="flex-1 w-full space-y-0">
              <StatRow label="Avg BG (this week)"  value={latest.data.bg.thisWeek}       unit=" mmol/L" trend={latest.data.bg.trend}       note="target <7" />
              <StatRow label="Avg BG (last week)"  value={latest.data.bg.lastWeek}       unit=" mmol/L" />
              <StatRow label="Weight"              value={latest.data.weight.latest}     unit=" kg"     trend={latest.data.weight.trend}    note={latest.data.weight.change != null ? `${latest.data.weight.change > 0 ? '+' : ''}${latest.data.weight.change} kg` : null} />
              <StatRow label="Workouts this week"  value={latest.data.workouts.thisWeek} unit={`/${latest.data.workouts.target}`} trend={latest.data.workouts.trend} />
              {latest.data.exercise.avgBgDrop != null && <StatRow label="Avg BG drop/session" value={latest.data.exercise.avgBgDrop} unit=" mmol/L" />}
              <StatRow label="Meal days logged"    value={latest.data.meals.daysLoggedThisWeek} unit="/7 days" trend={latest.data.meals.trend} />
            </div>
          </div>

          {/* Insights */}
          <div className="grid sm:grid-cols-2 gap-4">
            <div>
              <div className="text-xs font-semibold text-gray-500 uppercase mb-2">Insights</div>
              <ul className="space-y-1.5">
                {latest.insights.map((ins, i) => (
                  <li key={i} className="text-sm text-gray-700 bg-white rounded-lg px-3 py-2 shadow-sm">{ins}</li>
                ))}
              </ul>
            </div>
            <div>
              <div className="text-xs font-semibold text-gray-500 uppercase mb-2">Recommendations</div>
              <ul className="space-y-1.5">
                {latest.recs.map((r, i) => (
                  <li key={i} className="text-sm text-gray-600 bg-white rounded-lg px-3 py-2 shadow-sm">→ {r}</li>
                ))}
              </ul>
            </div>
          </div>

          {/* Blood test reference */}
          <div className="mt-4 pt-4 border-t border-brand-200">
            <div className="text-xs font-semibold text-gray-500 uppercase mb-2">Blood Test Baseline (May 2025)</div>
            <div className="grid grid-cols-2 sm:grid-cols-5 gap-2 text-xs">
              {[
                { label: 'HbA1c', val: `${BASELINE.hba1c}%`,      target: '<7%',     ok: false },
                { label: 'LDL',   val: `${BASELINE.ldl} mmol/L`,  target: '<3.0',    ok: false },
                { label: 'HDL',   val: `${BASELINE.hdl} mmol/L`,  target: '>1.0',    ok: false },
                { label: 'Vit D', val: `${BASELINE.vitD} ng/mL`,  target: '>30',     ok: false },
                { label: 'ALT',   val: `${BASELINE.alt} U/L`,     target: '<40 U/L', ok: false },
              ].map(item => (
                <div key={item.label} className="bg-red-50 border border-red-200 rounded-lg p-2 text-center">
                  <div className="font-semibold text-red-700">{item.label}</div>
                  <div className="text-red-600 font-bold">{item.val}</div>
                  <div className="text-red-400">Target: {item.target}</div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* History */}
      <div>
        <h2 className="text-sm font-semibold text-gray-600 uppercase mb-3">Analysis History</h2>
        {loadingH ? (
          <p className="text-sm text-gray-400">Loading history…</p>
        ) : history.length === 0 ? (
          <div className="card text-center py-10">
            <p className="text-gray-400 text-sm">No analyses saved yet.</p>
            <p className="text-xs text-gray-400 mt-1">Run your first analysis above.</p>
          </div>
        ) : (
          <div className="space-y-3">
            {history.map(a => (
              <AnalysisCard key={a.id} a={a}
                isOpen={openCard === a.id}
                onExpand={() => setOpenCard(openCard === a.id ? null : a.id)} />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
