import React from 'react';
import { motion } from 'motion/react';
import { GlassCard } from './GlassCard';
import { ArrowUpRight, ArrowDownRight, ChevronRight } from 'lucide-react';

export interface StatCardProps {
  label: string;
  value: string | number;
  unit?: string;
  icon?: React.ReactNode;
  delta?: {
    value: string;
    isPositive?: boolean;
    period?: string;
  };
  actionLabel?: string;
  onAction?: () => void;
  className?: string;
}

export const StatCard: React.FC<StatCardProps> = ({
  label,
  value,
  unit,
  icon,
  delta,
  actionLabel,
  onAction,
  className = '',
}) => {
  return (
    <GlassCard className={`flex flex-col justify-between ${className}`}>
      {/* Top row: Icon chip top-left, optional action pill top-right */}
      <div className="flex items-center justify-between gap-3 mb-4">
        <div className="flex items-center gap-2.5">
          {icon && (
            <div className="w-9 h-9 rounded-xl bg-[rgba(80,45,85,0.45)] border border-[rgba(147,80,115,0.3)] flex items-center justify-center text-[#F6DBC0] shadow-sm">
              {icon}
            </div>
          )}
          <span className="text-[11px] font-bold uppercase tracking-wider text-[rgba(248,244,233,0.65)]">
            {label}
          </span>
        </div>

        {actionLabel && (
          <button
            onClick={onAction}
            className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[10px] font-bold text-[rgba(248,244,233,0.75)] bg-[rgba(248,244,233,0.06)] hover:bg-[rgba(147,80,115,0.3)] hover:text-[#F8F4E9] border border-[rgba(248,244,233,0.08)] transition-all"
          >
            <span>{actionLabel}</span>
            <ChevronRight className="w-3 h-3 text-[rgba(248,244,233,0.5)]" />
          </button>
        )}
      </div>

      {/* Middle row: Big number with dot-matrix display styling */}
      <div className="flex items-baseline gap-1.5 my-1">
        <span className="text-3xl sm:text-4xl font-extrabold font-dot text-[#F8F4E9] tracking-tight tabular-nums">
          {value}
        </span>
        {unit && (
          <span className="text-xs font-semibold text-[rgba(248,244,233,0.5)]">
            {unit}
          </span>
        )}
      </div>

      {/* Bottom row: Delta line with mauve/peach positive or muted rose negative */}
      {delta && (
        <div className="flex items-center gap-1.5 mt-3 pt-2.5 border-t border-[rgba(248,244,233,0.06)] text-[11px]">
          {delta.isPositive ? (
            <span className="inline-flex items-center font-bold text-[#F6DBC0]">
              <ArrowUpRight className="w-3.5 h-3.5 mr-0.5 text-[#F6DBC0]" />
              {delta.value}
            </span>
          ) : (
            <span className="inline-flex items-center font-bold text-[#E57373]">
              <ArrowDownRight className="w-3.5 h-3.5 mr-0.5 text-[#E57373]" />
              {delta.value}
            </span>
          )}
          <span className="text-[rgba(248,244,233,0.45)]">
            {delta.period || 'from previous week'}
          </span>
        </div>
      )}
    </GlassCard>
  );
};
