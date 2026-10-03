import React, { useEffect, useState } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { InterviewSession, ImprovementPlan } from '../types';
import { generateInterviewPdfReport } from '../utils/pdfGenerator';
import { ShareSummaryCardModal } from '../components/ShareSummaryCardModal';
import {
  GlassCard,
  ProgressRing,
  PrimaryButton,
  PillButton,
  Badge,
} from '../components/ui';
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
  Flame,
  Check,
} from 'lucide-react';
import {
  ResponsiveContainer,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  CartesianGrid,
  Cell,
} from 'recharts';

export const ResultsPage: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const { token, user, isLoading: isAuthLoading } = useAuth();
  const navigate = useNavigate();

  const [session, setSession] = useState<InterviewSession | null>(null);
  const [previousSession, setPreviousSession] = useState<InterviewSession | null>(null);
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
        const [resSession, resAll] = await Promise.all([
          fetch(`/api/sessions/${id}`, {
            headers: { Authorization: `Bearer ${token}` },
          }),
          fetch('/api/sessions', {
            headers: { Authorization: `Bearer ${token}` },
          }),
        ]);

        if (resSession.ok) {
          const data = await resSession.json();
          setSession(data.session);
          setImprovementPlan(data.session.improvementPlan || null);

          if (data.session.questions && data.session.questions.length > 0) {
            setExpandedQuestionId(data.session.questions[0].id);
          }
        }

        if (resAll.ok) {
          const allData = await resAll.json();
          const allSessions: InterviewSession[] = allData.sessions || [];
          // Find the most recent completed session PRIOR to this session
          const prev = allSessions.find(
            (s) => s.id !== id && s.status === 'completed' && s.overallScore !== undefined
          );
          setPreviousSession(prev || null);
        }
      } catch (err) {
        console.error('Error fetching session results:', err);
      } finally {
        setIsLoading(false);
      }
    };

    fetchSession();
  }, [id, token, user, navigate, isAuthLoading]);

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
      <div className="min-h-[85vh] py-8 px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto space-y-8 animate-pulse text-[#F8F4E9]">
        <div className="bg-[rgba(42,27,51,0.6)] rounded-3xl p-8 h-48 w-full border border-[rgba(248,244,233,0.08)]" />
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {[...Array(4)].map((_, i) => (
            <div key={i} className="bg-[rgba(42,27,51,0.6)] p-5 rounded-2xl h-28 w-full border border-[rgba(248,244,233,0.08)]" />
          ))}
        </div>
      </div>
    );
  }

  // Calculate scores from real answered questions
  const questions = session.questions || [];
  const answeredQuestions = questions.filter((q) => q.answer);

  const avgTechnical =
    answeredQuestions.length > 0
      ? Math.round(
          answeredQuestions.reduce((acc, q) => acc + (q.answer?.technicalScore || 0), 0) /
            answeredQuestions.length
        )
      : null;

  const avgCommunication =
    answeredQuestions.length > 0
      ? Math.round(
          answeredQuestions.reduce((acc, q) => acc + (q.answer?.communicationScore || 0), 0) /
            answeredQuestions.length
        )
      : null;

  const avgSentiment =
    answeredQuestions.length > 0
      ? Math.round(
          answeredQuestions.reduce((acc, q) => acc + (q.answer?.sentimentScore || 0), 0) /
            answeredQuestions.length
        )
      : null;

  const avgStructure =
    avgTechnical !== null && avgCommunication !== null
      ? Math.round(avgTechnical * 0.5 + avgCommunication * 0.5)
      : null;

  const overallScore =
    session.overallScore !== undefined
      ? session.overallScore
      : avgTechnical !== null && avgCommunication !== null && avgSentiment !== null
      ? Math.round((avgTechnical + avgCommunication + avgSentiment) / 3)
      : null;

  // Real comparison data against previous completed session (if one exists)
  let comparisonData: { name: string; current: number; previous: number }[] | null = null;
  let overallLift: number | null = null;

  if (previousSession && overallScore !== null) {
    const prevAnswered = previousSession.questions?.filter((q) => q.answer) || [];
    const prevTech =
      prevAnswered.length > 0
        ? Math.round(
            prevAnswered.reduce((acc, q) => acc + (q.answer?.technicalScore || 0), 0) /
              prevAnswered.length
          )
        : previousSession.overallScore || 0;

    const prevComm =
      prevAnswered.length > 0
        ? Math.round(
            prevAnswered.reduce((acc, q) => acc + (q.answer?.communicationScore || 0), 0) /
              prevAnswered.length
          )
        : previousSession.overallScore || 0;

    const prevSent =
      prevAnswered.length > 0
        ? Math.round(
            prevAnswered.reduce((acc, q) => acc + (q.answer?.sentimentScore || 0), 0) /
              prevAnswered.length
          )
        : previousSession.overallScore || 0;

    const prevStruct = Math.round(prevTech * 0.5 + prevComm * 0.5);

    comparisonData = [
      { name: 'Technical Depth', current: avgTechnical || 0, previous: prevTech },
      { name: 'Clarity & Cadence', current: avgCommunication || 0, previous: prevComm },
      { name: 'System Tradeoffs', current: avgStructure || 0, previous: prevStruct },
      { name: 'Confidence / STAR', current: avgSentiment || 0, previous: prevSent },
    ];

    if (previousSession.overallScore !== undefined) {
      overallLift = overallScore - previousSession.overallScore;
    }
  }

  return (
    <div className="w-full min-h-[calc(100vh-4rem)] py-8 px-4 sm:px-6 lg:px-8 text-[#F8F4E9]">
      <div className="max-w-7xl mx-auto space-y-6">
        {/* HERO RESULTS BANNER: Dot-Matrix Hero Score + Action Buttons */}
        <GlassCard className="p-6 sm:p-8 flex flex-col md:flex-row items-center justify-between gap-6 border-[rgba(147,80,115,0.4)] shadow-[0_20px_45px_rgba(15,7,20,0.8),0_0_35px_rgba(147,80,115,0.25)]">
          <div className="space-y-3 text-center md:text-left flex-1">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-[rgba(147,80,115,0.3)] border border-[rgba(246,219,192,0.3)] text-[#F6DBC0] text-xs font-bold">
              <Trophy className="w-3.5 h-3.5 text-[#F6DBC0]" />
              <span>Official AI Evaluation & Speech Diagnostics</span>
            </div>

            <h1 className="text-3xl sm:text-4xl font-black text-[#F8F4E9] tracking-tight">
              {session.track} Performance Report
            </h1>

            <p className="text-xs sm:text-sm text-[rgba(248,244,233,0.7)] max-w-xl font-medium leading-relaxed">
              Interview session completed on{' '}
              {new Date(session.completedAt || session.createdAt).toLocaleDateString()} ·{' '}
              <strong className="text-[#F6DBC0]">{session.difficulty}</strong> Tier ·{' '}
              {questions.length} question{questions.length !== 1 ? 's' : ''} evaluated by Gemini AI.
            </p>

            <div className="flex flex-wrap items-center justify-center md:justify-start gap-2.5 pt-2">
              <PrimaryButton
                onClick={() => generateInterviewPdfReport(session, user?.name || 'Candidate')}
                icon={<Download className="w-4 h-4 text-[#F6DBC0]" />}
                size="md"
              >
                Download PDF Report
              </PrimaryButton>

              <PillButton
                onClick={() => setIsShareModalOpen(true)}
                icon={<Share2 className="w-4 h-4 text-[#F6DBC0]" />}
                size="md"
              >
                Share Summary Card
              </PillButton>

              <PillButton
                onClick={() => navigate('/track-selection')}
                icon={<RotateCcw className="w-4 h-4 text-[#F6DBC0]" />}
                size="md"
              >
                Practice Again
              </PillButton>
            </div>
          </div>

          {/* Hero Big Dot-Matrix Score Showcase */}
          <div className="shrink-0 flex flex-col items-center justify-center p-6 rounded-3xl bg-[rgba(26,15,34,0.65)] border border-[rgba(246,219,192,0.25)] shadow-[0_0_30px_rgba(147,80,115,0.35)] min-w-[200px] text-center">
            <span className="text-[10px] font-mono font-bold uppercase tracking-widest text-[#F6DBC0]">
              Overall Score
            </span>
            <div className="flex items-baseline gap-1 my-1">
              <span className="text-5xl sm:text-6xl font-black font-dot text-[#F8F4E9] tracking-tight tabular-nums">
                {overallScore !== null ? overallScore : '—'}
              </span>
              <span className="text-lg font-bold text-[rgba(248,244,233,0.5)]">/100</span>
            </div>
            {overallScore !== null && (
              <Badge
                variant={overallScore >= 85 ? 'mint' : overallScore >= 70 ? 'peach' : 'mauve'}
                size="sm"
                glow
              >
                {overallScore >= 85
                  ? 'Strong Hire'
                  : overallScore >= 70
                  ? 'Competitive'
                  : 'Developing'}
              </Badge>
            )}
          </div>
        </GlassCard>

        {/* 4 SCORE RINGS: Technical, Communication, Structure, Confidence */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          <GlassCard className="p-5 flex flex-col items-center text-center">
            <ProgressRing
              percentage={avgTechnical ?? 0}
              size={120}
              strokeWidth={9}
              label="Technical Accuracy"
              sublabel={avgTechnical !== null ? `${avgTechnical}%` : '—'}
            />
          </GlassCard>

          <GlassCard className="p-5 flex flex-col items-center text-center">
            <ProgressRing
              percentage={avgCommunication ?? 0}
              size={120}
              strokeWidth={9}
              label="Communication & Clarity"
              sublabel={avgCommunication !== null ? `${avgCommunication}%` : '—'}
            />
          </GlassCard>

          <GlassCard className="p-5 flex flex-col items-center text-center">
            <ProgressRing
              percentage={avgStructure ?? 0}
              size={120}
              strokeWidth={9}
              label="Structure & Tradeoffs"
              sublabel={avgStructure !== null ? `${avgStructure}%` : '—'}
            />
          </GlassCard>

          <GlassCard className="p-5 flex flex-col items-center text-center">
            <ProgressRing
              percentage={avgSentiment ?? 0}
              size={120}
              strokeWidth={9}
              label="Spoken Confidence"
              sublabel={avgSentiment !== null ? `${avgSentiment}%` : '—'}
            />
          </GlassCard>
        </div>

        {/* BENTO COMPARISON & STRENGTHS ROW */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          {/* Comparison vs Previous Session Chart (7 cols) */}
          <GlassCard className="lg:col-span-7 flex flex-col justify-between p-6">
            <div className="flex items-center justify-between mb-4">
              <div>
                <h3 className="text-xs font-bold uppercase tracking-widest text-[#F8F4E9] flex items-center gap-2">
                  <TrendingUp className="w-4 h-4 text-[#F6DBC0]" />
                  Comparison vs Previous Practice Session
                </h3>
                <p className="text-xs text-[rgba(248,244,233,0.5)] mt-0.5">
                  Metric delta showing growth across your real interview rounds
                </p>
              </div>
              {overallLift !== null && (
                <Badge variant={overallLift >= 0 ? 'mint' : 'mauve'} size="sm">
                  {overallLift >= 0 ? `+${overallLift}% Lift` : `${overallLift}% Delta`}
                </Badge>
              )}
            </div>

            {comparisonData ? (
              <>
                <div className="h-56 w-full">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart
                      data={comparisonData}
                      margin={{ top: 10, right: 15, left: -20, bottom: 5 }}
                    >
                      <CartesianGrid strokeDasharray="3 3" stroke="rgba(248,244,233,0.05)" />
                      <XAxis dataKey="name" stroke="rgba(248,244,233,0.4)" tick={{ fontSize: 10 }} />
                      <YAxis domain={[0, 100]} stroke="rgba(248,244,233,0.4)" tick={{ fontSize: 10 }} />
                      <Tooltip
                        content={({ active, payload }) => {
                          if (active && payload && payload.length) {
                            return (
                              <div className="bg-[rgba(26,15,34,0.95)] border border-[rgba(147,80,115,0.4)] text-[#F8F4E9] p-3 rounded-2xl text-xs space-y-1 shadow-xl">
                                <p className="font-bold text-[#F6DBC0]">
                                  {payload[0]?.payload?.name}
                                </p>
                                <p className="text-[#F8F4E9]">
                                  Current Round:{' '}
                                  <strong className="text-[#F6DBC0]">
                                    {payload[0]?.value}%
                                  </strong>
                                </p>
                                <p className="text-[rgba(248,244,233,0.6)]">
                                  Previous Round: {payload[1]?.value}%
                                </p>
                              </div>
                            );
                          }
                          return null;
                        }}
                      />
                      <Bar
                        dataKey="current"
                        name="Current Round"
                        fill="#935073"
                        radius={[6, 6, 0, 0]}
                      />
                      <Bar
                        dataKey="previous"
                        name="Previous Round"
                        fill="rgba(80, 45, 85, 0.45)"
                        radius={[6, 6, 0, 0]}
                      />
                    </BarChart>
                  </ResponsiveContainer>
                </div>

                <div className="flex items-center justify-center gap-6 pt-3 border-t border-[rgba(248,244,233,0.06)] text-xs text-[rgba(248,244,233,0.6)]">
                  <span className="flex items-center gap-2">
                    <span className="w-3 h-3 rounded bg-[#935073]" /> Current Round
                  </span>
                  <span className="flex items-center gap-2">
                    <span className="w-3 h-3 rounded bg-[rgba(80,45,85,0.5)]" /> Previous Baseline
                  </span>
                </div>
              </>
            ) : (
              <div className="h-56 flex flex-col items-center justify-center text-center p-6 border border-dashed border-[rgba(248,244,233,0.08)] rounded-2xl space-y-2">
                <TrendingUp className="w-8 h-8 text-[rgba(248,244,233,0.3)]" />
                <p className="text-xs text-[rgba(248,244,233,0.6)] max-w-sm">
                  Comparative performance trajectory requires at least two completed sessions. Complete
                  another mock round to unlock comparative charts!
                </p>
              </div>
            )}
          </GlassCard>

          {/* Strengths & Weaknesses (5 cols) */}
          <div className="lg:col-span-5 flex flex-col gap-4">
            {/* Strengths */}
            <GlassCard className="p-5 space-y-3 flex-1">
              <h3 className="text-xs font-bold text-[#7FE3B9] uppercase tracking-wider flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4 text-[#7FE3B9]" />
                Demonstrated Strengths
              </h3>
              {session.strengths && session.strengths.length > 0 ? (
                <ul className="space-y-2 text-xs">
                  {session.strengths.map((s, idx) => (
                    <li
                      key={idx}
                      className="p-2.5 rounded-xl bg-[rgba(26,15,34,0.6)] border border-[rgba(248,244,233,0.06)] text-[rgba(248,244,233,0.85)] flex items-start gap-2"
                    >
                      <span className="w-1.5 h-1.5 rounded-full bg-[#7FE3B9] mt-1.5 shrink-0" />
                      <span>{s}</span>
                    </li>
                  ))}
                </ul>
              ) : (
                <p className="text-xs text-[rgba(248,244,233,0.5)] italic">
                  Complete questions to generate aggregate strength evaluations.
                </p>
              )}
            </GlassCard>

            {/* Areas for Refinement */}
            <GlassCard className="p-5 space-y-3 flex-1">
              <h3 className="text-xs font-bold text-[#F6DBC0] uppercase tracking-wider flex items-center gap-2">
                <TrendingUp className="w-4 h-4 text-[#F6DBC0]" />
                Areas for Refinement
              </h3>
              {session.weaknesses && session.weaknesses.length > 0 ? (
                <ul className="space-y-2 text-xs">
                  {session.weaknesses.map((w, idx) => (
                    <li
                      key={idx}
                      className="p-2.5 rounded-xl bg-[rgba(26,15,34,0.6)] border border-[rgba(248,244,233,0.06)] text-[rgba(248,244,233,0.85)] flex items-start gap-2"
                    >
                      <span className="w-1.5 h-1.5 rounded-full bg-[#F6DBC0] mt-1.5 shrink-0" />
                      <span>{w}</span>
                    </li>
                  ))}
                </ul>
              ) : (
                <p className="text-xs text-[rgba(248,244,233,0.5)] italic">
                  No critical deficiencies flagged for this practice round.
                </p>
              )}
            </GlassCard>
          </div>
        </div>

        {/* IMPROVEMENT CHECKLIST & TIMELINE ROADMAP */}
        {improvementPlan && (
          <GlassCard className="p-6 sm:p-7 space-y-5">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-[rgba(248,244,233,0.06)]">
              <div>
                <h3 className="text-sm font-extrabold uppercase tracking-widest text-[#F8F4E9] flex items-center gap-2">
                  <ListCheck className="w-4 h-4 text-[#F6DBC0]" />
                  AI Personalized Improvement Plan
                </h3>
                <p className="text-xs text-[rgba(248,244,233,0.55)] mt-0.5">
                  Actionable study drills tailored to your weak points
                </p>
              </div>

              <button
                onClick={togglePlanCompletion}
                className={`px-4 py-2 rounded-full text-xs font-bold transition-all flex items-center gap-2 cursor-pointer ${
                  improvementPlan.completed
                    ? 'bg-[rgba(127,227,185,0.2)] text-[#7FE3B9] border border-[rgba(127,227,185,0.4)] shadow-[0_0_15px_rgba(127,227,185,0.3)]'
                    : 'bg-[rgba(147,80,115,0.3)] text-[#F8F4E9] border border-[rgba(147,80,115,0.4)] hover:bg-[#935073]'
                }`}
              >
                {improvementPlan.completed ? (
                  <>
                    <CheckCircle2 className="w-4 h-4" />
                    <span>Plan Completed</span>
                  </>
                ) : (
                  <>
                    <Flame className="w-4 h-4 text-[#F6DBC0]" />
                    <span>Mark Plan as Done</span>
                  </>
                )}
              </button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* Focus Areas */}
              <div className="space-y-3">
                <span className="text-xs font-bold uppercase tracking-wider text-[#F6DBC0] block">
                  Key Technical Focus Areas:
                </span>
                <div className="space-y-2 text-xs">
                  {improvementPlan.focusAreas.map((area, idx) => (
                    <div key={idx} className="p-3 rounded-2xl bg-[rgba(26,15,34,0.6)] border border-[rgba(248,244,233,0.06)] flex items-start gap-2.5">
                      <span className="w-5 h-5 rounded-full bg-[rgba(147,80,115,0.4)] text-[#F6DBC0] font-bold text-[10px] flex items-center justify-center shrink-0 mt-0.5">
                        {idx + 1}
                      </span>
                      <span className="text-[rgba(248,244,233,0.85)] leading-relaxed font-medium">{area}</span>
                    </div>
                  ))}
                </div>
              </div>

              {/* Actionable Practice Drills */}
              <div className="space-y-3">
                <span className="text-xs font-bold uppercase tracking-wider text-[#7FE3B9] block">
                  Actionable Practice Drills:
                </span>
                <div className="space-y-2 text-xs">
                  {improvementPlan.suggestedPractice.map((drill, idx) => (
                    <div key={idx} className="p-3 rounded-2xl bg-[rgba(26,15,34,0.6)] border border-[rgba(248,244,233,0.06)] flex items-start gap-2.5">
                      <span className="w-5 h-5 rounded-full bg-[rgba(127,227,185,0.2)] text-[#7FE3B9] font-bold text-[10px] flex items-center justify-center shrink-0 mt-0.5">
                        <Check className="w-3 h-3" />
                      </span>
                      <span className="text-[rgba(248,244,233,0.85)] leading-relaxed font-medium">{drill}</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </GlassCard>
        )}

        {/* TRANSCRIPT WITH INLINE HIGHLIGHTED CRITIQUES (Prompt Requirement) */}
        <GlassCard className="p-6 sm:p-7 space-y-5">
          <div className="flex items-center justify-between pb-3 border-b border-[rgba(248,244,233,0.06)]">
            <div>
              <h3 className="text-sm font-extrabold uppercase tracking-widest text-[#F8F4E9] flex items-center gap-2">
                <MessageSquare className="w-4 h-4 text-[#F6DBC0]" />
                Question-by-Question Transcript & AI Critiques
              </h3>
              <p className="text-xs text-[rgba(248,244,233,0.5)] mt-0.5">
                Click any question below to inspect your spoken transcript and critique breakdown
              </p>
            </div>
          </div>

          <div className="space-y-3">
            {questions.map((q, idx) => {
              const isExpanded = expandedQuestionId === q.id;
              const ans = q.answer;

              return (
                <div
                  key={q.id}
                  className="rounded-2xl border border-[rgba(248,244,233,0.08)] bg-[rgba(26,15,34,0.6)] overflow-hidden transition-all"
                >
                  <button
                    onClick={() => setExpandedQuestionId(isExpanded ? null : q.id)}
                    className="w-full p-4 sm:p-5 flex items-center justify-between text-left hover:bg-[rgba(147,80,115,0.15)] transition-colors cursor-pointer"
                  >
                    <div className="flex items-center gap-3 min-w-0 pr-4">
                      <span className="w-8 h-8 rounded-xl bg-[rgba(80,45,85,0.7)] border border-[rgba(147,80,115,0.4)] text-[#F6DBC0] font-black text-xs flex items-center justify-center shrink-0">
                        Q{idx + 1}
                      </span>
                      <div className="min-w-0">
                        <span className="text-xs sm:text-sm font-bold text-[#F8F4E9] block truncate">
                          {q.questionText}
                        </span>
                        <span className="text-[10px] text-[rgba(248,244,233,0.5)] font-mono uppercase tracking-wider">
                          {q.questionType.replace('_', ' ')}
                        </span>
                      </div>
                    </div>

                    <div className="flex items-center gap-3 shrink-0">
                      {ans?.technicalScore !== undefined && (
                        <span className="text-xs font-mono font-bold text-[#F6DBC0] tabular-nums">
                          {ans.technicalScore}%
                        </span>
                      )}
                      {isExpanded ? (
                        <ChevronUp className="w-4 h-4 text-[rgba(248,244,233,0.6)]" />
                      ) : (
                        <ChevronDown className="w-4 h-4 text-[rgba(248,244,233,0.6)]" />
                      )}
                    </div>
                  </button>

                  {/* Expanded Body */}
                  {isExpanded && (
                    <div className="p-4 sm:p-5 pt-0 border-t border-[rgba(248,244,233,0.06)] space-y-4 text-xs mt-2">
                      {/* Transcript */}
                      <div className="p-3.5 rounded-2xl bg-[rgba(42,27,51,0.7)] border border-[rgba(248,244,233,0.06)] space-y-1.5">
                        <span className="text-[10px] font-bold uppercase tracking-wider text-[rgba(248,244,233,0.45)]">
                          Your Spoken / Submitted Response:
                        </span>
                        <p className="text-[rgba(248,244,233,0.85)] font-mono leading-relaxed">
                          {ans?.transcriptText || 'No transcript text submitted for this question.'}
                        </p>
                      </div>

                      {/* AI Critique with highlighted callout */}
                      <div className="p-3.5 rounded-2xl bg-gradient-to-r from-[rgba(80,45,85,0.4)] to-[rgba(147,80,115,0.25)] border border-[rgba(147,80,115,0.35)] space-y-1.5">
                        <div className="flex items-center gap-1.5 text-[#F6DBC0] font-bold text-xs">
                          <Sparkles className="w-3.5 h-3.5" />
                          <span>Gemini AI Speech & Technical Critique:</span>
                        </div>
                        <p className="text-[#F8F4E9] leading-relaxed">
                          {ans?.aiFeedback || 'Answer submitted and evaluated by model.'}
                        </p>
                      </div>

                      {/* Score Breakdown Pills */}
                      <div className="grid grid-cols-3 gap-2 text-center pt-1">
                        <div className="p-2 rounded-xl bg-[rgba(26,15,34,0.5)] border border-[rgba(248,244,233,0.06)]">
                          <span className="text-[10px] uppercase text-[rgba(248,244,233,0.5)] block">Technical Depth</span>
                          <span className="font-dot text-sm font-black text-[#F6DBC0]">{ans?.technicalScore || 0}%</span>
                        </div>
                        <div className="p-2 rounded-xl bg-[rgba(26,15,34,0.5)] border border-[rgba(248,244,233,0.06)]">
                          <span className="text-[10px] uppercase text-[rgba(248,244,233,0.5)] block">Clarity & Cadence</span>
                          <span className="font-dot text-sm font-black text-[#F6DBC0]">{ans?.communicationScore || 0}%</span>
                        </div>
                        <div className="p-2 rounded-xl bg-[rgba(26,15,34,0.5)] border border-[rgba(248,244,233,0.06)]">
                          <span className="text-[10px] uppercase text-[rgba(248,244,233,0.5)] block">Confidence / Sent.</span>
                          <span className="font-dot text-sm font-black text-[#7FE3B9]">{ans?.sentimentScore || 0}%</span>
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </GlassCard>

        {/* PROCTORING INTEGRITY AUDIT CARD */}
        {session.proctoring && (
          <GlassCard className="p-6 space-y-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-[#F8F4E9]">
                <ShieldCheck className="w-4 h-4 text-[#7FE3B9]" />
                Exam Integrity & Focus Audit
              </div>
              <Badge variant="mint" size="sm">
                Score: {session.proctoring.integrityScore}%
              </Badge>
            </div>
            <p className="text-xs text-[rgba(248,244,233,0.6)]">
              Tab switches: <strong className="text-[#F8F4E9]">{session.proctoring.tabSwitchCount}</strong> · Time away from tab:{' '}
              <strong className="text-[#F8F4E9]">{session.proctoring.totalTimeAwaySeconds}s</strong> · Exam status:{' '}
              <strong className="text-[#7FE3B9] uppercase">{session.proctoring.activeScreenStatus || 'Clean'}</strong>
            </p>
          </GlassCard>
        )}
      </div>

      {/* Share Summary Card Modal */}
      <ShareSummaryCardModal
        isOpen={isShareModalOpen}
        onClose={() => setIsShareModalOpen(false)}
        session={session}
        candidateName={user?.name || 'Candidate'}
      />
    </div>
  );
};
