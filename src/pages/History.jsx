import { useEffect, useState } from 'react';
import { format, parseISO } from 'date-fns';
import { getVitals, deleteVitals, getMeals, deleteMeal, getWorkouts, deleteWorkout } from '../lib/supabase.js';

const WORKOUT_LABELS = {
  treadmill:'Treadmill', cycling:'Cycling', step:'Step Machine', step_cycling:'Step Cycling',
  gym_push:'Gym Push', gym_pull:'Gym Pull', gym_legs:'Gym Legs',
  gym_metabolic:'Gym Metabolic', gym_upper:'Gym Upper',
  home_resistance:'Home Resistance', home_cardio:'Home Cardio',
  football:'Football', badminton:'Badminton', rest:'Rest',
};
const MEAL_LABELS = {
  breakfast:'🌅 Breakfast', lunch:'☀️ Lunch', dinner:'🌙 Dinner',
  snack:'🍎 Snack', pre_gym:'💪 Pre-Gym', post_gym:'🥛 Post-Gym',
};

function DayFilter({ days, setDays, options=[7,30,90] }) {
  return (
    <div className="flex gap-2 mb-4">
      {options.map(d=>(
        <button key={d} onClick={()=>setDays(d)}
          className={`px-3 py-1 rounded-lg text-xs font-medium transition-colors ${days===d?'bg-brand-500 text-white':'bg-gray-100 text-gray-600 hover:bg-gray-200'}`}>
          Last {d} days
        </button>
      ))}
    </div>
  );
}

function VitalsHistory() {
  const [data, setData] = useState([]);
  const [loading, setLoading] = useState(true);
  const [days, setDays] = useState(30);

  useEffect(() => { setLoading(true); getVitals(days).then(d=>setData([...d].reverse())).finally(()=>setLoading(false)); }, [days]);

  const del = async id => {
    if (!confirm('Delete this record?')) return;
    await deleteVitals(id); setData(d=>d.filter(r=>r.id!==id));
  };

  return (
    <div>
      <DayFilter days={days} setDays={setDays} />
      {loading ? <p className="text-gray-400 text-sm">Loading…</p>
       : data.length===0 ? <p className="text-gray-400 text-sm text-center py-10">No vitals recorded yet.</p>
       : <div className="space-y-2">
           {data.map(r=>(
             <div key={r.id} className="card py-3 flex items-start gap-4">
               <div className="text-center min-w-[60px]">
                 <div className="text-xs font-bold text-brand-700">{format(parseISO(r.date),'dd MMM')}</div>
                 {r.time && <div className="text-xs text-gray-400">{r.time}</div>}
               </div>
               <div className="flex-1 grid grid-cols-2 sm:grid-cols-4 gap-2 text-sm">
                 {r.blood_glucose && <div><span className="text-xs text-gray-400">BG</span><br /><b className={r.blood_glucose>10?'text-health-red':r.blood_glucose>7?'text-health-amber':'text-health-green'}>{r.blood_glucose} mmol/L</b></div>}
                 {r.weight_kg     && <div><span className="text-xs text-gray-400">Weight</span><br /><b>{r.weight_kg} kg</b></div>}
                 {r.waist_cm      && <div><span className="text-xs text-gray-400">Waist</span><br /><b>{r.waist_cm} cm</b></div>}
                 {r.hba1c         && <div><span className="text-xs text-gray-400">HbA1c</span><br /><b className={r.hba1c>7?'text-health-red':'text-health-green'}>{r.hba1c}%</b></div>}
               </div>
               <button onClick={()=>del(r.id)} className="btn-danger text-xs py-1 px-2">Delete</button>
             </div>
           ))}
         </div>
      }
    </div>
  );
}

