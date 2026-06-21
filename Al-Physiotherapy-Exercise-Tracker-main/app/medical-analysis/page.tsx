'use client';

import { useState, useRef } from 'react';
import { useAuth } from '@/contexts/auth-context';
import { useRouter } from 'next/navigation';
import { supabase } from '@/lib/supabase';
import { motion } from 'framer-motion';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { toast } from 'sonner';
import {
  ArrowLeft, Upload, FileText, Activity, AlertTriangle, CheckCircle,
  X, FileUp, Loader2, Heart, Eye, Shield, Stethoscope
} from 'lucide-react';

interface AnalysisResult {
  diagnosis: string;
  affected_area: string;
  recovery_status: string;
  restrictions: string[];
  exercise_recommendations: string[];
  risk_warnings: string[];
}

export default function MedicalAnalysisPage() {
  const { user } = useAuth();
  const router = useRouter();
  const [file, setFile] = useState<File | null>(null);
  const [fileName, setFileName] = useState('');
  const [reportType, setReportType] = useState('');
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [analysis, setAnalysis] = useState<AnalysisResult | null>(null);
  const [textContent, setTextContent] = useState('');
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const selected = e.target.files?.[0];
    if (selected) {
      if (selected.size > 10 * 1024 * 1024) {
        toast.error('File size must be under 10MB');
        return;
      }
      setFile(selected);
      setFileName(selected.name);
    }
  };

  const handleTextSubmit = async () => {
    if (!textContent.trim()) {
      toast.error('Please enter report content');
      return;
    }
    await analyzeMedicalReport(textContent);
  };

  const analyzeMedicalReport = async (content: string) => {
    if (!user) {
      router.push('/auth');
      return;
    }
    setIsAnalyzing(true);

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
          messages: [
            {
              role: 'user',
              content: `Please analyze this medical/physiotherapy report and provide a structured analysis. Extract the following:

Diagnosis (what condition or injury is identified)
Affected Area (which body part)
Recovery Status (current stage of recovery)
Restrictions (list of activities or movements to avoid)
Exercise Recommendations (list of recommended exercises for recovery)
Risk Warnings (potential risks or complications)

Report content:
${content}

Respond ONLY with a JSON object in this exact format:
{
  "diagnosis": "string",
  "affected_area": "string",
  "recovery_status": "string",
  "restrictions": ["string"],
  "exercise_recommendations": ["string"],
  "risk_warnings": ["string"]
}`,
            },
          ],
        }),
      });

      if (!response.ok) {
        throw new Error('AI analysis failed');
      }

      const data = await response.json();
      let result: AnalysisResult;

      try {
        const parsed = JSON.parse(data.message);
        result = {
          diagnosis: parsed.diagnosis || 'Not specified',
          affected_area: parsed.affected_area || 'Not specified',
          recovery_status: parsed.recovery_status || 'Not specified',
          restrictions: Array.isArray(parsed.restrictions) ? parsed.restrictions : [],
          exercise_recommendations: Array.isArray(parsed.exercise_recommendations) ? parsed.exercise_recommendations : [],
          risk_warnings: Array.isArray(parsed.risk_warnings) ? parsed.risk_warnings : [],
        };
      } catch {
        // Fallback: parse from text if JSON fails
        const text = data.message;
        result = {
          diagnosis: extractField(text, 'Diagnosis') || 'Analysis completed',
          affected_area: extractField(text, 'Affected Area') || 'Not specified',
          recovery_status: extractField(text, 'Recovery Status') || 'Not specified',
          restrictions: extractList(text, 'Restrictions'),
          exercise_recommendations: extractList(text, 'Exercise Recommendations'),
          risk_warnings: extractList(text, 'Risk Warnings'),
        };
      }

      setAnalysis(result);

      // Save to database
      const { data: reportData } = await supabase.from('medical_reports').insert({
        user_id: user.id,
        file_name: fileName || 'Text Report',
        file_type: file?.type || 'text/plain',
        report_type: reportType || 'General',
      }).select().single();

      if (reportData) {
        await supabase.from('medical_analysis').insert({
          user_id: user.id,
          report_id: reportData.id,
          diagnosis: result.diagnosis,
          affected_area: result.affected_area,
          recovery_status: result.recovery_status,
          restrictions: result.restrictions,
          exercise_recommendations: result.exercise_recommendations,
          risk_warnings: result.risk_warnings,
        });
      }

      toast.success('Analysis complete!');
    } catch (err) {
      toast.error('Failed to analyze report. Please try again.');
    } finally {
      setIsAnalyzing(false);
    }
  };

  const extractField = (text: string, field: string): string | null => {
    const regex = new RegExp(`${field}[:\s]+([^\n]+)`, 'i');
    const match = text.match(regex);
    return match ? match[1].trim() : null;
  };

  const extractList = (text: string, field: string): string[] => {
    const regex = new RegExp(`${field}[:\s]+([\s\S]*?)(?=\n\w+:|$)`, 'i');
    const match = text.match(regex);
    if (!match) return [];
    return match[1]
      .split('\n')
      .map((l) => l.replace(/^[-*\d.)\s]+/, '').trim())
      .filter((l) => l.length > 0);
  };

  return (
    <div className="min-h-screen bg-slate-950 text-white">
      <div className="max-w-4xl mx-auto p-4 lg:p-6">
        <div className="flex items-center justify-between mb-6">
          <Button variant="ghost" onClick={() => router.push('/dashboard')} className="text-slate-400 hover:text-white">
            <ArrowLeft className="w-4 h-4 mr-2" />Back
          </Button>
          <h1 className="text-xl font-bold">Medical Report Analysis</h1>
          <div className="w-20" />
        </div>

        {!analysis && (
          <div className="space-y-6">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
            >
              <Card className="bg-slate-900/60 border-slate-800">
                <CardContent className="p-6">
                  <div className="flex items-center gap-3 mb-4">
                    <div className="w-12 h-12 rounded-xl bg-blue-500/10 flex items-center justify-center">
                      <Stethoscope className="w-6 h-6 text-blue-400" />
                    </div>
                    <div>
                      <h2 className="font-semibold text-white">AI Medical Analysis</h2>
                      <p className="text-sm text-slate-400">Upload a report or paste text for AI analysis</p>
                    </div>
                  </div>

                  <div className="space-y-4">
                    <div>
                      <label className="text-sm text-slate-400 mb-2 block">Report Type</label>
                      <div className="flex flex-wrap gap-2">
                        {['MRI Report', 'X-Ray', 'Physiotherapy Report', 'Doctor Prescription', 'General Medical'].map((type) => (
                          <button
                            key={type}
                            onClick={() => setReportType(type)}
                            className={`px-3 py-1.5 rounded-full text-xs font-medium transition-all ${
                              reportType === type
                                ? 'bg-blue-500 text-white'
                                : 'bg-slate-800 text-slate-400 hover:bg-slate-700'
                            }`}
                          >
                            {type}
                          </button>
                        ))}
                      </div>
                    </div>

                    <div
                      className="border-2 border-dashed border-slate-700 rounded-xl p-8 text-center hover:border-blue-500/50 transition-colors cursor-pointer"
                      onClick={() => fileInputRef.current?.click()}
                    >
                      <input
                        ref={fileInputRef}
                        type="file"
                        accept=".pdf,.txt,.jpg,.jpeg,.png,.doc,.docx"
                        onChange={handleFileChange}
                        className="hidden"
                      />
                      <FileUp className="w-8 h-8 text-slate-500 mx-auto mb-2" />
                      <p className="text-sm text-slate-400">
                        {fileName ? `Selected: ${fileName}` : 'Click to upload a report (PDF, image, or text)'}
                      </p>
                    </div>

                    <div className="text-center text-sm text-slate-500">— OR —</div>

                    <div>
                      <label className="text-sm text-slate-400 mb-2 block">Paste Report Content</label>
                      <Textarea
                        value={textContent}
                        onChange={(e) => setTextContent(e.target.value)}
                        placeholder="Paste your medical report text here..."
                        className="bg-slate-800 border-slate-700 text-white min-h-[150px] placeholder:text-slate-500"
                      />
                    </div>

                    <Button
                      onClick={handleTextSubmit}
                      disabled={isAnalyzing || (!file && !textContent.trim())}
                      className="w-full bg-blue-500 hover:bg-blue-600 text-white"
                    >
                      {isAnalyzing ? (
                        <><Loader2 className="w-4 h-4 mr-2 animate-spin" />Analyzing...</>
                      ) : (
                        <><Activity className="w-4 h-4 mr-2" />Analyze Report</>
                      )}
                    </Button>
                  </div>
                </CardContent>
              </Card>
            </motion.div>
          </div>
        )}

        {analysis && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="space-y-4"
          >
            <div className="flex items-center justify-between">
              <h2 className="text-lg font-bold text-white">Analysis Results</h2>
              <Button variant="outline" size="sm" onClick={() => { setAnalysis(null); setFile(null); setFileName(''); setTextContent(''); }} className="border-slate-700 text-white">
                <X className="w-4 h-4 mr-2" />New Analysis
              </Button>
            </div>

            <Card className="bg-slate-900/60 border-slate-800">
              <CardContent className="p-6">
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
                  <div className="bg-slate-800/50 p-4 rounded-xl">
                    <div className="flex items-center gap-2 mb-2">
                      <FileText className="w-4 h-4 text-blue-400" />
                      <span className="text-sm text-slate-400">Diagnosis</span>
                    </div>
                    <p className="font-semibold text-white">{analysis.diagnosis}</p>
                  </div>
                  <div className="bg-slate-800/50 p-4 rounded-xl">
                    <div className="flex items-center gap-2 mb-2">
                      <Eye className="w-4 h-4 text-emerald-400" />
                      <span className="text-sm text-slate-400">Affected Area</span>
                    </div>
                    <p className="font-semibold text-white">{analysis.affected_area}</p>
                  </div>
                  <div className="bg-slate-800/50 p-4 rounded-xl">
                    <div className="flex items-center gap-2 mb-2">
                      <Heart className="w-4 h-4 text-red-400" />
                      <span className="text-sm text-slate-400">Recovery Status</span>
                    </div>
                    <p className="font-semibold text-white">{analysis.recovery_status}</p>
                  </div>
                </div>

                <div className="space-y-4">
                  <div>
                    <h3 className="font-semibold text-white mb-2 flex items-center gap-2">
                      <Shield className="w-4 h-4 text-amber-400" />Restrictions
                    </h3>
                    <div className="flex flex-wrap gap-2">
                      {analysis.restrictions.length > 0 ? (
                        analysis.restrictions.map((r, i) => (
                          <Badge key={i} className="bg-amber-500/10 text-amber-400 border-amber-500/20">{r}</Badge>
                        ))
                      ) : (
                        <span className="text-slate-400 text-sm">No specific restrictions identified</span>
                      )}
                    </div>
                  </div>

                  <div>
                    <h3 className="font-semibold text-white mb-2 flex items-center gap-2">
                      <Activity className="w-4 h-4 text-emerald-400" />Exercise Recommendations
                    </h3>
                    <div className="space-y-2">
                      {analysis.exercise_recommendations.length > 0 ? (
                        analysis.exercise_recommendations.map((r, i) => (
                          <div key={i} className="flex items-start gap-2 bg-slate-800/50 p-3 rounded-lg">
                            <CheckCircle className="w-4 h-4 text-emerald-400 mt-0.5 flex-shrink-0" />
                            <span className="text-sm text-slate-300">{r}</span>
                          </div>
                        ))
                      ) : (
                        <span className="text-slate-400 text-sm">No specific recommendations</span>
                      )}
                    </div>
                  </div>

                  <div>
                    <h3 className="font-semibold text-white mb-2 flex items-center gap-2">
                      <AlertTriangle className="w-4 h-4 text-red-400" />Risk Warnings
                    </h3>
                    <div className="space-y-2">
                      {analysis.risk_warnings.length > 0 ? (
                        analysis.risk_warnings.map((w, i) => (
                          <div key={i} className="flex items-start gap-2 bg-red-500/5 p-3 rounded-lg border border-red-500/10">
                            <AlertTriangle className="w-4 h-4 text-red-400 mt-0.5 flex-shrink-0" />
                            <span className="text-sm text-red-300">{w}</span>
                          </div>
                        ))
                      ) : (
                        <span className="text-slate-400 text-sm">No specific risks identified</span>
                      )}
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>

            <div className="flex gap-3">
              <Button onClick={() => router.push('/planner')} className="flex-1 bg-blue-500 hover:bg-blue-600 text-white">
                <Activity className="w-4 h-4 mr-2" />Generate Recovery Plan
              </Button>
              <Button onClick={() => router.push('/exercises')} variant="outline" className="flex-1 border-slate-700 text-white">
                <Heart className="w-4 h-4 mr-2" />Browse Exercises
              </Button>
            </div>
          </motion.div>
        )}
      </div>
    </div>
  );
}
