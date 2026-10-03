import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { TrackType } from '../types';
import { Modal } from './ui/Modal';
import {
  Bot,
  Sparkles,
  Github,
  Twitter,
  Linkedin,
  ShieldCheck,
  Lock,
  FileText,
  ExternalLink,
} from 'lucide-react';

export const Footer: React.FC = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [activeModal, setActiveModal] = useState<'privacy' | 'terms' | 'security' | null>(null);

  const handleTrackClick = (track: TrackType) => {
    if (!user) {
      navigate(`/register?track=${encodeURIComponent(track)}`);
    } else {
      navigate(`/track-selection?track=${encodeURIComponent(track)}`);
    }
  };

  const handlePlatformClick = (path: string) => {
    if (!user && (path === '/dashboard' || path === '/profile' || path === '/history')) {
      navigate('/login');
    } else {
      navigate(path);
    }
  };

  return (
    <footer className="bg-[rgba(26,15,34,0.85)] backdrop-blur-2xl border-t border-[rgba(248,244,233,0.08)] text-[rgba(248,244,233,0.65)] py-12 px-4 sm:px-6 lg:px-8 mt-auto transition-colors relative z-10">
      <div className="max-w-7xl mx-auto grid grid-cols-1 md:grid-cols-4 gap-8">
        {/* Brand & Description */}
        <div className="space-y-4 md:col-span-1">
          <Link to="/" className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-xl bg-gradient-to-tr from-[#502D55] to-[#935073] border border-[rgba(246,219,192,0.3)] flex items-center justify-center text-[#F6DBC0] shadow-[0_0_12px_rgba(147,80,115,0.4)]">
              <Bot className="w-4 h-4 text-[#F8F4E9]" />
            </div>
            <span className="font-extrabold text-lg text-[#F8F4E9]">
              Interview<span className="bg-gradient-to-r from-[#F6DBC0] to-[#935073] bg-clip-text text-transparent">AI</span>
            </span>
          </Link>
          <p className="text-xs text-[rgba(248,244,233,0.55)] leading-relaxed">
            AI-powered mock interview practice with live voice recording, answer evaluation, and personalized career growth feedback.
          </p>
          <div className="flex items-center gap-3 pt-2 text-[rgba(248,244,233,0.6)]">
            <a
              href="https://github.com"
              target="_blank"
              rel="noopener noreferrer"
              className="p-2 rounded-xl bg-[rgba(42,27,51,0.6)] border border-[rgba(248,244,233,0.06)] hover:text-[#F6DBC0] hover:border-[rgba(147,80,115,0.4)] transition-all"
              title="GitHub Repository"
            >
              <Github className="w-4 h-4" />
            </a>
            <a
              href="https://twitter.com"
              target="_blank"
              rel="noopener noreferrer"
              className="p-2 rounded-xl bg-[rgba(42,27,51,0.6)] border border-[rgba(248,244,233,0.06)] hover:text-[#F6DBC0] hover:border-[rgba(147,80,115,0.4)] transition-all"
              title="Twitter Feed"
            >
              <Twitter className="w-4 h-4" />
            </a>
            <a
              href="https://linkedin.com"
              target="_blank"
              rel="noopener noreferrer"
              className="p-2 rounded-xl bg-[rgba(42,27,51,0.6)] border border-[rgba(248,244,233,0.06)] hover:text-[#F6DBC0] hover:border-[rgba(147,80,115,0.4)] transition-all"
              title="LinkedIn Community"
            >
              <Linkedin className="w-4 h-4" />
            </a>
          </div>
        </div>

        {/* Tracks Column */}
        <div>
          <h4 className="text-xs font-bold text-[#F8F4E9] mb-3 uppercase tracking-wider">
            Practice Tracks
          </h4>
          <ul className="space-y-2 text-xs font-medium">
            <li>
              <button
                onClick={() => handleTrackClick('SDE')}
                className="hover:text-[#F6DBC0] transition-colors text-left flex items-center gap-1.5 group cursor-pointer"
              >
                <span>Backend & Systems (SDE)</span>
                <ExternalLink className="w-3 h-3 opacity-0 group-hover:opacity-100 transition-opacity text-[#935073]" />
              </button>
            </li>
            <li>
              <button
                onClick={() => handleTrackClick('Frontend Engineer')}
                className="hover:text-[#F6DBC0] transition-colors text-left flex items-center gap-1.5 group cursor-pointer"
              >
                <span>Frontend Engineering</span>
                <ExternalLink className="w-3 h-3 opacity-0 group-hover:opacity-100 transition-opacity text-[#935073]" />
              </button>
            </li>
            <li>
              <button
                onClick={() => handleTrackClick('Full Stack Engineer')}
                className="hover:text-[#F6DBC0] transition-colors text-left flex items-center gap-1.5 group cursor-pointer"
              >
                <span>Full Stack Engineering</span>
                <ExternalLink className="w-3 h-3 opacity-0 group-hover:opacity-100 transition-opacity text-[#935073]" />
              </button>
            </li>
            <li>
              <button
                onClick={() => handleTrackClick('Data Scientist')}
                className="hover:text-[#F6DBC0] transition-colors text-left flex items-center gap-1.5 group cursor-pointer"
              >
                <span>Data Science & AI</span>
                <ExternalLink className="w-3 h-3 opacity-0 group-hover:opacity-100 transition-opacity text-[#935073]" />
              </button>
            </li>
            <li>
              <button
                onClick={() => handleTrackClick('DevOps & Cloud')}
                className="hover:text-[#F6DBC0] transition-colors text-left flex items-center gap-1.5 group cursor-pointer"
              >
                <span>DevOps & Cloud Architect</span>
                <ExternalLink className="w-3 h-3 opacity-0 group-hover:opacity-100 transition-opacity text-[#935073]" />
              </button>
            </li>
            <li>
              <button
                onClick={() => handleTrackClick('Cybersecurity')}
                className="hover:text-[#F6DBC0] transition-colors text-left flex items-center gap-1.5 group cursor-pointer"
              >
                <span>Cybersecurity Specialist</span>
                <ExternalLink className="w-3 h-3 opacity-0 group-hover:opacity-100 transition-opacity text-[#935073]" />
              </button>
            </li>
            <li>
              <button
                onClick={() => handleTrackClick('Product Manager')}
                className="hover:text-[#F6DBC0] transition-colors text-left flex items-center gap-1.5 group cursor-pointer"
              >
                <span>Product Management</span>
                <ExternalLink className="w-3 h-3 opacity-0 group-hover:opacity-100 transition-opacity text-[#935073]" />
              </button>
            </li>
            <li>
              <button
                onClick={() => handleTrackClick('HR/Behavioral')}
                className="hover:text-[#F6DBC0] transition-colors text-left flex items-center gap-1.5 group cursor-pointer"
              >
                <span>HR & Behavioral STAR</span>
                <ExternalLink className="w-3 h-3 opacity-0 group-hover:opacity-100 transition-opacity text-[#935073]" />
              </button>
            </li>
          </ul>
        </div>

        {/* Platform Column */}
        <div>
          <h4 className="text-xs font-bold text-[#F8F4E9] mb-3 uppercase tracking-wider">
            Platform Features
          </h4>
          <ul className="space-y-2 text-xs font-medium">
            <li>
              <button
                onClick={() => handlePlatformClick('/track-selection')}
                className="hover:text-[#F6DBC0] transition-colors text-left flex items-center gap-1.5 group cursor-pointer"
              >
                <span>Live Speech Recognition</span>
                <ExternalLink className="w-3 h-3 opacity-0 group-hover:opacity-100 transition-opacity text-[#935073]" />
              </button>
            </li>
            <li>
              <button
                onClick={() => handlePlatformClick('/dashboard')}
                className="hover:text-[#F6DBC0] transition-colors text-left flex items-center gap-1.5 group cursor-pointer"
              >
                <span>Gemini AI Evaluation</span>
                <ExternalLink className="w-3 h-3 opacity-0 group-hover:opacity-100 transition-opacity text-[#935073]" />
              </button>
            </li>
            <li>
              <button
                onClick={() => handlePlatformClick('/profile')}
                className="hover:text-[#F6DBC0] transition-colors text-left flex items-center gap-1.5 group cursor-pointer"
              >
                <span>Resume Skill Matching</span>
                <ExternalLink className="w-3 h-3 opacity-0 group-hover:opacity-100 transition-opacity text-[#935073]" />
              </button>
            </li>
            <li>
              <button
                onClick={() => handlePlatformClick('/dashboard')}
                className="hover:text-[#F6DBC0] transition-colors text-left flex items-center gap-1.5 group cursor-pointer"
              >
                <span>Score Analytics</span>
                <ExternalLink className="w-3 h-3 opacity-0 group-hover:opacity-100 transition-opacity text-[#935073]" />
              </button>
            </li>
            <li>
              <button
                onClick={() => handlePlatformClick('/history')}
                className="hover:text-[#F6DBC0] transition-colors text-left flex items-center gap-1.5 group cursor-pointer"
              >
                <span>Improvement Roadmaps</span>
                <ExternalLink className="w-3 h-3 opacity-0 group-hover:opacity-100 transition-opacity text-[#935073]" />
              </button>
            </li>
          </ul>
        </div>

        {/* AI Engine Column */}
        <div>
          <h4 className="text-xs font-bold text-[#F8F4E9] mb-3 uppercase tracking-wider">
            AI Engine
          </h4>
          <div className="bg-[rgba(42,27,51,0.7)] border border-[rgba(248,244,233,0.08)] p-4 rounded-2xl space-y-2 shadow-sm">
            <div className="flex items-center gap-2 text-xs font-extrabold text-[#F6DBC0]">
              <Sparkles className="w-3.5 h-3.5 text-[#F6DBC0]" />
              Gemini 3.7 Flash Engine
            </div>
            <p className="text-[11px] text-[rgba(248,244,233,0.6)] font-medium leading-relaxed">
              Generates context-aware technical, situational, and follow-up questions tailored to your resume and target role.
            </p>
          </div>
        </div>
      </div>

      {/* Bottom Bar */}
      <div className="max-w-7xl mx-auto border-t border-[rgba(248,244,233,0.08)] mt-8 pt-6 flex flex-col sm:flex-row items-center justify-between text-xs text-[rgba(248,244,233,0.5)]">
        <p>© {new Date().getFullYear()} InterviewAI Platform. All rights reserved.</p>
        <div className="flex items-center gap-4 mt-3 sm:mt-0 font-bold">
          <button
            onClick={() => setActiveModal('privacy')}
            className="hover:text-[#F6DBC0] transition-colors cursor-pointer"
          >
            Privacy Policy
          </button>
          <span>·</span>
          <button
            onClick={() => setActiveModal('terms')}
            className="hover:text-[#F6DBC0] transition-colors cursor-pointer"
          >
            Terms of Service
          </button>
          <span>·</span>
          <button
            onClick={() => setActiveModal('security')}
            className="hover:text-[#F6DBC0] transition-colors cursor-pointer"
          >
            Security
          </button>
          <span>·</span>
          <Link
            to="/admin"
            className="text-[#F6DBC0] hover:underline inline-flex items-center gap-1 font-extrabold"
          >
            <ShieldCheck className="w-3.5 h-3.5" />
            Admin Portal
          </Link>
        </div>
      </div>

      {/* Interactive Information Modals */}
      <Modal
        isOpen={activeModal !== null}
        onClose={() => setActiveModal(null)}
        title={
          activeModal === 'privacy'
            ? 'Privacy Policy'
            : activeModal === 'terms'
            ? 'Terms of Service'
            : 'Security Infrastructure'
        }
      >
        {activeModal === 'privacy' && (
          <div className="space-y-4 text-xs">
            <p className="text-[rgba(248,244,233,0.7)] leading-relaxed font-medium">
              At InterviewAI, your data privacy is paramount. Voice transcripts and resume data uploaded for mock interviews are processed in memory using secure Google Gemini AI endpoints and stored locally to present your historical performance analytics.
            </p>
            <div className="p-3 bg-[rgba(26,15,34,0.6)] rounded-xl border border-[rgba(248,244,233,0.06)] space-y-1.5 font-medium">
              <span className="font-bold block text-[#F8F4E9]">Key Guarantees:</span>
              <ul className="list-disc pl-4 space-y-1 text-[rgba(248,244,233,0.6)]">
                <li>Audio recordings are never saved permanently on external public servers.</li>
                <li>Parsed resume data is strictly scoped to your individual account session.</li>
                <li>You can permanently delete all account history at any time from your Profile settings.</li>
              </ul>
            </div>
          </div>
        )}

        {activeModal === 'terms' && (
          <div className="space-y-4 text-xs">
            <p className="text-[rgba(248,244,233,0.7)] leading-relaxed font-medium">
              InterviewAI provides an AI-based practice tool intended for personal interview preparation and educational enhancement.
            </p>
            <div className="p-3 bg-[rgba(26,15,34,0.6)] rounded-xl border border-[rgba(248,244,233,0.06)] space-y-1.5 font-medium">
              <span className="font-bold block text-[#F8F4E9]">Service Guidelines:</span>
              <ul className="list-disc pl-4 space-y-1 text-[rgba(248,244,233,0.6)]">
                <li>Scores and feedback generated by Gemini AI are recommendations for self-improvement and do not guarantee employment offers.</li>
                <li>Users agree not to submit unlawful, toxic, or offensive content during mock interview sessions.</li>
              </ul>
            </div>
          </div>
        )}

        {activeModal === 'security' && (
          <div className="space-y-4 text-xs">
            <p className="text-[rgba(248,244,233,0.7)] leading-relaxed font-medium">
              Our application uses modern JWT token authentication, encrypted HTTPS communication channels, and server-side API proxying to keep AI API keys secure.
            </p>
            <div className="p-3 bg-[rgba(26,15,34,0.6)] rounded-xl border border-[rgba(248,244,233,0.06)] space-y-1.5 font-medium">
              <span className="font-bold block text-[#F8F4E9]">Protective Measures:</span>
              <ul className="list-disc pl-4 space-y-1 text-[rgba(248,244,233,0.6)]">
                <li>Server-side Gemini proxy preventing client-side API key exposure.</li>
                <li>Bcrypt password hashing for user accounts.</li>
                <li>Role-based access controls for candidate vs administrator access.</li>
              </ul>
            </div>
          </div>
        )}

        <div className="pt-4">
          <button
            onClick={() => setActiveModal(null)}
            className="w-full py-2.5 rounded-xl text-[#F8F4E9] font-extrabold text-xs shadow-sm transition cursor-pointer"
            style={{
              background: 'linear-gradient(135deg, #502D55 0%, #935073 60%, #a65d83 100%)',
            }}
          >
            Close Window
          </button>
        </div>
      </Modal>
    </footer>
  );
};
