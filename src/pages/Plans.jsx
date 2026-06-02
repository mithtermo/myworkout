// ── Plans Page — Home Plan + Gym Plan reference ──────────────────────────────
import { useState } from 'react';
import React from 'react';

// ── shared helpers ────────────────────────────────────────────────────────────
function Section({ title, children }) {
  return (
    <div className="card mb-5">
      <h2 className="text-base font-bold text-brand-700 mb-4 pb-2 border-b border-brand-100">{title}</h2>
      {children}
    </div>
  );
}

function Tag({ color = 'blue', children }) {
  const styles = {
    blue:   'bg-brand-100 text-brand-700',
    green:  'bg-health-greenBg text-health-green',
    amber:  'bg-health-amberBg text-health-amber',
    red:    'bg-health-redBg text-health-red',
    purple: 'bg-purple-100 text-purple-700',
    orange: 'bg-orange-100 text-orange-700',
  };
  return <span className={`badge ${styles[color]} px-2.5 py-0.5`}>{children}</span>;
}

function Table({ headers, rows, colColors = [] }) {
  return (
    <div className="overflow-x-auto">
      <table className="w-full text-sm border-collapse">
        <thead>
          <tr>
            {headers.map((h, i) => (
              <th key={i} className="bg-brand-700 text-white text-left px-3 py-2 text-xs font-semibold first:rounded-tl-lg last:rounded-tr-lg">{h}</th>
            ))}
          </tr>
        </thead>
        <tbody>
          {rows.map((row, ri) => (
            <tr key={ri} className={ri % 2 === 0 ? 'bg-white' : 'bg-gray-50'}>
              {row.map((cell, ci) => (
                <td key={ci} className={`px-3 py-2 border-b border-gray-100 text-xs align-top ${ci === 0 ? 'font-semibold text-brand-700' : 'text-gray-700'} ${colColors[ci] || ''}`}>
                  {cell}
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

// Lookup: exercise name → YouTube videoId for thumbnail
const EX_VIDEO = {
  'Horizontal Bench Press':         'vcBig73ojpE',
  'Life Fitness Horizontal Bench Press': 'vcBig73ojpE',
  'Decline Press':                   'LfyQBUKR8SE',
  'Life Fitness Decline Press':      'LfyQBUKR8SE',
  'Cable / dumbbell flyes':          'taI4XduLpTk',
  'Cable Crossover / Pec Deck':      'taI4XduLpTk',
  'Seated dumbbell shoulder press':  '1-LxQCCsL40',
  'Dumbbell Shoulder Press':         '1-LxQCCsL40',
  'Lateral raises':                  '3VcKaXpzqRo',
  'Lateral Raises':                  '3VcKaXpzqRo',
  'Tricep pushdowns (cable)':        '0326dy_-CzM',
  'Seated Dip':                      '0326dy_-CzM',
  'Hoist Seated Dip':                '0326dy_-CzM',
  'Lat pulldown':                    'CAwf7n6Luuc',
  'Lat Pulldown':                    'CAwf7n6Luuc',
  'Hoist Lat Pulldown':              'CAwf7n6Luuc',
  'Seated cable row':                'GZbfZ033f74',
  'Seated Cable Row':                'GZbfZ033f74',
  'Hammer Strength Row':             'GZbfZ033f74',
  'Dumbbell single-arm row':         'GZbfZ033f74',
  'Face pulls (cable)':              'HSoHeSJ-_lI',
  'Face Pulls':                      'HSoHeSJ-_lI',
  'Barbell / dumbbell curls':        'fIWP-FRFNU0',
  'Preacher Curl':                   'fIWP-FRFNU0',
  'Hoist Preacher Curl':             'fIWP-FRFNU0',
  'Hammer curls':                    'zC3nLlEvin4',
  'Hammer Curl':                     'zC3nLlEvin4',
  'Leg press':                       'IZxyjW7MPJQ',
  'Angled Leg Press':                'IZxyjW7MPJQ',
  'Life Fitness Angled Leg Press':   'IZxyjW7MPJQ',
  'Hack Squat':                      'EdtPMnMxKCo',
  'Leg extension':                   'YyvSfVjQeL0',
  'Leg Extension':                   'YyvSfVjQeL0',
  'Leg curl (lying)':                'ELOCsoDSmrg',
  'Leg Curl':                        'ELOCsoDSmrg',
  'Calf raises (machine)':           'gwLzBJYoWlI',
  'Calf Raises':                     'gwLzBJYoWlI',
  'Hip Thrust':                      'LM8XHLYJoYs',
  'Plank':                           'ASdvN_XEl_c',
  'Russian twists':                  'wkD8rjkodUI',
  'Goblet squat':                    'MeIiIdhvXT4',
  'Dumbbell Romanian deadlift':      'hCDzSR6bW10',
  'Push-ups':                        'IODxDxX7oi4',
  'Dumbbell bent-over row':          'GZbfZ033f74',
  'Dumbbell bicep curls':            'fIWP-FRFNU0',
  'Mountain climbers':               'nmwgirgXLYM',
  'Treadmill':                       'sSFmSVBIe-g',
  'Treadmill walk':                  'sSFmSVBIe-g',
  'Treadmill incline':               'sSFmSVBIe-g',
  'Bike / elliptical':               'Yz0V7u7FhOk',
  'Elliptical':                      'Yz0V7u7FhOk',
};

// Mini photo modal (image full-size + video)
function PhotoModal({ name, videoId, onClose }) {
  const photo = gymPhoto(name);
  const [showPhoto, setShowPhoto] = React.useState(false);
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3"
      style={{background:'rgba(0,0,0,0.82)'}}
      onClick={e=>{if(e.target===e.currentTarget)onClose();}}>
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md overflow-hidden max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between px-4 py-3 border-b border-gray-100 sticky top-0 bg-white z-10">
          <span className="font-bold text-brand-700 text-sm">{name}</span>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-700 text-2xl leading-none">×</button>
        </div>
        {/* YouTube tutorial video */}
        <div className="relative w-full" style={{paddingBottom:'56.25%'}}>
          <iframe className="absolute inset-0 w-full h-full"
            src={`https://www.youtube.com/embed/${videoId}?rel=0&modestbranding=1&autoplay=1`}
            title={name} allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
            allowFullScreen />
        </div>
        {/* Your actual gym machine photo */}
        {photo && (
          <div className="border-t border-gray-100">
            <div className="px-4 py-2 flex items-center justify-between bg-gray-50">
              <span className="text-xs font-semibold text-gray-500 uppercase tracking-wide">📸 Your Gym Machine</span>
              <button onClick={()=>setShowPhoto(p=>!p)} className="text-xs text-brand-500 font-medium">
                {showPhoto ? 'Hide photo' : 'Show photo'}
              </button>
            </div>
            {showPhoto && (
              <img src={photo} alt={`${name} in your gym`}
                className="w-full object-cover" style={{maxHeight:320}}
                loading="lazy" />
            )}
            {!showPhoto && (
              <button onClick={()=>setShowPhoto(true)}
                className="w-full py-3 flex items-center justify-center gap-2 text-sm text-brand-600 hover:bg-brand-50 transition-colors">
                <span className="text-lg">📷</span>
                <span>Tap to see the machine in your gym</span>
              </button>
            )}
          </div>
        )}
        <div className="p-3 text-center border-t border-gray-100">
          <button onClick={onClose} className="text-sm text-gray-500 hover:text-gray-700 px-6 py-1.5 rounded-lg hover:bg-gray-100 transition-colors">Close</button>
        </div>
      </div>
    </div>
  );
}

function ExTable({ headers, rows }) {
  const [photo, setPhoto] = React.useState(null); // {name, videoId}
  return (
    <div className="overflow-x-auto">
      {photo && <PhotoModal name={photo.name} videoId={photo.videoId} onClose={()=>setPhoto(null)}/>}
      <table className="w-full text-xs border-collapse">
        <thead>
          <tr>{headers.map((h,i)=><th key={i} className="bg-brand-500 text-white text-left px-2.5 py-1.5 font-semibold">{h}</th>)}</tr>
        </thead>
        <tbody>
          {rows.map((row,ri)=>{
            const exName = row[0];
            // find videoId by checking if any EX_VIDEO key is contained in exercise name (case-insensitive)
            const vidKey = Object.keys(EX_VIDEO).find(k =>
              exName.toLowerCase().includes(k.toLowerCase()) ||
              k.toLowerCase().includes(exName.toLowerCase().split('(')[0].trim())
            );
            const vidId = vidKey ? EX_VIDEO[vidKey] : null;
            const thumb = vidId ? `https://img.youtube.com/vi/${vidId}/mqdefault.jpg` : null;
            return (
              <tr key={ri} className={ri%2===0?'bg-white':'bg-gray-50'}>
                {row.map((cell,ci)=>(
                  <td key={ci} className={`px-2 py-1.5 border-b border-gray-100 ${ci===0?'font-medium text-brand-700':'text-gray-600'}`}>
                    {ci===0 ? (
                      <div className="flex items-center gap-2">
                        {(thumb || gymPhoto(exName)) && (
                          <button type="button" onClick={()=>setPhoto({name:exName,videoId:vidId})}
                            className="flex-shrink-0 relative rounded overflow-hidden hover:ring-2 hover:ring-brand-400 transition-all"
                            style={{width:52,height:32}} title="Tap to see machine photo & video">
                            <img src={gymPhoto(exName) || thumb} alt={exName} loading="lazy"
                              className="w-full h-full object-cover"/>
                            <div className="absolute inset-0 flex items-center justify-center bg-black bg-opacity-20 hover:bg-opacity-40 transition-all">
                              <div className="w-0 h-0" style={{borderTop:'4px solid transparent',borderBottom:'4px solid transparent',borderLeft:'7px solid white'}}/>
                            </div>
                          </button>
                        )}
                        <span>{cell}</span>
                      </div>
                    ) : cell}
                  </td>
                ))}
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}

function Alert({ color = 'blue', icon, children }) {
  const styles = {
    blue:  'bg-brand-50 border-brand-200 text-brand-700',
    green: 'bg-health-greenBg border-green-200 text-health-green',
    amber: 'bg-health-amberBg border-amber-200 text-health-amber',
    red:   'bg-health-redBg border-red-200 text-health-red',
  };
  return (
    <div className={`rounded-xl border p-3.5 flex gap-2.5 text-sm ${styles[color]}`}>
      {icon && <span className="text-lg shrink-0">{icon}</span>}
      <div>{children}</div>
    </div>
  );
}

// ═══════════════════════════════════════════════════════════════════════════════
// HOME PLAN
// ═══════════════════════════════════════════════════════════════════════════════
function HomePlan() {
  return (
    <div className="space-y-5">

      <Alert color="green" icon="✅">
        <b>Your home setup:</b> Barbell + dumbbells + plates, chest expander, elliptical machine, yoga mat.
        This plan is built for days you can't get to the gym — and for Friday (rest + home day).
      </Alert>

      {/* Daily Schedule */}
      <Section title="📅 Restructured Daily Schedule">
        <Table
          headers={['Time', 'Activity', 'Notes']}
          rows={[
            ['7:30 am', 'Wake up', 'Drink 1 glass water immediately'],
            ['7:45 am', 'Weigh-in (optional)', 'Same time daily = most accurate'],
            ['8:00 am', 'Leave for office', '—'],
            ['8:30 am', 'Breakfast at office', 'See meal plan below — not the chicken bun!'],
            ['10:30 am', 'Coffee / Green tea', 'No sugar. Snack if hungry (boiled egg, nuts)'],
            ['1:00–2:00 pm', 'Lunch break', 'Chapati + dal or rice-free option'],
            ['4:30 pm', 'Coffee / Green tea', 'No sugar. Last caffeine of the day.'],
            ['6:30 pm', 'Home from office', '—'],
            ['7:00–7:30 pm', 'Home training (Sun/Mon/Wed)', 'Or elliptical on off days'],
            ['9:00–9:30 pm', 'Dinner', 'Aim for 9:00pm. 3 chapati max.'],
            ['10:30 pm', 'Sleep', 'BG check optional before bed'],
          ]}
        />
      </Section>

      {/* 7-day Meal Plan */}
      <Section title="🍽️ 7-Day Meal Plan">
        <div className="space-y-3">
          {[
            { day:'Sunday', breakfast:'Wheat puttu (2) + sambar + 2 boiled eggs', lunch:'3 wheat chapati + dal + veg curry', snack:'Black coffee + handful nuts', dinner:'3 chapati + sambar + small salad' },
            { day:'Monday', breakfast:'Ragi puttu (2) + sambar + 1 boiled egg', lunch:'Rice dosa (2) + coconut chutney + sambar', snack:'Green tea + boiled egg', dinner:'3 chapati + fish curry' },
            { day:'Tuesday', breakfast:'Wheat puttu + sambar + egg white omelette (3 whites)', lunch:'3 chapati + chicken curry (grilled)', snack:'Black coffee + 3 dates', dinner:'Wheat dosa (2) + sambar + small portion dal' },
            { day:'Wednesday', breakfast:'Oats (1 cup) + boiled egg (2)', lunch:'3 chapati + dal + veg sabji', snack:'Green tea + nuts', dinner:'3 ragi chapati + sambar + salad' },
            { day:'Thursday', breakfast:'Wheat puttu + sambar + 2 boiled eggs', lunch:'Dosa (2) + coconut chutney', snack:'Football day — banana pre-game, water during', dinner:'3 chapati + chicken curry + salad' },
            { day:'Friday', breakfast:'Ragi puttu + sambar + egg white omelette', lunch:'3 chapati + dal makhani', snack:'Black coffee + boiled egg', dinner:'3 wheat chapati + fish curry + salad' },
            { day:'Saturday', breakfast:'Wheat puttu + sambar + 2 boiled eggs', lunch:'Brown rice (small) + sambar + curry', snack:'Green tea + nuts', dinner:'3 chapati + dal + veg' },
          ].map(d => (
            <div key={d.day} className="border border-gray-100 rounded-xl overflow-hidden">
              <div className="bg-brand-700 text-white text-xs font-bold px-3 py-1.5">{d.day}</div>
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-0 divide-x divide-gray-100">
                {[['🌅 Breakfast', d.breakfast], ['☀️ Lunch', d.lunch], ['🍎 Snack', d.snack], ['🌙 Dinner', d.dinner]].map(([label, val]) => (
                  <div key={label} className="p-2.5">
                    <div className="text-xs font-semibold text-brand-500 mb-1">{label}</div>
                    <div className="text-xs text-gray-600 leading-relaxed">{val}</div>
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>

        <div className="mt-4 grid grid-cols-1 sm:grid-cols-2 gap-3">
          <Alert color="green" icon="✅">
            <b>Always eat:</b> Wheat/ragi puttu, sambar, boiled eggs, chapati, dal, fish curry, grilled chicken, green tea without sugar
          </Alert>
          <Alert color="red" icon="🚫">
            <b>Avoid:</b> Chicken bun sandwich, sugary coffee (3×/day = 60g hidden sugar!), fried egg bullseye (worsens LDL), late dinner after 9:30pm
          </Alert>
        </div>
      </Section>

      {/* Weekly Training Schedule */}
      <Section title="🏠 4-Week Home Training Schedule">
        <Table
          headers={['Day', 'Session', 'Equipment', 'Duration']}
          rows={[
            ['Sunday',    'Resistance A — Chest + Back',     'Barbell, dumbbells',         '40–45 min'],
            ['Monday',    'Elliptical Cardio',                'Elliptical machine',          '30 min'],
            ['Tuesday',   'Resistance B — Shoulders + Arms', 'Dumbbells, chest expander',  '40–45 min'],
            ['Wednesday', 'Elliptical + Core',               'Elliptical, yoga mat',        '35 min'],
            ['Thursday',  'Football ⚽ (or rest)',           'Outdoor',                     '60–90 min'],
            ['Friday',    'REST + Meal prep',                '—',                           '—'],
            ['Saturday',  'Light elliptical or badminton 🏸', 'Elliptical / outdoor',       '30 min'],
          ]}
        />
        <p className="text-xs text-gray-400 mt-2">Football = full cardio session. No elliptical on football days. Badminton = free high-value cardio.</p>
      </Section>

      {/* Week 1-2 Exercises */}
      <Section title="Week 1–2: Foundation (3 sets × 12 reps, 90s rest)">
        <div className="space-y-4">
          <div>
            <div className="flex items-center gap-2 mb-2"><Tag color="blue">Day A — Chest + Back</Tag></div>
            <ExTable
              headers={['Exercise', 'Sets', 'Reps', 'Load', 'Notes']}
              rows={[
                ['Barbell bench press',    '3','12','Light–moderate','Control the descent'],
                ['Dumbbell chest flyes',   '3','12','Light',         'Full stretch at bottom'],
                ['Barbell bent-over row',  '3','12','Moderate',      'Keep back flat'],
                ['Dumbbell single-arm row','3','12 each','Moderate', 'Elbow drives back'],
                ['Chest expander pulls',   '3','15','Medium band',   'Slow and controlled'],
                ['Push-ups',               '3','Max','Bodyweight',   'Full range of motion'],
              ]}
            />
          </div>
          <div>
            <div className="flex items-center gap-2 mb-2"><Tag color="purple">Day B — Shoulders + Arms</Tag></div>
            <ExTable
              headers={['Exercise', 'Sets', 'Reps', 'Load', 'Notes']}
              rows={[
                ['Dumbbell shoulder press', '3','12','Moderate',  'Sit or stand'],
                ['Lateral raises',          '3','15','Light',     'Lead with elbows'],
                ['Front raises',            '3','12','Light',     'Alternate arms'],
                ['Dumbbell bicep curls',    '3','12','Moderate',  'Full extension down'],
                ['Hammer curls',            '3','12','Moderate',  'Neutral grip'],
                ['Tricep overhead ext.',    '3','12','Light–mod', 'One dumbbell, both hands'],
                ['Chest expander triceps',  '3','15','Band',      'Behind-head pull'],
              ]}
            />
          </div>
        </div>
      </Section>

      {/* Week 3-4 */}
      <Section title="Week 3–4: Progressive (4 sets × 10 reps, 60s rest)">
        <Alert color="amber" icon="📈">
          Same exercises as Week 1–2 but: <b>4 sets instead of 3, heavier load, 60 seconds rest</b>. 
          If you completed all reps easily in Week 2, add 2.5–5 kg to the bar.
        </Alert>
      </Section>

      {/* Elliptical Protocol */}
      <Section title="🚲 Elliptical Cardio Protocol">
        <Table
          headers={['Phase', 'Duration', 'Intensity', 'Purpose']}
          rows={[
            ['Warm-up',       '5 min',  'Easy — comfortable pace',       'Get heart rate up gradually'],
            ['Main work',     '20 min', 'Moderate — can hold conversation','Fat burning zone'],
            ['Intervals',     '5 min',  '30s hard / 30s easy × 5',       'BG lowering effect'],
            ['Cool-down',     '5 min',  'Easy',                           'Heart rate recovery'],
          ]}
        />
        <p className="text-xs text-gray-400 mt-2">Post-leg workout elliptical walk is the single highest-impact session for blood sugar control.</p>
      </Section>

      {/* Monitoring */}
      <Section title="📊 What to Track Weekly">
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          {[
            { label:'Fasting BG', target:'5–7 mmol/L', freq:'Daily' },
            { label:'Post-meal BG', target:'<8.5 mmol/L', freq:'2h after lunch' },
            { label:'Weight', target:'Lose 0.5 kg/wk', freq:'Every Sunday' },
            { label:'Waist', target:'Reduce 1cm/month', freq:'Monthly' },
          ].map(m => (
            <div key={m.label} className="bg-brand-50 rounded-xl p-3 text-center">
              <div className="text-xs text-gray-500 mb-1">{m.label}</div>
              <div className="text-sm font-bold text-brand-700">{m.target}</div>
              <div className="text-xs text-gray-400 mt-0.5">{m.freq}</div>
            </div>
          ))}
        </div>
      </Section>
    </div>
  );
}

// ═══════════════════════════════════════════════════════════════════════════════
// GYM PLAN
// ═══════════════════════════════════════════════════════════════════════════════

// ── Machine data — photo thumbnails from YouTube tutorials ───────────────────
const MACHINES = [
  {
    name: 'Life Fitness — Angled Leg Press',
    muscle: 'Quads · Glutes · Hamstrings',
    videoId: 'IZxyjW7MPJQ',
    badge: '⭐ Best for BG',
    badgeColor: 'bg-green-100 text-green-700',
    tip: 'Your #1 BG-lowering machine. 4 sets here can drop BG by 2 mmol/L.',
  },
  {
    name: 'Plate-loaded Hack Squat',
    muscle: 'Quads (deep) · Glutes',
    videoId: 'EdtPMnMxKCo',
    badge: 'Legs',
    badgeColor: 'bg-purple-100 text-purple-700',
    tip: 'Start with 2×10 kg plates only. Knees track toes throughout.',
  },
  {
    name: 'Hip Thrust / Glute Machine',
    muscle: 'Glutes · Posterior Chain',
    videoId: 'LM8XHLYJoYs',
    badge: 'Legs',
    badgeColor: 'bg-purple-100 text-purple-700',
    tip: 'Squeeze glutes hard at top and hold 2 sec every rep.',
  },
  {
    name: 'Life Fitness — Horizontal Bench Press',
    muscle: 'Chest · Triceps · Front Delts',
    videoId: 'vcBig73ojpE',
    badge: 'Push',
    badgeColor: 'bg-blue-100 text-blue-700',
    tip: 'Feet flat, slight arch, press through chest. 60 kg to start.',
  },
  {
    name: 'Life Fitness — Decline Press',
    muscle: 'Lower Chest · Triceps',
    videoId: 'LfyQBUKR8SE',
    badge: 'Push',
    badgeColor: 'bg-blue-100 text-blue-700',
    tip: 'Elbows at 45° — never flare straight out. Great lower chest builder.',
  },
  {
    name: 'Hammer Strength — Chest / Incline Press',
    muscle: 'Chest · Shoulders · Triceps',
    videoId: 'vcBig73ojpE',
    badge: 'Push',
    badgeColor: 'bg-blue-100 text-blue-700',
    tip: 'Plate-loaded — independent arm movement, great for symmetry.',
  },
  {
    name: 'Cable Crossover / Pec Deck',
    muscle: 'Inner Chest · Stretch',
    videoId: 'taI4XduLpTk',
    badge: 'Push',
    badgeColor: 'bg-blue-100 text-blue-700',
    tip: 'Light weight. Slow 3-sec return. Full chest stretch at start.',
  },
  {
    name: 'Hoist — Lat Pulldown',
    muscle: 'Lats · Biceps · Rear Delts',
    videoId: 'CAwf7n6Luuc',
    badge: 'Pull',
    badgeColor: 'bg-red-100 text-red-700',
    tip: 'Lean back 15°, pull to upper chest, drive elbows down and back.',
  },
  {
    name: 'Hammer Strength — Seated Row',
    muscle: 'Mid-back · Rhomboids · Biceps',
    videoId: 'GZbfZ033f74',
    badge: 'Pull',
    badgeColor: 'bg-red-100 text-red-700',
    tip: 'Pull to navel, squeeze shoulder blades at end. Keep back upright.',
  },
  {
    name: 'Hoist — Preacher Curl (Biceps)',
    muscle: 'Biceps Brachii',
    videoId: 'fIWP-FRFNU0',
    badge: 'Pull',
    badgeColor: 'bg-red-100 text-red-700',
    tip: 'Full ROM — extend fully at bottom. Squeeze hard at top for 1 sec.',
  },
  {
    name: 'Hoist — Seated Dip (Triceps)',
    muscle: 'Triceps (all 3 heads)',
    videoId: '0326dy_-CzM',
    badge: 'Push',
    badgeColor: 'bg-blue-100 text-blue-700',
    tip: 'Push straight down. Slow 2-sec return. Squeeze triceps at bottom.',
  },
  {
    name: 'Treadmill',
    muscle: 'Cardio · Glutes · Calves',
    videoId: 'sSFmSVBIe-g',
    badge: '⭐ Post-Legs Must',
    badgeColor: 'bg-green-100 text-green-700',
    tip: '15 min at incline 5–8%, speed 5.5 km/h after legs. Biggest BG drop.',
  },
];

// ── Video Modal ───────────────────────────────────────────────────────────────
function VideoModal({ machine, onClose }) {
  const photo = gymPhoto(machine.name);
  const [showPhoto, setShowPhoto] = React.useState(false);
  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-3"
      style={{ background: 'rgba(0,0,0,0.80)' }}
      onClick={e => { if (e.target === e.currentTarget) onClose(); }}>
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-lg overflow-hidden max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="flex items-start justify-between p-4 border-b border-gray-100 sticky top-0 bg-white z-10">
          <div>
            <h3 className="font-bold text-brand-700 text-sm leading-tight">{machine.name}</h3>
            <p className="text-xs text-gray-500 mt-0.5">{machine.muscle}</p>
          </div>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-700 text-2xl leading-none ml-3">×</button>
        </div>

        {/* Tutorial video */}
        <div className="relative w-full" style={{ paddingBottom: '56.25%' }}>
          <iframe
            className="absolute inset-0 w-full h-full"
            src={`https://www.youtube.com/embed/${machine.videoId}?rel=0&modestbranding=1&autoplay=1`}
            title={machine.name}
            allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
            allowFullScreen
          />
        </div>

        {/* Your real gym machine photo */}
        {photo && (
          <div className="border-t border-gray-100">
            <div className="px-4 py-2 flex items-center justify-between bg-gray-50">
              <span className="text-xs font-semibold text-gray-500 uppercase tracking-wide">📸 Your Gym Machine (Muscat)</span>
              <button onClick={()=>setShowPhoto(p=>!p)} className="text-xs text-brand-500 font-medium">
                {showPhoto ? 'Hide' : 'Show photo'}
              </button>
            </div>
            {showPhoto ? (
              <img src={photo} alt={machine.name}
                className="w-full object-cover cursor-pointer"
                style={{maxHeight:360}} loading="lazy"
                onClick={()=>setShowPhoto(false)} />
            ) : (
              <button onClick={()=>setShowPhoto(true)}
                className="w-full py-3 flex items-center justify-center gap-2 text-sm text-brand-600 hover:bg-brand-50 transition-colors">
                <span className="text-xl">📷</span>
                <span>Tap to see the machine in your gym</span>
              </button>
            )}
          </div>
        )}

        {/* Tip */}
        <div className="p-4 border-t border-gray-100">
          <div className="flex gap-2 items-start bg-brand-50 rounded-xl p-3">
            <span className="text-lg flex-shrink-0">💡</span>
            <p className="text-xs text-brand-700">{machine.tip}</p>
          </div>
          <button onClick={onClose}
            className="mt-3 w-full py-2 rounded-xl bg-gray-100 text-gray-600 text-sm font-medium hover:bg-gray-200 transition-colors">
            Close
          </button>
        </div>
      </div>
    </div>
  );
}

// ── Machine Gallery ───────────────────────────────────────────────────────────
function MachineGallery() {
  const [active, setActive] = React.useState(null);

  return (
    <div>
      {active && <VideoModal machine={active} onClose={() => setActive(null)} />}

      <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
        {MACHINES.map(m => (
          <button
            key={m.name}
            type="button"
            onClick={() => setActive(m)}
            className="group rounded-2xl border border-gray-200 bg-white overflow-hidden hover:border-brand-400 hover:shadow-md transition-all text-left">

            {/* Thumbnail — show real gym photo if available, else YouTube */}
            <div className="relative overflow-hidden" style={{ paddingBottom: '56.25%' }}>
              <img
                src={gymPhoto(m.name) || `https://img.youtube.com/vi/${m.videoId}/mqdefault.jpg`}
                alt={m.name}
                loading="lazy"
                className="absolute inset-0 w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
              />
              {/* Play overlay */}
              <div className="absolute inset-0 flex items-center justify-center bg-black bg-opacity-25 group-hover:bg-opacity-40 transition-all">
                <div className="w-10 h-10 rounded-full bg-red-600 bg-opacity-90 flex items-center justify-center shadow-lg group-hover:scale-110 transition-transform">
                  <div className="w-0 h-0 ml-1"
                    style={{ borderTop:'7px solid transparent', borderBottom:'7px solid transparent', borderLeft:'12px solid white' }} />
                </div>
              </div>
              {/* Badge */}
              <div className="absolute top-2 left-2">
                <span className={`text-xs font-semibold px-2 py-0.5 rounded-full shadow-sm ${m.badgeColor}`}>
                  {m.badge}
                </span>
              </div>
            </div>

            {/* Info */}
            <div className="p-2.5">
              <div className="text-xs font-semibold text-gray-800 leading-tight">{m.name}</div>
              <div className="text-xs text-gray-400 mt-0.5">{m.muscle}</div>
              <div className="text-xs text-brand-500 mt-1 font-medium">▶ Tap to watch tutorial</div>
            </div>
          </button>
        ))}
      </div>
    </div>
  );
}

// ── GymPlan ───────────────────────────────────────────────────────────────────
function GymPlan() {
  return (
    <div className="space-y-5">

      <Alert color="red" icon="⚠️">
        <b>ALWAYS before gym:</b> Check blood glucose. Below 5 mmol/L → eat banana and wait 15 min.
        Above 13 mmol/L → skip weights, light treadmill only. Bring dates to gym every session.
      </Alert>

      {/* Machine Gallery */}
      <Section title="🏋️ Your Gym Machines — Tap to Watch Tutorial">
        <p className="text-xs text-gray-400 mb-3">Tap any machine photo to watch the tutorial video and see form tips.</p>
        <MachineGallery />
      </Section>

      {/* Weekly Schedule */}
      <Section title="📅 Weekly Gym Schedule">
        <Table
          headers={['Day', 'Session', 'Key Machines', 'Cardio Finish']}
          rows={[
            ['Sunday ✅',    'Push — Chest & Shoulders', 'Bench Press · Decline · Seated Dip', 'Treadmill 10 min'],
            ['Monday ✅',    'Pull — Back & Biceps',     'Lat Pulldown · Row · Preacher Curl',  'Bike 10 min'],
            ['Tuesday ✅',   'Legs + Core',              'Leg Press · Hack Squat · Hip Thrust', 'Treadmill 15 min 🌟'],
            ['Wednesday ✅', 'Metabolic Full Body',      'All machines — lighter, fast pace',   'Built into session'],
            ['Thursday',    'Football or Upper Body',   'Bench · Lat Pulldown · Curls',        'Football = full cardio'],
            ['Saturday',    'Push (optional)',           'Bench Press · Decline · Dip',         'Treadmill 10 min'],
            ['Friday 🟢',   'REST',                     '—',                                   'Home elliptical 30 min'],
          ]}
        />
      </Section>

      {/* Push Day */}
      <Section title="🔵 PUSH DAY — Chest · Shoulders · Triceps (Sun / Sat)">
        <ExTable
          headers={['Exercise','Machine','Sets','Reps','Load','Tip']}
          rows={[
            ['Horizontal Bench Press', 'Life Fitness', '4','10–12','60 kg start','Feet flat, press through chest'],
            ['Decline Press',          'Life Fitness', '3','10–12','50 kg start','Elbows 45°, squeeze at top'],
            ['Cable Crossover / Pec Deck','Cable stack','3','12–15','Moderate',  'Slow 3-sec return'],
            ['Dumbbell Shoulder Press','Dumbbells',    '3','12',    '14–16 kg',  'Core tight, no back arch'],
            ['Lateral Raises',         'Dumbbells',    '3','15',    '8–10 kg',   'Lead with elbows, stop at shoulder'],
            ['Seated Dip',             'Hoist',        '3','12–15', 'Stack 6–8', 'Push down, slow return'],
            ['Treadmill',              'Treadmill',    '—','10 min','Incline 5%','After weights, not before'],
          ]}
        />
      </Section>

      {/* Pull Day */}
      <Section title="🔴 PULL DAY — Back · Biceps (Mon)">
        <ExTable
          headers={['Exercise','Machine','Sets','Reps','Load','Tip']}
          rows={[
            ['Lat Pulldown',        'Hoist',          '4','10–12','Stack 8–10','Pull to upper chest, lean back 15°'],
            ['Seated Cable Row',    'Cable station',  '3','10–12','Stack 8–10','Pull to navel, squeeze blades'],
            ['Hammer Strength Row', 'Hammer Strength','3','10',    'Plate-load','Independent arms, great symmetry'],
            ['Face Pulls',          'Cable (rope)',   '3','15–20', 'Light',     'Elbows high, thumbs toward ears'],
            ['Preacher Curl',       'Hoist',          '3','10–12', 'Stack 6',   'Full ROM, squeeze at top 1 sec'],
            ['Hammer Curl',         'Dumbbells',      '3','12',    '12–14 kg',  'Neutral grip, no swinging'],
          ]}
        />
      </Section>

      {/* Legs Day */}
      <Section title="🟣 LEGS DAY — Quads · Glutes · Hamstrings (Tue) ⭐ Most Important for BG">
        <Alert color="green" icon="🩸">
          Legs Day = your biggest blood glucose session. The 15-min post-leg treadmill walk at 5% incline is mandatory — this alone can drop BG by 1.5–3 mmol/L.
        </Alert>
        <div className="mt-3">
          <ExTable
            headers={['Exercise','Machine','Sets','Reps','Load','Tip']}
            rows={[
              ['Angled Leg Press',   'Life Fitness',     '4','12–15','80–100 kg', 'Feet shoulder-width, push through heels'],
              ['Hack Squat',         'Plate-loaded',     '3','10–12','2×10 kg',   'Lower slowly, knees track toes'],
              ['Leg Extension',      'Machine',          '3','15',    'Stack 6–8', 'Full extension, squeeze quads 1 sec'],
              ['Leg Curl',           'Machine',          '3','12–15', 'Stack 6–8', 'Curl fully, hold 1 sec, lower slow'],
              ['Hip Thrust',         'Glute Machine',    '3','15',    'Moderate',  'Squeeze glutes at top, hold 2 sec'],
              ['Calf Raises',        'Leg Press platform','4','20–25','Light',     'Full stretch at bottom, high rise'],
              ['Treadmill incline',  'Treadmill',        '1','15 min','5.5 km/h', '🌟 MANDATORY. Incline 5–8%. Log your BG drop.'],
            ]}
          />
        </div>
      </Section>

      {/* Metabolic Day */}
      <Section title="🟠 METABOLIC DAY — Full Body Circuit (Wed)">
        <p className="text-xs text-gray-500 mb-3">Higher reps, 30s rest, all major machines. Biggest calorie burn + BG flush of the week.</p>
        <ExTable
          headers={['Exercise','Machine','Rounds','Reps','Load']}
          rows={[
            ['Leg Press — fast reps',    'Life Fitness', '3','20','50–60 kg'],
            ['Lat Pulldown',             'Hoist',        '3','15','Stack 7'],
            ['Horizontal Bench Press',   'Life Fitness', '3','15','40–50 kg'],
            ['Seated Cable Row',         'Cable station','3','15','Stack 7'],
            ['Seated Dip',               'Hoist',        '3','15','Stack 6'],
            ['Treadmill / Step Machine', 'Cardio',       '1','15 min','Moderate'],
          ]}
        />
      </Section>

      {/* 8-Week Progression */}
      <Section title="📈 8-Week Progressive Overload">
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-3">
          {[
            ['Week 1–2','🧱 Foundation','3 sets · 12–15 reps','Learn machines. Perfect form.'],
            ['Week 3–4','🏗️ Build',    '3–4 sets · 10–12 reps','+5 kg legs, +2 kg upper.'],
            ['Week 5–6','💪 Strength', '4 sets · 8–10 reps', 'Push heavier on compounds.'],
            ['Week 7–8','🔥 Hypertrophy','4 sets · 10–12 reps','Add reps first, then weight.'],
          ].map(([wk, phase, sets, note]) => (
            <div key={wk} className="bg-brand-50 rounded-xl p-3">
              <div className="text-xs text-gray-400">{wk}</div>
              <div className="font-bold text-brand-700 text-sm mt-0.5">{phase}</div>
              <div className="text-xs text-gray-600 mt-1">{sets}</div>
              <div className="text-xs text-gray-400 mt-0.5">{note}</div>
            </div>
          ))}
        </div>
      </Section>

      {/* Gym Nutrition */}
      <Section title="🍽️ Gym Day Nutrition">
        <Table
          headers={['Timing', 'What to Eat', 'Why']}
          rows={[
            ['Pre-gym (30–60 min before)', '1 banana + 2–3 dates', 'Raises BG to safe zone (5–8 mmol/L). Fast energy.'],
            ['During (if >60 min)',         '200 ml water + 2 dates', 'Prevents hypoglycaemia mid-session.'],
            ['Post-gym (within 30 min)',    '3 boiled eggs + 2 chapati OR chicken + rice', 'Muscle repair + stable overnight BG.'],
            ['Dinner (gym day)',            '3 chapati + sambar + protein. By 9:30 pm.', 'Never skip. BG can crash overnight after heavy training.'],
          ]}
        />
      </Section>

      {/* BG Safety */}
      <Section title="🩸 Blood Glucose Safety Rules">
        <div className="space-y-2">
          {[
            ['Below 5.0 mmol/L', '🔵 Eat banana + dates. Wait 15 min. Re-check before starting.', 'bg-blue-50 text-blue-700'],
            ['5–13 mmol/L',      '🟢 Safe to train. Full intensity. Have dates in your bag.',     'bg-green-50 text-green-700'],
            ['Above 13 mmol/L',  '🔴 Skip weights. Light treadmill walk only. Hydrate well.',      'bg-red-50 text-red-700'],
          ].map(([range, action, cls]) => (
            <div key={range} className={`flex gap-3 items-start p-3 rounded-xl text-xs ${cls}`}>
              <span className="font-bold flex-shrink-0 w-28">{range}</span>
              <span>{action}</span>
            </div>
          ))}
        </div>
        <div className="mt-3 text-xs text-gray-400 bg-gray-50 rounded-xl p-3">
          📱 Log your pre and post BG in the <b>Workout</b> tab every session. The app tracks your BG drop per session and shows it in Analysis.
        </div>
      </Section>

    </div>
  );
}

export default function Plans() {
  const [tab, setTab] = useState('home');

  return (
    <div>
      <div className="mb-5">
        <h1 className="text-xl font-bold text-brand-700 mb-1">📋 Your Plans</h1>
        <p className="text-sm text-gray-500">Your personalised meal plan and training programs — built around your blood test, food habits, and schedule.</p>
      </div>

      <div className="flex gap-3 mb-6">
        <button onClick={()=>setTab('home')}
          className={`flex-1 py-3 rounded-xl font-semibold text-sm transition-colors border ${tab==='home'?'bg-brand-700 text-white border-brand-700':'bg-white text-brand-700 border-brand-200 hover:bg-brand-50'}`}>
          🏠 Home Plan
          <div className={`text-xs font-normal mt-0.5 ${tab==='home'?'text-brand-200':'text-gray-400'}`}>Meal plan · Home training</div>
        </button>
        <button onClick={()=>setTab('gym')}
          className={`flex-1 py-3 rounded-xl font-semibold text-sm transition-colors border ${tab==='gym'?'bg-brand-700 text-white border-brand-700':'bg-white text-brand-700 border-brand-200 hover:bg-brand-50'}`}>
          🏋️ Gym Plan
          <div className={`text-xs font-normal mt-0.5 ${tab==='gym'?'text-brand-200':'text-gray-400'}`}>Sun–Wed evenings · Push/Pull/Legs</div>
        </button>
      </div>

      {tab==='home' ? <HomePlan /> : <GymPlan />}
    </div>
  );
}
