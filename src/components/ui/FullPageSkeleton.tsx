import React from 'react';

export const FullPageSkeleton: React.FC = () => {
  return (
    <div className="min-h-screen bg-[#1A0F22] text-[#F8F4E9] flex flex-col items-center justify-center p-6 relative select-none">
      {/* Soft background ambient glow */}
      <div className="absolute w-96 h-96 rounded-full bg-[radial-gradient(circle_at_center,rgba(147,80,115,0.25)_0%,transparent_70%)] blur-3xl pointer-events-none" />

      <div className="relative z-10 flex flex-col items-center max-w-sm w-full text-center space-y-6">
        {/* Animated Orb Logo Loader */}
        <div className="relative w-16 h-16 flex items-center justify-center">
          <div className="absolute inset-0 rounded-2xl bg-gradient-to-tr from-[#502D55] via-[#935073] to-[#F6DBC0] opacity-80 animate-pulse blur-sm" />
          <div className="relative w-14 h-14 rounded-2xl bg-[#231530] border border-[rgba(246,219,192,0.3)] flex items-center justify-center shadow-lg">
            <div className="w-5 h-5 rounded-full bg-gradient-to-br from-[#F6DBC0] to-[#935073] animate-ping" />
          </div>
        </div>

        {/* Brand & Loading Label */}
        <div className="space-y-2">
          <h2 className="text-xl font-black tracking-tight text-[#F8F4E9]">
            Interview AI
          </h2>
          <p className="text-xs text-[rgba(248,244,233,0.55)] font-mono tracking-wider flex items-center justify-center gap-1.5">
            <span className="w-2 h-2 rounded-full bg-[#7FE3B9] animate-pulse" />
            <span>Resolving Secure Session...</span>
          </p>
        </div>

        {/* Shimmer skeleton bar */}
        <div className="w-48 h-1.5 rounded-full bg-[rgba(248,244,233,0.08)] overflow-hidden relative">
          <div className="absolute inset-0 bg-gradient-to-r from-transparent via-[#F6DBC0]/40 to-transparent animate-shimmer" />
        </div>
      </div>
    </div>
  );
};