function MealsHistory() {
  const [data, setData]     = useState([]);
  const [loading, setLoading] = useState(true);
  const [days, setDays]     = useState(7);

  useEffect(() => { setLoading(true); getMeals(days).then(setData).finally(()=>setLoading(false)); }, [days]);

  const del = async id => {
    if (!confirm('Delete this meal?')) return;
    await deleteMeal(id); setData(d=>d.filter(r=>r.id!==id));
  };

  const grouped = data.reduce((acc,m)=>{ if(!acc[m.date])acc[m.date]=[]; acc[m.date].push(m); return acc; },{});

  return (
    <div>
      <DayFilter days={days} setDays={setDays} options={[3,7,14,30]} />
      {loading ? <p className="text-gray-400 text-sm">Loading…</p>
       : Object.keys(grouped).length===0 ? <p className="text-gray-400 text-sm text-center py-10">No meals recorded.</p>
       : Object.entries(grouped).map(([date,meals])=>(
           <div key={date} className="mb-5">
             <h3 className="text-sm font-semibold text-brand-700 mb-2">{format(parseISO(date),'EEEE, d MMMM yyyy')}</h3>
             <div className="space-y-2">
               {meals.map(m=>(
                 <div key={m.id} className="card py-2.5 flex items-start gap-3">
                   <div className="text-lg">{MEAL_LABELS[m.meal_type]?.split(' ')[0]||'🍽️'}</div>
                   <div className="flex-1 min-w-0">
                     <div className="text-xs font-semibold text-brand-600">
                       {MEAL_LABELS[m.meal_type]?.replace(/^\S+\s/,'')||m.meal_type}
                       {m.time && <span className="text-gray-400 font-normal ml-1">· {m.time}</span>}
                       {m.calories && <span className="text-gray-400 font-normal ml-1">· {m.calories} kcal</span>}
                     </div>
                     <div className="text-sm text-gray-700">{m.food_items}</div>
                     {m.notes && <div className="text-xs text-gray-400 italic">{m.notes}</div>}
                   </div>
                   <button onClick={()=>del(m.id)} className="btn-danger text-xs py-1 px-2">Del</button>
                 </div>
               ))}
             </div>
           </div>
         ))
      }
    </div>
  );
}

function WorkoutsHistory() {
  const [data, setData]     = useState([]);
  const [loading, setLoading] = useState(true);
  const [days, setDays]     = useState(30);

  useEffect(() => { setLoading(true); getWorkouts(days).then(setData).finally(()=>setLoading(false)); }, [days]);

  const del = async id => {
    if (!confirm('Delete this workout?')) return;
    await deleteWorkout(id); setData(d=>d.filter(r=>r.id!==id));
  };

  return (
    <div>
      <DayFilter days={days} setDays={setDays} />
      {loading ? <p className="text-gray-400 text-sm">Loading…</p>
       : data.length===0 ? <p className="text-gray-400 text-sm text-center py-10">No workouts recorded.</p>
       : <div className="space-y-3">
           {data.map(w=>(
             <div key={w.id} className="card py-3 flex items-start gap-4">
               <div className="text-center min-w-[60px]">
                 <div className="text-xs font-bold text-brand-700">{format(parseISO(w.date),'dd MMM')}</div>
                 {w.time && <div className="text-xs text-gray-400">{w.time}</div>}
               </div>
               <div className="flex-1 min-w-0">
                 <div className="flex items-center gap-2 mb-1 flex-wrap">
                   <span className="badge bg-brand-100 text-brand-700">{WORKOUT_LABELS[w.type]||w.type}</span>
                   {w.duration_min && <span className="text-xs text-gray-400">{w.duration_min} min</span>}
                  {w.distance_km && <span className="text-xs text-gray-400">📍 {w.distance_km} km</span>}
                   {w.pre_bg  && <span className="text-xs text-gray-400">Pre: {w.pre_bg} mmol/L</span>}
                   {w.post_bg && <span className="text-xs text-gray-400">Post: {w.post_bg} mmol/L</span>}
                 </div>
                 {w.exercises?.length>0 && (
                   <div className="text-xs text-gray-500">
                     {w.exercises.map((ex,i)=>(
                       <span key={i} className="mr-2">{ex.name} {ex.sets}×{ex.reps}{ex.weight_kg?` @${ex.weight_kg}kg`:''}</span>
                     ))}
                   </div>
                 )}
                 {w.notes && <div className="text-xs text-gray-400 italic mt-0.5">{w.notes}</div>}
               </div>
               <button onClick={()=>del(w.id)} className="btn-danger text-xs py-1 px-2">Del</button>
             </div>
           ))}
         </div>
      }
    </div>
  );
}

export default function History() {
  const [tab, setTab] = useState('workouts');
  const tabs = [['workouts','🏋️ Workouts'],['meals','🍽️ Meals'],['vitals','🩸 Vitals']];
  return (
    <div>
      <h1 className="text-xl font-bold text-brand-700 mb-1">📅 History</h1>
      <p className="text-sm text-gray-500 mb-5">Browse your logged data and spot patterns.</p>
      <div className="flex gap-2 mb-5 flex-wrap">
        {tabs.map(([val,lbl])=>(
          <button key={val} onClick={()=>setTab(val)}
            className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${tab===val?'bg-brand-500 text-white':'bg-white text-gray-600 hover:bg-gray-100 border border-gray-200'}`}>
            {lbl}
          </button>
        ))}
      </div>
      {tab==='workouts' && <WorkoutsHistory />}
      {tab==='meals'    && <MealsHistory />}
      {tab==='vitals'   && <VitalsHistory />}
    </div>
  );
}
