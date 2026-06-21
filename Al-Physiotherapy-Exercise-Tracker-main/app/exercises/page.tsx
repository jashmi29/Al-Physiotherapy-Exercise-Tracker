'use client';

import { useEffect, useState } from 'react';
import { useAuth } from '@/contexts/auth-context';
import { useRouter } from 'next/navigation';
import { supabase } from '@/lib/supabase';
import { motion } from 'framer-motion';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { toast } from 'sonner';
import {
  ArrowLeft, Search, Activity, Dumbbell, Target, Heart, ArrowRight,
  Filter, Zap, Star, Clock
} from 'lucide-react';

interface Exercise {
  id: string;
  name: string;
  description: string;
  category: string;
  difficulty: string;
  target_body_parts: string[];
  default_sets: number;
  default_reps: number;
  default_duration: number;
  calories_per_minute: number;
  instructions: string[];
}

export default function ExercisesPage() {
  const { user } = useAuth();
  const router = useRouter();
  const [exercises, setExercises] = useState<Exercise[]>([]);
  const [filtered, setFiltered] = useState<Exercise[]>([]);
  const [search, setSearch] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('all');
  const [difficultyFilter, setDifficultyFilter] = useState('all');
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    if (!user) {
      router.push('/auth');
      return;
    }
    fetchExercises();
  }, [user]);

  useEffect(() => {
    let result = exercises;
    if (search) {
      result = result.filter(e =>
        e.name.toLowerCase().includes(search.toLowerCase()) ||
        e.description.toLowerCase().includes(search.toLowerCase()) ||
        e.target_body_parts?.some(p => p.toLowerCase().includes(search.toLowerCase()))
      );
    }
    if (categoryFilter !== 'all') {
      result = result.filter(e => e.category === categoryFilter);
    }
    if (difficultyFilter !== 'all') {
      result = result.filter(e => e.difficulty === difficultyFilter);
    }
    setFiltered(result);
  }, [search, categoryFilter, difficultyFilter, exercises]);

  const fetchExercises = async () => {
    const { data, error } = await supabase.from('exercises').select('*').order('name');
    if (error) {
      toast.error('Failed to load exercises');
    } else if (data) {
      setExercises(data);
      setFiltered(data);
    }
    setIsLoading(false);
  };

  const categories = ['all', ...Array.from(new Set(exercises.map(e => e.category)))];
  const difficulties = ['all', ...Array.from(new Set(exercises.map(e => e.difficulty)))];

  const getCategoryIcon = (category: string) => {
    switch (category) {
      case 'strength': return <Dumbbell className="w-4 h-4" />;
      case 'mobility': return <Activity className="w-4 h-4" />;
      case 'rehabilitation': return <Heart className="w-4 h-4" />;
      default: return <Target className="w-4 h-4" />;
    }
  };

  const getCategoryColor = (category: string) => {
    switch (category) {
      case 'strength': return 'bg-blue-500/10 text-blue-400 border-blue-500/20';
      case 'mobility': return 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20';
      case 'rehabilitation': return 'bg-amber-500/10 text-amber-400 border-amber-500/20';
      default: return 'bg-slate-500/10 text-slate-400 border-slate-500/20';
    }
  };

  const getDifficultyColor = (difficulty: string) => {
    switch (difficulty) {
      case 'beginner': return 'text-emerald-400';
      case 'intermediate': return 'text-amber-400';
      case 'advanced': return 'text-red-400';
      default: return 'text-slate-400';
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
      <div className="max-w-7xl mx-auto p-4 lg:p-6">
        <div className="flex items-center justify-between mb-6">
          <Button variant="ghost" onClick={() => router.push('/dashboard')} className="text-slate-400 hover:text-white">
            <ArrowLeft className="w-4 h-4 mr-2" />Back
          </Button>
          <h1 className="text-xl font-bold">Exercise Library</h1>
          <div className="w-20" />
        </div>

        <div className="flex items-center gap-3 mb-6">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
            <Input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search exercises..."
              className="pl-10 bg-slate-800 border-slate-700 text-white placeholder:text-slate-500"
            />
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-2 mb-6">
          <Filter className="w-4 h-4 text-slate-400 mr-1" />
          <span className="text-sm text-slate-400 mr-2">Category:</span>
          {categories.map(cat => (
            <button
              key={cat}
              onClick={() => setCategoryFilter(cat)}
              className={`px-3 py-1.5 rounded-full text-xs font-medium transition-all ${
                categoryFilter === cat
                  ? 'bg-blue-500 text-white'
                  : 'bg-slate-800 text-slate-400 hover:bg-slate-700'
              }`}
            >
              {cat === 'all' ? 'All' : cat}
            </button>
          ))}
        </div>

        <div className="flex flex-wrap items-center gap-2 mb-6">
          <span className="text-sm text-slate-400 mr-2">Difficulty:</span>
          {difficulties.map(diff => (
            <button
              key={diff}
              onClick={() => setDifficultyFilter(diff)}
              className={`px-3 py-1.5 rounded-full text-xs font-medium transition-all ${
                difficultyFilter === diff
                  ? 'bg-blue-500 text-white'
                  : 'bg-slate-800 text-slate-400 hover:bg-slate-700'
              }`}
            >
              {diff === 'all' ? 'All' : diff}
            </button>
          ))}
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {filtered.map((exercise, i) => (
            <motion.div
              key={exercise.id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.05 }}
            >
              <Card className="bg-slate-900/60 border-slate-800 hover:border-slate-700 transition-all cursor-pointer group" onClick={() => router.push(`/exercise/${exercise.id}`)}>
                <CardContent className="p-4">
                  <div className="flex items-start justify-between mb-3">
                    <div className="flex items-center gap-2">
                      <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${getCategoryColor(exercise.category).split(' ')[0]}`}>
                        {getCategoryIcon(exercise.category)}
                      </div>
                      <div>
                        <h3 className="font-semibold text-white group-hover:text-blue-400 transition-colors">{exercise.name}</h3>
                        <div className="flex items-center gap-2 mt-0.5">
                          <Badge variant="outline" className={`text-xs border-slate-700 ${getDifficultyColor(exercise.difficulty)}`}>
                            {exercise.difficulty}
                          </Badge>
                          <Badge variant="outline" className={`text-xs border-slate-700 ${getCategoryColor(exercise.category)}`}>
                            {exercise.category}
                          </Badge>
                        </div>
                      </div>
                    </div>
                    <ArrowRight className="w-4 h-4 text-slate-600 group-hover:text-blue-400 transition-colors" />
                  </div>
                  <p className="text-sm text-slate-400 line-clamp-2 mb-3">{exercise.description}</p>
                  <div className="flex items-center gap-4 text-xs text-slate-400">
                    <span className="flex items-center gap-1">
                      <Zap className="w-3 h-3" />{exercise.default_sets} sets
                    </span>
                    <span className="flex items-center gap-1">
                      <Star className="w-3 h-3" />{exercise.default_reps} reps
                    </span>
                    <span className="flex items-center gap-1">
                      <Clock className="w-3 h-3" />{exercise.default_duration}s
                    </span>
                  </div>
                  <div className="flex flex-wrap gap-1 mt-2">
                    {exercise.target_body_parts?.map((part, j) => (
                      <span key={j} className="text-xs bg-slate-800 text-slate-400 px-2 py-0.5 rounded">{part}</span>
                    ))}
                  </div>
                </CardContent>
              </Card>
            </motion.div>
          ))}
        </div>

        {filtered.length === 0 && (
          <div className="text-center py-12">
            <p className="text-slate-400">No exercises found matching your filters.</p>
            <Button onClick={() => { setSearch(''); setCategoryFilter('all'); setDifficultyFilter('all'); }} className="mt-4 bg-blue-500 hover:bg-blue-600 text-white">
              Clear Filters
            </Button>
          </div>
        )}
      </div>
    </div>
  );
}
