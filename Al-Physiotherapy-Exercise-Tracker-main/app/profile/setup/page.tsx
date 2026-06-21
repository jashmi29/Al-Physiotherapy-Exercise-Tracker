'use client';

import { useState } from 'react';
import { useAuth } from '@/contexts/auth-context';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Slider } from '@/components/ui/slider';
import { motion, AnimatePresence } from 'framer-motion';
import { User, ArrowRight, ArrowLeft, Check, Heart, Ruler, Weight, Target } from 'lucide-react';
import { toast } from 'sonner';
import { supabase } from '@/lib/supabase';

export default function ProfileSetup() {
  const { user, refreshProfile } = useAuth();
  const router = useRouter();
  const [step, setStep] = useState(0);
  const [isLoading, setIsLoading] = useState(false);
  const [form, setForm] = useState({
    fullName: '',
    age: '',
    gender: '',
    height: '',
    weight: '',
    activityLevel: '',
    injuryHistory: '',
    medicalConditions: '',
    rehabilitationGoals: '',
    dailyExerciseTime: 30,
  });

  const steps = [
    { title: 'Basic Info', icon: User },
    { title: 'Body Stats', icon: Ruler },
    { title: 'Health', icon: Heart },
    { title: 'Goals', icon: Target },
  ];

  const handleNext = () => {
    if (step < steps.length - 1) setStep(step + 1);
  };
  const handlePrev = () => {
    if (step > 0) setStep(step - 1);
  };

  const handleSubmit = async () => {
    if (!user) return;
    setIsLoading(true);
    const { error } = await supabase.from('profiles').upsert({
      id: user.id,
      full_name: form.fullName || user.user_metadata?.full_name || '',
      age: form.age ? parseInt(form.age) : null,
      gender: form.gender || null,
      height: form.height ? parseFloat(form.height) : null,
      weight: form.weight ? parseFloat(form.weight) : null,
      activity_level: form.activityLevel || null,
      injury_history: form.injuryHistory || null,
      medical_conditions: form.medicalConditions || null,
      rehabilitation_goals: form.rehabilitationGoals || null,
      daily_exercise_time: form.dailyExerciseTime,
      updated_at: new Date().toISOString(),
    });
    if (error) {
      toast.error('Failed to save profile');
    } else {
      await refreshProfile();
      toast.success('Profile saved!');
      router.push('/dashboard');
    }
    setIsLoading(false);
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-slate-950 p-4">
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top,_rgba(59,130,246,0.08),_transparent_60%)]" />
      
      <motion.div className="relative z-10 w-full max-w-lg" initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
        <div className="mb-8">
          <div className="flex items-center justify-between mb-4">
            {steps.map((s, i) => (
              <div key={i} className={`flex flex-col items-center ${i === step ? 'text-blue-400' : i < step ? 'text-emerald-400' : 'text-slate-600'}`}>
                <div className={`w-10 h-10 rounded-full flex items-center justify-center border-2 mb-2 ${
                  i === step ? 'border-blue-400 bg-blue-500/20' : i < step ? 'border-emerald-400 bg-emerald-500/20' : 'border-slate-700 bg-slate-800'
                }`}>
                  {i < step ? <Check className="w-4 h-4" /> : <s.icon className="w-4 h-4" />}
                </div>
                <span className="text-xs font-medium">{s.title}</span>
              </div>
            ))}
          </div>
          <div className="w-full bg-slate-800 h-1 rounded-full overflow-hidden">
            <div className="bg-blue-500 h-full transition-all duration-500" style={{ width: `${((step + 1) / steps.length) * 100}%` }} />
          </div>
        </div>

        <Card className="bg-slate-900/80 border-slate-800 backdrop-blur-xl">
          <CardHeader>
            <CardTitle className="text-white">{steps[step].title}</CardTitle>
            <CardDescription className="text-slate-400">Complete your profile to get personalized recommendations</CardDescription>
          </CardHeader>
          <CardContent>
            <AnimatePresence mode="wait">
              {step === 0 && (
                <motion.div key="basic" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }} className="space-y-4">
                  <div className="space-y-2">
                    <Label className="text-slate-300">Full Name</Label>
                    <Input value={form.fullName} onChange={(e) => setForm({ ...form, fullName: e.target.value })} className="bg-slate-800 border-slate-700 text-white" placeholder="Your name" />
                  </div>
                  <div className="space-y-2">
                    <Label className="text-slate-300">Age</Label>
                    <Input type="number" value={form.age} onChange={(e) => setForm({ ...form, age: e.target.value })} className="bg-slate-800 border-slate-700 text-white" placeholder="25" />
                  </div>
                  <div className="space-y-2">
                    <Label className="text-slate-300">Gender</Label>
                    <Select value={form.gender} onValueChange={(v) => setForm({ ...form, gender: v })}>
                      <SelectTrigger className="bg-slate-800 border-slate-700 text-white"><SelectValue placeholder="Select" /></SelectTrigger>
                      <SelectContent className="bg-slate-800 border-slate-700">
                        <SelectItem value="male">Male</SelectItem>
                        <SelectItem value="female">Female</SelectItem>
                        <SelectItem value="other">Other</SelectItem>
                        <SelectItem value="prefer_not_to_say">Prefer not to say</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </motion.div>
              )}
              
              {step === 1 && (
                <motion.div key="stats" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }} className="space-y-4">
                  <div className="space-y-2">
                    <Label className="text-slate-300"><Ruler className="w-3 h-3 inline mr-2" />Height (cm)</Label>
                    <Input type="number" value={form.height} onChange={(e) => setForm({ ...form, height: e.target.value })} className="bg-slate-800 border-slate-700 text-white" placeholder="175" />
                  </div>
                  <div className="space-y-2">
                    <Label className="text-slate-300"><Weight className="w-3 h-3 inline mr-2" />Weight (kg)</Label>
                    <Input type="number" value={form.weight} onChange={(e) => setForm({ ...form, weight: e.target.value })} className="bg-slate-800 border-slate-700 text-white" placeholder="70" />
                  </div>
                  <div className="space-y-2">
                    <Label className="text-slate-300">Activity Level</Label>
                    <Select value={form.activityLevel} onValueChange={(v) => setForm({ ...form, activityLevel: v })}>
                      <SelectTrigger className="bg-slate-800 border-slate-700 text-white"><SelectValue placeholder="Select" /></SelectTrigger>
                      <SelectContent className="bg-slate-800 border-slate-700">
                        <SelectItem value="sedentary">Sedentary</SelectItem>
                        <SelectItem value="lightly_active">Lightly Active</SelectItem>
                        <SelectItem value="moderately_active">Moderately Active</SelectItem>
                        <SelectItem value="very_active">Very Active</SelectItem>
                        <SelectItem value="athlete">Athlete</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </motion.div>
              )}
              
              {step === 2 && (
                <motion.div key="health" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }} className="space-y-4">
                  <div className="space-y-2">
                    <Label className="text-slate-300">Injury History</Label>
                    <Textarea value={form.injuryHistory} onChange={(e) => setForm({ ...form, injuryHistory: e.target.value })} className="bg-slate-800 border-slate-700 text-white min-h-[80px]" placeholder="Describe any past injuries or surgeries..." />
                  </div>
                  <div className="space-y-2">
                    <Label className="text-slate-300">Medical Conditions</Label>
                    <Textarea value={form.medicalConditions} onChange={(e) => setForm({ ...form, medicalConditions: e.target.value })} className="bg-slate-800 border-slate-700 text-white min-h-[80px]" placeholder="Any medical conditions or restrictions..." />
                  </div>
                </motion.div>
              )}
              
              {step === 3 && (
                <motion.div key="goals" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }} className="space-y-4">
                  <div className="space-y-2">
                    <Label className="text-slate-300">Rehabilitation Goals</Label>
                    <Textarea value={form.rehabilitationGoals} onChange={(e) => setForm({ ...form, rehabilitationGoals: e.target.value })} className="bg-slate-800 border-slate-700 text-white min-h-[80px]" placeholder="What do you want to achieve?" />
                  </div>
                  <div className="space-y-2">
                    <Label className="text-slate-300">Daily Exercise Time: {form.dailyExerciseTime} min</Label>
                    <Slider value={[form.dailyExerciseTime]} onValueChange={(v) => setForm({ ...form, dailyExerciseTime: v[0] })} min={10} max={120} step={5} className="py-2" />
                  </div>
                </motion.div>
              )}
            </AnimatePresence>

            <div className="flex items-center justify-between mt-8 pt-4 border-t border-slate-800">
              <Button variant="outline" onClick={handlePrev} disabled={step === 0} className="border-slate-700 text-slate-300 hover:bg-slate-800">
                <ArrowLeft className="w-4 h-4 mr-2" />Back
              </Button>
              {step < steps.length - 1 ? (
                <Button onClick={handleNext} className="bg-blue-500 hover:bg-blue-600 text-white">
                  Next<ArrowRight className="w-4 h-4 ml-2" />
                </Button>
              ) : (
                <Button onClick={handleSubmit} disabled={isLoading} className="bg-emerald-500 hover:bg-emerald-600 text-white">
                  {isLoading ? 'Saving...' : <><span>Complete</span><Check className="w-4 h-4 ml-2" /></>}
                </Button>
              )}
            </div>
          </CardContent>
        </Card>
      </motion.div>
    </div>
  );
}
