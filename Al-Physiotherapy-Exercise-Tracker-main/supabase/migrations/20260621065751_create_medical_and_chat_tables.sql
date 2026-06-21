/*
# Create Medical Reports and Chat Tables

1. New Tables
- `medical_reports`: User-uploaded medical documents
  - `id` (uuid, primary key)
  - `user_id` (uuid, references auth.users)
  - `file_name` (text)
  - `file_url` (text)
  - `file_type` (text)
  - `report_type` (text: MRI, X-Ray, PDF, Prescription, etc.)
  - `uploaded_at` (timestamptz)

- `medical_analysis`: AI analysis results of medical reports
  - `id` (uuid, primary key)
  - `user_id` (uuid, references auth.users)
  - `report_id` (uuid, references medical_reports)
  - `diagnosis` (text)
  - `affected_area` (text)
  - `recovery_status` (text)
  - `restrictions` (text[])
  - `exercise_recommendations` (text[])
  - `risk_warnings` (text[])
  - `analyzed_at` (timestamptz)

- `chat_history`: AI physiotherapy assistant conversations
  - `id` (uuid, primary key)
  - `user_id` (uuid, references auth.users)
  - `role` (text: user or assistant)
  - `content` (text)
  - `created_at` (timestamptz)

- `notifications`: User notifications
  - `id` (uuid, primary key)
  - `user_id` (uuid, references auth.users)
  - `title` (text)
  - `message` (text)
  - `type` (text)
  - `is_read` (boolean, default false)
  - `created_at` (timestamptz)

2. Security
- Enable RLS on all tables
- Owner-scoped policies
*/

CREATE TABLE IF NOT EXISTS medical_reports (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL DEFAULT auth.uid() REFERENCES auth.users(id) ON DELETE CASCADE,
  file_name text NOT NULL,
  file_url text,
  file_type text,
  report_type text,
  uploaded_at timestamptz DEFAULT now()
);

ALTER TABLE medical_reports ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "select_own_reports" ON medical_reports;
CREATE POLICY "select_own_reports" ON medical_reports FOR SELECT
  TO authenticated USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "insert_own_reports" ON medical_reports;
CREATE POLICY "insert_own_reports" ON medical_reports FOR INSERT
  TO authenticated WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "delete_own_reports" ON medical_reports;
CREATE POLICY "delete_own_reports" ON medical_reports FOR DELETE
  TO authenticated USING (auth.uid() = user_id);

CREATE TABLE IF NOT EXISTS medical_analysis (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL DEFAULT auth.uid() REFERENCES auth.users(id) ON DELETE CASCADE,
  report_id uuid REFERENCES medical_reports(id) ON DELETE CASCADE,
  diagnosis text,
  affected_area text,
  recovery_status text,
  restrictions text[] DEFAULT '{}',
  exercise_recommendations text[] DEFAULT '{}',
  risk_warnings text[] DEFAULT '{}',
  analyzed_at timestamptz DEFAULT now()
);

ALTER TABLE medical_analysis ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "select_own_analysis" ON medical_analysis;
CREATE POLICY "select_own_analysis" ON medical_analysis FOR SELECT
  TO authenticated USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "insert_own_analysis" ON medical_analysis;
CREATE POLICY "insert_own_analysis" ON medical_analysis FOR INSERT
  TO authenticated WITH CHECK (auth.uid() = user_id);

CREATE TABLE IF NOT EXISTS chat_history (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL DEFAULT auth.uid() REFERENCES auth.users(id) ON DELETE CASCADE,
  role text NOT NULL,
  content text NOT NULL,
  created_at timestamptz DEFAULT now()
);

ALTER TABLE chat_history ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "select_own_chat" ON chat_history;
CREATE POLICY "select_own_chat" ON chat_history FOR SELECT
  TO authenticated USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "insert_own_chat" ON chat_history;
CREATE POLICY "insert_own_chat" ON chat_history FOR INSERT
  TO authenticated WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "delete_own_chat" ON chat_history;
CREATE POLICY "delete_own_chat" ON chat_history FOR DELETE
  TO authenticated USING (auth.uid() = user_id);

CREATE TABLE IF NOT EXISTS notifications (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL DEFAULT auth.uid() REFERENCES auth.users(id) ON DELETE CASCADE,
  title text NOT NULL,
  message text,
  type text,
  is_read boolean DEFAULT false,
  created_at timestamptz DEFAULT now()
);

ALTER TABLE notifications ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "select_own_notifications" ON notifications;
CREATE POLICY "select_own_notifications" ON notifications FOR SELECT
  TO authenticated USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "insert_own_notifications" ON notifications;
CREATE POLICY "insert_own_notifications" ON notifications FOR INSERT
  TO authenticated WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "update_own_notifications" ON notifications;
CREATE POLICY "update_own_notifications" ON notifications FOR UPDATE
  TO authenticated USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "delete_own_notifications" ON notifications;
CREATE POLICY "delete_own_notifications" ON notifications FOR DELETE
  TO authenticated USING (auth.uid() = user_id);
