'use client';

import { useEffect, useState } from 'react';
import { useAuth } from '@/contexts/auth-context';
import { useRouter } from 'next/navigation';
import { supabase } from '@/lib/supabase';
import { motion } from 'framer-motion';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { Badge } from '@/components/ui/badge';
import { getLevelFromXP, getLevelProgress, formatDuration } from '@/lib/utils';
import {
  Activity, Dumbbell, TrendingUp, Flame, Trophy, Star, Zap,
  Calendar, ArrowRight, Target, Heart, Clock, AlertTriangle,
  CheckCircle, ChevronRight,
} from 'lucide-react';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, BarChart, Bar } from 'recharts';

interface DashboardData {
  profile: any;
  stats: any;
  streaks: any;
  recentSessions: any[];
  achievements: any[];
  activePlan: any;
  weeklyData: any[];
  todayWorkout: any;
}

export default function Dashboard() {
  const { user, profile } = useAuth();
  const router = useRouter();
  const [data, setData] = useState<DashboardData | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    if (!user) {
      router.push('/auth');
      return;
    }
    fetchDashboardData();
  }, [user]);

  const fetchDashboardData = async () => {
    const userId = user!.id;

    const [statsRes, streaksRes, sessionsRes, achievementsRes, plansRes, exercisesRes] = await Promise.all([
      supabase.from('gamification_stats').select('*').eq('user_id', userId).maybeSingle(),
      supabase.from('daily_streaks').select('*').eq('user_id', userId).maybeSingle(),
      supabase.from('workout_sessions').select('*, exercises(*)').eq('user_id', userId).order('created_at', { ascending: false }).limit(5),
      supabase.from('user_achievements').select('*, achievements(*)').eq('user_id', userId).order('unlocked_at', { ascending: false }).limit(4),
      supabase.from('exercise_plans').select('*').eq('user_id', userId).eq('is_active', true).maybeSingle(),
      supabase.from('exercises').select('*').limit(10),
    ]);

    const stats = statsRes.data;
    const streaks = streaksRes.data;
    const sessions = sessionsRes.data || [];
    const achievements = achievementsRes.data || [];
    const activePlan = plansRes.data;

    const weeklyData = generateWeeklyData(sessions);
    const todayWorkout = activePlan?.exercises?.[0] || exercisesRes.data?.[0];

    setData({
      profile: profile,
      stats,
      streaks,
      recentSessions: sessions,
      achievements,
      activePlan,
      weeklyData,
      todayWorkout,
    });
    setIsLoading(false);
  };

  const generateWeeklyData = (sessions: any[]) => {
    const days = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];
    const today = new Date();
    const dayIndex = (today.getDay() + 6) % 7;
    return days.map((day, i) => {
      const diff = dayIndex - i;
      const date = new Date();
      date.setDate(date.getDate() - diff);
      const dateStr = date.toISOString().split('T')[0];
      const daySessions = sessions.filter((s) => s.created_at?.startsWith(dateStr));
      return {
        day,
        reps: daySessions.reduce((sum, s) => sum + (s.reps_completed || 0), 0),
        accuracy: daySessions.length > 0
          ? Math.round(daySessions.reduce((sum, s) => sum + (s.posture_accuracy || 0), 0) / daySessions.length)
          : 0,
      };
    });
  };

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-950">
        <div className="animate-spin w-8 h-8 border-2 border-blue-500 border-t-transparent rounded-full" />
      </div>
    );
  }

  if (!data) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-950 text-white">
        <p>Failed to load dashboard</p>
      </div>
    );
  }

  const { stats, streaks, recentSessions, achievements, weeklyData, todayWorkout } = data;
  const level = getLevelFromXP(stats?.xp || 0);
  const levelProgress = getLevelProgress(stats?.xp || 0);

  return (
    <div className="min-h-screen bg-slate-950 text-white">
      <div className="max-w-7xl mx-auto p-4 lg:p-6">
        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-2xl font-bold">Welcome back, {data.profile?.full_name || 'User'}</h1>
            <p className="text-slate-400 mt-1">Keep up the momentum with your recovery journey</p>
          </div>
          <div className="flex items-center gap-3">
            <div className="flex items-center gap-2 bg-slate-900 px-3 py-2 rounded-lg border border-slate-800">
              <Zap className="w-4 h-4 text-amber-400" />
              <span className="font-bold">{stats?.xp || 0} XP</span>
            </div>
            <div className="flex items-center gap-2 bg-slate-900 px-3 py-2 rounded-lg border border-slate-800">
              <Trophy className="w-4 h-4 text-blue-400" />
              <span className="font-bold">Level {level}</span>
            </div>
          </div>
        </div>

        {/* Stats Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }}>
            <Card className="bg-slate-900/60 border-slate-800">
              <CardContent className="p-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-slate-400 text-sm">Current Streak</p>
                    <p className="text-2xl font-bold text-white">{streaks?.current_streak || 0} days</p>
                  </div>
                  <div className="w-10 h-10 rounded-lg bg-orange-500/10 flex items-center justify-center">
                    <Flame className="w-5 h-5 text-orange-400" />
                  </div>
                </div>
                <p className="text-xs text-slate-500 mt-2">Best: {streaks?.longest_streak || 0} days</p>
              </CardContent>
            </Card>
          </motion.div>

          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }}>
            <Card className="bg-slate-900/60 border-slate-800">
              <CardContent className="p-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-slate-400 text-sm">Total Workouts</p>
                    <p className="text-2xl font-bold text-white">{stats?.total_workouts || 0}</p>
                  </div>
                  <div className="w-10 h-10 rounded-lg bg-blue-500/10 flex items-center justify-center">
                    <Dumbbell className="w-5 h-5 text-blue-400" />
                  </div>
                </div>
                <p className="text-xs text-slate-500 mt-2">+{stats?.total_reps || 0} total reps</p>
              </CardContent>
            </Card>
          </motion.div>

          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.3 }}>
            <Card className="bg-slate-900/60 border-slate-800">
              <CardContent className="p-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-slate-400 text-sm">Avg Accuracy</p>
                    <p className="text-2xl font-bold text-white">{stats?.average_accuracy || 0}%</p>
                  </div>
                  <div className="w-10 h-10 rounded-lg bg-emerald-500/10 flex items-center justify-center">
                    <Target className="w-5 h-5 text-emerald-400" />
                  </div>
                </div>
                <Progress value={stats?.average_accuracy || 0} className="h-1 mt-2 bg-slate-800" />
              </CardContent>
            </Card>
          </motion.div>

          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.4 }}>
            <Card className="bg-slate-900/60 border-slate-800">
              <CardContent className="p-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-slate-400 text-sm">Calories Burned</p>
                    <p className="text-2xl font-bold text-white">{stats?.total_calories || 0}</p>
                  </div>
                  <div className="w-10 h-10 rounded-lg bg-red-500/10 flex items-center justify-center">
                    <Heart className="w-5 h-5 text-red-400" />
                  </div>
                </div>
                <p className="text-xs text-slate-500 mt-2">Since you started</p>
              </CardContent>
            </Card>
          </motion.div>
        </div>

        {/* Level Progress */}
        <Card className="bg-slate-900/60 border-slate-800 mb-6">
          <CardContent className="p-4">
            <div className="flex items-center justify-between mb-2">
              <div className="flex items-center gap-2">
                <Star className="w-5 h-5 text-amber-400" />
                <span className="font-bold text-white">Level {level}</span>
                <span className="text-slate-400 text-sm">{stats?.xp || 0} / {Math.pow(level, 2) * 100} XP</span>
              </div>
              <span className="text-sm text-slate-400">{levelProgress}% to Level {level + 1}</span>
            </div>
            <Progress value={levelProgress} className="h-2 bg-slate-800" />
          </CardContent>
        </Card>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Today's Workout */}
          <div className="lg:col-span-2 space-y-6">
            <Card className="bg-slate-900/60 border-slate-800">
              <CardHeader className="pb-2">
                <div className="flex items-center justify-between">
                  <CardTitle className="text-white flex items-center gap-2">
                    <Calendar className="w-5 h-5 text-blue-400" />
                    Today's Workout
                  </CardTitle>
                  <Button variant="ghost" size="sm" onClick={() => router.push('/exercises')} className="text-blue-400 hover:text-blue-300">
                    All Exercises <ChevronRight className="w-4 h-4 ml-1" />
                  </Button>
                </div>
              </CardHeader>
              <CardContent className="p-4 pt-0">
                {todayWorkout ? (
                  <div className="flex items-center gap-4 p-4 bg-slate-800/50 rounded-xl">
                    <div className="w-14 h-14 rounded-xl bg-blue-500/10 flex items-center justify-center">
                      <Activity className="w-7 h-7 text-blue-400" />
                    </div>
                    <div className="flex-1">
                      <h3 className="font-semibold text-white">{todayWorkout.name || todayWorkout.exercise?.name || 'Recommended Exercise'}</h3>
                      <p className="text-sm text-slate-400 mt-1">
                        {todayWorkout.sets || todayWorkout.default_sets || 3} sets x {todayWorkout.reps || todayWorkout.default_reps || 10} reps
                      </p>
                    </div>
                    <Button onClick={() => router.push(`/exercise/${todayWorkout.id}`)} className="bg-blue-500 hover:bg-blue-600 text-white">
                      Start <ArrowRight className="w-4 h-4 ml-2" />
                    </Button>
                  </div>
                ) : (
                  <div className="text-center py-8 text-slate-400">
                    <p>No active workout plan. Explore exercises to get started.</p>
                    <Button onClick={() => router.push('/exercises')} className="mt-4 bg-blue-500 hover:bg-blue-600 text-white">
                      Browse Exercises
                    </Button>
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Weekly Charts */}
            <Card className="bg-slate-900/60 border-slate-800">
              <CardHeader className="pb-2">
                <CardTitle className="text-white flex items-center gap-2">
                  <TrendingUp className="w-5 h-5 text-emerald-400" />
                  Weekly Progress
                </CardTitle>
              </CardHeader>
              <CardContent className="p-4 pt-0">
                <div className="h-64">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={weeklyData}>
                      <CartesianGrid strokeDasharray="3 3" stroke="#334155" />
                      <XAxis dataKey="day" stroke="#94a3b8" fontSize={12} />
                      <YAxis stroke="#94a3b8" fontSize={12} />
                      <Tooltip
                        contentStyle={{ backgroundColor: '#1e293b', borderColor: '#334155', color: '#fff' }}
                        itemStyle={{ color: '#fff' }}
                      />
                      <Bar dataKey="reps" fill="#3B82F6" radius={[4, 4, 0, 0]} />
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              </CardContent>
            </Card>

            <Card className="bg-slate-900/60 border-slate-800">
              <CardHeader className="pb-2">
                <CardTitle className="text-white flex items-center gap-2">
                  <Activity className="w-5 h-5 text-blue-400" />
                  Posture Accuracy Trend
                </CardTitle>
              </CardHeader>
              <CardContent className="p-4 pt-0">
                <div className="h-64">
                  <ResponsiveContainer width="100%" height="100%">
                    <LineChart data={weeklyData}>
                      <CartesianGrid strokeDasharray="3 3" stroke="#334155" />
                      <XAxis dataKey="day" stroke="#94a3b8" fontSize={12} />
                      <YAxis stroke="#94a3b8" fontSize={12} domain={[0, 100]} />
                      <Tooltip
                        contentStyle={{ backgroundColor: '#1e293b', borderColor: '#334155', color: '#fff' }}
                        itemStyle={{ color: '#fff' }}
                        formatter={(value: any) => [`${value}%`, 'Accuracy']}
                      />
                      <Line type="monotone" dataKey="accuracy" stroke="#10B981" strokeWidth={2} dot={{ fill: '#10B981' }} />
                    </LineChart>
                  </ResponsiveContainer>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Sidebar */}
          <div className="space-y-6">
            {/* Recent Sessions */}
            <Card className="bg-slate-900/60 border-slate-800">
              <CardHeader className="pb-2">
                <CardTitle className="text-white text-sm flex items-center gap-2">
                  <Clock className="w-4 h-4 text-slate-400" />
                  Recent Sessions
                </CardTitle>
              </CardHeader>
              <CardContent className="p-4 pt-0">
                {recentSessions.length > 0 ? (
                  <div className="space-y-3">
                    {recentSessions.map((session, i) => (
                      <div key={i} className="flex items-center gap-3 p-3 bg-slate-800/50 rounded-lg">
                        <div className={`w-8 h-8 rounded-full flex items-center justify-center ${
                          (session.posture_accuracy || 0) >= 90 ? 'bg-emerald-500/10 text-emerald-400' :
                          (session.posture_accuracy || 0) >= 70 ? 'bg-amber-500/10 text-amber-400' :
                          'bg-red-500/10 text-red-400'
                        }`}>
                          {(session.posture_accuracy || 0) >= 70 ? <CheckCircle className="w-4 h-4" /> : <AlertTriangle className="w-4 h-4" />}
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-medium text-white truncate">{session.exercises?.name || 'Exercise'}</p>
                          <p className="text-xs text-slate-400">
                            {session.reps_completed} reps · {formatDuration(session.duration_seconds || 0)}
                          </p>
                        </div>
                        <span className="text-sm font-bold text-white">{session.posture_accuracy || 0}%</span>
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="text-sm text-slate-400 py-4 text-center">No sessions yet. Start your first workout!</p>
                )}
              </CardContent>
            </Card>

            {/* Achievements */}
            <Card className="bg-slate-900/60 border-slate-800">
              <CardHeader className="pb-2">
                <div className="flex items-center justify-between">
                  <CardTitle className="text-white text-sm flex items-center gap-2">
                    <Trophy className="w-4 h-4 text-amber-400" />
                    Achievements
                  </CardTitle>
                  <Button variant="ghost" size="sm" onClick={() => router.push('/achievements')} className="text-xs text-blue-400">
                    View All
                  </Button>
                </div>
              </CardHeader>
              <CardContent className="p-4 pt-0">
                {achievements.length > 0 ? (
                  <div className="space-y-2">
                    {achievements.map((ua, i) => (
                      <div key={i} className="flex items-center gap-3 p-2 bg-slate-800/50 rounded-lg">
                        <div className="w-8 h-8 rounded-full bg-amber-500/10 flex items-center justify-center">
                          <Star className="w-4 h-4 text-amber-400" />
                        </div>
                        <div className="flex-1">
                          <p className="text-sm font-medium text-white">{ua.achievements?.name}</p>
                          <p className="text-xs text-slate-400">+{ua.achievements?.xp_reward} XP</p>
                        </div>
                        <Badge className="bg-amber-500/10 text-amber-400 border-amber-500/20 text-xs">Unlocked</Badge>
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="text-sm text-slate-400 py-4 text-center">Complete workouts to unlock achievements!</p>
                )}
              </CardContent>
            </Card>

            {/* Quick Actions */}
            <Card className="bg-slate-900/60 border-slate-800">
              <CardHeader className="pb-2">
                <CardTitle className="text-white text-sm">Quick Actions</CardTitle>
              </CardHeader>
              <CardContent className="p-4 pt-0">
                <div className="space-y-2">
                  <Button variant="outline" onClick={() => router.push('/ai-chat')} className="w-full justify-start border-slate-700 text-white hover:bg-slate-800">
                    <Activity className="w-4 h-4 mr-2 text-blue-400" />AI Assistant
                  </Button>
                  <Button variant="outline" onClick={() => router.push('/planner')} className="w-full justify-start border-slate-700 text-white hover:bg-slate-800">
                    <Calendar className="w-4 h-4 mr-2 text-emerald-400" />Rehabilitation Plan
                  </Button>
                  <Button variant="outline" onClick={() => router.push('/medical-analysis')} className="w-full justify-start border-slate-700 text-white hover:bg-slate-800">
                    <AlertTriangle className="w-4 h-4 mr-2 text-amber-400" />Medical Analysis
                  </Button>
                  <Button variant="outline" onClick={() => router.push('/leaderboard')} className="w-full justify-start border-slate-700 text-white hover:bg-slate-800">
                    <Trophy className="w-4 h-4 mr-2 text-purple-400" />Leaderboard
                  </Button>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
}
