'use client';

import { useEffect } from 'react';
import { useAuth } from '@/contexts/auth-context';
import { useRouter } from 'next/navigation';
import { motion } from 'framer-motion';
import { Button } from '@/components/ui/button';
import {
  Activity, ArrowRight, Brain, Camera, Target, Zap,
  Shield, Heart, TrendingUp, Star, BarChart3, Users
} from 'lucide-react';

export default function LandingPage() {
  const { user, loading } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (!loading && user) {
      router.push('/dashboard');
    }
  }, [user, loading, router]);

  if (loading || user) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-950">
        <div className="animate-spin w-8 h-8 border-2 border-blue-500 border-t-transparent rounded-full" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-950 text-white overflow-hidden">
      {/* Background effects */}
      <div className="fixed inset-0 pointer-events-none">
        <div className="absolute top-0 right-0 w-[800px] h-[800px] bg-blue-500/5 rounded-full blur-3xl" />
        <div className="absolute bottom-0 left-0 w-[600px] h-[600px] bg-emerald-500/5 rounded-full blur-3xl" />
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[1000px] h-[1000px] bg-blue-500/3 rounded-full blur-3xl" />
      </div>

      {/* Header */}
      <header className="relative z-10 border-b border-slate-800/50">
        <div className="max-w-7xl mx-auto px-4 lg:px-6 py-4 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="w-9 h-9 rounded-xl bg-blue-500/10 flex items-center justify-center">
              <Activity className="w-5 h-5 text-blue-400" />
            </div>
            <span className="font-bold text-lg">PhysioAI Quest</span>
          </div>
          <div className="flex items-center gap-3">
            <Button variant="ghost" onClick={() => router.push('/auth')} className="text-slate-400 hover:text-white">
              Sign In
            </Button>
            <Button onClick={() => router.push('/auth')} className="bg-blue-500 hover:bg-blue-600 text-white">
              Get Started <ArrowRight className="w-4 h-4 ml-2" />
            </Button>
          </div>
        </div>
      </header>

      {/* Hero */}
      <section className="relative z-10 pt-20 pb-32 px-4">
        <div className="max-w-7xl mx-auto text-center">
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8 }}
          >
            <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-blue-500/10 border border-blue-500/20 mb-8">
              <Brain className="w-4 h-4 text-blue-400" />
              <span className="text-sm text-blue-400">AI-Powered Physiotherapy</span>
            </div>
            <h1 className="text-5xl md:text-7xl font-bold tracking-tight mb-6">
              Rehabilitate with
              <span className="block bg-gradient-to-r from-blue-400 via-emerald-400 to-blue-500 bg-clip-text text-transparent">
                Precision AI
              </span>
            </h1>
            <p className="text-lg text-slate-400 max-w-2xl mx-auto mb-10 leading-relaxed">
              Real-time pose detection, personalized rehabilitation plans, and gamified recovery tracking.
              Your AI physiotherapist guides every rep with millimeter precision.
            </p>
            <div className="flex items-center gap-4 justify-center">
              <Button onClick={() => router.push('/auth')} size="lg" className="bg-blue-500 hover:bg-blue-600 text-white px-8">
                Start Your Journey <ArrowRight className="w-4 h-4 ml-2" />
              </Button>
              <Button variant="outline" size="lg" className="border-slate-700 text-white hover:bg-slate-800">
                Learn More
              </Button>
            </div>
          </motion.div>

          {/* Stats */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.4, duration: 0.6 }}
            className="grid grid-cols-2 md:grid-cols-4 gap-4 mt-20 max-w-3xl mx-auto"
          >
            {[
              { icon: Camera, value: '10+', label: 'Exercise Types' },
              { icon: Target, value: '95%', label: 'Pose Accuracy' },
              { icon: Zap, value: 'Real-time', label: 'Feedback' },
              { icon: Brain, value: 'AI', label: 'Powered' },
            ].map((stat, i) => (
              <div key={i} className="bg-slate-900/50 border border-slate-800 rounded-xl p-4">
                <stat.icon className="w-5 h-5 text-blue-400 mx-auto mb-2" />
                <p className="text-xl font-bold text-white">{stat.value}</p>
                <p className="text-xs text-slate-400">{stat.label}</p>
              </div>
            ))}
          </motion.div>
        </div>
      </section>

      {/* Features */}
      <section className="relative z-10 py-20 px-4 border-t border-slate-800/50">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-16">
            <h2 className="text-3xl font-bold mb-3">Comprehensive Recovery Platform</h2>
            <p className="text-slate-400 max-w-xl mx-auto">Every feature designed for real rehabilitation results</p>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {[
              { icon: Camera, title: 'Real-Time Pose Detection', desc: 'MediaPipe-powered skeleton tracking with live feedback on every movement', color: 'blue' },
              { icon: Brain, title: 'AI Posture Analysis', desc: 'Joint angle calculations, symmetry analysis, and balance scoring in real-time', color: 'emerald' },
              { icon: Target, title: 'Rep & Set Tracking', desc: 'Automatic movement detection with posture-quality-gated rep counting', color: 'amber' },
              { icon: Shield, title: 'Medical Report Analysis', desc: 'Upload MRI, X-Ray, and prescriptions for AI-driven diagnosis and recommendations', color: 'red' },
              { icon: Heart, title: 'Personalized Plans', desc: 'AI-generated daily, weekly, and monthly rehabilitation plans tailored to you', color: 'rose' },
              { icon: TrendingUp, title: 'Progress Analytics', desc: 'Detailed charts tracking posture accuracy, workout consistency, and recovery', color: 'teal' },
              { icon: Zap, title: 'Gamification', desc: 'XP system, achievements, streaks, and leaderboards to keep you motivated', color: 'orange' },
              { icon: BarChart3, title: 'Voice Feedback', desc: 'Real-time voice coaching correcting form mistakes as you exercise', color: 'indigo' },
              { icon: Users, title: 'AI Assistant', desc: 'Chat with your AI physiotherapist for exercise explanations and motivation', color: 'cyan' },
            ].map((feature, i) => (
              <motion.div
                key={i}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.1 * i }}
                className="bg-slate-900/50 border border-slate-800 rounded-xl p-6 hover:border-slate-700 transition-all"
              >
                <div className={`w-10 h-10 rounded-lg bg-${feature.color}-500/10 flex items-center justify-center mb-4`}>
                  <feature.icon className={`w-5 h-5 text-${feature.color}-400`} />
                </div>
                <h3 className="font-semibold text-white mb-2">{feature.title}</h3>
                <p className="text-sm text-slate-400">{feature.desc}</p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="relative z-10 py-20 px-4 border-t border-slate-800/50">
        <div className="max-w-3xl mx-auto text-center">
          <div className="w-16 h-16 rounded-2xl bg-blue-500/10 flex items-center justify-center mx-auto mb-6">
            <Star className="w-8 h-8 text-blue-400" />
          </div>
          <h2 className="text-3xl font-bold mb-4">Ready to Start Your Recovery?</h2>
          <p className="text-slate-400 mb-8 max-w-lg mx-auto">
            Join thousands of users using AI to accelerate their rehabilitation.
            Create your account and get your first personalized plan in minutes.
          </p>
          <Button onClick={() => router.push('/auth')} size="lg" className="bg-blue-500 hover:bg-blue-600 text-white px-8">
            Create Free Account <ArrowRight className="w-4 h-4 ml-2" />
          </Button>
          <p className="text-xs text-slate-500 mt-4">No credit card required. Start recovering today.</p>
        </div>
      </section>

      {/* Footer */}
      <footer className="relative z-10 border-t border-slate-800/50 py-8 px-4">
        <div className="max-w-7xl mx-auto flex items-center justify-between text-sm text-slate-500">
          <div className="flex items-center gap-2">
            <Activity className="w-4 h-4 text-blue-400" />
            <span>PhysioAI Quest</span>
          </div>
          <p>AI-powered physiotherapy and rehabilitation platform</p>
        </div>
      </footer>
    </div>
  );
}
