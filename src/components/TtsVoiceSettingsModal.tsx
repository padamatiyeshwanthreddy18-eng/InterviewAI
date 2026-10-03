import React, { useState, useEffect } from 'react';
import { X, Volume2, Settings2, Sparkles, Check, Play, UserCheck, Mic } from 'lucide-react';

export interface VoiceProfile {
  id: string;
  name: string;
  persona: string;
  role: string;
  pitch: number;
  rate: number;
  genderPref: 'female' | 'male' | 'neutral';
  avatarColor: string;
}

export const VOICE_PROFILES: VoiceProfile[] = [
  {
    id: 'rachel',
    name: 'Rachel',
    persona: 'Warm Tech Recruiter',
    role: 'Senior Recruiter at Google',
    pitch: 1.1,
    rate: 1.0,
    genderPref: 'female',
    avatarColor: 'bg-[#935073]',
  },
  {
    id: 'marcus',
    name: 'Marcus',
    persona: 'Lead Systems Architect',
    role: 'Principal Staff Engineer at AWS',
    pitch: 0.9,
    rate: 0.95,
    genderPref: 'male',
    avatarColor: 'bg-[#502D55]',
  },
  {
    id: 'sophia',
    name: 'Sophia',
    persona: 'VP of Engineering',
    role: 'Engineering Director at Stripe',
    pitch: 1.05,
    rate: 1.05,
    genderPref: 'female',
    avatarColor: 'bg-[#7a3b63]',
  },
  {
    id: 'david',
    name: 'David',
    persona: 'Behavioral Lead',
    role: 'HR Lead at Meta',
    pitch: 0.95,
    rate: 1.0,
    genderPref: 'male',
    avatarColor: 'bg-[#6a355e]',
  },
  {
    id: 'elena',
    name: 'Elena',
    persona: 'Crisp & Formal',
    role: 'Technical Lead at Microsoft',
    pitch: 1.0,
    rate: 0.9,
    genderPref: 'female',
    avatarColor: 'bg-[#a35e83]',
  },
];

interface TtsVoiceSettingsModalProps {
  isOpen: boolean;
  onClose: () => void;
  selectedProfileId: string;
  onSelectProfile: (profile: VoiceProfile) => void;
  pitch: number;
  setPitch: (val: number) => void;
  rate: number;
  setRate: (val: number) => void;
  autoRead: boolean;
  setAutoRead: (val: boolean) => void;
}

