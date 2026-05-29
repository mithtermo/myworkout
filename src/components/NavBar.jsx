import { NavLink } from 'react-router-dom';

const links = [
  { to:'/',            label:'Dashboard', icon:'📊' },
  { to:'/plans',       label:'Plans',     icon:'📋' },
  { to:'/analysis',   label:'Analysis',  icon:'🔬' },
  { to:'/log/vitals',  label:'Vitals',    icon:'🩸' },
  { to:'/log/meal',    label:'Meal',      icon:'🍽️' },
  { to:'/log/workout', label:'Workout',   icon:'💪' },
  { to:'/history',     label:'History',   icon:'📅' },
];

export default function NavBar() {
  return (
    <nav className="bg-brand-700 shadow-lg sticky top-0 z-50">
      <div className="max-w-5xl mx-auto px-4">
        <div className="flex items-center justify-between h-14">
          <span className="text-white font-bold text-lg tracking-tight flex items-center gap-2">
            <span className="text-xl">💪</span> MyWorkout
          </span>
          <div className="hidden sm:flex items-center gap-1">
            {links.map(l => (
              <NavLink key={l.to} to={l.to} end={l.to==='/'}
                className={({ isActive }) =>
                  `px-3 py-1.5 rounded-lg text-sm font-medium transition-colors flex items-center gap-1.5 ${isActive?'bg-brand-500 text-white':'text-brand-100 hover:bg-brand-600 hover:text-white'}`}>
                <span>{l.icon}</span><span>{l.label}</span>
              </NavLink>
            ))}
          </div>
        </div>
        {/* Mobile nav */}
        <div className="sm:hidden flex justify-around py-1.5 border-t border-brand-600 overflow-x-auto gap-1">
          {links.map(l => (
            <NavLink key={l.to} to={l.to} end={l.to==='/'}
              className={({ isActive }) =>
                `flex flex-col items-center text-xs gap-0.5 px-1 py-1 rounded-lg transition-colors shrink-0 ${isActive?'text-white':'text-brand-300'}`}>
              <span className="text-base">{l.icon}</span>
              <span>{l.label}</span>
            </NavLink>
          ))}
        </div>
      </div>
    </nav>
  );
}
