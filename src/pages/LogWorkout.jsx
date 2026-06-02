import { useState, useEffect } from 'react';
import { format } from 'date-fns';
import { logWorkout } from '../lib/supabase.js';

const today = format(new Date(), 'yyyy-MM-dd');
const now   = format(new Date(), 'HH:mm');

// ── Exercise guide — YouTube video IDs + tips ─────────────────────────────────
// Thumbnail: https://img.youtube.com/vi/{id}/mqdefault.jpg  (320×180)
const EXERCISE_GUIDE = {
  'Horizontal Bench Press (Life Fitness)': {
    videoId: 'vcBig73ojpE',
    muscle: 'Chest (mid), Triceps, Front delts',
    machine: 'Life Fitness Horizontal Bench Press',
    tips: [
      'Feet flat on floor, slight natural arch in lower back',
      'Grip slightly wider than shoulder-width, elbows at ~45°',
      'Lower bar to mid-chest, press explosively upward',
      'Squeeze chest at top — do not fully lock elbows',
    ],
    diabeticNote: 'Great compound move — activates large muscle mass, helps glucose uptake',
  },
  'Decline Press (Life Fitness)': {
    videoId: 'LfyQBUKR8SE',
    muscle: 'Lower chest, Triceps',
    machine: 'Life Fitness Decline Press',
    tips: [
      'Head is lower than hips on the decline bench',
      'Keep elbows at 45° — never flare straight out',
      'Controlled descent, explosive press',
      'Feel the stretch deep in lower chest at bottom',
    ],
    diabeticNote: 'Lower chest focus — combine with bench press for full chest development',
  },
  'Cable Crossover / Pec Deck': {
    videoId: 'taI4XduLpTk',
    muscle: 'Inner chest, Pec stretch',
    machine: 'Cable stack / Pec Deck',
    tips: [
      'Lean slightly forward, arms wide like hugging a tree',
      'Bring hands together in front of chest — squeeze hard',
      'Slow 3-sec eccentric (return phase)',
      'Do NOT use momentum — light weight, full squeeze',
    ],
    diabeticNote: 'Isolation move — use after compound presses, light-moderate weight',
  },
  'Dumbbell Shoulder Press': {
    videoId: '1-LxQCCsL40',
    muscle: 'Anterior deltoid, Lateral deltoid, Triceps',
    machine: 'Dumbbells',
    tips: [
      'Sit upright, dumbbells at ear height, palms forward',
      'Press overhead in a slight arc — do not fully lock',
      'Keep core tight, do not arch lower back excessively',
      '14–16 kg to start — go up when 12 reps feel easy',
    ],
    diabeticNote: 'Seated version recommended — reduces blood pressure spikes vs standing',
  },
  'Lateral Raises': {
    videoId: '3VcKaXpzqRo',
    muscle: 'Side deltoid (medial head)',
    machine: 'Dumbbells',
    tips: [
      'Lead with elbows, not hands — like pouring water from a jug',
      'Stop at shoulder height — do not go higher (rotator cuff risk)',
      'Slight bend in elbow throughout the movement',
      '8–10 kg; 15 reps. Control the lowering phase.',
    ],
    diabeticNote: 'Light isolation — do as a finisher, maintains shoulder health',
  },
  'Seated Dip – Triceps (Hoist)': {
    videoId: '0326dy_-CzM',
    muscle: 'Triceps (all 3 heads)',
    machine: 'Hoist Seated Dip',
    tips: [
      'Adjust seat so handles are at chest height when seated',
      'Keep feet on footrests throughout the movement',
      'Push straight down — squeeze triceps at full extension',
      'Slow return — 2-sec eccentric builds the most muscle',
    ],
    diabeticNote: 'Machine-based so very safe — excellent tricep finisher after bench press',
  },
  'Lat Pulldown (Hoist)': {
    videoId: 'CAwf7n6Luuc',
    muscle: 'Latissimus dorsi, Biceps, Rear delts',
    machine: 'Hoist Lat Pulldown',
    tips: [
      'Sit with thighs locked under pad, grip just wider than shoulders',
      'Lean back slightly (~15°), pull bar to upper chest',
      'Lead with elbows — drive them down and back',
      'Slow 3-sec return to full arm extension each rep',
    ],
    diabeticNote: 'Largest upper body muscle group — high glucose uptake, excellent for BG',
  },
  'Seated Cable Row': {
    videoId: 'GZbfZ033f74',
    muscle: 'Mid-back, Rhomboids, Biceps',
    machine: 'Cable Row station',
    tips: [
      'Sit tall, slight lean forward to grip, then sit upright to pull',
      'Pull handle to navel — squeeze shoulder blades at end',
      'Do NOT round your lower back at any point',
      'Control the forward lean — stretch the lats before each rep',
    ],
    diabeticNote: 'Compound back move — heavy enough to drive significant glucose use',
  },
  'Preacher Curl – Biceps (Hoist)': {
    videoId: 'fIWP-FRFNU0',
    muscle: 'Biceps brachii (peak)',
    machine: 'Hoist Preacher Curl',
    tips: [
      'Adjust seat so armpits sit on top of the pad',
      'Full ROM — extend fully at bottom, curl to chin level',
      'Squeeze hard at the top for 1 second',
      'Never use momentum — strict slow curls only',
    ],
    diabeticNote: 'Isolation — do after compound rows. 3 sets is enough for T2DM patients',
  },
  'Hammer Curl (Dumbbell)': {
    videoId: 'zC3nLlEvin4',
    muscle: 'Brachialis, Brachioradialis, Biceps',
    machine: 'Dumbbells',
    tips: [
      'Neutral grip (thumbs up) throughout entire movement',
      'Keep elbows pinned to sides — no swinging',
      'Curl to shoulder, lower slowly with control',
      '12–14 kg; great for forearm thickness alongside bicep peak',
    ],
    diabeticNote: 'Neutral grip variant — easier on wrist joints, targets brachialis deeply',
  },
  'Face Pulls (Cable – rope)': {
    videoId: 'HSoHeSJ-_lI',
    muscle: 'Rear deltoid, Rotator cuff, Traps',
    machine: 'Cable stack with rope attachment',
    tips: [
      'Set cable to face height (or slightly above)',
      'Pull rope to face — hands separate as they come back, thumbs toward ears',
      'Pause 1 sec at full contraction',
      'Light weight only — this is a shoulder health exercise, not ego lift',
    ],
    diabeticNote: 'Injury prevention — protects rotator cuff. Essential for long-term training',
  },
  'Angled Leg Press (Life Fitness)': {
    videoId: 'IZxyjW7MPJQ',
    muscle: 'Quadriceps, Glutes, Hamstrings',
    machine: 'Life Fitness Angled Leg Press',
    tips: [
      'Feet shoulder-width, middle of platform — push through heels',
      'Lower slowly until knees at 90° — do not let knees cave inward',
      'Do not fully lock knees at top — keep slight bend',
      'BG tip: 4 sets of this alone drops BG by 1–2 mmol/L',
    ],
    diabeticNote: '🌟 BEST MACHINE for T2DM. Largest muscle group = massive glucose uptake',
  },
  'Hack Squat (Plate-loaded)': {
    videoId: 'EdtPMnMxKCo',
    muscle: 'Quadriceps (deep VMO), Glutes',
    machine: 'Plate-loaded Hack Squat',
    tips: [
      'Start light — 2×10 kg plates. This is humbling for everyone.',
      'Feet slightly forward on platform, shoulder-width',
      'Lower until thighs parallel to floor or slightly below',
      'Drive through heels — do not let heels lift off platform',
    ],
    diabeticNote: 'Deeper quad activation than leg press — combine both for maximum effect',
  },
  'Leg Extension (Machine)': {
    videoId: 'YyvSfVjQeL0',
    muscle: 'Quadriceps isolation',
    machine: 'Leg Extension Machine',
    tips: [
      'Adjust so knee joint aligns with machine pivot point',
      'Extend fully and SQUEEZE hard for 1 sec at top',
      'Slow 3-sec descent — eccentric phase builds quad mass',
      'Do not use momentum or jerk the weight up',
    ],
    diabeticNote: 'Pure quad isolation — do after leg press while quads are already fatigued',
  },
  'Leg Curl (Machine)': {
    videoId: 'ELOCsoDSmrg',
    muscle: 'Hamstrings, Biceps femoris',
    machine: 'Leg Curl Machine',
    tips: [
      'Lie face down, pad just above ankle, hips flat on bench',
      'Curl fully until pad touches or nearly touches glutes',
      'Hold contraction 1 sec — hamstrings should cramp slightly',
      'Lower slowly — 3 sec eccentric, full stretch at bottom',
    ],
    diabeticNote: 'Hamstrings often undertrained — balance with quad work to protect knees',
  },
  'Hip Thrust / Glute Machine': {
    videoId: 'LM8XHLYJoYs',
    muscle: 'Glutes (maximus), Posterior chain',
    machine: 'Hip Thrust / Glute Machine',
    tips: [
      'Drive hips up explosively — squeeze glutes HARD at top',
      'Hold the top position for 2 seconds',
      'Do not hyperextend lower back — stop when hips are level',
      'Feet flat, heels directly below knees',
    ],
    diabeticNote: 'Glutes are a massive muscle — strong glutes improve insulin sensitivity',
  },
  'Calf Raises (Leg Press platform)': {
    videoId: 'gwLzBJYoWlI',
    muscle: 'Gastrocnemius, Soleus',
    machine: 'Leg Press platform (toes only)',
    tips: [
      'Place only the balls of feet on edge of platform',
      'Full stretch at bottom — heel drops below platform level',
      'Rise high on toes, hold 1 sec, squeeze calves hard',
      '20–25 reps — calves respond to high reps',
    ],
    diabeticNote: 'Calf raises improve circulation — very important for leg itching / neuropathy',
  },
  'Barbell squats': {
    videoId: 'bEv6CCg2BC8',
    muscle: 'Quads, Glutes, Core, Back',
    machine: 'Barbell / Home setup',
    tips: ['Feet shoulder-width, toes slightly out', 'Bar on traps, chest tall', 'Squat to parallel or below', 'Drive knees out as you stand'],
    diabeticNote: 'King of compound moves — full body glucose depletion',
  },
  'Barbell rows': {
    videoId: 'FWJR5Ve8bnQ',
    muscle: 'Back, Biceps, Core',
    machine: 'Barbell / Home setup',
    tips: ['Hinge at hips, back parallel to floor', 'Pull bar to lower chest/navel', 'Squeeze shoulder blades at top', 'Lower slowly'],
    diabeticNote: 'Best compound back exercise for muscle mass and metabolic effect',
  },
  'Elliptical': {
    videoId: 'Yz0V7u7FhOk',
    muscle: 'Full body cardio, Low impact',
    machine: 'Elliptical / Home cardio',
    tips: ['Keep upright posture, do not lean on handles', 'Push and pull handles actively', 'Maintain steady breathing', 'Aim for 20–30 min at moderate effort'],
    diabeticNote: 'Low impact on joints — excellent cardio for T2DM, drops BG reliably',
  },
  'Treadmill – incline walk 5–8%': {
    videoId: 'sSFmSVBIe-g',
    muscle: 'Glutes, Calves, Cardio endurance',
    machine: 'Treadmill',
    tips: ['Incline 5–8%, speed 5.5–6 km/h', 'Do NOT hold the handrails — let arms swing', '15 min after legs = the most powerful BG session you have', 'Check BG before and after to see your drop'],
    diabeticNote: '🌟 Post-leg treadmill is your single biggest BG lowering tool each week',
  },
};

