import React from 'react';

export interface BadgeProps {
  children: React.ReactNode;
  variant?: 'plum' | 'mauve' | 'peach' | 'mint' | 'rose' | 'neutral';
  size?: 'sm' | 'md';
  glow?: boolean;
  className?: string;
  icon?: React.ReactNode;
}

export const Badge: React.FC<BadgeProps> = ({
  children,
  variant = 'mauve',
  size = 'md',
  glow = false,
  className = '',
  icon,
}) => {
  const variantStyles = {
    plum: 'bg-[rgba(80,45,85,0.4)] text-[#F8F4E9] border-[rgba(147,80,115,0.3)]',
    mauve: 'bg-[rgba(147,80,115,0.25)] text-[#F6DBC0] border-[rgba(147,80,115,0.4)]',
    peach: 'bg-[rgba(246,219,192,0.12)] text-[#F6DBC0] border-[rgba(246,219,192,0.3)]',
    mint: 'bg-[rgba(127,227,185,0.12)] text-[#7FE3B9] border-[rgba(127,227,185,0.3)]',
    rose: 'bg-[rgba(229,115,115,0.12)] text-[#E57373] border-[rgba(229,115,115,0.3)]',
    neutral: 'bg-[rgba(248,244,233,0.06)] text-[rgba(248,244,233,0.75)] border-[rgba(248,244,233,0.09)]',
  };

  const sizeStyles = {
    sm: 'text-[10px] px-2 py-0.5',
    md: 'text-xs px-2.5 py-1',
  };

  return (
    <span
      className={`inline-flex items-center gap-1.5 font-bold uppercase tracking-wider rounded-full border transition-all ${
        variantStyles[variant]
      } ${sizeStyles[size]} ${glow ? 'shadow-[0_0_12px_rgba(147,80,115,0.4)]' : ''} ${className}`}
    >
      {icon && <span className="shrink-0">{icon}</span>}
      <span>{children}</span>
    </span>
  );
};
