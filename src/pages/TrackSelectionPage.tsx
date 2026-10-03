import React, { useState, useEffect, useRef } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { TrackType, DifficultyType, Resume } from '../types';
import { AudioSettingsModal } from '../components/AudioSettingsModal';
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
  Video,
  Sliders,
} from 'lucide-react';

// Generous timeout so a slow AI question-generation call fails loudly with a
// retry option instead of leaving the user staring at an unresponsive button.
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

  // Whenever an error appears, scroll it into view. The submit button lives
  // at the bottom of a long form, so without this the error banner (rendered
  // near the top) can go completely unnoticed and it looks like the button
  // silently did nothing.
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

    // Clamp defensively on the client too, mirroring the server-side clamp,
    // so an out-of-range value can never silently change what gets sent.
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

      // If token expired or invalid, auto-refresh guest token and retry once
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

      // Direct navigation to live interview room with preloaded session & question #1
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
      icon: <Code2 className="w-6 h-6 text-indigo-600 dark:text-indigo-400" />,
    },
    {
      id: 'Frontend Engineer',
      title: 'Frontend Engineer',
      desc: 'React, performance optimization, state management, CSS architecture & web security.',
      icon: <Layout className="w-6 h-6 text-sky-600 dark:text-sky-400" />,
    },
    {
      id: 'Full Stack Engineer',
      title: 'Full Stack Engineer',
      desc: 'End-to-end web apps, Node.js/Express, REST/GraphQL APIs & database integrations.',
      icon: <Layers className="w-6 h-6 text-blue-600 dark:text-blue-400" />,
    },
    {
      id: 'Data Scientist',
      title: 'Data Scientist / AI ML',
      desc: 'Machine learning algorithms, model evaluation, feature engineering & A/B testing.',
      icon: <Database className="w-6 h-6 text-purple-600 dark:text-purple-400" />,
    },
    {
      id: 'Data Engineer',
      title: 'Data Engineer',
      desc: 'ETL pipelines, Spark, Kafka, data warehousing, SQL optimization & schema design.',
      icon: <Cpu className="w-6 h-6 text-teal-600 dark:text-teal-400" />,
    },
    {
      id: 'DevOps & Cloud',
      title: 'DevOps & Cloud Architect',
      desc: 'Kubernetes, Docker, CI/CD pipelines, Terraform, AWS/GCP & infrastructure as code.',
      icon: <Cloud className="w-6 h-6 text-cyan-600 dark:text-cyan-400" />,
    },
    {
      id: 'Cybersecurity',
      title: 'Cybersecurity Specialist',
      desc: 'Network defense, zero-trust architectures, vulnerability analysis & incident response.',
      icon: <Shield className="w-6 h-6 text-emerald-600 dark:text-emerald-400" />,
    },
    {
      id: 'Product Manager',
      title: 'Product Manager',
      desc: 'Product strategy, execution frameworks, metric design & cross-functional leadership.',
      icon: <Briefcase className="w-6 h-6 text-pink-600 dark:text-pink-400" />,
    },
    {
      id: 'QA & Automation',
      title: 'QA & Test Automation',
      desc: 'End-to-end test automation, Playwright/Selenium, load testing & quality strategy.',
      icon: <CheckSquare className="w-6 h-6 text-violet-600 dark:text-violet-400" />,
    },
    {
      id: 'HR/Behavioral',
      title: 'HR & Behavioral (STAR)',
      desc: 'Behavioral scenarios, conflict resolution, leadership principles & culture fit.',
      icon: <Users className="w-6 h-6 text-amber-600 dark:text-amber-400" />,
    },
  ];

  const difficulties: { id: DifficultyType; label: string; desc: string }[] = [
    { id: 'Beginner', label: 'Beginner', desc: 'Core fundamentals & direct questions' },
    { id: 'Intermediate', label: 'Intermediate', desc: 'Real-world tradeoffs & scenario solving' },
    { id: 'Advanced', label: 'Advanced', desc: 'Complex edge cases & principal-level depth' },
  ];

  const companies = [
    { id: 'General Tech', name: 'General Tech / Startups', badge: 'Standard FAANG Rubric', color: 'bg-indigo-50 dark:bg-indigo-950/60 text-indigo-700 dark:text-indigo-300 border-indigo-200 dark:border-indigo-800' },
    { id: 'Google', name: 'Google', badge: 'Googleyness & High Scale', color: 'bg-emerald-50 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-300 border-emerald-200 dark:border-emerald-800' },
    { id: 'Amazon', name: 'Amazon', badge: '16 Leadership Principles', color: 'bg-amber-50 dark:bg-amber-950/60 text-amber-700 dark:text-amber-300 border-amber-200 dark:border-amber-800' },
    { id: 'Meta', name: 'Meta', badge: 'Rapid Execution & Scale', color: 'bg-sky-50 dark:bg-sky-950/60 text-sky-700 dark:text-sky-300 border-sky-200 dark:border-sky-800' },
    { id: 'Microsoft', name: 'Microsoft', badge: 'Architecture & Enterprise', color: 'bg-blue-50 dark:bg-blue-950/60 text-blue-700 dark:text-blue-300 border-blue-200 dark:border-blue-800' },
    { id: 'Stripe', name: 'Stripe', badge: 'API Rigor & Code Quality', color: 'bg-purple-50 dark:bg-purple-950/60 text-purple-700 dark:text-purple-300 border-purple-200 dark:border-purple-800' },
  ];

  return (
    <div className="w-full min-h-[calc(100vh-4rem)] bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-slate-100 py-10 px-4 sm:px-6 lg:px-8 transition-colors">
      <div className="max-w-6xl xl:max-w-7xl mx-auto space-y-10">
      {/* Page Header */}
      <div className="text-center space-y-4">
        <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-indigo-50 dark:bg-indigo-950/80 border border-indigo-200 dark:border-indigo-500/40 text-indigo-700 dark:text-indigo-300 text-xs font-extrabold shadow-2xs">
          <Sparkles className="w-3.5 h-3.5 text-amber-500 animate-pulse" />
          <span>Step 1 of 2 — Configure Practice Parameters</span>
          <span className="bg-indigo-100 dark:bg-indigo-500/30 text-indigo-800 dark:text-indigo-200 px-2 py-0.5 rounded-full text-[10px] uppercase font-mono">FAANG Rubric</span>
        </div>
        <h1 className="text-3xl sm:text-5xl font-black text-slate-900 dark:text-white tracking-tight">
          Select Your <span className="bg-gradient-to-r from-indigo-600 via-purple-600 to-pink-500 dark:from-indigo-400 dark:via-purple-300 dark:to-pink-400 bg-clip-text text-transparent">Interview Track</span>
        </h1>
        <p className="text-slate-600 dark:text-slate-300 text-sm sm:text-base max-w-2xl mx-auto font-medium">
          Customize target company rubrics, difficulty levels, and upload your resume for precision question generation.
        </p>
      </div>

      {error && (
        <div
          ref={errorRef}
          className="p-4 bg-rose-50 dark:bg-rose-950/80 border border-rose-200 dark:border-rose-500/50 rounded-2xl text-xs text-rose-800 dark:text-rose-200 flex items-center gap-3 shadow-xs"
        >
          <AlertCircle className="w-5 h-5 text-rose-600 dark:text-rose-400 shrink-0" />
          <span className="font-semibold">{error}</span>
        </div>
      )}

      {/* Track Selector Cards */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <label className="block text-xs font-black text-slate-800 dark:text-slate-200 uppercase tracking-wider">
            1. Choose Target Role Track
          </label>
          <span className="text-xs text-indigo-600 dark:text-indigo-400 font-bold">10 Available Tracks</span>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4">
          {tracks.map((t) => (
            <div
              key={t.id}
              onClick={() => setSelectedTrack(t.id)}
              className={`p-5 rounded-2xl border cursor-pointer transition-all duration-300 active:scale-95 relative flex flex-col justify-between h-full group ${
                selectedTrack === t.id
                  ? 'bg-white dark:bg-slate-900 border-indigo-600 dark:border-indigo-400 shadow-xl ring-2 ring-indigo-500/30 scale-[1.02]'
                  : 'bg-white dark:bg-slate-900/90 border-slate-200/80 dark:border-slate-800/90 hover:border-indigo-300 dark:hover:border-indigo-500/40 shadow-xs hover:shadow-md'
              }`}
            >
              {selectedTrack === t.id && (
                <div className="absolute top-3 right-3 w-5 h-5 rounded-full bg-indigo-600 text-white flex items-center justify-center shadow-xs">
                  <Check className="w-3.5 h-3.5 stroke-[3]" />
                </div>
              )}
              <div>
                <div className="mb-3 p-2.5 rounded-xl bg-slate-50 dark:bg-slate-800/80 w-fit group-hover:scale-110 transition-transform">{t.icon}</div>
                <h3 className="font-black text-slate-900 dark:text-white text-sm sm:text-base mb-1">{t.title}</h3>
                <p className="text-slate-600 dark:text-slate-400 text-xs leading-relaxed font-medium">{t.desc}</p>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Target Company Style Selector */}
      <div className="space-y-3">
        <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider flex items-center justify-between">
          <span>2. Target Company Interview Style (Optional)</span>
          <span className="text-[10px] text-indigo-600 dark:text-indigo-400 font-extrabold uppercase">FAANG & Tech Giants</span>
        </label>
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
          {companies.map((c) => (
            <button
              key={c.id}
              type="button"
              onClick={() => setSelectedCompany(c.id)}
              className={`p-3.5 rounded-2xl border text-left transition-all active:scale-95 flex flex-col justify-between relative ${
                selectedCompany === c.id
                  ? 'bg-slate-900 text-white border-slate-900 dark:bg-indigo-600 dark:border-indigo-500 dark:text-white shadow-md ring-2 ring-indigo-500/30 font-bold'
                  : 'bg-white dark:bg-slate-900 border-slate-200/80 dark:border-slate-800 text-slate-800 dark:text-slate-200 hover:border-slate-300'
              }`}
            >
              <div>
                <span className="text-xs font-black block">{c.name}</span>
                <span className={`inline-block text-[9px] font-extrabold px-1.5 py-0.5 rounded mt-1.5 border ${
                  selectedCompany === c.id ? 'bg-white/20 text-white border-white/30' : c.color
                }`}>
                  {c.badge}
                </span>
              </div>
            </button>
          ))}
        </div>
      </div>

      {/* Difficulty Selector & Questions Count */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="md:col-span-2 space-y-3">
          <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider">
            3. Difficulty Level
          </label>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            {difficulties.map((d) => (
              <button
                key={d.id}
                type="button"
                onClick={() => setSelectedDifficulty(d.id)}
                className={`p-4 rounded-xl border text-left transition-all active:scale-95 cursor-pointer ${
                  selectedDifficulty === d.id
                    ? 'bg-slate-900 text-white border-slate-900 dark:bg-indigo-600/20 dark:border-indigo-500 dark:text-white font-extrabold shadow-xs'
                    : 'bg-white dark:bg-slate-900 border-slate-200/80 dark:border-slate-800 text-slate-700 dark:text-slate-300 hover:border-slate-300'
                }`}
              >
                <div className="text-sm font-bold">{d.label}</div>
                <div className="text-[11px] text-slate-500 dark:text-slate-400 mt-1 font-medium">{d.desc}</div>
              </button>
            ))}
          </div>
        </div>

        <div className="space-y-3">
          <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider flex items-center justify-between">
            <span>4. Questions Count</span>
            <span className="text-[10px] text-indigo-600 dark:text-indigo-400 font-extrabold uppercase">
              Selected: {questionCount}
            </span>
          </label>
          <div className="grid grid-cols-3 gap-2">
            {[
              { count: 3, label: '3 Questions', desc: '~10 mins' },
              { count: 4, label: '4 Questions', desc: '~15 mins' },
              { count: 5, label: '5 Questions', desc: '~20 mins' },
            ].map((q) => (
              <button
                key={q.count}
                type="button"
                aria-pressed={questionCount === q.count}
                onClick={() => setQuestionCount(q.count)}
                className={`p-3 rounded-xl border text-center transition-all active:scale-95 cursor-pointer ${
                  questionCount === q.count
                    ? 'bg-slate-900 text-white border-slate-900 dark:bg-indigo-600/20 dark:border-indigo-500 dark:text-white font-extrabold shadow-xs ring-2 ring-indigo-500/20'
                    : 'bg-white dark:bg-slate-900 border-slate-200/80 dark:border-slate-800 text-slate-700 dark:text-slate-300 hover:border-slate-300'
                }`}
              >
                <div className="text-xs sm:text-sm font-bold">{q.count} Qs</div>
                <div className="text-[10px] text-slate-500 dark:text-slate-400 mt-0.5 font-medium">{q.desc}</div>
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Resume & Job Description Inputs */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 pt-4 border-t border-slate-200 dark:border-slate-800/80">
        {/* Resume Upload / Active Resume */}
        <div className="space-y-3">
          <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider">
            5. Candidate Resume (Optional)
          </label>

          {currentResume ? (
            <div className="bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 p-4 rounded-xl space-y-3 shadow-xs">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2 text-emerald-700 dark:text-emerald-400 text-xs font-bold">
                  <FileText className="w-4 h-4" />
                  <span>{currentResume.fileName}</span>
                </div>
                <span className="text-[10px] bg-emerald-50 dark:bg-emerald-500/10 text-emerald-800 dark:text-emerald-300 px-2 py-0.5 rounded border border-emerald-200 dark:border-emerald-500/20 font-bold">
                  Skills Extracted
                </span>
              </div>

              <div className="flex flex-wrap gap-1.5 pt-1">
                {currentResume.parsedSkills.slice(0, 6).map((skill, idx) => (
                  <span key={idx} className="bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 text-[11px] font-bold px-2 py-0.5 rounded">
                    {skill}
                  </span>
                ))}
              </div>

              <label className="block text-[11px] text-indigo-600 dark:text-indigo-400 font-bold hover:underline cursor-pointer pt-1">
                Replace resume...
                <input
                  type="file"
                  accept=".txt,.pdf,.doc,.docx"
                  onChange={handleFileUpload}
                  className="hidden"
                />
              </label>
            </div>
          ) : (
            <div className="border-2 border-dashed border-slate-300 dark:border-slate-800 hover:border-indigo-500 bg-white dark:bg-slate-900/50 p-6 rounded-xl text-center space-y-2 transition shadow-xs">
              <Upload className="w-6 h-6 text-slate-400 mx-auto" />
              <p className="text-xs text-slate-700 dark:text-slate-300 font-bold">
                {isUploadingResume ? 'Analyzing resume skills via Gemini...' : 'Click or drop PDF/TXT resume to customize questions'}
              </p>
              <input
                type="file"
                accept=".txt,.pdf,.doc,.docx"
                onChange={handleFileUpload}
                disabled={isUploadingResume}
                className="block w-full text-xs text-slate-500 dark:text-slate-400 file:mr-4 file:py-1.5 file:px-3 file:rounded-lg file:border-0 file:text-xs file:font-bold file:bg-slate-900 dark:file:bg-indigo-600 file:text-white cursor-pointer"
              />
            </div>
          )}
        </div>

        {/* Job Description Textarea */}
        <div className="space-y-3">
          <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider">
            6. Target Job Description (Optional)
          </label>
          <textarea
            value={jobDescription}
            onChange={(e) => setJobDescription(e.target.value)}
            placeholder="Paste target job description or key requirements here (e.g., 'Looking for a Senior Backend Engineer with expertise in Redis caching, GraphQL, and microservices')..."
            rows={4}
            className="w-full bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 rounded-xl p-3 text-xs text-slate-900 dark:text-white placeholder-slate-400 outline-none focus:border-slate-900 dark:focus:border-indigo-500 font-medium transition resize-none shadow-xs"
          />
        </div>
      </div>

      {/* 7. Camera & Audio Setup Section */}
      <div className="pt-4 border-t border-slate-200 dark:border-slate-800/80 space-y-3">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider flex items-center gap-2">
            <Camera className="w-4 h-4 text-indigo-500" />
            7. Video Camera & Live Audio Setup
          </label>

          <button
            type="button"
            onClick={() => setIsMediaModalOpen(true)}
            className="text-xs font-extrabold text-indigo-600 dark:text-indigo-400 hover:underline flex items-center gap-1.5 self-start sm:self-auto"
          >
            <Sliders className="w-3.5 h-3.5" />
            <span>Test Webcam & Microphone</span>
          </button>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div
            onClick={() => {
              const next = !isCameraEnabled;
              setIsCameraEnabled(next);
              localStorage.setItem('interview_camera_enabled', String(next));
            }}
            className={`p-4 rounded-2xl border cursor-pointer transition-all flex items-center justify-between gap-4 ${
              isCameraEnabled
                ? 'bg-indigo-50/70 dark:bg-indigo-950/40 border-indigo-300 dark:border-indigo-800'
                : 'bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800 opacity-70'
            }`}
          >
            <div className="flex items-center gap-3">
              <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${
                isCameraEnabled ? 'bg-indigo-600 text-white' : 'bg-slate-200 dark:bg-slate-800 text-slate-400'
              }`}>
                <Camera className="w-5 h-5" />
              </div>
              <div>
                <div className="text-xs font-extrabold text-slate-900 dark:text-white flex items-center gap-2">
                  <span>Webcam Video Feed</span>
                  {isCameraEnabled && (
                    <span className="text-[10px] bg-emerald-100 dark:bg-emerald-950 text-emerald-700 dark:text-emerald-300 px-1.5 py-0.2 rounded font-bold">
                      Recommended
                    </span>
                  )}
                </div>
                <p className="text-[11px] text-slate-500 dark:text-slate-400">
                  {isCameraEnabled ? 'Live camera enabled for proctoring' : 'Audio-only voice interview'}
                </p>
              </div>
            </div>

            <div className={`w-6 h-6 rounded-full border-2 flex items-center justify-center ${
              isCameraEnabled ? 'border-indigo-600 bg-indigo-600 text-white' : 'border-slate-300 dark:border-slate-700'
            }`}>
              {isCameraEnabled && <Check className="w-3.5 h-3.5" />}
            </div>
          </div>

          <div
            onClick={() => setIsMediaModalOpen(true)}
            className="p-4 rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 hover:border-slate-300 dark:hover:border-slate-700 cursor-pointer transition-all flex items-center justify-between gap-4"
          >
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-emerald-50 dark:bg-emerald-950/60 text-emerald-600 dark:text-emerald-400 border border-emerald-200 dark:border-emerald-800 flex items-center justify-center">
                <Video className="w-5 h-5" />
              </div>
              <div>
                <div className="text-xs font-extrabold text-slate-900 dark:text-white">
                  Camera & Mic Pre-Check
                </div>
                <p className="text-[11px] text-slate-500 dark:text-slate-400">
                  Preview framing, lighting & voice levels
                </p>
              </div>
            </div>
            <ArrowRight className="w-4 h-4 text-slate-400" />
          </div>
        </div>
      </div>

      {/* Submit Action */}
      <div className="pt-4 flex justify-end">
        <button
          type="button"
          onClick={handleStartInterview}
          disabled={isStarting}
          className="w-full sm:w-auto px-10 py-4 bg-slate-900 hover:bg-slate-800 dark:bg-indigo-600 dark:hover:bg-indigo-500 disabled:opacity-50 text-white font-extrabold rounded-xl shadow-lg transition flex items-center justify-center gap-3 text-base"
        >
          {isStarting ? (
            <>
              <Loader2 className="w-5 h-5 animate-spin" />
              <span>Generating Question #1...</span>
            </>
          ) : (
            <>
              <span>Enter Interview Room · {questionCount} Questions</span>
              <ArrowRight className="w-5 h-5" />
            </>
          )}
        </button>
      </div>
    </div>

    {/* Full-screen loading overlay: makes it unmistakable that the app is
        working, since AI question generation can take several seconds and
        the page would otherwise look "stuck" with no other visual cue. */}
    {isStarting && (
      <div className="fixed inset-0 z-50 bg-slate-950/70 backdrop-blur-sm flex items-center justify-center px-4">
        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl shadow-2xl p-8 max-w-sm w-full text-center space-y-4">
          <Loader2 className="w-10 h-10 text-indigo-600 dark:text-indigo-400 animate-spin mx-auto" />
          <h3 className="text-lg font-extrabold text-slate-900 dark:text-white">Setting up your interview room</h3>
          <p className="text-sm text-slate-500 dark:text-slate-400 font-medium">
            Generating your first {selectedTrack} question with AI. This usually takes a few seconds — please don't close this tab.
          </p>
        </div>
      </div>
    )}

    {/* Camera & Mic Pre-flight modal */}
    <AudioSettingsModal
      isOpen={isMediaModalOpen}
      onClose={() => setIsMediaModalOpen(false)}
    />
  </div>
);
};
