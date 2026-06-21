'use client';

import { useEffect, useRef, useState, useCallback } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { useAuth } from '@/contexts/auth-context';
import { supabase } from '@/lib/supabase';
import { motion, AnimatePresence } from 'framer-motion';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { Badge } from '@/components/ui/badge';
import { toast } from 'sonner';
import {
  calculateAngle,
  analyzeSquat,
  analyzeArmRaise,
  analyzeLunge,
  analyzeKneeExtension,
  analyzeHeelSlide,
  analyzeShoulderRotation,
  analyzeLegRaise,
  analyzeGluteBridge,
  analyzeWallPushup,
  analyzeAnklePumps,
  analyzePosture,
} from '@/lib/posture-analysis';
import { calculateCalories } from '@/lib/utils';
import {
  Play,
  Pause,
  Square,
  RotateCcw,
  Volume2,
  VolumeX,
  Camera,
  CameraOff,
  ArrowLeft,
  Trophy,
  Star,
  Zap,
  CheckCircle,
  AlertTriangle,
  Flame,
} from 'lucide-react';

interface Exercise {
  id: string;
  name: string;
  description: string;
  category: string;
  difficulty: string;
  default_sets: number;
  default_reps: number;
  default_duration: number;
  safety_notes: string;
  instructions: string[];
  calories_per_minute: number;
  target_body_parts: string[];
}

interface PoseLandmark {
  x: number;
  y: number;
  z: number;
  visibility?: number;
}

const EXERCISE_ANALYZERS: Record<string, Function> = {
  'Squats': analyzeSquat,
  'Arm Raises': analyzeArmRaise,
  'Leg Raises': analyzeLegRaise,
  'Lunges': analyzeLunge,
  'Knee Extensions': analyzeKneeExtension,
  'Heel Slides': analyzeHeelSlide,
  'Shoulder Rotations': analyzeShoulderRotation,
  'Ankle Pumps': analyzeAnklePumps,
  'Physiotherapy Glute Bridges': analyzeGluteBridge,
  'Rehabilitation Wall Push-ups': analyzeWallPushup,
};

