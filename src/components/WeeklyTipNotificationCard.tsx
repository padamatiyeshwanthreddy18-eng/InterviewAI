import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { useTips, useProfile } from '../hooks/useFirestoreData';
import { Mail, Sparkles, Send, CheckCircle2, RefreshCw, AlertCircle, Eye, Calendar, Bell } from 'lucide-react';

export const WeeklyTipNotificationCard: React.FC = () => {
  const { token, user } = useAuth();
  const { tips, latestTip, saveTip } = useTips(user?.uid);
  const { weeklyTip, toggleWeeklyTip } = useProfile(user?.uid);

  const [enabled, setEnabled] = useState(weeklyTip?.subscribed ?? true);
  const [isLoading, setIsLoading] = useState(true);
  const [weakCategory, setWeakCategory] = useState<string>('System Architecture & Edge Case Coverage');
  const [tipData, setTipData] = useState<{
    subject: string;
    category: string;
    headline: string;
    coreTip: string;
    actionableExercise: string;
    sampleAnswerSnippet: string;
  } | null>(null);

  const [isSendingTest, setIsSendingTest] = useState(false);
  const [dispatchMessage, setDispatchMessage] = useState<string | null>(null);
  const [showEmailPreview, setShowEmailPreview] = useState(false);

  useEffect(() => {
    if (weeklyTip) {
      setEnabled(weeklyTip.subscribed);
    }
  }, [weeklyTip]);

  // Use real-time persisted tip if available
  useEffect(() => {
    if (latestTip) {
      setTipData({
        subject: latestTip.subject,
        category: latestTip.targetCategory,
        headline: latestTip.headline,
        coreTip: latestTip.coreTip,
        actionableExercise: latestTip.actionableExercise,
        sampleAnswerSnippet: latestTip.sampleAnswerSnippet,
      });
      setWeakCategory(latestTip.targetCategory);
      setIsLoading(false);
    }
  }, [latestTip]);

  const fetchWeeklyTip = async () => {
    if (!token) return;
    setIsLoading(true);
    try {
      const res = await fetch('/api/notifications/weekly-tip', {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (res.ok) {
        const data = await res.json();
        setEnabled(data.enabled);
        setWeakCategory(data.weakCategory);
        setTipData(data.tip);
        if (user?.uid && data.tip) {
          saveTip({
            targetCategory: data.weakCategory,
            subject: data.tip.subject,
            headline: data.tip.headline,
            coreTip: data.tip.coreTip,
            actionableExercise: data.tip.actionableExercise,
            sampleAnswerSnippet: data.tip.sampleAnswerSnippet,
          }).catch((e) => console.warn('Tip persistence note:', e));
        }
      }
    } catch (err) {
      console.error('Failed to load weekly tip:', err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    if (!latestTip) {
      fetchWeeklyTip();
    } else {
      setIsLoading(false);
    }
  }, [token, latestTip]);

  const handleToggleSubscription = async () => {
    const nextState = !enabled;
    setEnabled(nextState);
    try {
      await toggleWeeklyTip(nextState);
    } catch (e) {
      console.warn('Toggle weekly tip subscription note:', e);
    }
  };

  const handleSendTestEmail = async () => {
    if (!token) return;
    setIsSendingTest(true);
    setDispatchMessage(null);
    try {
      const res = await fetch('/api/notifications/test-email', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ category: weakCategory }),
      });
      if (res.ok) {
        const data = await res.json();
        setDispatchMessage(data.message);
        if (data.emailPayload?.tipData && user?.uid) {
          saveTip({
            targetCategory: weakCategory,
            subject: data.emailPayload.tipData.subject,
            headline: data.emailPayload.tipData.headline,
            coreTip: data.emailPayload.tipData.coreTip,
            actionableExercise: data.emailPayload.tipData.actionableExercise,
            sampleAnswerSnippet: data.emailPayload.tipData.sampleAnswerSnippet,
          }).catch((e) => console.warn('Persist test email tip note:', e));
        }
      }
    } catch (err) {
      console.error('Failed to dispatch test email:', err);
    } finally {
      setIsSendingTest(false);
    }
  };

  return (
    <div className="bg-[rgba(42,27,51,0.72)] backdrop-blur-xl border border-[rgba(248,244,233,0.08)] rounded-3xl p-6 sm:p-8 space-y-6 shadow-[0_10px_30px_-10px_rgba(15,7,20,0.5)] text-[#F8F4E9]">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-[rgba(248,244,233,0.08)]">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-2xl bg-[rgba(80,45,85,0.6)] text-[#F6DBC0] border border-[rgba(246,219,192,0.3)] flex items-center justify-center shrink-0 shadow-[0_0_15px_rgba(147,80,115,0.3)]">
            <Bell className="w-5 h-5 text-[#F6DBC0]" />
          </div>
          <div>
            <h3 className="text-base font-extrabold text-[#F8F4E9] flex items-center gap-2">
              Automated Weekly Interview Practice Tip
            </h3>
            <p className="text-xs text-[rgba(248,244,233,0.65)] font-medium">
              Tailored weekly email coaching based on your weakest interview category
            </p>
          </div>
        </div>

        <div className="flex items-center gap-3">
          <button
            onClick={handleToggleSubscription}
            className={`px-3.5 py-1.5 rounded-xl text-xs font-bold transition flex items-center gap-2 border cursor-pointer ${
              enabled
                ? 'bg-[rgba(127,227,185,0.15)] text-[#7FE3B9] border-[rgba(127,227,185,0.3)]'
                : 'bg-[rgba(26,15,34,0.6)] text-[rgba(248,244,233,0.6)] border-[rgba(248,244,233,0.1)]'
            }`}
          >
            <Mail className="w-4 h-4" />
            <span>{enabled ? 'Subscribed (Weekly)' : 'Emails Paused'}</span>
          </button>
        </div>
      </div>

      {isLoading ? (
        <div className="p-8 text-center space-y-2">
          <Sparkles className="w-6 h-6 text-[#F6DBC0] animate-spin mx-auto" />
          <p className="text-xs text-[rgba(248,244,233,0.6)] font-medium">Analyzing recent session analytics & compiling practice tip...</p>
        </div>
      ) : tipData ? (
        <div className="space-y-5">
          {/* Identified Weak Category Banner */}
          <div className="p-4 bg-[rgba(80,45,85,0.4)] border border-[rgba(246,219,192,0.3)] rounded-2xl flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
            <div>
              <span className="text-[10px] font-bold uppercase tracking-wider text-[#F6DBC0] block mb-0.5">
                Target Growth Category:
              </span>
              <p className="text-sm font-extrabold text-[#F8F4E9]">
                {weakCategory}
              </p>
            </div>

            <button
              onClick={fetchWeeklyTip}
              className="px-3 py-1.5 bg-[rgba(147,80,115,0.4)] hover:bg-[rgba(147,80,115,0.6)] text-[#F6DBC0] hover:text-[#F8F4E9] border border-[rgba(246,219,192,0.25)] font-extrabold rounded-xl text-xs flex items-center gap-1.5 transition cursor-pointer"
            >
              <RefreshCw className="w-3.5 h-3.5" />
              <span>Regenerate Tip</span>
            </button>
          </div>

          {/* Generated Email Content Card */}
          <div className="bg-[rgba(26,15,34,0.6)] border border-[rgba(248,244,233,0.08)] rounded-2xl p-5 space-y-4">
            <div className="flex items-center justify-between border-b border-[rgba(248,244,233,0.08)] pb-3">
              <div className="space-y-1">
                <span className="text-[10px] font-mono font-bold text-[rgba(248,244,233,0.5)] uppercase">Subject Line:</span>
                <h4 className="text-sm font-extrabold text-[#F8F4E9]">{tipData.subject}</h4>
              </div>

              <button
                onClick={() => setShowEmailPreview(!showEmailPreview)}
                className="px-3 py-1.5 bg-[rgba(42,27,51,0.8)] border border-[rgba(248,244,233,0.1)] text-[#F6DBC0] hover:text-[#F8F4E9] font-bold rounded-xl text-xs flex items-center gap-1.5 hover:bg-[rgba(80,45,85,0.5)] transition cursor-pointer"
              >
                <Eye className="w-3.5 h-3.5 text-[#F6DBC0]" />
                <span>{showEmailPreview ? 'Hide Full Email' : 'Preview Email'}</span>
              </button>
            </div>

            <p className="text-xs font-bold text-[#F6DBC0] italic">
              "{tipData.headline}"
            </p>

            <div className="space-y-2 text-xs text-[rgba(248,244,233,0.75)] leading-relaxed font-medium">
              <p>{tipData.coreTip}</p>
            </div>

            {/* Action Exercise */}
            <div className="p-3.5 bg-[rgba(147,80,115,0.2)] border border-[rgba(147,80,115,0.4)] rounded-xl space-y-1.5">
              <span className="text-[10px] font-extrabold text-[#F6DBC0] uppercase tracking-wider block">
                ⚡ 5-Minute Actionable Practice Exercise:
              </span>
              <p className="text-xs font-semibold text-[#F8F4E9]">
                {tipData.actionableExercise}
              </p>
            </div>

            {/* Full Email Modal or Drawer View */}
            {showEmailPreview && (
              <div className="p-4 bg-[rgba(26,15,34,0.9)] border border-[rgba(147,80,115,0.35)] rounded-2xl space-y-3 mt-2 shadow-inner">
                <div className="flex items-center gap-2 text-xs text-[rgba(248,244,233,0.5)] font-mono pb-2 border-b border-[rgba(248,244,233,0.08)]">
                  <Mail className="w-3.5 h-3.5 text-[#F6DBC0]" />
                  <span>To: {user?.email || 'user@example.com'}</span>
                  <span>•</span>
                  <span>From: tips@interview.ai</span>
                </div>

                <div className="text-xs text-[rgba(248,244,233,0.85)] space-y-3 font-medium">
                  <p>Hi {user?.name || 'Candidate'},</p>
                  <p>{tipData.coreTip}</p>
                  <p className="font-bold text-[#F6DBC0]">Gold-Standard Answer Template:</p>
                  <blockquote className="p-3 bg-[rgba(42,27,51,0.8)] rounded-xl border-l-4 border-[#935073] italic text-[11px] text-[#F8F4E9]">
                    {tipData.sampleAnswerSnippet}
                  </blockquote>
                  <p className="text-[11px] text-[rgba(248,244,233,0.5)]">Keep practicing! You've got this!</p>
                </div>
              </div>
            )}
          </div>

          {/* Action Dispatch Button */}
          <div className="flex flex-col sm:flex-row items-center justify-between gap-3 pt-1">
            <button
              onClick={handleSendTestEmail}
              disabled={isSendingTest}
              className="w-full sm:w-auto px-5 py-2.5 bg-gradient-to-r from-[#502D55] via-[#935073] to-[#a65d83] hover:from-[#603766] hover:to-[#ba6d95] border border-[rgba(246,219,192,0.3)] text-[#F8F4E9] font-extrabold rounded-xl text-xs flex items-center justify-center gap-2 transition shadow-[0_0_18px_rgba(147,80,115,0.35)] cursor-pointer"
            >
              {isSendingTest ? (
                <Sparkles className="w-3.5 h-3.5 animate-spin text-[#F6DBC0]" />
              ) : (
                <Send className="w-3.5 h-3.5 text-[#F6DBC0]" />
              )}
              <span>{isSendingTest ? 'Dispatching Test Email...' : 'Send Test Tip Email Now'}</span>
            </button>

            {dispatchMessage && (
              <span className="text-xs font-bold text-[#7FE3B9] flex items-center gap-1.5">
                <CheckCircle2 className="w-4 h-4 text-[#7FE3B9]" />
                {dispatchMessage}
              </span>
            )}
          </div>
        </div>
      ) : null}
    </div>
  );
};