const WORKOUT_TYPES = [
  { value:'gym_push',        label:'🏋️ Gym — Push',        group:'Gym Weights',  desc:'Chest, Shoulders, Triceps (Sun/Sat)' },
  { value:'gym_pull',        label:'🏋️ Gym — Pull',        group:'Gym Weights',  desc:'Back, Biceps (Mon)' },
  { value:'gym_legs',        label:'🦵 Gym — Legs+Core',   group:'Gym Weights',  desc:'Quads, Glutes, Hamstrings (Tue)' },
  { value:'gym_metabolic',   label:'🔥 Gym — Metabolic',   group:'Gym Weights',  desc:'Full body circuit (Wed)' },
  { value:'gym_upper',       label:'💪 Gym — Upper',       group:'Gym Weights',  desc:'Push + Pull combined (Thu/Sat)' },
  { value:'treadmill',       label:'🏃 Treadmill',          group:'Gym Cardio',   desc:'Running / walking on treadmill' },
  { value:'cycling',         label:'🚴 Cycling',            group:'Gym Cardio',   desc:'Stationary bike or outdoor cycle' },
  { value:'step',            label:'🪜 Step Machine',       group:'Gym Cardio',   desc:'Step machine at gym' },
  { value:'step_cycling',    label:'🚲 Step Cycling',       group:'Gym Cardio',   desc:'Step cycling / cross trainer' },
  { value:'home_resistance', label:'🏠 Home — Resistance',  group:'Home',         desc:'Barbell/dumbbell at home' },
  { value:'home_cardio',     label:'🚲 Home — Cardio',      group:'Home',         desc:'Elliptical or chest expander' },
  { value:'football',        label:'⚽ Football',            group:'Sport',        desc:'Thursday football (90 min)' },
  { value:'badminton',       label:'🏸 Badminton',           group:'Sport',        desc:'Badminton session' },
];

