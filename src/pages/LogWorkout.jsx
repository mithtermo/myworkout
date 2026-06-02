import { useState } from 'react';
import { format } from 'date-fns';
import { logWorkout } from '../lib/supabase.js';

const today = format(new Date(), 'yyyy-MM-dd');
const now   = format(new Date(), 'HH:mm');

const WORKOUT_TYPES = [
  // Gym weights
  { value:'gym_push',        label:'🏋️ Gym — Push',        group:'Gym Weights',  desc:'Chest, shoulders (Sun/Sat)' },
  { value:'gym_pull',        label:'🏋️ Gym — Pull',        group:'Gym Weights',  desc:'Back, biceps (Mon)' },
  { value:'gym_legs',        label:'🦵 Gym — Legs+Core',   group:'Gym Weights',  desc:'Legs, core (Tue)' },
  { value:'gym_metabolic',   label:'🔥 Gym — Metabolic',   group:'Gym Weights',  desc:'Full body circuit (Wed)' },
  { value:'gym_upper',       label:'💪 Gym — Upper',       group:'Gym Weights',  desc:'Upper body (Thu if no footy)' },
  // Gym cardio
  { value:'treadmill',       label:'🏃 Treadmill',          group:'Gym Cardio',   desc:'Running / walking on treadmill' },
  { value:'cycling',         label:'🚴 Cycling',            group:'Gym Cardio',   desc:'Stationary bike or outdoor cycle' },
  { value:'step',            label:'🪜 Step Machine',       group:'Gym Cardio',   desc:'Step machine at gym' },
  { value:'step_cycling',    label:'🚲 Step Cycling',       group:'Gym Cardio',   desc:'Step cycling / cross trainer' },
  // Home
  { value:'home_resistance', label:'🏠 Home — Resistance',  group:'Home',         desc:'Barbell/dumbbell at home' },
  { value:'home_cardio',     label:'🚲 Home — Cardio',      group:'Home',         desc:'Elliptical or chest expander' },
  // Sport
  { value:'football',        label:'⚽ Football',            group:'Sport',        desc:'Thursday football (90 min)' },
  { value:'badminton',       label:'🏸 Badminton',           group:'Sport',        desc:'Badminton session' },
];

// Types that track distance (km)
const DISTANCE_TYPES = new Set(['treadmill','cycling','step','step_cycling','home_cardio','football','badminton']);
// Types that track exercises (sets/reps)
const EXERCISE_TYPES = new Set(['gym_push','gym_pull','gym_legs','gym_metabolic','gym_upper','home_resistance']);
// All cardio types (no exercise log needed)
const CARDIO_TYPES   = new Set(['treadmill','cycling','step','step_cycling','home_cardio','football','badminton']);

const EXERCISE_SUGGESTIONS = {
  gym_push: [
    'Horizontal Bench Press (Life Fitness)',
    'Decline Press (Life Fitness)',
    'Seated Dip — Triceps (Hoist)',
    'Cable Crossover / Pec Deck',
    'Dumbbell Shoulder Press',
    'Lateral Raises',
  ],
  gym_pull: [
    'Lat Pulldown (Hoist)',
    'Cable Rows / Seated Row',
    'Preacher Curl — Biceps (Hoist)',
    'Face Pulls (Cable)',
    'Hammer Curl (Dumbbell)',
    'Reverse Grip Pulldown',
  ],
  gym_legs: [
    'Angled Leg Press (Life Fitness)',
    'Hack Squat (Plate-loaded)',
    'Leg Extension (Machine)',
    'Leg Curl (Machine)',
    'Calf Raises (Leg Press platform)',
    'Hip Thrust / Glute Machine',
  ],
  gym_metabolic: [
    'Angled Leg Press — light (Life Fitness)',
    'Lat Pulldown (Hoist)',
    'Horizontal Bench Press (Life Fitness)',
    'Cable Rows',
    'Dumbbell Shoulder Press',
    'Seated Dip (Hoist)',
  ],
  gym_upper: [
    'Horizontal Bench Press (Life Fitness)',
    'Lat Pulldown (Hoist)',
    'Cable Crossover',
    'Preacher Curl (Hoist)',
    'Seated Dip (Hoist)',
    'Lateral Raises',
  ],
  home_resistance: ['Barbell squats','Barbell rows','Dumbbell press','Chest expander pulls','Deadlift'],
};

// Group types for display
const GROUPS = [...new Set(WORKOUT_TYPES.map(t => t.group))];

