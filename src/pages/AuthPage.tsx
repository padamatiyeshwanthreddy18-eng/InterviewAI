import React, { useState, useEffect } from 'react';
import { useNavigate, useSearchParams, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import {
  Bot,
  Mail,
  Lock,
  User as UserIcon,
  AlertCircle,
  ArrowRight,
  Loader2,
  Sparkles,
  Zap,
  CheckCircle2,
} from 'lucide-react';

interface AuthPageProps {
  defaultMode?: 'login' | 'signup';
}

export const AuthPage: React.FC<AuthPageProps> = ({ defaultMode }) => {
  const [searchParams] = useSearchParams();
  const location = useLocation();
  const navigate = useNavigate();
  const { login, signup, loginAsGuest } = useAuth();

  const determineIsSignUp = () => {
    if (location.pathname === '/register' || location.pathname === '/signup') return true;
    if (location.pathname === '/login') return false;
    if (defaultMode) return defaultMode === 'signup';
    return searchParams.get('mode') === 'signup';
  };

  const [isSignUp, setIsSignUp] = useState<boolean>(determineIsSignUp());

  useEffect(() => {
    setIsSignUp(determineIsSignUp());
  }, [location.pathname, searchParams, defaultMode]);

  // Form inputs
  const [candidateName, setCandidateName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');

  // States
  const [error, setError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isFastPassLoading, setIsFastPassLoading] = useState(false);

  const destination = (location.state as any)?.from?.pathname || '/track-selection';

  const handleFastPassAccess = async () => {
    setError(null);
    setIsFastPassLoading(true);
    try {
      const res = await loginAsGuest();
      if (!res.success) {
        setError(res.error || 'Failed to initialize Fast Pass session.');
      } else {
        navigate(destination, { replace: true });
      }
    } catch (err: any) {
      setError(err.message || 'Failed to initialize Fast Pass session.');
    } finally {
      setIsFastPassLoading(false);
    }
  };

  const handleEmailSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    const trimmedEmail = email.trim();
    if (!trimmedEmail || !password) {
      setError('Please provide your email address and password.');
      return;
    }

    if (isSignUp && !candidateName.trim()) {
      setError('Please enter your full name.');
      return;
    }

    setIsSubmitting(true);
    try {
      if (isSignUp) {
        const res = await signup(trimmedEmail, candidateName.trim(), password);
        if (!res.success) {
          setError(res.error || 'Failed to create account.');
        } else {
          navigate(destination, { replace: true });
        }
      } else {
        const res = await login(trimmedEmail, password);
        if (!res.success) {
          setError(res.error || 'Failed to log in. Please check your email and password.');
        } else {
          navigate(destination, { replace: true });
        }
      }
    } catch (err: any) {
      setError(err.message || 'Authentication error occurred.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const anyLoading = isSubmitting || isFastPassLoading;

  return (
    <div className="w-full min-h-[calc(100vh-4rem)] text-[#F8F4E9] flex items-center justify-center px-4 py-12 relative overflow-hidden">
      {/* Ambient background glow */}
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[550px] h-[340px] bg-[#935073]/20 blur-[100px] rounded-full pointer-events-none" />
      <div className="absolute bottom-10 left-1/2 -translate-x-1/2 w-[400px] h-[200px] bg-[#F6DBC0]/10 blur-[80px] rounded-full pointer-events-none" />

      <div className="max-w-md w-full bg-[rgba(42,27,51,0.85)] backdrop-blur-2xl border border-[rgba(248,244,233,0.12)] rounded-3xl shadow-[0_24px_50px_rgba(15,7,20,0.85),0_0_35px_rgba(147,80,115,0.25)] p-6 sm:p-8 relative z-10 space-y-6">
        {/* Header */}
        <div className="text-center">
          <div className="inline-flex items-center justify-center w-14 h-14 rounded-2xl bg-gradient-to-tr from-[#502D55] via-[#935073] to-[#a65d83] border border-[rgba(246,219,192,0.35)] text-[#F8F4E9] mb-3 shadow-[0_0_24px_rgba(147,80,115,0.5)]">
            <Bot className="w-7 h-7 text-[#F8F4E9]" />
          </div>
          <h2 className="text-2xl font-black text-[#F8F4E9] tracking-tight">
            Interview AI
          </h2>
          <p className="text-xs font-bold text-[#F6DBC0] uppercase tracking-wider mt-0.5">
            Live Voice Coach & Simulator
          </p>
          <p className="text-xs text-[rgba(248,244,233,0.7)] mt-2 font-medium">
            Choose Fast Pass for 1-click entry, or sign in with your email &amp; password.
          </p>
        </div>

        {/* Error notification banner if any */}
        {error && (
          <div className="p-3.5 bg-[rgba(229,115,115,0.15)] border border-[rgba(229,115,115,0.4)] rounded-xl text-xs text-[#E57373] flex items-start gap-2.5">
            <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
            <span className="font-semibold leading-relaxed">{error}</span>
          </div>
        )}

        {/* OPTION 1: FAST PASS LOGIN (INSTANT 1-CLICK ACCESS) */}
        <div className="p-4 rounded-2xl bg-gradient-to-b from-[rgba(147,80,115,0.25)] to-[rgba(80,45,85,0.25)] border border-[rgba(246,219,192,0.3)] shadow-[0_0_24px_rgba(147,80,115,0.25)] space-y-2.5">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-extrabold uppercase tracking-wider text-[#F6DBC0] flex items-center gap-1.5">
              <Sparkles className="w-3.5 h-3.5 text-[#F6DBC0]" />
              Recommended Fast Pass
            </span>
            <span className="text-[10px] text-[#7FE3B9] font-bold bg-[rgba(127,227,185,0.15)] px-2 py-0.5 rounded-full border border-[rgba(127,227,185,0.3)]">
              Instant Access
            </span>
          </div>

          <button
            type="button"
            disabled={anyLoading}
            onClick={handleFastPassAccess}
            className="w-full py-3.5 px-5 rounded-xl bg-gradient-to-r from-[#935073] via-[#814163] to-[#502D55] hover:from-[#a65d83] hover:to-[#603766] border border-[#F6DBC0]/50 text-[#F8F4E9] font-extrabold text-sm sm:text-base flex items-center justify-center gap-2.5 transition-all cursor-pointer shadow-[0_0_24px_rgba(147,80,115,0.5)] hover:shadow-[0_0_36px_rgba(147,80,115,0.7)] hover:scale-[1.01] active:scale-[0.99] disabled:opacity-50 group"
          >
            {isFastPassLoading ? (
              <Loader2 className="w-5 h-5 text-[#F6DBC0] animate-spin" />
            ) : (
              <Zap className="w-5 h-5 text-[#F6DBC0] fill-[#F6DBC0] group-hover:scale-110 transition-transform" />
            )}
            <span>
              {isFastPassLoading ? 'Launching Fast Pass...' : '⚡ Fast Pass Login (1-Click)'}
            </span>
          </button>

          <p className="text-[11px] text-center text-[rgba(248,244,233,0.65)] font-medium">
            Jump straight into your interview session with zero wait or password needed.
          </p>
        </div>

        {/* DIVIDER: OR ENTER EMAIL & PASSWORD */}
        <div className="relative flex items-center justify-center">
          <div className="border-t border-[rgba(248,244,233,0.1)] w-full" />
          <span className="bg-[#2A1B33] px-3 text-[11px] font-extrabold uppercase tracking-wider text-[rgba(248,244,233,0.5)]">
            or enter email &amp; password
          </span>
          <div className="border-t border-[rgba(248,244,233,0.1)] w-full" />
        </div>

        {/* OPTION 2: OPEN EMAIL & PASSWORD FORM (NO TOGGLES, ALWAYS VISIBLE) */}
        <form onSubmit={handleEmailSubmit} className="space-y-3.5">
          {isSignUp && (
            <div>
              <label className="block text-xs font-bold text-[#F8F4E9] mb-1 uppercase tracking-wider">
                Full Name
              </label>
              <div className="relative">
                <UserIcon className="w-4 h-4 text-[rgba(248,244,233,0.4)] absolute left-3.5 top-1/2 -translate-y-1/2" />
                <input
                  type="text"
                  required={isSignUp}
                  disabled={anyLoading}
                  value={candidateName}
                  onChange={(e) => setCandidateName(e.target.value)}
                  placeholder="e.g. Alex Rivera"
                  className="w-full bg-[rgba(26,15,34,0.7)] border border-[rgba(248,244,233,0.1)] focus:border-[#935073] focus:ring-2 focus:ring-[#935073]/30 rounded-xl py-2.5 pl-10 pr-4 text-sm text-[#F8F4E9] placeholder-[rgba(248,244,233,0.3)] outline-none transition font-medium disabled:opacity-50"
                />
              </div>
            </div>
          )}

          <div>
            <label className="block text-xs font-bold text-[#F8F4E9] mb-1 uppercase tracking-wider">
              Email Address
            </label>
            <div className="relative">
              <Mail className="w-4 h-4 text-[rgba(248,244,233,0.4)] absolute left-3.5 top-1/2 -translate-y-1/2" />
              <input
                type="email"
                required
                disabled={anyLoading}
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="name@example.com"
                autoComplete="email"
                className="w-full bg-[rgba(26,15,34,0.7)] border border-[rgba(248,244,233,0.1)] focus:border-[#935073] focus:ring-2 focus:ring-[#935073]/30 rounded-xl py-2.5 pl-10 pr-4 text-sm text-[#F8F4E9] placeholder-[rgba(248,244,233,0.3)] outline-none transition font-medium disabled:opacity-50"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-bold text-[#F8F4E9] mb-1 uppercase tracking-wider">
              Password
            </label>
            <div className="relative">
              <Lock className="w-4 h-4 text-[rgba(248,244,233,0.4)] absolute left-3.5 top-1/2 -translate-y-1/2" />
              <input
                type="password"
                required
                disabled={anyLoading}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
                autoComplete={isSignUp ? 'new-password' : 'current-password'}
                className="w-full bg-[rgba(26,15,34,0.7)] border border-[rgba(248,244,233,0.1)] focus:border-[#935073] focus:ring-2 focus:ring-[#935073]/30 rounded-xl py-2.5 pl-10 pr-4 text-sm text-[#F8F4E9] placeholder-[rgba(248,244,233,0.3)] outline-none transition font-medium disabled:opacity-50"
              />
            </div>
          </div>

          <button
            type="submit"
            disabled={anyLoading}
            className="w-full mt-2 py-3 bg-gradient-to-r from-[#502D55] via-[#935073] to-[#a65d83] hover:from-[#603766] hover:to-[#ba6d95] border border-[rgba(246,219,192,0.3)] disabled:opacity-50 text-[#F8F4E9] font-extrabold rounded-xl text-sm shadow-[0_0_20px_rgba(147,80,115,0.4)] transition flex items-center justify-center gap-2 cursor-pointer hover:scale-[1.01]"
          >
            {isSubmitting ? (
              <span className="flex items-center gap-2">
                <Loader2 className="w-4 h-4 animate-spin text-[#F6DBC0]" />
                <span>Authenticating...</span>
              </span>
            ) : (
              <>
                <span>{isSignUp ? 'Create Account with Email' : 'Sign In with Email'}</span>
                <ArrowRight className="w-4 h-4 text-[#F6DBC0]" />
              </>
            )}
          </button>

          {/* Toggle between Login and Signup */}
          <div className="text-center pt-2 text-xs text-[rgba(248,244,233,0.6)] font-medium">
            {isSignUp ? (
              <p>
                Already have an account?{' '}
                <button
                  type="button"
                  onClick={() => {
                    setIsSignUp(false);
                    setError(null);
                  }}
                  className="text-[#F6DBC0] font-bold hover:underline cursor-pointer"
                >
                  Sign in here
                </button>
              </p>
            ) : (
              <p>
                Don't have an account?{' '}
                <button
                  type="button"
                  onClick={() => {
                    setIsSignUp(true);
                    setError(null);
                  }}
                  className="text-[#F6DBC0] font-bold hover:underline cursor-pointer"
                >
                  Sign up free
                </button>
              </p>
            )}
          </div>
        </form>
      </div>
    </div>
  );
};
