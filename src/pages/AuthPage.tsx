import React, { useState, useEffect } from 'react';
import { useNavigate, useSearchParams, useLocation, Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { Bot, Mail, Lock, User as UserIcon, AlertCircle, ArrowRight, Loader2, Sparkles, UserCheck } from 'lucide-react';

interface AuthPageProps {
  defaultMode?: 'login' | 'signup';
}

export const AuthPage: React.FC<AuthPageProps> = ({ defaultMode }) => {
  const [searchParams] = useSearchParams();
  const location = useLocation();
  const navigate = useNavigate();
  const { login, signup, loginAsGuest, user } = useAuth();

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
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [name, setName] = useState('');

  // States
  const [error, setError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isGuestLoading, setIsGuestLoading] = useState(false);

  const destination = (location.state as any)?.from?.pathname || '/dashboard';

  useEffect(() => {
    if (user) {
      navigate(destination, { replace: true });
    }
  }, [user, navigate, destination]);

  const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

  const handleGuestSignIn = async () => {
    setError(null);
    setIsGuestLoading(true);
    try {
      const res = await loginAsGuest();
      if (!res.success) {
        setError(res.error || 'Failed to continue as guest.');
      } else {
        navigate(destination, { replace: true });
      }
    } catch (err: any) {
      setError(err.message || 'An unexpected error occurred.');
    } finally {
      setIsGuestLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    const trimmedEmail = email.trim();

    if (!trimmedEmail || !password || (isSignUp && !name.trim())) {
      setError('Please fill in all required fields.');
      return;
    }

    if (!EMAIL_REGEX.test(trimmedEmail)) {
      setError('Please enter a valid email address (e.g. name@example.com).');
      return;
    }

    if (isSignUp) {
      if (password.length < 8) {
        setError('Password must be at least 8 characters long.');
        return;
      }
      if (!/[a-zA-Z]/.test(password) || !/[0-9]/.test(password)) {
        setError('Password must contain at least one letter and one number.');
        return;
      }
    }

    setIsSubmitting(true);

    try {
      if (isSignUp) {
        const res = await signup(trimmedEmail, name.trim(), password);
        if (!res.success) {
          setError(res.error || 'Failed to sign up.');
        } else {
          navigate(destination, { replace: true });
        }
      } else {
        const res = await login(trimmedEmail, password);
        if (!res.success) {
          setError(res.error || 'Failed to log in.');
        } else {
          navigate(destination, { replace: true });
        }
      }
    } catch (err: any) {
      setError(err.message || 'An unexpected error occurred.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const anyLoading = isSubmitting || isGuestLoading;

  return (
    <div className="w-full min-h-[calc(100vh-4rem)] text-[#F8F4E9] flex items-center justify-center px-4 py-12 relative overflow-hidden">
      {/* Background radial glow */}
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[550px] h-[340px] bg-[#935073]/20 blur-[100px] rounded-full pointer-events-none" />
      <div className="absolute bottom-10 left-1/2 -translate-x-1/2 w-[400px] h-[200px] bg-[#F6DBC0]/10 blur-[80px] rounded-full pointer-events-none" />

      <div className="max-w-md w-full bg-[rgba(42,27,51,0.74)] backdrop-blur-2xl border border-[rgba(248,244,233,0.09)] rounded-3xl shadow-[0_24px_50px_rgba(15,7,20,0.85),0_0_35px_rgba(147,80,115,0.25)] p-6 sm:p-8 relative z-10">
        {/* Header */}
        <div className="text-center mb-6">
          <div className="inline-flex items-center justify-center w-13 h-13 rounded-2xl bg-gradient-to-tr from-[#502D55] via-[#935073] to-[#a65d83] border border-[rgba(246,219,192,0.35)] text-[#F8F4E9] mb-3 shadow-[0_0_20px_rgba(147,80,115,0.45)]">
            <Bot className="w-6 h-6 text-[#F8F4E9]" />
          </div>
          <h2 className="text-2xl font-black text-[#F8F4E9] tracking-tight">
            Interview AI
          </h2>
          <p className="text-xs font-bold text-[#F6DBC0] uppercase tracking-wider mt-0.5">
            Live Voice Coach
          </p>
          <p className="text-xs text-[rgba(248,244,233,0.65)] mt-2 font-medium">
            {isSignUp
              ? 'Join candidates mastering technical and FAANG voice interviews.'
              : 'Sign in to access your interview room and session reports.'}
          </p>
        </div>

        {/* Error Alert Banner */}
        {error && (
          <div className="mb-5 p-3.5 bg-[rgba(229,115,115,0.12)] border border-[rgba(229,115,115,0.4)] rounded-xl text-xs text-[#E57373] flex items-start gap-2.5">
            <AlertCircle className="w-4 h-4 text-[#E57373] shrink-0 mt-0.5" />
            <span className="font-semibold leading-relaxed">{error}</span>
          </div>
        )}

        {/* Guest Access Button */}
        <button
          type="button"
          disabled={anyLoading}
          onClick={handleGuestSignIn}
          className="w-full py-2.5 px-4 rounded-xl bg-[rgba(127,227,185,0.1)] hover:bg-[rgba(127,227,185,0.18)] border border-[rgba(127,227,185,0.3)] hover:border-[rgba(127,227,185,0.5)] text-[#7FE3B9] font-bold text-xs sm:text-sm flex items-center justify-center gap-3 transition-all cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed focus:outline-none focus-visible:ring-2 focus-visible:ring-[#7FE3B9] mb-5"
        >
          {isGuestLoading ? (
            <Loader2 className="w-4 h-4 animate-spin" />
          ) : (
            <UserCheck className="w-4 h-4" />
          )}
          <span>{isGuestLoading ? 'Setting up guest session...' : 'Continue as Guest — no sign up needed'}</span>
        </button>

        {/* Divider */}
        <div className="relative flex items-center justify-center mb-5">
          <div className="border-t border-[rgba(248,244,233,0.1)] w-full" />
          <span className="bg-[#2A1B33] px-3 text-[11px] font-bold uppercase tracking-wider text-[rgba(248,244,233,0.45)]">
            or sign in with email
          </span>
          <div className="border-t border-[rgba(248,244,233,0.1)] w-full" />
        </div>

        {/* Existing Email / Password Form */}
        <form onSubmit={handleSubmit} className="space-y-3.5">
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
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="e.g. Alex Rivera"
                  className="w-full bg-[rgba(26,15,34,0.6)] border border-[rgba(248,244,233,0.1)] focus:border-[#935073] focus:ring-2 focus:ring-[#935073]/30 rounded-xl py-2 pl-10 pr-4 text-sm text-[#F8F4E9] placeholder-[rgba(248,244,233,0.3)] outline-none transition font-medium disabled:opacity-50"
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
                className="w-full bg-[rgba(26,15,34,0.6)] border border-[rgba(248,244,233,0.1)] focus:border-[#935073] focus:ring-2 focus:ring-[#935073]/30 rounded-xl py-2 pl-10 pr-4 text-sm text-[#F8F4E9] placeholder-[rgba(248,244,233,0.3)] outline-none transition font-medium disabled:opacity-50"
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
                minLength={isSignUp ? 8 : undefined}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
                autoComplete={isSignUp ? 'new-password' : 'current-password'}
                className="w-full bg-[rgba(26,15,34,0.6)] border border-[rgba(248,244,233,0.1)] focus:border-[#935073] focus:ring-2 focus:ring-[#935073]/30 rounded-xl py-2 pl-10 pr-4 text-sm text-[#F8F4E9] placeholder-[rgba(248,244,233,0.3)] outline-none transition font-medium disabled:opacity-50"
              />
            </div>
            {isSignUp && (
              <p className="text-[11px] text-[rgba(248,244,233,0.5)] mt-1 font-medium">
                At least 8 characters, with a letter and a number.
              </p>
            )}
          </div>

          <button
            type="submit"
            disabled={anyLoading}
            className="w-full mt-2 py-2.5 bg-gradient-to-r from-[#502D55] via-[#935073] to-[#a65d83] hover:from-[#603766] hover:to-[#ba6d95] border border-[rgba(246,219,192,0.3)] disabled:opacity-50 text-[#F8F4E9] font-bold rounded-xl text-sm shadow-[0_0_20px_rgba(147,80,115,0.4)] transition flex items-center justify-center gap-2 cursor-pointer hover:scale-[1.01] focus:outline-none focus-visible:ring-2 focus-visible:ring-[#F6DBC0]"
          >
            {isSubmitting ? (
              <span className="flex items-center gap-2">
                <Loader2 className="w-4 h-4 animate-spin text-[#F6DBC0]" />
                <span>Authenticating...</span>
              </span>
            ) : (
              <>
                <span>{isSignUp ? 'Create Account' : 'Sign In with Email'}</span>
                <ArrowRight className="w-4 h-4 text-[#F6DBC0]" />
              </>
            )}
          </button>
        </form>

        {/* Footer Toggle */}
        <div className="mt-5 pt-3.5 border-t border-[rgba(248,244,233,0.08)] text-center text-xs text-[rgba(248,244,233,0.6)] font-medium">
          {isSignUp ? (
            <p>
              Already have an account?{' '}
              <button
                type="button"
                onClick={() => {
                  setIsSignUp(false);
                  setError(null);
                }}
                className="text-[#F6DBC0] hover:underline font-bold cursor-pointer"
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
                className="text-[#F6DBC0] hover:underline font-bold cursor-pointer"
              >
                Sign up free
              </button>
            </p>
          )}
        </div>
      </div>
    </div>
  );
};
