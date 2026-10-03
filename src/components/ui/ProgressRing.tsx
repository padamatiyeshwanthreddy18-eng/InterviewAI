import React from 'react';
import { motion } from 'motion/react';

export interface ProgressRingProps {
  percentage: number;
  size?: number;
  strokeWidth?: number;
  label?: string;
  sublabel?: string;
  className?: string;
}

export const ProgressRing: React.FC<ProgressRingProps> = ({
  percentage,
  size = 140,
  strokeWidth = 10,
  label,
  sublabel,
  className = '',
}) => {
  const safePercentage = Math.min(Math.max(percentage, 0), 100);
  const radius = (size - strokeWidth) / 2;
  const circumference = 2 * Math.PI * radius;
  const strokeDashoffset = circumference - (safePercentage / 100) * circumference;

  const gradientId = `ring-grad-${Math.random().toString(36).substring(2, 9)}`;

  return (
    <div className={`relative flex flex-col items-center justify-center ${className}`}>
      <div className="relative" style={{ width: size, height: size }}>
        <svg width={size} height={size} className="transform -rotate-90">
          <defs>
            <linearGradient id={gradientId} x1="0%" y1="0%" x2="100%" y2="100%">
              <stop offset="0%" stopColor="#502D55" />
              <stop offset="50%" stopColor="#935073" />
              <stop offset="90%" stopColor="#F6DBC0" />
            </linearGradient>
            <filter id={`glow-${gradientId}`} x="-20%" y="-20%" width="140%" height="140%">
              <feDropShadow dx="0" dy="0" stdDeviation="3" floodColor="#935073" floodOpacity="0.6" />
            </filter>
          </defs>

          {/* Background Track */}
          <circle
            cx={size / 2}
            cy={size / 2}
            r={radius}
            stroke="rgba(248, 244, 233, 0.08)"
            strokeWidth={strokeWidth}
            fill="transparent"
          />

          {/* Animated Progress Value */}
          <motion.circle
            cx={size / 2}
            cy={size / 2}
            r={radius}
            stroke={`url(#${gradientId})`}
            strokeWidth={strokeWidth}
            strokeLinecap="round"
            fill="transparent"
            strokeDasharray={circumference}
            initial={{ strokeDashoffset: circumference }}
            animate={{ strokeDashoffset }}
            transition={{ duration: 1.2, ease: [0.16, 1, 0.3, 1] }}
            filter={`url(#glow-${gradientId})`}
          />
        </svg>

        {/* Center Metric Text */}
        <div className="absolute inset-0 flex flex-col items-center justify-center text-center p-2">
          <span className="text-2xl sm:text-3xl font-black font-dot text-[#F8F4E9] tabular-nums tracking-tight">
            {safePercentage}%
          </span>
          {sublabel && (
            <span className="text-[10px] font-bold uppercase tracking-wider text-[rgba(248,244,233,0.55)] mt-0.5">
              {sublabel}
            </span>
          )}
        </div>
      </div>

      {label && (
        <span className="mt-3 text-xs font-bold uppercase tracking-wider text-[#F8F4E9] text-center">
          {label}
        </span>
      )}
    </div>
  );
};
