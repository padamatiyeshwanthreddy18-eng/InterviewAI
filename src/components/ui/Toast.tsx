import React from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { CheckCircle2, AlertCircle, Info, X } from 'lucide-react';

export interface ToastProps {
  message: string;
  type?: 'success' | 'error' | 'info';
  isOpen: boolean;
  onClose: () => void;
}

export const Toast: React.FC<ToastProps> = ({
  message,
  type = 'info',
  isOpen,
  onClose,
}) => {
  const icons = {
    success: <CheckCircle2 className="w-4 h-4 text-[#7FE3B9]" />,
    error: <AlertCircle className="w-4 h-4 text-[#E57373]" />,
    info: <Info className="w-4 h-4 text-[#F6DBC0]" />,
  };

  const borderColors = {
    success: 'border-[rgba(127,227,185,0.4)]',
    error: 'border-[rgba(229,115,115,0.4)]',
    info: 'border-[rgba(147,80,115,0.4)]',
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          initial={{ opacity: 0, y: 20, scale: 0.9 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          exit={{ opacity: 0, y: 20, scale: 0.9 }}
          transition={{ duration: 0.25 }}
          className={`fixed bottom-6 right-6 z-50 flex items-center gap-3 px-4 py-3 rounded-2xl bg-[rgba(42,27,51,0.95)] backdrop-blur-xl border ${borderColors[type]} shadow-[0_15px_35px_rgba(15,7,20,0.8),0_0_20px_rgba(147,80,115,0.3)] text-[#F8F4E9] text-xs font-semibold`}
        >
          {icons[type]}
          <span>{message}</span>
          <button
            onClick={onClose}
            className="p-1 hover:text-[#F6DBC0] rounded transition-colors ml-2"
          >
            <X className="w-3.5 h-3.5" />
          </button>
        </motion.div>
      )}
    </AnimatePresence>
  );
};
