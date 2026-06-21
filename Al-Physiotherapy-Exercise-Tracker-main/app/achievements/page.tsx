'use client';

import { useEffect, useState } from 'react';
import { useAuth } from '@/contexts/auth-context';
import { useRouter } from 'next/navigation';
import { supabase } from '@/lib/supabase';
import { motion } from 'framer-motion';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { toast } from 'sonner';
import { ArrowLeft, Trophy, Star, Zap, Lock, Unlock } from 'lucide-react';

interface Achievement {
  id: string;
  name: string;
  description: string;
  icon: string;
  xp_reward: number;
  requirement_type: string;
  requirement_value: number;
}

interface UserAchievement {
  achievement_id: string;
  unlocked_at: string;
  achievements: Achievement;
}

interface Stats {
  xp: number;
  level: number;
  total_workouts: number;
  total_reps: number;
  total_calories: number;
  average_accuracy: number;
}

export default function AchievementsPage() {
  const { user } = useAuth();
  const router = useRouter();
  const [achievements, setAchievements] = useState<Achievement[]>([]);
  const [unlockedIds, setUnlockedIds] = useState<Set<string>>(new Set());
  const [stats, setStats] = useState<Stats | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    if (!user) {
      router.push('/auth');
      return;
    }
    fetchData();
  }, [user]);

  const fetchData = async () => {
    const [achRes, userAchRes, statsRes] = await Promise.all([
      supabase.from('achievements').select('*').order('xp_reward', { ascending: true }),
      supabase.from('user_achievements').select('*, achievements(*)').eq('user_id', user!.id),
      supabase.from('gamification_stats').select('*').eq('user_id', user!.id).maybeSingle(),
    ]);

    if (achRes.data) setAchievements(achRes.data);
    if (userAchRes.data) setUnlockedIds(new Set(userAchRes.data.map((a) => a.achievement_id)));
    if (statsRes.data) setStats(statsRes.data);
    setIsLoading(false);
  };

  const getProgress = (achievement: Achievement): number => {
    if (!stats) return 0;
    let current = 0;
    switch (achievement.requirement_type) {
      case 'total_workouts': current = stats.total_workouts; break;
      case 'total_reps': current = stats.total_reps; break;
      case 'level': current = stats.level; break;
      case 'average_accuracy': current = stats.average_accuracy; break;
      case 'streak': current = 0; break;
      default: current = 0;
    }
    return Math.min(100, Math.round((current / achievement.requirement_value) * 100));
  };

  const getIcon = (iconName: string) => {
    switch (iconName) {
      case 'Dumbbell': return <Zap className="w-6 h-6" />;
      case 'Trophy': return <Trophy className="w-6 h-6" />;
      case 'Target': return <Star className="w-6 h-6" />;
      case 'Flame': return <Zap className="w-6 h-6" />;
      case 'Crown': return <Trophy className="w-6 h-6" />;
      case 'Heart': return <Star className="w-6 h-6" />;
      case 'Star': return <Star className="w-6 h-6" />;
      case 'Zap': return <Zap className="w-6 h-6" />;
      case 'Sun': return <Star className="w-6 h-6" />;
      case 'Eye': return <Star className="w-6 h-6" />;
      case 'Calendar': return <Trophy className="w-6 h-6" />;
      case 'Award': return <Trophy className="w-6 h-6" />;
      default: return <Star className="w-6 h-6" />;
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-950">
        <div className="animate-spin w-8 h-8 border-2 border-blue-500 border-t-transparent rounded-full" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-950 text-white">
      <div className="max-w-4xl mx-auto p-4 lg:p-6">
        <div className="flex items-center justify-between mb-6">
          <Button variant="ghost" onClick={() => router.push('/dashboard')} className="text-slate-400 hover:text-white">
            <ArrowLeft className="w-4 h-4 mr-2" />Back
          </Button>
          <h1 className="text-xl font-bold">Achievements</h1>
          <div className="w-20" />
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {achievements.map((achievement, i) => {
            const isUnlocked = unlockedIds.has(achievement.id);
            const progress = getProgress(achievement);

            return (
              <motion.div
                key={achievement.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: i * 0.03 }}
              >
                <Card className={`border transition-all ${
                  isUnlocked
                    ? 'bg-amber-500/5 border-amber-500/20'
                    : 'bg-slate-900/60 border-slate-800 opacity-70'
                }`}>
                  <CardContent className="p-4">
                    <div className="flex items-start gap-4">
                      <div className={`w-14 h-14 rounded-xl flex items-center justify-center flex-shrink-0 ${
                        isUnlocked ? 'bg-amber-500/20 text-amber-400' : 'bg-slate-800 text-slate-600'
                      }`}>
                        {isUnlocked ? <Unlock className="w-5 h-5" /> : <Lock className="w-5 h-5" />}
                        {getIcon(achievement.icon || 'Star')}
                      </div>
                      <div className="flex-1">
                        <div className="flex items-center justify-between mb-1">
                          <h3 className={`font-semibold ${isUnlocked ? 'text-white' : 'text-slate-500'}`}>
                            {achievement.name}
                          </h3>
                          <div className="flex items-center gap-1">
                            <Zap className="w-3 h-3 text-amber-400" />
                            <span className="text-xs text-amber-400">{achievement.xp_reward}</span>
                          </div>
                        </div>
                        <p className="text-sm text-slate-400 mb-3">{achievement.description}</p>
                        <div className="flex items-center gap-2">
                          <Progress value={isUnlocked ? 100 : progress} className="h-1.5 flex-1 bg-slate-800" />
                          <span className="text-xs text-slate-500 w-12 text-right">
                            {isUnlocked ? 'Done' : `${progress}%`}
                          </span>
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </motion.div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