const DISTANCE_TYPES  = new Set(['treadmill','cycling','step','step_cycling','home_cardio','football','badminton']);
const EXERCISE_TYPES  = new Set(['gym_push','gym_pull','gym_legs','gym_metabolic','gym_upper','home_resistance']);
const CARDIO_TYPES    = new Set(['treadmill','cycling','step','step_cycling','home_cardio','football','badminton']);
const GROUPS = [...new Set(WORKOUT_TYPES.map(t => t.group))];

const EXERCISE_SUGGESTIONS = {
  gym_push: [
    'Horizontal Bench Press (Life Fitness)',
    'Decline Press (Life Fitness)',
    'Cable Crossover / Pec Deck',
    'Dumbbell Shoulder Press',
    'Lateral Raises',
    'Seated Dip – Triceps (Hoist)',
  ],
  gym_pull: [
    'Lat Pulldown (Hoist)',
    'Seated Cable Row',
    'Face Pulls (Cable – rope)',
    'Preacher Curl – Biceps (Hoist)',
    'Hammer Curl (Dumbbell)',
  ],
  gym_legs: [
    'Angled Leg Press (Life Fitness)',
    'Hack Squat (Plate-loaded)',
    'Leg Extension (Machine)',
    'Leg Curl (Machine)',
    'Hip Thrust / Glute Machine',
    'Calf Raises (Leg Press platform)',
    'Treadmill – incline walk 5–8%',
  ],
  gym_metabolic: [
    'Angled Leg Press (Life Fitness)',
    'Lat Pulldown (Hoist)',
    'Horizontal Bench Press (Life Fitness)',
    'Seated Cable Row',
    'Seated Dip – Triceps (Hoist)',
    'Treadmill – incline walk 5–8%',
  ],
  gym_upper: [
    'Horizontal Bench Press (Life Fitness)',
    'Lat Pulldown (Hoist)',
    'Cable Crossover / Pec Deck',
    'Preacher Curl – Biceps (Hoist)',
    'Seated Dip – Triceps (Hoist)',
    'Lateral Raises',
  ],
  home_resistance: ['Barbell squats','Barbell rows','Dumbbell Shoulder Press','Hammer Curl (Dumbbell)','Elliptical'],
};

