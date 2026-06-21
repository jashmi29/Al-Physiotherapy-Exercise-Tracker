'use client';

import { useEffect, useRef, useState } from 'react';
import { useAuth } from '@/contexts/auth-context';
import { useRouter } from 'next/navigation';
import { supabase } from '@/lib/supabase';
import { motion, AnimatePresence } from 'framer-motion';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent } from '@/components/ui/card';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Badge } from '@/components/ui/badge';
import { toast } from 'sonner';
import { ArrowLeft, Send, Bot, User, Activity, Sparkles, AlertCircle, WifiOff, RefreshCw } from 'lucide-react';

interface ChatMessage {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  created_at: string;
  isError?: boolean;
  isFallback?: boolean;
}

const FALLBACK_RESPONSES: Record<string, string> = {
  squat: `For proper squat form:
1. Stand with feet shoulder-width apart
2. Keep your chest up and back straight
3. Lower your hips back and down as if sitting in a chair
4. Keep knees tracking over your toes (don't let them cave inward)
5. Push through your heels to stand back up
6. Aim for thighs parallel to the ground

Common mistakes to avoid:
- Rounding your back (keep it neutral)
- Letting knees cave inward (push them outward)
- Rising onto your toes (keep weight on heels)
- Not going deep enough (thighs should be parallel)`,

  knee: `For knee pain exercises and recovery:
1. **Knee Extensions** - Sit and straighten one leg at a time, hold for 5 seconds
2. **Heel Slides** - Lie on your back and slide heel toward your buttocks
3. **Ankle Pumps** - Point and flex your foot to improve circulation
4. **Straight Leg Raises** - Lift leg 6-12 inches while keeping it straight
5. **Wall Sits** - Hold a seated position against a wall for 30-60 seconds

Important precautions:
- Avoid deep squats or lunges if they cause pain
- Start with low resistance and increase gradually
- If pain persists beyond 48 hours, consult a physiotherapist
- Ice the knee after exercise for 15-20 minutes`,

  shoulder: `For shoulder rehabilitation:
1. **Arm Raises** - Raise arms forward to shoulder height, then lower
2. **Shoulder Rotations** - Small circular movements with arms
3. **Wall Push-ups** - Modified push-ups against a wall
4. **Pendulum Exercises** - Lean forward and let arm swing gently
5. **Cross-body Stretch** - Bring arm across chest and gently pull

Recovery tips:
- Start with very light weights or no weight at all
- Never push through sharp pain
- Apply heat before exercises and ice after
- Avoid overhead movements initially if they cause pain
- Aim for 3 sets of 10-15 reps`,

  back: `For lower back pain and recovery:
1. **Glute Bridges** - Lie on back, lift hips up, squeeze glutes
2. **Cat-Cow Stretch** - On hands and knees, alternate arching and rounding back
3. **Bird Dog** - Extend opposite arm and leg while on hands and knees
4. **Pelvic Tilts** - Gently rock pelvis forward and back while lying down
5. **Knee-to-Chest** - Pull one knee toward chest while lying on back

Important guidelines:
- Avoid twisting movements that cause pain
- Keep core engaged during all exercises
- Do not exercise through sharp pain
- Maintain good posture during daily activities
- Start with 5-10 reps and build up gradually`,

  posture: `For maintaining good posture:
1. **Wall Angel** - Stand against wall, slide arms up and down
2. **Chin Tucks** - Gently tuck chin inward (not downward)
3. **Shoulder Blade Squeeze** - Pull shoulder blades back and together
4. **Chest Opener** - Clasp hands behind back and open chest
5. **Neck Stretches** - Gentle side-to-side and forward stretches

Daily tips:
- Keep computer screen at eye level
- Take breaks every 30 minutes from sitting
- Sit with feet flat on floor
- Keep ears aligned over shoulders
- Use a lumbar support cushion when sitting`,

  recovery: `For optimal recovery:
1. **Sleep** - Aim for 7-9 hours of quality sleep
2. **Nutrition** - Eat protein-rich foods and stay hydrated
3. **Rest Days** - Allow 1-2 rest days between intense sessions
4. **Active Recovery** - Light walking or stretching on rest days
5. **Progress Tracking** - Log your exercises and note improvements

Timeline expectations:
- Acute injuries: 2-6 weeks for basic recovery
- Muscle strains: 3-8 weeks for full recovery
- Post-surgery: 3-6 months for complete rehabilitation
- Chronic conditions: Ongoing management with gradual improvement

Always consult your doctor or physiotherapist for personalized recovery timelines.`,

  exercise: `General exercise guidelines for rehabilitation:
1. **Warm Up** - 5-10 minutes of light movement before exercises
2. **Start Slow** - Begin with low intensity and short durations
3. **Progress Gradually** - Increase by no more than 10% per week
4. **Cool Down** - Stretch after every session
5. **Listen to Your Body** - Stop if you feel sharp pain

Recommended structure:
- 3-5 sessions per week
- 20-45 minutes per session
- 2-3 sets of 8-15 reps per exercise
- 30-60 seconds rest between sets
- Focus on form over speed`,

  default: `I'm here to help with your physiotherapy and rehabilitation questions! Here are some topics I can assist with:

- Exercise form and technique (squats, lunges, arm raises, etc.)
- Knee pain exercises and recovery
- Shoulder rehabilitation exercises
- Lower back pain management
- Posture correction tips
- Recovery timelines and expectations
- General exercise guidelines

Try asking something specific like:
"How do I improve my squat form?"
"What exercises help with knee pain?"
"Tips for maintaining good posture?"

If you have a medical report, you can also upload it on the Medical Analysis page for AI-powered diagnosis and recommendations.`,
};

