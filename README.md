# MyWorkout — Mithun's Health & Fitness Tracker

Personal dashboard for tracking blood glucose, weight, meals, and workouts.
Built for a T2DM patient — designed around Indian food habits and gym safety rules.

**Live at:** `https://mithtermo.github.io/myworkout/`

---

## Stack

| Layer    | Technology |
|----------|-----------|
| Frontend | React 18 + Vite + Tailwind CSS + Recharts |
| Database | Supabase (free PostgreSQL) |
| Hosting  | GitHub Pages (free, auto-deploys on every push) |
| CI/CD    | GitHub Actions |

---

## One-time Setup (5 minutes)

### Step 1 — Create Supabase project (free)
1. Go to [supabase.com](https://supabase.com) → New project
2. Name it `myworkout`, choose a region close to Oman (e.g. Singapore)
3. Wait ~2 min for the project to be ready
4. Go to **SQL Editor** → **New query** → paste contents of `supabase_schema.sql` → **Run**
5. Go to **Project Settings** → **API** → copy:
   - **Project URL** (looks like `https://xxxx.supabase.co`)
   - **anon / public key** (long JWT string)

### Step 2 — Add secrets to GitHub
1. Go to your repo: `github.com/mithtermo/myworkout`
2. **Settings** → **Secrets and variables** → **Actions** → **New repository secret**
3. Add two secrets:
   - Name: `VITE_SUPABASE_URL`   → Value: your Project URL
   - Name: `VITE_SUPABASE_ANON_KEY` → Value: your anon key

### Step 3 — Enable GitHub Pages
1. In repo **Settings** → **Pages**
2. Source: **GitHub Actions**
3. Click Save

### Step 4 — Push to trigger first deploy
Any push to `main` triggers a build + deploy. The app will be live at:
`https://mithtermo.github.io/myworkout/`

---

## Local Development

```bash
# Clone
git clone https://github.com/mithtermo/myworkout.git
cd myworkout

# Install
npm install

# Create local env file
cp .env.local.example .env.local
# Edit .env.local and paste your Supabase URL and anon key

# Run dev server
npm run dev
# → http://localhost:5173
```

---

## Features

- 📊 **Dashboard** — BG trend chart with target zones, weight/waist chart, 12-week workout heatmap, today's meals
- 🩸 **Log Vitals** — Blood glucose (live status feedback), weight, waist, HbA1c, blood pressure
- 🍽️ **Log Meal** — Quick-add chips for your regular foods (puttu, chapati, eggs…)
- 💪 **Log Workout** — Push/Pull/Legs/Metabolic/Football — with pre & post BG tracking
- 📅 **History** — Filterable tabs for all data, delete entries