export default function ExercisePage() {
  const params = useParams();
  const router = useRouter();
  const { user } = useAuth();
  const [exercise, setExercise] = useState<Exercise | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isActive, setIsActive] = useState(false);
  const [isPaused, setIsPaused] = useState(false);
  const [reps, setReps] = useState(0);
  const [sets, setSets] = useState(0);
  const [targetSets, setTargetSets] = useState(3);
  const [targetReps, setTargetReps] = useState(10);
  const [postureAccuracy, setPostureAccuracy] = useState(100);
  const [exerciseAccuracy, setExerciseAccuracy] = useState(100);
  const [feedback, setFeedback] = useState<string[]>(['Stand ready to begin']);
  const [currentFeedback, setCurrentFeedback] = useState('Stand ready to begin');
  const [duration, setDuration] = useState(0);
  const [calories, setCalories] = useState(0);
  const [movementQuality, setMovementQuality] = useState('Good');
  const [voiceEnabled, setVoiceEnabled] = useState(true);
  const [cameraEnabled, setCameraEnabled] = useState(true);
  const [sessionComplete, setSessionComplete] = useState(false);
  const [xpEarned, setXpEarned] = useState(0);
  const [isSaving, setIsSaving] = useState(false);
  const [poseLandmarks, setPoseLandmarks] = useState<PoseLandmark[]>([]);
  const [allFeedback, setAllFeedback] = useState<string[]>([]);

  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const poseRef = useRef<any>(null);
  const timerRef = useRef<NodeJS.Timeout | null>(null);
  const cameraRef = useRef<any>(null);
  const lastPhaseRef = useRef<string>('neutral');
  const repCountRef = useRef(0);
  const setCountRef = useRef(0);
  const durationRef = useRef(0);
  const accuracyHistoryRef = useRef<number[]>([]);
  const feedbackHistoryRef = useRef<string[]>([]);
  const synthRef = useRef<SpeechSynthesis | null>(null);
  const lastSpokenRef = useRef<string>('');
  const lastSpokenTimeRef = useRef(0);

  const exerciseId = params.id as string;

  useEffect(() => {
    if (typeof window !== 'undefined') {
      synthRef.current = window.speechSynthesis;
    }
  }, []);

  useEffect(() => {
    if (!user) {
      router.push('/auth');
      return;
    }
    fetchExercise();
  }, [user, exerciseId]);

  useEffect(() => {
    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
      if (cameraRef.current) cameraRef.current.stop();
    };
  }, []);

  const fetchExercise = async () => {
    const { data } = await supabase.from('exercises').select('*').eq('id', exerciseId).maybeSingle();
    if (data) {
      setExercise(data);
      setTargetSets(data.default_sets || 3);
      setTargetReps(data.default_reps || 10);
    }
    setIsLoading(false);
  };

  const speakFeedback = useCallback((text: string) => {
    if (!voiceEnabled || !synthRef.current || text === lastSpokenRef.current) return;
    const now = Date.now();
    if (now - lastSpokenTimeRef.current < 3000) return;
    lastSpokenRef.current = text;
    lastSpokenTimeRef.current = now;
    const utterance = new SpeechSynthesisUtterance(text);
    utterance.rate = 1.2;
    utterance.pitch = 1;
    synthRef.current.speak(utterance);
  }, [voiceEnabled]);

  const initializePose = async () => {
    try {
      const { Pose } = await import('@mediapipe/pose');
      const { drawConnectors, drawLandmarks } = await import('@mediapipe/drawing_utils');
      const { POSE_CONNECTIONS } = await import('@mediapipe/pose');

      const pose = new Pose({
        locateFile: (file) => `https://cdn.jsdelivr.net/npm/@mediapipe/pose/${file}`,
      });

      pose.setOptions({
        modelComplexity: 1,
        smoothLandmarks: true,
        enableSegmentation: false,
        smoothSegmentation: false,
        minDetectionConfidence: 0.5,
        minTrackingConfidence: 0.5,
      });

      pose.onResults((results: any) => {
        if (!canvasRef.current || !videoRef.current) return;
        const canvas = canvasRef.current;
        const ctx = canvas.getContext('2d')!;
        const video = videoRef.current;

        canvas.width = video.videoWidth || 640;
        canvas.height = video.videoHeight || 480;
        ctx.save();
        ctx.clearRect(0, 0, canvas.width, canvas.height);
        ctx.drawImage(results.image, 0, 0, canvas.width, canvas.height);

        if (results.poseLandmarks) {
          drawConnectors(ctx, results.poseLandmarks, POSE_CONNECTIONS, {
            color: '#3B82F6',
            lineWidth: 3,
          });
          drawLandmarks(ctx, results.poseLandmarks, {
            color: '#10B981',
            lineWidth: 2,
            radius: 5,
          });
          setPoseLandmarks(results.poseLandmarks);
        }
        ctx.restore();
      });

      poseRef.current = pose;
    } catch (err) {
      toast.error('Failed to initialize pose detection');
    }
  };

  const startCamera = async () => {
    if (!videoRef.current || !poseRef.current) return;
    try {
      const { Camera } = await import('@mediapipe/camera_utils');
      const camera = new Camera(videoRef.current, {
        onFrame: async () => {
          await poseRef.current?.send({ image: videoRef.current! });
        },
        width: 640,
        height: 480,
      });
      await camera.start();
      cameraRef.current = camera;
    } catch (err) {
      toast.error('Failed to access webcam');
    }
  };

  const stopCamera = () => {
    if (cameraRef.current) {
      cameraRef.current.stop();
      cameraRef.current = null;
    }
    if (videoRef.current?.srcObject) {
      const tracks = (videoRef.current.srcObject as MediaStream).getTracks();
      tracks.forEach((track) => track.stop());
    }
  };

  const detectRep = useCallback((landmarks: PoseLandmark[], exerciseName: string) => {
    const analyzer = EXERCISE_ANALYZERS[exerciseName];
    if (!analyzer) return { repDetected: false, accuracy: 100, feedback: ['Continue'] };

    const result = analyzer(landmarks);
    const avgAccuracy = result.accuracy;

    let repDetected = false;
    let phase = 'neutral';

    switch (exerciseName) {
      case 'Squats': {
        const kneeAngle = (result.angles.leftKneeAngle + result.angles.rightKneeAngle) / 2;
        if (kneeAngle < 110) phase = 'bottom';
        else if (kneeAngle > 160) phase = 'top';
        else phase = 'transition';
        break;
      }
      case 'Arm Raises': {
        const shoulderAngle = (result.angles.leftShoulderAngle + result.angles.rightShoulderAngle) / 2;
        if (shoulderAngle > 160) phase = 'top';
        else if (shoulderAngle < 20) phase = 'bottom';
        else phase = 'transition';
        break;
      }
      case 'Lunges': {
        const kneeAngle = (result.angles.leftKneeAngle + result.angles.rightKneeAngle) / 2;
        if (kneeAngle < 100) phase = 'bottom';
        else if (kneeAngle > 160) phase = 'top';
        else phase = 'transition';
        break;
      }
      case 'Knee Extensions': {
        const kneeAngle = (result.angles.leftKneeAngle + result.angles.rightKneeAngle) / 2;
        if (kneeAngle > 160) phase = 'extended';
        else if (kneeAngle < 90) phase = 'bent';
        else phase = 'transition';
        break;
      }
      case 'Leg Raises': {
        const hipAngle = (result.angles.leftHipAngle + result.angles.rightHipAngle) / 2;
        if (hipAngle > 70) phase = 'raised';
        else if (hipAngle < 45) phase = 'lowered';
        else phase = 'transition';
        break;
      }
      case 'Shoulder Rotations': {
        const shoulderAngle = (result.angles.leftShoulderAngle + result.angles.rightShoulderAngle) / 2;
        if (shoulderAngle > 60) phase = 'rotated';
        else if (shoulderAngle < 20) phase = 'neutral';
        else phase = 'transition';
        break;
      }
      case 'Physiotherapy Glute Bridges': {
        const hipAngle = (result.angles.leftHipAngle + result.angles.rightHipAngle) / 2;
        if (hipAngle < 150) phase = 'raised';
        else if (hipAngle > 170) phase = 'lowered';
        else phase = 'transition';
        break;
      }
      case 'Rehabilitation Wall Push-ups': {
        const elbowAngle = (result.angles.leftElbowAngle + result.angles.rightElbowAngle) / 2;
        if (elbowAngle < 90) phase = 'bottom';
        else if (elbowAngle > 160) phase = 'top';
        else phase = 'transition';
        break;
      }
      case 'Ankle Pumps': {
        const ankleAngle = (result.angles.leftAnkleAngle + result.angles.rightAnkleAngle) / 2;
        if (ankleAngle > 140) phase = 'flexed';
        else if (ankleAngle < 30) phase = 'pointed';
        else phase = 'transition';
        break;
      }
      default:
        phase = 'neutral';
    }

    if (lastPhaseRef.current === 'bottom' && phase === 'top') {
      repDetected = true;
    }
    if (lastPhaseRef.current === 'bent' && phase === 'extended') {
      repDetected = true;
    }
    if (lastPhaseRef.current === 'lowered' && phase === 'raised') {
      repDetected = true;
    }
    if (lastPhaseRef.current === 'neutral' && phase === 'rotated') {
      repDetected = true;
    }
    if (lastPhaseRef.current === 'pointed' && phase === 'flexed') {
      repDetected = true;
    }

    if (phase !== 'transition') {
      lastPhaseRef.current = phase;
    }

    return { repDetected, accuracy: avgAccuracy, feedback: result.feedback };
  }, []);

  useEffect(() => {
    if (!isActive || isPaused || poseLandmarks.length === 0 || !exercise) return;

    const interval = setInterval(() => {
      const result = detectRep(poseLandmarks, exercise.name);
      setPostureAccuracy(result.accuracy);
      setExerciseAccuracy(result.accuracy);
      setFeedback(result.feedback);
      setCurrentFeedback(result.feedback[0]);
      accuracyHistoryRef.current.push(result.accuracy);
      feedbackHistoryRef.current.push(...result.feedback);

      if (result.accuracy > 75) {
        setMovementQuality('Excellent');
      } else if (result.accuracy > 50) {
        setMovementQuality('Fair');
      } else {
        setMovementQuality('Needs Improvement');
      }

      if (result.repDetected && result.accuracy > 60) {
        repCountRef.current += 1;
        setReps(repCountRef.current);
        speakFeedback('Good rep!');

        if (repCountRef.current >= targetReps) {
          setCountRef.current += 1;
          setSets(setCountRef.current);
          repCountRef.current = 0;
          setReps(0);
          speakFeedback(`Set ${setCountRef.current} complete!`);

          if (setCountRef.current >= targetSets) {
            completeSession();
          }
        }
      }

      if (result.accuracy < 60 && result.feedback.length > 0) {
        speakFeedback(result.feedback[0]);
      }
    }, 500);

    return () => clearInterval(interval);
  }, [isActive, isPaused, poseLandmarks, exercise, targetReps, targetSets, detectRep, speakFeedback]);

  useEffect(() => {
    if (isActive && !isPaused) {
      timerRef.current = setInterval(() => {
        durationRef.current += 1;
        setDuration(durationRef.current);
        if (exercise) {
          setCalories(calculateCalories(exercise.name, durationRef.current / 60, 70));
        }
      }, 1000);
    } else {
      if (timerRef.current) clearInterval(timerRef.current);
    }
    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, [isActive, isPaused, exercise]);

  const startExercise = async () => {
    await initializePose();
    await startCamera();
    setIsActive(true);
    setIsPaused(false);
    setReps(0);
    setSets(0);
    setDuration(0);
    setCalories(0);
    repCountRef.current = 0;
    setCountRef.current = 0;
    durationRef.current = 0;
    accuracyHistoryRef.current = [];
    feedbackHistoryRef.current = [];
    lastPhaseRef.current = 'neutral';
  };

  const pauseExercise = () => {
    setIsPaused(!isPaused);
  };

  const stopExercise = () => {
    setIsActive(false);
    setIsPaused(false);
    if (timerRef.current) clearInterval(timerRef.current);
    stopCamera();
    if (durationRef.current > 0) {
      completeSession();
    }
  };

  const completeSession = async () => {
    setIsActive(false);
    setIsPaused(false);
    setSessionComplete(true);
    if (timerRef.current) clearInterval(timerRef.current);
    stopCamera();

    const avgAccuracy = accuracyHistoryRef.current.length > 0
      ? Math.round(accuracyHistoryRef.current.reduce((a, b) => a + b, 0) / accuracyHistoryRef.current.length)
      : 80;

    const totalReps = sets * targetReps + reps;
    const xp = Math.round((totalReps * 5) + (avgAccuracy * 0.5) + (sets * 20) + (durationRef.current / 10));
    setXpEarned(xp);
    setPostureAccuracy(avgAccuracy);
    setExerciseAccuracy(avgAccuracy);
    setAllFeedback(Array.from(new Set(feedbackHistoryRef.current)));

    await saveSession(totalReps, avgAccuracy, xp);
  };

  const saveSession = async (totalReps: number, avgAccuracy: number, xp: number) => {
    if (!user || !exercise) return;
    setIsSaving(true);

    try {
      const { error: sessionError } = await supabase.from('workout_sessions').insert({
        user_id: user.id,
        exercise_id: exercise.id,
        reps_completed: totalReps,
        sets_completed: sets,
        duration_seconds: durationRef.current,
        posture_accuracy: avgAccuracy,
        exercise_accuracy: avgAccuracy,
        movement_quality: movementQuality,
        calories_burned: calories,
        feedback: allFeedback,
        completed_at: new Date().toISOString(),
      });

      if (sessionError) throw sessionError;

      const { data: stats } = await supabase.from('gamification_stats').select('*').eq('user_id', user.id).maybeSingle();
      if (stats) {
        const newTotalWorkouts = stats.total_workouts + 1;
        const newTotalReps = stats.total_reps + totalReps;
        const newTotalCalories = stats.total_calories + calories;
        const newXP = stats.xp + xp;
        const newAvgAccuracy = Math.round((stats.average_accuracy * stats.total_workouts + avgAccuracy) / newTotalWorkouts);

        await supabase.from('gamification_stats').update({
          xp: newXP,
          total_workouts: newTotalWorkouts,
          total_reps: newTotalReps,
          total_calories: newTotalCalories,
          average_accuracy: newAvgAccuracy,
          updated_at: new Date().toISOString(),
        }).eq('user_id', user.id);

        await supabase.from('leaderboard').update({
          xp: newXP,
          total_workouts: newTotalWorkouts,
          accuracy: newAvgAccuracy,
          updated_at: new Date().toISOString(),
        }).eq('user_id', user.id);
      }

      const { data: streakData } = await supabase.from('daily_streaks').select('*').eq('user_id', user.id).maybeSingle();
      if (streakData) {
        const today = new Date().toISOString().split('T')[0];
        const lastDate = streakData.last_exercise_date;
        const yesterday = new Date();
        yesterday.setDate(yesterday.getDate() - 1);
        const yesterdayStr = yesterday.toISOString().split('T')[0];

        let newStreak = streakData.current_streak;
        if (lastDate === today) {
        } else if (lastDate === yesterdayStr) {
          newStreak = streakData.current_streak + 1;
        } else {
          newStreak = 1;
        }

        const newLongest = Math.max(streakData.longest_streak, newStreak);

        await supabase.from('daily_streaks').update({
          current_streak: newStreak,
          longest_streak: newLongest,
          last_exercise_date: today,
          updated_at: new Date().toISOString(),
        }).eq('user_id', user.id);

        await supabase.from('leaderboard').update({
          streak: newStreak,
        }).eq('user_id', user.id);
      }

      await checkAchievements(user.id, stats);
      toast.success('Session saved! Great work!');
    } catch (err) {
      toast.error('Failed to save session');
    } finally {
      setIsSaving(false);
    }
  };

  const checkAchievements = async (userId: string, stats: any) => {
    if (!stats) return;
    const { data: allAchievements } = await supabase.from('achievements').select('*');
    const { data: userAchievements } = await supabase.from('user_achievements').select('achievement_id').eq('user_id', userId);
    const unlockedIds = new Set(userAchievements?.map((a) => a.achievement_id) || []);
    const newUnlocks: any[] = [];

    allAchievements?.forEach((achievement) => {
      if (unlockedIds.has(achievement.id)) return;
      let unlocked = false;

      const reqType = achievement.requirement_type;
      const reqVal = achievement.requirement_value;

      if (reqType === 'total_workouts' && stats.total_workouts + 1 >= reqVal) {
        unlocked = true;
      } else if (reqType === 'total_reps' && stats.total_reps + reps >= reqVal) {
        unlocked = true;
      } else if (reqType === 'level' && stats.level >= reqVal) {
        unlocked = true;
      } else if (reqType === 'average_accuracy' && stats.average_accuracy >= reqVal) {
        unlocked = true;
      } else if (reqType === 'perfect_form' && postureAccuracy >= 95) {
        unlocked = true;
      }

      if (unlocked) {
        newUnlocks.push({
          user_id: userId,
          achievement_id: achievement.id,
          unlocked_at: new Date().toISOString(),
        });
      }
    });

    if (newUnlocks.length > 0) {
      await supabase.from('user_achievements').insert(newUnlocks);
      newUnlocks.forEach(() => {
        toast.success('Achievement unlocked!');
      });
    }
  };

  const formatTime = (s: number) => {
    const m = Math.floor(s / 60);
    const sec = Math.floor(s % 60);
    return `${m}:${sec.toString().padStart(2, '0')}`;
  };

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-950">
        <div className="animate-spin w-8 h-8 border-2 border-blue-500 border-t-transparent rounded-full" />
      </div>
    );
  }

  if (!exercise) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-950 text-white">
        <div className="text-center">
          <p>Exercise not found</p>
          <Button onClick={() => router.push('/exercises')} className="mt-4">Back to Exercises</Button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-950 text-white">
      <div className="max-w-7xl mx-auto p-4 lg:p-6">
        <div className="flex items-center justify-between mb-6">
          <Button variant="ghost" onClick={() => router.push('/exercises')} className="text-slate-400 hover:text-white">
            <ArrowLeft className="w-4 h-4 mr-2" />Back
          </Button>
          <div className="flex items-center gap-3">
            <Button variant="ghost" size="sm" onClick={() => setVoiceEnabled(!voiceEnabled)} className="text-slate-400">
              {voiceEnabled ? <Volume2 className="w-4 h-4" /> : <VolumeX className="w-4 h-4" />}
            </Button>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2">
            <div className="relative bg-slate-900 rounded-2xl overflow-hidden border border-slate-800 aspect-video">
              {!isActive && !sessionComplete && (
                <div className="absolute inset-0 flex items-center justify-center bg-slate-900/90 z-10">
                  <div className="text-center">
                    <h2 className="text-2xl font-bold mb-2">{exercise.name}</h2>
                    <p className="text-slate-400 mb-6 max-w-md">{exercise.description}</p>
                    <div className="flex items-center gap-3 justify-center mb-6">
                      <div className="flex items-center gap-2 bg-slate-800 px-3 py-2 rounded-lg">
                        <span className="text-sm text-slate-400">Sets:</span>
                        <input
                          type="number"
                          value={targetSets}
                          onChange={(e) => setTargetSets(Math.max(1, parseInt(e.target.value) || 1))}
                          className="w-12 bg-slate-700 text-center rounded text-sm text-white"
                        />
                      </div>
                      <div className="flex items-center gap-2 bg-slate-800 px-3 py-2 rounded-lg">
                        <span className="text-sm text-slate-400">Reps:</span>
                        <input
                          type="number"
                          value={targetReps}
                          onChange={(e) => setTargetReps(Math.max(1, parseInt(e.target.value) || 1))}
                          className="w-12 bg-slate-700 text-center rounded text-sm text-white"
                        />
                      </div>
                    </div>
                    <Button onClick={startExercise} className="bg-blue-500 hover:bg-blue-600 text-white px-8">
                      <Play className="w-4 h-4 mr-2" />Start Exercise
                    </Button>
                  </div>
                </div>
              )}

              {sessionComplete && (
                <div className="absolute inset-0 flex items-center justify-center bg-slate-900/95 z-10">
                  <motion.div
                    initial={{ opacity: 0, scale: 0.9 }}
                    animate={{ opacity: 1, scale: 1 }}
                    className="text-center p-8"
                  >
                    <div className="w-20 h-20 bg-emerald-500/20 rounded-full flex items-center justify-center mx-auto mb-4">
                      <Trophy className="w-10 h-10 text-emerald-400" />
                    </div>
                    <h2 className="text-3xl font-bold mb-2">Workout Complete!</h2>
                    <div className="grid grid-cols-2 gap-4 mb-6 mt-4">
                      <div className="bg-slate-800 p-3 rounded-xl">
                        <p className="text-slate-400 text-sm">Total Reps</p>
                        <p className="text-2xl font-bold text-white">{sets * targetReps + reps}</p>
                      </div>
                      <div className="bg-slate-800 p-3 rounded-xl">
                        <p className="text-slate-400 text-sm">Sets Done</p>
                        <p className="text-2xl font-bold text-white">{sets}/{targetSets}</p>
                      </div>
                      <div className="bg-slate-800 p-3 rounded-xl">
                        <p className="text-slate-400 text-sm">Duration</p>
                        <p className="text-2xl font-bold text-white">{formatTime(duration)}</p>
                      </div>
                      <div className="bg-slate-800 p-3 rounded-xl">
                        <p className="text-slate-400 text-sm">Calories</p>
                        <p className="text-2xl font-bold text-emerald-400">{calories}</p>
                      </div>
                    </div>
                    <div className="bg-amber-500/10 border border-amber-500/20 rounded-xl p-4 mb-6">
                      <div className="flex items-center gap-2 justify-center mb-1">
                        <Zap className="w-5 h-5 text-amber-400" />
                        <span className="text-amber-400 font-bold text-xl">+{xpEarned} XP</span>
                      </div>
                      <p className="text-amber-400/70 text-sm">Earned from this session</p>
                    </div>
                    <div className="flex items-center gap-3 justify-center mb-4">
                      <div className="bg-slate-800 px-3 py-2 rounded-lg">
                        <span className="text-sm text-slate-400">Posture Accuracy:</span>
                        <span className="text-sm font-bold text-white ml-2">{postureAccuracy}%</span>
                      </div>
                      <div className="bg-slate-800 px-3 py-2 rounded-lg">
                        <span className="text-sm text-slate-400">Quality:</span>
                        <span className="text-sm font-bold text-white ml-2">{movementQuality}</span>
                      </div>
                    </div>
                    <div className="flex gap-3 justify-center">
                      <Button onClick={() => router.push('/dashboard')} className="bg-blue-500 hover:bg-blue-600 text-white">
                        Dashboard
                      </Button>
                      <Button onClick={() => { setSessionComplete(false); setIsActive(false); }} variant="outline" className="border-slate-700 text-white">
                        <RotateCcw className="w-4 h-4 mr-2" />Again
                      </Button>
                    </div>
                  </motion.div>
                </div>
              )}

              <video
                ref={videoRef}
                className="absolute inset-0 w-full h-full object-cover"
                playsInline
                muted
              />
              <canvas
                ref={canvasRef}
                className="absolute inset-0 w-full h-full object-cover"
              />

              {isActive && (
                <div className="absolute top-4 left-4 bg-slate-900/80 backdrop-blur px-3 py-2 rounded-lg border border-slate-700">
                  <span className="text-2xl font-bold text-white">{reps}/{targetReps}</span>
                  <span className="text-sm text-slate-400 ml-2">reps</span>
                </div>
              )}
              {isActive && (
                <div className="absolute top-4 right-4 bg-slate-900/80 backdrop-blur px-3 py-2 rounded-lg border border-slate-700">
                  <span className="text-2xl font-bold text-white">{sets}/{targetSets}</span>
                  <span className="text-sm text-slate-400 ml-2">sets</span>
                </div>
              )}
              {isActive && (
                <div className="absolute bottom-4 left-4 bg-slate-900/80 backdrop-blur px-3 py-2 rounded-lg border border-slate-700">
                  <span className="text-lg font-mono text-white">{formatTime(duration)}</span>
                </div>
              )}
            </div>

            {isActive && (
              <div className="flex items-center gap-3 mt-4 justify-center">
                <Button onClick={pauseExercise} variant="outline" className="border-slate-700 text-white">
                  {isPaused ? <Play className="w-4 h-4" /> : <Pause className="w-4 h-4" />}
                </Button>
                <Button onClick={stopExercise} variant="outline" className="border-red-700 text-red-400 hover:bg-red-500/10">
                  <Square className="w-4 h-4" />
                </Button>
                <Button onClick={() => setCameraEnabled(!cameraEnabled)} variant="outline" className="border-slate-700 text-white">
                  {cameraEnabled ? <CameraOff className="w-4 h-4" /> : <Camera className="w-4 h-4" />}
                </Button>
              </div>
            )}
          </div>

          <div className="space-y-4">
            <Card className="bg-slate-900/60 border-slate-800">
              <CardContent className="p-4">
                <h3 className="font-semibold text-white mb-3">Live Feedback</h3>
                <AnimatePresence>
                  <motion.div
                    key={currentFeedback}
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="flex items-start gap-3"
                  >
                    {currentFeedback === 'Good form!' || currentFeedback.includes('Good') ? (
                      <CheckCircle className="w-5 h-5 text-emerald-400 mt-0.5 flex-shrink-0" />
                    ) : (
                      <AlertTriangle className="w-5 h-5 text-amber-400 mt-0.5 flex-shrink-0" />
                    )}
                    <p className="text-white text-sm">{currentFeedback}</p>
                  </motion.div>
                </AnimatePresence>
              </CardContent>
            </Card>

            <Card className="bg-slate-900/60 border-slate-800">
              <CardContent className="p-4">
                <h3 className="font-semibold text-white mb-3">Posture Accuracy</h3>
                <div className="flex items-center gap-3 mb-2">
                  <div className="w-16 h-16 rounded-full bg-slate-800 flex items-center justify-center">
                    <span className={`text-2xl font-bold ${postureAccuracy >= 90 ? 'text-emerald-400' : postureAccuracy >= 70 ? 'text-amber-400' : 'text-red-400'}`}>
                      {postureAccuracy}%
                    </span>
                  </div>
                  <div className="flex-1">
                    <Progress value={postureAccuracy} className="h-2 bg-slate-800" />
                    <div className="flex justify-between mt-2 text-xs text-slate-400">
                      <span>Poor</span>
                      <span>Good</span>
                      <span>Excellent</span>
                    </div>
                  </div>
                </div>
                <div className="flex items-center gap-2 mt-3">
                  <Badge variant="outline" className={`border-slate-700 ${movementQuality === 'Excellent' ? 'text-emerald-400' : movementQuality === 'Good' ? 'text-blue-400' : 'text-amber-400'}`}>
                    {movementQuality}
                  </Badge>
                  <span className="text-xs text-slate-400">{calories} cal</span>
                </div>
              </CardContent>
            </Card>

            <Card className="bg-slate-900/60 border-slate-800">
              <CardContent className="p-4">
                <h3 className="font-semibold text-white mb-3">Exercise Details</h3>
                <div className="space-y-2 text-sm">
                  <div className="flex justify-between"><span className="text-slate-400">Category</span><span className="text-white">{exercise.category}</span></div>
                  <div className="flex justify-between"><span className="text-slate-400">Difficulty</span><span className="text-white">{exercise.difficulty}</span></div>
                  <div className="flex justify-between"><span className="text-slate-400">Target</span><span className="text-white">{exercise.target_body_parts?.join(', ')}</span></div>
                  <div className="flex justify-between"><span className="text-slate-400">Cal/min</span><span className="text-white">{exercise.calories_per_minute}</span></div>
                </div>
                <div className="mt-3 p-3 bg-amber-500/5 rounded-lg border border-amber-500/10">
                  <p className="text-xs text-amber-400"><Star className="w-3 h-3 inline mr-1" />{exercise.safety_notes}</p>
                </div>
              </CardContent>
            </Card>

            <Card className="bg-slate-900/60 border-slate-800">
              <CardContent className="p-4">
                <h3 className="font-semibold text-white mb-3">Instructions</h3>
                <ol className="space-y-2 text-sm">
                  {exercise.instructions?.map((step, i) => (
                    <li key={i} className="flex items-start gap-2 text-slate-300">
                      <span className="w-5 h-5 rounded-full bg-blue-500/20 text-blue-400 flex items-center justify-center text-xs flex-shrink-0 mt-0.5">{i + 1}</span>
                      {step}
                    </li>
                  ))}
                </ol>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
}