function ExerciseRow({ ex, onChange, onRemove }) {
  const set = (k,v) => onChange({...ex,[k]:v});
  return (
    <div className="grid grid-cols-12 gap-2 items-center text-sm">
      <input className="input col-span-4" placeholder="Exercise" value={ex.name} onChange={e=>set('name',e.target.value)} />
      <input className="input col-span-2" placeholder="Sets" type="number" min="1" max="10" value={ex.sets} onChange={e=>set('sets',e.target.value)} />
      <input className="input col-span-2" placeholder="Reps" value={ex.reps} onChange={e=>set('reps',e.target.value)} />
      <input className="input col-span-2" placeholder="kg" type="number" step="0.5" value={ex.weight_kg} onChange={e=>set('weight_kg',e.target.value)} />
      <button type="button" onClick={onRemove} className="col-span-2 text-gray-400 hover:text-health-red text-xs">✕ Remove</button>
    </div>
  );
}

export default function LogWorkout() {
  const [form, setForm]     = useState({ date:today, time:now, type:'', duration_min:'', distance_km:'', pre_bg:'', post_bg:'', notes:'' });
  const [exercises, setEx]  = useState([]);
  const [status, setStatus] = useState(null);
  const [saving, setSaving] = useState(false);

  const set = (k,v) => setForm(f=>({...f,[k]:v}));
  const addEx    = name => setEx(ex=>[...ex,{name:name||'',sets:'3',reps:'12',weight_kg:''}]);
  const updateEx = (i,val) => setEx(ex=>ex.map((e,idx)=>idx===i?val:e));
  const removeEx = i => setEx(ex=>ex.filter((_,idx)=>idx!==i));

  const handleSubmit = async e => {
    e.preventDefault();
    setSaving(true); setStatus(null);
    const payload = {
      ...Object.fromEntries(Object.entries(form).filter(([,v])=>v!=='')),
      exercises: exercises.filter(e=>e.name),
    };
    const { error } = await logWorkout(payload);
    setStatus(error ? 'error' : 'success');
    if (!error) {
      setEx([]);
      setForm(f=>({...f, duration_min:'', distance_km:'', pre_bg:'', post_bg:'', notes:'', type:f.type}));
    }
    setSaving(false);
  };

  const showDistance = DISTANCE_TYPES.has(form.type);
  const showExercises = EXERCISE_TYPES.has(form.type);
  const suggestions = EXERCISE_SUGGESTIONS[form.type] || [];

  // Pace calculation (min/km)
  const pace = form.duration_min && form.distance_km && +form.distance_km > 0
    ? (parseFloat(form.duration_min) / parseFloat(form.distance_km)).toFixed(1)
    : null;

  return (
    <div className="max-w-2xl mx-auto">
      <h1 className="text-xl font-bold text-brand-700 mb-1">💪 Log Workout</h1>
      <p className="text-sm text-gray-500 mb-6">Record your session with exercises, distance and blood glucose data.</p>

      {status==='success' && <div className="mb-4 p-3 bg-health-greenBg text-health-green rounded-xl text-sm font-medium">✅ Workout logged!</div>}
      {status==='error'   && <div className="mb-4 p-3 bg-health-redBg  text-health-red   rounded-xl text-sm font-medium">❌ Failed to save.</div>}

      <form onSubmit={handleSubmit} className="space-y-5">

        {/* Session details */}
        <div className="card">
          <h2 className="font-semibold text-brand-700 mb-3 text-sm">Session Details</h2>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
            <div>
              <label className="label">Date</label>
              <input type="date" className="input" value={form.date} onChange={e=>set('date',e.target.value)} required />
            </div>
            <div>
              <label className="label">Start Time</label>
              <input type="time" className="input" value={form.time} onChange={e=>set('time',e.target.value)} />
            </div>
            <div>
              <label className="label">Duration (min)</label>
              <input type="number" min="5" max="300" className="input" placeholder="e.g. 45"
                value={form.duration_min} onChange={e=>set('duration_min',e.target.value)} />
            </div>
            {/* Distance — always visible but highlighted when relevant */}
            <div>
              <label className="label">
                Distance (km)
                {showDistance && <span className="ml-1 text-brand-500 font-bold">*</span>}
              </label>
              <input type="number" step="0.1" min="0" max="100" className={`input ${showDistance ? 'border-brand-400 ring-1 ring-brand-300' : ''}`}
                placeholder="e.g. 3.5"
                value={form.distance_km} onChange={e=>set('distance_km',e.target.value)} />
              {pace && (
                <p className="text-xs text-brand-600 mt-1 font-medium">⚡ Pace: {pace} min/km</p>
              )}
            </div>
          </div>
        </div>

        {/* Workout type — grouped */}
        <div className="card">
          <h2 className="font-semibold text-brand-700 mb-3 text-sm">Workout Type *</h2>
          {GROUPS.map(group => (
            <div key={group} className="mb-4 last:mb-0">
              <div className="text-xs font-semibold text-gray-400 uppercase tracking-wide mb-2">{group}</div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                {WORKOUT_TYPES.filter(t=>t.group===group).map(t=>(
                  <button key={t.value} type="button" onClick={()=>set('type',t.value)}
                    className={`p-3 rounded-xl border text-left text-sm transition-colors ${
                      form.type===t.value
                        ? 'border-brand-400 bg-brand-50 text-brand-700'
                        : 'border-gray-200 bg-white text-gray-600 hover:bg-gray-50'
                    }`}>
                    <div className="font-medium">{t.label}</div>
                    <div className="text-xs text-gray-400">{t.desc}</div>
                  </button>
                ))}
              </div>
            </div>
          ))}
        </div>

        {/* Cardio tip */}
        {CARDIO_TYPES.has(form.type) && (
          <div className="card bg-blue-50 border-blue-200 py-3">
            <p className="text-xs text-blue-700 font-medium">
              💡 Cardio after weights = more fat burning. Log your KM to track improvement over time.
              {form.type === 'treadmill' && ' Treadmill after legs session = best BG lowering of the week!'}
              {form.type === 'cycling'   && ' Cycling is easy on joints — great for active recovery days.'}
            </p>
          </div>
        )}

        {/* Blood Glucose */}
        <div className="card">
          <h2 className="font-semibold text-brand-700 mb-3 text-sm">🩸 Blood Glucose (Important!)</h2>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="label">Pre-Workout BG (mmol/L)</label>
              <input type="number" step="0.1" min="1" max="30" className="input" placeholder="e.g. 6.5"
                value={form.pre_bg} onChange={e=>set('pre_bg',e.target.value)} />
              {form.pre_bg && parseFloat(form.pre_bg) < 5  && <p className="text-xs text-blue-600 mt-1 font-medium">⚠️ Below 5 — eat banana before training!</p>}
              {form.pre_bg && parseFloat(form.pre_bg) > 13 && <p className="text-xs text-health-red mt-1 font-medium">⛔ Above 13 — skip weights. Light treadmill only.</p>}
            </div>
            <div>
              <label className="label">Post-Workout BG (mmol/L)</label>
              <input type="number" step="0.1" min="1" max="30" className="input" placeholder="e.g. 5.2"
                value={form.post_bg} onChange={e=>set('post_bg',e.target.value)} />
              {form.pre_bg && form.post_bg && (
                <p className="text-xs text-gray-500 mt-1">
                  Drop: {(parseFloat(form.pre_bg)-parseFloat(form.post_bg)).toFixed(1)} mmol/L
                  {(parseFloat(form.pre_bg)-parseFloat(form.post_bg)) > 2 && ' 🎉 Great response!'}
                </p>
              )}
            </div>
          </div>
        </div>

        {/* Exercise log (gym/home resistance only) */}
        {showExercises && (
          <div className="card">
            <div className="flex items-center justify-between mb-3">
              <h2 className="font-semibold text-brand-700 text-sm">Exercise Log</h2>
              <button type="button" onClick={()=>addEx('')} className="btn-secondary text-xs py-1.5 px-3">+ Add Exercise</button>
            </div>
            {suggestions.length > 0 && (
              <div className="mb-3">
                <p className="text-xs text-gray-400 mb-1.5">Quick add:</p>
                <div className="flex flex-wrap gap-1.5">
                  {suggestions.map(s=>(
                    <button key={s} type="button" onClick={()=>addEx(s)}
                      className="badge bg-brand-100 text-brand-700 hover:bg-brand-200 cursor-pointer transition-colors py-1 px-2">+ {s}</button>
                  ))}
                </div>
              </div>
            )}
            {exercises.length > 0
              ? <div className="space-y-2">
                  <div className="grid grid-cols-12 gap-2 text-xs text-gray-400 px-0.5">
                    <span className="col-span-4">Exercise</span><span className="col-span-2">Sets</span>
                    <span className="col-span-2">Reps</span><span className="col-span-2">Load (kg)</span>
                  </div>
                  {exercises.map((ex,i)=><ExerciseRow key={i} ex={ex} onChange={v=>updateEx(i,v)} onRemove={()=>removeEx(i)}/>)}
                </div>
              : <p className="text-xs text-gray-400 text-center py-4">Use quick-add chips or click "+ Add Exercise".</p>
            }
          </div>
        )}

        {/* Notes */}
        <div className="card">
          <label className="label">Session Notes</label>
          <textarea className="input min-h-[70px] resize-none"
            placeholder="e.g. Felt strong today. Treadmill 3 km at 6.5 km/h…"
            value={form.notes} onChange={e=>set('notes',e.target.value)} />
        </div>

        <button type="submit" className="btn-primary w-full text-base py-3"
          disabled={saving||!form.date||!form.type}>
          {saving?'Saving…':'💾 Save Workout'}
        </button>
      </form>
    </div>
  );
}
