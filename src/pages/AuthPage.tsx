import React, { useState, useEffect } from 'react';
import { useNavigate, useSearchParams, useLocation, Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { Bot, Mail, Lock, User as UserIcon, AlertCircle, ArrowRight, Loader2, Sparkles } from 'lucide-react';

interface AuthPageProps {
  defaultMode?: 'login' | 'signup';
}

export const AuthPage: React.FC<AuthPageProps> = ({ defaultMode }) => {
  const [searchParams] = useSearchParams();
  const location = useLocation();
  const navigate = useNavigate();
  const { login, signup, user, signInWithGoogle, signInWithGitHub, signInWithApple } = useAuth();

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
  const [suggestedProvider, setSuggestedProvider] = useState<'google' | 'github' | 'apple' | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [activeSocialLoading, setActiveSocialLoading] = useState<'google' | 'github' | 'apple' | null>(null);

  const destination = (location.state as any)?.from?.pathname || '/dashboard';

  useEffect(() => {
    if (user) {
      navigate(destination, { replace: true });
    }
  }, [user, navigate, destination]);

  const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

  const handleSocialSignIn = async (provider: 'google' | 'github' | 'apple') => {
    setError(null);
    setSuggestedProvider(null);
    setActiveSocialLoading(provider);

    try {
      let res: { success: boolean; error?: string };
      if (provider === 'google') {
        res = await signInWithGoogle();
      } else if (provider === 'github') {
        res = await signInWithGitHub();
      } else {
        res = await signInWithApple();
      }

      if (!res.success) {
        setError(res.error || `Failed to sign in with ${provider}`);
        if (res.error?.includes('different sign-in provider')) {
          setSuggestedProvider(provider === 'google' ? 'github' : 'google');
        }
      } else {
        navigate(destination, { replace: true });
      }
    } catch (err: any) {
      setError(err.message || 'An unexpected error occurred during social sign-in.');
    } finally {
      setActiveSocialLoading(null);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setSuggestedProvider(null);

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

  const anyLoading = isSubmitting || activeSocialLoading !== null;

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
          <div className="mb-5 p-3.5 bg-[rgba(229,115,115,0.12)] border border-[rgba(229,115,115,0.4)] rounded-xl text-xs text-[#E57373] flex flex-col gap-2">
            <div className="flex items-start gap-2.5">
              <AlertCircle className="w-4 h-4 text-[#E57373] shrink-0 mt-0.5" />
              <span className="font-semibold leading-relaxed">{error}</span>
            </div>
            {suggestedProvider && (
              <button
                type="button"
                onClick={() => handleSocialSignIn(suggestedProvider)}
                className="self-end text-xs font-bold text-[#F6DBC0] underline hover:text-white cursor-pointer"
              >
                Sign in with {suggestedProvider === 'google' ? 'Google' : 'GitHub'} instead
              </button>
            )}
          </div>
        )}

        {/* Three Full-Width Social Provider Buttons */}
        <div className="space-y-2.5 mb-5">
          {/* Google Button */}
          <button
            type="button"
            disabled={anyLoading}
            onClick={() => handleSocialSignIn('google')}
            aria-label="Continue with Google"
            className="w-full py-2.5 px-4 rounded-xl bg-[rgba(26,15,34,0.7)] hover:bg-[rgba(54,34,66,0.9)] border border-[rgba(248,244,233,0.12)] hover:border-[rgba(246,219,192,0.4)] text-[#F8F4E9] font-bold text-xs sm:text-sm flex items-center justify-center gap-3 transition-all cursor-pointer shadow-xs disabled:opacity-50 disabled:cursor-not-allowed group focus:outline-none focus-visible:ring-2 focus-visible:ring-[#935073]"
          >
            {activeSocialLoading === 'google' ? (
              <Loader2 className="w-4 h-4 text-[#F6DBC0] animate-spin" />
            ) : (
              <svg className="w-4 h-4 shrink-0" viewBox="0 0 24 24">
                <path
                  fill="#EA4335"
                  d="M12 5c1.6 0 3 .6 4.1 1.7l3.1-3.1C17.3 1.8 14.8 1 12 1 7.4 1 3.5 3.6 1.6 7.4l3.7 2.9C6.2 7.3 8.9 5 12 5z"
                />
                <path
                  fill="#4285F4"
                  d="M23.5 12.3c0-.8-.1-1.7-.2-2.3H12v4.6h6.5c-.3 1.5-1.1 2.8-2.4 3.7l3.7 2.9c2.2-2 3.7-5 3.7-8.9z"
                />
                <path
                  fill="#FBBC05"
                  d="M5.3 14.7c-.2-.7-.4-1.5-.4-2.3 0-.8.2-1.6.4-2.3L1.6 7.2C.6 9.2 0 10.5 0 12.4s.6 3.2 1.6 5.2l3.7-2.9z"
                />
                <path
                  fill="#34A853"
                  d="M12 23.8c3.2 0 6-1.1 8-3l-3.7-2.9c-1.1.7-2.5 1.2-4.3 1.2-3.1 0-5.8-2.3-6.7-5.3L1.6 16.7C3.5 20.6 7.4 23.8 12 23.8z"
                />
              </svg>
            )}
            <span>{activeSocialLoading === 'google' ? 'Connecting Google...' : 'Continue with Google'}</span>
          </button>

          {/* GitHub Button */}
          <button
            type="button"
            disabled={anyLoading}
            onClick={() => handleSocialSignIn('github')}
            aria-label="Continue with GitHub"
            className="w-full py-2.5 px-4 rounded-xl bg-[rgba(26,15,34,0.7)] hover:bg-[rgba(54,34,66,0.9)] border border-[rgba(248,244,233,0.12)] hover:border-[rgba(246,219,192,0.4)] text-[#F8F4E9] font-bold text-xs sm:text-sm flex items-center justify-center gap-3 transition-all cursor-pointer shadow-xs disabled:opacity-50 disabled:cursor-not-allowed group focus:outline-none focus-visible:ring-2 focus-visible:ring-[#935073]"
          >
            {activeSocialLoading === 'github' ? (
              <Loader2 className="w-4 h-4 text-[#F6DBC0] animate-spin" />
            ) : (
              <svg className="w-4 h-4 fill-current shrink-0" viewBox="0 0 24 24">
                <path d="M12 0C5.37 0 0 5.37 0 12c0 5.31 3.435 9.795 8.205 11.385.6.105.825-.255.825-.57 0-.285-.015-1.23-.015-2.235-3.015.555-3.795-.735-4.035-1.41-.135-.345-.72-1.41-1.23-1.695-.42-.225-1.02-.78-.015-.795.945-.015 1.62.87 1.845 1.23 1.08 1.815 2.805 1.305 3.495.99.105-.78.42-1.305.765-1.605-2.67-.3-5.46-1.335-5.46-5.925 0-1.305.465-2.385 1.23-3.225-.12-.3-.54-1.53.12-3.18 0 0 1.005-.315 3.3 1.23.96-.27 1.98-.405 3-.405s2.04.135 3 .405c2.295-1.56 3.3-1.23 3.3-1.23.66 1.65.24 2.88.12 3.18.765.84 1.23 1.905 1.23 3.225 0 4.605-2.805 5.625-5.475 5.925.435.375.81 1.095.81 2.22 0 1.605-.015 2.895-.015 3.3 0 .315.225.69.825.57A12.02 12.02 0 0024 12c0-6.63-5.37-12-12-12z" />
              </svg>
            )}
            <span>{activeSocialLoading === 'github' ? 'Connecting GitHub...' : 'Continue with GitHub'}</span>
          </button>

          {/* Apple Button */}
          <button
            type="button"
            disabled={anyLoading}
            onClick={() => handleSocialSignIn('apple')}
            aria-label="Continue with Apple"
            className="w-full py-2.5 px-4 rounded-xl bg-[rgba(26,15,34,0.7)] hover:bg-[rgba(54,34,66,0.9)] border border-[rgba(248,244,233,0.12)] hover:border-[rgba(246,219,192,0.4)] text-[#F8F4E9] font-bold text-xs sm:text-sm flex items-center justify-center gap-3 transition-all cursor-pointer shadow-xs disabled:opacity-50 disabled:cursor-not-allowed group focus:outline-none focus-visible:ring-2 focus-visible:ring-[#935073]"
          >
            {activeSocialLoading === 'apple' ? (
              <Loader2 className="w-4 h-4 text-[#F6DBC0] animate-spin" />
            ) : (
              <svg className="w-4 h-4 fill-current shrink-0" viewBox="0 0 24 24">
                <path d="M18.71 19.5c-.83 1.24-1.71 2.45-3.05 2.47-1.34.03-1.77-.79-3.29-.79-1.53 0-2 .77-3.27.82-1.31.05-2.3-1.32-3.14-2.53C4.25 17 2.94 12.45 4.7 9.39c.87-1.52 2.43-2.48 4.12-2.51 1.28-.02 2.5.87 3.29.87.78 0 2.26-1.07 3.81-.91.65.03 2.47.26 3.64 1.98-.09.06-2.17 1.28-2.15 3.81.03 3.02 2.65 4.03 2.68 4.04-.03.07-.42 1.44-1.38 2.83M15.97 6.34c.64-.78 1.08-1.86.96-2.94-1 .04-2.16.66-2.82 1.44-.58.67-1.09 1.77-.95 2.82 1.11.09 2.19-.57 2.81-1.32z" />
              </svg>
            )}
            <span>{activeSocialLoading === 'apple' ? 'Connecting Apple...' : 'Continue with Apple'}</span>
          </button>
        </div>

        {/* Divider "or" */}
        <div className="relative flex items-center justify-center my-4">
          <div className="border-t border-[rgba(248,244,233,0.1)] w-full" />
          <span className="bg-[#2A1B33] px-3 text-[11px] font-bold uppercase tracking-wider text-[rgba(248,244,233,0.45)]">
            or
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
