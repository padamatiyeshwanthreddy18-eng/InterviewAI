import React, { useEffect, useState, useCallback } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { InterviewSession, ROLE_TRACKS, TrackType } from '../types';
import { PreparationTips } from '../components/PreparationTips';
import { WeeklyTipNotificationCard } from '../components/WeeklyTipNotificationCard';
import {
  GlassCard,
  StatCard,
  PrimaryButton,
  PillButton,
  DataTable,
  Column,
  SidebarNav,
  Badge,
} from '../components/ui';
import {
  PlayCircle,
  History,
  Trophy,
  Target,
  Sparkles,
  Clock,
  ChevronRight,
  AlertCircle,
  RefreshCw,
  Layers,
  ArrowRight,
  CheckCircle2,
} from 'lucide-react';

export const DashboardPage: React.FC = () => {
  const { user, token, isLoading: isAuthLoading } = useAuth();
  const navigate = useNavigate();
  const [sessions, setSessions] = useState<InterviewSession[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchSessions = useCallback(async () => {
    if (!token) return;
    try {
      setError(null);
      const res = await fetch('/api/sessions', {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (res.ok) {
        const data = await res.json();
        setSessions(data.sessions || []);
      } else {
        setError('Failed to fetch your interview sessions. Please retry.');
      }
    } catch (err) {
      console.error('Failed to fetch dashboard sessions:', err);
      setError('Network error connecting to session service.');
    } finally {
      setIsLoading(false);
    }
  }, [token]);

  useEffect(() => {
    if (isAuthLoading) return;

    if (!user) {
      navigate('/auth');
      return;
    }

    fetchSessions();

    // Real-time synchronization: re-fetch on window focus and every 10s
    const handleFocus = () => fetchSessions();
    window.addEventListener('focus', handleFocus);
    const interval = setInterval(fetchSessions, 10000);

    return () => {
      window.removeEventListener('focus', handleFocus);
      clearInterval(interval);
    };
  }, [user, isAuthLoading, navigate, fetchSessions]);

  if (isLoading) {
    return (
      <div className="min-h-[85vh] py-8 px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto space-y-8 animate-pulse text-[#F8F4E9]">
        <div className="bg-[rgba(42,27,51,0.6)] rounded-3xl p-8 h-48 w-full border border-[rgba(248,244,233,0.08)]" />
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {[...Array(4)].map((_, i) => (
            <div
              key={i}
              className="bg-[rgba(42,27,51,0.6)] p-5 rounded-2xl h-28 w-full border border-[rgba(248,244,233,0.08)]"
            />
          ))}
        </div>
      </div>
    );
  }

  const completedSessions = sessions.filter(
    (s) => s.status === 'completed' && s.overallScore !== undefined
  );
  const inProgressSessions = sessions.filter((s) => s.status === 'in_progress');

  const avgScore =
    completedSessions.length > 0
      ? Math.round(
          completedSessions.reduce((acc, s) => acc + (s.overallScore || 0), 0) /
            completedSessions.length
        )
      : null;

  const latestSession = sessions.length > 0 ? sessions[0] : null;

  // Real delta calculated ONLY when at least 2 completed sessions exist
  let scoreDelta: { value: string; isPositive: boolean; period: string } | undefined = undefined;
  if (completedSessions.length >= 2) {
    const latestScore = completedSessions[0].overallScore || 0;
    const prevScore = completedSessions[1].overallScore || 0;
    const diff = latestScore - prevScore;
    scoreDelta = {
      value: `${diff >= 0 ? '+' : ''}${diff}%`,
      isPositive: diff >= 0,
      period: 'vs previous completed round',
    };
  }

  // Table columns for recent sessions
  const sessionColumns: Column<InterviewSession>[] = [
    {
      key: 'track',
      header: 'Role Track',
      render: (s) => (
        <span className="font-bold text-[#F8F4E9] flex items-center gap-2">
          <span className="w-6 h-6 rounded-lg bg-[rgba(80,45,85,0.6)] text-[#F6DBC0] flex items-center justify-center text-[10px] font-black border border-[rgba(147,80,115,0.3)]">
            {s.track.substring(0, 2).toUpperCase()}
          </span>
          {s.track}
        </span>
      ),
    },
    {
      key: 'difficulty',
      header: 'Difficulty',
      render: (s) => (
        <span className="text-[11px] text-[rgba(248,244,233,0.65)] font-mono">
          {s.difficulty}
        </span>
      ),
    },
    {
      key: 'date',
      header: 'Date',
      render: (s) => (
        <span className="text-[11px] text-[rgba(248,244,233,0.5)] font-mono">
          {new Date(s.createdAt).toLocaleDateString('en-US', {
            month: 'short',
            day: 'numeric',
            year: 'numeric',
          })}
        </span>
      ),
    },
    {
      key: 'status',
      header: 'Status',
      render: (s) => (
        <span
          className={`inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider ${
            s.status === 'completed'
              ? 'bg-[rgba(127,227,185,0.12)] text-[#7FE3B9] border border-[rgba(127,227,185,0.3)]'
              : 'bg-[rgba(246,219,192,0.15)] text-[#F6DBC0] border border-[rgba(246,219,192,0.3)] animate-pulse'
          }`}
        >
          {s.status === 'completed' ? 'Completed' : 'In Progress'}
        </span>
      ),
    },
    {
      key: 'overallScore',
      header: 'Score',
      align: 'right',
      render: (s) => (
        <span className="font-dot text-sm font-black text-[#F6DBC0] tabular-nums">
          {s.overallScore !== undefined ? `${s.overallScore}%` : '—'}
        </span>
      ),
    },
    {
      key: 'action',
      header: 'Action',
      align: 'right',
      render: (s) => (
        <button
          onClick={(e) => {
            e.stopPropagation();
            navigate(s.status === 'completed' ? `/results/${s.id}` : `/interview/${s.id}`);
          }}
          className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[11px] font-bold text-[#F8F4E9] bg-[rgba(147,80,115,0.3)] hover:bg-[#935073] border border-[rgba(147,80,115,0.4)] transition-all cursor-pointer"
        >
          <span>{s.status === 'completed' ? 'Review' : 'Resume'}</span>
          <ChevronRight className="w-3 h-3 text-[#F6DBC0]" />
        </button>
      ),
    },
  ];

  return (
    <div className="w-full min-h-[calc(100vh-4rem)] py-6 px-4 sm:px-6 lg:px-8 text-[#F8F4E9]">
      <div className="max-w-7xl mx-auto flex flex-col lg:flex-row gap-6">
        {/* LEFT SIDEBAR NAVIGATION */}
        <div className="hidden xl:block">
          <SidebarNav />
        </div>

        {/* MAIN DASHBOARD CONTENT AREA */}
        <div className="flex-1 space-y-6">
          {/* ERROR ALERT WITH RETRY */}
          {error && (
            <div className="p-4 bg-[rgba(229,115,115,0.15)] border border-[rgba(229,115,115,0.4)] rounded-2xl text-xs text-[#E57373] flex items-center justify-between gap-3 font-semibold">
              <div className="flex items-center gap-2.5">
                <AlertCircle className="w-4 h-4 shrink-0" />
                <span>{error}</span>
              </div>
              <button
                onClick={fetchSessions}
                className="px-3 py-1 bg-[rgba(229,115,115,0.25)] hover:bg-[rgba(229,115,115,0.4)] rounded-xl text-xs font-bold transition flex items-center gap-1.5 cursor-pointer text-[#F8F4E9]"
              >
                <RefreshCw className="w-3.5 h-3.5" />
                <span>Retry</span>
              </button>
            </div>
          )}

          {/* HERO BANNER WITH REAL USER PROFILE GREETING */}
          <GlassCard className="relative overflow-hidden p-6 sm:p-8 flex flex-col md:flex-row items-center justify-between gap-6 border-[rgba(147,80,115,0.35)] shadow-[0_20px_45px_-12px_rgba(15,7,20,0.8),0_0_30px_rgba(147,80,115,0.2)]">
            <div className="space-y-3 z-10 text-center md:text-left flex-1">
              <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-[rgba(147,80,115,0.3)] border border-[rgba(246,219,192,0.3)] text-[#F6DBC0] text-xs font-bold shadow-xs">
                <Sparkles className="w-3.5 h-3.5 text-[#F6DBC0]" />
                <span>InterviewAI · Live Voice Coach</span>
              </div>

              <h1 className="text-3xl sm:text-4xl font-black text-[#F8F4E9] tracking-tight">
                Welcome back, {user?.name || 'Candidate'}!
              </h1>

              <p className="text-[rgba(248,244,233,0.7)] text-xs sm:text-sm max-w-xl leading-relaxed">
                {completedSessions.length > 0 ? (
                  <>
                    You've completed{' '}
                    <strong className="text-[#F8F4E9]">{completedSessions.length}</strong> practice{' '}
                    session{completedSessions.length > 1 ? 's' : ''}. Your recorded average evaluation
                    score is{' '}
                    <strong className="text-[#F6DBC0] font-dot">{avgScore}%</strong> across completed
                    rounds.
                  </>
                ) : (
                  <>
                    Welcome to your interview coaching workspace. Start your first mock interview to
                    receive real-time speech transcription, technical scorecards, and AI critiques.
                  </>
                )}
              </p>

              <div className="flex flex-wrap items-center justify-center md:justify-start gap-3 pt-2">
                <PrimaryButton
                  onClick={() => navigate('/track-selection')}
                  icon={<PlayCircle className="w-4 h-4" />}
                  size="md"
                >
                  Start New Interview Session
                </PrimaryButton>

                <PillButton
                  onClick={() => navigate('/history')}
                  icon={<History className="w-4 h-4" />}
                  size="md"
                >
                  View Historical Critiques
                </PillButton>
              </div>
            </div>

            {/* Quick Session Status Pill */}
            <div className="shrink-0 z-10 p-5 rounded-3xl bg-[rgba(26,15,34,0.5)] border border-[rgba(248,244,233,0.06)] shadow-inner flex flex-col items-center justify-center text-center min-w-[160px]">
              <span className="text-[10px] uppercase tracking-widest text-[rgba(248,244,233,0.5)] font-mono block mb-1">
                Completed Rounds
              </span>
              <span className="text-4xl font-black font-dot text-[#F8F4E9]">
                {completedSessions.length}
              </span>
              <span className="text-xs text-[#F6DBC0] mt-1 font-bold">
                {avgScore !== null ? `Avg: ${avgScore}%` : 'No score yet'}
              </span>
            </div>
          </GlassCard>

          {/* REAL STAT CARDS (ONLY DERIVED METRICS) */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            <StatCard
              label="Sessions Completed"
              value={completedSessions.length}
              unit="rounds"
              icon={<Target className="w-4 h-4" />}
              delta={scoreDelta}
              actionLabel="View all"
              onAction={() => navigate('/history')}
            />

            <StatCard
              label="Average Overall Score"
              value={avgScore !== null ? `${avgScore}%` : '—'}
              icon={<Trophy className="w-4 h-4" />}
              actionLabel={completedSessions.length > 0 ? 'Across completed' : 'No data'}
            />

            <StatCard
              label="In Progress Sessions"
              value={inProgressSessions.length}
              unit="rounds"
              icon={<Clock className="w-4 h-4" />}
              actionLabel={inProgressSessions.length > 0 ? 'Resume session' : 'All clear'}
              onAction={
                inProgressSessions.length > 0
                  ? () => navigate(`/interview/${inProgressSessions[0].id}`)
                  : undefined
              }
            />

            <StatCard
              label="Latest Role Track"
              value={latestSession ? latestSession.track.split(' ')[0] : '—'}
              icon={<Layers className="w-4 h-4 text-[#F6DBC0]" />}
              actionLabel={latestSession ? latestSession.difficulty : 'Select track'}
              onAction={() => navigate('/track-selection')}
            />
          </div>

          {/* RECENT SESSIONS OR FRIENDLY EMPTY STATE */}
          {sessions.length === 0 ? (
            <GlassCard className="p-8 sm:p-10 text-center space-y-4 flex flex-col items-center justify-center">
              <div className="w-14 h-14 rounded-2xl bg-[rgba(80,45,85,0.4)] border border-[rgba(246,219,192,0.3)] text-[#F6DBC0] flex items-center justify-center shadow-lg">
                <PlayCircle className="w-7 h-7 text-[#F6DBC0]" />
              </div>
              <div className="space-y-1 max-w-md">
                <h3 className="text-lg font-black text-[#F8F4E9]">
                  No Practice Sessions Completed Yet
                </h3>
                <p className="text-xs text-[rgba(248,244,233,0.65)] leading-relaxed">
                  Select from {ROLE_TRACKS.length} specialized industry tracks (SDE, System Design,
                  AI/ML, Product, etc.) and begin your voice interview training with real-time feedback.
                </p>
              </div>
              <PrimaryButton
                onClick={() => navigate('/track-selection')}
                icon={<PlayCircle className="w-4 h-4" />}
                size="md"
              >
                Start Your First Mock Interview
              </PrimaryButton>
            </GlassCard>
          ) : (
            <GlassCard className="flex flex-col">
              <div className="flex items-center justify-between mb-4">
                <div>
                  <h3 className="text-sm font-extrabold text-[#F8F4E9] flex items-center gap-2">
                    <Clock className="w-4 h-4 text-[#F6DBC0]" />
                    Recent Practice Sessions
                  </h3>
                  <p className="text-xs text-[rgba(248,244,233,0.5)]">
                    Evaluated by Gemini AI voice coach with speech and technical critiques
                  </p>
                </div>

                <Link
                  to="/history"
                  className="text-xs text-[#F6DBC0] hover:underline font-bold flex items-center gap-1"
                >
                  <span>View Full History ({sessions.length})</span>
                  <ChevronRight className="w-3.5 h-3.5" />
                </Link>
              </div>

              <DataTable
                columns={sessionColumns}
                data={sessions.slice(0, 5)}
                highlightRowIndex={0}
                onRowClick={(s) =>
                  navigate(s.status === 'completed' ? `/results/${s.id}` : `/interview/${s.id}`)
                }
                emptyText="No practice sessions completed yet. Select a track to start!"
              />
            </GlassCard>
          )}

          {/* ROLE TRACKS QUICK LAUNCHER GRID (All 10 Real Tracks) */}
          <GlassCard className="p-6 space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-sm font-extrabold text-[#F8F4E9] flex items-center gap-2">
                  <Layers className="w-4 h-4 text-[#F6DBC0]" />
                  Explore Role Tracks ({ROLE_TRACKS.length} Roles)
                </h3>
                <p className="text-xs text-[rgba(248,244,233,0.5)]">
                  Pick a specialized track to calibrate difficulty and target company presets
                </p>
              </div>
              <Link
                to="/track-selection"
                className="text-xs text-[#F6DBC0] hover:underline font-bold flex items-center gap-1"
              >
                <span>Browse All</span>
                <ChevronRight className="w-3.5 h-3.5" />
              </Link>
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-2.5">
              {ROLE_TRACKS.map((track) => (
                <button
                  key={track}
                  onClick={() => navigate(`/track-selection?track=${encodeURIComponent(track)}`)}
                  className="p-3 rounded-xl bg-[rgba(26,15,34,0.6)] hover:bg-[rgba(147,80,115,0.25)] border border-[rgba(248,244,233,0.06)] hover:border-[rgba(147,80,115,0.4)] text-left transition-all group cursor-pointer"
                >
                  <span className="text-xs font-bold text-[#F8F4E9] group-hover:text-[#F6DBC0] block truncate">
                    {track}
                  </span>
                  <span className="text-[10px] text-[rgba(248,244,233,0.45)] font-mono flex items-center gap-1 mt-1">
                    <span>Practice Mock</span>
                    <ArrowRight className="w-2.5 h-2.5 text-[#F6DBC0] opacity-0 group-hover:opacity-100 transition-opacity" />
                  </span>
                </button>
              ))}
            </div>
          </GlassCard>

          {/* PREPARATION TIPS & WEEKLY COACHING CARDS */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <PreparationTips />
            <WeeklyTipNotificationCard />
          </div>
        </div>
      </div>
    </div>
  );
};
