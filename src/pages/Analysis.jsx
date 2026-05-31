import { useState, useEffect, useCallback } from 'react';
import { format, parseISO } from 'date-fns';
import {
  LineChart, Line, BarChart, Bar, XAxis, YAxis, CartesianGrid,
  Tooltip, ResponsiveContainer, ReferenceLine, Cell, PieChart, Pie,
} from 'recharts';
import { getFullAnalysis, saveAnalysis, getAnalyses, isConfigured } from '../lib/supabase';

const BASELINE = { hba1c: 8.9, ldl: 4.12, hdl: 0.95, vitD: 15.8, alt: 48 };
const WORKOUT_LABELS = {
  gym_push:'Push', gym_pull:'Pull', gym_legs:'Legs', gym_metabolic:'Metabolic',
  gym_upper:'Upper', home_resistance:'Home Resistance', home_cardio:'Home Cardio',
  football:'Football', badminton:'Badminton', rest:'Rest',
};
const MEAL_LABELS = { breakfast:'Breakfast', lunch:'Lunch', dinner:'Dinner', snack:'Snack', pre_gym:'Pre-Gym', post_gym:'Post-Gym' };
const MEAL_COLORS = ['#3b82f6','#22c55e','#f59e0b','#8b5cf6','#ef4444','#14b8a6'];

function bgColor(v) {
  if (!v) return '#94a3b8';
  if (+v < 4)  return '#3b82f6';
  if (+v <= 7) return '#22c55e';
  if (+v <= 10)return '#f59e0b';
  return '#ef4444';
}
function bgLabel(v) {
  if (!v) return '';
  if (+v < 4)  return 'Low';
  if (+v <= 7) return 'Good';
  if (+v <= 10)return 'Elevated';
  return 'High';
}

function TabBtn({ active, onClick, children }) {
  return (
    <button onClick={onClick}
      className={`px-3 py-2 rounded-lg text-sm font-medium transition-colors whitespace-nowrap ${
        active ? 'bg-brand-500 text-white' : 'bg-white text-gray-600 hover:bg-gray-100 border border-gray-200'
      }`}>
      {children}
    </button>
  );
}

function StatCard({ label, value, unit, sub, color }) {
  return (
    <div className="card text-center py-4">
      <div className="text-xs text-gray-400 uppercase tracking-wide mb-1">{label}</div>
      <div className={`text-2xl font-bold ${color || 'text-brand-700'}`}>
        {value ?? '—'}{value != null && unit ? <span className="text-sm font-normal text-gray-400 ml-0.5">{unit}</span> : ''}
      </div>
      {sub && <div className="text-xs text-gray-400 mt-1">{sub}</div>}
    </div>
  );
}

function Badge({ trend }) {
  if (!trend || trend === 'nodata') return null;
  const map = { improved:['↑ Improving','bg-green-100 text-green-700'], stable:['→ Stable','bg-gray-100 text-gray-600'], regressed:['↓ Regressed','bg-red-100 text-red-700'] };
  const [label, cls] = map[trend] || ['—',''];
  return <span className={`inline-block text-xs font-semibold px-2 py-0.5 rounded-full ${cls}`}>{label}</span>;
}

function ProgressBar({ pct, color='bg-brand-500', label, sublabel }) {
  return (
    <div className="mb-3">
      <div className="flex justify-between text-sm mb-1">
        <span className="font-medium text-gray-700">{label}</span>
        <span className="text-gray-500">{sublabel}</span>
      </div>
      <div className="h-2.5 bg-gray-100 rounded-full overflow-hidden">
        <div className={`h-full rounded-full ${color} transition-all duration-700`} style={{ width:`${Math.min(100,pct||0)}%` }} />
      </div>
    </div>
  );
}

function Section({ title, children }) {
  return (
    <div className="card mb-4">
      <h3 className="font-semibold text-brand-700 text-sm mb-3">{title}</h3>
      {children}
    </div>
  );
}

function ScoreRing({ score }) {
  const r=44, circ=2*Math.PI*r, fill=(score/100)*circ;
  const c = score>=75?'#22c55e':score>=50?'#f59e0b':'#ef4444';
  return (
    <div className="flex flex-col items-center">
      <svg width="110" height="110" viewBox="0 0 110 110">
        <circle cx="55" cy="55" r={r} fill="none" stroke="#e5e7eb" strokeWidth="10"/>
        <circle cx="55" cy="55" r={r} fill="none" stroke={c} strokeWidth="10"
          strokeDasharray={`${fill} ${circ}`} strokeLinecap="round"
          transform="rotate(-90 55 55)" style={{transition:'stroke-dasharray .7s ease'}}/>
        <text x="55" y="51" textAnchor="middle" fontSize="24" fontWeight="bold" fill={c}>{score}</text>
        <text x="55" y="65" textAnchor="middle" fontSize="10" fill="#9ca3af">/ 100</text>
      </svg>
      <span className="text-xs font-semibold mt-0.5" style={{color:c}}>
        {score>=75?'Good Progress':score>=50?'Moderate':'Needs Attention'}
      </span>
    </div>
  );
}

