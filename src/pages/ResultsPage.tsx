import React, { useEffect, useState } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { InterviewSession, ImprovementPlan } from '../types';
import { generateInterviewPdfReport } from '../utils/pdfGenerator';
import { ShareSummaryCardModal } from '../components/ShareSummaryCardModal';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  CartesianGrid,
  Cell,
} from 'recharts';
import {
  Trophy,
  Award,
  Sparkles,
  CheckCircle2,
  XCircle,
  HelpCircle,
  PlayCircle,
  ListCheck,
  ChevronDown,
  ChevronUp,
  BrainCircuit,
  MessageSquare,
  ArrowRight,
  TrendingUp,
  ShieldCheck,
  RotateCcw,
  Download,
  Share2,
  Monitor,
  ShieldAlert,
  AlertTriangle,
} from 'lucide-react';

export const ResultsPage: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const { token, user, isLoading: isAuthLoading } = useAuth();
  const navigate = useNavigate();

  const [session, setSession] = useState<InterviewSession | null>(null);
  const [improvementPlan, setImprovementPlan] = useState<ImprovementPlan | null>(null);
  const [expandedQuestionId, setExpandedQuestionId] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isShareModalOpen, setIsShareModalOpen] = useState(false);

  // Ensure any previous speech synthesis from interview room is stopped
  useEffect(() => {
    if ('speechSynthesis' in window) {
      window.speechSynthesis.cancel();
    }
  }, []);

  useEffect(() => {
    if (isAuthLoading) return;

    if (!user) {
      navigate('/auth');
      return;
    }

    const fetchSession = async () => {
      try {
        const res = await fetch(`/api/sessions/${id}`, {
          headers: { Authorization: `Bearer ${token}` },
        });
        if (res.ok) {
          const data = await res.json();
          setSession(data.session);
          setImprovementPlan(data.session.improvementPlan || null);

          if (data.session.questions && data.session.questions.length > 0) {
            setExpandedQuestionId(data.session.questions[0].id);
          }
        }
      } catch (err) {
        console.error('Error fetching session results:', err);
      } finally {
        setIsLoading(false);
      }
    };

    fetchSession();
  }, [id, token, user, navigate]);

  const togglePlanCompletion = async () => {
    if (!session) return;
    try {
      const res = await fetch(`/api/sessions/${session.id}/toggle-plan`, {
        method: 'POST',
        headers: { Authorization: `Bearer ${token}` },
      });
      if (res.ok) {
        const data = await res.json();
        setImprovementPlan(data.plan);
      }
    } catch (err) {
      console.error('Error toggling plan:', err);
    }
  };

  if (isLoading || !session) {
    return (
      <div className="min-h-[85vh] bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-slate-100 py-8 px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto space-y-8 animate-pulse">
        {/* Banner Skeleton */}
        <div className="bg-slate-200 dark:bg-slate-900 rounded-3xl p-8 h-48 w-full border border-slate-300 dark:border-slate-800" />
        
        {/* Metrics Row Skeleton */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {[...Array(4)].map((_, i) => (
            <div key={i} className="bg-slate-200 dark:bg-slate-900 p-5 rounded-2xl h-28 w-full border border-slate-300 dark:border-slate-800" />
          ))}
        </div>

        {/* Content Skeleton */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          <div className="bg-slate-200 dark:bg-slate-900 rounded-3xl h-80 w-full border border-slate-300 dark:border-slate-800" />
          <div className="lg:col-span-2 space-y-4">
            {[...Array(3)].map((_, i) => (
              <div key={i} className="bg-slate-200 dark:bg-slate-900 rounded-2xl h-28 w-full border border-slate-300 dark:border-slate-800" />
            ))}
          </div>
        </div>
      </div>
    );
  }

  const questions = session.questions || [];

  // Calculate average category scores for bar chart
  const avgTech =
    questions.length > 0
      ? Math.round(
          questions.reduce((acc, q) => acc + (q.answer?.technicalScore || 0), 0) / questions.length
        )
      : 0;

  const avgComm =
    questions.length > 0
      ? Math.round(
          questions.reduce((acc, q) => acc + (q.answer?.communicationScore || 0), 0) / questions.length
        )
      : 0;

  const avgSent =
    questions.length > 0
      ? Math.round(
          questions.reduce((acc, q) => acc + (q.answer?.sentimentScore || 0), 0) / questions.length
        )
      : 0;

  const categoryData = [
    { name: 'Technical Accuracy', score: avgTech, color: '#4f46e5' },
    { name: 'Communication Quality', score: avgComm, color: '#9333ea' },
    { name: 'Confidence & Poise', score: avgSent, color: '#10b981' },
  ];

  const overallScore = session.overallScore || Math.round((avgTech + avgComm + avgSent) / 3);

  return (
    <div className="w-full min-h-[calc(100vh-4rem)] bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-slate-100 py-8 px-4 sm:px-6 lg:px-8 transition-colors">
      <div className="max-w-6xl xl:max-w-7xl mx-auto space-y-8">
      {/* Top Banner */}
      <div className="bg-slate-900 text-white dark:bg-gradient-to-r dark:from-indigo-950 dark:via-purple-950 dark:to-slate-900 border border-slate-800 dark:border-indigo-500/30 rounded-3xl p-6 sm:p-8 flex flex-col md:flex-row items-center justify-between gap-6 shadow-xl">
        <div className="space-y-2 text-center md:text-left">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-white/10 dark:bg-indigo-500/20 text-indigo-200 dark:text-indigo-300 text-xs font-bold border border-white/10 dark:border-indigo-500/30">
            <Trophy className="w-3.5 h-3.5 text-amber-300" />
            Interview Performance Report
          </div>
          <h1 className="text-3xl font-black text-white">{session.track} Interview Results</h1>
          <p className="text-xs text-slate-300 font-medium">
            Completed on {new Date(session.completedAt || session.createdAt).toLocaleDateString()} • {session.difficulty} Level
          </p>
        </div>

        <div className="flex flex-wrap items-center justify-center md:justify-end gap-2.5">
          <button
            onClick={() => generateInterviewPdfReport(session, user?.name || 'Candidate')}
            className="px-4 py-2.5 bg-emerald-600 hover:bg-emerald-500 text-white font-extrabold rounded-xl text-xs flex items-center gap-2 shadow-sm transition"
          >
            <Download className="w-4 h-4" />
            <span>Download PDF Report</span>
          </button>

          <button
            onClick={() => setIsShareModalOpen(true)}
            className="px-4 py-2.5 bg-[#0a66c2] hover:bg-[#004182] text-white font-extrabold rounded-xl text-xs flex items-center gap-2 shadow-sm transition"
          >
            <Share2 className="w-4 h-4" />
            <span>Share Card</span>
          </button>

          <Link
            to="/track-selection"
            className="px-4 py-2.5 bg-white text-slate-900 hover:bg-slate-100 dark:bg-indigo-600 dark:hover:bg-indigo-500 dark:text-white font-extrabold rounded-xl text-xs flex items-center gap-2 shadow-sm transition"
          >
            <RotateCcw className="w-4 h-4 text-indigo-600 dark:text-white" />
            Practice Again
          </Link>
        </div>
      </div>

      {/* Main Grid: Overall Score Radial Card & Category Bar Chart */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {/* Overall Score Radial Card */}
        <div className="bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 p-6 rounded-2xl flex flex-col items-center justify-center text-center space-y-4 shadow-xs">
          <span className="text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">
            Overall Readiness Score
          </span>

          <div className="relative w-36 h-36 flex items-center justify-center">
            {/* SVG Radial Ring */}
            <svg className="w-full h-full transform -rotate-90">
              <circle
                cx="72"
                cy="72"
                r="60"
                stroke="#e2e8f0"
                strokeWidth="12"
                fill="transparent"
              />
              <circle
                cx="72"
                cy="72"
                r="60"
                stroke={overallScore >= 80 ? '#10b981' : overallScore >= 60 ? '#4f46e5' : '#f59e0b'}
                strokeWidth="12"
                strokeDasharray={377}
                strokeDashoffset={377 - (377 * overallScore) / 100}
                strokeLinecap="round"
                fill="transparent"
                className="transition-all duration-1000 ease-out"
              />
            </svg>
            <div className="absolute flex flex-col items-center">
              <span className="text-4xl font-black text-slate-900 dark:text-white">{overallScore}</span>
              <span className="text-[10px] text-slate-500 dark:text-slate-400 uppercase font-mono font-bold">out of 100</span>
            </div>
          </div>

          <div className="text-xs font-extrabold text-emerald-700 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-500/10 px-3 py-1 rounded-full border border-emerald-200 dark:border-emerald-500/20">
            {overallScore >= 85 ? 'Strong Hire' : overallScore >= 70 ? 'Competitive Candidate' : 'Requires Review'}
          </div>
        </div>

        {/* Category Breakdown Bar Chart (2 cols) */}
        <div className="md:col-span-2 bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 p-6 rounded-2xl flex flex-col justify-between shadow-xs">
          <div>
            <h3 className="text-sm font-extrabold text-slate-900 dark:text-white uppercase tracking-wider mb-1">
              Category Breakdown
            </h3>
            <p className="text-xs text-slate-500 dark:text-slate-400 font-medium mb-4">Detailed metric breakdown generated by Gemini AI</p>
          </div>

          <div className="h-48 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={categoryData} layout="vertical" margin={{ top: 5, right: 30, left: 40, bottom: 5 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" horizontal={false} />
                <XAxis type="number" domain={[0, 100]} stroke="#64748b" tick={{ fontSize: 11 }} />
                <YAxis dataKey="name" type="category" stroke="#475569" tick={{ fontSize: 11 }} width={120} />
                <Tooltip
                  contentStyle={{ backgroundColor: '#0f172a', borderColor: '#334155', borderRadius: '8px', fontSize: '12px', color: '#fff' }}
                />
                <Bar dataKey="score" radius={[0, 8, 8, 0]}>
                  {categoryData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.color} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>

      {/* Strengths & Weaknesses */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 p-6 rounded-2xl space-y-3 shadow-xs">
          <h3 className="text-xs font-bold text-emerald-700 dark:text-emerald-400 uppercase tracking-wider flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4" /> Core Strengths Demonstrated
          </h3>
          <ul className="space-y-2">
            {(session.strengths || ['Clear architectural reasoning', 'Good structured framework']).map((s, idx) => (
              <li key={idx} className="text-xs text-slate-700 dark:text-slate-300 flex items-start gap-2 bg-slate-50 dark:bg-slate-950 p-2.5 rounded-xl border border-slate-200/80 dark:border-slate-800 font-medium">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 mt-1.5 shrink-0" />
                <span>{s}</span>
              </li>
            ))}
          </ul>
        </div>

        <div className="bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 p-6 rounded-2xl space-y-3 shadow-xs">
          <h3 className="text-xs font-bold text-amber-700 dark:text-amber-400 uppercase tracking-wider flex items-center gap-2">
            <TrendingUp className="w-4 h-4" /> Areas for Refinement
          </h3>
          <ul className="space-y-2">
            {(session.weaknesses || ['Provide deeper edge case coverage', 'Pacing and deliberate pauses']).map((w, idx) => (
              <li key={idx} className="text-xs text-slate-700 dark:text-slate-300 flex items-start gap-2 bg-slate-50 dark:bg-slate-950 p-2.5 rounded-xl border border-slate-200/80 dark:border-slate-800 font-medium">
                <span className="w-1.5 h-1.5 rounded-full bg-amber-500 mt-1.5 shrink-0" />
                <span>{w}</span>
              </li>
            ))}
          </ul>
        </div>
      </div>

      {/* Exam Anti-Cheating & Tab Switch Proctoring Summary */}
      <div className="bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 p-6 rounded-2xl space-y-3 shadow-xs">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            <div className={`w-10 h-10 rounded-2xl flex items-center justify-center ${
              !session.proctoring || session.proctoring.tabSwitchCount === 0
                ? 'bg-emerald-50 dark:bg-emerald-950 text-emerald-600 dark:text-emerald-400 border border-emerald-200 dark:border-emerald-800'
                : 'bg-amber-50 dark:bg-amber-950 text-amber-600 dark:text-amber-400 border border-amber-200 dark:border-amber-800'
            }`}>
              {!session.proctoring || session.proctoring.tabSwitchCount === 0 ? (
                <ShieldCheck className="w-5 h-5" />
              ) : (
                <ShieldAlert className="w-5 h-5" />
              )}
            </div>
            <div>
              <h3 className="text-sm font-extrabold text-slate-900 dark:text-white flex items-center gap-2">
                <span>Exam Focus & Tab Proctoring Integrity</span>
                <span className={`text-[10px] px-2 py-0.5 rounded-full font-bold border ${
                  !session.proctoring || session.proctoring.tabSwitchCount === 0
                    ? 'bg-emerald-50 dark:bg-emerald-950 text-emerald-700 dark:text-emerald-300 border-emerald-200 dark:border-emerald-800'
                    : 'bg-amber-50 dark:bg-amber-950 text-amber-700 dark:text-amber-300 border-amber-200 dark:border-amber-800'
                }`}>
                  {!session.proctoring || session.proctoring.tabSwitchCount === 0 ? '100% Focused · Verified' : `${session.proctoring.tabSwitchCount} Tab Switches Logged`}
                </span>
              </h3>
              <p className="text-xs text-slate-500 dark:text-slate-400 font-medium">
                Real-time browser tab switches and window blur events monitored during the examination session.
              </p>
            </div>
          </div>

          <div className="text-right">
            <span className="text-xs text-slate-400 font-bold uppercase block">Integrity Score</span>
            <span className="text-xl font-black text-indigo-600 dark:text-indigo-400">
              {session.proctoring?.integrityScore ?? 100}%
            </span>
          </div>
        </div>
      </div>

      {/* Per-Question Transcript & AI Critique Accordion */}
      <div className="bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 rounded-3xl p-6 sm:p-8 space-y-4 shadow-xs">
        <h3 className="text-base font-extrabold text-slate-900 dark:text-white flex items-center gap-2">
          <MessageSquare className="w-5 h-5 text-indigo-600 dark:text-indigo-400" />
          Per-Question Transcripts & AI Critiques
        </h3>

        <div className="space-y-3">
          {questions.map((q, idx) => {
            const isExpanded = expandedQuestionId === q.id;
            return (
              <div
                key={q.id}
                className="bg-slate-50 dark:bg-slate-950 border border-slate-200/80 dark:border-slate-800 rounded-2xl overflow-hidden transition"
              >
                <button
                  onClick={() => setExpandedQuestionId(isExpanded ? null : q.id)}
                  className="w-full p-4 flex items-center justify-between text-left hover:bg-slate-100/60 dark:hover:bg-slate-900/50 transition"
                >
                  <div className="flex items-center gap-3">
                    <span className="w-7 h-7 rounded-lg bg-slate-900 dark:bg-indigo-600/20 text-white dark:text-indigo-400 flex items-center justify-center font-bold text-xs shadow-xs">
                      #{idx + 1}
                    </span>
                    <div>
                      <p className="text-sm font-bold text-slate-900 dark:text-white line-clamp-1">{q.questionText}</p>
                      <span className="text-[10px] text-slate-500 dark:text-slate-400 uppercase font-semibold">{q.questionType}</span>
                    </div>
                  </div>

                  <div className="flex items-center gap-4">
                    {q.answer && (
                      <span className="text-xs font-extrabold text-indigo-600 dark:text-indigo-400">
                        Score: {q.answer.technicalScore}%
                      </span>
                    )}
                    {isExpanded ? <ChevronUp className="w-4 h-4 text-slate-400" /> : <ChevronDown className="w-4 h-4 text-slate-400" />}
                  </div>
                </button>

                {isExpanded && (
                  <div className="p-4 pt-0 border-t border-slate-200 dark:border-slate-800/80 space-y-4 text-xs">
                    {/* Transcript */}
                    <div className="bg-white dark:bg-slate-900 p-3 rounded-xl border border-slate-200/80 dark:border-slate-800">
                      <span className="text-[10px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider block mb-1">
                        Your Response Transcript:
                      </span>
                      <p className="text-slate-800 dark:text-slate-200 leading-relaxed italic font-medium">
                        "{q.answer?.transcriptText || 'No transcript recorded.'}"
                      </p>
                    </div>

                    {/* AI Critique */}
                    <div className="bg-indigo-50/80 dark:bg-indigo-950/40 border border-indigo-200 dark:border-indigo-500/30 p-3 rounded-xl space-y-2">
                      <span className="text-[10px] font-bold text-indigo-900 dark:text-indigo-300 uppercase tracking-wider flex items-center gap-1.5">
                        <Sparkles className="w-3.5 h-3.5 text-amber-500 dark:text-amber-300" />
                        Gemini AI Critique:
                      </span>
                      <p className="text-slate-800 dark:text-slate-300 leading-relaxed font-medium">
                        {q.answer?.aiFeedback || 'Solid answer given.'}
                      </p>

                      <div className="flex items-center gap-6 pt-2 text-[11px] font-bold">
                        <span className="text-indigo-700 dark:text-indigo-300">Technical: {q.answer?.technicalScore}%</span>
                        <span className="text-purple-700 dark:text-purple-300">Communication: {q.answer?.communicationScore}%</span>
                        <span className="text-emerald-700 dark:text-emerald-300">Sentiment: {q.answer?.sentimentScore}%</span>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </div>

      {/* Personalized Improvement Plan Section */}
      {improvementPlan && (
        <div className="bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 rounded-3xl p-6 sm:p-8 space-y-6 shadow-xs">
          <div className="flex items-center justify-between pb-4 border-b border-slate-200 dark:border-slate-800">
            <div>
              <h3 className="text-base font-extrabold text-slate-900 dark:text-white flex items-center gap-2">
                <ListCheck className="w-5 h-5 text-emerald-600 dark:text-emerald-400" />
                Personalized Improvement Plan
              </h3>
              <p className="text-xs text-slate-500 dark:text-slate-400 font-medium mt-0.5">Recommended practice checklist generated for this session</p>
            </div>

            <button
              onClick={togglePlanCompletion}
              className={`px-3.5 py-1.5 rounded-xl text-xs font-bold flex items-center gap-2 transition ${
                improvementPlan.completed
                  ? 'bg-emerald-50 dark:bg-emerald-500/20 text-emerald-800 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-500/30'
                  : 'bg-slate-100 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 text-slate-700 dark:text-slate-300'
              }`}
            >
              <CheckCircle2 className="w-4 h-4" />
              <span>{improvementPlan.completed ? 'Completed!' : 'Mark as Complete'}</span>
            </button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="space-y-3">
              <span className="text-xs font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider block">
                Target Topics to Study:
              </span>
              <div className="space-y-2">
                {improvementPlan.focusAreas.map((topic, i) => (
                  <div key={i} className="flex items-center gap-3 bg-slate-50 dark:bg-slate-950 p-3 rounded-xl border border-slate-200/80 dark:border-slate-800 text-xs text-slate-800 dark:text-slate-200 font-medium">
                    <span className="w-5 h-5 rounded-lg bg-indigo-50 dark:bg-indigo-600/20 text-indigo-700 dark:text-indigo-400 flex items-center justify-center font-bold text-[10px]">
                      {i + 1}
                    </span>
                    <span>{topic}</span>
                  </div>
                ))}
              </div>
            </div>

            <div className="space-y-3">
              <span className="text-xs font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider block">
                Suggested Next Practice Items:
              </span>
              <div className="space-y-2">
                {improvementPlan.suggestedPractice.map((item, i) => (
                  <div key={i} className="flex items-center gap-3 bg-slate-50 dark:bg-slate-950 p-3 rounded-xl border border-slate-200/80 dark:border-slate-800 text-xs text-slate-800 dark:text-slate-200 font-medium">
                    <span className="w-5 h-5 rounded-lg bg-emerald-50 dark:bg-emerald-600/20 text-emerald-700 dark:text-emerald-400 flex items-center justify-center font-bold text-[10px]">
                      ✓
                    </span>
                    <span>{item}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Social Performance Card Modal */}
      {session && (
        <ShareSummaryCardModal
          isOpen={isShareModalOpen}
          onClose={() => setIsShareModalOpen(false)}
          sessionData={{
            track: session.track,
            overallScore: overallScore,
            difficulty: session.difficulty,
            completedAt: session.completedAt || session.createdAt,
            strengths: session.strengths,
            weaknesses: session.weaknesses,
            avgTech: avgTech,
            avgComm: avgComm,
            avgSent: avgSent,
            candidateName: user?.name || 'Candidate',
          }}
        />
      )}
    </div>
  </div>
);
};
