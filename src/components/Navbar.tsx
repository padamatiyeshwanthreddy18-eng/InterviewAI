import React, { useState } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { AudioSettingsModal } from './AudioSettingsModal';
import { ROLE_TRACKS } from '../types';
import {
  Sparkles,
  Bot,
  LayoutDashboard,
  PlayCircle,
  History,
  User as UserIcon,
  ShieldCheck,
  LogOut,
  Menu,
  X,
  Sliders,
  Zap,
} from 'lucide-react';

export const Navbar: React.FC = () => {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [isAudioSettingsOpen, setIsAudioSettingsOpen] = useState(false);

  const handleLogout = async () => {
    await logout();
    navigate('/');
  };

  const isActive = (path: string) => location.pathname === path;

  const getUserInitials = () => {
    const raw = user?.name || user?.email || 'Candidate';
    return raw.substring(0, 2).toUpperCase();
  };

  return (
    <nav className="sticky top-0 z-40 bg-[rgba(26,15,34,0.78)] backdrop-blur-2xl border-b border-[rgba(248,244,233,0.08)] text-[#F8F4E9] transition-all shadow-[0_10px_30px_-10px_rgba(15,7,20,0.5)]">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16 sm:h-18">
          {/* Brand Wordmark (One line, Zone 1) */}
          <Link to="/" className="flex items-center gap-3 group">
            <div className="w-10 h-10 rounded-2xl bg-gradient-to-tr from-[#502D55] via-[#935073] to-[#a65d83] border border-[rgba(246,219,192,0.3)] flex items-center justify-center text-[#F6DBC0] shadow-[0_0_20px_rgba(147,80,115,0.45)] group-hover:scale-105 transition-all duration-300">
              <Bot className="w-5 h-5 text-[#F8F4E9]" />
            </div>
            <div className="flex flex-col">
              <span className="font-black text-xl tracking-tight text-[#F8F4E9] flex items-center gap-1">
                Interview<span className="bg-gradient-to-r from-[#F6DBC0] to-[#935073] bg-clip-text text-transparent">AI</span>
              </span>
              <span className="text-[10px] font-bold text-[rgba(248,244,233,0.5)] -mt-1 tracking-wider uppercase flex items-center gap-1.5">
                <span className="w-1.5 h-1.5 rounded-full bg-[#7FE3B9] shadow-[0_0_8px_rgba(127,227,185,0.8)]" />
                Live Voice Coach
              </span>
            </div>
          </Link>

          {/* Desktop Nav Links (Zone 2) */}
          <div className="hidden md:flex items-center gap-1.5">
            {user ? (
              <>
                <Link
                  to="/dashboard"
                  className={`flex items-center gap-2 px-3.5 py-1.5 rounded-full text-xs font-bold transition-all ${
                    isActive('/dashboard')
                      ? 'bg-[#935073] text-[#F8F4E9] shadow-[0_0_16px_rgba(147,80,115,0.4)] border border-[rgba(246,219,192,0.3)]'
                      : 'text-[rgba(248,244,233,0.7)] hover:text-[#F8F4E9] hover:bg-[rgba(147,80,115,0.15)]'
                  }`}
                >
                  <LayoutDashboard className="w-4 h-4 text-[#F6DBC0]" />
                  Dashboard
                </Link>

                <Link
                  to="/track-selection"
                  className={`flex items-center gap-2 px-3.5 py-1.5 rounded-full text-xs font-bold transition-all ${
                    isActive('/track-selection')
                      ? 'bg-[#935073] text-[#F8F4E9] shadow-[0_0_16px_rgba(147,80,115,0.4)] border border-[rgba(246,219,192,0.3)]'
                      : 'text-[rgba(248,244,233,0.7)] hover:text-[#F8F4E9] hover:bg-[rgba(147,80,115,0.15)]'
                  }`}
                >
                  <PlayCircle className="w-4 h-4 text-[#7FE3B9]" />
                  <span>Role Tracks</span>
                  <span className="text-[10px] bg-[rgba(127,227,185,0.15)] text-[#7FE3B9] px-1.5 py-0.2 rounded-full border border-[rgba(127,227,185,0.3)] font-extrabold">
                    {ROLE_TRACKS.length} Roles
                  </span>
                </Link>

                <Link
                  to="/history"
                  className={`flex items-center gap-2 px-3.5 py-1.5 rounded-full text-xs font-bold transition-all ${
                    isActive('/history')
                      ? 'bg-[#935073] text-[#F8F4E9] shadow-[0_0_16px_rgba(147,80,115,0.4)] border border-[rgba(246,219,192,0.3)]'
                      : 'text-[rgba(248,244,233,0.7)] hover:text-[#F8F4E9] hover:bg-[rgba(147,80,115,0.15)]'
                  }`}
                >
                  <History className="w-4 h-4 text-[#F6DBC0]" />
                  History
                </Link>

                <Link
                  to="/profile"
                  className={`flex items-center gap-2 px-3.5 py-1.5 rounded-full text-xs font-bold transition-all ${
                    isActive('/profile')
                      ? 'bg-[#935073] text-[#F8F4E9] shadow-[0_0_16px_rgba(147,80,115,0.4)] border border-[rgba(246,219,192,0.3)]'
                      : 'text-[rgba(248,244,233,0.7)] hover:text-[#F8F4E9] hover:bg-[rgba(147,80,115,0.15)]'
                  }`}
                >
                  <UserIcon className="w-4 h-4 text-[#F6DBC0]" />
                  Profile
                </Link>

                {user.role === 'admin' && (
                  <Link
                    to="/admin"
                    className={`flex items-center gap-1.5 px-3.5 py-1.5 rounded-full text-xs font-bold transition-all ${
                      isActive('/admin')
                        ? 'bg-[#935073] text-[#F8F4E9] shadow-[0_0_16px_rgba(147,80,115,0.4)] border border-[rgba(246,219,192,0.3)]'
                        : 'text-[rgba(248,244,233,0.7)] hover:text-[#F6DBC0] hover:bg-[rgba(147,80,115,0.15)]'
                    }`}
                  >
                    <ShieldCheck className="w-4 h-4 text-[#F6DBC0]" />
                    <span>Admin</span>
                    <span className="w-1.5 h-1.5 rounded-full bg-[#F6DBC0] shadow-[0_0_6px_rgba(246,219,192,0.8)]" />
                  </Link>
                )}
              </>
            ) : (
              <div className="flex items-center gap-2">
                <Link
                  to="/track-selection"
                  className="px-3.5 py-1.5 text-xs text-[rgba(248,244,233,0.75)] hover:text-[#F8F4E9] font-bold transition-colors flex items-center gap-1.5"
                >
                  <span>Interview Tracks</span>
                  <span className="text-[9px] bg-[rgba(147,80,115,0.25)] text-[#F6DBC0] px-1.5 py-0.5 rounded-full font-extrabold border border-[rgba(147,80,115,0.35)]">
                    {ROLE_TRACKS.length} Roles
                  </span>
                </Link>
              </div>
            )}
          </div>

          {/* Right Controls (Zone 3) */}
          <div className="hidden md:flex items-center gap-2.5">
            <button
              onClick={() => setIsAudioSettingsOpen(true)}
              className="p-2 rounded-xl text-[rgba(248,244,233,0.6)] hover:text-[#F6DBC0] hover:bg-[rgba(147,80,115,0.2)] border border-[rgba(248,244,233,0.06)] hover:border-[rgba(147,80,115,0.35)] transition-all cursor-pointer"
              title="Voice & Audio Settings"
            >
              <Sliders className="w-4 h-4" />
            </button>

            {user ? (
              <div className="flex items-center gap-3 pl-3 border-l border-[rgba(248,244,233,0.08)]">
                <Link
                  to="/profile"
                  className="flex items-center gap-2.5 p-1 rounded-full hover:bg-[rgba(147,80,115,0.2)] transition-all"
                >
                  <div className="w-8 h-8 rounded-full bg-gradient-to-tr from-[#502D55] to-[#935073] border border-[rgba(246,219,192,0.4)] flex items-center justify-center font-bold text-xs text-[#F8F4E9] shadow-sm overflow-hidden shrink-0">
                    {user.photoURL ? (
                      <img src={user.photoURL} alt={user.name} className="w-full h-full object-cover" />
                    ) : (
                      getUserInitials()
                    )}
                  </div>
                  <div className="flex flex-col text-left pr-2">
                    <span className="text-xs font-bold text-[#F8F4E9] max-w-[110px] truncate">
                      {user.name}
                    </span>
                    <span className="text-[9px] font-mono font-semibold text-[#F6DBC0] uppercase tracking-wider flex items-center gap-1">
                      <span>{user.role}</span>
                      {user.provider && (
                        <span className="text-[8px] text-[rgba(248,244,233,0.45)] lowercase">
                          • {user.provider.replace('.com', '')}
                        </span>
                      )}
                    </span>
                  </div>
                </Link>

                <button
                  onClick={handleLogout}
                  className="p-2 text-[rgba(248,244,233,0.5)] hover:text-[#E57373] hover:bg-[rgba(229,115,115,0.1)] rounded-xl transition-colors cursor-pointer"
                  title="Sign out"
                >
                  <LogOut className="w-4 h-4" />
                </button>
              </div>
            ) : (
              <div className="flex items-center gap-2">
                <Link
                  to="/login"
                  className="px-3.5 py-1.5 text-xs text-[rgba(248,244,233,0.8)] hover:text-[#F8F4E9] font-bold transition-colors"
                >
                  Log In
                </Link>
                <Link
                  to="/register"
                  className="flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-extrabold text-[#F8F4E9] border border-[rgba(246,219,192,0.3)] shadow-[0_0_20px_rgba(147,80,115,0.4)] transition-all hover:scale-102"
                  style={{
                    background: 'linear-gradient(135deg, #502D55 0%, #935073 60%, #a65d83 100%)',
                  }}
                >
                  <Sparkles className="w-3.5 h-3.5 text-[#F6DBC0]" />
                  <span>Get Started</span>
                </Link>
              </div>
            )}
          </div>

          {/* Mobile Menu Button */}
          <div className="md:hidden flex items-center gap-2">
            <button
              onClick={() => setIsAudioSettingsOpen(true)}
              className="p-2 rounded-xl text-[rgba(248,244,233,0.7)] hover:text-[#F6DBC0]"
              title="Voice Settings"
            >
              <Sliders className="w-4 h-4" />
            </button>
            <button
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="p-2 rounded-xl text-[rgba(248,244,233,0.8)] hover:bg-[rgba(147,80,115,0.2)]"
            >
              {mobileMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
            </button>
          </div>
        </div>
      </div>

      {/* Mobile Drawer */}
      {mobileMenuOpen && (
        <div className="md:hidden bg-[rgba(26,15,34,0.95)] backdrop-blur-2xl border-b border-[rgba(248,244,233,0.08)] px-4 pt-3 pb-5 space-y-2">
          {user ? (
            <>
              <div className="pb-3 border-b border-[rgba(248,244,233,0.08)] flex items-center gap-3">
                <div className="w-10 h-10 rounded-full bg-gradient-to-tr from-[#502D55] to-[#935073] border border-[#F6DBC0] flex items-center justify-center font-bold text-[#F8F4E9] text-xs overflow-hidden shrink-0">
                  {user.photoURL ? (
                    <img src={user.photoURL} alt={user.name} className="w-full h-full object-cover" />
                  ) : (
                    getUserInitials()
                  )}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-bold text-[#F8F4E9] truncate">{user.name}</p>
                  <p className="text-xs text-[rgba(248,244,233,0.5)] font-mono truncate">{user.email}</p>
                  {user.provider && (
                    <span className="text-[10px] text-[#F6DBC0] font-mono block">
                      Signed in via {user.provider.replace('.com', '')}
                    </span>
                  )}
                </div>
              </div>

              <Link
                to="/dashboard"
                onClick={() => setMobileMenuOpen(false)}
                className="flex items-center gap-3 px-3 py-2.5 rounded-xl text-[rgba(248,244,233,0.85)] hover:bg-[rgba(147,80,115,0.2)] text-sm font-bold"
              >
                <LayoutDashboard className="w-4 h-4 text-[#F6DBC0]" />
                Dashboard
              </Link>
              <Link
                to="/track-selection"
                onClick={() => setMobileMenuOpen(false)}
                className="flex items-center gap-3 px-3 py-2.5 rounded-xl text-[rgba(248,244,233,0.85)] hover:bg-[rgba(147,80,115,0.2)] text-sm font-bold"
              >
                <PlayCircle className="w-4 h-4 text-[#7FE3B9]" />
                Role Tracks
              </Link>
              <Link
                to="/history"
                onClick={() => setMobileMenuOpen(false)}
                className="flex items-center gap-3 px-3 py-2.5 rounded-xl text-[rgba(248,244,233,0.85)] hover:bg-[rgba(147,80,115,0.2)] text-sm font-bold"
              >
                <History className="w-4 h-4 text-[#F6DBC0]" />
                History & Feedback
              </Link>
              <Link
                to="/profile"
                onClick={() => setMobileMenuOpen(false)}
                className="flex items-center gap-3 px-3 py-2.5 rounded-xl text-[rgba(248,244,233,0.85)] hover:bg-[rgba(147,80,115,0.2)] text-sm font-bold"
              >
                <UserIcon className="w-4 h-4 text-[#F6DBC0]" />
                Profile & Resume
              </Link>
              {user.role === 'admin' && (
                <Link
                  to="/admin"
                  onClick={() => setMobileMenuOpen(false)}
                  className="flex items-center gap-3 px-3 py-2.5 rounded-xl text-[#F6DBC0] hover:bg-[rgba(147,80,115,0.2)] text-sm font-bold"
                >
                  <ShieldCheck className="w-4 h-4 text-[#F6DBC0]" />
                  <span>Admin Portal</span>
                </Link>
              )}
              <button
                onClick={() => {
                  setMobileMenuOpen(false);
                  handleLogout();
                }}
                className="w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-[#E57373] hover:bg-[rgba(229,115,115,0.1)] text-sm font-bold text-left"
              >
                <LogOut className="w-4 h-4" />
                Sign Out
              </button>
            </>
          ) : (
            <div className="space-y-2 pt-2">
              <Link
                to="/track-selection"
                onClick={() => setMobileMenuOpen(false)}
                className="block w-full py-2.5 px-3 text-[rgba(248,244,233,0.85)] text-sm font-bold"
              >
                Explore Interview Tracks
              </Link>
              <Link
                to="/login"
                onClick={() => setMobileMenuOpen(false)}
                className="block w-full text-center py-2.5 rounded-xl text-sm font-bold border border-[rgba(248,244,233,0.1)] hover:bg-[rgba(147,80,115,0.2)]"
              >
                Log In
              </Link>
              <Link
                to="/register"
                onClick={() => setMobileMenuOpen(false)}
                className="block w-full text-center py-2.5 rounded-xl text-sm font-bold text-[#F8F4E9]"
                style={{
                  background: 'linear-gradient(135deg, #502D55 0%, #935073 60%, #a65d83 100%)',
                }}
              >
                Get Started Free
              </Link>
            </div>
          )}
        </div>
      )}

      {/* Audio & Mic Settings Modal */}
      <AudioSettingsModal
        isOpen={isAudioSettingsOpen}
        onClose={() => setIsAudioSettingsOpen(false)}
      />
    </nav>
  );
};