// ── Exercise Guide Modal ──────────────────────────────────────────────────────
function ExerciseModal({ exercise, onClose }) {
  const guide = EXERCISE_GUIDE[exercise];
  useEffect(() => {
    const handler = e => { if (e.key === 'Escape') onClose(); };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, [onClose]);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4"
      style={{ background: 'rgba(0,0,0,0.75)' }}
      onClick={e => { if (e.target === e.currentTarget) onClose(); }}>
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-lg max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="flex items-start justify-between p-4 border-b border-gray-100">
          <div>
            <h2 className="font-bold text-brand-700 text-base leading-tight">{exercise}</h2>
            {guide && <p className="text-xs text-gray-500 mt-0.5">{guide.muscle}</p>}
            {guide && <p className="text-xs text-brand-400 mt-0.5">{guide.machine}</p>}
          </div>
          <button onClick={onClose}
            className="text-gray-400 hover:text-gray-600 text-2xl leading-none ml-3 flex-shrink-0">×</button>
        </div>

        {/* Video */}
        {guide?.videoId && (
          <div className="relative w-full" style={{ paddingBottom: '56.25%' }}>
            <iframe
              className="absolute inset-0 w-full h-full"
              src={`https://www.youtube.com/embed/${guide.videoId}?rel=0&modestbranding=1`}
              title={exercise}
              allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
              allowFullScreen
            />
          </div>
        )}

        {/* Tips & notes */}
        {guide && (
          <div className="p-4 space-y-3">
            <div>
              <div className="text-xs font-semibold text-gray-500 uppercase mb-2">Form Tips</div>
              <ul className="space-y-1.5">
                {guide.tips.map((tip, i) => (
                  <li key={i} className="flex gap-2 text-sm text-gray-700">
                    <span className="text-brand-500 font-bold flex-shrink-0">{i + 1}.</span>
                    {tip}
                  </li>
                ))}
              </ul>
            </div>
            <div className="bg-green-50 border border-green-200 rounded-xl p-3">
              <div className="text-xs font-semibold text-green-700 mb-1">🩸 Diabetic Note</div>
              <p className="text-xs text-green-700">{guide.diabeticNote}</p>
            </div>
          </div>
        )}

        {!guide && (
          <div className="p-6 text-center">
            <p className="text-sm text-gray-400">No guide available for this exercise yet.</p>
          </div>
        )}
      </div>
    </div>
  );
}

