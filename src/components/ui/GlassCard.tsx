import React from 'react';
import { motion, HTMLMotionProps } from 'motion/react';

export interface GlassCardProps extends HTMLMotionProps<'div'> {
  children: React.ReactNode;
  className?: string;
  hoverLift?: boolean;
  glow?: boolean;
  active?: boolean;
}

export const GlassCard: React.FC<GlassCardProps> = ({
  children,
  className = '',
  hoverLift = true,
  glow = false,
  active = false,
  ...props
}) => {
  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.35, ease: [0.16, 1, 0.3, 1] }}
      whileHover={
        hoverLift
          ? {
              y: -3,
              borderColor: 'rgba(147, 80, 115, 0.42)',
              boxShadow: '0 20px 40px -12px rgba(15, 7, 20, 0.75), 0 0 24px rgba(147, 80, 115, 0.25)',
              transition: { duration: 0.2 },
            }
          : undefined
      }
      className={`rounded-2xl sm:rounded-3xl p-5 sm:p-6 backdrop-blur-xl transition-colors relative overflow-hidden ${
        glow
          ? 'shadow-[0_0_30px_rgba(147,80,115,0.3)] border-[rgba(147,80,115,0.4)]'
          : 'border-[rgba(248,244,233,0.08)]'
      } ${
        active
          ? 'bg-[rgba(54,34,66,0.85)] border-[rgba(246,219,192,0.3)]'
          : 'bg-[rgba(42,27,51,0.72)]'
      } border shadow-[0_16px_36px_-12px_rgba(15,7,20,0.6)] ${className}`}
      {...props}
    >
      {children}
    </motion.div>
  );
};
