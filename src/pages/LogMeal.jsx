import { useState } from 'react';
import { format } from 'date-fns';
import { logMeal } from '../lib/supabase.js';

const today = format(new Date(), 'yyyy-MM-dd');
const now   = format(new Date(), 'HH:mm');

const MEAL_TYPES = [
  { value:'breakfast', label:'🌅 Breakfast', desc:'Morning meal (7:30–9am)' },
  { value:'lunch',     label:'☀️ Lunch',     desc:'Work lunch (1–2pm)' },
  { value:'snack',     label:'🍎 Snack',     desc:'Mid-morning or evening' },
  { value:'dinner',    label:'🌙 Dinner',    desc:'Evening meal (~9:30pm)' },
  { value:'pre_gym',   label:'💪 Pre-Gym',   desc:'Before session (banana, dates)' },
  { value:'post_gym',  label:'🥛 Post-Gym',  desc:'After session (protein-rich)' },
];

const QUICK_FOODS = {
  breakfast: ['Wheat puttu + sambar','Ragi puttu + sambar','Boiled eggs (2)','Egg white omelette','Oats','Idli + chutney'],
  lunch:     ['Rice + sambar + veg','Wheat chapati + curry','Dosa + chutney','Chicken + rice','Fish curry + rice'],
  snack:     ['Black coffee (no sugar)','Green tea','Banana','Dates (2–3)','Mixed nuts','Boiled egg'],
  dinner:    ['3 chapati + sambar','4 chapati + curry','Rice dosa + chutney','Wheat dosa','Ragi dosa'],
  pre_gym:   ['Banana','Banana + dates','Dates (3)','Light snack'],
  post_gym:  ['Eggs + chapati','Protein + rice','Chicken + veg','Dal + rice'],
};

export default function LogMeal() {
  const [form, setForm]   = useState({ date:today, time:now, meal_type:'', food_items:'', calories:'', notes:'' });
  const [status, setStatus] = useState(null);
  const [saving, setSaving] = useState(false);

  const set = (k,v) => setForm(f=>({...f,[k]:v}));
  const addQuick = food => set('food_items', form.food_items ? form.food_items+', '+food : food);

  const handleSubmit = async e => {
    e.preventDefault();
    setSaving(true); setStatus(null);
    const payload = Object.fromEntries(Object.entries(form).filter(([,v])=>v!==''));
    const { error } = await logMeal(payload);
    setStatus(error ? 'error' : 'success');
    if (!error) setForm(f=>({...f, food_items:'', calories:'', notes:''}));
    setSaving(false);
  };

  return (
    <div className="max-w-xl mx-auto">
      <h1 className="text-xl font-bold text-brand-700 mb-1">🍽️ Log Meal</h1>
      <p className="text-sm text-gray-500 mb-6">Track what you ate for blood sugar pattern analysis.</p>

      {status==='success' && <div className="mb-4 p-3 bg-health-greenBg text-health-green rounded-xl text-sm font-medium">✅ Meal logged!</div>}
      {status==='error'   && <div className="mb-4 p-3 bg-health-redBg  text-health-red   rounded-xl text-sm font-medium">❌ Failed to save.</div>}

      <form onSubmit={handleSubmit} className="card space-y-5">
        <div className="grid grid-cols-2 gap-4">
          <div><label className="label">Date</label><input type="date" className="input" value={form.date} onChange={e=>set('date',e.target.value)} required /></div>
          <div><label className="label">Time</label><input type="time" className="input" value={form.time} onChange={e=>set('time',e.target.value)} /></div>
        </div>

        <div>
          <label className="label">Meal Type</label>
          <div className="grid grid-cols-2 gap-2">
            {MEAL_TYPES.map(m=>(
              <button key={m.value} type="button" onClick={()=>set('meal_type',m.value)}
                className={`p-3 rounded-xl border text-left text-sm transition-colors ${form.meal_type===m.value?'border-brand-400 bg-brand-50 text-brand-700':'border-gray-200 bg-white text-gray-600 hover:bg-gray-50'}`}>
                <div className="font-medium">{m.label}</div>
                <div className="text-xs text-gray-400">{m.desc}</div>
              </button>
            ))}
          </div>
        </div>

        {QUICK_FOODS[form.meal_type]?.length > 0 && (
          <div>
            <label className="label">Quick Add</label>
            <div className="flex flex-wrap gap-2">
              {QUICK_FOODS[form.meal_type].map(f=>(
                <button key={f} type="button" onClick={()=>addQuick(f)}
                  className="badge bg-brand-100 text-brand-700 hover:bg-brand-200 cursor-pointer transition-colors py-1 px-2.5">+ {f}</button>
              ))}
            </div>
          </div>
        )}

        <div>
          <label className="label">Food Items *</label>
          <textarea className="input min-h-[90px] resize-none" placeholder="e.g. 2 wheat puttu, sambar, 1 boiled egg…"
            value={form.food_items} onChange={e=>set('food_items',e.target.value)} required />
        </div>

        <div><label className="label">Estimated Calories (optional)</label>
          <input type="number" min="0" max="5000" className="input" placeholder="e.g. 350" value={form.calories} onChange={e=>set('calories',e.target.value)} /></div>

        <div><label className="label">Notes (optional)</label>
          <input type="text" className="input" placeholder="e.g. felt full, BG was 6.2 before…" value={form.notes} onChange={e=>set('notes',e.target.value)} /></div>

        <button type="submit" className="btn-primary w-full" disabled={saving||!form.date||!form.meal_type||!form.food_items}>
          {saving?'Saving…':'💾 Save Meal'}
        </button>
      </form>

      <div className="mt-5 card bg-health-greenBg border-green-200">
        <h3 className="font-semibold text-health-green text-sm mb-2">✅ Good Choices for BG Control</h3>
        <div className="text-xs text-health-green space-y-1">
          <p>• <b>Breakfast:</b> Wheat/ragi puttu + sambar + boiled eggs (not fried)</p>
          <p>• <b>Lunch:</b> Chapati + dal/sambar — avoid plain white rice</p>
          <p>• <b>Snack:</b> Black coffee or green tea (no sugar), nuts, boiled egg</p>
          <p>• <b>Dinner:</b> 3 chapati max, eat before 9:30pm</p>
          <p>• <b>Avoid:</b> Chicken bun sandwich, sugary coffee, late heavy meals</p>
        </div>
      </div>
    </div>
  );
}
