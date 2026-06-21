/*
# Create Exercise-Related Tables

1. New Tables
- `exercise_plans`: AI-generated personalized rehabilitation plans
  - `id` (uuid, primary key)
  - `user_id` (uuid, references auth.users)
  - `name` (text, e.g., "Knee Recovery Week 1")
  - `injury_type` (text)
  - `pain_level` (integer, 1-10)
  - `recovery_stage` (text)
  - `plan_type` (text: daily, weekly, monthly)
  - `exercises` (jsonb array of exercise details)
  - `is_active` (boolean, default true)
  - `created_at` (timestamptz)
  - `updated_at` (timestamptz)

- `exercises`: Master list of supported exercises
  - `id` (uuid, primary key)
  - `name` (text)
  - `description` (text)
  - `category` (text)
  - `target_body_parts` (text[])
  - `difficulty` (text)
  - `default_sets` (integer)
  - `default_reps` (integer)
  - `default_duration` (integer, seconds)
  - `safety_notes` (text)
  - `instructions` (text[])
  - `calories_per_minute` (numeric)
  - `created_at` (timestamptz)

- `workout_sessions`: Records of individual exercise sessions
  - `id` (uuid, primary key)
  - `user_id` (uuid, references auth.users)
  - `exercise_id` (uuid, references exercises)
  - `plan_id` (uuid, references exercise_plans)
  - `reps_completed` (integer)
  - `sets_completed` (integer)
  - `duration_seconds` (integer)
  - `posture_accuracy` (numeric, 0-100)
  - `exercise_accuracy` (numeric, 0-100)
  - `movement_quality` (text)
  - `calories_burned` (numeric)
  - `feedback` (text[])
  - `completed_at` (timestamptz)
  - `created_at` (timestamptz)

- `gamification_stats`: User XP, level, and stats
  - `id` (uuid, primary key)
  - `user_id` (uuid, references auth.users)
  - `xp` (integer, default 0)
  - `level` (integer, default 1)
  - `total_workouts` (integer, default 0)
  - `total_reps` (integer, default 0)
  - `total_calories` (integer, default 0)
  - `average_accuracy` (numeric, default 0)
  - `updated_at` (timestamptz)

2. Security
- Enable RLS on all tables
- Owner-scoped policies for user data
- Public read for exercises master table
*/

CREATE TABLE IF NOT EXISTS exercise_plans (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL DEFAULT auth.uid() REFERENCES auth.users(id) ON DELETE CASCADE,
  name text NOT NULL,
  injury_type text,
  pain_level integer,
  recovery_stage text,
  plan_type text DEFAULT 'daily',
  exercises jsonb NOT NULL DEFAULT '[]'::jsonb,
  is_active boolean DEFAULT true,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

ALTER TABLE exercise_plans ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "select_own_exercise_plans" ON exercise_plans;
CREATE POLICY "select_own_exercise_plans" ON exercise_plans FOR SELECT
  TO authenticated USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "insert_own_exercise_plans" ON exercise_plans;
CREATE POLICY "insert_own_exercise_plans" ON exercise_plans FOR INSERT
  TO authenticated WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "update_own_exercise_plans" ON exercise_plans;
CREATE POLICY "update_own_exercise_plans" ON exercise_plans FOR UPDATE
  TO authenticated USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "delete_own_exercise_plans" ON exercise_plans;
CREATE POLICY "delete_own_exercise_plans" ON exercise_plans FOR DELETE
  TO authenticated USING (auth.uid() = user_id);

CREATE TABLE IF NOT EXISTS exercises (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL UNIQUE,
  description text,
  category text,
  target_body_parts text[] DEFAULT '{}',
  difficulty text DEFAULT 'beginner',
  default_sets integer DEFAULT 3,
  default_reps integer DEFAULT 10,
  default_duration integer DEFAULT 60,
  safety_notes text,
  instructions text[] DEFAULT '{}',
  calories_per_minute numeric DEFAULT 5,
  created_at timestamptz DEFAULT now()
);

ALTER TABLE exercises ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "public_select_exercises" ON exercises;
CREATE POLICY "public_select_exercises" ON exercises FOR SELECT
  TO anon, authenticated USING (true);

DROP POLICY IF EXISTS "admin_insert_exercises" ON exercises;
CREATE POLICY "admin_insert_exercises" ON exercises FOR INSERT
  TO authenticated WITH CHECK (true);

CREATE TABLE IF NOT EXISTS workout_sessions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL DEFAULT auth.uid() REFERENCES auth.users(id) ON DELETE CASCADE,
  exercise_id uuid REFERENCES exercises(id) ON DELETE SET NULL,
  plan_id uuid REFERENCES exercise_plans(id) ON DELETE SET NULL,
  reps_completed integer DEFAULT 0,
  sets_completed integer DEFAULT 0,
  duration_seconds integer DEFAULT 0,
  posture_accuracy numeric DEFAULT 0,
  exercise_accuracy numeric DEFAULT 0,
  movement_quality text,
  calories_burned numeric DEFAULT 0,
  feedback text[] DEFAULT '{}',
  completed_at timestamptz DEFAULT now(),
  created_at timestamptz DEFAULT now()
);

ALTER TABLE workout_sessions ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "select_own_sessions" ON workout_sessions;
CREATE POLICY "select_own_sessions" ON workout_sessions FOR SELECT
  TO authenticated USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "insert_own_sessions" ON workout_sessions;
CREATE POLICY "insert_own_sessions" ON workout_sessions FOR INSERT
  TO authenticated WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "update_own_sessions" ON workout_sessions;
CREATE POLICY "update_own_sessions" ON workout_sessions FOR UPDATE
  TO authenticated USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "delete_own_sessions" ON workout_sessions;
CREATE POLICY "delete_own_sessions" ON workout_sessions FOR DELETE
  TO authenticated USING (auth.uid() = user_id);

CREATE TABLE IF NOT EXISTS gamification_stats (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL DEFAULT auth.uid() REFERENCES auth.users(id) ON DELETE CASCADE,
  xp integer DEFAULT 0,
  level integer DEFAULT 1,
  total_workouts integer DEFAULT 0,
  total_reps integer DEFAULT 0,
  total_calories integer DEFAULT 0,
  average_accuracy numeric DEFAULT 0,
  updated_at timestamptz DEFAULT now()
);

ALTER TABLE gamification_stats ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "select_own_gamification" ON gamification_stats;
CREATE POLICY "select_own_gamification" ON gamification_stats FOR SELECT
  TO authenticated USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "insert_own_gamification" ON gamification_stats;
CREATE POLICY "insert_own_gamification" ON gamification_stats FOR INSERT
  TO authenticated WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "update_own_gamification" ON gamification_stats;
CREATE POLICY "update_own_gamification" ON gamification_stats FOR UPDATE
  TO authenticated USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "delete_own_gamification" ON gamification_stats;
CREATE POLICY "delete_own_gamification" ON gamification_stats FOR DELETE
  TO authenticated USING (auth.uid() = user_id);