function getFallbackResponse(message: string): string {
  const lower = message.toLowerCase();
  for (const [key, response] of Object.entries(FALLBACK_RESPONSES)) {
    if (lower.includes(key)) return response;
  }
  return FALLBACK_RESPONSES.default;
}

export default function AIChatPage() {
  const { user, profile } = useAuth();
  const router = useRouter();
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [isInitializing, setIsInitializing] = useState(true);
  const [apiStatus, setApiStatus] = useState<'online' | 'offline' | 'checking'>('checking');
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!user) {
      router.push('/auth');
      return;
    }
    fetchMessages();
    checkApiStatus();
  }, [user]);

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages]);

  const checkApiStatus = async () => {
    try {
      const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
      const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
      const response = await fetch(`${supabaseUrl}/functions/v1/ai-assistant`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${anonKey}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          messages: [{ role: 'user', content: 'ping' }],
        }),
      });
      setApiStatus(response.ok ? 'online' : 'offline');
    } catch {
      setApiStatus('offline');
    }
  };

  const fetchMessages = async () => {
    const { data } = await supabase
      .from('chat_history')
      .select('*')
      .eq('user_id', user!.id)
      .order('created_at', { ascending: true })
      .limit(50);
    if (data) {
      setMessages(data);
      setIsInitializing(false);
    }
  };

  const sendMessage = async () => {
    if (!input.trim() || isLoading || !user) return;

    const userMessage: ChatMessage = {
      id: crypto.randomUUID(),
      role: 'user',
      content: input.trim(),
      created_at: new Date().toISOString(),
    };

    setMessages((prev) => [...prev, userMessage]);
    setInput('');
    setIsLoading(true);

    try {
      await supabase.from('chat_history').insert({
        user_id: user.id,
        role: 'user',
        content: userMessage.content,
      });

      const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
      const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

      const response = await fetch(`${supabaseUrl}/functions/v1/ai-assistant`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${anonKey}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          messages: messages.map((m) => ({ role: m.role, content: m.content })).concat({
            role: 'user',
            content: userMessage.content,
          }),
          userProfile: profile,
        }),
      });

      let aiContent: string;
      let isFallback = false;

      if (!response.ok) {
        const errorText = await response.text().catch(() => 'Unknown error');
        console.error('AI API error:', response.status, errorText);
        // Use fallback response instead of failing
        aiContent = getFallbackResponse(userMessage.content);
        isFallback = true;
        setApiStatus('offline');
      } else {
        const data = await response.json();
        if (data.error) {
          console.error('AI service error:', data.error);
          aiContent = getFallbackResponse(userMessage.content);
          isFallback = true;
          setApiStatus('offline');
        } else {
          aiContent = data.message || getFallbackResponse(userMessage.content);
          setApiStatus('online');
        }
      }

      const aiMessage: ChatMessage = {
        id: crypto.randomUUID(),
        role: 'assistant',
        content: aiContent,
        created_at: new Date().toISOString(),
        isFallback,
      };

      setMessages((prev) => [...prev, aiMessage]);

      await supabase.from('chat_history').insert({
        user_id: user.id,
        role: 'assistant',
        content: aiContent,
      });
    } catch (err) {
      console.error('Chat error:', err);
      // Even if everything fails, show a helpful fallback response
      const fallbackContent = getFallbackResponse(userMessage.content);
      const aiMessage: ChatMessage = {
        id: crypto.randomUUID(),
        role: 'assistant',
        content: fallbackContent,
        created_at: new Date().toISOString(),
        isFallback: true,
      };
      setMessages((prev) => [...prev, aiMessage]);
      setApiStatus('offline');
    } finally {
      setIsLoading(false);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      sendMessage();
    }
  };

  if (isInitializing) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-950">
        <div className="animate-spin w-8 h-8 border-2 border-blue-500 border-t-transparent rounded-full" />
      </div>
    );
  }

  return (
    <div className="min-h-screen flex flex-col bg-slate-950 text-white">
      <div className="flex items-center gap-3 p-4 border-b border-slate-800">
        <Button variant="ghost" size="sm" onClick={() => router.push('/dashboard')} className="text-slate-400 hover:text-white">
          <ArrowLeft className="w-4 h-4" />
        </Button>
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-lg bg-blue-500/10 flex items-center justify-center">
            <Bot className="w-4 h-4 text-blue-400" />
          </div>
          <div>
            <h1 className="font-semibold text-white">PhysioAI Assistant</h1>
            <p className="text-xs text-slate-400">AI-powered physiotherapy expert</p>
          </div>
        </div>
        <div className="ml-auto flex items-center gap-2">
          {apiStatus === 'offline' && (
            <Badge className="bg-amber-500/10 text-amber-400 border-amber-500/20 text-xs flex items-center gap-1">
              <WifiOff className="w-3 h-3" />Offline Mode
            </Badge>
          )}
          {apiStatus === 'online' && (
            <Badge className="bg-emerald-500/10 text-emerald-400 border-emerald-500/20 text-xs flex items-center gap-1">
              <Sparkles className="w-3 h-3" />AI Active
            </Badge>
          )}
          {apiStatus === 'checking' && (
            <Badge className="bg-slate-700 text-slate-400 text-xs">Checking...</Badge>
          )}
          <Button variant="ghost" size="sm" onClick={checkApiStatus} className="text-slate-400 hover:text-white">
            <RefreshCw className="w-3 h-3" />
          </Button>
        </div>
      </div>

      <div className="flex-1 overflow-hidden">
        <ScrollArea className="h-full" ref={scrollRef}>
          <div className="max-w-3xl mx-auto p-4 space-y-4">
            {messages.length === 0 && (
              <div className="text-center py-12">
                <div className="w-16 h-16 rounded-2xl bg-blue-500/10 flex items-center justify-center mx-auto mb-4">
                  <Activity className="w-8 h-8 text-blue-400" />
                </div>
                <h2 className="text-xl font-bold text-white mb-2">How can I help you today?</h2>
                <p className="text-slate-400 max-w-md mx-auto">
                  Ask me about exercises, posture correction, rehabilitation tips, or anything related to your recovery journey.
                </p>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3 mt-6 max-w-md mx-auto">
                  {[
                    'How do I improve my squat form?',
                    'What exercises help with knee pain?',
                    'How long should my recovery sessions be?',
                    'Tips for maintaining posture during desk work?',
                  ].map((suggestion, i) => (
                    <button
                      key={i}
                      onClick={() => { setInput(suggestion); }}
                      className="text-left p-3 bg-slate-800/50 rounded-lg border border-slate-700 hover:border-blue-500/50 hover:bg-slate-800 transition-all text-sm text-slate-300"
                    >
                      {suggestion}
                    </button>
                  ))}
                </div>
              </div>
            )}

            <AnimatePresence>
              {messages.map((message) => (
                <motion.div
                  key={message.id}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.3 }}
                  className={`flex items-start gap-3 ${message.role === 'user' ? 'flex-row-reverse' : ''}`}
                >
                  <div className={`w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0 ${
                    message.role === 'user' ? 'bg-blue-500/10' : 'bg-emerald-500/10'
                  }`}>
                    {message.role === 'user' ? (
                      <User className="w-4 h-4 text-blue-400" />
                    ) : (
                      <Bot className="w-4 h-4 text-emerald-400" />
                    )}
                  </div>
                  <Card className={`max-w-[80%] ${
                    message.role === 'user'
                      ? 'bg-blue-500/10 border-blue-500/20'
                      : message.isFallback
                        ? 'bg-amber-500/5 border-amber-500/15'
                        : 'bg-slate-800/50 border-slate-700'
                  }`}>
                    <CardContent className="p-3">
                      {message.isFallback && (
                        <div className="flex items-center gap-1.5 mb-2">
                          <WifiOff className="w-3 h-3 text-amber-400" />
                          <span className="text-xs text-amber-400 font-medium">Offline Mode Response</span>
                        </div>
                      )}
                      <p className="text-sm text-white whitespace-pre-wrap">{message.content}</p>
                    </CardContent>
                  </Card>
                </motion.div>
              ))}
            </AnimatePresence>

            {isLoading && (
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                className="flex items-start gap-3"
              >
                <div className="w-8 h-8 rounded-lg bg-emerald-500/10 flex items-center justify-center flex-shrink-0">
                  <Bot className="w-4 h-4 text-emerald-400" />
                </div>
                <Card className="bg-slate-800/50 border-slate-700">
                  <CardContent className="p-3">
                    <div className="flex items-center gap-2">
                      <div className="w-2 h-2 bg-emerald-400 rounded-full animate-bounce" style={{ animationDelay: '0ms' }} />
                      <div className="w-2 h-2 bg-emerald-400 rounded-full animate-bounce" style={{ animationDelay: '150ms' }} />
                      <div className="w-2 h-2 bg-emerald-400 rounded-full animate-bounce" style={{ animationDelay: '300ms' }} />
                    </div>
                  </CardContent>
                </Card>
              </motion.div>
            )}
          </div>
        </ScrollArea>
      </div>

      <div className="p-4 border-t border-slate-800">
        {apiStatus === 'offline' && (
          <div className="max-w-3xl mx-auto mb-3">
            <div className="flex items-center gap-2 bg-amber-500/10 border border-amber-500/20 rounded-lg px-3 py-2">
              <AlertCircle className="w-4 h-4 text-amber-400 flex-shrink-0" />
              <p className="text-xs text-amber-400">
                AI service is offline. Using offline mode with expert physiotherapy responses. You can still ask about exercises, posture, knee pain, shoulder recovery, back pain, and general rehabilitation tips.
              </p>
            </div>
          </div>
        )}
        <div className="max-w-3xl mx-auto flex items-center gap-2">
          <Input
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="Ask about exercises, posture, or recovery..."
            className="bg-slate-800 border-slate-700 text-white placeholder:text-slate-500"
            disabled={isLoading}
          />
          <Button
            onClick={sendMessage}
            disabled={isLoading || !input.trim()}
            className="bg-blue-500 hover:bg-blue-600 text-white flex-shrink-0"
          >
            <Send className="w-4 h-4" />
          </Button>
        </div>
      </div>
    </div>
  );
}
