import React from 'react';
import { motion, HTMLMotionProps } from 'motion/react';

export interface PillButtonProps extends HTMLMotionProps<'button'> {
  children: React.ReactNode;
  active?: boolean;
  size?: 'sm' | 'md' | 'lg';
  icon?: React.ReactNode;
  variant?: 'default' | 'glow' | 'danger';
}

export const PillButton: React.FC<PillButtonProps> = ({
  children,
  active = false,
  size = 'md',
  icon,
  variant = 'default',
  className = '',
  ...props
}) => {
  const sizeClasses = {
    sm: 'px-3 py-1.5 text-xs',
    md: 'px-4 py-2 text-xs sm:text-sm',
    lg: 'px-5 py-2.5 text-sm sm:text-base',
  };

  const getVariantClasses = () => {
    if (active) {
      return 'bg-[#935073] text-[#F8F4E9] border-[rgba(246,219,192,0.4)] shadow-[0_0_18px_rgba(147,80,115,0.45)]';
    }
    if (variant === 'glow') {
      return 'bg-[rgba(54,34,66,0.7)] text-[#F6DBC0] border-[rgba(147,80,115,0.35)] hover:border-[rgba(246,219,192,0.4)] hover:bg-[rgba(80,45,85,0.7)]';
    }
    if (variant === 'danger') {
      return 'bg-[rgba(229,115,115,0.15)] text-[#E57373] border-[rgba(229,115,115,0.3)] hover:bg-[rgba(229,115,115,0.25)]';
    }
    return 'bg-[rgba(248,244,233,0.06)] text-[rgba(248,244,233,0.75)] border-[rgba(248,244,233,0.09)] hover:text-[#F8F4E9] hover:bg-[rgba(147,80,115,0.2)] hover:border-[rgba(147,80,115,0.3)]';
  };

  return (
    <motion.button
      whileTap={{ scale: 0.97 }}
      transition={{ duration: 0.1 }}
      className={`inline-flex items-center justify-center gap-2 rounded-full font-bold border transition-colors cursor-pointer select-none ${
        sizeClasses[size]
      } ${getVariantClasses()} ${className}`}
      {...props}
    >
      {icon && <span className="shrink-0">{icon}</span>}
      <span>{children}</span>
    </motion.button>
  );
};