function computeScore(d) {
  let score=50; const ins=[]; const recs=[];
  if (d.bg.avgThis!=null) {
    if(d.bg.avgThis<=7){score+=28;ins.push('🟢 BG average in target range (<7 mmol/L). Excellent!');}
    else if(d.bg.avgThis<=10){score+=16;ins.push(`🟡 BG avg ${d.bg.avgThis} mmol/L — elevated. Push toward <7.`);recs.push('Replace white rice with wheat chapati. Limit rice to once a day.');}
    else{score+=4;ins.push(`🔴 BG avg ${d.bg.avgThis} mmol/L — high. Urgent focus needed.`);recs.push('Cut all sugar from tea/coffee. Reduce rice completely this week.');}
    if(d.bg.trend==='improved'){score+=4;ins.push(`📉 BG trending down (${d.bg.avgLast}→${d.bg.avgThis} mmol/L). Keep going!`);}
    if(d.bg.trend==='regressed'){score-=4;ins.push(`📈 BG trending up (${d.bg.avgLast}→${d.bg.avgThis} mmol/L). Review meals.`);}
    if(d.bg.worst>13)ins.push(`⛔ Highest reading: ${d.bg.worst} mmol/L. Skip weights on days >13.`);
    if(d.bg.best<=5)ins.push(`🌟 Best reading: ${d.bg.best} mmol/L — great control at that moment!`);
  } else recs.push('Log fasting BG every morning. This is your #1 metric.');

  if(d.weight.change!=null){
    if(d.weight.change<-0.3){score+=18;ins.push(`⚖️ Lost ${Math.abs(d.weight.change)} kg this period!`);}
    else if(d.weight.change<0.2){score+=10;ins.push(`⚖️ Weight stable at ${d.weight.latest} kg.`);}
    else{score+=3;ins.push(`⚖️ Weight up ${d.weight.change} kg.`);recs.push('Cut dinner to 3 chapati. No food after 9:30 pm.');}
  } else recs.push('Log weight every morning after waking up.');

  const wPct=d.workouts_.thisWeek/4;
  if(wPct>=1){score+=18;ins.push(`💪 Hit 4+ workouts (${d.workouts_.thisWeek} sessions)!`);}
  else if(wPct>=0.75){score+=12;ins.push(`💪 ${d.workouts_.thisWeek}/4 workouts — almost there.`);}
  else if(wPct>=0.5){score+=7;ins.push(`💪 ${d.workouts_.thisWeek} workout(s) this week.`);recs.push('Block 4 gym sessions in your calendar this week.');}
  else{score+=2;ins.push('⚠️ Very few workouts logged.');recs.push('20 min on elliptical at home. Something > nothing.');}

  if(d.food.lateDinnerPct!=null&&d.food.lateDinnerPct>50){
    score-=4;ins.push(`🌙 ${d.food.lateDinnerPct}% dinners after 9 pm. Late meals = elevated overnight BG.`);
    recs.push('Target dinner by 9 pm. Set phone alarm at 8:45 pm.');
  } else if(d.food.lateDinnerPct===0&&d.food.totalDinners>0){score+=5;ins.push('🌙 All dinners before 9 pm — great habit!');}

  if(d.food.breakfastSkipRate!=null&&d.food.breakfastSkipRate>40){
    score-=3;ins.push(`☀️ Skipping breakfast ${d.food.breakfastSkipRate}% of days — causes bigger lunch spikes.`);
    recs.push('Eat wheat puttu + boiled eggs within 1 hour of waking.');
  }
  if(d.food.flaggedFoods.length>0){
    ins.push(`⚠️ BG-spiking foods: ${d.food.flaggedFoods.join(', ')}.`);
    recs.push(`Swap "${d.food.flaggedFoods[0]}" → lower-GI option. Chicken bun→boiled eggs. Sugary coffee→black coffee.`);
  }
  if(d.food.mealDaysThis>=5){score+=5;ins.push('📝 Good meal logging consistency.');}
  else if(d.food.mealDaysThis>0)score+=2;
  else recs.push('Log every meal — builds pattern awareness.');
  if(d.workouts_.avgBgDrop>1.5){score+=5;ins.push(`🎯 Exercise drops BG by ${d.workouts_.avgBgDrop} mmol/L per session!`);}

  recs.push('Take Vitamin D3 1000 IU daily — baseline 15.8 ng/mL (target >30).');
  recs.push('Switch fried eggs to boiled — helps reduce LDL from 4.12 mmol/L.');
  recs.push('Leg itching: moisturise daily + ask doctor about neuropathy screening.');
  return { score:Math.min(100,Math.max(0,score)), ins, recs };
}

