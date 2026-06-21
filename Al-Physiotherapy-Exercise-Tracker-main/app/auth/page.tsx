'use client';

import { useState } from 'react';
import { useAuth } from '@/contexts/auth-context';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { motion, AnimatePresence } from 'framer-motion';
import { Activity, Eye, EyeOff, Mail, Lock, User, ArrowRight } from 'lucide-react';
import { toast } from 'sonner';

export default function AuthPage() {
  const { signIn, signUp, user } = useAuth();
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [activeTab, setActiveTab] = useState('login');
  const [loginForm, setLoginForm] = useState({ email: '', password: '' });
  const [signupForm, setSignupForm] = useState({ fullName: '', email: '', password: '' });

  if (user) {
    router.push('/dashboard');
    return null;
  }

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    const { error } = await signIn(loginForm.email, loginForm.password);
    if (error) {
      toast.error(error.message);
    } else {
      toast.success('Welcome back!');
      router.push('/dashboard');
    }
    setIsLoading(false);
  };

  const handleSignup = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    const { error } = await signUp(signupForm.email, signupForm.password, signupForm.fullName);
    if (error) {
      toast.error(error.message);
    } else {
      toast.success('Account created! Please complete your profile.');
      router.push('/profile/setup');
    }
    setIsLoading(false);
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-slate-950 p-4 relative overflow-hidden">
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top_right,_rgba(59,130,246,0.15),_transparent_50%)]" />
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_bottom_left,_rgba(16,185,129,0.1),_transparent_50%)]" />
      
      <motion.div 
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6 }}
        className="relative z-10 w-full max-w-md"
      >
        <div className="text-center mb-8">
          <motion.div 
            className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-blue-500/10 mb-4"
            animate={{ scale: [1, 1.05, 1] }}
            transition={{ repeat: Infinity, duration: 3 }}
          >
            <Activity className="w-8 h-8 text-blue-400" />
          </motion.div>
          <h1 className="text-3xl font-bold text-white tracking-tight">PhysioAI Quest</h1>
          <p className="text-slate-400 mt-2">AI-powered physiotherapy & rehabilitation</p>
        </div>

        <Card className="bg-slate-900/80 border-slate-800 backdrop-blur-xl shadow-2xl">
          <CardHeader className="pb-4">
            <CardTitle className="text-white text-center">Welcome</CardTitle>
            <CardDescription className="text-center text-slate-400">Sign in or create an account to begin</CardDescription>
          </CardHeader>
          <CardContent>
            <Tabs value={activeTab} onValueChange={setActiveTab}>
              <TabsList className="grid w-full grid-cols-2 bg-slate-800">
                <TabsTrigger value="login" className="text-slate-300 data-[state=active]:bg-blue-500 data-[state=active]:text-white">Login</TabsTrigger>
                <TabsTrigger value="signup" className="text-slate-300 data-[state=active]:bg-blue-500 data-[state=active]:text-white">Sign Up</TabsTrigger>
              </TabsList>
              
              <AnimatePresence mode="wait">
                <TabsContent value="login" className="mt-6">
                  <motion.form 
                    key="login"
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    exit={{ opacity: 0, x: 20 }}
                    onSubmit={handleLogin}
                    className="space-y-4"
                  >
                    <div className="space-y-2">
                      <Label className="text-slate-300"><Mail className="w-3 h-3 inline mr-2" />Email</Label>
                      <Input 
                        type="email" 
                        placeholder="you@example.com" 
                        value={loginForm.email} 
                        onChange={(e) => setLoginForm({ ...loginForm, email: e.target.value })} 
                        className="bg-slate-800 border-slate-700 text-white placeholder:text-slate-500"
                        required
                      />
                    </div>
                    <div className="space-y-2">
                      <Label className="text-slate-300"><Lock className="w-3 h-3 inline mr-2" />Password</Label>
                      <div className="relative">
                        <Input 
                          type={showPassword ? 'text' : 'password'} 
                          placeholder="Enter password" 
                          value={loginForm.password} 
                          onChange={(e) => setLoginForm({ ...loginForm, password: e.target.value })} 
                          className="bg-slate-800 border-slate-700 text-white placeholder:text-slate-500"
                          required
                        />
                        <button type="button" onClick={() => setShowPassword(!showPassword)} className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-white">
                          {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                        </button>
                      </div>
                    </div>
                    <Button type="submit" className="w-full bg-blue-500 hover:bg-blue-600 text-white" disabled={isLoading}>
                      {isLoading ? 'Signing in...' : <><span>Sign In</span><ArrowRight className="w-4 h-4 ml-2" /></>}
                    </Button>
                  </motion.form>
                </TabsContent>
                
                <TabsContent value="signup" className="mt-6">
                  <motion.form 
                    key="signup"
                    initial={{ opacity: 0, x: 20 }}
                    animate={{ opacity: 1, x: 0 }}
                    exit={{ opacity: 0, x: -20 }}
                    onSubmit={handleSignup}
                    className="space-y-4"
                  >
                    <div className="space-y-2">
                      <Label className="text-slate-300"><User className="w-3 h-3 inline mr-2" />Full Name</Label>
                      <Input 
                        placeholder="John Doe" 
                        value={signupForm.fullName} 
                        onChange={(e) => setSignupForm({ ...signupForm, fullName: e.target.value })} 
                        className="bg-slate-800 border-slate-700 text-white placeholder:text-slate-500"
                        required
                      />
                    </div>
                    <div className="space-y-2">
                      <Label className="text-slate-300"><Mail className="w-3 h-3 inline mr-2" />Email</Label>
                      <Input 
                        type="email" 
                        placeholder="you@example.com" 
                        value={signupForm.email} 
                        onChange={(e) => setSignupForm({ ...signupForm, email: e.target.value })} 
                        className="bg-slate-800 border-slate-700 text-white placeholder:text-slate-500"
                        required
                      />
                    </div>
                    <div className="space-y-2">
                      <Label className="text-slate-300"><Lock className="w-3 h-3 inline mr-2" />Password</Label>
                      <div className="relative">
                        <Input 
                          type={showPassword ? 'text' : 'password'} 
                          placeholder="Min 6 characters" 
                          value={signupForm.password} 
                          onChange={(e) => setSignupForm({ ...signupForm, password: e.target.value })} 
                          className="bg-slate-800 border-slate-700 text-white placeholder:text-slate-500"
                          required
                          minLength={6}
                        />
                        <button type="button" onClick={() => setShowPassword(!showPassword)} className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-white">
                          {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                        </button>
                      </div>
                    </div>
                    <Button type="submit" className="w-full bg-blue-500 hover:bg-blue-600 text-white" disabled={isLoading}>
                      {isLoading ? 'Creating account...' : <><span>Get Started</span><ArrowRight className="w-4 h-4 ml-2" /></>}
                    </Button>
                  </motion.form>
                </TabsContent>
              </AnimatePresence>
            </Tabs>
          </CardContent>
        </Card>
        
        <p className="text-center text-slate-500 text-sm mt-6">
          By signing up, you agree to our Terms of Service and Privacy Policy.
        </p>
      </motion.div>
    </div>
  );
}
