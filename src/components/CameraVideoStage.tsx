import React, { useState, useEffect, useRef } from 'react';
import {
  Camera,
  CameraOff,
  Video,
  VideoOff,
  Mic,
  MicOff,
  Sparkles,
  FlipHorizontal,
  LayoutGrid,
  Maximize2,
  Minimize2,
  Bot,
  User as UserIcon,
  ShieldCheck,
  Eye,
  Smile,
  Volume2,
  Sliders,
  Settings,
  Radio,
} from 'lucide-react';
import { VoiceProfile } from './TtsVoiceSettingsModal';

interface CameraVideoStageProps {
  isRecording: boolean;
  isSpeaking: boolean;
  selectedVoiceProfile: VoiceProfile;
  trackName: string;
  difficulty: string;
  companyPreset?: string;
  candidateName?: string;
  onToggleMicRecording?: () => void;
  onOpenDeviceSettings?: () => void;
}

export type ViewLayoutMode = 'dual-grid' | 'candidate-focus' | 'pip' | 'compact';

export const CameraVideoStage: React.FC<CameraVideoStageProps> = ({
  isRecording,
  isSpeaking,
  selectedVoiceProfile,
  trackName,
  difficulty,
  companyPreset,
  candidateName = 'Candidate',
  onToggleMicRecording,
  onOpenDeviceSettings,
}) => {
  const [isCameraOn, setIsCameraOn] = useState<boolean>(() => {
    return localStorage.getItem('interview_camera_enabled') !== 'false';
  });
  const [isMicMuted, setIsMicMuted] = useState<boolean>(false);
  const [isMirrored, setIsMirrored] = useState<boolean>(true);
  const [filterMode, setFilterMode] = useState<'normal' | 'studio' | 'soft'>('normal');
  const [layoutMode, setLayoutMode] = useState<ViewLayoutMode>('dual-grid');
  const [hasCameraPermission, setHasCameraPermission] = useState<boolean | null>(null);
  const [cameraError, setCameraError] = useState<string | null>(null);
  const [videoDevices, setVideoDevices] = useState<MediaDeviceInfo[]>([]);

  // Video and audio stream refs
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const videoStreamRef = useRef<MediaStream | null>(null);

  // Audio level meter
  const [micAudioLevel, setMicAudioLevel] = useState<number>(0);
  const [isUserSpeaking, setIsUserSpeaking] = useState<boolean>(false);
  const micStreamRef = useRef<MediaStream | null>(null);
  const audioCtxRef = useRef<AudioContext | null>(null);
  const animFrameRef = useRef<number | null>(null);

  // Setup webcam stream
  useEffect(() => {
    let isSubscribed = true;

    const setupCamera = async () => {
      if (!isCameraOn) {
        if (videoStreamRef.current) {
          videoStreamRef.current.getTracks().forEach((track) => track.stop());
          videoStreamRef.current = null;
        }
        if (videoRef.current) {
          videoRef.current.srcObject = null;
        }
        return;
      }

      setCameraError(null);
      try {
        const preferredDeviceId = localStorage.getItem('preferred_camera_device_id') || undefined;

        const constraints: MediaStreamConstraints = {
          video: preferredDeviceId
            ? { deviceId: { exact: preferredDeviceId }, width: { ideal: 1280 }, height: { ideal: 720 } }
            : { width: { ideal: 1280 }, height: { ideal: 720 }, facingMode: 'user' },
          audio: false,
        };

        const stream = await navigator.mediaDevices.getUserMedia(constraints);

        if (!isSubscribed) {
          stream.getTracks().forEach((t) => t.stop());
          return;
        }

        videoStreamRef.current = stream;
        setHasCameraPermission(true);

        if (videoRef.current) {
          videoRef.current.srcObject = stream;
        }

        // Enumerate video devices
        const devices = await navigator.mediaDevices.enumerateDevices();
        const cams = devices.filter((d) => d.kind === 'videoinput');
        setVideoDevices(cams);
      } catch (err: any) {
        console.warn('Camera stream error:', err);
        setHasCameraPermission(false);
        setCameraError(
          err.name === 'NotAllowedError'
            ? 'Camera permission denied. Click the lock icon in your address bar to allow camera access.'
            : 'Webcam not found or currently in use by another app.'
        );
      }
    };

    setupCamera();

    return () => {
      isSubscribed = false;
      if (videoStreamRef.current) {
        videoStreamRef.current.getTracks().forEach((t) => t.stop());
        videoStreamRef.current = null;
      }
    };
  }, [isCameraOn]);

  // Audio level meter for candidate mic
  useEffect(() => {
    let isSubscribed = true;

    const setupMicMeter = async () => {
      if (isMicMuted) {
        setMicAudioLevel(0);
        setIsUserSpeaking(false);
        return;
      }

      try {
        const preferredMicId = localStorage.getItem('preferred_mic_device_id') || undefined;
        const micStream = await navigator.mediaDevices.getUserMedia({
          audio: preferredMicId ? { deviceId: { exact: preferredMicId } } : true,
          video: false,
        });

        if (!isSubscribed) {
          micStream.getTracks().forEach((t) => t.stop());
          return;
        }

        micStreamRef.current = micStream;

        const AudioCtx = window.AudioContext || (window as any).webkitAudioContext;
        const audioCtx = new AudioCtx();
        const analyser = audioCtx.createAnalyser();
        analyser.fftSize = 64;

        const source = audioCtx.createMediaStreamSource(micStream);
        source.connect(analyser);

        audioCtxRef.current = audioCtx;

        const dataArray = new Uint8Array(analyser.frequencyBinCount);

        const updateMeter = () => {
          if (!isSubscribed) return;
          analyser.getByteFrequencyData(dataArray);
          let sum = 0;
          for (let i = 0; i < dataArray.length; i++) {
            sum += dataArray[i];
          }
          const average = sum / dataArray.length;
          const level = Math.min(100, Math.round((average / 128) * 100));
          setMicAudioLevel(level);
          setIsUserSpeaking(level > 12);
          animFrameRef.current = requestAnimationFrame(updateMeter);
        };

        updateMeter();
      } catch (err) {
        console.warn('Could not initialize microphone meter:', err);
      }
    };

    setupMicMeter();

    return () => {
      isSubscribed = false;
      if (animFrameRef.current) cancelAnimationFrame(animFrameRef.current);
      if (micStreamRef.current) {
        micStreamRef.current.getTracks().forEach((t) => t.stop());
        micStreamRef.current = null;
      }
      if (audioCtxRef.current) {
        audioCtxRef.current.close();
        audioCtxRef.current = null;
      }
    };
  }, [isMicMuted]);

  const toggleCamera = () => {
    setIsCameraOn((prev) => {
      const next = !prev;
      localStorage.setItem('interview_camera_enabled', String(next));
      return next;
    });
  };

  const toggleMicMute = () => {
    setIsMicMuted((prev) => !prev);
  };

  const cycleFilter = () => {
    setFilterMode((prev) => (prev === 'normal' ? 'studio' : prev === 'studio' ? 'soft' : 'normal'));
  };

  const getFilterStyle = () => {
    switch (filterMode) {
      case 'studio':
        return 'contrast-105 brightness-105 saturate-110 shadow-[#935073]/20';
      case 'soft':
        return 'blur-[0.3px] brightness-105 contrast-95';
      default:
        return '';
    }
  };

  if (layoutMode === 'compact') {
    return (
      <div className="bg-[rgba(42,27,51,0.72)] backdrop-blur-xl border border-[rgba(248,244,233,0.08)] rounded-3xl p-4 shadow-xs flex items-center justify-between gap-4 transition-all text-[#F8F4E9]">
        <div className="flex items-center gap-3">
          <div className="relative">
            <div className="w-10 h-10 rounded-2xl bg-gradient-to-tr from-[#502D55] to-[#935073] border border-[rgba(246,219,192,0.3)] text-[#F8F4E9] flex items-center justify-center font-black shadow-[0_0_15px_rgba(147,80,115,0.4)]">
              <Bot className="w-5 h-5 text-[#F8F4E9]" />
            </div>
            {isSpeaking && (
              <span className="absolute -top-1 -right-1 flex h-3 w-3">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-[#7FE3B9] opacity-75" />
                <span className="relative inline-flex rounded-full h-3 w-3 bg-[#7FE3B9]" />
              </span>
            )}
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="text-xs font-black text-[#F8F4E9]">{selectedVoiceProfile.name} (AI Coach)</span>
              <span className="text-[10px] bg-[rgba(147,80,115,0.3)] text-[#F6DBC0] px-2 py-0.5 rounded-full border border-[rgba(246,219,192,0.3)] font-bold">
                {isSpeaking ? 'Speaking' : isRecording ? 'Recording Voice' : isUserSpeaking ? 'Speaking' : 'Listening'}
              </span>
            </div>
            <p className="text-[11px] text-[rgba(248,244,233,0.6)] font-medium">
              Live Voice Interviewer • {trackName}
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          {/* Mic Mute / Audio level indicator */}
          <button
            onClick={toggleMicMute}
            className={`p-2 rounded-xl text-xs font-bold transition flex items-center gap-1.5 cursor-pointer ${
              isMicMuted
                ? 'bg-[rgba(229,115,115,0.15)] text-[#E57373] border border-[rgba(229,115,115,0.3)]'
                : 'bg-[rgba(127,227,185,0.15)] text-[#7FE3B9] border border-[rgba(127,227,185,0.3)]'
            }`}
            title="Mute/Unmute Mic"
          >
            {isMicMuted ? <MicOff className="w-4 h-4 text-[#E57373]" /> : <Mic className="w-4 h-4 text-[#7FE3B9]" />}
            <span className="hidden sm:inline">{isMicMuted ? 'Muted' : 'Mic Active'}</span>
          </button>

          <button
            onClick={toggleCamera}
            className={`p-2 rounded-xl text-xs font-bold transition flex items-center gap-1.5 cursor-pointer ${
              isCameraOn
                ? 'bg-[rgba(127,227,185,0.15)] text-[#7FE3B9] border border-[rgba(127,227,185,0.3)]'
                : 'bg-[rgba(26,15,34,0.6)] border border-[rgba(248,244,233,0.1)] text-[rgba(248,244,233,0.6)]'
            }`}
          >
            {isCameraOn ? <Camera className="w-4 h-4 text-[#7FE3B9]" /> : <CameraOff className="w-4 h-4 text-[rgba(248,244,233,0.4)]" />}
            <span className="hidden sm:inline">{isCameraOn ? 'Camera On' : 'Camera Off'}</span>
          </button>

          <button
            onClick={() => setLayoutMode('dual-grid')}
            className="p-2 rounded-xl bg-[rgba(80,45,85,0.5)] border border-[rgba(246,219,192,0.2)] text-[#F6DBC0] hover:text-[#F8F4E9] transition cursor-pointer"
            title="Expand Full Video Stage"
          >
            <Maximize2 className="w-4 h-4" />
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-3 text-[#F8F4E9]">
      {/* Top Stage Bar: Layout & Status */}
      <div className="flex items-center justify-between px-1">
        <div className="flex items-center gap-2">
          <div className="flex items-center gap-1.5 text-xs font-extrabold text-[#F8F4E9]">
            <Video className="w-4 h-4 text-[#F6DBC0]" />
            <span>AI Mock Interview Live Stage</span>
          </div>
          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-[rgba(127,227,185,0.15)] text-[#7FE3B9] border border-[rgba(127,227,185,0.3)] text-[10px] font-extrabold">
            <span className="w-1.5 h-1.5 rounded-full bg-[#7FE3B9] animate-ping" />
            PROCTORING & MIC ACTIVE
          </span>
        </div>

        {/* Layout Mode Toggles */}
        <div className="flex items-center gap-1 bg-[rgba(26,15,34,0.6)] border border-[rgba(248,244,233,0.08)] p-1 rounded-xl text-xs">
          <button
            type="button"
            onClick={() => setLayoutMode('dual-grid')}
            className={`px-2.5 py-1 rounded-lg font-bold transition flex items-center gap-1 text-[11px] cursor-pointer ${
              layoutMode === 'dual-grid'
                ? 'bg-[#935073] text-[#F8F4E9] shadow-[0_0_12px_rgba(147,80,115,0.4)] border border-[rgba(246,219,192,0.3)]'
                : 'text-[rgba(248,244,233,0.6)] hover:text-[#F8F4E9]'
            }`}
            title="Split Stage: AI Coach + Candidate side-by-side"
          >
            <LayoutGrid className="w-3.5 h-3.5 text-[#F6DBC0]" />
            <span className="hidden sm:inline">Dual Grid</span>
          </button>

          <button
            type="button"
            onClick={() => setLayoutMode('candidate-focus')}
            className={`px-2.5 py-1 rounded-lg font-bold transition flex items-center gap-1 text-[11px] cursor-pointer ${
              layoutMode === 'candidate-focus'
                ? 'bg-[#935073] text-[#F8F4E9] shadow-[0_0_12px_rgba(147,80,115,0.4)] border border-[rgba(246,219,192,0.3)]'
                : 'text-[rgba(248,244,233,0.6)] hover:text-[#F8F4E9]'
            }`}
            title="Focus on Candidate Webcam"
          >
            <UserIcon className="w-3.5 h-3.5 text-[#F6DBC0]" />
            <span className="hidden sm:inline">Speaker Focus</span>
          </button>

          <button
            type="button"
            onClick={() => setLayoutMode('compact')}
            className="p-1.5 rounded-lg font-bold text-[rgba(248,244,233,0.6)] hover:text-[#F8F4E9] transition cursor-pointer"
            title="Minimize to Compact Bar"
          >
            <Minimize2 className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>

      {/* Main Video Stage Grid */}
      <div
        className={`grid gap-4 transition-all duration-300 ${
          layoutMode === 'dual-grid'
            ? 'grid-cols-1 md:grid-cols-2'
            : 'grid-cols-1'
        }`}
      >
        {/* ======================================================== */}
        {/* TILE 1: AI Mock Interviewer Persona Tile */}
        {/* ======================================================== */}
        <div className="relative rounded-3xl overflow-hidden bg-gradient-to-br from-[#1A0F22] via-[#2A1B33] to-[#502D55] border border-[rgba(248,244,233,0.1)] p-6 flex flex-col justify-between min-h-[260px] sm:min-h-[290px] shadow-lg text-[#F8F4E9]">
          {/* Top Badges */}
          <div className="flex items-center justify-between z-10">
            <div className="flex items-center gap-2">
              <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-[rgba(147,80,115,0.3)] border border-[rgba(246,219,192,0.3)] text-[#F6DBC0] text-xs font-extrabold backdrop-blur-md">
                <Bot className="w-3.5 h-3.5 text-[#F6DBC0]" />
                AI Interviewer • {selectedVoiceProfile.name}
              </span>
            </div>

            <span
              className={`inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[10px] font-extrabold tracking-wider uppercase border backdrop-blur-md ${
                isSpeaking
                  ? 'bg-[rgba(127,227,185,0.15)] text-[#7FE3B9] border-[rgba(127,227,185,0.3)] animate-pulse'
                  : isRecording
                  ? 'bg-[rgba(246,219,192,0.15)] text-[#F6DBC0] border-[rgba(246,219,192,0.3)]'
                  : 'bg-[rgba(26,15,34,0.6)] text-[rgba(248,244,233,0.6)] border-[rgba(248,244,233,0.1)]'
              }`}
            >
              <span
                className={`w-1.5 h-1.5 rounded-full ${
                  isSpeaking ? 'bg-[#7FE3B9]' : isRecording ? 'bg-[#F6DBC0]' : 'bg-[rgba(248,244,233,0.4)]'
                }`}
              />
              {isSpeaking ? 'Speaking Question' : isRecording ? 'Listening to You' : 'Evaluating Context'}
            </span>
          </div>

          {/* Center Persona Avatar & Dynamic Soundwaves */}
          <div className="flex flex-col items-center justify-center my-auto py-4 z-10">
            <div className="relative flex items-center justify-center">
              {/* Outer pulsing energy rings when AI is speaking */}
              {isSpeaking && (
                <>
                  <div className="absolute w-32 h-32 rounded-full bg-[#935073]/25 animate-ping opacity-60 pointer-events-none" />
                  <div className="absolute w-28 h-28 rounded-full bg-[#F6DBC0]/20 animate-pulse pointer-events-none" />
                </>
              )}

              {/* Bot Persona Circle */}
              <div className="w-20 h-20 sm:w-24 sm:h-24 rounded-3xl bg-gradient-to-tr from-[#502D55] via-[#935073] to-[#a65d83] flex items-center justify-center text-[#F8F4E9] shadow-[0_0_30px_rgba(147,80,115,0.45)] border-2 border-[rgba(246,219,192,0.3)] relative z-10 transition-transform duration-300 hover:scale-105">
                <Bot className={`w-10 h-10 sm:w-12 sm:h-12 text-[#F8F4E9] ${isSpeaking ? 'animate-bounce' : ''}`} />
              </div>
            </div>

            <div className="mt-4 text-center space-y-1">
              <h4 className="font-extrabold text-base text-[#F8F4E9] flex items-center justify-center gap-1.5">
                <span>{selectedVoiceProfile.genderPref === 'female' ? 'Dr. ' : 'Lead '}{selectedVoiceProfile.name}</span>
                <span className="text-[10px] text-[#F6DBC0] font-mono font-normal">({selectedVoiceProfile.persona})</span>
              </h4>
              <p className="text-xs text-[rgba(248,244,233,0.65)] font-medium max-w-xs line-clamp-1">
                {companyPreset ? `${companyPreset} Hiring Specialist` : `${trackName} • ${difficulty} Level`}
              </p>
            </div>

            {/* Simulated Live Equalizer Bars */}
            <div className="flex items-center gap-1 mt-3 h-5">
              {[...Array(9)].map((_, i) => {
                const heights = isSpeaking
                  ? ['h-2', 'h-4', 'h-5', 'h-3', 'h-5', 'h-4', 'h-5', 'h-3', 'h-2']
                  : isRecording
                  ? ['h-1', 'h-2', 'h-3', 'h-2', 'h-3', 'h-2', 'h-2', 'h-1', 'h-1']
                  : ['h-1', 'h-1', 'h-1', 'h-1', 'h-1', 'h-1', 'h-1', 'h-1', 'h-1'];
                return (
                  <span
                    key={i}
                    className={`w-1 rounded-full bg-gradient-to-t from-[#502D55] via-[#935073] to-[#F6DBC0] transition-all duration-150 ${heights[i]}`}
                  />
                );
              })}
            </div>
          </div>

          {/* Bottom Info Footnote */}
          <div className="flex items-center justify-between text-[11px] text-[rgba(248,244,233,0.5)] border-t border-[rgba(248,244,233,0.08)] pt-2 z-10">
            <span className="flex items-center gap-1">
              <ShieldCheck className="w-3.5 h-3.5 text-[#7FE3B9]" /> STAR & Technical Scoring
            </span>
            <span className="font-mono text-[#F6DBC0]">{trackName}</span>
          </div>

          {/* Background Ambient Glow */}
          <div className="absolute top-0 left-1/2 -translate-x-1/2 w-64 h-64 bg-[#935073]/15 rounded-full blur-3xl pointer-events-none" />
        </div>

        {/* ======================================================== */}
        {/* TILE 2: Candidate Live Webcam Stream, Mic VU Meter & Proctoring */}
        {/* ======================================================== */}
        <div className="relative rounded-3xl overflow-hidden bg-[#1A0F22] border border-[rgba(248,244,233,0.1)] flex flex-col justify-between min-h-[260px] sm:min-h-[290px] shadow-lg group">
          {/* Camera Video Stream Element */}
          {isCameraOn ? (
            <div className="absolute inset-0 w-full h-full bg-[#1A0F22] flex items-center justify-center overflow-hidden">
              <video
                ref={videoRef}
                autoPlay
                playsInline
                muted
                className={`w-full h-full object-cover transition-all duration-300 ${
                  isMirrored ? '-scale-x-100' : ''
                } ${getFilterStyle()}`}
              />

              {/* Centering Facial Frame Guide (Subtle Proctoring HUD) */}
              <div className="absolute inset-0 pointer-events-none flex items-center justify-center opacity-40 group-hover:opacity-70 transition-opacity">
                <div className="w-44 h-56 border border-dashed border-[rgba(248,244,233,0.4)] rounded-3xl relative">
                  <div className="absolute -top-1 -left-1 w-3 h-3 border-t-2 border-l-2 border-[#F6DBC0]" />
                  <div className="absolute -top-1 -right-1 w-3 h-3 border-t-2 border-r-2 border-[#F6DBC0]" />
                  <div className="absolute -bottom-1 -left-1 w-3 h-3 border-b-2 border-l-2 border-[#F6DBC0]" />
                  <div className="absolute -bottom-1 -right-1 w-3 h-3 border-b-2 border-r-2 border-[#F6DBC0]" />
                </div>
              </div>
            </div>
          ) : (
            <div className="absolute inset-0 w-full h-full bg-gradient-to-br from-[#1A0F22] to-[#2A1B33] flex flex-col items-center justify-center p-6 text-center">
              <div className="w-20 h-20 rounded-full bg-[rgba(42,27,51,0.8)] border border-[rgba(248,244,233,0.1)] flex items-center justify-center text-[rgba(248,244,233,0.4)] mb-3 shadow-inner">
                <CameraOff className="w-9 h-9 text-[rgba(248,244,233,0.4)]" />
              </div>
              <h4 className="text-sm font-bold text-[#F8F4E9]">Camera is Off</h4>
              <p className="text-xs text-[rgba(248,244,233,0.6)] max-w-xs mt-1">
                Turn on your camera to simulate a realistic video interview.
              </p>
              <button
                type="button"
                onClick={toggleCamera}
                className="mt-3 px-4 py-2 bg-gradient-to-r from-[#502D55] to-[#935073] hover:from-[#603766] hover:to-[#ba6d95] border border-[rgba(246,219,192,0.3)] text-[#F8F4E9] rounded-xl text-xs font-bold shadow-md transition flex items-center gap-1.5 cursor-pointer"
              >
                <Camera className="w-3.5 h-3.5 text-[#F6DBC0]" />
                <span>Turn Camera On</span>
              </button>
            </div>
          )}

          {/* Camera Error Banner */}
          {cameraError && isCameraOn && (
            <div className="absolute top-14 left-4 right-4 bg-[rgba(229,115,115,0.2)] border border-[rgba(229,115,115,0.4)] text-[#E57373] p-2.5 rounded-xl text-[11px] font-medium z-20 backdrop-blur-md">
              {cameraError}
            </div>
          )}

          {/* Overlay Top Badges */}
          <div className="relative z-10 p-4 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-[rgba(26,15,34,0.75)] border border-[rgba(248,244,233,0.12)] text-[#F8F4E9] text-xs font-bold backdrop-blur-md shadow-xs">
                <UserIcon className="w-3.5 h-3.5 text-[#7FE3B9]" />
                <span>{candidateName} (You)</span>
              </span>

              {/* Voice Activity Badge */}
              <span
                className={`inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[10px] font-bold border backdrop-blur-md transition-all ${
                  isMicMuted
                    ? 'bg-[rgba(229,115,115,0.2)] border-[rgba(229,115,115,0.4)] text-[#E57373]'
                    : isUserSpeaking || isRecording
                    ? 'bg-[rgba(127,227,185,0.2)] border-[#7FE3B9] text-[#7FE3B9] shadow-xs'
                    : 'bg-[rgba(26,15,34,0.7)] border-[rgba(248,244,233,0.1)] text-[rgba(248,244,233,0.6)]'
                }`}
              >
                <span
                  className={`w-1.5 h-1.5 rounded-full ${
                    isMicMuted ? 'bg-[#E57373]' : isUserSpeaking || isRecording ? 'bg-[#7FE3B9] animate-ping' : 'bg-[rgba(248,244,233,0.4)]'
                  }`}
                />
                <span>{isMicMuted ? 'Mic Muted' : isRecording ? 'Recording Voice' : isUserSpeaking ? 'Speaking...' : 'Listening'}</span>
              </span>
            </div>

            <div className="flex items-center gap-2">
              {isCameraOn && (
                <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-[rgba(127,227,185,0.2)] border border-[rgba(127,227,185,0.4)] text-[#7FE3B9] text-[10px] font-mono font-bold backdrop-blur-md">
                  <span className="w-1.5 h-1.5 rounded-full bg-[#7FE3B9] animate-pulse" />
                  HD 720p
                </span>
              )}
            </div>
          </div>

          {/* Live Mic VU Level Meter Bar inside Candidate Tile */}
          {!isMicMuted && (
            <div className="relative z-10 px-4 py-1">
              <div className="h-1.5 w-full bg-[rgba(26,15,34,0.85)] rounded-full overflow-hidden border border-[rgba(248,244,233,0.1)] backdrop-blur-md">
                <div
                  className={`h-full transition-all duration-75 rounded-full ${
                    micAudioLevel > 70
                      ? 'bg-[#E57373]'
                      : micAudioLevel > 20
                      ? 'bg-gradient-to-r from-[#7FE3B9] to-[#F6DBC0]'
                      : 'bg-[#7FE3B9]'
                  }`}
                  style={{ width: `${Math.max(2, micAudioLevel)}%` }}
                />
              </div>
            </div>
          )}

          {/* Overlay Bottom Controls Bar */}
          <div className="relative z-10 p-4 bg-gradient-to-t from-[rgba(26,15,34,0.95)] via-[rgba(26,15,34,0.6)] to-transparent flex items-center justify-between">
            <div className="flex items-center gap-1.5">
              {/* Camera Toggle Button */}
              <button
                type="button"
                onClick={toggleCamera}
                className={`p-2.5 rounded-xl transition flex items-center gap-1.5 text-xs font-bold backdrop-blur-md cursor-pointer ${
                  isCameraOn
                    ? 'bg-[rgba(42,27,51,0.8)] hover:bg-[rgba(80,45,85,0.8)] text-[#F8F4E9] border border-[rgba(248,244,233,0.15)]'
                    : 'bg-[#935073] hover:bg-[#a65d83] text-[#F8F4E9] shadow-md border border-[rgba(246,219,192,0.3)]'
                }`}
                title="Toggle Camera (Alt + C)"
              >
                {isCameraOn ? <Camera className="w-4 h-4 text-[#7FE3B9]" /> : <CameraOff className="w-4 h-4 text-[#F6DBC0]" />}
                <span className="hidden sm:inline">{isCameraOn ? 'Cam On' : 'Cam Off'}</span>
              </button>

              {/* Microphone Mute / Facility Toggle Button */}
              <button
                type="button"
                onClick={toggleMicMute}
                className={`p-2.5 rounded-xl transition flex items-center gap-1.5 text-xs font-bold backdrop-blur-md cursor-pointer ${
                  !isMicMuted
                    ? 'bg-[rgba(42,27,51,0.8)] hover:bg-[rgba(80,45,85,0.8)] text-[#F8F4E9] border border-[rgba(248,244,233,0.15)]'
                    : 'bg-[#935073] hover:bg-[#a65d83] text-[#F8F4E9] shadow-md border border-[rgba(246,219,192,0.3)]'
                }`}
                title="Mute / Unmute Microphone (Alt + M)"
              >
                {!isMicMuted ? <Mic className="w-4 h-4 text-[#7FE3B9]" /> : <MicOff className="w-4 h-4 text-[#F6DBC0]" />}
                <span className="hidden sm:inline">{!isMicMuted ? 'Mic Live' : 'Muted'}</span>
              </button>

              {/* Mirror Toggle */}
              {isCameraOn && (
                <button
                  type="button"
                  onClick={() => setIsMirrored((prev) => !prev)}
                  className={`p-2.5 rounded-xl border backdrop-blur-md transition text-xs font-bold cursor-pointer ${
                    isMirrored
                      ? 'bg-[rgba(147,80,115,0.6)] border-[rgba(246,219,192,0.4)] text-[#F8F4E9]'
                      : 'bg-[rgba(42,27,51,0.8)] border-[rgba(248,244,233,0.15)] text-[rgba(248,244,233,0.6)] hover:text-[#F8F4E9]'
                  }`}
                  title="Flip Video Mirror"
                >
                  <FlipHorizontal className="w-4 h-4 text-[#F6DBC0]" />
                </button>
              )}

              {/* Filter / Lighting Mode */}
              {isCameraOn && (
                <button
                  type="button"
                  onClick={cycleFilter}
                  className={`p-2.5 rounded-xl border backdrop-blur-md transition text-xs font-bold flex items-center gap-1 cursor-pointer ${
                    filterMode !== 'normal'
                      ? 'bg-[rgba(147,80,115,0.6)] border-[rgba(246,219,192,0.4)] text-[#F8F4E9]'
                      : 'bg-[rgba(42,27,51,0.8)] border-[rgba(248,244,233,0.15)] text-[rgba(248,244,233,0.6)] hover:text-[#F8F4E9]'
                  }`}
                  title={`Studio Filter Mode: ${filterMode}`}
                >
                  <Sparkles className="w-4 h-4 text-[#F6DBC0]" />
                  <span className="text-[10px] hidden md:inline uppercase text-[#F6DBC0]">{filterMode}</span>
                </button>
              )}
            </div>

            {/* Quick Device Settings button */}
            {onOpenDeviceSettings && (
              <button
                type="button"
                onClick={onOpenDeviceSettings}
                className="p-2.5 rounded-xl bg-[rgba(42,27,51,0.8)] hover:bg-[rgba(80,45,85,0.8)] border border-[rgba(248,244,233,0.15)] text-[#F6DBC0] hover:text-[#F8F4E9] backdrop-blur-md transition text-xs font-bold flex items-center gap-1 cursor-pointer"
                title="Camera & Microphone Hardware Settings"
              >
                <Settings className="w-4 h-4 text-[#F6DBC0]" />
                <span className="hidden sm:inline">Settings</span>
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