// ── Tab: Overview ─────────────────────────────────────────────────────────────
function TabOverview({ d, score, ins, recs }) {
  return (
    <div className="space-y-4">
      <div className="card flex flex-col sm:flex-row items-center gap-6">
        <ScoreRing score={score} />
        <div className="flex-1 w-full space-y-2">
          <ProgressBar pct={d.bg.avgThis?(1-(d.bg.avgThis-4)/10)*100:0}
            label="Blood Glucose" sublabel={d.bg.avgThis?`${d.bg.avgThis} mmol/L`:'No data'}
            color={d.bg.avgThis<=7?'bg-green-500':d.bg.avgThis<=10?'bg-amber-400':'bg-red-500'} />
          <ProgressBar pct={d.workouts_.thisWeek/4*100}
            label="Workouts" sublabel={`${d.workouts_.thisWeek}/4 sessions`}
            color={d.workouts_.thisWeek>=4?'bg-green-500':d.workouts_.thisWeek>=2?'bg-amber-400':'bg-red-400'} />
          <ProgressBar pct={d.food.mealDaysThis/7*100}
            label="Meal Logging" sublabel={`${d.food.mealDaysThis}/7 days`} color="bg-brand-500" />
          <ProgressBar pct={20} label="HbA1c Progress" sublabel="Baseline 8.9% → Target 7%" color="bg-purple-400" />
        </div>
      </div>
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        <StatCard label="Avg BG" value={d.bg.avgThis} unit=" mmol/L" sub={<Badge trend={d.bg.trend}/>}
          color={d.bg.avgThis<=7?'text-green-600':d.bg.avgThis<=10?'text-amber-600':'text-red-600'}/>
        <StatCard label="Weight" value={d.weight.latest} unit=" kg"
          sub={d.weight.change!=null?`${d.weight.change>0?'+':''}${d.weight.change} kg`:'No data'}
          color={d.weight.change<0?'text-green-600':'text-brand-700'}/>
        <StatCard label="Workouts" value={`${d.workouts_.thisWeek}/4`}
          sub={<Badge trend={d.workouts_.thisWeek>=d.workouts_.lastWeek?'improved':'regressed'}/>}/>
        <StatCard label="BG Drop/Session" value={d.workouts_.avgBgDrop} unit=" mmol/L"
          sub={`${d.workouts_.bgDrops.length} sessions`}
          color={d.workouts_.avgBgDrop>1.5?'text-green-600':'text-amber-600'}/>
      </div>
      <div className="card bg-orange-50 border border-orange-200">
        <div className="font-semibold text-orange-700 text-sm mb-1">🦵 Leg Itching — Action Required</div>
        <p className="text-xs text-orange-700 mb-1">With HbA1c 8.9%, leg itching likely means <b>diabetic dry skin or early neuropathy</b>.</p>
        <ul className="text-xs text-orange-700 space-y-0.5 list-disc list-inside">
          <li>Moisturise legs morning and night (Vaseline / Cetaphil)</li>
          <li>Check feet daily for cuts, sores or colour changes</li>
          <li>Ask your doctor for neuropathy screening at your next visit</li>
          <li>Long-term fix: bring BG below 7 mmol/L consistently</li>
        </ul>
      </div>
      <Section title="💡 Insights">
        <ul className="space-y-1.5">{ins.map((i,idx)=><li key={idx} className="text-sm text-gray-700 bg-gray-50 rounded-lg px-3 py-2">{i}</li>)}</ul>
      </Section>
      <Section title="📌 Recommendations">
        <ul className="space-y-1.5">{recs.map((r,idx)=><li key={idx} className="text-sm text-gray-700 bg-blue-50 rounded-lg px-3 py-2"><span className="text-blue-500 font-bold mr-1">→</span>{r}</li>)}</ul>
      </Section>
      <Section title="🧪 Blood Test Baseline (May 2025)">
        <div className="grid grid-cols-2 sm:grid-cols-5 gap-2 text-xs">
          {[['HbA1c',`${BASELINE.hba1c}%`,'<7%'],['LDL',`${BASELINE.ldl}`,'<3.0 mmol/L'],['HDL',`${BASELINE.hdl}`,'>1.0 mmol/L'],['Vit D',`${BASELINE.vitD}`,'>30 ng/mL'],['ALT',`${BASELINE.alt}`,'<40 U/L']].map(([lbl,val,tgt])=>(
            <div key={lbl} className="bg-red-50 border border-red-200 rounded-lg p-2 text-center">
              <div className="text-gray-500">{lbl}</div><div className="font-bold text-red-600 text-sm">{val}</div><div className="text-red-400">Target: {tgt}</div>
            </div>
          ))}
        </div>
      </Section>
    </div>
  );
}

