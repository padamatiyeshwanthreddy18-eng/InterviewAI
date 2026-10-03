import React, { useEffect, useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { AdminAnalytics, InterviewSession, User } from '../types';
import {
  ResponsiveContainer,
  LineChart,
  Line,
  BarChart,
  Bar,
  PieChart,
  Pie,
  Cell,
  XAxis,
  YAxis,
  Tooltip,
  CartesianGrid,
} from 'recharts';
import {
  ShieldCheck,
  Users,
  Target,
  Trophy,
  Filter,
  HelpCircle,
  BarChart2,
  ListFilter,
  CheckCircle2,
  Lock,
  KeyRound,
  Download,
  RefreshCw,
  Search,
  FileText,
  Clock,
  Sparkles,
  ExternalLink,
  ChevronRight,
  Trash2,
  X,
  Award,
  AlertCircle,
  TrendingUp,
  BrainCircuit,
  Eye,
  CheckCircle,
} from 'lucide-react';
import { GlassCard, PrimaryButton, PillButton, Badge } from '../components/ui';
import { useSessions } from '../hooks/useFirestoreData';

interface CandidateDetail {
  user: User;
  resume: {
    fileName: string;
    parsedSkills: string[];
    parsedExperience: string;
    uploadedAt: string;
  } | null;
  sessions: InterviewSession[];
}

export const AdminDashboardPage: React.FC = () => {
  const { user, token, isLoading: isAuthLoading, claimAdminRole, login } = useAuth();
  const navigate = useNavigate();

  const [activeTab, setActiveTab] = useState<'candidates' | 'analytics' | 'sessions' | 'questions'>('candidates');
  const [analytics, setAnalytics] = useState<AdminAnalytics | null>(null);
  const [usersList, setUsersList] = useState<any[]>([]);
  const [sessionsList, setSessionsList] = useState<any[]>([]);
  const [questionBank, setQuestionBank] = useState<any[]>([]);

  const { sessions: firestoreAdminSessions } = useSessions(undefined, user?.role === 'admin');

  useEffect(() => {
    if (firestoreAdminSessions && firestoreAdminSessions.length > 0) {
      setSessionsList((prev) => {
        if (prev.length === 0) return firestoreAdminSessions;
        // Merge any new real-time sessions
        const existingIds = new Set(prev.map((s) => s.id));
        const newOnes = firestoreAdminSessions.filter((s) => !existingIds.has(s.id));
        return [...newOnes, ...prev];
      });
    }
  }, [firestoreAdminSessions]);

  // Search & Filters
  const [searchQuery, setSearchQuery] = useState('');
  const [userFilter, setUserFilter] = useState<'all' | 'registered' | 'guests'>('all');
  const [selectedTrackFilter, setSelectedTrackFilter] = useState<string>('');
  const [selectedDifficultyFilter, setSelectedDifficultyFilter] = useState<string>('');

  // Selected Candidate Modal State
  const [selectedCandidateId, setSelectedCandidateId] = useState<string | null>(null);
  const [candidateDetail, setCandidateDetail] = useState<CandidateDetail | null>(null);
  const [isLoadingCandidate, setIsLoadingCandidate] = useState(false);

  // Owner Passkey Gate State
  const [passkeyInput, setPasskeyInput] = useState('');
  const [passkeyError, setPasskeyError] = useState('');
  const [isClaiming, setIsClaiming] = useState(false);

  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);

  const fetchAdminData = async () => {
    if (!token) return;
    try {
      setIsRefreshing(true);
      const [resAnalytics, resUsers, resSessions, resBank] = await Promise.all([
        fetch('/api/admin/analytics', { headers: { Authorization: `Bearer ${token}` } }),
        fetch('/api/admin/users', { headers: { Authorization: `Bearer ${token}` } }),
        fetch('/api/admin/sessions', { headers: { Authorization: `Bearer ${token}` } }),
        fetch('/api/admin/question-bank', { headers: { Authorization: `Bearer ${token}` } }),
      ]);

      if (resAnalytics.ok) setAnalytics((await resAnalytics.json()).analytics);
      if (resUsers.ok) setUsersList((await resUsers.json()).users || []);
      if (resSessions.ok) setSessionsList((await resSessions.json()).sessions || []);
      if (resBank.ok) setQuestionBank((await resBank.json()).questionBank || []);
    } catch (err) {
      console.error('Failed to load admin analytics:', err);
    } finally {
      setIsLoading(false);
      setIsRefreshing(false);
    }
  };

  useEffect(() => {
    if (isAuthLoading) return;
    if (user?.role === 'admin') {
      fetchAdminData();
    } else {
      setIsLoading(false);
    }
  }, [user, token, isAuthLoading]);

  const handleClaimOwnership = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    setPasskeyError('');
    setIsClaiming(true);
    try {
      const res = await claimAdminRole(passkeyInput.trim() || 'admin123');
      if (res.success) {
        setPasskeyInput('');
        await fetchAdminData();
      } else {
        setPasskeyError(res.error || 'Invalid passkey');
      }
    } catch (err: any) {
      setPasskeyError(err.message || 'Verification error');
    } finally {
      setIsClaiming(false);
    }
  };

  const handleViewCandidate = async (candidateId: string) => {
    setSelectedCandidateId(candidateId);
    setIsLoadingCandidate(true);
    try {
      const res = await fetch(`/api/admin/users/${candidateId}/details`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (res.ok) {
        const data = await res.json();
        setCandidateDetail(data);
      }
    } catch (err) {
      console.error('Error fetching candidate detail:', err);
    } finally {
      setIsLoadingCandidate(false);
    }
  };

  const handleDeleteUser = async (userId: string, userName: string) => {
    if (!window.confirm(`Are you sure you want to delete candidate ${userName}? This will remove all their sessions and resume data.`)) {
      return;
    }
    try {
      const res = await fetch(`/api/admin/users/${userId}`, {
        method: 'DELETE',
        headers: { Authorization: `Bearer ${token}` },
      });
      if (res.ok) {
        setUsersList((prev) => prev.filter((u) => u.id !== userId));
        if (selectedCandidateId === userId) {
          setSelectedCandidateId(null);
          setCandidateDetail(null);
        }
      }
    } catch (err) {
      console.error('Error deleting user:', err);
    }
  };

  const handleDeleteSession = async (sessionId: string) => {
    if (!window.confirm('Delete this interview session recording?')) return;
    try {
      const res = await fetch(`/api/admin/sessions/${sessionId}`, {
        method: 'DELETE',
        headers: { Authorization: `Bearer ${token}` },
      });
      if (res.ok) {
        setSessionsList((prev) => prev.filter((s) => s.id !== sessionId));
        if (candidateDetail) {
          setCandidateDetail({
            ...candidateDetail,
            sessions: candidateDetail.sessions.filter((s) => s.id !== sessionId),
          });
        }
      }
    } catch (err) {
      console.error('Error deleting session:', err);
    }
  };

  const handleExportData = () => {
    const dataStr = 'data:text/json;charset=utf-8,' + encodeURIComponent(
      JSON.stringify({ users: usersList, sessions: sessionsList, exportedAt: new Date().toISOString() }, null, 2)
    );
    const downloadAnchor = document.createElement('a');
    downloadAnchor.setAttribute('href', dataStr);
    downloadAnchor.setAttribute('download', `interview_ai_candidates_${new Date().toISOString().split('T')[0]}.json`);
    document.body.appendChild(downloadAnchor);
    downloadAnchor.click();
    downloadAnchor.remove();
  };

  // Filter candidates
  const filteredUsers = usersList.filter((u) => {
    const matchesSearch =
      u.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      u.email.toLowerCase().includes(searchQuery.toLowerCase());

    const isGuest = u.email.includes('@interview.ai') || u.name.includes('Guest');
    if (userFilter === 'registered' && isGuest) return false;
    if (userFilter === 'guests' && !isGuest) return false;

    return matchesSearch;
  });

  // Filter sessions
  const filteredSessions = sessionsList.filter((s) => {
    if (selectedTrackFilter && s.track !== selectedTrackFilter) return false;
    if (selectedDifficultyFilter && s.difficulty !== selectedDifficultyFilter) return false;
    return true;
  });

  // If user is not yet an admin, display the Owner Access Gate
  if (!isAuthLoading && user?.role !== 'admin') {
    return (
      <div className="w-full min-h-[calc(100vh-4rem)] flex items-center justify-center p-4 text-[#F8F4E9]">
        <GlassCard className="max-w-md w-full p-6 sm:p-8 space-y-6 text-center border-[rgba(147,80,115,0.4)] shadow-[0_20px_45px_rgba(15,7,20,0.8),0_0_30px_rgba(147,80,115,0.25)]">
          <div className="w-16 h-16 rounded-2xl bg-[rgba(80,45,85,0.5)] text-[#F6DBC0] mx-auto flex items-center justify-center border border-[rgba(246,219,192,0.3)] shadow-[0_0_20px_rgba(147,80,115,0.4)]">
            <ShieldCheck className="w-8 h-8 text-[#F6DBC0]" />
          </div>

          <div>
            <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-[rgba(147,80,115,0.3)] text-[#F6DBC0] border border-[rgba(246,219,192,0.3)] text-xs font-bold mb-2">
              <Lock className="w-3.5 h-3.5" />
              Website Owner Portal
            </div>
            <h1 className="text-2xl font-black text-[#F8F4E9]">Admin Dashboard Access</h1>
            <p className="text-xs text-[rgba(248,244,233,0.65)] mt-2 leading-relaxed">
              This area is reserved exclusively for the platform owner to monitor enrolled candidates, interview transcripts, and performance analytics.
            </p>
          </div>

          {passkeyError && (
            <div className="bg-[rgba(229,115,115,0.12)] border border-[rgba(229,115,115,0.4)] rounded-xl p-3 text-xs text-[#E57373] font-semibold flex items-center gap-2 text-left">
              <AlertCircle className="w-4 h-4 shrink-0 text-[#E57373]" />
              <span>{passkeyError}</span>
            </div>
          )}

          <form onSubmit={handleClaimOwnership} className="space-y-4 text-left">
            <div>
              <label className="block text-xs font-bold text-[#F8F4E9] uppercase tracking-wider mb-1.5">
                Owner Passkey
              </label>
              <div className="relative">
                <KeyRound className="w-4 h-4 text-[rgba(248,244,233,0.4)] absolute left-3.5 top-3.5" />
                <input
                  type="password"
                  placeholder="Enter admin passkey (e.g. admin123)"
                  value={passkeyInput}
                  onChange={(e) => setPasskeyInput(e.target.value)}
                  className="w-full bg-[rgba(26,15,34,0.6)] border border-[rgba(248,244,233,0.1)] rounded-xl pl-10 pr-4 py-3 text-xs text-[#F8F4E9] placeholder-[rgba(248,244,233,0.3)] outline-none focus:border-[#935073] font-medium"
                />
              </div>
            </div>

            <button
              type="submit"
              disabled={isClaiming}
              className="w-full py-3.5 bg-gradient-to-r from-[#502D55] via-[#935073] to-[#a65d83] hover:from-[#603766] hover:to-[#ba6d95] border border-[rgba(246,219,192,0.3)] text-[#F8F4E9] rounded-xl text-xs font-extrabold shadow-[0_0_20px_rgba(147,80,115,0.4)] transition-all flex items-center justify-center gap-2 cursor-pointer hover:scale-[1.01]"
            >
              {isClaiming ? <RefreshCw className="w-4 h-4 animate-spin text-[#F6DBC0]" /> : <ShieldCheck className="w-4 h-4 text-[#F6DBC0]" />}
              <span>Verify & Open Owner Dashboard</span>
            </button>

            <div className="bg-[rgba(80,45,85,0.3)] border border-[rgba(246,219,192,0.2)] rounded-xl p-2.5 text-[11px] text-[#F6DBC0] flex items-center justify-between">
              <span className="font-semibold">Demo Passkey: <code className="font-mono bg-[rgba(26,15,34,0.6)] px-1.5 py-0.5 rounded font-bold text-[#F8F4E9]">admin123</code></span>
              <button
                type="button"
                onClick={() => {
                  setPasskeyInput('admin123');
                }}
                className="text-xs font-bold text-[#F6DBC0] hover:underline cursor-pointer"
              >
                Auto-fill
              </button>
            </div>
          </form>

          <div className="pt-2 border-t border-[rgba(248,244,233,0.08)] text-xs text-[rgba(248,244,233,0.6)]">
            <span>Logged in as: </span>
            <span className="font-bold text-[#F8F4E9]">{user?.email || 'Guest Visitor'}</span>
          </div>
        </GlassCard>
      </div>
    );
  }

  if (isLoading || !analytics) {
    return (
      <div className="w-full min-h-[calc(100vh-4rem)] py-8 px-4 sm:px-6 lg:px-8 text-[#F8F4E9]">
        <div className="max-w-7xl mx-auto space-y-8 animate-pulse">
          <div className="bg-[rgba(42,27,51,0.6)] rounded-3xl p-8 h-36 w-full border border-[rgba(248,244,233,0.08)]" />
          <div className="grid grid-cols-1 sm:grid-cols-4 gap-4">
            {[...Array(4)].map((_, i) => (
              <div key={i} className="bg-[rgba(42,27,51,0.6)] p-5 rounded-2xl h-24 w-full border border-[rgba(248,244,233,0.08)]" />
            ))}
          </div>
          <div className="bg-[rgba(42,27,51,0.6)] rounded-3xl h-96 w-full border border-[rgba(248,244,233,0.08)]" />
        </div>
      </div>
    );
  }

  const COLORS = ['#935073', '#F6DBC0', '#7FE3B9', '#502D55', '#d19cb5', '#e8c4a0'];
  const registeredUsersCount = usersList.filter((u) => !u.email.includes('@interview.ai') && !u.name.includes('Guest')).length;
  const guestUsersCount = usersList.length - registeredUsersCount;
  const completedSessionsCount = sessionsList.filter((s) => s.status === 'completed').length;
  const passRate = sessionsList.length > 0
    ? Math.round((sessionsList.filter((s) => (s.overallScore || 0) >= 70).length / sessionsList.length) * 100)
    : 0;

  return (
    <div className="w-full min-h-[calc(100vh-4rem)] text-[#F8F4E9] py-8 px-4 sm:px-6 lg:px-8">
      <div className="max-w-7xl mx-auto space-y-8">
        
        {/* Executive Header Banner */}
        <GlassCard className="p-6 sm:p-8 flex flex-col md:flex-row items-start md:items-center justify-between gap-6 border-[rgba(147,80,115,0.4)] shadow-[0_20px_45px_rgba(15,7,20,0.8),0_0_35px_rgba(147,80,115,0.25)]">
          <div>
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-[rgba(147,80,115,0.3)] text-[#F6DBC0] text-xs font-bold mb-2 border border-[rgba(246,219,192,0.3)]">
              <ShieldCheck className="w-4 h-4 text-[#F6DBC0]" />
              Website Owner & Admin Dashboard
            </div>
            <h1 className="text-2xl sm:text-3xl font-black text-[#F8F4E9] tracking-tight">Candidate Enrollments & Live Progress</h1>
            <p className="text-xs text-[rgba(248,244,233,0.7)] font-medium mt-1">
              Live monitoring of candidates, practice interview completions, transcripts, and AI evaluations
            </p>
          </div>

          <div className="flex items-center gap-3">
            <PillButton
              onClick={handleExportData}
              icon={<Download className="w-4 h-4 text-[#F6DBC0]" />}
              size="md"
            >
              Export Records
            </PillButton>

            <button
              onClick={fetchAdminData}
              disabled={isRefreshing}
              className="p-2.5 bg-[rgba(80,45,85,0.5)] hover:bg-[rgba(147,80,115,0.5)] text-[#F8F4E9] border border-[rgba(246,219,192,0.3)] rounded-xl text-xs font-bold transition-all flex items-center justify-center cursor-pointer shadow-[0_0_15px_rgba(147,80,115,0.3)]"
              title="Refresh Data"
            >
              <RefreshCw className={`w-4 h-4 text-[#F6DBC0] ${isRefreshing ? 'animate-spin' : ''}`} />
            </button>
          </div>
        </GlassCard>

        {/* Top 4 KPI Metrics */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <GlassCard className="p-5 flex items-center justify-between">
            <div>
              <span className="text-[11px] font-bold uppercase text-[rgba(248,244,233,0.55)] block mb-1">Total Enrolled</span>
              <span className="text-2xl font-black text-[#F8F4E9]">{usersList.length}</span>
              <div className="text-[10px] text-[rgba(248,244,233,0.5)] mt-1 font-medium">
                {registeredUsersCount} registered • {guestUsersCount} guests
              </div>
            </div>
            <div className="w-11 h-11 rounded-xl bg-[rgba(80,45,85,0.6)] text-[#F6DBC0] border border-[rgba(246,219,192,0.2)] flex items-center justify-center font-bold shadow-[0_0_14px_rgba(147,80,115,0.3)]">
              <Users className="w-5 h-5" />
            </div>
          </GlassCard>

          <GlassCard className="p-5 flex items-center justify-between">
            <div>
              <span className="text-[11px] font-bold uppercase text-[rgba(248,244,233,0.55)] block mb-1">Interviews Conducted</span>
              <span className="text-2xl font-black text-[#F8F4E9]">{sessionsList.length}</span>
              <div className="text-[10px] text-[rgba(248,244,233,0.5)] mt-1 font-medium">
                {completedSessionsCount} fully completed
              </div>
            </div>
            <div className="w-11 h-11 rounded-xl bg-[rgba(147,80,115,0.4)] text-[#F8F4E9] border border-[rgba(246,219,192,0.2)] flex items-center justify-center font-bold shadow-[0_0_14px_rgba(147,80,115,0.3)]">
              <Target className="w-5 h-5" />
            </div>
          </GlassCard>

          <GlassCard className="p-5 flex items-center justify-between">
            <div>
              <span className="text-[11px] font-bold uppercase text-[rgba(248,244,233,0.55)] block mb-1">Avg Candidate Score</span>
              <span className="text-2xl font-black text-[#7FE3B9]">{analytics.avgOverallScore}%</span>
              <div className="text-[10px] text-[rgba(248,244,233,0.5)] mt-1 font-medium">
                Pass Rate: {passRate}% (≥70%)
              </div>
            </div>
            <div className="w-11 h-11 rounded-xl bg-[rgba(127,227,185,0.2)] text-[#7FE3B9] border border-[rgba(127,227,185,0.3)] flex items-center justify-center font-bold shadow-[0_0_14px_rgba(127,227,185,0.3)]">
              <Trophy className="w-5 h-5" />
            </div>
          </GlassCard>

          <GlassCard className="p-5 flex items-center justify-between">
            <div>
              <span className="text-[11px] font-bold uppercase text-[rgba(248,244,233,0.55)] block mb-1">Role Track Presets</span>
              <span className="text-2xl font-black text-[#F6DBC0]">10</span>
              <div className="text-[10px] text-[rgba(248,244,233,0.5)] mt-1 font-medium">
                SDE, ML, Product, Security...
              </div>
            </div>
            <div className="w-11 h-11 rounded-xl bg-[rgba(80,45,85,0.6)] text-[#F6DBC0] border border-[rgba(246,219,192,0.2)] flex items-center justify-center font-bold shadow-[0_0_14px_rgba(147,80,115,0.3)]">
              <BrainCircuit className="w-5 h-5" />
            </div>
          </GlassCard>
        </div>

        {/* Navigation Tabs */}
        <div className="flex items-center gap-2 border-b border-[rgba(248,244,233,0.08)] pb-2 overflow-x-auto">
          {[
            { id: 'candidates', label: `Enrolled Candidates (${usersList.length})`, icon: Users },
            { id: 'sessions', label: `Session Records (${sessionsList.length})`, icon: ListFilter },
            { id: 'analytics', label: 'Charts & Velocity', icon: BarChart2 },
            { id: 'questions', label: 'Question Bank', icon: HelpCircle },
          ].map((tab) => {
            const Icon = tab.icon;
            const isTabActive = activeTab === tab.id;
            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id as any)}
                className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer whitespace-nowrap ${
                  isTabActive
                    ? 'bg-[#935073] text-[#F8F4E9] shadow-[0_0_16px_rgba(147,80,115,0.4)] border border-[rgba(246,219,192,0.3)]'
                    : 'text-[rgba(248,244,233,0.6)] hover:text-[#F8F4E9] hover:bg-[rgba(147,80,115,0.15)]'
                }`}
              >
                <Icon className="w-4 h-4 text-[#F6DBC0]" />
                <span>{tab.label}</span>
              </button>
            );
          })}
        </div>

        {/* TAB 1: CANDIDATES DIRECTORY & PROGRESS */}
        {activeTab === 'candidates' && (
          <GlassCard className="p-6 space-y-6">
            <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
              <div>
                <h2 className="text-base font-extrabold text-[#F8F4E9]">
                  Enrolled Candidate Progress Directory
                </h2>
                <p className="text-xs text-[rgba(248,244,233,0.6)] mt-0.5">
                  Click on any candidate to inspect their complete question transcripts and scores
                </p>
              </div>

              <div className="flex flex-wrap items-center gap-3 w-full md:w-auto">
                <div className="relative flex-1 sm:w-64">
                  <Search className="w-3.5 h-3.5 text-[rgba(248,244,233,0.4)] absolute left-3 top-3" />
                  <input
                    type="text"
                    placeholder="Search candidate name / email..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="w-full bg-[rgba(26,15,34,0.6)] border border-[rgba(248,244,233,0.1)] rounded-xl pl-9 pr-3 py-2 text-xs text-[#F8F4E9] placeholder-[rgba(248,244,233,0.3)] outline-none focus:border-[#935073] font-medium"
                  />
                </div>

                <div className="flex items-center rounded-xl bg-[rgba(26,15,34,0.6)] p-1 border border-[rgba(248,244,233,0.08)]">
                  <button
                    onClick={() => setUserFilter('all')}
                    className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                      userFilter === 'all' ? 'bg-[#935073] text-[#F8F4E9] shadow-xs' : 'text-[rgba(248,244,233,0.6)]'
                    }`}
                  >
                    All ({usersList.length})
                  </button>
                  <button
                    onClick={() => setUserFilter('registered')}
                    className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                      userFilter === 'registered' ? 'bg-[#935073] text-[#F8F4E9] shadow-xs' : 'text-[rgba(248,244,233,0.6)]'
                    }`}
                  >
                    Registered ({registeredUsersCount})
                  </button>
                  <button
                    onClick={() => setUserFilter('guests')}
                    className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                      userFilter === 'guests' ? 'bg-[#935073] text-[#F8F4E9] shadow-xs' : 'text-[rgba(248,244,233,0.6)]'
                    }`}
                  >
                    Guests ({guestUsersCount})
                  </button>
                </div>
              </div>
            </div>

            {/* Candidates Table */}
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead className="bg-[rgba(26,15,34,0.6)] text-[rgba(248,244,233,0.65)] font-bold border-b border-[rgba(248,244,233,0.08)] uppercase tracking-wider">
                  <tr>
                    <th className="py-3.5 px-3">Candidate</th>
                    <th className="py-3.5 px-3">Enrolled Date</th>
                    <th className="py-3.5 px-3">Resume Status</th>
                    <th className="py-3.5 px-3">Interviews</th>
                    <th className="py-3.5 px-3">Average Score</th>
                    <th className="py-3.5 px-3">Latest Activity</th>
                    <th className="py-3.5 px-3 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[rgba(248,244,233,0.06)] font-medium">
                  {filteredUsers.map((u) => {
                    const isGuest = u.email.includes('@interview.ai') || u.name.includes('Guest');
                    return (
                      <tr key={u.id} className="hover:bg-[rgba(147,80,115,0.1)] transition-colors">
                        <td className="py-3.5 px-3">
                          <div className="flex items-center gap-2.5">
                            <div className={`w-8 h-8 rounded-full flex items-center justify-center font-extrabold text-xs text-[#F8F4E9] ${
                              u.role === 'admin' ? 'bg-[#935073] border border-[#F6DBC0]' : 'bg-[rgba(80,45,85,0.8)] border border-[rgba(248,244,233,0.1)]'
                            }`}>
                              {u.name.substring(0, 2).toUpperCase()}
                            </div>
                            <div>
                              <div className="font-bold text-[#F8F4E9] flex items-center gap-1.5">
                                <span>{u.name}</span>
                                {u.role === 'admin' && (
                                  <span className="text-[9px] bg-[rgba(147,80,115,0.3)] text-[#F6DBC0] px-1.5 py-0.2 rounded font-bold border border-[rgba(246,219,192,0.3)]">
                                    Admin / Owner
                                  </span>
                                )}
                                {isGuest && (
                                  <span className="text-[9px] bg-[rgba(248,244,233,0.1)] text-[rgba(248,244,233,0.6)] px-1.5 py-0.2 rounded font-bold">
                                    Guest
                                  </span>
                                )}
                              </div>
                              <div className="text-[11px] text-[rgba(248,244,233,0.5)]">{u.email}</div>
                            </div>
                          </div>
                        </td>

                        <td className="py-3.5 px-3 text-[rgba(248,244,233,0.65)]">
                          {new Date(u.createdAt).toLocaleDateString()}
                        </td>

                        <td className="py-3.5 px-3">
                          {u.hasResume ? (
                            <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[10px] font-bold bg-[rgba(127,227,185,0.15)] text-[#7FE3B9] border border-[rgba(127,227,185,0.3)]">
                              <CheckCircle2 className="w-3 h-3" />
                              Parsed ({u.resumeSkills?.length || 0} skills)
                            </span>
                          ) : (
                            <span className="text-[10px] text-[rgba(248,244,233,0.4)]">No resume</span>
                          )}
                        </td>

                        <td className="py-3.5 px-3 font-mono font-bold text-[#F8F4E9]">
                          {u.sessionCount} sessions ({u.completedCount || 0} finished)
                        </td>

                        <td className="py-3.5 px-3">
                          {u.completedCount > 0 ? (
                            <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded text-[11px] font-extrabold ${
                              u.avgScore >= 75
                                ? 'bg-[rgba(127,227,185,0.15)] text-[#7FE3B9] border border-[rgba(127,227,185,0.3)]'
                                : u.avgScore >= 60
                                ? 'bg-[rgba(147,80,115,0.3)] text-[#F6DBC0] border border-[rgba(246,219,192,0.3)]'
                                : 'bg-[rgba(229,115,115,0.15)] text-[#E57373] border border-[rgba(229,115,115,0.3)]'
                            }`}>
                              {u.avgScore}%
                            </span>
                          ) : (
                            <span className="text-[rgba(248,244,233,0.4)] text-[11px]">—</span>
                          )}
                        </td>

                        <td className="py-3.5 px-3 text-[rgba(248,244,233,0.5)] text-[11px]">
                          {new Date(u.lastActive).toLocaleDateString()}
                        </td>

                        <td className="py-3.5 px-3 text-right">
                          <div className="flex items-center justify-end gap-1.5">
                            <button
                              onClick={() => handleViewCandidate(u.id)}
                              className="px-3 py-1.5 rounded-lg bg-[rgba(80,45,85,0.5)] hover:bg-[rgba(147,80,115,0.5)] border border-[rgba(246,219,192,0.2)] text-[#F6DBC0] text-xs font-bold transition-colors cursor-pointer flex items-center gap-1"
                            >
                              <Eye className="w-3.5 h-3.5 text-[#F6DBC0]" />
                              <span>Inspect Dossier</span>
                            </button>

                            {u.role !== 'admin' && (
                              <button
                                onClick={() => handleDeleteUser(u.id, u.name)}
                                className="p-1.5 text-[rgba(248,244,233,0.4)] hover:text-[#E57373] hover:bg-[rgba(229,115,115,0.15)] rounded-lg transition-colors cursor-pointer"
                                title="Delete Candidate"
                              >
                                <Trash2 className="w-3.5 h-3.5" />
                              </button>
                            )}
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>

              {filteredUsers.length === 0 && (
                <div className="p-8 text-center text-xs text-[rgba(248,244,233,0.5)]">
                  No candidates found matching the search query.
                </div>
              )}
            </div>
          </GlassCard>
        )}

        {/* TAB 2: SESSION RECORDS & SCORECARDS */}
        {activeTab === 'sessions' && (
          <GlassCard className="p-6 space-y-6">
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
              <div>
                <h2 className="text-base font-extrabold text-[#F8F4E9]">
                  Mock Interview Session Records ({sessionsList.length})
                </h2>
                <p className="text-xs text-[rgba(248,244,233,0.6)] mt-0.5">
                  Track individual mock interview sessions and jump directly to scorecards
                </p>
              </div>

              {/* Filters */}
              <div className="flex items-center gap-3">
                <select
                  value={selectedTrackFilter}
                  onChange={(e) => setSelectedTrackFilter(e.target.value)}
                  className="bg-[rgba(26,15,34,0.6)] border border-[rgba(248,244,233,0.1)] text-[#F8F4E9] text-xs rounded-xl p-2.5 outline-none font-bold"
                >
                  <option value="" className="bg-[#1A0F22] text-[#F8F4E9]">All Tracks</option>
                  <option value="SDE" className="bg-[#1A0F22] text-[#F8F4E9]">SDE</option>
                  <option value="Frontend Engineer" className="bg-[#1A0F22] text-[#F8F4E9]">Frontend Engineer</option>
                  <option value="Full Stack Engineer" className="bg-[#1A0F22] text-[#F8F4E9]">Full Stack Engineer</option>
                  <option value="Data Scientist" className="bg-[#1A0F22] text-[#F8F4E9]">Data Scientist</option>
                  <option value="Cybersecurity" className="bg-[#1A0F22] text-[#F8F4E9]">Cybersecurity</option>
                  <option value="Product Manager" className="bg-[#1A0F22] text-[#F8F4E9]">Product Manager</option>
                  <option value="HR/Behavioral" className="bg-[#1A0F22] text-[#F8F4E9]">HR/Behavioral</option>
                </select>

                <select
                  value={selectedDifficultyFilter}
                  onChange={(e) => setSelectedDifficultyFilter(e.target.value)}
                  className="bg-[rgba(26,15,34,0.6)] border border-[rgba(248,244,233,0.1)] text-[#F8F4E9] text-xs rounded-xl p-2.5 outline-none font-bold"
                >
                  <option value="" className="bg-[#1A0F22] text-[#F8F4E9]">All Difficulties</option>
                  <option value="Beginner" className="bg-[#1A0F22] text-[#F8F4E9]">Beginner</option>
                  <option value="Intermediate" className="bg-[#1A0F22] text-[#F8F4E9]">Intermediate</option>
                  <option value="Advanced" className="bg-[#1A0F22] text-[#F8F4E9]">Advanced</option>
                </select>
              </div>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead className="bg-[rgba(26,15,34,0.6)] text-[rgba(248,244,233,0.65)] font-bold border-b border-[rgba(248,244,233,0.08)] uppercase tracking-wider">
                  <tr>
                    <th className="py-3.5 px-3">Session ID</th>
                    <th className="py-3.5 px-3">Candidate</th>
                    <th className="py-3.5 px-3">Track & Preset</th>
                    <th className="py-3.5 px-3">Difficulty</th>
                    <th className="py-3.5 px-3">Status</th>
                    <th className="py-3.5 px-3">Overall Score</th>
                    <th className="py-3.5 px-3">Date</th>
                    <th className="py-3.5 px-3 text-right">Action</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[rgba(248,244,233,0.06)] font-medium">
                  {filteredSessions.map((s) => (
                    <tr key={s.id} className="hover:bg-[rgba(147,80,115,0.1)] transition-colors">
                      <td className="py-3.5 px-3 font-mono text-[rgba(248,244,233,0.5)]">
                        {s.id.substring(0, 10)}...
                      </td>
                      <td className="py-3.5 px-3">
                        <div className="font-bold text-[#F8F4E9]">{s.candidateName}</div>
                        <div className="text-[10px] text-[rgba(248,244,233,0.5)]">{s.candidateEmail}</div>
                      </td>
                      <td className="py-3.5 px-3">
                        <span className="font-bold text-[#F8F4E9] block">{s.track}</span>
                        {s.companyPreset && (
                          <span className="text-[10px] text-[#F6DBC0] font-semibold">
                            {s.companyPreset}
                          </span>
                        )}
                      </td>
                      <td className="py-3.5 px-3 text-[#F8F4E9] font-bold">
                        {s.difficulty}
                      </td>
                      <td className="py-3.5 px-3">
                        <span className={`px-2 py-0.5 rounded text-[10px] font-extrabold ${
                          s.status === 'completed'
                            ? 'bg-[rgba(127,227,185,0.15)] text-[#7FE3B9] border border-[rgba(127,227,185,0.3)]'
                            : 'bg-[rgba(147,80,115,0.3)] text-[#F6DBC0] border border-[rgba(246,219,192,0.3)]'
                        }`}>
                          {s.status}
                        </span>
                      </td>
                      <td className="py-3.5 px-3 font-black text-[#F6DBC0]">
                        {s.overallScore !== undefined ? `${s.overallScore}%` : '—'}
                      </td>
                      <td className="py-3.5 px-3 text-[rgba(248,244,233,0.5)]">
                        {new Date(s.createdAt).toLocaleDateString()}
                      </td>
                      <td className="py-3.5 px-3 text-right">
                        <div className="flex items-center justify-end gap-1.5">
                          {s.status === 'completed' && (
                            <Link
                              to={`/results/${s.id}`}
                              className="px-3 py-1.5 rounded-lg bg-gradient-to-r from-[#502D55] to-[#935073] hover:from-[#603766] hover:to-[#ba6d95] border border-[rgba(246,219,192,0.2)] text-[#F8F4E9] text-xs font-bold transition-all flex items-center gap-1 shadow-xs"
                            >
                              <span>View Scorecard</span>
                              <ExternalLink className="w-3 h-3 text-[#F6DBC0]" />
                            </Link>
                          )}
                          <button
                            onClick={() => handleDeleteSession(s.id)}
                            className="p-1.5 text-[rgba(248,244,233,0.4)] hover:text-[#E57373] rounded-lg transition-colors cursor-pointer"
                            title="Delete Session"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>

              {filteredSessions.length === 0 && (
                <div className="p-8 text-center text-xs text-[rgba(248,244,233,0.5)]">
                  No interview sessions recorded under this filter yet.
                </div>
              )}
            </div>
          </GlassCard>
        )}

        {/* TAB 3: VISUAL ANALYTICS & CHARTS */}
        {activeTab === 'analytics' && (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {/* Candidate signups over time */}
            <GlassCard className="p-5 space-y-4">
              <div>
                <h3 className="text-xs font-extrabold text-[#F8F4E9] uppercase tracking-wider">
                  Candidate Registrations
                </h3>
                <p className="text-[11px] text-[rgba(248,244,233,0.6)]">New user signups over time</p>
              </div>
              <div className="h-52 w-full">
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart data={analytics.signupsOverTime} margin={{ top: 5, right: 10, left: -25, bottom: 0 }}>
                    <CartesianGrid strokeDasharray="3 3" stroke="rgba(248,244,233,0.06)" />
                    <XAxis dataKey="date" stroke="rgba(248,244,233,0.4)" tick={{ fontSize: 10, fill: '#F8F4E9' }} />
                    <YAxis stroke="rgba(248,244,233,0.4)" tick={{ fontSize: 10, fill: '#F8F4E9' }} />
                    <Tooltip contentStyle={{ backgroundColor: '#2A1B33', borderColor: 'rgba(248,244,233,0.15)', borderRadius: '12px', fontSize: '11px', color: '#F8F4E9' }} />
                    <Line type="monotone" dataKey="count" stroke="#935073" strokeWidth={2.5} dot={{ r: 4, fill: '#F6DBC0' }} />
                  </LineChart>
                </ResponsiveContainer>
              </div>
            </GlassCard>

            {/* Sessions per day */}
            <GlassCard className="p-5 space-y-4">
              <div>
                <h3 className="text-xs font-extrabold text-[#F8F4E9] uppercase tracking-wider">
                  Daily Interview Velocity
                </h3>
                <p className="text-[11px] text-[rgba(248,244,233,0.6)]">Practice sessions initiated per day</p>
              </div>
              <div className="h-52 w-full">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={analytics.sessionsPerDay} margin={{ top: 5, right: 10, left: -25, bottom: 0 }}>
                    <CartesianGrid strokeDasharray="3 3" stroke="rgba(248,244,233,0.06)" />
                    <XAxis dataKey="date" stroke="rgba(248,244,233,0.4)" tick={{ fontSize: 10, fill: '#F8F4E9' }} />
                    <YAxis stroke="rgba(248,244,233,0.4)" tick={{ fontSize: 10, fill: '#F8F4E9' }} />
                    <Tooltip contentStyle={{ backgroundColor: '#2A1B33', borderColor: 'rgba(248,244,233,0.15)', borderRadius: '12px', fontSize: '11px', color: '#F8F4E9' }} />
                    <Bar dataKey="count" fill="#935073" radius={[6, 6, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </GlassCard>

            {/* Track popularity */}
            <GlassCard className="p-5 space-y-4">
              <div>
                <h3 className="text-xs font-extrabold text-[#F8F4E9] uppercase tracking-wider">
                  Role Track Popularity
                </h3>
                <p className="text-[11px] text-[rgba(248,244,233,0.6)]">Distribution of chosen tracks</p>
              </div>
              <div className="h-52 w-full">
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={analytics.trackPopularity}
                      dataKey="count"
                      nameKey="track"
                      cx="50%"
                      cy="50%"
                      outerRadius={65}
                      label={({ track }) => track.substring(0, 10)}
                    >
                      {analytics.trackPopularity.map((_, idx) => (
                        <Cell key={idx} fill={COLORS[idx % COLORS.length]} />
                      ))}
                    </Pie>
                    <Tooltip contentStyle={{ backgroundColor: '#2A1B33', borderColor: 'rgba(248,244,233,0.15)', borderRadius: '12px', fontSize: '11px', color: '#F8F4E9' }} />
                  </PieChart>
                </ResponsiveContainer>
              </div>
            </GlassCard>
          </div>
        )}

        {/* TAB 4: QUESTION BANK */}
        {activeTab === 'questions' && (
          <GlassCard className="p-6 space-y-4">
            <div>
              <h2 className="text-base font-extrabold text-[#F8F4E9]">
                Track Question Bank & Calibration Repository
              </h2>
              <p className="text-xs text-[rgba(248,244,233,0.6)] mt-0.5">
                Curated technical, behavioral, and system design prompts evaluated by Gemini AI
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {questionBank.map((q, idx) => (
                <div key={idx} className="bg-[rgba(26,15,34,0.6)] border border-[rgba(248,244,233,0.08)] p-4 rounded-2xl space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="text-[10px] bg-[rgba(147,80,115,0.3)] text-[#F6DBC0] px-2 py-0.5 rounded font-extrabold uppercase border border-[rgba(246,219,192,0.3)]">
                      {q.track} • {q.difficulty}
                    </span>
                    <span className="text-[10px] text-[rgba(248,244,233,0.5)] uppercase font-bold">{q.type}</span>
                  </div>
                  <p className="text-xs text-[#F8F4E9] leading-relaxed font-semibold">"{q.questionText}"</p>
                </div>
              ))}
            </div>
          </GlassCard>
        )}

        {/* CANDIDATE PROGRESS DOSSIER MODAL / DRAWER */}
        {selectedCandidateId && (
          <div className="fixed inset-0 z-50 bg-[#1A0F22]/80 backdrop-blur-md flex items-center justify-center p-4">
            <div className="bg-[rgba(42,27,51,0.92)] border border-[rgba(248,244,233,0.12)] rounded-3xl max-w-3xl w-full max-h-[88vh] overflow-y-auto shadow-2xl p-6 sm:p-8 space-y-6 text-[#F8F4E9]">
              <div className="flex items-center justify-between border-b border-[rgba(248,244,233,0.08)] pb-4">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-[#502D55] to-[#935073] border border-[rgba(246,219,192,0.3)] text-[#F6DBC0] flex items-center justify-center font-black text-sm shadow-[0_0_15px_rgba(147,80,115,0.4)]">
                    {candidateDetail?.user.name.substring(0, 2).toUpperCase() || 'CA'}
                  </div>
                  <div>
                    <h3 className="text-base font-black text-[#F8F4E9]">
                      {candidateDetail?.user.name}’s Progress Dossier
                    </h3>
                    <p className="text-xs text-[rgba(248,244,233,0.6)]">{candidateDetail?.user.email}</p>
                  </div>
                </div>

                <button
                  onClick={() => {
                    setSelectedCandidateId(null);
                    setCandidateDetail(null);
                  }}
                  className="p-2 text-[rgba(248,244,233,0.5)] hover:text-[#F8F4E9] rounded-xl hover:bg-[rgba(147,80,115,0.2)] cursor-pointer"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              {isLoadingCandidate || !candidateDetail ? (
                <div className="py-16 text-center text-xs text-[rgba(248,244,233,0.5)] animate-pulse">
                  Loading candidate transcripts and history...
                </div>
              ) : (
                <div className="space-y-6">
                  {/* Candidate Resume & Skills Card */}
                  {candidateDetail.resume ? (
                    <div className="bg-[rgba(26,15,34,0.6)] border border-[rgba(248,244,233,0.08)] rounded-2xl p-4 space-y-2">
                      <div className="flex items-center justify-between">
                        <span className="text-xs font-bold text-[#F8F4E9] flex items-center gap-1.5">
                          <FileText className="w-3.5 h-3.5 text-[#F6DBC0]" />
                          Parsed Resume: {candidateDetail.resume.fileName}
                        </span>
                        <span className="text-[10px] text-[rgba(248,244,233,0.5)]">
                          Uploaded {new Date(candidateDetail.resume.uploadedAt).toLocaleDateString()}
                        </span>
                      </div>
                      <div className="flex flex-wrap gap-1.5 pt-1">
                        {candidateDetail.resume.parsedSkills.map((skill, sIdx) => (
                          <span
                            key={sIdx}
                            className="px-2 py-0.5 bg-[rgba(147,80,115,0.3)] text-[#F6DBC0] rounded text-[10px] font-bold border border-[rgba(246,219,192,0.25)]"
                          >
                            {skill}
                          </span>
                        ))}
                      </div>
                    </div>
                  ) : (
                    <div className="bg-[rgba(26,15,34,0.6)] border border-[rgba(248,244,233,0.08)] rounded-2xl p-4 text-xs text-[rgba(248,244,233,0.5)] text-center">
                      No resume uploaded by this candidate yet.
                    </div>
                  )}

                  {/* Interview Sessions History with Transcripts */}
                  <div className="space-y-4">
                    <h4 className="text-xs font-black uppercase text-[rgba(248,244,233,0.5)] tracking-wider">
                      Completed & Attempted Sessions ({candidateDetail.sessions.length})
                    </h4>

                    {candidateDetail.sessions.length === 0 ? (
                      <div className="p-6 text-center text-xs text-[rgba(248,244,233,0.4)] border border-dashed border-[rgba(248,244,233,0.1)] rounded-2xl">
                        Candidate has not started any mock interview sessions yet.
                      </div>
                    ) : (
                      candidateDetail.sessions.map((session, idx) => (
                        <div
                          key={session.id}
                          className="bg-[rgba(26,15,34,0.6)] border border-[rgba(248,244,233,0.08)] rounded-2xl p-5 space-y-4"
                        >
                          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-[rgba(248,244,233,0.08)] pb-3">
                            <div>
                              <div className="flex items-center gap-2">
                                <span className="font-extrabold text-sm text-[#F8F4E9]">
                                  #{idx + 1} {session.track}
                                </span>
                                <span className="text-[10px] bg-[rgba(248,244,233,0.1)] px-2 py-0.5 rounded font-bold text-[#F8F4E9]">
                                  {session.difficulty}
                                </span>
                                {session.companyPreset && (
                                  <span className="text-[10px] bg-[rgba(147,80,115,0.3)] text-[#F6DBC0] px-2 py-0.5 rounded font-bold border border-[rgba(246,219,192,0.3)]">
                                    {session.companyPreset}
                                  </span>
                                )}
                              </div>
                              <div className="text-[10px] text-[rgba(248,244,233,0.5)] mt-0.5">
                                {new Date(session.createdAt).toLocaleString()} • {session.questions?.length || 0} Questions
                              </div>
                            </div>

                            <div className="flex items-center gap-2">
                              {session.proctoring && (
                                <div className="text-right">
                                  <span className="text-[10px] font-bold text-[rgba(248,244,233,0.5)] block uppercase">Integrity</span>
                                  <span className={`text-xs font-black px-2 py-0.5 rounded-full border ${
                                    session.proctoring.tabSwitchCount === 0
                                      ? 'bg-[rgba(127,227,185,0.15)] text-[#7FE3B9] border-[rgba(127,227,185,0.3)]'
                                      : 'bg-[rgba(147,80,115,0.3)] text-[#F6DBC0] border-[rgba(246,219,192,0.3)]'
                                  }`}>
                                    {session.proctoring.tabSwitchCount === 0 ? '100% Focus' : `${session.proctoring.tabSwitchCount} Tab Sw.`}
                                  </span>
                                </div>
                              )}
                              {session.overallScore !== undefined && (
                                <div className="text-right">
                                  <span className="text-xs font-bold text-[rgba(248,244,233,0.5)] block">Score</span>
                                  <span className="text-lg font-black text-[#F6DBC0]">
                                    {session.overallScore}%
                                  </span>
                                </div>
                              )}
                              {session.status === 'completed' && (
                                <Link
                                  to={`/results/${session.id}`}
                                  className="p-2 rounded-lg bg-gradient-to-r from-[#502D55] to-[#935073] hover:from-[#603766] hover:to-[#ba6d95] text-[#F8F4E9] text-xs font-bold transition-colors"
                                  title="View Full Scorecard"
                                >
                                  <ExternalLink className="w-3.5 h-3.5 text-[#F6DBC0]" />
                                </Link>
                              )}
                            </div>
                          </div>

                          {/* Questions & Candidate Answers Transcript */}
                          <div className="space-y-3">
                            {session.questions?.map((q, qIdx) => (
                              <div key={q.id} className="bg-[rgba(42,27,51,0.6)] border border-[rgba(248,244,233,0.06)] rounded-xl p-3.5 space-y-2">
                                <div className="flex items-start justify-between gap-2">
                                  <span className="text-xs font-bold text-[#F8F4E9]">
                                    Q{qIdx + 1}: {q.questionText}
                                  </span>
                                  {q.answer && (
                                    <span className="text-[10px] font-black bg-[rgba(127,227,185,0.15)] text-[#7FE3B9] border border-[rgba(127,227,185,0.3)] px-2 py-0.5 rounded shrink-0">
                                      Tech: {q.answer.technicalScore}% • Comm: {q.answer.communicationScore}%
                                    </span>
                                  )}
                                </div>

                                {q.answer ? (
                                  <div className="space-y-1.5 text-xs">
                                    <p className="text-[rgba(248,244,233,0.85)] bg-[rgba(26,15,34,0.6)] p-2.5 rounded-lg border border-[rgba(248,244,233,0.06)] italic">
                                      "{q.answer.transcriptText}"
                                    </p>
                                    {q.answer.aiFeedback && (
                                      <p className="text-[11px] text-[rgba(248,244,233,0.65)] font-medium">
                                        💡 <span className="font-semibold text-[#F6DBC0]">AI Feedback:</span> {q.answer.aiFeedback}
                                      </p>
                                    )}
                                  </div>
                                ) : (
                                  <div className="text-[11px] text-[#F6DBC0] italic">
                                    Pending response from candidate
                                  </div>
                                )}
                              </div>
                            ))}
                          </div>
                        </div>
                      ))
                    )}
                  </div>
                </div>
              )}
            </div>
          </div>
        )}

      </div>
    </div>
  );
};
