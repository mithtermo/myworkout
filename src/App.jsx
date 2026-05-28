import { Routes, Route } from 'react-router-dom';
import NavBar     from './components/NavBar.jsx';
import Dashboard  from './pages/Dashboard.jsx';
import LogVitals  from './pages/LogVitals.jsx';
import LogMeal    from './pages/LogMeal.jsx';
import LogWorkout from './pages/LogWorkout.jsx';
import History    from './pages/History.jsx';
import Plans      from './pages/Plans.jsx';

export default function App() {
  return (
    <div className="min-h-screen bg-gray-50">
      <NavBar />
      <main className="max-w-5xl mx-auto px-4 py-6">
        <Routes>
          <Route path="/"            element={<Dashboard />} />
          <Route path="/plans"       element={<Plans />} />
          <Route path="/log/vitals"  element={<LogVitals />} />
          <Route path="/log/meal"    element={<LogMeal />} />
          <Route path="/log/workout" element={<LogWorkout />} />
          <Route path="/history"     element={<History />} />
        </Routes>
      </main>
    </div>
  );
}