// ── Tab: Blood Glucose ────────────────────────────────────────────────────────
function TabBG({ d }) {
  const chartData = d.bg.allVals.map(r=>({ label:r.date.slice(5)+(r.time?' '+r.time.slice(0,5):''), bg:r.val }));
  return (
    <div className="space-y-4">
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        <StatCard label="Avg This Week" value={d.bg.avgThis} unit=" mmol/L" color={d.bg.avgThis<=7?'text-green-600':d.bg.avgThis<=10?'text-amber-600':'text-red-600'}/>
        <StatCard label="Avg Last Week" value={d.bg.avgLast} unit=" mmol/L"/>
        <StatCard label="Best Reading" value={d.bg.best} unit=" mmol/L" color="text-green-600"/>
        <StatCard label="Worst Reading" value={d.bg.worst} unit=" mmol/L" color={d.bg.worst>13?'text-red-600':'text-amber-600'}/>
      </div>
      {chartData.length>0?(
        <Section title="📈 Blood Glucose Trend">
          <ResponsiveContainer width="100%" height={220}>
            <LineChart data={chartData} margin={{top:5,right:10,left:-10,bottom:35}}>
              <CartesianGrid strokeDasharray="3 3" stroke="#f3f4f6"/>
              <XAxis dataKey="label" tick={{fontSize:10}} angle={-40} textAnchor="end" interval={0}/>
              <YAxis domain={[3,16]} tick={{fontSize:11}}/>
              <Tooltip formatter={v=>[`${v} mmol/L`,'BG']} contentStyle={{fontSize:12,borderRadius:8}}/>
              <ReferenceLine y={7}  stroke="#22c55e" strokeDasharray="4 2" label={{value:'Target 7',fontSize:9,fill:'#22c55e'}}/>
              <ReferenceLine y={10} stroke="#f59e0b" strokeDasharray="4 2" label={{value:'High 10',fontSize:9,fill:'#f59e0b'}}/>
              <ReferenceLine y={13} stroke="#ef4444" strokeDasharray="4 2" label={{value:'Skip gym 13',fontSize:9,fill:'#ef4444'}}/>
              <Line type="monotone" dataKey="bg" stroke="#3b82f6" strokeWidth={2}
                dot={(props)=>{const{cx,cy,payload}=props;return<circle key={props.key} cx={cx} cy={cy} r={5} fill={bgColor(payload.bg)} stroke="white" strokeWidth={1.5}/>;}}/>
            </LineChart>
          </ResponsiveContainer>
          <div className="flex flex-wrap gap-3 mt-2 text-xs">
            {[['#3b82f6','Low (<4)'],['#22c55e','Good (4-7)'],['#f59e0b','Elevated (7-10)'],['#ef4444','High (>10)']].map(([c,l])=>(
              <span key={l} className="flex items-center gap-1"><span style={{background:c}} className="inline-block w-3 h-3 rounded-full"/><span className="text-gray-500">{l}</span></span>
            ))}
          </div>
        </Section>
      ):<div className="card text-center py-8 text-gray-400 text-sm">No blood glucose readings logged yet.</div>}
      {d.workouts_.bgDrops.length>0&&(
        <Section title="🏋️ BG Response to Exercise">
          <div className="grid grid-cols-2 gap-4 mb-3">
            <StatCard label="Avg BG Drop" value={d.workouts_.avgBgDrop} unit=" mmol/L" sub="per session" color={d.workouts_.avgBgDrop>1.5?'text-green-600':'text-amber-600'}/>
            <StatCard label="Sessions Measured" value={d.workouts_.bgDrops.length} sub="with pre+post BG"/>
          </div>
          <ResponsiveContainer width="100%" height={150}>
            <BarChart data={d.workouts_.bgDrops.map((v,i)=>({label:`S${i+1}`,drop:v}))} margin={{top:5,right:10,left:-20,bottom:5}}>
              <CartesianGrid strokeDasharray="3 3" stroke="#f3f4f6"/>
              <XAxis dataKey="label" tick={{fontSize:11}}/><YAxis tick={{fontSize:11}}/>
              <Tooltip formatter={v=>[`${v} mmol/L`,'BG Drop']}/>
              <Bar dataKey="drop" radius={4}>{d.workouts_.bgDrops.map((v,i)=><Cell key={i} fill={v>1.5?'#22c55e':v>0?'#f59e0b':'#ef4444'}/>)}</Bar>
            </BarChart>
          </ResponsiveContainer>
        </Section>
      )}
      {d.bg.rows.length>0&&(
        <Section title="📋 All Readings">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead><tr className="border-b border-gray-100">{['Date','Time','BG (mmol/L)','Status'].map(h=><th key={h} className="text-left py-2 px-2 text-xs text-gray-400 font-semibold">{h}</th>)}</tr></thead>
              <tbody>{d.bg.rows.slice().reverse().map(r=>(
                <tr key={r.id} className="border-b border-gray-50">
                  <td className="py-2 px-2 text-gray-600 text-xs">{r.date}</td>
                  <td className="py-2 px-2 text-gray-400 text-xs">{r.time||'—'}</td>
                  <td className="py-2 px-2"><span className="font-bold" style={{color:bgColor(r.blood_glucose)}}>{r.blood_glucose}</span></td>
                  <td className="py-2 px-2"><span className="text-xs px-2 py-0.5 rounded-full" style={{background:bgColor(r.blood_glucose)+'22',color:bgColor(r.blood_glucose)}}>{bgLabel(r.blood_glucose)}</span></td>
                </tr>
              ))}</tbody>
            </table>
          </div>
        </Section>
      )}
    </div>
  );
}

