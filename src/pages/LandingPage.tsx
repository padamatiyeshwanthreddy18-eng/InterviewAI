import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { PreparationTips } from '../components/PreparationTips';
import { TechText } from '../components/TechText';
import { ROLE_TRACKS } from '../types';
import {
  GlassCard,
  PrimaryButton,
  PillButton,
  Badge,
} from '../components/ui';
import {
  Sparkles,
  Bot,
  Mic,
  BarChart3,
  BrainCircuit,
  FileCheck2,
  CheckCircle2,
  ArrowRight,
  ShieldCheck,
  Star,
  Zap,
  Play,
  Volume2,
  ChevronDown,
  ChevronUp,
  Target,
  Clock,
  HelpCircle,
} from 'lucide-react';

interface TrackDemo {
  id: string;
  name: string;
  badge: string;
  question: string;
  sampleAnswer: string;
  technicalScore: number;
  commScore: number;
  sentimentScore: number;
  critique: string;
  audioDuration: string;
  tags: string[];
}

const DEMO_TRACKS: TrackDemo[] = [
  {
    id: 'sde',
    name: 'SDE & Backend',
    badge: 'FAANG Level L5',
    question: 'How would you architect a distributed rate limiter that handles 50,000 requests/sec with Redis cluster failover?',
    sampleAnswer: 'I recommend the sliding window log algorithm with Redis sorted sets. For high concurrency, pipeline commands using Lua scripts to ensure atomic execution...',
    technicalScore: 94,
    commScore: 91,
    sentimentScore: 95,
    critique: 'Excellent breakdown of atomic Lua scripts to eliminate race conditions. Mentioned memory overhead tradeoffs clearly.',
    audioDuration: '01:14',
    tags: ['Redis', 'Distributed Systems', 'Sliding Window', 'Atomic Scripts'],
  },
  {
    id: 'system_design',
    name: 'System Design',
    badge: 'Staff Engineer',
    question: 'Design a global video live streaming chat system like Twitch with sub-second latency and 10M concurrent viewers.',
    sampleAnswer: 'We decouple chat into fan-out clusters using WebSockets, edge proxies via CDN, and a Kafka backplane partitioned by Channel ID...',
    technicalScore: 96,
    commScore: 89,
    sentimentScore: 92,
    critique: 'Superb partitioning strategy with Kafka and edge caching. Good awareness of backpressure handling during viral stream spikes.',
    audioDuration: '01:42',
    tags: ['WebSockets', 'Kafka', 'Edge Caching', 'Fan-out Architecture'],
  },
  {
    id: 'aiml',
    name: 'AI & ML Engineering',
    badge: 'Research & Applied',
    question: 'How do you mitigate catastrophic forgetting when fine-tuning an LLM with LoRA on domain-specific biomedical text?',
    sampleAnswer: 'We retain a replay buffer of general domain instructions, set lower learning rates for rank adaptation matrices, and monitor perplexity on validation holdouts...',
    technicalScore: 93,
    commScore: 92,
    sentimentScore: 90,
    critique: 'Accurate explanation of Low-Rank Adaptation hyperparameters and replay regularization. Very structured response.',
    audioDuration: '01:05',
    tags: ['LoRA', 'Catastrophic Forgetting', 'PEFT', 'Perplexity'],
  },
  {
    id: 'behavioral',
    name: 'Behavioral & Leadership',
    badge: 'STAR Method',
    question: 'Tell me about a high-stakes disagreement with a Principal Architect on project direction and how you navigated it.',
    sampleAnswer: 'Situation: We faced a debate between gRPC vs GraphQL for our core microservice. Task: I needed to align the team without delaying our Q3 launch. Action: Built a reproducible benchmark suite...',
    technicalScore: 90,
    commScore: 98,
    sentimentScore: 96,
    critique: 'Flawless STAR framing. Focused on data-driven consensus rather than personal opinion, showing strong executive maturity.',
    audioDuration: '01:28',
    tags: ['STAR Method', 'Conflict Resolution', 'Data-Driven', 'Executive Comms'],
  },
];

const FAANG_COMPANIES = [
  { name: 'Google', role: 'L4/L5 SWE & SRE' },
  { name: 'Meta', role: 'E4/E5 Fullstack & AI' },
  { name: 'Amazon', role: 'SDE II & Bar Raiser' },
  { name: 'Microsoft', role: 'Senior Cloud & Systems' },
  { name: 'Apple', role: 'Core OS & Hardware SW' },
  { name: 'Netflix', role: 'Senior Distributed Eng' },
  { name: 'Uber', role: 'Staff Real-Time Infra' },
  { name: 'OpenAI', role: 'Applied AI & Platform' },
];

