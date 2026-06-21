'use client';

import { useEffect, useState } from 'react';
import { useAuth } from '@/contexts/auth-context';
import { useRouter } from 'next/navigation';
import { supabase } from '@/lib/supabase';
import { motion } from 'framer-motion';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { toast } from 'sonner';
import { ArrowLeft, Trophy, Medal, Crown, Zap, Star, Flame, TrendingUp } from 'lucide-react';

interface LeaderboardEntry {
  id: string;
  user_id: string;
  full_name: string | null;
  xp: number;
  level: number;
  accuracy: number;
  streak: number;
  total_workouts: number;
  updated_at: string;
}

export default function LeaderboardPage() {
  const { user } = useAuth();
  const router = useRouter();
  const [entries, setEntries] = useState<LeaderboardEntry[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [sortBy, setSortBy] = useState<'xp' | 'accuracy' | 'streak' | 'workouts'>('xp');

  useEffect(() => {
    if (!user) {
      router.push('/auth');
      return;
    }
    fetchLeaderboard();
  }, [user]);

  const fetchLeaderboard = async () => {
    const { data, error } = await supabase
      .from('leaderboard')
      .select('*')
      .order('xp', { ascending: false })
      .limit(50);
    if (error) {
      toast.error('Failed to load leaderboard');
    } else {
      setEntries(data || []);
    }
    setIsLoading(false);
  };

  const sortedEntries = [...entries].sort((a, b) => {
    switch (sortBy) {
      case 'accuracy': return b.accuracy - a.accuracy;
      case 'streak': return b.streak - a.streak;
      case 'workouts': return b.total_workouts - a.total_workouts;
      default: return b.xp - a.xp;
    }
  });

  const getRankIcon = (rank: number) => {
    if (rank === 0) return <Crown className="w-5 h-5 text-amber-400" />;
    if (rank === 1) return <Medal className="w-5 h-5 text-slate-400" />;
    if (rank === 2) return <Medal className="w-5 h-5 text-amber-700" />;
    return <span className="text-sm font-bold text-slate-500 w-5 text-center">{rank + 1}</span>;
  };

  const getRankColor = (rank: number) => {
    if (rank === 0) return 'bg-amber-500/10 border-amber-500/30';
    if (rank === 1) return 'bg-slate-500/10 border-slate-500/30';
    if (rank === 2) return 'bg-amber-700/10 border-amber-700/30';
    return 'bg-slate-900/60 border-slate-800';
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
          <div className="flex items-center gap-2">
            <Trophy className="w-6 h-6 text-amber-400" />
            <h1 className="text-xl font-bold">Leaderboard</h1>
          </div>
          <div className="w-20" />
        </div>

        <div className="flex items-center gap-2 mb-6 overflow-x-auto pb-2">
          {([
            { key: 'xp', label: 'XP', icon: Zap },
            { key: 'accuracy', label: 'Accuracy', icon: TrendingUp },
            { key: 'streak', label: 'Streak', icon: Flame },
            { key: 'workouts', label: 'Workouts', icon: Star },
          ] as const).map(({ key, label, icon: Icon }) => (
            <button
              key={key}
              onClick={() => setSortBy(key)}
              className={`flex items-center gap-1.5 px-4 py-2 rounded-full text-sm font-medium transition-all whitespace-nowrap ${
                sortBy === key
                  ? 'bg-blue-500 text-white'
                  : 'bg-slate-800 text-slate-400 hover:bg-slate-700'
              }`}
            >
              <Icon className="w-4 h-4" />{label}
            </button>
          ))}
        </div>

        <div className="space-y-3">
          {sortedEntries.map((entry, i) => (
            <motion.div
              key={entry.id}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.03 }}
            >
              <Card className={`border ${getRankColor(i)} ${entry.user_id === user?.id ? 'ring-1 ring-blue-500/50' : ''}`}>
                <CardContent className="p-4">
                  <div className="flex items-center gap-4">
                    <div className="w-8 flex-shrink-0 flex justify-center">
                      {getRankIcon(i)}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2">
                        <h3 className="font-semibold text-white truncate">{entry.full_name || 'Anonymous'}</h3>
                        {entry.user_id === user?.id && (
                          <Badge className="bg-blue-500/10 text-blue-400 border-blue-500/20 text-xs">You</Badge>
                        )}
                      </div>
                      <div className="flex items-center gap-3 mt-1 text-xs text-slate-400">
                        <span className="flex items-center gap-1"><Zap className="w-3 h-3 text-amber-400" />{entry.xp} XP</span>
                        <span className="flex items-center gap-1"><Star className="w-3 h-3 text-blue-400" />Lv.{Math.floor(Math.sqrt((entry.xp || 0) / 100)) + 1}</span>
                        <span className="flex items-center gap-1"><TrendingUp className="w-3 h-3 text-emerald-400" />{entry.accuracy}%</span>
                        <span className="flex items-center gap-1"><Flame className="w-3 h-3 text-orange-400" />{entry.streak}d</span>
                        <span className="flex items-center gap-1"><Trophy className="w-3 h-3 text-purple-400" />{entry.total_workouts}</span>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </motion.div>
          ))}
        </div>

        {entries.length === 0 && (
          <div className="text-center py-12">
            <Trophy className="w-12 h-12 text-slate-600 mx-auto mb-4" />
            <p className="text-slate-400">No entries yet. Be the first to complete a workout!</p>
          </div>
        )}
      </div>
    </div>
  );
}
