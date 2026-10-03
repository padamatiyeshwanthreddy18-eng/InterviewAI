import React, { useRef, useState } from 'react';
import html2canvas from 'html2canvas';
import {
  X,
  Linkedin,
  Download,
  Copy,
  Check,
  Trophy,
  Sparkles,
  BarChart2,
  Share2,
  ShieldCheck,
  Bot,
} from 'lucide-react';

interface ShareSummaryCardModalProps {
  isOpen: boolean;
  onClose: () => void;
  sessionData: {
    track: string;
    overallScore: number;
    difficulty: string;
    completedAt?: string;
    strengths?: string[];
    weaknesses?: string[];
    avgTech?: number;
    avgComm?: number;
    avgSent?: number;
    candidateName?: string;
  };
}

export const ShareSummaryCardModal: React.FC<ShareSummaryCardModalProps> = ({
  isOpen,
  onClose,
  sessionData,
}) => {
  const cardRef = useRef<HTMLDivElement>(null);
  const [copied, setCopied] = useState(false);
  const [isGenerating, setIsGenerating] = useState(false);

  if (!isOpen) return null;

  const candidateName = sessionData.candidateName || 'Candidate';
  const track = sessionData.track || 'Software Engineer';
  const score = sessionData.overallScore || 85;
  const level = sessionData.difficulty || 'Senior';

  const hireStatus =
    score >= 85 ? 'Strong Hire ⭐' : score >= 70 ? 'Competitive Hire 👍' : 'Practice Passed 🎯';

  // Sample post text for LinkedIn
  const shareText = `🚀 Just completed a mock AI ${track} Interview on InterviewAI!

📊 Overall Readiness Score: ${score}/100 (${hireStatus})
💪 Core Strengths: ${sessionData.strengths?.slice(0, 2).join(' • ') || 'Problem Solving & Communication'}
🎯 Target Level: ${level}

Practicing real-time AI mock interviews with instant voice feedback and rubric scoring has been a game changer for my technical prep!

#InterviewAI #MockInterview #${track.replace(/\s+/g, '')} #CareerGrowth #TechInterviews`;

  const handleCopyText = () => {
    navigator.clipboard.writeText(shareText);
    setCopied(true);
    setTimeout(() => setCopied(false), 2500);
  };

  const handleDownloadImage = async () => {
    if (!cardRef.current) return;
    setIsGenerating(true);
    try {
      const canvas = await html2canvas(cardRef.current, {
        scale: 2,
        backgroundColor: '#1A0F22',
        useCORS: true,
      });
      const image = canvas.toDataURL('image/png');
      const link = document.createElement('a');
      link.href = image;
      link.download = `InterviewAI_Performance_Card_${track.replace(/\s+/g, '_')}.png`;
      link.click();
    } catch (err) {
      console.error('Failed to generate image:', err);
    } finally {
      setIsGenerating(false);
    }
  };

  const handleShareToLinkedIn = () => {
    handleCopyText();
    const url = `https://www.linkedin.com/feed/?shareActive=true&text=${encodeURIComponent(shareText)}`;
    window.open(url, '_blank');
  };

  return (
    <div className="fixed inset-0 z-50 bg-[#1A0F22]/80 backdrop-blur-md flex items-center justify-center p-4 overflow-y-auto">
      <div className="bg-[rgba(42,27,51,0.92)] border border-[rgba(248,244,233,0.12)] rounded-3xl max-w-xl w-full p-6 sm:p-8 space-y-6 shadow-2xl relative text-[#F8F4E9]">
        {/* Close Button */}
        <button
          onClick={onClose}
          className="absolute top-5 right-5 p-2 rounded-full text-[rgba(248,244,233,0.5)] hover:text-[#F8F4E9] hover:bg-[rgba(147,80,115,0.2)] transition cursor-pointer"
        >
          <X className="w-5 h-5" />
        </button>

        {/* Modal Header */}
        <div className="space-y-1 text-center sm:text-left">
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-[rgba(147,80,115,0.3)] text-[#F6DBC0] text-xs font-extrabold border border-[rgba(246,219,192,0.3)]">
            <Share2 className="w-3.5 h-3.5 text-[#F6DBC0]" />
            Social Performance Card
          </div>
          <h2 className="text-xl font-black text-[#F8F4E9]">Share Your Achievements on LinkedIn</h2>
          <p className="text-xs text-[rgba(248,244,233,0.65)]">
            Download your visual summary badge or copy the post snippet to showcase your interview readiness.
          </p>
        </div>

        {/* Visual Summary Card Target Element */}
        <div className="p-1 rounded-2xl bg-gradient-to-tr from-[#502D55] via-[#935073] to-[#F6DBC0] shadow-[0_0_30px_rgba(147,80,115,0.35)]">
          <div
            ref={cardRef}
            className="bg-[#1A0F22] text-[#F8F4E9] rounded-[14px] p-6 space-y-5 relative overflow-hidden"
          >
            {/* Background Glow Accents */}
            <div className="absolute -top-10 -right-10 w-40 h-40 bg-[#935073]/25 rounded-full blur-3xl pointer-events-none" />
            <div className="absolute -bottom-10 -left-10 w-40 h-40 bg-[#502D55]/30 rounded-full blur-3xl pointer-events-none" />

            {/* Top Brand Bar */}
            <div className="flex items-center justify-between border-b border-[rgba(248,244,233,0.08)] pb-3 relative z-10">
              <div className="flex items-center gap-2">
                <div className="w-7 h-7 rounded-lg bg-gradient-to-tr from-[#502D55] to-[#935073] border border-[rgba(246,219,192,0.3)] flex items-center justify-center font-black text-[#F8F4E9] text-xs shadow-md">
                  <Bot className="w-4 h-4 text-[#F6DBC0]" />
                </div>
                <span className="font-extrabold text-sm tracking-tight text-[#F8F4E9]">
                  Interview<span className="text-[#F6DBC0]">AI</span>
                </span>
              </div>
              <span className="text-[10px] font-bold text-[#F6DBC0] uppercase tracking-wider bg-[rgba(80,45,85,0.5)] px-2.5 py-1 rounded-full border border-[rgba(246,219,192,0.3)]">
                Verified AI Evaluation
              </span>
            </div>

            {/* Main Content Layout */}
            <div className="flex flex-col sm:flex-row items-center justify-between gap-6 relative z-10 py-2">
              <div className="space-y-2 text-center sm:text-left">
                <p className="text-xs font-bold text-[rgba(248,244,233,0.5)] uppercase tracking-widest">{candidateName}</p>
                <h3 className="text-2xl font-black text-[#F8F4E9] tracking-tight">{track}</h3>
                <div className="flex items-center justify-center sm:justify-start gap-2 text-xs text-[rgba(248,244,233,0.7)] font-medium">
                  <span className="px-2.5 py-0.5 rounded-md bg-[rgba(42,27,51,0.8)] border border-[rgba(248,244,233,0.1)] text-[#F8F4E9]">{level} Track</span>
                  <span>•</span>
                  <span className="text-[#7FE3B9] font-extrabold">{hireStatus}</span>
                </div>
              </div>

              {/* Score Badge */}
              <div className="flex flex-col items-center justify-center bg-[rgba(80,45,85,0.4)] border border-[rgba(246,219,192,0.3)] rounded-2xl p-4 min-w-[110px] text-center shadow-[0_0_16px_rgba(147,80,115,0.25)]">
                <Trophy className="w-5 h-5 text-[#F6DBC0] mb-1" />
                <span className="text-3xl font-black text-[#F8F4E9] tracking-tight">{score}</span>
                <span className="text-[9px] font-bold text-[#F6DBC0] uppercase tracking-wider mt-0.5">Readiness Score</span>
              </div>
            </div>

            {/* Score Metrics Horizontal Bars */}
            <div className="grid grid-cols-3 gap-2 pt-2 border-t border-[rgba(248,244,233,0.08)] relative z-10">
              <div className="bg-[rgba(42,27,51,0.6)] p-2.5 rounded-xl border border-[rgba(248,244,233,0.06)] text-center">
                <span className="text-[10px] text-[rgba(248,244,233,0.5)] uppercase font-bold block mb-1">Technical</span>
                <span className="text-sm font-black text-[#F6DBC0]">{sessionData.avgTech || score}%</span>
              </div>
              <div className="bg-[rgba(42,27,51,0.6)] p-2.5 rounded-xl border border-[rgba(248,244,233,0.06)] text-center">
                <span className="text-[10px] text-[rgba(248,244,233,0.5)] uppercase font-bold block mb-1">Communication</span>
                <span className="text-sm font-black text-[#935073]">{sessionData.avgComm || score}%</span>
              </div>
              <div className="bg-[rgba(42,27,51,0.6)] p-2.5 rounded-xl border border-[rgba(248,244,233,0.06)] text-center">
                <span className="text-[10px] text-[rgba(248,244,233,0.5)] uppercase font-bold block mb-1">Confidence</span>
                <span className="text-sm font-black text-[#7FE3B9]">{sessionData.avgSent || score}%</span>
              </div>
            </div>

            {/* Strengths Pills */}
            {sessionData.strengths && sessionData.strengths.length > 0 && (
              <div className="space-y-1.5 relative z-10 pt-1">
                <span className="text-[10px] font-bold text-[rgba(248,244,233,0.5)] uppercase tracking-wider block">Highlighted Strengths:</span>
                <div className="flex flex-wrap gap-1.5">
                  {sessionData.strengths.slice(0, 3).map((st, i) => (
                    <span key={i} className="text-[11px] font-semibold text-[#F8F4E9] bg-[rgba(42,27,51,0.8)] border border-[rgba(248,244,233,0.1)] px-2.5 py-1 rounded-lg">
                      ✓ {st}
                    </span>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Action Buttons */}
        <div className="space-y-3 pt-2">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <button
              onClick={handleDownloadImage}
              disabled={isGenerating}
              className="w-full py-3 px-4 bg-[rgba(80,45,85,0.5)] hover:bg-[rgba(147,80,115,0.5)] text-[#F8F4E9] border border-[rgba(246,219,192,0.3)] font-extrabold rounded-xl text-xs flex items-center justify-center gap-2 transition cursor-pointer shadow-[0_0_12px_rgba(147,80,115,0.25)]"
            >
              <Download className="w-4 h-4 text-[#F6DBC0]" />
              <span>{isGenerating ? 'Generating Image...' : 'Download PNG Badge'}</span>
            </button>

            <button
              onClick={handleCopyText}
              className="w-full py-3 px-4 bg-[rgba(80,45,85,0.5)] hover:bg-[rgba(147,80,115,0.5)] text-[#F8F4E9] border border-[rgba(246,219,192,0.3)] font-extrabold rounded-xl text-xs flex items-center justify-center gap-2 transition cursor-pointer shadow-[0_0_12px_rgba(147,80,115,0.25)]"
            >
              {copied ? <Check className="w-4 h-4 text-[#7FE3B9]" /> : <Copy className="w-4 h-4 text-[#F6DBC0]" />}
              <span>{copied ? 'Copied Post Snippet!' : 'Copy LinkedIn Text'}</span>
            </button>
          </div>

          <button
            onClick={handleShareToLinkedIn}
            className="w-full py-3.5 px-4 bg-gradient-to-r from-[#502D55] via-[#935073] to-[#a65d83] hover:from-[#603766] hover:to-[#ba6d95] border border-[rgba(246,219,192,0.3)] text-[#F8F4E9] font-extrabold rounded-xl text-xs flex items-center justify-center gap-2 transition shadow-[0_0_20px_rgba(147,80,115,0.4)] cursor-pointer hover:scale-[1.01]"
          >
            <Linkedin className="w-4 h-4 fill-current text-[#F6DBC0]" />
            <span>Post Directly to LinkedIn</span>
          </button>
        </div>
      </div>
    </div>
  );
};
