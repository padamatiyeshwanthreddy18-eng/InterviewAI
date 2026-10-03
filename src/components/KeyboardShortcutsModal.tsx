import React from 'react';
import { X, Keyboard, Mic, Send, Volume2, Settings2, HelpCircle, Camera } from 'lucide-react';

interface KeyboardShortcutsModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const KeyboardShortcutsModal: React.FC<KeyboardShortcutsModalProps> = ({ isOpen, onClose }) => {
  if (!isOpen) return null;

  const shortcuts = [
    {
      key: 'Space',
      action: 'Start / Stop Mic Recording',
      description: 'Quickly toggle voice answer recording (when not typing in text box)',
      icon: <Mic className="w-4 h-4 text-[#F6DBC0]" />,
    },
    {
      key: 'Ctrl + Enter',
      action: 'Submit Answer',
      description: 'Submit your spoken or written response for immediate AI grading',
      icon: <Send className="w-4 h-4 text-[#935073]" />,
    },
    {
      key: 'Alt + C',
      action: 'Toggle Camera Video (On / Off)',
      description: 'Turn your live webcam video stream on or off',
      icon: <Camera className="w-4 h-4 text-[#7FE3B9]" />,
    },
    {
      key: 'Alt + S',
      action: 'Read Aloud / Replay Question',
      description: 'Trigger AI interviewer text-to-speech reader',
      icon: <Volume2 className="w-4 h-4 text-[#F6DBC0]" />,
    },
    {
      key: 'Alt + V',
      action: 'Voice Persona Settings',
      description: 'Open AI Voice Profile selector, speed, and pitch controls',
      icon: <Settings2 className="w-4 h-4 text-[#935073]" />,
    },
    {
      key: 'Shift + ?',
      action: 'Toggle Keyboard Legend',
      description: 'Show or hide this power user keyboard shortcuts cheat sheet',
      icon: <HelpCircle className="w-4 h-4 text-[#7FE3B9]" />,
    },
  ];

  return (
    <div className="fixed inset-0 z-50 bg-[#1A0F22]/80 backdrop-blur-md flex items-center justify-center p-4 overflow-y-auto">
      <div className="bg-[rgba(42,27,51,0.92)] border border-[rgba(248,244,233,0.12)] rounded-3xl max-w-md w-full p-6 space-y-6 shadow-2xl relative text-[#F8F4E9]">
        {/* Close Button */}
        <button
          onClick={onClose}
          className="absolute top-5 right-5 p-2 rounded-full text-[rgba(248,244,233,0.5)] hover:text-[#F8F4E9] hover:bg-[rgba(147,80,115,0.2)] transition cursor-pointer"
        >
          <X className="w-5 h-5" />
        </button>

        {/* Modal Header */}
        <div className="space-y-1">
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-[rgba(147,80,115,0.3)] text-[#F6DBC0] text-xs font-bold border border-[rgba(246,219,192,0.3)]">
            <Keyboard className="w-3.5 h-3.5 text-[#F6DBC0]" />
            Power User Workflow
          </div>
          <h2 className="text-xl font-black text-[#F8F4E9]">Global Keyboard Shortcuts</h2>
          <p className="text-xs text-[rgba(248,244,233,0.65)]">
            Control your mock interview hands-free without leaving your keyboard.
          </p>
        </div>

        {/* Shortcuts List */}
        <div className="space-y-2.5">
          {shortcuts.map((s, i) => (
            <div
              key={i}
              className="bg-[rgba(26,15,34,0.6)] border border-[rgba(248,244,233,0.08)] p-3 rounded-2xl flex items-center justify-between gap-3"
            >
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 rounded-xl bg-[rgba(80,45,85,0.5)] border border-[rgba(246,219,192,0.2)] flex items-center justify-center shrink-0">
                  {s.icon}
                </div>
                <div>
                  <h4 className="text-xs font-bold text-[#F8F4E9]">{s.action}</h4>
                  <p className="text-[10px] text-[rgba(248,244,233,0.5)] font-medium">{s.description}</p>
                </div>
              </div>

              <kbd className="px-2.5 py-1.5 rounded-lg bg-[rgba(80,45,85,0.4)] border border-[rgba(246,219,192,0.2)] text-[#F6DBC0] text-[11px] font-mono font-bold whitespace-nowrap shadow-xs">
                {s.key}
              </kbd>
            </div>
          ))}
        </div>

        {/* Dismiss Button */}
        <button
          onClick={onClose}
          className="w-full py-3 bg-gradient-to-r from-[#502D55] to-[#935073] hover:from-[#603766] hover:to-[#ba6d95] border border-[rgba(246,219,192,0.3)] text-[#F8F4E9] font-extrabold rounded-xl transition text-xs cursor-pointer shadow-[0_0_16px_rgba(147,80,115,0.3)]"
        >
          Got it
        </button>
      </div>
    </div>
  );
};
