// ── Plans Page — Home Plan + Gym Plan reference ──────────────────────────────
import { useState } from 'react';

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

function ExTable({ headers, rows }) {
  return (
    <div className="overflow-x-auto">
      <table className="w-full text-xs border-collapse">
        <thead>
          <tr>{headers.map((h,i)=><th key={i} className="bg-brand-500 text-white text-left px-2.5 py-1.5 font-semibold">{h}</th>)}</tr>
        </thead>
        <tbody>
          {rows.map((row,ri)=>(
            <tr key={ri} className={ri%2===0?'bg-white':'bg-gray-50'}>
              {row.map((cell,ci)=>(
                <td key={ci} className={`px-2.5 py-1.5 border-b border-gray-100 ${ci===0?'font-medium text-brand-700':'text-gray-600'}`}>{cell}</td>
              ))}
            </tr>
          ))}
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
function GymPlan() {
  return (
    <div className="space-y-5">

      <Alert color="red" icon="⚠️">
        <b>ALWAYS before gym:</b> Check blood glucose. Below 5 mmol/L → eat banana and wait 15 min.
        Above 13 mmol/L → skip weights, light treadmill only. Bring dates to gym every session.
      </Alert>

      {/* Weekly Schedule */}
      <Section title="📅 Weekly Gym Schedule">
        <Table
          headers={['Day', 'Status', 'Session', 'Cardio', 'Notes']}
          rows={[
            ['Saturday',  'Work — optional gym', 'Push — Chest & Shoulders', '10 min treadmill',       'Go if energy is good'],
            ['Sunday',    'Work — GYM ✅',       'Push — Chest & Shoulders', '10 min treadmill',       'Core day. Never skip.'],
            ['Monday',    'Work — GYM ✅',       'Pull — Back & Biceps',     '10 min bike/elliptical', 'Core day. Never skip.'],
            ['Tuesday',   'Work — GYM ✅',       'Legs + Core',              '15 min treadmill walk',  'Core day. Never skip.'],
            ['Wednesday', 'Work — GYM ✅',       'Metabolic Full Body',      'Built into session',     'Best fat-burn session.'],
            ['Thursday',  'Football or gym',     'Upper Body (if no footy)', 'Football = full cardio', 'Football takes priority.'],
            ['Friday',    'REST 🟢',             '—',                        'Home elliptical 30 min', 'Rest + meal prep.'],
          ]}
        />
      </Section>

      {/* Week 1-2 */}
      <Section title="Week 1–2: Foundation (3 sets, 90s rest, light–moderate load)">
        <div className="space-y-5">

          <div>
            <div className="flex items-center gap-2 mb-2"><Tag color="blue">Day A — Push (Sun / Sat)</Tag><span className="text-xs text-gray-400">Chest · Shoulders · Triceps</span></div>
            <ExTable
              headers={['Exercise','Sets','Reps','Load','Technique']}
              rows={[
                ['Barbell bench press',      '3','12','60–70% 1RM','3 sec descent, pause, press'],
                ['Incline dumbbell press',   '3','12','Moderate',   '30–45° incline'],
                ['Cable / dumbbell flyes',   '3','12','Light',      'Squeeze chest at top'],
                ['Seated dumbbell shoulder press','3','12','Moderate','Core tight, no arching'],
                ['Lateral raises',           '3','15','Light',      'Lead with elbows, slow down'],
                ['Tricep pushdowns (cable)', '3','12','Moderate',   'Elbows tucked to sides'],
                ['Treadmill walk',           '—','10 min','Incline 3–5°','After weights, not before'],
              ]}
            />
          </div>

          <div>
            <div className="flex items-center gap-2 mb-2"><Tag color="green">Day B — Pull (Mon)</Tag><span className="text-xs text-gray-400">Back · Biceps · Rear delts</span></div>
            <ExTable
              headers={['Exercise','Sets','Reps','Load','Technique']}
              rows={[
                ['Lat pulldown',             '3','12','Moderate',  'Pull to upper chest, lean back slightly'],
                ['Seated cable row',         '3','12','Moderate',  'Elbows back, squeeze shoulder blades'],
                ['Dumbbell single-arm row',  '3','12ea','Moderate','Back flat, elbow drives back'],
                ['Face pulls (cable)',       '3','15','Light',     'Elbows high, external rotation'],
                ['Barbell / dumbbell curls', '3','12','Moderate',  'Full range, no swinging'],
                ['Hammer curls',             '3','12','Moderate',  'Neutral grip, controlled'],
                ['Bike / elliptical',        '—','10 min','Easy', 'Cool-down cardio'],
              ]}
            />
          </div>

          <div>
            <div className="flex items-center gap-2 mb-2"><Tag color="purple">Day C — Legs + Core (Tue)</Tag><span className="text-xs text-gray-400">Quads · Hamstrings · Glutes · Core</span></div>
            <ExTable
              headers={['Exercise','Sets','Reps','Load','Technique']}
              rows={[
                ['Leg press',             '3','12','Moderate',     'Feet shoulder-width, full depth'],
                ['Leg extension',         '3','12','Light–mod',    'Full extension, slow descent'],
                ['Leg curl (lying)',       '3','12','Light–mod',    'Curl to 90°, control down'],
                ['Calf raises (machine)', '3','15','Moderate',     'Full range, pause at top'],
                ['Plank',                 '3','30–45s','Bodyweight','Straight line head to heel'],
                ['Russian twists',        '3','20','Light plate',  'Rotate fully each side'],
                ['Treadmill walk',        '—','15 min','Incline 4°','BEST session for BG drop'],
              ]}
            />
            <Alert color="blue" icon="💡">
              The 15-min treadmill walk after leg day is the single most effective blood sugar lowering session — legs use the most glucose of any muscle group.
            </Alert>
          </div>

          <div>
            <div className="flex items-center gap-2 mb-2"><Tag color="orange">Day D — Metabolic Full Body (Wed)</Tag><span className="text-xs text-gray-400">Circuits · Fat burn · BG control</span></div>
            <p className="text-xs text-gray-500 mb-3">Do as supersets — A1 + A2 back to back, 60s rest, repeat × 3. Then B1 + B2, etc.</p>
            <ExTable
              headers={['Superset','Exercise','Sets','Reps','Load']}
              rows={[
                ['A1','Goblet squat',              '3','15','Moderate dumbbell'],
                ['A2','Dumbbell Romanian deadlift', '3','12','Moderate'],
                ['B1','Push-ups',                  '3','Max','Bodyweight'],
                ['B2','Dumbbell bent-over row',    '3','12ea','Moderate'],
                ['C1','Dumbbell shoulder press',   '3','12','Moderate'],
                ['C2','Lateral raises',            '3','15','Light'],
                ['D1','Dumbbell bicep curls',      '3','12','Moderate'],
                ['D2','Mountain climbers',         '3','30s','Bodyweight'],
              ]}
            />
          </div>

        </div>
      </Section>

      {/* Week 3-4 */}
      <Section title="Week 3–4: Progressive (4 sets, 60s rest, heavier load)">
        <Alert color="amber" icon="📈">
          Same split as Week 1–2. Increase to <b>4 sets</b>, drop rest to <b>60 seconds</b>, and add weight wherever you completed all reps comfortably in Week 2.
          Rule: if you hit all reps with 1 RIR (rep in reserve), add 2.5–5 kg.
        </Alert>
        <div className="mt-3 grid grid-cols-2 sm:grid-cols-4 gap-3">
          {[['Push','4 sets, 10 reps'],['Pull','4 sets, 10 reps'],['Legs','4 sets, 10 reps'],['Metabolic','4 rounds']].map(([d,n])=>(
            <div key={d} className="bg-brand-50 rounded-xl p-3 text-center">
              <div className="font-bold text-brand-700 text-sm">{d}</div>
              <div className="text-xs text-gray-500 mt-0.5">{n}</div>
              <div className="text-xs text-gray-400">60s rest</div>
            </div>
          ))}
        </div>
      </Section>

      {/* Gym Nutrition */}
      <Section title="🍽️ Gym Day Nutrition">
        <Table
          headers={['Timing', 'What to Eat', 'Why']}
          rows={[
            ['30–60 min before gym', '1 banana + 2–3 dates', 'Raises BG to safe zone (5–8 mmol/L). Fast energy.'],
            ['During gym (if >60 min)', '200ml water + 2 dates', 'Prevent hypoglycaemia. Bring dates in pocket.'],
            ['Within 30 min after gym', 'Protein-rich meal — eggs + chapati, or chicken + rice', 'Muscle repair. Keeps BG stable post-workout.'],
            ['Dinner (gym day)', '3 chapati + sambar + lean protein. Eat by 9:30pm.', 'Don\'t skip dinner after gym. BG can drop overnight.'],
          ]}
        />
      </Section>

      {/* Diabetic Safety */}
      <Section title="🩸 Diabetic Safety Rules">
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <div className="space-y-2">
            <h3 className="text-sm font-semibold text-brand-700">Before Every Session</h3>
            {[
              ['Below 4.0','Eat full meal. Do not train today.','red'],
              ['4.0–5.0','Eat banana + dates. Wait 15 min then train.','amber'],
              ['5.0–10.0','Safe to train. Go ahead.','green'],
              ['10.0–13.0','Light session only. No heavy weights.','amber'],
              ['Above 13.0','Skip weights. Light treadmill walk or rest.','red'],
            ].map(([range, action, color])=>(
              <div key={range} className={`flex gap-2.5 p-2.5 rounded-xl text-xs ${color==='red'?'bg-health-redBg':color==='amber'?'bg-health-amberBg':'bg-health-greenBg'}`}>
                <span className={`font-bold shrink-0 ${color==='red'?'text-health-red':color==='amber'?'text-health-amber':'text-health-green'}`}>{range}</span>
                <span className="text-gray-700">{action}</span>
              </div>
            ))}
          </div>
          <div className="space-y-2">
            <h3 className="text-sm font-semibold text-brand-700">Red Flags — Stop Immediately</h3>
            {[
              'Dizziness, trembling, or unusual sweating → eat dates, sit down, rest',
              'Chest pain or shortness of breath at rest or during warm-up → stop, seek help',
              'Severe knee or back pain → stop that exercise immediately, do not push through',
              'BG above 13 mid-session → stop weights, drink water, do light walking',
              'Persistent fatigue >3 days → may be overtraining or medication issue',
            ].map((item,i)=>(
              <div key={i} className="flex gap-2 p-2.5 bg-health-redBg rounded-xl text-xs text-gray-700">
                <span className="text-health-red shrink-0">⛔</span>{item}
              </div>
            ))}
          </div>
        </div>
      </Section>

      {/* 12-week milestones */}
      <Section title="🎯 12-Week Milestones">
        <Table
          headers={['Metric', 'Now', 'Week 4 Goal', 'Week 12 Goal']}
          rows={[
            ['HbA1c', '8.9%', 'Below 8.0%', 'Below 7.0%'],
            ['Fasting BG', 'Elevated', '6–8 mmol/L', '5–7 mmol/L'],
            ['Weight', 'Current', 'Lose 2–3 kg', 'Lose 8–10 kg total'],
            ['Waist', 'Current', 'Reduce 3–5 cm', 'Healthy range (<90 cm)'],
            ['LDL cholesterol', '4.12 mmol/L', 'Improving', 'Below 3.0 mmol/L'],
            ['Vitamin D', '15.8 ng/mL', 'Supplement started', 'Above 30 ng/mL'],
          ]}
        />
      </Section>

    </div>
  );
}

// ═══════════════════════════════════════════════════════════════════════════════
// MAIN PLANS PAGE
// ═══════════════════════════════════════════════════════════════════════════════
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