// ── Tab: Food Habits ──────────────────────────────────────────────────────────
function TabFood({ d }) {
  const f = d.food;
  const pieData = Object.entries(f.mealTypeCount).map(([k,v],i)=>({ name:MEAL_LABELS[k]||k, value:v, fill:MEAL_COLORS[i%MEAL_COLORS.length] }));
  return (
    <div className="space-y-4">
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        <StatCard label="Meals Logged" value={f.totalMeals} sub={`${f.mealDaysThis} days this week`}/>
        <StatCard label="Avg Calories/Day" value={f.avgCalories} unit=" kcal" color={f.avgCalories>2000?'text-amber-600':'text-green-600'}/>
        <StatCard label="Late Dinners" value={f.lateDinnerPct!=null?f.lateDinnerPct+'%':'—'} sub={`${f.lateDinners}/${f.totalDinners} after 9 pm`} color={f.lateDinnerPct>50?'text-red-600':'text-green-600'}/>
        <StatCard label="Breakfast Skip" value={f.breakfastSkipRate!=null?f.breakfastSkipRate+'%':'—'} sub="of logged days" color={f.breakfastSkipRate>30?'text-red-600':'text-green-600'}/>
      </div>
      {f.flaggedFoods.length>0&&(
        <div className="card bg-red-50 border border-red-200">
          <div className="font-semibold text-red-700 text-sm mb-2">⚠️ BG-Spiking Foods Detected</div>
          <div className="flex flex-wrap gap-2 mb-2">{f.flaggedFoods.map(food=><span key={food} className="text-xs bg-red-100 text-red-700 px-3 py-1 rounded-full font-medium">{food}</span>)}</div>
          <ul className="text-xs text-red-600 list-disc list-inside space-y-0.5">
            <li>Chicken bun → Boiled eggs + wheat puttu</li>
            <li>White rice → 3 wheat chapati + dal</li>
            <li>Sugary coffee → Black coffee (no sugar)</li>
            <li>Fried egg → Boiled egg (also helps LDL)</li>
          </ul>
        </div>
      )}
      {pieData.length>0&&(
        <Section title="🍽️ Meal Type Breakdown">
          <div className="flex flex-col sm:flex-row items-center gap-4">
            <ResponsiveContainer width={200} height={170}>
              <PieChart>
                <Pie data={pieData} dataKey="value" nameKey="name" cx="50%" cy="50%" innerRadius={40} outerRadius={70} paddingAngle={3}>
                  {pieData.map((e,i)=><Cell key={i} fill={e.fill}/>)}
                </Pie>
                <Tooltip formatter={(v,n)=>[v+' meals',n]}/>
              </PieChart>
            </ResponsiveContainer>
            <div className="flex-1 w-full space-y-1">
              {pieData.map((item,i)=>(
                <div key={i} className="flex items-center justify-between text-sm">
                  <div className="flex items-center gap-2"><span style={{background:item.fill}} className="inline-block w-3 h-3 rounded-full"/><span className="text-gray-700">{item.name}</span></div>
                  <span className="font-semibold text-gray-700">{item.value}</span>
                </div>
              ))}
            </div>
          </div>
        </Section>
      )}
      {f.gymDayCount>0&&(
        <Section title="💪 Gym Nutrition Compliance">
          <ProgressBar pct={f.preGymCompliance} label="Pre-Gym Meal" sublabel={`${f.preGymCompliance??0}% of gym days`} color={f.preGymCompliance>=80?'bg-green-500':'bg-amber-400'}/>
          <ProgressBar pct={f.postGymCompliance} label="Post-Gym Recovery Meal" sublabel={`${f.postGymCompliance??0}% of gym days`} color={f.postGymCompliance>=80?'bg-green-500':'bg-amber-400'}/>
          <p className="text-xs text-gray-400 mt-1">Pre-gym: banana or dates 30 min before. Post-gym: eggs + chapati within 45 min.</p>
        </Section>
      )}
      {f.topFoods.length>0&&(
        <Section title="🥘 Most Frequently Eaten Foods">
          <div className="space-y-2">
            {f.topFoods.map(([food,count])=>{
              const isBad=['chicken bun','bun','fried','sugar','white rice','juice'].some(b=>food.includes(b));
              return (
                <div key={food} className="flex items-center gap-3">
                  <div className="flex-1 text-sm text-gray-700 capitalize">{food}</div>
                  <div className="flex items-center gap-2">
                    <div className="h-2 rounded-full" style={{width:`${Math.min(count*16,120)}px`,background:isBad?'#ef4444':'#3b82f6'}}/>
                    <span className="text-xs text-gray-400 w-8 text-right">{count}×</span>
                    {isBad&&<span className="text-xs text-red-500">⚠️</span>}
                  </div>
                </div>
              );
            })}
          </div>
          <p className="text-xs text-gray-400 mt-2">⚠️ = BG-spiking food. Blue = neutral/good food.</p>
        </Section>
      )}
      <Section title="⏰ Eating Habits Assessment">
        {[
          {label:'Late Dinners (after 9 pm)',val:f.lateDinnerPct,unit:'%',good:f.lateDinnerPct===0&&f.totalDinners>0,bad:f.lateDinnerPct>50,tip:'Late dinner = high overnight BG. Target 9 pm.'},
          {label:'Breakfast Skip Rate',val:f.breakfastSkipRate,unit:'%',good:f.breakfastSkipRate<15,bad:f.breakfastSkipRate>40,tip:'Skipping breakfast causes bigger lunch spikes. Wheat puttu + eggs = ideal.'},
          {label:'Pre-Gym Fuelling',val:f.preGymCompliance,unit:'%',good:f.preGymCompliance>=80,bad:f.preGymCompliance<50,tip:'Always eat banana or dates before gym. BG below 5 = eat first, no exceptions.'},
          {label:'Post-Gym Recovery',val:f.postGymCompliance,unit:'%',good:f.postGymCompliance>=80,bad:f.postGymCompliance<50,tip:'Eggs + chapati within 45 min of gym. Builds muscle, stabilises BG.'},
        ].map(item=>(
          <div key={item.label} className={`rounded-xl p-3 mb-2 text-sm ${item.good?'bg-green-50 border border-green-200':item.bad?'bg-red-50 border border-red-200':'bg-gray-50 border border-gray-100'}`}>
            <div className="flex justify-between items-center">
              <span className={`font-medium ${item.good?'text-green-700':item.bad?'text-red-700':'text-gray-700'}`}>{item.label}</span>
              <span className={`font-bold ${item.good?'text-green-600':item.bad?'text-red-600':'text-gray-600'}`}>{item.val!=null?item.val+item.unit:'—'} {item.good?'✅':item.bad?'❌':''}</span>
            </div>
            {item.bad&&<p className="text-xs mt-1 text-red-600">{item.tip}</p>}
          </div>
        ))}
      </Section>
      {f.rows.length>0&&(
        <Section title="📋 All Meals Logged">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead><tr className="border-b border-gray-100">{['Date','Type','Food','kcal'].map(h=><th key={h} className="text-left py-2 px-2 text-xs text-gray-400 font-semibold">{h}</th>)}</tr></thead>
              <tbody>{f.rows.slice().reverse().map(m=>(
                <tr key={m.id} className="border-b border-gray-50">
                  <td className="py-2 px-2 text-gray-500 text-xs">{m.date}</td>
                  <td className="py-2 px-2"><span className="text-xs px-2 py-0.5 rounded-full bg-brand-50 text-brand-700">{MEAL_LABELS[m.meal_type]||m.meal_type}</span></td>
                  <td className="py-2 px-2 text-gray-700 max-w-[160px] truncate" title={m.food_items}>{m.food_items}</td>
                  <td className="py-2 px-2 text-gray-500">{m.calories||'—'}</td>
                </tr>
              ))}</tbody>
            </table>
          </div>
        </Section>
      )}
    </div>
  );
}