export const LandingPage: React.FC = () => {
  const { user } = useAuth();
  const [selectedDemo, setSelectedDemo] = useState<TrackDemo>(DEMO_TRACKS[0]);
  const [isPlayingDemo, setIsPlayingDemo] = useState(false);
  const [activeFaq, setActiveFaq] = useState<number | null>(0);

  // Salary Calculator State
  const [yearsExp, setYearsExp] = useState<number>(4);
  const [selectedTargetRole, setSelectedTargetRole] = useState<'SDE' | 'Staff' | 'AI' | 'PM'>('SDE');

  const calculateTargetSalary = () => {
    const base = {
      SDE: 130000 + yearsExp * 16000,
      Staff: 180000 + yearsExp * 22000,
      AI: 150000 + yearsExp * 20000,
      PM: 140000 + yearsExp * 17000,
    }[selectedTargetRole];
    return Math.round(base);
  };

  const calculateReadinessDays = () => {
    return Math.max(7, Math.round(28 - yearsExp * 2));
  };

  const faqs = [
    {
      q: 'How does InterviewAI simulate real voice interviews?',
      a: 'InterviewAI leverages browser Speech-to-Text with low-latency Web Audio capture and Google Gemini multimodal reasoning. The AI listens to your voice answers, transcribes them with high fidelity, and generates dynamic follow-up probing questions just like a senior human interviewer.',
    },
    {
      q: 'Can I upload my actual resume and target job descriptions?',
      a: 'Yes! You can upload your PDF or DOCX resume or paste any job description. InterviewAI automatically analyzes your specific tech stack, frameworks, and past projects to generate ultra-relevant questions and identify potential resume gaps.',
    },
    {
      q: 'What interview tracks and roles are supported?',
      a: 'We support 10 specialized tracks: Software Development (Backend, Frontend, Full Stack), System Design, Data Science, AI/ML Engineering, DevOps & Cloud, Cybersecurity, Product Management, QA & Test Automation, and HR/Behavioral STAR method.',
    },
    {
      q: 'Are the questions customized for specific companies like Google or Amazon?',
      a: 'Absolutely. You can select company presets (FAANG, Tier-1 Tech, High-Growth Unicorns, Seed Startups). For Amazon, questions incorporate Leadership Principles; for Google, deep algorithmic and scalability rigor.',
    },
    {
      q: 'Can I export my scorecard and improvement roadmap?',
      a: 'Yes, after every interview round you receive an in-depth scorecard with radar analytics, speech pace feedback, model answers with sample code, and a downloadable professional PDF report you can save or share.',
    },
  ];

  return (
    <div className="min-h-screen text-[#F8F4E9] flex flex-col selection:bg-[#935073] selection:text-[#F8F4E9]">
      {/* HERO SECTION */}
      <section className="relative overflow-hidden pt-6 sm:pt-8 md:pt-10 pb-10 md:pb-14">
        {/* Soft ambient radial glows */}
        <div
          className="absolute top-1/3 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[700px] max-w-[95vw] h-[300px] bg-[radial-gradient(ellipse_at_center,rgba(147,80,115,0.22)_0%,rgba(80,45,85,0.12)_45%,transparent_75%)] blur-3xl pointer-events-none -z-10"
          aria-hidden="true"
        />
        <div
          className="absolute bottom-4 left-1/2 -translate-x-1/2 w-[520px] max-w-[85vw] h-[160px] bg-[radial-gradient(ellipse_at_center,rgba(246,219,192,0.07)_0%,transparent_70%)] blur-3xl pointer-events-none -z-10"
          aria-hidden="true"
        />

        <div className="max-w-[1100px] mx-auto px-4 sm:px-6 relative z-10 text-center flex flex-col items-center">
          {/* Top Eyebrow Badge Pill */}
          <div className="inline-flex items-center gap-2.5 px-4 py-1.5 rounded-full bg-[rgba(80,45,85,0.4)] border border-[rgba(246,219,192,0.3)] text-[#F6DBC0] text-xs font-bold mb-2 shadow-[0_0_20px_rgba(147,80,115,0.3)] backdrop-blur-md select-none animate-hero-fade-1">
            <span className="flex h-2 w-2 relative">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-[#F6DBC0] opacity-75" />
              <span className="relative inline-flex rounded-full h-2 w-2 bg-[#F6DBC0]" />
            </span>
            <span>Next-Gen AI Voice Coaching Platform</span>
            <span className="bg-[rgba(147,80,115,0.4)] text-[#F8F4E9] px-2 py-0.5 rounded-full text-[10px] font-extrabold uppercase tracking-wide">
              Gemini 3.7
            </span>
          </div>

          {/* Wordmark rendered via React Bits TechText */}
          <h1 className="relative w-full my-0 py-0">
            <span className="sr-only">Interview AI</span>
            <div
              style={{
                width: '100%',
                maxWidth: 1100,
                height: 'clamp(200px, 32vh, 320px)',
                position: 'relative',
                margin: '0 auto',
                fontFamily: 'var(--font-sans), "Plus Jakarta Sans", sans-serif',
              }}
            >
              <TechText
                text="Interview AI"
                fontWeight={700}
                fontSize={170}
                letterSpacing={-0.05}
                color="#F8F4E9"
                accentColor="#935073"
                reveal="letter"
                reach={220}
                softness={0.7}
                dashLength={4}
                dashGap={2}
                lineStyle="dashed"
                strokeWidth={1.5}
                specks={15}
                selection
                labels
                draggable
                sweep
                speed={1}
              />
            </div>
          </h1>

          {/* Interaction Hint (hidden on touch devices) */}
          <p className="hidden sm:inline-flex items-center justify-center gap-1.5 text-[11px] font-mono text-[rgba(248,244,233,0.42)] select-none pointer-events-none -mt-1 mb-3 tracking-wide">
            <span className="inline-block w-1.5 h-1.5 rounded-full bg-[#935073] animate-pulse" />
            <span>Hover or drag the letters</span>
          </p>

          {/* Two Taglines */}
          <div className="space-y-1.5 max-w-2xl mx-auto px-4 animate-hero-fade-2">
            <p className="text-[clamp(1.4rem,2.3vw,1.95rem)] font-medium text-[#F8F4E9] tracking-tight leading-snug">
              Speak it. Get grilled.{' '}
              <span className="bg-gradient-to-r from-[#935073] via-[#b6688f] to-[#F6DBC0] bg-clip-text text-transparent font-semibold">
                Get hired.
              </span>
            </p>
            <p className="text-[clamp(0.95rem,1.15vw,1.125rem)] text-[rgba(248,244,233,0.65)] font-normal leading-normal">
              Real-time AI voice coaching for Tech &amp; FAANG interviews.
            </p>
          </div>

          {/* CTA Buttons */}
          <div className="mt-5 flex flex-col sm:flex-row items-center justify-center gap-3.5 animate-hero-fade-3">
            <PrimaryButton
              onClick={() => (user ? window.location.assign('/track-selection') : window.location.assign('/register'))}
              size="lg"
              icon={<Sparkles className="w-5 h-5 text-[#F6DBC0]" />}
              className="shadow-[0_0_24px_rgba(147,80,115,0.45)] hover:shadow-[0_0_36px_rgba(147,80,115,0.65)]"
            >
              {user ? 'Enter Interview Room' : 'Start Free Mock Interview'}
            </PrimaryButton>

            <a
              href="#interactive-demo"
              className="focus:outline-none focus-visible:ring-2 focus-visible:ring-[#F6DBC0] rounded-full"
            >
              <PillButton
                size="lg"
                icon={<Bot className="w-5 h-5 text-[#F6DBC0]" />}
              >
                Explore Live Voice Demo
              </PillButton>
            </a>
          </div>

          {/* Four Feature Chips */}
          <div className="mt-7 grid grid-cols-2 lg:grid-cols-4 gap-2.5 w-full max-w-4xl text-left animate-hero-fade-4">
            {[
              `${ROLE_TRACKS.length} Role Tracks (SDE, System Design, AI)`,
              'Low-Latency Voice Speech Recognition',
              'AI Resume & JD Skill Matcher',
              'Exportable Scorecards & PDF Reports',
            ].map((feature, idx) => (
              <div
                key={idx}
                className="glass-card px-3.5 py-2.5 rounded-xl border border-[rgba(248,244,233,0.08)] bg-[rgba(42,27,51,0.58)] flex items-center gap-2.5 shadow-xs hover:border-[rgba(147,80,115,0.4)] transition-all"
              >
                <CheckCircle2 className="w-4 h-4 text-[#7FE3B9] shrink-0" />
                <span className="text-[11px] sm:text-xs font-semibold text-[rgba(248,244,233,0.88)] leading-tight">
                  {feature}
                </span>
              </div>
            ))}
          </div>

          {/* Slim "How It Works" Strip */}
          <div className="mt-8 pt-5 border-t border-[rgba(248,244,233,0.06)] w-full max-w-4xl">
            <div className="text-center mb-3">
              <span className="text-[10px] font-extrabold uppercase tracking-widest text-[#F6DBC0]/80">
                How It Works
              </span>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 text-left">
              <div className="glass-panel p-3 rounded-xl border border-[rgba(248,244,233,0.06)] bg-[rgba(35,21,48,0.5)] flex items-start gap-3 hover:border-[rgba(147,80,115,0.3)] transition-colors">
                <div className="w-6 h-6 rounded-lg bg-[rgba(80,45,85,0.65)] border border-[rgba(147,80,115,0.4)] flex items-center justify-center text-[#F6DBC0] shrink-0 text-xs font-bold font-mono">
                  1
                </div>
                <div>
                  <h4 className="text-xs font-bold text-[#F8F4E9]">Pick Track &amp; Company</h4>
                  <p className="text-[11px] text-[rgba(248,244,233,0.6)] mt-0.5 leading-snug">
                    Choose from {ROLE_TRACKS.length} roles, set difficulty, and select company presets.
                  </p>
                </div>
              </div>

              <div className="glass-panel p-3 rounded-xl border border-[rgba(248,244,233,0.06)] bg-[rgba(35,21,48,0.5)] flex items-start gap-3 hover:border-[rgba(147,80,115,0.3)] transition-colors">
                <div className="w-6 h-6 rounded-lg bg-[rgba(80,45,85,0.65)] border border-[rgba(147,80,115,0.4)] flex items-center justify-center text-[#F6DBC0] shrink-0 text-xs font-bold font-mono">
                  2
                </div>
                <div>
                  <h4 className="text-xs font-bold text-[#F8F4E9]">Speak with AI Live</h4>
                  <p className="text-[11px] text-[rgba(248,244,233,0.6)] mt-0.5 leading-snug">
                    Answer questions verbally. The AI transcribes and asks dynamic follow-ups.
                  </p>
                </div>
              </div>

              <div className="glass-panel p-3 rounded-xl border border-[rgba(248,244,233,0.06)] bg-[rgba(35,21,48,0.5)] flex items-start gap-3 hover:border-[rgba(147,80,115,0.3)] transition-colors">
                <div className="w-6 h-6 rounded-lg bg-[rgba(80,45,85,0.65)] border border-[rgba(147,80,115,0.4)] flex items-center justify-center text-[#F6DBC0] shrink-0 text-xs font-bold font-mono">
                  3
                </div>
                <div>
                  <h4 className="text-xs font-bold text-[#F8F4E9]">Scorecard &amp; Roadmap</h4>
                  <p className="text-[11px] text-[rgba(248,244,233,0.6)] mt-0.5 leading-snug">
                    Get technical &amp; speech metrics, model answers, and an exportable report.
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Target Companies Banner */}
      <section className="py-8 bg-[rgba(26,15,34,0.6)] border-y border-[rgba(248,244,233,0.08)]">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <p className="text-center text-xs font-extrabold uppercase tracking-widest text-[#F6DBC0] mb-6">
            Curated Question Banks & Rubrics for Top Tier Tech
          </p>
          <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-8 gap-3">
            {FAANG_COMPANIES.map((company, i) => (
              <div
                key={i}
                className="bg-[rgba(42,27,51,0.7)] border border-[rgba(248,244,233,0.06)] rounded-2xl p-3 text-center shadow-sm hover:border-[rgba(147,80,115,0.4)] transition-all hover:scale-105"
              >
                <span className="font-extrabold text-sm text-[#F8F4E9] block">{company.name}</span>
                <span className="text-[10px] text-[rgba(248,244,233,0.5)] font-mono block truncate mt-0.5">
                  {company.role}
                </span>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* INTERACTIVE VOICE AI PREVIEW (Hero Live Demo) */}
      <section id="interactive-demo" className="py-16 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-10">
          <Badge variant="peach" size="sm" className="mb-3">
            Live AI Simulation
          </Badge>
          <h2 className="text-3xl sm:text-4xl font-black text-[#F8F4E9]">
            Experience Real-Time Voice Grilling
          </h2>
          <p className="mt-2 text-xs sm:text-sm text-[rgba(248,244,233,0.65)] max-w-xl mx-auto font-medium">
            Listen to how Gemini evaluates verbal depth, architectural clarity, and confidence.
          </p>

          {/* Track selector tabs */}
          <div className="flex flex-wrap items-center justify-center gap-2 mt-6">
            {DEMO_TRACKS.map((track) => (
              <button
                key={track.id}
                onClick={() => setSelectedDemo(track)}
                className={`px-4 py-2 rounded-full text-xs font-bold transition-all cursor-pointer ${
                  selectedDemo.id === track.id
                    ? 'bg-[#935073] text-[#F8F4E9] border border-[rgba(246,219,192,0.4)] shadow-[0_0_15px_rgba(147,80,115,0.45)]'
                    : 'bg-[rgba(26,15,34,0.6)] text-[rgba(248,244,233,0.6)] border border-[rgba(248,244,233,0.06)] hover:text-[#F8F4E9]'
                }`}
              >
                {track.name}
              </button>
            ))}
          </div>
        </div>

        {/* Demo Stage GlassCard */}
        <GlassCard className="p-6 sm:p-8 space-y-6 border-[rgba(147,80,115,0.35)] shadow-[0_20px_45px_rgba(15,7,20,0.85)]">
          {/* Question Box */}
          <div className="p-5 rounded-2xl bg-[rgba(26,15,34,0.7)] border border-[rgba(248,244,233,0.08)]">
            <div className="flex items-center justify-between mb-3">
              <span className="text-xs font-bold tracking-wider text-[#F6DBC0] uppercase flex items-center gap-1.5">
                <BrainCircuit className="w-4 h-4 text-[#F6DBC0]" />
                <span>AI Interviewer Prompt ({selectedDemo.badge})</span>
              </span>
              <button
                onClick={() => setIsPlayingDemo(!isPlayingDemo)}
                className="flex items-center gap-1.5 px-3 py-1 rounded-full bg-[#935073] text-[#F8F4E9] text-xs font-bold hover:bg-[#a65d83] transition shadow-xs cursor-pointer"
              >
                {isPlayingDemo ? <Volume2 className="w-3.5 h-3.5 text-[#F6DBC0] animate-pulse" /> : <Play className="w-3.5 h-3.5" />}
                <span>{isPlayingDemo ? 'Playing AI Voice...' : 'Listen to Prompt'}</span>
              </button>
            </div>
            <p className="text-base sm:text-lg font-bold text-[#F8F4E9] leading-snug">
              "{selectedDemo.question}"
            </p>
            <div className="flex flex-wrap gap-2 mt-3">
              {selectedDemo.tags.map((tag, idx) => (
                <span key={idx} className="px-2.5 py-0.5 rounded-full bg-[rgba(147,80,115,0.2)] text-[#F6DBC0] text-[11px] font-mono border border-[rgba(147,80,115,0.3)]">
                  #{tag}
                </span>
              ))}
            </div>
          </div>

          {/* Transcript & Waveform + Instant Critique */}
          <div className="grid grid-cols-1 md:grid-cols-12 gap-5">
            <div className="md:col-span-7 p-5 rounded-2xl bg-[rgba(26,15,34,0.65)] border border-[rgba(248,244,233,0.06)] flex flex-col justify-between space-y-4">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-[#7FE3B9] flex items-center gap-2">
                  <Mic className="w-4 h-4 text-[#7FE3B9] animate-pulse" />
                  Live Candidate Voice Transcription
                </span>
                <span className="text-xs font-mono font-bold text-[rgba(248,244,233,0.5)]">
                  {selectedDemo.audioDuration} / 02:00
                </span>
              </div>

              {/* Violet Dusk Audio Waveform Equalizer */}
              <div className="h-12 bg-[rgba(15,7,20,0.7)] rounded-xl flex items-center justify-center gap-1.5 px-4 border border-[rgba(248,244,233,0.06)]">
                {[35, 75, 45, 95, 60, 100, 55, 85, 40, 95, 70, 45, 65, 80, 50, 90, 45, 70, 30, 85].map((h, i) => (
                  <div
                    key={i}
                    style={{ height: `${h}%` }}
                    className="w-1.5 bg-gradient-to-t from-[#502D55] via-[#935073] to-[#F6DBC0] rounded-full animate-pulse"
                  />
                ))}
              </div>

              <p className="text-xs sm:text-sm text-[rgba(248,244,233,0.8)] italic font-mono leading-relaxed bg-[rgba(42,27,51,0.5)] p-3.5 rounded-xl border border-[rgba(248,244,233,0.04)]">
                "{selectedDemo.sampleAnswer}"
              </p>
            </div>

            {/* Instant AI Evaluation Card */}
            <div className="md:col-span-5 p-5 rounded-2xl bg-[rgba(54,34,66,0.7)] border border-[rgba(147,80,115,0.4)] shadow-[0_0_20px_rgba(147,80,115,0.25)] flex flex-col justify-between">
              <div>
                <div className="flex items-center justify-between mb-4">
                  <span className="text-xs font-extrabold text-[#F6DBC0] uppercase tracking-wider flex items-center gap-1.5">
                    <Sparkles className="w-4 h-4 text-[#F6DBC0]" />
                    Instant AI Critique
                  </span>
                  <Badge variant="mint" size="sm">Passed</Badge>
                </div>

                <div className="grid grid-cols-3 gap-2 text-center mb-4">
                  <div className="p-2.5 rounded-xl bg-[rgba(26,15,34,0.6)] border border-[rgba(248,244,233,0.06)]">
                    <span className="text-xl font-black font-dot text-[#F6DBC0]">{selectedDemo.technicalScore}</span>
                    <span className="text-[10px] font-bold text-[rgba(248,244,233,0.5)] block uppercase">Technical</span>
                  </div>
                  <div className="p-2.5 rounded-xl bg-[rgba(26,15,34,0.6)] border border-[rgba(248,244,233,0.06)]">
                    <span className="text-xl font-black font-dot text-[#F6DBC0]">{selectedDemo.commScore}</span>
                    <span className="text-[10px] font-bold text-[rgba(248,244,233,0.5)] block uppercase">Clarity</span>
                  </div>
                  <div className="p-2.5 rounded-xl bg-[rgba(26,15,34,0.6)] border border-[rgba(248,244,233,0.06)]">
                    <span className="text-xl font-black font-dot text-[#7FE3B9]">{selectedDemo.sentimentScore}</span>
                    <span className="text-[10px] font-bold text-[rgba(248,244,233,0.5)] block uppercase">Confidence</span>
                  </div>
                </div>

                <p className="text-xs text-[rgba(248,244,233,0.85)] leading-relaxed font-medium bg-[rgba(26,15,34,0.5)] p-3 rounded-xl border border-[rgba(248,244,233,0.06)]">
                  "{selectedDemo.critique}"
                </p>
              </div>

              <div className="mt-4 pt-3 border-t border-[rgba(248,244,233,0.08)] flex items-center justify-between text-xs text-[#F6DBC0] font-semibold">
                <span>Adaptive follow-up question unlocked</span>
                <ArrowRight className="w-4 h-4" />
              </div>
            </div>
          </div>
        </GlassCard>
      </section>

      {/* SALARY & COMPENSATION CALCULATOR */}
      <section className="py-16 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <GlassCard className="p-8 sm:p-12 border-[rgba(147,80,115,0.35)] shadow-[0_20px_50px_rgba(15,7,20,0.9)]">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-center">
            <div className="lg:col-span-7 space-y-6">
              <Badge variant="peach" size="sm">
                <Target className="w-3.5 h-3.5 text-[#F6DBC0] mr-1" />
                Career & Salary Upside
              </Badge>

              <h2 className="text-3xl sm:text-4xl font-black text-[#F8F4E9] tracking-tight">
                Calculate Your Potential Compensation Bump
              </h2>

              <p className="text-xs sm:text-sm text-[rgba(248,244,233,0.7)] leading-relaxed">
                Candidates who complete 4+ mock interview rounds with structured AI speech critiques improve their offer negotiation power by an average of 25-40%.
              </p>

              {/* Sliders and Selectors */}
              <div className="space-y-5 pt-2">
                <div>
                  <div className="flex justify-between text-xs font-bold mb-2">
                    <span className="text-[rgba(248,244,233,0.7)]">Years of Experience:</span>
                    <span className="text-[#F6DBC0] font-mono font-black">{yearsExp} {yearsExp === 1 ? 'Year' : 'Years'}</span>
                  </div>
                  <input
                    type="range"
                    min="1"
                    max="15"
                    value={yearsExp}
                    onChange={(e) => setYearsExp(Number(e.target.value))}
                    className="w-full h-2 bg-[rgba(26,15,34,0.8)] rounded-lg appearance-none cursor-pointer accent-[#935073]"
                  />
                </div>

                <div>
                  <label className="text-xs font-bold text-[rgba(248,244,233,0.7)] block mb-2">
                    Target Role Level:
                  </label>
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                    {[
                      { id: 'SDE', label: 'Senior SWE' },
                      { id: 'Staff', label: 'Staff / Architect' },
                      { id: 'AI', label: 'AI / ML Engineer' },
                      { id: 'PM', label: 'Product Lead' },
                    ].map((role) => (
                      <button
                        key={role.id}
                        onClick={() => setSelectedTargetRole(role.id as any)}
                        className={`py-2 px-3 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                          selectedTargetRole === role.id
                            ? 'bg-[#935073] text-[#F8F4E9] border border-[rgba(246,219,192,0.4)] shadow-[0_0_12px_rgba(147,80,115,0.45)]'
                            : 'bg-[rgba(26,15,34,0.6)] text-[rgba(248,244,233,0.6)] border border-[rgba(248,244,233,0.06)] hover:text-[#F8F4E9]'
                        }`}
                      >
                        {role.label}
                      </button>
                    ))}
                  </div>
                </div>
              </div>
            </div>

            {/* Compensation Showcase Card */}
            <div className="lg:col-span-5 p-6 sm:p-8 rounded-3xl bg-[rgba(26,15,34,0.7)] border border-[rgba(147,80,115,0.35)] space-y-6 text-center shadow-xl">
              <div>
                <span className="text-[11px] font-extrabold uppercase tracking-widest text-[#F6DBC0] block mb-1">
                  Projected Market Total Compensation
                </span>
                <div className="text-4xl sm:text-5xl font-black font-dot text-[#F8F4E9] tracking-tight">
                  ${calculateTargetSalary().toLocaleString()}<span className="text-xl text-[rgba(248,244,233,0.5)] font-normal">/yr</span>
                </div>
                <span className="text-xs text-[rgba(248,244,233,0.5)] block mt-1 font-mono">
                  Base + Equity + Bonus Tier
                </span>
              </div>

              <div className="grid grid-cols-2 gap-3 pt-4 border-t border-[rgba(248,244,233,0.08)] text-left">
                <div className="p-3 rounded-xl bg-[rgba(42,27,51,0.6)] border border-[rgba(248,244,233,0.06)]">
                  <span className="text-[10px] font-bold text-[rgba(248,244,233,0.5)] uppercase block">Prep Time</span>
                  <span className="text-base font-black font-dot text-[#F8F4E9]">{calculateReadinessDays()} Days</span>
                  <span className="text-[10px] text-[#7FE3B9] block font-mono">3 sessions/wk</span>
                </div>
                <div className="p-3 rounded-xl bg-[rgba(42,27,51,0.6)] border border-[rgba(248,244,233,0.06)]">
                  <span className="text-[10px] font-bold text-[rgba(248,244,233,0.5)] uppercase block">Confidence Lift</span>
                  <span className="text-base font-black font-dot text-[#F6DBC0]">+92%</span>
                  <span className="text-[10px] text-[rgba(248,244,233,0.5)] block font-mono">STAR mastery</span>
                </div>
              </div>

              <PrimaryButton
                onClick={() => (user ? window.location.assign('/track-selection') : window.location.assign('/register'))}
                fullWidth
                size="md"
                icon={<Sparkles className="w-4 h-4 text-[#F6DBC0]" />}
              >
                Start Tailored Prep Track
              </PrimaryButton>
            </div>
          </div>
        </GlassCard>
      </section>

      {/* FEATURE BENTO GRID */}
      <section id="features" className="py-16 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-14">
          <Badge variant="peach" size="sm" className="mb-3">
            Core Architecture
          </Badge>
          <h2 className="text-3xl sm:text-4xl font-black text-[#F8F4E9]">
            Everything You Need to Ace Any Interview
          </h2>
          <p className="mt-2 text-xs sm:text-sm text-[rgba(248,244,233,0.65)] max-w-xl mx-auto font-medium">
            From technical whiteboarding and algorithm edge cases to behavioral leadership rubrics.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <GlassCard className="p-7 flex flex-col justify-between">
            <div>
              <div className="w-12 h-12 rounded-2xl bg-[rgba(80,45,85,0.7)] border border-[rgba(147,80,115,0.4)] flex items-center justify-center mb-5 text-[#F6DBC0]">
                <Mic className="w-6 h-6" />
              </div>
              <h3 className="text-lg font-bold text-[#F8F4E9] mb-2">Voice & Speech Analytics</h3>
              <p className="text-xs text-[rgba(248,244,233,0.65)] leading-relaxed font-medium">
                Record real-time answers using high-frequency audio visualizers. Gemini analyzes speaking pace, filler words, technical keyword density, and structural clarity.
              </p>
            </div>
            <div className="mt-6 pt-4 border-t border-[rgba(248,244,233,0.06)] flex items-center text-xs font-bold text-[#7FE3B9] gap-1.5">
              <span>Speech-to-Text Powered</span>
              <CheckCircle2 className="w-3.5 h-3.5" />
            </div>
          </GlassCard>

          <GlassCard className="p-7 flex flex-col justify-between">
            <div>
              <div className="w-12 h-12 rounded-2xl bg-[rgba(80,45,85,0.7)] border border-[rgba(147,80,115,0.4)] flex items-center justify-center mb-5 text-[#F6DBC0]">
                <BrainCircuit className="w-6 h-6" />
              </div>
              <h3 className="text-lg font-bold text-[#F8F4E9] mb-2">Contextual Follow-Up Grilling</h3>
              <p className="text-xs text-[rgba(248,244,233,0.65)] leading-relaxed font-medium">
                Unlike static question banks, our AI remembers your previous answers and generates tailored follow-up inquiries to test depth, edge cases, and architectural tradeoffs.
              </p>
            </div>
            <div className="mt-6 pt-4 border-t border-[rgba(248,244,233,0.06)] flex items-center text-xs font-bold text-[#F6DBC0] gap-1.5">
              <span>Dynamic Multimodal Reasoning</span>
              <CheckCircle2 className="w-3.5 h-3.5" />
            </div>
          </GlassCard>

          <GlassCard className="p-7 flex flex-col justify-between">
            <div>
              <div className="w-12 h-12 rounded-2xl bg-[rgba(80,45,85,0.7)] border border-[rgba(147,80,115,0.4)] flex items-center justify-center mb-5 text-[#F6DBC0]">
                <FileCheck2 className="w-6 h-6" />
              </div>
              <h3 className="text-lg font-bold text-[#F8F4E9] mb-2">Resume & JD Skill Matching</h3>
              <p className="text-xs text-[rgba(248,244,233,0.65)] leading-relaxed font-medium">
                Upload your resume and paste target job descriptions. The system identifies skill overlaps and crafts targeted scenarios that match your exact stack.
              </p>
            </div>
            <div className="mt-6 pt-4 border-t border-[rgba(248,244,233,0.06)] flex items-center text-xs font-bold text-[#7FE3B9] gap-1.5">
              <span>PDF & Markdown Support</span>
              <CheckCircle2 className="w-3.5 h-3.5" />
            </div>
          </GlassCard>
        </div>
      </section>

      {/* PREPARATION TIPS SECTION */}
      <section className="py-12 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <PreparationTips />
      </section>

      {/* TESTIMONIALS */}
      <section className="py-16 bg-[rgba(26,15,34,0.6)] border-y border-[rgba(248,244,233,0.08)]">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-12">
            <h2 className="text-3xl font-black text-[#F8F4E9]">
              Proven Results from Top Candidates
            </h2>
            <p className="text-xs text-[rgba(248,244,233,0.6)] mt-2 font-medium">
              Over 12,000+ mock interviews completed across Google, Meta, Amazon, Apple, and high-growth unicorns.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <GlassCard className="p-6 space-y-4">
              <div className="flex text-[#F6DBC0] gap-1">
                {[...Array(5)].map((_, i) => (
                  <Star key={i} className="w-4 h-4 fill-[#F6DBC0] text-[#F6DBC0]" />
                ))}
              </div>
              <p className="text-xs text-[rgba(248,244,233,0.8)] italic font-medium leading-relaxed">
                "The follow-up questions in the SDE track were insanely realistic. When I gave a high-level answer on database concurrency, InterviewAI pressed me on isolation levels and deadlock detection — exactly what happened in my Meta E5 loop."
              </p>
              <div className="pt-2 border-t border-[rgba(248,244,233,0.06)] flex items-center justify-between">
                <div>
                  <span className="font-bold text-[#F8F4E9] text-sm block">David Kim</span>
                  <span className="text-xs text-[rgba(248,244,233,0.5)]">L5 Senior SWE @ Meta</span>
                </div>
                <Badge variant="mint" size="sm">$240k Offer</Badge>
              </div>
            </GlassCard>

            <GlassCard className="p-6 space-y-4">
              <div className="flex text-[#F6DBC0] gap-1">
                {[...Array(5)].map((_, i) => (
                  <Star key={i} className="w-4 h-4 fill-[#F6DBC0] text-[#F6DBC0]" />
                ))}
              </div>
              <p className="text-xs text-[rgba(248,244,233,0.8)] italic font-medium leading-relaxed">
                "Uploading my resume and pasting the job description made every single question tailored to my actual stack. The STAR framework critiques helped me turn 5-minute rambles into crisp, impactful 90-second answers."
              </p>
              <div className="pt-2 border-t border-[rgba(248,244,233,0.06)] flex items-center justify-between">
                <div>
                  <span className="font-bold text-[#F8F4E9] text-sm block">Maya Lin</span>
                  <span className="text-xs text-[rgba(248,244,233,0.5)]">Principal PM @ Stripe</span>
                </div>
                <Badge variant="mint" size="sm">$285k Offer</Badge>
              </div>
            </GlassCard>

            <GlassCard className="p-6 space-y-4">
              <div className="flex text-[#F6DBC0] gap-1">
                {[...Array(5)].map((_, i) => (
                  <Star key={i} className="w-4 h-4 fill-[#F6DBC0] text-[#F6DBC0]" />
                ))}
              </div>
              <p className="text-xs text-[rgba(248,244,233,0.8)] italic font-medium leading-relaxed">
                "The speech transcription feedback and visual radar scores were eye-opening. I practiced 6 rounds over a weekend and felt 10x more confident walking into my AWS System Design round."
              </p>
              <div className="pt-2 border-t border-[rgba(248,244,233,0.06)] flex items-center justify-between">
                <div>
                  <span className="font-bold text-[#F8F4E9] text-sm block">Marcus Vance</span>
                  <span className="text-xs text-[rgba(248,244,233,0.5)]">Solutions Architect @ AWS</span>
                </div>
                <Badge variant="mint" size="sm">$215k Offer</Badge>
              </div>
            </GlassCard>
          </div>
        </div>
      </section>

      {/* FAQ SECTION */}
      <section className="py-20 max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-12">
          <Badge variant="peach" size="sm" className="mb-2">Got Questions?</Badge>
          <h2 className="text-3xl font-black text-[#F8F4E9]">
            Frequently Asked Questions
          </h2>
        </div>

        <div className="space-y-3">
          {faqs.map((faq, index) => (
            <GlassCard key={index} className="p-0 overflow-hidden">
              <button
                onClick={() => setActiveFaq(activeFaq === index ? null : index)}
                className="w-full p-5 text-left flex items-center justify-between font-bold text-[#F8F4E9] gap-4 hover:text-[#F6DBC0] transition cursor-pointer"
              >
                <span className="text-sm">{faq.q}</span>
                {activeFaq === index ? (
                  <ChevronUp className="w-4 h-4 text-[#F6DBC0] shrink-0" />
                ) : (
                  <ChevronDown className="w-4 h-4 text-[rgba(248,244,233,0.5)] shrink-0" />
                )}
              </button>

              {activeFaq === index && (
                <div className="px-5 pb-5 text-xs text-[rgba(248,244,233,0.7)] leading-relaxed font-medium border-t border-[rgba(248,244,233,0.06)] pt-3">
                  {faq.a}
                </div>
              )}
            </GlassCard>
          ))}
        </div>
      </section>

      {/* BOTTOM CTA BANNER */}
      <section className="py-20 text-center relative overflow-hidden">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 space-y-6 relative z-10">
          <Badge variant="peach" size="sm">
            Zero Setup Required · Instant Access
          </Badge>

          <h2 className="text-3xl sm:text-5xl font-black text-[#F8F4E9] leading-tight">
            Ready to Ace Your Next Tech Interview?
          </h2>
          <p className="text-xs sm:text-sm text-[rgba(248,244,233,0.7)] max-w-xl mx-auto font-medium">
            Start a free practice session today. Get instant voice feedback, score breakdowns, and concrete tips before your high-stakes real round.
          </p>
          <div className="pt-2">
            <PrimaryButton
              onClick={() => (user ? window.location.assign('/track-selection') : window.location.assign('/register'))}
              size="lg"
              icon={<Sparkles className="w-5 h-5 text-[#F6DBC0]" />}
            >
              {user ? 'Enter Interview Room' : 'Start Free Practice Round'}
            </PrimaryButton>
          </div>
        </div>
      </section>
    </div>
  );
};
