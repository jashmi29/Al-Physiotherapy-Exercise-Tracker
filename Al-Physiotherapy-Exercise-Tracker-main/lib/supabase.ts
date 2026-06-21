import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || '';
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || '';

export const supabase = createClient(supabaseUrl, supabaseAnonKey, {
  auth: {
    autoRefreshToken: true,
    persistSession: true,
  },
});

export type Database = {
  public: {
    Tables: {
      profiles: {
        Row: {
          id: string;
          full_name: string | null;
          age: number | null;
          gender: string | null;
          height: number | null;
          weight: number | null;
          activity_level: string | null;
          injury_history: string | null;
          medical_conditions: string | null;
          rehabilitation_goals: string | null;
          daily_exercise_time: number | null;
          avatar_url: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id: string;
          full_name?: string | null;
          age?: number | null;
          gender?: string | null;
          height?: number | null;
          weight?: number | null;
          activity_level?: string | null;
          injury_history?: string | null;
          medical_conditions?: string | null;
          rehabilitation_goals?: string | null;
          daily_exercise_time?: number | null;
          avatar_url?: string | null;
        };
      };
      exercises: {
        Row: {
          id: string;
          name: string;
          description: string | null;
          category: string | null;
          target_body_parts: string[];
          difficulty: string | null;
          default_sets: number | null;
          default_reps: number | null;
          default_duration: number | null;
          safety_notes: string | null;
          instructions: string[];
          calories_per_minute: number | null;
          created_at: string;
        };
      };
      workout_sessions: {
        Row: {
          id: string;
          user_id: string;
          exercise_id: string | null;
          plan_id: string | null;
          reps_completed: number;
          sets_completed: number;
          duration_seconds: number;
          posture_accuracy: number;
          exercise_accuracy: number;
          movement_quality: string | null;
          calories_burned: number;
          feedback: string[];
          completed_at: string;
          created_at: string;
        };
      };
      gamification_stats: {
        Row: {
          id: string;
          user_id: string;
          xp: number;
          level: number;
          total_workouts: number;
          total_reps: number;
          total_calories: number;
          average_accuracy: number;
          updated_at: string;
        };
      };
      achievements: {
        Row: {
          id: string;
          name: string;
          description: string | null;
          icon: string | null;
          xp_reward: number;
          requirement_type: string | null;
          requirement_value: number;
          created_at: string;
        };
      };
      user_achievements: {
        Row: {
          id: string;
          user_id: string;
          achievement_id: string;
          unlocked_at: string;
        };
      };
      daily_streaks: {
        Row: {
          id: string;
          user_id: string;
          current_streak: number;
          longest_streak: number;
          last_exercise_date: string | null;
          weekly_goal: number;
          monthly_goal: number;
          updated_at: string;
        };
      };
      leaderboard: {
        Row: {
          id: string;
          user_id: string;
          full_name: string | null;
          xp: number;
          level: number;
          accuracy: number;
          streak: number;
          total_workouts: number;
          updated_at: string;
        };
      };
      exercise_plans: {
        Row: {
          id: string;
          user_id: string;
          name: string;
          injury_type: string | null;
          pain_level: number | null;
          recovery_stage: string | null;
          plan_type: string | null;
          exercises: any;
          is_active: boolean;
          created_at: string;
          updated_at: string;
        };
      };
      medical_reports: {
        Row: {
          id: string;
          user_id: string;
          file_name: string;
          file_url: string | null;
          file_type: string | null;
          report_type: string | null;
          uploaded_at: string;
        };
      };
      medical_analysis: {
        Row: {
          id: string;
          user_id: string;
          report_id: string | null;
          diagnosis: string | null;
          affected_area: string | null;
          recovery_status: string | null;
          restrictions: string[];
          exercise_recommendations: string[];
          risk_warnings: string[];
          analyzed_at: string;
        };
      };
      chat_history: {
        Row: {
          id: string;
          user_id: string;
          role: string;
          content: string;
          created_at: string;
        };
      };
      notifications: {
        Row: {
          id: string;
          user_id: string;
          title: string;
          message: string | null;
          type: string | null;
          is_read: boolean;
          created_at: string;
        };
      };
    };
  };
};
