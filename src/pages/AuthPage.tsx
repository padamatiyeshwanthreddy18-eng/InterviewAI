import React, { useState, useEffect } from 'react';
import { useNavigate, useSearchParams, useLocation, Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { Bot, Mail, Lock, User, AlertCircle, ArrowRight } from 'lucide-react';

interface AuthPageProps {
  defaultMode?: 'login' | 'signup';
}

export const AuthPage: React.FC<AuthPageProps> = ({ defaultMode }) => {
  const [searchParams] = useSearchParams();
  const location = useLocation();

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

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [name, setName] = useState('');

  const [error, setError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const { login, signup, user } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    if (user) {
      navigate('/dashboard');
    }
  }, [user, navigate]);

  // Mirrors the server-side rules in server.ts so obviously invalid input is
  // caught instantly instead of round-tripping to the API first.
  const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

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
          navigate('/dashboard');
        }
      } else {
        const res = await login(trimmedEmail, password);
        if (!res.success) {
          setError(res.error || 'Failed to log in.');
        } else {
          navigate('/dashboard');
        }
      }
    } catch (err: any) {
      setError(err.message || 'An unexpected error occurred.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="w-full min-h-[calc(100vh-4rem)] text-[#F8F4E9] flex items-center justify-center px-4 py-12 relative overflow-hidden">
      {/* Background radial glow */}
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[500px] h-[300px] bg-[#935073]/20 blur-[100px] rounded-full pointer-events-none" />

      <div className="max-w-md w-full bg-[rgba(42,27,51,0.72)] backdrop-blur-xl border border-[rgba(248,244,233,0.08)] rounded-3xl shadow-[0_20px_45px_rgba(15,7,20,0.8),0_0_30px_rgba(147,80,115,0.2)] p-6 sm:p-8 relative z-10">
        {/* Header */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-12 h-12 rounded-2xl bg-gradient-to-tr from-[#502D55] to-[#935073] border border-[rgba(246,219,192,0.3)] text-[#F8F4E9] mb-3 shadow-[0_0_18px_rgba(147,80,115,0.4)]">
            <Bot className="w-6 h-6 text-[#F8F4E9]" />
          </div>
          <h2 className="text-2xl font-black text-[#F8F4E9]">
            {isSignUp ? 'Create your InterviewAI account' : 'Welcome back to InterviewAI'}
          </h2>
          <p className="text-xs text-[rgba(248,244,233,0.65)] mt-1.5 font-medium">
            {isSignUp
              ? 'Join thousands of candidates mastering technical and behavioral mock interviews.'
              : 'Sign in to access your interview dashboard and session analytics.'}
          </p>
        </div>

        {/* Error Alert Banner */}
        {error && (
          <div className="mb-6 p-3.5 bg-[rgba(229,115,115,0.12)] border border-[rgba(229,115,115,0.4)] rounded-xl text-xs text-[#E57373] flex items-center gap-2.5">
            <AlertCircle className="w-4 h-4 text-[#E57373] shrink-0" />
            <span className="font-semibold">{error}</span>
          </div>
        )}

        {/* Form */}
        <form onSubmit={handleSubmit} className="space-y-4">
          {isSignUp && (
            <div>
              <label className="block text-xs font-bold text-[#F8F4E9] mb-1.5 uppercase tracking-wider">
                Full Name
              </label>
              <div className="relative">
                <User className="w-4 h-4 text-[rgba(248,244,233,0.4)] absolute left-3.5 top-1/2 -translate-y-1/2" />
                <input
                  type="text"
                  required={isSignUp}
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="e.g. Alex Rivera"
                  className="w-full bg-[rgba(26,15,34,0.6)] border border-[rgba(248,244,233,0.1)] focus:border-[#935073] focus:ring-2 focus:ring-[#935073]/30 rounded-xl py-2.5 pl-10 pr-4 text-sm text-[#F8F4E9] placeholder-[rgba(248,244,233,0.3)] outline-none transition font-medium"
                />
              </div>
            </div>
          )}

          <div>
            <label className="block text-xs font-bold text-[#F8F4E9] mb-1.5 uppercase tracking-wider">
              Email Address
            </label>
            <div className="relative">
              <Mail className="w-4 h-4 text-[rgba(248,244,233,0.4)] absolute left-3.5 top-1/2 -translate-y-1/2" />
              <input
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="name@company.com"
                autoComplete="email"
                className="w-full bg-[rgba(26,15,34,0.6)] border border-[rgba(248,244,233,0.1)] focus:border-[#935073] focus:ring-2 focus:ring-[#935073]/30 rounded-xl py-2.5 pl-10 pr-4 text-sm text-[#F8F4E9] placeholder-[rgba(248,244,233,0.3)] outline-none transition font-medium"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-bold text-[#F8F4E9] mb-1.5 uppercase tracking-wider">
              Password
            </label>
            <div className="relative">
              <Lock className="w-4 h-4 text-[rgba(248,244,233,0.4)] absolute left-3.5 top-1/2 -translate-y-1/2" />
              <input
                type="password"
                required
                minLength={isSignUp ? 8 : undefined}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
                autoComplete={isSignUp ? 'new-password' : 'current-password'}
                className="w-full bg-[rgba(26,15,34,0.6)] border border-[rgba(248,244,233,0.1)] focus:border-[#935073] focus:ring-2 focus:ring-[#935073]/30 rounded-xl py-2.5 pl-10 pr-4 text-sm text-[#F8F4E9] placeholder-[rgba(248,244,233,0.3)] outline-none transition font-medium"
              />
            </div>
            {isSignUp && (
              <p className="text-[11px] text-[rgba(248,244,233,0.5)] mt-1.5 font-medium">
                At least 8 characters, with a letter and a number.
              </p>
            )}
          </div>

          <button
            type="submit"
            disabled={isSubmitting}
            className="w-full mt-2 py-3 bg-gradient-to-r from-[#502D55] via-[#935073] to-[#a65d83] hover:from-[#603766] hover:to-[#ba6d95] border border-[rgba(246,219,192,0.3)] disabled:opacity-50 text-[#F8F4E9] font-bold rounded-xl text-sm shadow-[0_0_20px_rgba(147,80,115,0.4)] transition flex items-center justify-center gap-2 cursor-pointer hover:scale-[1.01]"
          >
            {isSubmitting ? (
              <span>Authenticating...</span>
            ) : (
              <>
                <span>{isSignUp ? 'Create Account' : 'Sign In'}</span>
                <ArrowRight className="w-4 h-4 text-[#F6DBC0]" />
              </>
            )}
          </button>
        </form>

        {/* Footer Toggle */}
        <div className="mt-6 pt-4 border-t border-[rgba(248,244,233,0.08)] text-center text-xs text-[rgba(248,244,233,0.6)] font-medium">
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