// ── Exercise chip with thumbnail ──────────────────────────────────────────────
function ExerciseChip({ name, onAdd, onGuide }) {
  const guide = EXERCISE_GUIDE[name];
  const thumbUrl = guide?.videoId
    ? `https://img.youtube.com/vi/${guide.videoId}/mqdefault.jpg`
    : null;

  return (
    <div className="flex items-center rounded-xl border border-brand-200 bg-brand-50 overflow-hidden hover:border-brand-400 transition-colors">
      {/* Thumbnail — click to open guide */}
      {thumbUrl && (
        <button
          type="button"
          onClick={() => onGuide(name)}
          className="flex-shrink-0 relative overflow-hidden"
          style={{ width: 72, height: 42 }}
          title="Watch tutorial video">
          <img
            src={thumbUrl}
            alt={name}
            className="w-full h-full object-cover"
            loading="lazy"
          />
          {/* Play button overlay */}
          <div className="absolute inset-0 flex items-center justify-center bg-black bg-opacity-20 hover:bg-opacity-40 transition-all">
            <div className="w-5 h-5 rounded-full bg-red-600 flex items-center justify-center shadow">
              <div className="w-0 h-0 ml-0.5" style={{ borderTop: '4px solid transparent', borderBottom: '4px solid transparent', borderLeft: '7px solid white' }} />
            </div>
          </div>
        </button>
      )}

      {/* Add button */}
      <button
        type="button"
        onClick={() => onAdd(name)}
        className="flex-1 text-left px-2 py-1.5 text-xs font-medium text-brand-700 hover:bg-brand-100 transition-colors">
        <span className="text-brand-400 mr-1">+</span>{name}
      </button>

      {/* Info icon — also opens guide */}
      <button
        type="button"
        onClick={() => onGuide(name)}
        className="px-2 py-1.5 text-gray-400 hover:text-brand-600 text-xs flex-shrink-0"
        title="View guide">
        ℹ️
      </button>
    </div>
  );
}

// ── Exercise row ──────────────────────────────────────────────────────────────
function ExerciseRow({ ex, onChange, onRemove, onGuide }) {
  const set = (k,v) => onChange({...ex,[k]:v});
  return (
    <div className="grid grid-cols-12 gap-2 items-center text-sm">
      <div className="col-span-4 flex items-center gap-1">
        <input className="input flex-1 min-w-0" placeholder="Exercise" value={ex.name} onChange={e=>set('name',e.target.value)} />
        {EXERCISE_GUIDE[ex.name] && (
          <button type="button" onClick={() => onGuide(ex.name)}
            className="text-xs text-brand-500 hover:text-brand-700 flex-shrink-0" title="View guide">▶</button>
        )}
      </div>
      <input className="input col-span-2" placeholder="Sets" type="number" min="1" max="10" value={ex.sets} onChange={e=>set('sets',e.target.value)} />
      <input className="input col-span-2" placeholder="Reps" value={ex.reps} onChange={e=>set('reps',e.target.value)} />
      <input className="input col-span-2" placeholder="kg" type="number" step="0.5" value={ex.weight_kg} onChange={e=>set('weight_kg',e.target.value)} />
      <button type="button" onClick={onRemove} className="col-span-2 text-gray-400 hover:text-health-red text-xs">✕ Remove</button>
    </div>
  );
}

