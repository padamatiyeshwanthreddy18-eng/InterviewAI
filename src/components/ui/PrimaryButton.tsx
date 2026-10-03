import React from 'react';
import { motion, HTMLMotionProps } from 'motion/react';

export interface PrimaryButtonProps extends HTMLMotionProps<'button'> {
  children: React.ReactNode;
  icon?: React.ReactNode;
  size?: 'sm' | 'md' | 'lg';
  fullWidth?: boolean;
  shimmer?: boolean;
}

export const PrimaryButton: React.FC<PrimaryButtonProps> = ({
  children,
  icon,
  size = 'md',
  fullWidth = false,
  shimmer = true,
  className = '',
  ...props
}) => {
  const sizeClasses = {
    sm: 'px-3.5 py-1.5 text-xs',
    md: 'px-5 py-2.5 text-sm',
    lg: 'px-6 py-3.5 text-sm sm:text-base',
  };

  return (
    <motion.button
      whileHover={{ scale: 1.02 }}
      whileTap={{ scale: 0.97 }}
      transition={{ duration: 0.15 }}
      className={`relative inline-flex items-center justify-center gap-2.5 font-extrabold rounded-xl sm:rounded-2xl text-[#F8F4E9] overflow-hidden border border-[rgba(246,219,192,0.3)] shadow-[0_0_24px_rgba(147,80,115,0.4)] transition-all cursor-pointer ${
        sizeClasses[size]
      } ${fullWidth ? 'w-full' : ''} ${className}`}
      style={{
        background: 'linear-gradient(135deg, #502D55 0%, #935073 55%, #a65d83 100%)',
      }}
      {...props}
    >
      {/* Shimmer line on hover */}
      {shimmer && (
        <span
          className="absolute inset-0 w-full h-full pointer-events-none opacity-0 hover:opacity-100 transition-opacity duration-300 animate-shimmer"
        />
      )}

      {icon && <span className="shrink-0 text-[#F6DBC0]">{icon}</span>}
      <span className="relative z-10">{children}</span>
    </motion.button>
  );
};
