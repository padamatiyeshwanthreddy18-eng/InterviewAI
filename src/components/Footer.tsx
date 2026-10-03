import React, { useState } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { Modal } from './ui/Modal';
import { Bot, Sparkles } from 'lucide-react';

export const Footer: React.FC = () => {
  const location = useLocation();
  const [activeModal, setActiveModal] = useState<'privacy' | 'terms' | 'security' | null>(null);

  // Hide the footer completely on live interview room so it doesn't take vertical space or distract
  if (location.pathname.startsWith('/interview/')) {
    return null;
  }

  const currentYear = new Date().getFullYear();

  return (
    <footer
      role="contentinfo"
      className="w-full bg-[rgba(26,15,34,0.75)] backdrop-blur-md border-t border-[rgba(248,244,233,0.08)] mt-auto relative z-10 transition-colors"
    >
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 min-h-[56px] py-3.5 md:py-0 flex flex-col md:flex-row items-center justify-between gap-3 md:gap-0">
        {/* Left: Small Logo Mark + Brand + Computed Copyright Year */}
        <div className="flex items-center gap-2.5">
          <Link
            to="/"
            className="flex items-center gap-2 group focus:outline-none focus-visible:ring-2 focus-visible:ring-[#F6DBC0] rounded-lg"
            aria-label="Interview AI Home"
          >
            <div className="w-6 h-6 rounded-lg bg-gradient-to-tr from-[#502D55] to-[#935073] border border-[rgba(246,219,192,0.25)] flex items-center justify-center text-[#F6DBC0] shadow-[0_0_10px_rgba(147,80,115,0.35)] group-hover:scale-105 transition-transform">
              <Bot className="w-3.5 h-3.5 text-[#F8F4E9]" />
            </div>
            <span className="font-extrabold text-sm text-[#F8F4E9] tracking-tight">
              Interview<span className="bg-gradient-to-r from-[#F6DBC0] to-[#935073] bg-clip-text text-transparent">AI</span>
            </span>
          </Link>
          <span className="text-xs text-[rgba(248,244,233,0.45)] select-none">
            © {currentYear}
          </span>
        </div>

        {/* Centre: Small Model Chip (hidden below 768px) */}
        <div className="hidden md:flex items-center">
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-[11px] font-medium text-[rgba(248,244,233,0.7)] bg-[rgba(80,45,85,0.3)] border border-[rgba(248,244,233,0.08)] shadow-sm">
            <Sparkles className="w-3 h-3 text-[#F6DBC0]" />
            <span>Powered by Gemini 3.7 Flash Engine</span>
          </div>
        </div>

        {/* Right: Three Quiet Text Links (13px, no heavy dot separators) */}
        <nav
          aria-label="Legal and Security Links"
          className="flex items-center gap-5 text-[13px] font-medium text-[rgba(248,244,233,0.65)]"
        >
          <button
            type="button"
            onClick={() => setActiveModal('privacy')}
            className="hover:text-[#F6DBC0] focus:text-[#F6DBC0] focus:outline-none focus-visible:ring-1 focus-visible:ring-[#F6DBC0] rounded transition-colors cursor-pointer"
          >
            Privacy
          </button>
          <button
            type="button"
            onClick={() => setActiveModal('terms')}
            className="hover:text-[#F6DBC0] focus:text-[#F6DBC0] focus:outline-none focus-visible:ring-1 focus-visible:ring-[#F6DBC0] rounded transition-colors cursor-pointer"
          >
            Terms
          </button>
          <button
            type="button"
            onClick={() => setActiveModal('security')}
            className="hover:text-[#F6DBC0] focus:text-[#F6DBC0] focus:outline-none focus-visible:ring-1 focus-visible:ring-[#F6DBC0] rounded transition-colors cursor-pointer"
          >
            Security
          </button>
        </nav>
      </div>

      {/* Interactive Information Modals (Content 100% Preserved) */}
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
            type="button"
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
