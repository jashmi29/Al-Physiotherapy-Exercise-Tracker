'use client';

import { useState } from 'react';
import { useAuth } from '@/contexts/auth-context';
import { useRouter } from 'next/navigation';
import { supabase } from '@/lib/supabase';
import { motion } from 'framer-motion';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Slider } from '@/components/ui/slider';
import { Badge } from '@/components/ui/badge';
import { toast } from 'sonner';
import {
  ArrowLeft, Activity, Calendar, Dumbbell, Target, Heart, Zap,
  Loader2, CheckCircle, AlertTriangle, Clock, Flame, Star
} from 'lucide-react';

interface PlanExercise {
  name: string;
  description: string;
  sets: number;
  reps: number;
  duration: number;
  safety_notes: string;
  instructions: string[];
}

interface GeneratedPlan {
  name: string;
  plan_type: string;
  exercises: PlanExercise[];
  daily_schedule: string;
  weekly_schedule: string;
  monthly_schedule: string;
  safety_notes: string[];
}

export default function PlannerPage() {
  const { user, profile } = useAuth();
  const router = useRouter();
  const [injuryType, setInjuryType] = useState('');
  const [painLevel, setPainLevel] = useState(3);
  const [recoveryStage, setRecoveryStage] = useState('');
  const [goals, setGoals] = useState('');
  const [planType, setPlanType] = useState('daily');
  const [isGenerating, setIsGenerating] = useState(false);
  const [plan, setPlan] = useState<GeneratedPlan | null>(null);

  const generatePlan = async () => {
    if (!user) {
      router.push('/auth');
      return;
    }
    setIsGenerating(true);

    try {
      const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
      const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

      const context = `User Profile: ${profile?.full_name || 'User'}, Age: ${profile?.age || 'N/A'}, Activity: ${profile?.activity_level || 'N/A'}, Medical: ${profile?.medical_conditions || 'None'}, Injury: ${profile?.injury_history || 'None'}.`;

      const response = await fetch(`${supabaseUrl}/functions/v1/ai-assistant`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${anonKey}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          messages: [
            {
              role: 'user',
              content: `Create a personalized physiotherapy rehabilitation plan. ${context}

Plan Type: ${planType}
Injury Type: ${injuryType}
Pain Level (1-10): ${painLevel}
Recovery Stage: ${recoveryStage}
Goals: ${goals}

Generate a ${planType} plan with specific exercises. For each exercise provide:
- Name
- Description
- Sets
- Reps
- Duration (seconds)
- Safety notes
- Instructions (step by step)

Also provide:
- Daily schedule overview
- Weekly schedule overview
- Monthly schedule overview
- General safety notes

Respond ONLY with a JSON object in this exact format:
{
  "name": "string",
  "plan_type": "string",
  "exercises": [
    {
      "name": "string",
      "description": "string",
      "sets": number,
      "reps": number,
      "duration": number,
      "safety_notes": "string",
      "instructions": ["string"]
    }
  ],
  "daily_schedule": "string",
  "weekly_schedule": "string",
  "monthly_schedule": "string",
  "safety_notes": ["string"]
}`,
            },
          ],
        }),
      });

      if (!response.ok) throw new Error('Failed to generate plan');

      const data = await response.json();
      let result: GeneratedPlan;

      try {
        const parsed = JSON.parse(data.message);
        result = {
          name: parsed.name || `${injuryType} Recovery Plan`,
          plan_type: parsed.plan_type || planType,
          exercises: Array.isArray(parsed.exercises) ? parsed.exercises : [],
          daily_schedule: parsed.daily_schedule || '',
          weekly_schedule: parsed.weekly_schedule || '',
          monthly_schedule: parsed.monthly_schedule || '',
          safety_notes: Array.isArray(parsed.safety_notes) ? parsed.safety_notes : [],
        };
      } catch {
        result = {
          name: `${injuryType} Recovery Plan`,
          plan_type: planType,
          exercises: [],
          daily_schedule: 'Consult your physiotherapist for a personalized schedule.',
          weekly_schedule: '',
          monthly_schedule: '',
          safety_notes: ['Always consult a healthcare professional before starting any exercise program.'],
        };
      }

      setPlan(result);

      // Save to database
      await supabase.from('exercise_plans').insert({
        user_id: user.id,
        name: result.name,
        injury_type: injuryType,
        pain_level: painLevel,
        recovery_stage: recoveryStage,
        plan_type: planType,
        exercises: result.exercises,
        is_active: true,
      });

      // Deactivate other plans
      await supabase.from('exercise_plans')
        .update({ is_active: false })
        .eq('user_id', user.id)
        .neq('name', result.name);

      toast.success('Plan generated and saved!');
    } catch (err) {
      toast.error('Failed to generate plan. Please try again.');
    } finally {
      setIsGenerating(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-950 text-white">
      <div className="max-w-4xl mx-auto p-4 lg:p-6">
        <div className="flex items-center justify-between mb-6">
          <Button variant="ghost" onClick={() => router.push('/dashboard')} className="text-slate-400 hover:text-white">
            <ArrowLeft className="w-4 h-4 mr-2" />Back
          </Button>
          <h1 className="text-xl font-bold">AI Rehabilitation Planner</h1>
          <div className="w-20" />
        </div>

        {!plan && (
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
            <Card className="bg-slate-900/60 border-slate-800 mb-6">
              <CardContent className="p-6">
                <div className="flex items-center gap-3 mb-6">
                  <div className="w-12 h-12 rounded-xl bg-emerald-500/10 flex items-center justify-center">
                    <Activity className="w-6 h-6 text-emerald-400" />
                  </div>
                  <div>
                    <h2 className="font-semibold text-white">Create Your Plan</h2>
                    <p className="text-sm text-slate-400">Tell us about your condition and goals</p>
                  </div>
                </div>

                <div className="space-y-6">
                  <div>
                    <label className="text-sm text-slate-400 mb-2 block">Injury Type</label>
                    <Input
                      value={injuryType}
                      onChange={(e) => setInjuryType(e.target.value)}
                      placeholder="e.g., Knee ACL tear, Shoulder impingement, Lower back pain"
                      className="bg-slate-800 border-slate-700 text-white placeholder:text-slate-500"
                    />
                  </div>

                  <div>
                    <label className="text-sm text-slate-400 mb-2 block">Pain Level: {painLevel}/10</label>
                    <Slider
                      value={[painLevel]}
                      onValueChange={(v) => setPainLevel(v[0])}
                      min={1}
                      max={10}
                      step={1}
                      className="py-2"
                    />
                    <div className="flex justify-between text-xs text-slate-500 mt-1">
                      <span>Mild</span>
                      <span>Moderate</span>
                      <span>Severe</span>
                    </div>
                  </div>

                  <div>
                    <label className="text-sm text-slate-400 mb-2 block">Recovery Stage</label>
                    <div className="flex flex-wrap gap-2">
                      {['Acute', 'Sub-acute', 'Recovery', 'Maintenance', 'Prevention'].map((stage) => (
                        <button
                          key={stage}
                          onClick={() => setRecoveryStage(stage)}
                          className={`px-3 py-1.5 rounded-full text-xs font-medium transition-all ${
                            recoveryStage === stage
                              ? 'bg-blue-500 text-white'
                              : 'bg-slate-800 text-slate-400 hover:bg-slate-700'
                          }`}
                        >
                          {stage}
                        </button>
                      ))}
                    </div>
                  </div>

                  <div>
                    <label className="text-sm text-slate-400 mb-2 block">Your Goals</label>
                    <Input
                      value={goals}
                      onChange={(e) => setGoals(e.target.value)}
                      placeholder="e.g., Return to running, Reduce pain, Improve mobility"
                      className="bg-slate-800 border-slate-700 text-white placeholder:text-slate-500"
                    />
                  </div>

                  <div>
                    <label className="text-sm text-slate-400 mb-2 block">Plan Type</label>
                    <div className="flex gap-2">
                      {['daily', 'weekly', 'monthly'].map((type) => (
                        <button
                          key={type}
                          onClick={() => setPlanType(type)}
                          className={`px-4 py-2 rounded-lg text-sm font-medium transition-all flex-1 ${
                            planType === type
                              ? 'bg-blue-500 text-white'
                              : 'bg-slate-800 text-slate-400 hover:bg-slate-700'
                          }`}
                        >
                          <Calendar className="w-4 h-4 mx-auto mb-1" />
                          {type.charAt(0).toUpperCase() + type.slice(1)}
                        </button>
                      ))}
                    </div>
                  </div>

                  <Button
                    onClick={generatePlan}
                    disabled={isGenerating || !injuryType.trim()}
                    className="w-full bg-blue-500 hover:bg-blue-600 text-white"
                  >
                    {isGenerating ? (
                      <><Loader2 className="w-4 h-4 mr-2 animate-spin" />Generating Plan...</>
                    ) : (
                      <><Zap className="w-4 h-4 mr-2" />Generate AI Plan</>
                    )}
                  </Button>
                </div>
              </CardContent>
            </Card>
          </motion.div>
        )}

        {plan && (
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="space-y-6">
            <div className="flex items-center justify-between">
              <h2 className="text-xl font-bold text-white">{plan.name}</h2>
              <Button variant="outline" size="sm" onClick={() => setPlan(null)} className="border-slate-700 text-white">
                <ArrowLeft className="w-4 h-4 mr-2" />Create New
              </Button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
              <Card className="bg-slate-900/60 border-slate-800">
                <CardContent className="p-4 text-center">
                  <Clock className="w-5 h-5 text-blue-400 mx-auto mb-2" />
                  <p className="text-sm text-slate-400">Daily</p>
                  <p className="text-sm text-white mt-1">{plan.daily_schedule}</p>
                </CardContent>
              </Card>
              <Card className="bg-slate-900/60 border-slate-800">
                <CardContent className="p-4 text-center">
                  <Calendar className="w-5 h-5 text-emerald-400 mx-auto mb-2" />
                  <p className="text-sm text-slate-400">Weekly</p>
                  <p className="text-sm text-white mt-1">{plan.weekly_schedule}</p>
                </CardContent>
              </Card>
              <Card className="bg-slate-900/60 border-slate-800">
                <CardContent className="p-4 text-center">
                  <Target className="w-5 h-5 text-amber-400 mx-auto mb-2" />
                  <p className="text-sm text-slate-400">Monthly</p>
                  <p className="text-sm text-white mt-1">{plan.monthly_schedule}</p>
                </CardContent>
              </Card>
            </div>

            <div>
              <h3 className="font-semibold text-white mb-3 flex items-center gap-2">
                <Dumbbell className="w-5 h-5 text-blue-400" />Exercises
              </h3>
              <div className="space-y-3">
                {plan.exercises.map((ex, i) => (
                  <Card key={i} className="bg-slate-900/60 border-slate-800">
                    <CardContent className="p-4">
                      <div className="flex items-start justify-between mb-2">
                        <div>
                          <h4 className="font-semibold text-white">{ex.name}</h4>
                          <p className="text-sm text-slate-400">{ex.description}</p>
                        </div>
                        <div className="flex items-center gap-2 text-xs">
                          <Badge className="bg-blue-500/10 text-blue-400 border-blue-500/20">{ex.sets}x{ex.reps}</Badge>
                          <Badge className="bg-slate-700 text-slate-300">{ex.duration}s</Badge>
                        </div>
                      </div>
                      <div className="mt-3 space-y-1">
                        {ex.instructions?.map((inst, j) => (
                          <div key={j} className="flex items-start gap-2 text-sm text-slate-300">
                            <span className="w-5 h-5 rounded-full bg-blue-500/20 text-blue-400 flex items-center justify-center text-xs flex-shrink-0 mt-0.5">{j + 1}</span>
                            {inst}
                          </div>
                        ))}
                      </div>
                      <div className="mt-3 p-2 bg-amber-500/5 rounded-lg border border-amber-500/10">
                        <p className="text-xs text-amber-400"><AlertTriangle className="w-3 h-3 inline mr-1" />{ex.safety_notes}</p>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            </div>

            <Card className="bg-red-500/5 border-red-500/10">
              <CardContent className="p-4">
                <h3 className="font-semibold text-red-400 mb-2 flex items-center gap-2">
                  <AlertTriangle className="w-4 h-4" />Safety Notes
                </h3>
                <div className="space-y-2">
                  {plan.safety_notes.map((note, i) => (
                    <div key={i} className="flex items-start gap-2 text-sm text-red-300">
                      <CheckCircle className="w-4 h-4 mt-0.5 flex-shrink-0" />
                      {note}
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>

            <div className="flex gap-3">
              <Button onClick={() => router.push('/exercises')} className="flex-1 bg-blue-500 hover:bg-blue-600 text-white">
                <Heart className="w-4 h-4 mr-2" />Start Exercises
              </Button>
              <Button onClick={() => router.push('/dashboard')} variant="outline" className="flex-1 border-slate-700 text-white">
                <Flame className="w-4 h-4 mr-2" />Dashboard
              </Button>
            </div>
          </motion.div>
        )}
      </div>
    </div>
  );
}