// ── Main page ─────────────────────────────────────────────────────────────────
export default function LogWorkout() {
  const [form, setForm]        = useState({ date:today, time:now, type:'', duration_min:'', distance_km:'', pre_bg:'', post_bg:'', notes:'' });
  const [exercises, setEx]     = useState([]);
  const [status, setStatus]    = useState(null);
  const [saving, setSaving]    = useState(false);
  const [guideFor, setGuideFor]= useState(null); // exercise name for modal

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

  const showDistance  = DISTANCE_TYPES.has(form.type);
  const showExercises = EXERCISE_TYPES.has(form.type);
  const suggestions   = EXERCISE_SUGGESTIONS[form.type] || [];
  const pace = form.duration_min && form.distance_km && +form.distance_km > 0
    ? (parseFloat(form.duration_min) / parseFloat(form.distance_km)).toFixed(1) : null;

  return (
    <div className="max-w-2xl mx-auto">
      {/* Guide modal */}
      {guideFor && <ExerciseModal exercise={guideFor} onClose={() => setGuideFor(null)} />}

      <h1 className="text-xl font-bold text-brand-700 mb-1">💪 Log Workout</h1>
      <p className="text-sm text-gray-500 mb-6">Tap the <span className="text-red-500">▶</span> thumbnail on any exercise to watch the tutorial video and see form tips.</p>

      {status==='success' && <div className="mb-4 p-3 bg-health-greenBg text-health-green rounded-xl text-sm font-medium">✅ Workout logged!</div>}
      {status==='error'   && <div className="mb-4 p-3 bg-health-redBg text-health-red   rounded-xl text-sm font-medium">❌ Failed to save.</div>}

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
              <input type="number" min="5" max="300" className="input" placeholder="e.g. 45" value={form.duration_min} onChange={e=>set('duration_min',e.target.value)} />
            </div>
            <div>
              <label className="label">
                Distance (km){showDistance && <span className="ml-1 text-brand-500 font-bold">*</span>}
              </label>
              <input type="number" step="0.1" min="0" max="100"
                className={`input ${showDistance ? 'border-brand-400 ring-1 ring-brand-300' : ''}`}
                placeholder="e.g. 3.5" value={form.distance_km} onChange={e=>set('distance_km',e.target.value)} />
              {pace && <p className="text-xs text-brand-600 mt-1 font-medium">⚡ Pace: {pace} min/km</p>}
            </div>
          </div>
        </div>

        {/* Workout type */}
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
              💡 Log your distance (km) to track improvement over time.
              {form.type === 'treadmill' && ' Treadmill after legs = biggest BG drop of the week. Check BG before + after!'}
            </p>
          </div>
        )}

        {/* Blood glucose */}
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

        {/* Exercise log */}
        {showExercises && (
          <div className="card">
            <div className="flex items-center justify-between mb-3">
              <div>
                <h2 className="font-semibold text-brand-700 text-sm">Exercise Log</h2>
                <p className="text-xs text-gray-400 mt-0.5">Tap the video thumbnail to see form guide</p>
              </div>
              <button type="button" onClick={()=>addEx('')} className="btn-secondary text-xs py-1.5 px-3">+ Add Exercise</button>
            </div>

            {/* Quick-add chips with thumbnails */}
            {suggestions.length > 0 && (
              <div className="mb-4">
                <p className="text-xs text-gray-400 mb-2">Quick add — tap thumbnail for video guide:</p>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                  {suggestions.map(s => (
                    <ExerciseChip key={s} name={s}
                      onAdd={addEx}
                      onGuide={setGuideFor} />
                  ))}
                </div>
              </div>
            )}

            {/* Logged exercises */}
            {exercises.length > 0
              ? <div className="space-y-2 mt-3">
                  <div className="grid grid-cols-12 gap-2 text-xs text-gray-400 px-0.5">
                    <span className="col-span-4">Exercise</span>
                    <span className="col-span-2">Sets</span>
                    <span className="col-span-2">Reps</span>
                    <span className="col-span-2">Load (kg)</span>
                  </div>
                  {exercises.map((ex,i) => (
                    <ExerciseRow key={i} ex={ex}
                      onChange={v=>updateEx(i,v)}
                      onRemove={()=>removeEx(i)}
                      onGuide={setGuideFor} />
                  ))}
                </div>
              : <p className="text-xs text-gray-400 text-center py-3">No exercises added. Use quick-add above or click "+ Add Exercise".</p>
            }
          </div>
        )}

        {/* Notes */}
        <div className="card">
          <label className="label">Session Notes</label>
          <textarea className="input min-h-[70px] resize-none"
            placeholder="e.g. Bench 60kg felt easy. BG dropped from 7.2 to 5.1 after session…"
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