// ── Tab: Workouts ─────────────────────────────────────────────────────────────
function TabWorkouts({ d }) {
  const w = d.workouts_;
  const typeData = Object.entries(w.typeBreakdown).map(([k,v])=>({name:WORKOUT_LABELS[k]||k,count:v}));
  return (
    <div className="space-y-4">
      <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
        <StatCard label="This Week" value={w.thisWeek} unit=" sessions" color={w.thisWeek>=4?'text-green-600':'text-amber-600'}/>
        <StatCard label="Last Week" value={w.lastWeek} unit=" sessions"/>
        <StatCard label="Avg BG Drop" value={w.avgBgDrop} unit=" mmol/L" color={w.avgBgDrop>1.5?'text-green-600':'text-amber-600'} sub={`${w.bgDrops.length} sessions with BG data`}/>
      </div>
      {typeData.length>0&&(
        <Section title="📊 Session Type Breakdown">
          <ResponsiveContainer width="100%" height={180}>
            <BarChart data={typeData} margin={{top:5,right:10,left:-20,bottom:45}}>
              <CartesianGrid strokeDasharray="3 3" stroke="#f3f4f6"/>
              <XAxis dataKey="name" tick={{fontSize:10}} angle={-35} textAnchor="end" interval={0}/>
              <YAxis tick={{fontSize:11}} allowDecimals={false}/>
              <Tooltip/>
              <Bar dataKey="count" fill="#3b82f6" radius={4}/>
            </BarChart>
          </ResponsiveContainer>
        </Section>
      )}
      {w.rows.length>0&&(
        <Section title="📋 All Workouts">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead><tr className="border-b border-gray-100">{['Date','Type','Duration','Pre BG','Post BG','Drop'].map(h=><th key={h} className="text-left py-2 px-2 text-xs text-gray-400 font-semibold">{h}</th>)}</tr></thead>
              <tbody>{w.rows.slice().reverse().map(r=>{
                const drop=r.pre_bg&&r.post_bg?+(+r.pre_bg-+r.post_bg).toFixed(1):null;
                return (
                  <tr key={r.id} className="border-b border-gray-50">
                    <td className="py-2 px-2 text-gray-500 text-xs">{r.date}</td>
                    <td className="py-2 px-2"><span className="text-xs px-2 py-0.5 rounded-full bg-brand-50 text-brand-700">{WORKOUT_LABELS[r.type]||r.type}</span></td>
                    <td className="py-2 px-2 text-gray-500">{r.duration_min?r.duration_min+'m':'—'}</td>
                    <td className="py-2 px-2" style={{color:bgColor(r.pre_bg)}}>{r.pre_bg||'—'}</td>
                    <td className="py-2 px-2" style={{color:bgColor(r.post_bg)}}>{r.post_bg||'—'}</td>
                    <td className="py-2 px-2 font-semibold" style={{color:drop>0?'#16a34a':'#9ca3af'}}>
                      {drop!=null?(drop>0?'−':'+' )+Math.abs(drop):'—'}
                    </td>
                  </tr>
                );
              })}</tbody>
            </table>
          </div>
        </Section>
      )}
    </div>
  );
}