export const TtsVoiceSettingsModal: React.FC<TtsVoiceSettingsModalProps> = ({
  isOpen,
  onClose,
  selectedProfileId,
  onSelectProfile,
  pitch,
  setPitch,
  rate,
  setRate,
  autoRead,
  setAutoRead,
}) => {
  const [availableVoices, setAvailableVoices] = useState<SpeechSynthesisVoice[]>([]);
  const [selectedVoiceName, setSelectedVoiceName] = useState<string>('');
  const [isPlayingTest, setIsPlayingTest] = useState(false);

  useEffect(() => {
    if ('speechSynthesis' in window) {
      const loadVoices = () => {
        const voices = window.speechSynthesis.getVoices();
        setAvailableVoices(voices);
        if (voices.length > 0 && !selectedVoiceName) {
          const englishVoice = voices.find((v) => v.lang.startsWith('en')) || voices[0];
          setSelectedVoiceName(englishVoice.name);
        }
      };

      loadVoices();
      window.speechSynthesis.onvoiceschanged = loadVoices;
    }
  }, [selectedVoiceName]);

  useEffect(() => {
    return () => {
      if ('speechSynthesis' in window) {
        window.speechSynthesis.cancel();
      }
    };
  }, []);

  const handleClose = () => {
    if ('speechSynthesis' in window) {
      window.speechSynthesis.cancel();
    }
    setIsPlayingTest(false);
    onClose();
  };

  if (!isOpen) return null;

  const currentProfile = VOICE_PROFILES.find((p) => p.id === selectedProfileId) || VOICE_PROFILES[0];

  const testVoiceSample = (profileToTest: VoiceProfile) => {
    if (!('speechSynthesis' in window)) return;
    window.speechSynthesis.cancel();

    const sampleText = `Hello! I'm ${profileToTest.name}, your interviewer today. Let's begin with your technical approach.`;
    const utterance = new SpeechSynthesisUtterance(sampleText);

    utterance.pitch = profileToTest.pitch;
    utterance.rate = profileToTest.rate;

    if (availableVoices.length > 0) {
      const matchedVoice = availableVoices.find(
        (v) =>
          v.name.toLowerCase().includes(profileToTest.name.toLowerCase()) ||
          (profileToTest.genderPref === 'female' && (v.name.includes('Female') || v.name.includes('Zira') || v.name.includes('Samantha') || v.name.includes('Google US English'))) ||
          (profileToTest.genderPref === 'male' && (v.name.includes('Male') || v.name.includes('David') || v.name.includes('Alex')))
      );
      if (matchedVoice) utterance.voice = matchedVoice;
      else if (selectedVoiceName) {
        const customV = availableVoices.find((v) => v.name === selectedVoiceName);
        if (customV) utterance.voice = customV;
      }
    }

    utterance.onstart = () => setIsPlayingTest(true);
    utterance.onend = () => setIsPlayingTest(false);
    utterance.onerror = () => setIsPlayingTest(false);

    window.speechSynthesis.speak(utterance);
  };

  return (
    <div className="fixed inset-0 z-50 bg-[#1A0F22]/80 backdrop-blur-md flex items-center justify-center p-4 overflow-y-auto">
      <div className="bg-[rgba(42,27,51,0.92)] border border-[rgba(248,244,233,0.12)] rounded-3xl max-w-lg w-full p-6 space-y-6 shadow-2xl relative text-[#F8F4E9]">
        {/* Close Button */}
        <button
          onClick={handleClose}
          className="absolute top-5 right-5 p-2 rounded-full text-[rgba(248,244,233,0.5)] hover:text-[#F8F4E9] hover:bg-[rgba(147,80,115,0.2)] transition cursor-pointer"
        >
          <X className="w-5 h-5" />
        </button>

        {/* Modal Header */}
        <div className="space-y-1">
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-[rgba(147,80,115,0.3)] text-[#F6DBC0] text-xs font-bold border border-[rgba(246,219,192,0.3)]">
            <Settings2 className="w-3.5 h-3.5 text-[#F6DBC0]" />
            AI Interviewer Voice Persona
          </div>
          <h2 className="text-xl font-black text-[#F8F4E9]">Voice & TTS Settings</h2>
          <p className="text-xs text-[rgba(248,244,233,0.65)]">
            Select an AI interviewer voice profile to simulate realistic mock sessions.
          </p>
        </div>

        {/* Voice Profile Selector Grid */}
        <div className="space-y-2">
          <label className="block text-xs font-bold text-[#F8F4E9] uppercase tracking-wider">
            1. Select AI Interviewer Persona
          </label>

          <div className="grid grid-cols-1 gap-2.5 max-h-56 overflow-y-auto pr-1">
            {VOICE_PROFILES.map((p) => {
              const isSelected = p.id === selectedProfileId;
              return (
                <div
                  key={p.id}
                  onClick={() => {
                    onSelectProfile(p);
                    setPitch(p.pitch);
                    setRate(p.rate);
                  }}
                  className={`p-3.5 rounded-2xl border cursor-pointer transition flex items-center justify-between ${
                    isSelected
                      ? 'bg-[rgba(147,80,115,0.35)] border-[#935073] shadow-[0_0_16px_rgba(147,80,115,0.3)] ring-1 ring-[#935073]/50'
                      : 'bg-[rgba(26,15,34,0.6)] border-[rgba(248,244,233,0.08)] hover:border-[rgba(147,80,115,0.4)]'
                  }`}
                >
                  <div className="flex items-center gap-3">
                    <div
                      className={`w-9 h-9 rounded-xl ${p.avatarColor} border border-[rgba(246,219,192,0.2)] flex items-center justify-center text-[#F8F4E9] font-black text-xs shadow-sm`}
                    >
                      {p.name[0]}
                    </div>
                    <div>
                      <h4 className="text-xs font-black text-[#F8F4E9] flex items-center gap-2">
                        {p.name}
                        <span className="text-[10px] font-semibold text-[#F6DBC0] bg-[rgba(80,45,85,0.5)] border border-[rgba(246,219,192,0.2)] px-2 py-0.5 rounded-full">
                          {p.persona}
                        </span>
                      </h4>
                      <p className="text-[11px] text-[rgba(248,244,233,0.6)] font-medium">{p.role}</p>
                    </div>
                  </div>

                  <div className="flex items-center gap-2">
                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        testVoiceSample(p);
                      }}
                      className="p-2 rounded-xl bg-[rgba(80,45,85,0.5)] hover:bg-[rgba(147,80,115,0.5)] border border-[rgba(246,219,192,0.2)] text-[#F6DBC0] hover:text-[#F8F4E9] transition text-xs flex items-center gap-1 font-bold cursor-pointer"
                      title="Test Audio Sample"
                    >
                      <Play className="w-3.5 h-3.5 fill-current text-[#F6DBC0]" />
                      <span className="hidden sm:inline">Test</span>
                    </button>

                    {isSelected && (
                      <div className="w-6 h-6 rounded-full bg-[#935073] text-[#F8F4E9] border border-[rgba(246,219,192,0.3)] flex items-center justify-center shadow-xs">
                        <Check className="w-3.5 h-3.5 stroke-[3]" />
                      </div>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Pitch & Speech Rate Controls */}
        <div className="bg-[rgba(26,15,34,0.6)] border border-[rgba(248,244,233,0.08)] rounded-2xl p-4 space-y-3">
          <label className="block text-xs font-bold text-[#F8F4E9] uppercase tracking-wider">
            2. Audio Fine-Tuning
          </label>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <div className="flex items-center justify-between text-xs font-medium text-[rgba(248,244,233,0.7)] mb-1">
                <span>Speech Speed:</span>
                <span className="font-bold text-[#F6DBC0]">{rate}x</span>
              </div>
              <input
                type="range"
                min="0.7"
                max="1.4"
                step="0.05"
                value={rate}
                onChange={(e) => setRate(parseFloat(e.target.value))}
                className="w-full accent-[#935073] cursor-pointer h-1.5 bg-[rgba(80,45,85,0.6)] rounded-lg"
              />
            </div>

            <div>
              <div className="flex items-center justify-between text-xs font-medium text-[rgba(248,244,233,0.7)] mb-1">
                <span>Voice Pitch:</span>
                <span className="font-bold text-[#F6DBC0]">{pitch}</span>
              </div>
              <input
                type="range"
                min="0.7"
                max="1.3"
                step="0.05"
                value={pitch}
                onChange={(e) => setPitch(parseFloat(e.target.value))}
                className="w-full accent-[#935073] cursor-pointer h-1.5 bg-[rgba(80,45,85,0.6)] rounded-lg"
              />
            </div>
          </div>

          {/* Auto Read Toggle */}
          <div className="pt-2 flex items-center justify-between border-t border-[rgba(248,244,233,0.08)]">
            <span className="text-xs font-bold text-[#F8F4E9]">Auto-Read Questions Aloud</span>
            <button
              type="button"
              onClick={() => setAutoRead(!autoRead)}
              className={`w-11 h-6 rounded-full transition-colors p-1 flex items-center cursor-pointer ${
                autoRead ? 'bg-[#935073] justify-end border border-[rgba(246,219,192,0.3)]' : 'bg-[rgba(80,45,85,0.6)] justify-start border border-[rgba(248,244,233,0.1)]'
              }`}
            >
              <div className="w-4 h-4 rounded-full bg-[#F8F4E9] shadow-sm" />
            </button>
          </div>
        </div>

        {/* Save & Done */}
        <button
          onClick={onClose}
          className="w-full py-3 bg-gradient-to-r from-[#502D55] to-[#935073] hover:from-[#603766] hover:to-[#ba6d95] border border-[rgba(246,219,192,0.3)] text-[#F8F4E9] font-extrabold rounded-xl shadow-[0_0_20px_rgba(147,80,115,0.4)] transition text-xs cursor-pointer hover:scale-[1.01]"
        >
          Save Voice Settings
        </button>
      </div>
    </div>
  );
};
