import React from 'react';
import { Link, useLocation } from 'react-router-dom';
import {
  LayoutDashboard,
  PlayCircle,
  History,
  User as UserIcon,
  ShieldCheck,
  Sparkles,
  Zap,
  Sliders,
  LogOut,
  Target,
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext';

export interface SidebarNavProps {
  onOpenAudioSettings?: () => void;
  className?: string;
}

export const SidebarNav: React.FC<SidebarNavProps> = ({
  onOpenAudioSettings,
  className = '',
}) => {
  const location = useLocation();
  const { user, logout } = useAuth();
  const isActive = (path: string) => location.pathname === path;

  return (
    <aside
      className={`w-64 shrink-0 flex flex-col justify-between p-5 rounded-3xl bg-[rgba(42,27,51,0.72)] backdrop-blur-2xl border border-[rgba(248,244,233,0.08)] shadow-[0_16px_36px_-12px_rgba(15,7,20,0.6)] ${className}`}
    >
      <div className="space-y-6">
        {/* User Mini Profile Badge (Reference B) */}
        {user ? (
          <div className="p-3.5 rounded-2xl bg-[rgba(26,15,34,0.6)] border border-[rgba(248,244,233,0.06)] flex items-center gap-3">
            <div className="w-10 h-10 rounded-full bg-gradient-to-tr from-[#502D55] to-[#935073] border-2 border-[#F6DBC0] flex items-center justify-center font-bold text-xs text-[#F8F4E9] shadow-[0_0_12px_rgba(147,80,115,0.4)]">
              {user.name.substring(0, 2).toUpperCase()}
            </div>
            <div className="flex flex-col min-w-0">
              <span className="text-xs font-bold text-[#F8F4E9] truncate">{user.name}</span>
              <span className="text-[10px] font-mono uppercase tracking-wider text-[#F6DBC0]">
                {user.role === 'admin' ? 'Admin' : 'Candidate'}
              </span>
            </div>
          </div>
        ) : (
          <div className="p-3.5 rounded-2xl bg-[rgba(26,15,34,0.6)] border border-[rgba(248,244,233,0.06)] text-center">
            <span className="text-xs font-bold text-[#F8F4E9] block">Guest Session</span>
            <Link
              to="/auth"
              className="text-[10px] text-[#F6DBC0] hover:underline font-bold mt-1 inline-block"
            >
              Sign In to Save Progress →
            </Link>
          </div>
        )}

        {/* GENERAL SECTION */}
        <div>
          <span className="text-[10px] font-bold uppercase tracking-widest text-[rgba(248,244,233,0.4)] px-3 mb-2 block">
            General
          </span>
          <nav className="space-y-1">
            <Link
              to="/dashboard"
              className={`flex items-center gap-3 px-3.5 py-2.5 rounded-full text-xs font-bold transition-all ${
                isActive('/dashboard')
                  ? 'bg-[#935073] text-[#F8F4E9] shadow-[0_0_16px_rgba(147,80,115,0.4)] border border-[rgba(246,219,192,0.3)]'
                  : 'text-[rgba(248,244,233,0.7)] hover:text-[#F8F4E9] hover:bg-[rgba(147,80,115,0.15)]'
              }`}
            >
              <LayoutDashboard className="w-4 h-4 text-[#F6DBC0]" />
              <span>Dashboard</span>
            </Link>

            <Link
              to="/track-selection"
              className={`flex items-center gap-3 px-3.5 py-2.5 rounded-full text-xs font-bold transition-all ${
                isActive('/track-selection')
                  ? 'bg-[#935073] text-[#F8F4E9] shadow-[0_0_16px_rgba(147,80,115,0.4)] border border-[rgba(246,219,192,0.3)]'
                  : 'text-[rgba(248,244,233,0.7)] hover:text-[#F8F4E9] hover:bg-[rgba(147,80,115,0.15)]'
              }`}
            >
              <PlayCircle className="w-4 h-4 text-[#7FE3B9]" />
              <span>Interview Tracks</span>
            </Link>

            <Link
              to="/history"
              className={`flex items-center gap-3 px-3.5 py-2.5 rounded-full text-xs font-bold transition-all ${
                isActive('/history')
                  ? 'bg-[#935073] text-[#F8F4E9] shadow-[0_0_16px_rgba(147,80,115,0.4)] border border-[rgba(246,219,192,0.3)]'
                  : 'text-[rgba(248,244,233,0.7)] hover:text-[#F8F4E9] hover:bg-[rgba(147,80,115,0.15)]'
              }`}
            >
              <History className="w-4 h-4 text-[#F6DBC0]" />
              <span>History & Critiques</span>
            </Link>
          </nav>
        </div>

        {/* STUDY & PREP SECTION */}
        <div>
          <span className="text-[10px] font-bold uppercase tracking-widest text-[rgba(248,244,233,0.4)] px-3 mb-2 block">
            Settings & Profile
          </span>
          <nav className="space-y-1">
            <Link
              to="/profile"
              className={`flex items-center gap-3 px-3.5 py-2.5 rounded-full text-xs font-bold transition-all ${
                isActive('/profile')
                  ? 'bg-[#935073] text-[#F8F4E9] shadow-[0_0_16px_rgba(147,80,115,0.4)] border border-[rgba(246,219,192,0.3)]'
                  : 'text-[rgba(248,244,233,0.7)] hover:text-[#F8F4E9] hover:bg-[rgba(147,80,115,0.15)]'
              }`}
            >
              <UserIcon className="w-4 h-4 text-[#F6DBC0]" />
              <span>Profile & Resume</span>
            </Link>

            {onOpenAudioSettings && (
              <button
                onClick={onOpenAudioSettings}
                className="w-full flex items-center gap-3 px-3.5 py-2.5 rounded-full text-xs font-bold text-[rgba(248,244,233,0.7)] hover:text-[#F8F4E9] hover:bg-[rgba(147,80,115,0.15)] transition-all cursor-pointer text-left"
              >
                <Sliders className="w-4 h-4 text-[#F6DBC0]" />
                <span>Audio & Voice Coach</span>
              </button>
            )}

            {user?.role === 'admin' && (
              <Link
                to="/admin"
                className={`flex items-center gap-3 px-3.5 py-2.5 rounded-full text-xs font-bold transition-all ${
                  isActive('/admin')
                    ? 'bg-[#935073] text-[#F8F4E9] shadow-[0_0_16px_rgba(147,80,115,0.4)] border border-[rgba(246,219,192,0.3)]'
                    : 'text-[rgba(248,244,233,0.7)] hover:text-[#F8F4E9] hover:bg-[rgba(147,80,115,0.15)]'
                }`}
              >
                <ShieldCheck className="w-4 h-4 text-[#F6DBC0]" />
                <span>Admin Portal</span>
              </Link>
            )}
          </nav>
        </div>
      </div>

      {/* BOTTOM PINNED: QUICK ACTION */}
      <div className="pt-4 border-t border-[rgba(248,244,233,0.06)] space-y-3">
        <Link
          to="/track-selection"
          className="w-full flex items-center justify-center gap-2 py-2.5 rounded-xl bg-gradient-to-r from-[#502D55] via-[#935073] to-[#a65d83] hover:from-[#603766] hover:to-[#ba6d95] text-[#F8F4E9] border border-[rgba(246,219,192,0.3)] text-xs font-extrabold shadow-[0_0_16px_rgba(147,80,115,0.35)] transition-all cursor-pointer"
        >
          <PlayCircle className="w-4 h-4 text-[#F6DBC0]" />
          <span>Start New Interview</span>
        </Link>

        {user && (
          <button
            onClick={logout}
            className="w-full flex items-center justify-center gap-2 py-2 rounded-xl text-xs font-bold text-[rgba(248,244,233,0.5)] hover:text-[#E57373] hover:bg-[rgba(229,115,115,0.1)] transition-colors cursor-pointer"
          >
            <LogOut className="w-3.5 h-3.5" />
            <span>Sign Out</span>
          </button>
        )}
      </div>
    </aside>
  );
};
