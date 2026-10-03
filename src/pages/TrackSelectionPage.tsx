import React, { useState, useEffect, useRef } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { TrackType, DifficultyType, Resume } from '../types';
import { AudioSettingsModal } from '../components/AudioSettingsModal';
import {
  GlassCard,
  PrimaryButton,
  PillButton,
  Badge,
} from '../components/ui';
import {
  Code2,
  Database,
  Shield,
  Briefcase,
  Users,
  Upload,
  FileText,
  Sparkles,
  ArrowRight,
  Check,
  AlertCircle,
  HelpCircle,
  Layout,
  Layers,
  Cpu,
  Cloud,
  CheckSquare,
  Loader2,
  Camera,
  Sliders,
  Play,
  RotateCcw,
} from 'lucide-react';

const START_INTERVIEW_TIMEOUT_MS = 45000;

export const TrackSelectionPage: React.FC = () => {
  const { token, user, isLoading: isAuthLoading, loginAsGuest } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  const [selectedTrack, setSelectedTrack] = useState<TrackType>('SDE');
  const [selectedDifficulty, setSelectedDifficulty] = useState<DifficultyType>('Intermediate');
  const [selectedCompany, setSelectedCompany] = useState<string>('General Tech');
  const [jobDescription, setJobDescription] = useState('');
  const [questionCount, setQuestionCount] = useState<number>(3);
  const [isCameraEnabled, setIsCameraEnabled] = useState<boolean>(() => {
    return localStorage.getItem('interview_camera_enabled') !== 'false';
  });
  const [isMediaModalOpen, setIsMediaModalOpen] = useState(false);

  // Parse track from query string or navigation state
  useEffect(() => {
    const searchParams = new URLSearchParams(location.search);
    const trackParam = searchParams.get('track');
    const validTracks: TrackType[] = [
      'SDE',
      'Frontend Engineer',
      'Full Stack Engineer',
      'Data Scientist',
      'Data Engineer',
      'DevOps & Cloud',
      'Cybersecurity',
      'Product Manager',
      'QA & Automation',
      'HR/Behavioral',
    ];

    if (trackParam && validTracks.includes(trackParam as TrackType)) {
      setSelectedTrack(trackParam as TrackType);
    } else if (location.state && (location.state as { selectedTrack?: TrackType }).selectedTrack) {
      setSelectedTrack((location.state as { selectedTrack: TrackType }).selectedTrack);
    }
  }, [location]);

  // Resume state
  const [currentResume, setCurrentResume] = useState<Resume | null>(null);
  const [isUploadingResume, setIsUploadingResume] = useState(false);
  const [resumeText, setResumeText] = useState('');
  const [resumeFileName, setResumeFileName] = useState('');

  const [isStarting, setIsStarting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const errorRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    if (error && errorRef.current) {
      errorRef.current.scrollIntoView({ behavior: 'smooth', block: 'center' });
    }
  }, [error]);

  useEffect(() => {
    if (isAuthLoading) return;

    // Fetch user resume if logged in
    const fetchUserResume = async () => {
      if (!user || !token) return;
      try {
        const res = await fetch('/api/resume/me', {
          headers: { Authorization: `Bearer ${token}` },
        });
        if (res.ok) {
          const data = await res.json();
          setCurrentResume(data.resume);
        }
      } catch (err) {
        console.error('Failed to fetch resume:', err);
      }
    };

    fetchUserResume();
  }, [user, token, isAuthLoading]);

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setIsUploadingResume(true);
    setResumeFileName(file.name);

    try {
      const text = await file.text();
      setResumeText(text);

      if (token) {
        const res = await fetch('/api/resume/upload', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify({
            fileName: file.name,
            fileContent: text,
          }),
        });

        if (res.ok) {
          const data = await res.json();
          setCurrentResume(data.resume);
        }
      }
    } catch (err) {
      console.error('Resume upload error:', err);
    } finally {
      setIsUploadingResume(false);
    }
  };

  const handleStartInterview = async () => {
    setIsStarting(true);
    setError(null);

    let activeToken = token || localStorage.getItem('interview_ai_token');

    // Auto-provision guest candidate account if user is not logged in
    if (!activeToken) {
      const guestRes = await loginAsGuest();
      if (guestRes.success && guestRes.token) {
        activeToken = guestRes.token;
      }
    }

    if (!activeToken) {
      activeToken = localStorage.getItem('interview_ai_token');
    }

    if (!activeToken) {
      setError('Unable to initialize candidate session. Please refresh and try again.');
      setIsStarting(false);
      return;
    }

    const safeQuestionCount = Math.min(5, Math.max(3, Math.round(questionCount) || 3));

    const buildStartPayload = () =>
      JSON.stringify({
        track: selectedTrack,
        difficulty: selectedDifficulty,
        companyPreset: selectedCompany,
        jobDescription: jobDescription.trim() || undefined,
        questionCount: safeQuestionCount,
      });

    const controller = new AbortController();
    const timeoutId = window.setTimeout(() => controller.abort(), START_INTERVIEW_TIMEOUT_MS);

    try {
      let res = await fetch('/api/sessions/start', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${activeToken}`,
        },
        body: buildStartPayload(),
        signal: controller.signal,
      });

      if (res.status === 401 || res.status === 403) {
        const guestRes = await loginAsGuest();
        if (guestRes.success && guestRes.token) {
          activeToken = guestRes.token;
          res = await fetch('/api/sessions/start', {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
              Authorization: `Bearer ${activeToken}`,
            },
            body: buildStartPayload(),
            signal: controller.signal,
          });
        }
      }

      const data = await res.json();
      if (!res.ok || !data?.session?.id) {
        setError(data?.error || 'Failed to start interview session. Please try again.');
        setIsStarting(false);
        return;
      }

      navigate(`/interview/${data.session.id}`, {
        state: { session: data.session, currentQuestion: data.currentQuestion },
      });
    } catch (err: any) {
      if (err?.name === 'AbortError') {
        setError(
          'This is taking longer than expected. Your session may still be creating in the background — check your Dashboard in a moment, or try again.'
        );
      } else {
        setError(err.message || 'Network error starting interview');
      }
      setIsStarting(false);
    } finally {
      window.clearTimeout(timeoutId);
    }
  };

  const tracks: { id: TrackType; title: string; desc: string; icon: React.ReactNode }[] = [
    {
      id: 'SDE',
      title: 'Backend & Systems (SDE)',
      desc: 'System design, microservices, distributed caching, algorithms & concurrency.',
      icon: <Code2 className="w-5 h-5 text-[#F6DBC0]" />,
    },
    {
      id: 'Frontend Engineer',
      title: 'Frontend Engineer',
      desc: 'React, performance optimization, state management, CSS architecture & web security.',
      icon: <Layout className="w-5 h-5 text-[#F6DBC0]" />,
    },
    {
      id: 'Full Stack Engineer',
      title: 'Full Stack Engineer',
      desc: 'End-to-end web apps, Node.js/Express, REST/GraphQL APIs & database integrations.',
      icon: <Layers className="w-5 h-5 text-[#F6DBC0]" />,
    },
    {
      id: 'Data Scientist',
      title: 'Data Scientist / AI ML',
      desc: 'Machine learning algorithms, model evaluation, feature engineering & A/B testing.',
      icon: <Database className="w-5 h-5 text-[#F6DBC0]" />,
    },
    {
      id: 'Data Engineer',
      title: 'Data Engineer',
      desc: 'ETL pipelines, Spark, Kafka, data warehousing, SQL optimization & schema design.',
      icon: <Cpu className="w-5 h-5 text-[#F6DBC0]" />,
    },
    {
      id: 'DevOps & Cloud',
      title: 'DevOps & Cloud Architect',
      desc: 'Kubernetes, Docker, CI/CD pipelines, Terraform, AWS/GCP & infrastructure as code.',
      icon: <Cloud className="w-5 h-5 text-[#F6DBC0]" />,
    },
    {
      id: 'Cybersecurity',
      title: 'Cybersecurity Specialist',
      desc: 'Network defense, zero-trust architectures, vulnerability analysis & incident response.',
      icon: <Shield className="w-5 h-5 text-[#F6DBC0]" />,
    },
    {
      id: 'Product Manager',
      title: 'Product Manager',
      desc: 'Product strategy, execution frameworks, metric design & cross-functional leadership.',
      icon: <Briefcase className="w-5 h-5 text-[#F6DBC0]" />,
    },
    {
      id: 'QA & Automation',
      title: 'QA & Test Automation',
      desc: 'End-to-end test automation, Playwright/Selenium, load testing & quality strategy.',
      icon: <CheckSquare className="w-5 h-5 text-[#F6DBC0]" />,
    },
    {
      id: 'HR/Behavioral',
      title: 'HR & Behavioral (STAR)',
      desc: 'Behavioral scenarios, conflict resolution, leadership principles & culture fit.',
      icon: <Users className="w-5 h-5 text-[#F6DBC0]" />,
    },
  ];

  const difficulties: { id: DifficultyType; label: string; desc: string }[] = [
    { id: 'Beginner', label: 'Beginner', desc: 'Core fundamentals & direct questions' },
    { id: 'Intermediate', label: 'Intermediate', desc: 'Real-world tradeoffs & scenario solving' },
    { id: 'Advanced', label: 'Advanced', desc: 'Complex edge cases & principal-level depth' },
  ];

  const companies = [
    { id: 'General Tech', name: 'General Tech / Startups', badge: 'Standard FAANG Rubric' },
    { id: 'Google', name: 'Google', badge: 'Googleyness & High Scale' },
    { id: 'Amazon', name: 'Amazon', badge: '16 Leadership Principles' },
    { id: 'Meta', name: 'Meta', badge: 'Rapid Execution & Scale' },
    { id: 'Microsoft', name: 'Microsoft', badge: 'Architecture & Enterprise' },
    { id: 'Stripe', name: 'Stripe', badge: 'API Rigor & Code Quality' },
  ];

  return (
    <div className="w-full min-h-[calc(100vh-4rem)] py-8 px-4 sm:px-6 lg:px-8 text-[#F8F4E9]">
      <div className="max-w-6xl mx-auto space-y-8">
        {/* Header Banner */}
        <GlassCard className="p-6 sm:p-8 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-6 border-[rgba(147,80,115,0.35)] shadow-[0_20px_45px_rgba(15,7,20,0.8),0_0_25px_rgba(147,80,115,0.2)]">
          <div className="space-y-2">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-[rgba(147,80,115,0.3)] border border-[rgba(246,219,192,0.3)] text-[#F6DBC0] text-xs font-bold">
              <Sparkles className="w-3.5 h-3.5 text-[#F6DBC0]" />
              <span>Step 1 · Tailor Your AI Interview Session</span>
            </div>
            <h1 className="text-3xl sm:text-4xl font-black text-[#F8F4E9] tracking-tight">
              Select Your Role Track & Rubric
            </h1>
            <p className="text-xs sm:text-sm text-[rgba(248,244,233,0.7)] max-w-xl font-medium">
              Choose from 10 specialized industry tracks, set your target company calibration, and optional resume customization.
            </p>
          </div>

          <div className="flex items-center gap-3">
            <PillButton
              onClick={() => setIsMediaModalOpen(true)}
              icon={<Camera className="w-4 h-4 text-[#F6DBC0]" />}
              size="md"
            >
              Hardware Check
            </PillButton>
          </div>
        </GlassCard>

        {error && (
          <div
            ref={errorRef}
            className="p-4 bg-[rgba(229,115,115,0.15)] border border-[rgba(229,115,115,0.4)] rounded-2xl text-xs text-[#E57373] flex items-center gap-3 font-semibold"
          >
            <AlertCircle className="w-5 h-5 shrink-0" />
            <span>{error}</span>
          </div>
        )}

        {/* 1. ROLE TRACK BENTO GRID (10 Tracks) */}
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-xs font-bold uppercase tracking-widest text-[#F8F4E9] flex items-center gap-2">
              <span className="w-6 h-6 rounded-full bg-[#935073] text-[#F8F4E9] flex items-center justify-center font-black text-xs">1</span>
              <span>Select Role Track (10 Tracks Available)</span>
            </h2>
            <Badge variant="peach" size="sm">Current: {selectedTrack}</Badge>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {tracks.map((t) => {
              const isSelected = selectedTrack === t.id;

              return (
                <div
                  key={t.id}
                  onClick={() => setSelectedTrack(t.id)}
                  className={`p-5 rounded-2xl border transition-all cursor-pointer relative overflow-hidden flex flex-col justify-between ${
                    isSelected
                      ? 'bg-[rgba(54,34,66,0.9)] border-[rgba(246,219,192,0.45)] shadow-[0_0_24px_rgba(147,80,115,0.4)]'
                      : 'bg-[rgba(42,27,51,0.65)] border-[rgba(248,244,233,0.06)] hover:bg-[rgba(54,34,66,0.7)] hover:border-[rgba(147,80,115,0.3)]'
                  }`}
                >
                  <div className="space-y-3">
                    <div className="flex items-center justify-between">
                      <div className="w-10 h-10 rounded-xl bg-[rgba(80,45,85,0.7)] border border-[rgba(147,80,115,0.4)] flex items-center justify-center shadow-sm">
                        {t.icon}
                      </div>

                      {isSelected ? (
                        <div className="w-6 h-6 rounded-full bg-[#935073] text-[#F8F4E9] flex items-center justify-center shadow-xs">
                          <Check className="w-3.5 h-3.5 text-[#F6DBC0]" />
                        </div>
                      ) : (
                        <div className="w-6 h-6 rounded-full border border-[rgba(248,244,233,0.15)]" />
                      )}
                    </div>

                    <div>
                      <h3 className="text-sm font-bold text-[#F8F4E9]">{t.title}</h3>
                      <p className="text-xs text-[rgba(248,244,233,0.6)] mt-1 leading-relaxed">
                        {t.desc}
                      </p>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* 2. DIFFICULTY & COMPANY PRESET (2 Columns) */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Difficulty Selection */}
          <GlassCard className="p-6 space-y-4">
            <h2 className="text-xs font-bold uppercase tracking-widest text-[#F8F4E9] flex items-center gap-2">
              <span className="w-6 h-6 rounded-full bg-[#935073] text-[#F8F4E9] flex items-center justify-center font-black text-xs">2</span>
              <span>Difficulty Tier</span>
            </h2>

            <div className="grid grid-cols-3 gap-2.5">
              {difficulties.map((d) => {
                const isSelected = selectedDifficulty === d.id;

                return (
                  <button
                    key={d.id}
                    type="button"
                    onClick={() => setSelectedDifficulty(d.id)}
                    className={`p-3.5 rounded-2xl border text-center transition-all cursor-pointer flex flex-col items-center justify-between ${
                      isSelected
                        ? 'bg-[#935073] text-[#F8F4E9] border-[rgba(246,219,192,0.4)] shadow-[0_0_18px_rgba(147,80,115,0.4)]'
                        : 'bg-[rgba(26,15,34,0.6)] border-[rgba(248,244,233,0.06)] text-[rgba(248,244,233,0.7)] hover:border-[rgba(147,80,115,0.3)]'
                    }`}
                  >
                    <span className="text-xs font-bold block">{d.label}</span>
                    <span className="text-[10px] text-[rgba(248,244,233,0.6)] mt-1 font-mono leading-tight">
                      {d.desc}
                    </span>
                  </button>
                );
              })}
            </div>
          </GlassCard>

          {/* Company Calibration Preset */}
          <GlassCard className="p-6 space-y-4">
            <h2 className="text-xs font-bold uppercase tracking-widest text-[#F8F4E9] flex items-center gap-2">
              <span className="w-6 h-6 rounded-full bg-[#935073] text-[#F8F4E9] flex items-center justify-center font-black text-xs">3</span>
              <span>Company Rubric Alignment</span>
            </h2>

            <div className="grid grid-cols-2 sm:grid-cols-3 gap-2.5">
              {companies.map((c) => {
                const isSelected = selectedCompany === c.id;

                return (
                  <button
                    key={c.id}
                    type="button"
                    onClick={() => setSelectedCompany(c.id)}
                    className={`p-3 rounded-xl border text-left transition-all cursor-pointer ${
                      isSelected
                        ? 'bg-[#935073] text-[#F8F4E9] border-[rgba(246,219,192,0.4)] shadow-[0_0_15px_rgba(147,80,115,0.4)]'
                        : 'bg-[rgba(26,15,34,0.6)] border-[rgba(248,244,233,0.06)] text-[rgba(248,244,233,0.7)] hover:border-[rgba(147,80,115,0.3)]'
                    }`}
                  >
                    <span className="text-xs font-bold block truncate">{c.name}</span>
                    <span className="text-[9px] text-[#F6DBC0] mt-0.5 block truncate font-mono">
                      {c.badge}
                    </span>
                  </button>
                );
              })}
            </div>
          </GlassCard>
        </div>

        {/* 3. OPTIONAL CUSTOM JOB DESCRIPTION & RESUME UPLOAD */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Target Job Description */}
          <GlassCard className="p-6 space-y-3">
            <div className="flex items-center justify-between">
              <h2 className="text-xs font-bold uppercase tracking-widest text-[#F8F4E9] flex items-center gap-2">
                <span className="w-6 h-6 rounded-full bg-[#935073] text-[#F8F4E9] flex items-center justify-center font-black text-xs">4</span>
                <span>Target Job Description (Optional)</span>
              </h2>
              <span className="text-[10px] text-[rgba(248,244,233,0.5)]">Gemini Context</span>
            </div>
            <textarea
              value={jobDescription}
              onChange={(e) => setJobDescription(e.target.value)}
              placeholder="Paste specific JD requirements (e.g. distributed transactions, GraphQL, Kubernetes) for custom tailored questions..."
              rows={4}
              className="w-full bg-[rgba(26,15,34,0.7)] border border-[rgba(248,244,233,0.08)] rounded-2xl p-3.5 text-xs text-[#F8F4E9] placeholder-[rgba(248,244,233,0.35)] outline-none focus:border-[#935073] font-mono resize-none"
            />
          </GlassCard>

          {/* Resume Upload & Skill Extraction */}
          <GlassCard className="p-6 space-y-3">
            <div className="flex items-center justify-between">
              <h2 className="text-xs font-bold uppercase tracking-widest text-[#F8F4E9] flex items-center gap-2">
                <span className="w-6 h-6 rounded-full bg-[#935073] text-[#F8F4E9] flex items-center justify-center font-black text-xs">5</span>
                <span>Candidate Resume (Optional)</span>
              </h2>
              {currentResume && <Badge variant="mint" size="sm">Resume Parsed</Badge>}
            </div>

            {currentResume ? (
              <div className="p-4 rounded-2xl bg-[rgba(26,15,34,0.6)] border border-[rgba(147,80,115,0.3)] space-y-2 text-xs">
                <div className="flex items-center gap-2 font-bold text-[#F8F4E9]">
                  <FileText className="w-4 h-4 text-[#F6DBC0]" />
                  <span>{currentResume.fileName}</span>
                </div>
                <div className="flex flex-wrap gap-1.5 pt-1">
                  {currentResume.parsedSkills.slice(0, 6).map((skill, idx) => (
                    <span
                      key={idx}
                      className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-[rgba(147,80,115,0.25)] text-[#F6DBC0] border border-[rgba(147,80,115,0.3)]"
                    >
                      {skill}
                    </span>
                  ))}
                </div>
              </div>
            ) : (
              <label className="border-2 border-dashed border-[rgba(248,244,233,0.12)] hover:border-[rgba(147,80,115,0.4)] rounded-2xl p-5 flex flex-col items-center justify-center text-center cursor-pointer transition-colors bg-[rgba(26,15,34,0.4)]">
                <Upload className="w-6 h-6 text-[#F6DBC0] mb-2" />
                <span className="text-xs font-bold text-[#F8F4E9] block">
                  {isUploadingResume ? 'Analyzing Resume with Gemini...' : 'Upload Resume (.txt / .md / .pdf)'}
                </span>
                <span className="text-[10px] text-[rgba(248,244,233,0.5)] mt-1">
                  AI extracts your skills to probe your real experience
                </span>
                <input
                  type="file"
                  accept=".txt,.md,.pdf"
                  onChange={handleFileUpload}
                  className="hidden"
                  disabled={isUploadingResume}
                />
              </label>
            )}
          </GlassCard>
        </div>

        {/* 4. QUESTION COUNT & START ACTION BAR */}
        <GlassCard className="p-6 flex flex-col sm:flex-row items-center justify-between gap-6 border-[rgba(246,219,192,0.3)] shadow-[0_0_30px_rgba(147,80,115,0.3)]">
          <div className="flex items-center gap-4">
            <span className="text-xs font-bold uppercase tracking-wider text-[rgba(248,244,233,0.7)]">
              Questions:
            </span>
            <div className="flex items-center gap-1.5">
              {[3, 4, 5].map((count) => (
                <button
                  key={count}
                  type="button"
                  onClick={() => setQuestionCount(count)}
                  className={`w-9 h-9 rounded-xl font-bold font-dot text-sm transition-all cursor-pointer ${
                    questionCount === count
                      ? 'bg-[#935073] text-[#F8F4E9] border border-[rgba(246,219,192,0.4)] shadow-[0_0_12px_rgba(147,80,115,0.5)]'
                      : 'bg-[rgba(26,15,34,0.6)] text-[rgba(248,244,233,0.6)] border border-[rgba(248,244,233,0.06)]'
                  }`}
                >
                  {count}
                </button>
              ))}
            </div>
            <span className="text-[11px] text-[rgba(248,244,233,0.5)] font-mono">
              (~{questionCount * 3} mins total)
            </span>
          </div>

          <PrimaryButton
            onClick={handleStartInterview}
            disabled={isStarting}
            size="lg"
            icon={isStarting ? <Loader2 className="w-5 h-5 text-[#F6DBC0] animate-spin" /> : <Play className="w-5 h-5 fill-[#F6DBC0] text-[#F6DBC0]" />}
          >
            {isStarting ? 'Synthesizing Session & Questions...' : 'Start AI Interview Session'}
          </PrimaryButton>
        </GlassCard>
      </div>

      <AudioSettingsModal
        isOpen={isMediaModalOpen}
        onClose={() => setIsMediaModalOpen(false)}
      />
    </div>
  );
};
