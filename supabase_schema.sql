-- ============================================================
-- MyWorkout — Supabase Schema
-- Run this once in your Supabase project:
--   Dashboard → SQL Editor → New query → paste & run
-- ============================================================

-- Vitals table
CREATE TABLE IF NOT EXISTS vitals (
  id            BIGSERIAL PRIMARY KEY,
  date          DATE        NOT NULL,
  time          TIME,
  blood_glucose NUMERIC(4,1),          -- mmol/L
  weight_kg     NUMERIC(5,1),
  waist_cm      NUMERIC(5,1),
  hba1c         NUMERIC(4,1),          -- %, log monthly
  systolic      SMALLINT,
  diastolic     SMALLINT,
  notes         TEXT,
  created_at    TIMESTAMPTZ DEFAULT NOW()
);

-- Meals table
CREATE TABLE IF NOT EXISTS meals (
  id          BIGSERIAL PRIMARY KEY,
  date        DATE        NOT NULL,
  time        TIME,
  meal_type   TEXT        NOT NULL,    -- breakfast|lunch|dinner|snack|pre_gym|post_gym
  food_items  TEXT        NOT NULL,
  calories    INTEGER,
  protein_g   NUMERIC(5,1),
  carbs_g     NUMERIC(5,1),
  notes       TEXT,
  created_at  TIMESTAMPTZ DEFAULT NOW()
);

-- Workouts table
CREATE TABLE IF NOT EXISTS workouts (
  id           BIGSERIAL PRIMARY KEY,
  date         DATE        NOT NULL,
  time         TIME,
  type         TEXT        NOT NULL,   -- gym_push|gym_pull|gym_legs|gym_metabolic|gym_upper|home_resistance|home_cardio|football|badminton
  location     TEXT,                   -- gym|home|outdoor
  duration_min INTEGER,
  exercises    JSONB       DEFAULT '[]',  -- [{name,sets,reps,weight_kg}]
  pre_bg       NUMERIC(4,1),           -- blood glucose before (mmol/L)
  post_bg      NUMERIC(4,1),           -- blood glucose after
  notes        TEXT,
  created_at   TIMESTAMPTZ DEFAULT NOW()
);

-- Indexes for fast date queries
CREATE INDEX IF NOT EXISTS idx_vitals_date   ON vitals(date DESC);
CREATE INDEX IF NOT EXISTS idx_meals_date    ON meals(date DESC);
CREATE INDEX IF NOT EXISTS idx_workouts_date ON workouts(date DESC);

-- ── Row Level Security ────────────────────────────────────────────────────
-- Enable RLS on all tables
ALTER TABLE vitals   ENABLE ROW LEVEL SECURITY;
ALTER TABLE meals    ENABLE ROW LEVEL SECURITY;
ALTER TABLE workouts ENABLE ROW LEVEL SECURITY;

-- Allow full access with the anon key (personal app — no login needed)
CREATE POLICY "Public access" ON vitals   FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Public access" ON meals    FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Public access" ON workouts FOR ALL USING (true) WITH CHECK (true);

-- ── Analysis history ──────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS analyses (
  id               BIGSERIAL PRIMARY KEY,
  analysed_at      TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  period_label     TEXT,                      -- e.g. "28 May 2026"
  period_days      INTEGER DEFAULT 30,
  health_score     INTEGER,                   -- 0-100
  bg_avg           NUMERIC(4,1),
  bg_trend         TEXT,
  bg_best          NUMERIC(4,1),
  bg_worst         NUMERIC(4,1),
  weight_kg        NUMERIC(5,1),
  weight_change    NUMERIC(4,1),
  weight_trend     TEXT,
  waist_cm         NUMERIC(5,1),
  workouts_count   INTEGER,
  workouts_target  INTEGER DEFAULT 4,
  workout_trend    TEXT,
  meals_days       INTEGER,
  avg_bg_drop      NUMERIC(4,1),
  insights         JSONB DEFAULT '[]',
  recommendations  JSONB DEFAULT '[]',
  raw_data         JSONB DEFAULT '{}'
);
ALTER TABLE analyses ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Public access" ON analyses FOR ALL USING (true) WITH CHECK (true);
