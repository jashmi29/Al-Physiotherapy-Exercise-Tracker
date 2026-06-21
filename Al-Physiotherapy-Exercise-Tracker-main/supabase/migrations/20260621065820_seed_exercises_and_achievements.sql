/*
# Seed Exercises and Achievements

1. Seed Data
- Insert 10 supported exercises into `exercises` table
- Insert achievements into `achievements` table
- Include default values for all required fields

2. Notes
- These are idempotent inserts using ON CONFLICT
- Achievements are the gamification system backbone
- Exercises are the master list for all workouts
*/

INSERT INTO exercises (name, description, category, target_body_parts, difficulty, default_sets, default_reps, default_duration, safety_notes, instructions, calories_per_minute) VALUES
  ('Squats', 'Lower body strength exercise targeting quads, glutes, and hamstrings', 'strength', ARRAY['quadriceps', 'glutes', 'hamstrings'], 'beginner', 3, 12, 45, 'Keep your back straight, do not let your knees cave inward', ARRAY['Stand with feet shoulder-width apart', 'Lower your hips back and down', 'Keep chest up and back straight', 'Push through heels to stand up'], 8),
  ('Arm Raises', 'Upper body exercise for shoulder mobility and strength', 'mobility', ARRAY['shoulders', 'upper back'], 'beginner', 3, 15, 30, 'Do not shrug shoulders, maintain neutral spine', ARRAY['Stand with arms at your sides', 'Raise arms straight forward to shoulder height', 'Slowly lower back down', 'Repeat with controlled motion'], 3),
  ('Leg Raises', 'Core strengthening exercise targeting hip flexors and lower abs', 'strength', ARRAY['hip flexors', 'lower abs'], 'intermediate', 3, 10, 30, 'Keep lower back pressed against the floor', ARRAY['Lie on your back with legs straight', 'Lift both legs together to 90 degrees', 'Slowly lower without touching the floor', 'Maintain core engagement throughout'], 4),
  ('Lunges', 'Lower body exercise for single-leg strength and balance', 'strength', ARRAY['quadriceps', 'glutes', 'hamstrings', 'calves'], 'intermediate', 3, 10, 50, 'Keep front knee aligned over ankle, do not let knee go past toes', ARRAY['Step forward with one leg', 'Lower hips until both knees are at 90 degrees', 'Push back through front heel to stand', 'Alternate legs for each rep'], 7),
  ('Knee Extensions', 'Quadriceps strengthening exercise for knee rehabilitation', 'rehabilitation', ARRAY['quadriceps', 'knees'], 'beginner', 3, 15, 30, 'Do not hyperextend the knee, keep controlled motion', ARRAY['Sit with back straight and legs bent at 90 degrees', 'Extend one leg straight out, hold briefly', 'Lower back down with control', 'Repeat and alternate legs'], 2.5),
  ('Heel Slides', 'Knee rehabilitation exercise for range of motion', 'rehabilitation', ARRAY['knees', 'hamstrings'], 'beginner', 3, 20, 30, 'Keep heel on the floor throughout the movement', ARRAY['Lie on your back with legs straight', 'Slowly slide one heel toward your buttocks', 'Slide back to starting position', 'Repeat with smooth controlled motion'], 1.5),
  ('Shoulder Rotations', 'Shoulder mobility exercise for rotator cuff health', 'mobility', ARRAY['shoulders', 'rotator cuff'], 'beginner', 3, 15, 25, 'Do not force the range of motion, stay within comfort zone', ARRAY['Stand with arms at your sides', 'Rotate arms outward and upward', 'Bring arms forward and rotate inward', 'Maintain smooth circular motion'], 2),
  ('Ankle Pumps', 'Ankle mobility exercise for lower leg rehabilitation', 'rehabilitation', ARRAY['ankles', 'calves'], 'beginner', 3, 20, 20, 'Move through full range of motion without pain', ARRAY['Sit with legs extended', 'Point toes away from you', 'Flex toes back toward you', 'Alternate with smooth motion'], 1),
  ('Physiotherapy Glute Bridges', 'Rehabilitation exercise for hip and core stability', 'rehabilitation', ARRAY['glutes', 'hamstrings', 'core'], 'beginner', 3, 12, 35, 'Keep hips level, do not arch your back excessively', ARRAY['Lie on your back with knees bent and feet flat', 'Lift hips up to create a straight line', 'Squeeze glutes at the top', 'Lower back down with control'], 4),
  ('Rehabilitation Wall Push-ups', 'Modified upper body exercise for building strength', 'rehabilitation', ARRAY['chest', 'shoulders', 'triceps'], 'beginner', 3, 15, 30, 'Keep body in a straight line, do not sag hips', ARRAY['Stand arm-length from a wall', 'Place hands on wall at shoulder height', 'Lower chest toward wall with control', 'Push back to starting position'], 3)
ON CONFLICT (name) DO NOTHING;

INSERT INTO achievements (name, description, icon, xp_reward, requirement_type, requirement_value) VALUES
  ('First Workout', 'Complete your first exercise session', 'Dumbbell', 100, 'total_workouts', 1),
  ('Perfect Form', 'Achieve 95% posture accuracy in a session', 'Trophy', 200, 'perfect_form', 1),
  ('100 Reps Completed', 'Complete a total of 100 repetitions', 'Target', 150, 'total_reps', 100),
  ('7-Day Streak', 'Exercise for 7 consecutive days', 'Flame', 300, 'streak', 7),
  ('30-Day Streak', 'Exercise for 30 consecutive days', 'Crown', 1000, 'streak', 30),
  ('Recovery Champion', 'Complete 50 rehabilitation sessions', 'Heart', 500, 'total_workouts', 50),
  ('Motion Master', 'Achieve 90% average accuracy across all sessions', 'Star', 400, 'average_accuracy', 90),
  ('Level 5', 'Reach level 5 in the gamification system', 'Zap', 250, 'level', 5),
  ('Level 10', 'Reach level 10 in the gamification system', 'Award', 500, 'level', 10),
  ('Early Bird', 'Complete a workout before 8 AM', 'Sun', 150, 'early_bird', 1),
  ('Form Focused', 'Complete 10 sessions with 90%+ accuracy', 'Eye', 350, 'high_accuracy_sessions', 10),
  ('Consistency King', 'Complete 20 workouts in a single month', 'Calendar', 400, 'monthly_workouts', 20)
ON CONFLICT DO NOTHING;
