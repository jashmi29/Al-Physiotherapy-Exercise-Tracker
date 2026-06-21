/*
# Create Achievements, Streaks, and Leaderboard Tables

1. New Tables
- `achievements`: Master list of all possible achievements
  - `id` (uuid, primary key)
  - `name` (text)
  - `description` (text)
  - `icon` (text)
  - `xp_reward` (integer)
  - `requirement_type` (text)
  - `requirement_value` (integer)
  - `created_at` (timestamptz)

- `user_achievements`: Junction table linking users to unlocked achievements
  - `id` (uuid, primary key)
  - `user_id` (uuid, references auth.users)
  - `achievement_id` (uuid, references achievements)
  - `unlocked_at` (timestamptz)

- `daily_streaks`: Track daily exercise streaks
  - `id` (uuid, primary key)
  - `user_id` (uuid, references auth.users)
  - `current_streak` (integer, default 0)
  - `longest_streak` (integer, default 0)
  - `last_exercise_date` (date)
  - `weekly_goal` (integer, default 5)
  - `monthly_goal` (integer, default 20)
  - `updated_at` (timestamptz)

- `leaderboard`: Global leaderboard entries
  - `id` (uuid, primary key)
  - `user_id` (uuid, references auth.users)
  - `full_name` (text)
  - `xp` (integer, default 0)
  - `level` (integer, default 1)
  - `accuracy` (numeric, default 0)
  - `streak` (integer, default 0)
  - `total_workouts` (integer, default 0)
  - `updated_at` (timestamptz)

2. Security
- Enable RLS on all tables
- Owner-scoped for user-specific data
- Public read for leaderboard and achievements
*/

CREATE TABLE IF NOT EXISTS achievements (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  description text,
  icon text,
  xp_reward integer DEFAULT 100,
  requirement_type text,
  requirement_value integer DEFAULT 1,
  created_at timestamptz DEFAULT now()
);

ALTER TABLE achievements ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "public_select_achievements" ON achievements;
CREATE POLICY "public_select_achievements" ON achievements FOR SELECT
  TO anon, authenticated USING (true);

DROP POLICY IF EXISTS "admin_insert_achievements" ON achievements;
CREATE POLICY "admin_insert_achievements" ON achievements FOR INSERT
  TO authenticated WITH CHECK (true);

CREATE TABLE IF NOT EXISTS user_achievements (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL DEFAULT auth.uid() REFERENCES auth.users(id) ON DELETE CASCADE,
  achievement_id uuid NOT NULL REFERENCES achievements(id) ON DELETE CASCADE,
  unlocked_at timestamptz DEFAULT now(),
  UNIQUE(user_id, achievement_id)
);

ALTER TABLE user_achievements ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "select_own_achievements" ON user_achievements;
CREATE POLICY "select_own_achievements" ON user_achievements FOR SELECT
  TO authenticated USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "insert_own_achievements" ON user_achievements;
CREATE POLICY "insert_own_achievements" ON user_achievements FOR INSERT
  TO authenticated WITH CHECK (auth.uid() = user_id);

CREATE TABLE IF NOT EXISTS daily_streaks (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL DEFAULT auth.uid() REFERENCES auth.users(id) ON DELETE CASCADE,
  current_streak integer DEFAULT 0,
  longest_streak integer DEFAULT 0,
  last_exercise_date date,
  weekly_goal integer DEFAULT 5,
  monthly_goal integer DEFAULT 20,
  updated_at timestamptz DEFAULT now()
);

ALTER TABLE daily_streaks ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "select_own_streaks" ON daily_streaks;
CREATE POLICY "select_own_streaks" ON daily_streaks FOR SELECT
  TO authenticated USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "insert_own_streaks" ON daily_streaks;
CREATE POLICY "insert_own_streaks" ON daily_streaks FOR INSERT
  TO authenticated WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "update_own_streaks" ON daily_streaks;
CREATE POLICY "update_own_streaks" ON daily_streaks FOR UPDATE
  TO authenticated USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

CREATE TABLE IF NOT EXISTS leaderboard (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL DEFAULT auth.uid() REFERENCES auth.users(id) ON DELETE CASCADE,
  full_name text,
  xp integer DEFAULT 0,
  level integer DEFAULT 1,
  accuracy numeric DEFAULT 0,
  streak integer DEFAULT 0,
  total_workouts integer DEFAULT 0,
  updated_at timestamptz DEFAULT now()
);

ALTER TABLE leaderboard ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "public_select_leaderboard" ON leaderboard;
CREATE POLICY "public_select_leaderboard" ON leaderboard FOR SELECT
  TO anon, authenticated USING (true);

DROP POLICY IF EXISTS "insert_own_leaderboard" ON leaderboard;
CREATE POLICY "insert_own_leaderboard" ON leaderboard FOR INSERT
  TO authenticated WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "update_own_leaderboard" ON leaderboard;
CREATE POLICY "update_own_leaderboard" ON leaderboard FOR UPDATE
  TO authenticated USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);
