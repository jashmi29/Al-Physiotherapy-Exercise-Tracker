/*
# Create Profiles Table

1. New Tables
- `profiles`: Extended user profile data linked to Supabase Auth users
  - `id` (uuid, primary key, references auth.users)
  - `full_name` (text)
  - `age` (integer)
  - `gender` (text)
  - `height` (numeric, cm)
  - `weight` (numeric, kg)
  - `activity_level` (text)
  - `injury_history` (text)
  - `medical_conditions` (text)
  - `rehabilitation_goals` (text)
  - `daily_exercise_time` (integer, minutes)
  - `created_at` (timestamptz)
  - `updated_at` (timestamptz)

2. Security
- Enable RLS on `profiles`
- Owner-scoped policies: users can only access their own profile
*/

CREATE TABLE IF NOT EXISTS profiles (
  id uuid PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  full_name text,
  age integer,
  gender text,
  height numeric,
  weight numeric,
  activity_level text,
  injury_history text,
  medical_conditions text,
  rehabilitation_goals text,
  daily_exercise_time integer DEFAULT 30,
  avatar_url text,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "select_own_profile" ON profiles;
CREATE POLICY "select_own_profile" ON profiles FOR SELECT
  TO authenticated USING (auth.uid() = id);

DROP POLICY IF EXISTS "insert_own_profile" ON profiles;
CREATE POLICY "insert_own_profile" ON profiles FOR INSERT
  TO authenticated WITH CHECK (auth.uid() = id);

DROP POLICY IF EXISTS "update_own_profile" ON profiles;
CREATE POLICY "update_own_profile" ON profiles FOR UPDATE
  TO authenticated USING (auth.uid() = id) WITH CHECK (auth.uid() = id);

DROP POLICY IF EXISTS "delete_own_profile" ON profiles;
CREATE POLICY "delete_own_profile" ON profiles FOR DELETE
  TO authenticated USING (auth.uid() = id);
