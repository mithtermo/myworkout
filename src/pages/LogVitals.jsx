import { useState } from 'react';
import { format } from 'date-fns';
import { logVitals } from '../lib/supabase.js';

const today = format(new Date(), 'yyyy-MM-dd');
const now   = format(new Date(), 'HH:mm');

function getBGStatus(v) {
  if (!v) return null;
  const n = parseFloat(v);
  if (n < 4)   return { label:'🔵 Low — eat something first',          color:'text-blue-600' };
  if (n <= 7)  return { label:'🟢 Excellent — in target range',        color:'text-health-green' };
  if (n <= 10) return { label:'🟡 Elevated — watch meals today',       color:'text-health-amber' };
  return           { label:'🔴 High — avoid intense exercise today',   color:'text-health-red' };
}

export default function LogVitals() {
  const [form, setForm] = useState({ date:today, time:now, blood_glucose:'', weight_kg:'', waist_cm:'', hba1c:'', systolic:'', diastolic:'', notes:'' });
  const [status, setStatus] = useState(null);
  const [saving, setSaving] = useState(false);

  const set = (k,v) => setForm(f=>({...f,[k]:v}));

  const handleSubmit = async e => {
    e.preventDefault();
    setSaving(true); setStatus(null);
    const payload = Object.fromEntries(Object.entries(form).filter(([,v])=>v!==''));
    const { error } = await logVitals(payload);
    setStatus(error ? 'error' : 'success');
    if (!error) setForm(f=>({...f, blood_glucose:'', weight_kg:'', waist_cm:'', hba1c:'', systolic:'', diastolic:'', notes:''}));
    setSaving(false);
  };

  const bgStatus = getBGStatus(form.blood_glucose);

  return (
    <div className="max-w-xl mx-auto">
      <h1 className="text-xl font-bold text-brand-700 mb-1">🩸 Log Vitals</h1>
      <p className="text-sm text-gray-500 mb-6">Record blood glucose, weight, waist, or blood pressure.</p>

      {status==='success' && <div className="mb-4 p-3 bg-health-greenBg text-health-green rounded-xl text-sm font-medium">✅ Vitals saved!</div>}
      {status==='error'   && <div className="mb-4 p-3 bg-health-redBg  text-health-red   rounded-xl text-sm font-medium">❌ Failed to save — check Supabase connection.</div>}

      <form onSubmit={handleSubmit} className="card space-y-5">
        <div className="grid grid-cols-2 gap-4">
          <div><label className="label">Date</label><input type="date" className="input" value={form.date} onChange={e=>set('date',e.target.value)} required /></div>
          <div><label className="label">Time</label><input type="time" className="input" value={form.time} onChange={e=>set('time',e.target.value)} /></div>
        </div>

        <div>
          <label className="label">Blood Glucose (mmol/L)</label>
          <input type="number" step="0.1" min="1" max="30" className="input" placeholder="e.g. 6.4"
            value={form.blood_glucose} onChange={e=>set('blood_glucose',e.target.value)} />
          {bgStatus && <p className={`text-sm mt-1.5 font-medium ${bgStatus.color}`}>{bgStatus.label}</p>}
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div><label className="label">Weight (kg)</label><input type="number" step="0.1" min="30" max="200" className="input" placeholder="e.g. 78.5" value={form.weight_kg} onChange={e=>set('weight_kg',e.target.value)} /></div>
          <div><label className="label">Waist (cm)</label><input type="number" step="0.5" min="50" max="200" className="input" placeholder="e.g. 92" value={form.waist_cm} onChange={e=>set('waist_cm',e.target.value)} /></div>
        </div>

        <div>
          <label className="label">HbA1c (%) — Monthly only</label>
          <input type="number" step="0.1" min="4" max="15" className="input" placeholder="e.g. 8.9 — leave blank if not tested"
            value={form.hba1c} onChange={e=>set('hba1c',e.target.value)} />
          {form.hba1c && <p className={`text-sm mt-1.5 font-medium ${parseFloat(form.hba1c)>7?'text-health-red':'text-health-green'}`}>
            {parseFloat(form.hba1c)>7 ? `⚠️ High — target below 7%. Currently ${form.hba1c}%.` : `✅ Good — ${form.hba1c}%, within target.`}
          </p>}
        </div>

        <div>
          <label className="label">Blood Pressure (optional)</label>
          <div className="flex items-center gap-2">
            <input type="number" min="80" max="220" className="input" placeholder="Systolic" value={form.systolic} onChange={e=>set('systolic',e.target.value)} />
            <span className="text-gray-400 font-bold">/</span>
            <input type="number" min="50" max="140" className="input" placeholder="Diastolic" value={form.diastolic} onChange={e=>set('diastolic',e.target.value)} />
          </div>
        </div>

        <div><label className="label">Notes (optional)</label>
          <textarea className="input min-h-[70px] resize-none" placeholder="e.g. Fasting, post-meal, after gym…" value={form.notes} onChange={e=>set('notes',e.target.value)} /></div>

        <button type="submit" className="btn-primary w-full" disabled={saving||!form.date}>{saving?'Saving…':'💾 Save Vitals'}</button>
      </form>

      <div className="mt-5 card bg-brand-50 border-brand-100">
        <h3 className="font-semibold text-brand-700 text-sm mb-2">📋 When to Check BG</h3>
        <ul className="text-xs text-brand-600 space-y-1">
          <li>• <b>Before gym:</b> Always check. Below 5 → eat banana first.</li>
          <li>• <b>After gym:</b> Check within 30 min of finishing.</li>
          <li>• <b>Fasting morning:</b> Best for trend tracking.</li>
          <li>• <b>2h after meals:</b> Should be below 8.5 mmol/L.</li>
          <li>• <b>Before bed:</b> Aim for 6–8 mmol/L.</li>
        </ul>
      </div>
    </div>
  );
}
