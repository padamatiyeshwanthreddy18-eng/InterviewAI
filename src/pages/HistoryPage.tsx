import React, { useEffect, useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { InterviewSession, TrackType } from '../types';
import {
  GlassCard,
  PrimaryButton,
  PillButton,
  Badge,
  DataTable,
  Column,
} from '../components/ui';
import {
  ResponsiveContainer,
  LineChart,
  Line,
  XAxis,
  YAxis,
  Tooltip,
  CartesianGrid,
} from 'recharts';
import {
  History,
  Search,
  Filter,
  TrendingUp,
  ChevronRight,
  Sparkles,
  PlayCircle,
  FileText,
} from 'lucide-react';

export const HistoryPage: React.FC = () => {
  const { token, user, isLoading: isAuthLoading } = useAuth();
  const navigate = useNavigate();

  const [sessions, setSessions] = useState<InterviewSession[]>([]);
  const [filteredSessions, setFilteredSessions] = useState<InterviewSession[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedTrack, setSelectedTrack] = useState<string>('ALL');
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchSessions = async () => {
    if (!token) return;
    try {
      setError(null);
      const res = await fetch('/api/sessions', {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (res.ok) {
        const data = await res.json();
        setSessions(data.sessions || []);
        setFilteredSessions(data.sessions || []);
      } else {
        setError('Failed to load session history. Please try again.');
      }
    } catch (err) {
      console.error('Failed to load history sessions:', err);
      setError('Network error connecting to session history service.');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    if (isAuthLoading) return;

    if (!user) {
      navigate('/auth');
      return;
    }

    fetchSessions();

    const handleFocus = () => fetchSessions();
    window.addEventListener('focus', handleFocus);
    return () => window.removeEventListener('focus', handleFocus);
  }, [user, token, navigate, isAuthLoading]);

  // Filter effect
  useEffect(() => {
    let result = sessions;
    if (selectedTrack !== 'ALL') {
      result = result.filter((s) => s.track === selectedTrack);
    }
    if (searchTerm.trim()) {
      const term = searchTerm.toLowerCase();
      result = result.filter(
        (s) =>
          s.track.toLowerCase().includes(term) ||
          s.difficulty.toLowerCase().includes(term) ||
          (s.jobDescription && s.jobDescription.toLowerCase().includes(term))
      );
    }
    setFilteredSessions(result);
  }, [searchTerm, selectedTrack, sessions]);

  // Chart Data: chronologically ordered scores
  const chartData = [...sessions]
    .filter((s) => s.status === 'completed' && s.overallScore !== undefined)
    .sort((a, b) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime())
    .map((s) => ({
      date: new Date(s.createdAt).toLocaleDateString('en-US', {
        month: 'short',
        day: 'numeric',
      }),
      score: s.overallScore || 0,
      track: s.track,
    }));

  if (isLoading) {
    return (
      <div className="min-h-[85vh] py-8 px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto space-y-8 animate-pulse text-[#F8F4E9]">
        <div className="h-20 bg-[rgba(42,27,51,0.6)] rounded-2xl w-full border border-[rgba(248,244,233,0.08)]" />
        <div className="h-64 bg-[rgba(42,27,51,0.6)] rounded-3xl w-full border border-[rgba(248,244,233,0.08)]" />
        <div className="h-80 bg-[rgba(42,27,51,0.6)] rounded-3xl w-full border border-[rgba(248,244,233,0.08)]" />
      </div>
    );
  }

  const columns: Column<InterviewSession>[] = [
    {
      key: 'track',
      header: 'Role Track',
      render: (s) => (
        <span className="font-bold text-[#F8F4E9] flex items-center gap-2">
          <span className="w-6 h-6 rounded-lg bg-[rgba(80,45,85,0.7)] text-[#F6DBC0] flex items-center justify-center text-[10px] font-black border border-[rgba(147,80,115,0.3)]">
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
      key: 'createdAt',
      header: 'Date Recorded',
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
      header: 'AI Score',
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
          className="inline-flex items-center gap-1 px-3 py-1.5 rounded-full text-xs font-bold text-[#F8F4E9] bg-[rgba(147,80,115,0.3)] hover:bg-[#935073] border border-[rgba(147,80,115,0.4)] transition-all cursor-pointer"
        >
          <span>{s.status === 'completed' ? 'View Transcript' : 'Resume'}</span>
          <ChevronRight className="w-3 h-3 text-[#F6DBC0]" />
        </button>
      ),
    },
  ];

  const tracksFilterList = [
    'ALL',
    'SDE',
    'Frontend Engineer',
    'Full Stack Engineer',
    'Data Scientist',
    'DevOps & Cloud',
    'Cybersecurity',
    'Product Manager',
    'HR/Behavioral',
  ];

  return (
    <div className="w-full min-h-[calc(100vh-4rem)] py-8 px-4 sm:px-6 lg:px-8 text-[#F8F4E9]">
      <div className="max-w-7xl mx-auto space-y-6">
        {/* Page Header Banner */}
        <GlassCard className="p-6 sm:p-8 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 border-[rgba(147,80,115,0.35)] shadow-[0_20px_45px_rgba(15,7,20,0.8)]">
          <div>
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-[rgba(147,80,115,0.3)] border border-[rgba(246,219,192,0.3)] text-[#F6DBC0] text-xs font-bold mb-2">
              <History className="w-3.5 h-3.5 text-[#F6DBC0]" />
              <span>Interview Practice Log & Progression</span>
            </div>
            <h1 className="text-3xl sm:text-4xl font-black text-[#F8F4E9] tracking-tight">
              Session History & Critiques
            </h1>
            <p className="text-xs text-[rgba(248,244,233,0.65)] font-medium mt-1">
              Review your past mock sessions, transcripts, audio feedback, and score trajectory
            </p>
          </div>

          <PrimaryButton
            onClick={() => navigate('/track-selection')}
            icon={<PlayCircle className="w-4 h-4 text-[#F6DBC0]" />}
            size="md"
          >
            Start New Round
          </PrimaryButton>
        </GlassCard>

        {error && (
          <div className="p-4 bg-[rgba(229,115,115,0.15)] border border-[rgba(229,115,115,0.4)] rounded-2xl text-xs text-[#E57373] flex items-center justify-between gap-3 font-semibold">
            <div className="flex items-center gap-2">
              <AlertCircle className="w-4 h-4 shrink-0" />
              <span>{error}</span>
            </div>
            <button
              onClick={fetchSessions}
              className="px-3 py-1 bg-[rgba(229,115,115,0.25)] hover:bg-[rgba(229,115,115,0.4)] rounded-xl text-xs font-bold transition cursor-pointer text-[#F8F4E9]"
            >
              Retry
            </button>
          </div>
        )}

        {/* Score Trend Line Chart Across All Sessions (Requires at least 2 sessions) */}
        <GlassCard className="p-6 space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-xs font-bold uppercase tracking-widest text-[#F8F4E9] flex items-center gap-2">
              <TrendingUp className="w-4 h-4 text-[#F6DBC0]" />
              Overall Performance Progression Over Time
            </h3>
            <span className="text-[10px] font-mono text-[rgba(248,244,233,0.5)]">
              {chartData.length} Completed Round{chartData.length !== 1 ? 's' : ''} Evaluated
            </span>
          </div>

          <div className="h-56 w-full pt-2">
            {chartData.length >= 2 ? (
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={chartData} margin={{ top: 10, right: 20, left: -20, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="rgba(248,244,233,0.05)" />
                  <XAxis dataKey="date" stroke="rgba(248,244,233,0.4)" tick={{ fontSize: 11 }} />
                  <YAxis domain={[0, 100]} stroke="rgba(248,244,233,0.4)" tick={{ fontSize: 11 }} />
                  <Tooltip
                    content={({ active, payload }) => {
                      if (active && payload && payload.length) {
                        return (
                          <div className="bg-[rgba(26,15,34,0.95)] border border-[rgba(147,80,115,0.4)] text-[#F8F4E9] p-3 rounded-2xl text-xs space-y-1 shadow-xl">
                            <p className="font-bold text-[#F6DBC0]">{payload[0]?.payload?.track}</p>
                            <p className="text-[rgba(248,244,233,0.7)] font-mono">{payload[0]?.payload?.date}</p>
                            <p className="font-dot text-sm font-black text-[#7FE3B9]">Score: {payload[0]?.value}%</p>
                          </div>
                        );
                      }
                      return null;
                    }}
                  />
                  <Line
                    type="monotone"
                    dataKey="score"
                    stroke="#935073"
                    strokeWidth={3}
                    dot={{ fill: '#F6DBC0', r: 5, stroke: '#935073', strokeWidth: 2 }}
                    activeDot={{ r: 8, fill: '#F8F4E9', stroke: '#935073', strokeWidth: 3 }}
                  />
                </LineChart>
              </ResponsiveContainer>
            ) : (
              <div className="h-full flex flex-col items-center justify-center text-[rgba(248,244,233,0.5)] text-xs font-medium space-y-1 text-center p-4">
                <p>
                  {chartData.length === 1
                    ? '1 session completed. Complete at least one more session to unlock score trend charts!'
                    : 'No completed session data yet. Complete your first mock round to track score trajectory!'}
                </p>
              </div>
            )}
          </div>
        </GlassCard>

        {/* Filters and Search Bar */}
        <GlassCard className="p-4 sm:p-5 flex flex-col md:flex-row items-center justify-between gap-4">
          {/* Search Input */}
          <div className="relative w-full md:w-80">
            <Search className="w-4 h-4 text-[rgba(248,244,233,0.4)] absolute left-3.5 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="Search by track, difficulty, keyword..."
              className="w-full bg-[rgba(26,15,34,0.7)] border border-[rgba(248,244,233,0.08)] rounded-full pl-9 pr-4 py-2 text-xs text-[#F8F4E9] placeholder-[rgba(248,244,233,0.35)] outline-none focus:border-[#935073] font-medium"
            />
          </div>

          {/* Filter Pills */}
          <div className="flex flex-wrap items-center gap-1.5 w-full md:w-auto">
            {tracksFilterList.map((track) => (
              <button
                key={track}
                onClick={() => setSelectedTrack(track)}
                className={`px-3 py-1 rounded-full text-xs font-bold transition-all cursor-pointer ${
                  selectedTrack === track
                    ? 'bg-[#935073] text-[#F8F4E9] border border-[rgba(246,219,192,0.3)] shadow-[0_0_12px_rgba(147,80,115,0.4)]'
                    : 'bg-[rgba(26,15,34,0.6)] text-[rgba(248,244,233,0.6)] border border-[rgba(248,244,233,0.06)] hover:text-[#F8F4E9]'
                }`}
              >
                {track}
              </button>
            ))}
          </div>
        </GlassCard>

        {/* Sessions Table with Highlighting or Friendly Empty State */}
        {sessions.length === 0 ? (
          <GlassCard className="p-10 text-center space-y-4 flex flex-col items-center justify-center">
            <div className="w-14 h-14 rounded-2xl bg-[rgba(80,45,85,0.4)] border border-[rgba(246,219,192,0.3)] text-[#F6DBC0] flex items-center justify-center shadow-lg">
              <History className="w-7 h-7 text-[#F6DBC0]" />
            </div>
            <div className="space-y-1 max-w-md">
              <h3 className="text-lg font-black text-[#F8F4E9]">No Interview Sessions Yet</h3>
              <p className="text-xs text-[rgba(248,244,233,0.65)] leading-relaxed">
                You haven't practiced any mock rounds yet. Launch a session in any role track to start building your critique history!
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
          <GlassCard className="p-6">
            <DataTable
              columns={columns}
              data={filteredSessions}
              highlightRowIndex={0}
              onRowClick={(s) =>
                navigate(s.status === 'completed' ? `/results/${s.id}` : `/interview/${s.id}`)
              }
              emptyText="No matching interview sessions found. Try changing your filters!"
            />
          </GlassCard>
        )}
      </div>
    </div>
  );
};