// ── Tab: History ──────────────────────────────────────────────────────────────
function TabHistory({ history, loadingH, openCard, onExpand }) {
  if (loadingH) return <p className="text-sm text-gray-400">Loading history…</p>;
  if (!history.length) return <div className="card text-center py-10"><p className="text-gray-400 text-sm">No saved analyses yet. Run one above!</p></div>;
  return (
    <div className="space-y-3">
      {history.map(a=>{
        const sc=a.health_score; const c=sc>=75?'#16a34a':sc>=50?'#d97706':'#dc2626';
        const bg=sc>=75?'bg-green-50 border-green-200':sc>=50?'bg-amber-50 border-amber-200':'bg-red-50 border-red-200';
        return (
          <div key={a.id} className={`rounded-2xl border p-4 cursor-pointer ${bg}`} onClick={()=>onExpand(a.id)}>
            <div className="flex items-center justify-between">
              <div>
                <div className="font-semibold text-gray-800 text-sm">{a.period_label||a.analysed_at?.slice(0,10)}</div>
                <div className="text-xs text-gray-500">{a.analysed_at?format(parseISO(a.analysed_at),'d MMM yyyy, HH:mm'):''}</div>
              </div>
              <div className="flex items-center gap-3">
                <div className="text-2xl font-bold" style={{color:c}}>{sc}<span className="text-sm font-normal">/100</span></div>
                <span className="text-gray-400">{openCard===a.id?'▲':'▼'}</span>
              </div>
            </div>
            {openCard===a.id&&(
              <div className="mt-4 pt-4 border-t border-gray-200 space-y-3">
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-sm">
                  {a.bg_avg!=null&&<div className="bg-white rounded-xl p-3 text-center shadow-sm"><div className="text-xs text-gray-400">Avg BG</div><div className="font-bold">{a.bg_avg} mmol/L</div></div>}
                  {a.weight_kg!=null&&<div className="bg-white rounded-xl p-3 text-center shadow-sm"><div className="text-xs text-gray-400">Weight</div><div className="font-bold">{a.weight_kg} kg</div></div>}
                  {a.workouts_count!=null&&<div className="bg-white rounded-xl p-3 text-center shadow-sm"><div className="text-xs text-gray-400">Workouts</div><div className="font-bold">{a.workouts_count}/{a.workouts_target}</div></div>}
                  {a.avg_bg_drop!=null&&<div className="bg-white rounded-xl p-3 text-center shadow-sm"><div className="text-xs text-gray-400">BG Drop</div><div className="font-bold">{a.avg_bg_drop} mmol/L</div></div>}
                </div>
                {a.insights?.length>0&&<ul className="space-y-1">{a.insights.map((ins,i)=><li key={i} className="text-sm text-gray-700 bg-white rounded-lg px-3 py-2">{ins}</li>)}</ul>}
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
}

// ── Main page ─────────────────────────────────────────────────────────────────
export default function Analysis() {
  const [tab,setTab]=useState('overview');
  const [days,setDays]=useState(14);
  const [running,setRunning]=useState(false);
  const [data,setData]=useState(null);
  const [computed,setComputed]=useState(null);
  const [history,setHistory]=useState([]);
  const [openCard,setOpenCard]=useState(null);
  const [loadingH,setLoadingH]=useState(true);
  const [saveMsg,setSaveMsg]=useState(null);
  const configured=isConfigured();

  const loadHistory=useCallback(async()=>{setLoadingH(true);const list=await getAnalyses(20);setHistory(list);setLoadingH(false);},[]);
  useEffect(()=>{if(configured)loadHistory();else setLoadingH(false);},[configured,loadHistory]);

  const runAnalysis=async()=>{
    setRunning(true);setSaveMsg(null);
    try {
      const d=await getFullAnalysis(days);
      const {score,ins,recs}=computeScore(d);
      setData(d);setComputed({score,ins,recs});setTab('overview');
      const payload={
        period_label:format(new Date(),'d MMM yyyy'),period_days:days,health_score:score,
        bg_avg:d.bg.avgThis,bg_trend:d.bg.trend,bg_best:d.bg.best,bg_worst:d.bg.worst,
        weight_kg:d.weight.latest,weight_change:d.weight.change,weight_trend:d.weight.trend,
        waist_cm:d.weight.rows.at(-1)?.val||null,
        workouts_count:d.workouts_.thisWeek,workouts_target:4,
        workout_trend:d.workouts_.thisWeek>=d.workouts_.lastWeek?'improved':'regressed',
        meals_days:d.food.mealDaysThis,avg_bg_drop:d.workouts_.avgBgDrop,
        insights:ins,recommendations:recs,raw_data:{},
      };
      const{error}=await saveAnalysis(payload);
      if(error)setSaveMsg({ok:false,msg:'Ran but failed to save: '+error.message});
      else{setSaveMsg({ok:true,msg:'Analysis saved to history!'});await loadHistory();}
    } catch(e){setSaveMsg({ok:false,msg:'Error: '+e.message});}
    finally{setRunning(false);}
  };

  if(!configured) return (
    <div className="max-w-2xl mx-auto">
      <h1 className="text-xl font-bold text-brand-700 mb-1">🔬 Analysis</h1>
      <div className="card bg-amber-50 border-amber-200 mt-4">
        <p className="text-sm text-amber-800 font-medium">⚠️ Supabase not connected yet.</p>
        <p className="text-xs text-amber-700 mt-1">Add VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY as GitHub secrets.</p>
      </div>
    </div>
  );

  return (
    <div className="max-w-3xl mx-auto">
      <h1 className="text-xl font-bold text-brand-700 mb-1">🔬 Analysis</h1>
      <p className="text-sm text-gray-500 mb-4">Deep analysis of your BG, food habits and workouts. Auto-saved to history.</p>
      <div className="card mb-5">
        <div className="flex flex-wrap items-center gap-3">
          <div className="flex gap-2">
            {[7,14,30].map(d=>(
              <button key={d} onClick={()=>setDays(d)}
                className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-colors ${days===d?'bg-brand-500 text-white':'bg-gray-100 text-gray-600 hover:bg-gray-200'}`}>
                Last {d} days
              </button>
            ))}
          </div>
          <button onClick={runAnalysis} disabled={running} className="btn-primary text-sm py-2 px-5 ml-auto">
            {running?'⏳ Analysing…':'▶ Run Analysis'}
          </button>
        </div>
        {saveMsg&&(
          <div className={`mt-3 p-3 rounded-xl text-sm font-medium ${saveMsg.ok?'bg-health-greenBg text-health-green':'bg-health-redBg text-health-red'}`}>
            {saveMsg.ok?'✅':'❌'} {saveMsg.msg}
          </div>
        )}
      </div>

      {(data||history.length>0)&&(
        <div className="flex gap-2 mb-5 flex-wrap">
          {data&&<>
            <TabBtn active={tab==='overview'} onClick={()=>setTab('overview')}>📊 Overview</TabBtn>
            <TabBtn active={tab==='bg'}       onClick={()=>setTab('bg')}>🩸 Blood Glucose</TabBtn>
            <TabBtn active={tab==='food'}     onClick={()=>setTab('food')}>🍽️ Food Habits</TabBtn>
            <TabBtn active={tab==='workouts'} onClick={()=>setTab('workouts')}>💪 Workouts</TabBtn>
          </>}
          <TabBtn active={tab==='history'} onClick={()=>setTab('history')}>📅 History</TabBtn>
        </div>
      )}

      {!data&&<div className="card text-center py-12"><p className="text-gray-400 text-sm mb-1">No analysis run yet.</p><p className="text-xs text-gray-400">Click ▶ Run Analysis to analyse your last {days} days of data.</p></div>}
      {data&&computed&&tab==='overview' &&<TabOverview d={data} score={computed.score} ins={computed.ins} recs={computed.recs}/>}
      {data&&computed&&tab==='bg'       &&<TabBG d={data}/>}
      {data&&computed&&tab==='food'     &&<TabFood d={data}/>}
      {data&&computed&&tab==='workouts' &&<TabWorkouts d={data}/>}
      {tab==='history'&&<TabHistory history={history} loadingH={loadingH} openCard={openCard} onExpand={id=>setOpenCard(openCard===id?null:id)}/>}
    </div>
  );
}
