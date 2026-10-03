import React, { useState, useEffect, useRef } from 'react';
import {
  Mic,
  Sliders,
  Volume2,
  Check,
  X,
  RefreshCw,
  Radio,
  Camera,
  Video,
  FlipHorizontal,
  Sparkles,
} from 'lucide-react';

interface AudioSettingsModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const AudioSettingsModal: React.FC<AudioSettingsModalProps> = ({ isOpen, onClose }) => {
  const [activeTab, setActiveTab] = useState<'mic' | 'camera'>('camera');

  // Mic states
  const [audioDevices, setAudioDevices] = useState<MediaDeviceInfo[]>([]);
  const [selectedAudioDeviceId, setSelectedAudioDeviceId] = useState<string>(
    localStorage.getItem('preferred_mic_device_id') || ''
  );
  const [sensitivity, setSensitivity] = useState<number>(
    Number(localStorage.getItem('mic_sensitivity')) || 50
  );
  const [isTestingMic, setIsTestingMic] = useState(false);
  const [audioLevel, setAudioLevel] = useState<number>(0);

  // Camera states
  const [videoDevices, setVideoDevices] = useState<MediaDeviceInfo[]>([]);
  const [selectedVideoDeviceId, setSelectedVideoDeviceId] = useState<string>(
    localStorage.getItem('preferred_camera_device_id') || ''
  );
  const [isTestingCamera, setIsTestingCamera] = useState(true);
  const [isMirrored, setIsMirrored] = useState(true);
  const [cameraPermissionError, setCameraPermissionError] = useState<string | null>(null);

  // Refs
  const micStreamRef = useRef<MediaStream | null>(null);
  const audioCtxRef = useRef<AudioContext | null>(null);
  const micAnimFrameRef = useRef<number | null>(null);

  const videoRef = useRef<HTMLVideoElement | null>(null);
  const videoStreamRef = useRef<MediaStream | null>(null);

  useEffect(() => {
    if (!isOpen) {
      stopAllTests();
      return;
    }

    loadAllDevices();
    startCameraTest();
  }, [isOpen]);

  const loadAllDevices = async () => {
    try {
      const devices = await navigator.mediaDevices.enumerateDevices();
      const mics = devices.filter((d) => d.kind === 'audioinput');
      const cams = devices.filter((d) => d.kind === 'videoinput');

      setAudioDevices(mics);
      setVideoDevices(cams);

      if (!selectedAudioDeviceId && mics.length > 0) {
        setSelectedAudioDeviceId(mics[0].deviceId);
      }
      if (!selectedVideoDeviceId && cams.length > 0) {
        setSelectedVideoDeviceId(cams[0].deviceId);
      }
    } catch (err) {
      console.warn('Unable to enumerate audio/video devices:', err);
    }
  };

  const startCameraTest = async (deviceId?: string) => {
    setCameraPermissionError(null);
    if (videoStreamRef.current) {
      videoStreamRef.current.getTracks().forEach((t) => t.stop());
    }

    const targetDevId = deviceId || selectedVideoDeviceId;
    try {
      const constraints: MediaStreamConstraints = {
        video: targetDevId ? { deviceId: { exact: targetDevId } } : true,
      };
      const stream = await navigator.mediaDevices.getUserMedia(constraints);
      videoStreamRef.current = stream;
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
      }
      setIsTestingCamera(true);
    } catch (err: any) {
      console.warn('Camera preview test error:', err);
      setCameraPermissionError(
        'Webcam access unavailable or blocked by browser. Please allow camera permissions.'
      );
    }
  };

  const stopCameraTest = () => {
    if (videoStreamRef.current) {
      videoStreamRef.current.getTracks().forEach((t) => t.stop());
      videoStreamRef.current = null;
    }
    if (videoRef.current) {
      videoRef.current.srcObject = null;
    }
    setIsTestingCamera(false);
  };

  const startMicTest = async (deviceId?: string) => {
    stopMicTest();
    const targetDevId = deviceId || selectedAudioDeviceId;

    try {
      const constraints: MediaStreamConstraints = {
        audio: targetDevId ? { deviceId: { exact: targetDevId } } : true,
      };

      const stream = await navigator.mediaDevices.getUserMedia(constraints);
      micStreamRef.current = stream;

      const AudioCtxClass = window.AudioContext || (window as any).webkitAudioContext;
      const audioCtx = new AudioCtxClass();
      const analyser = audioCtx.createAnalyser();
      analyser.fftSize = 64;

      const source = audioCtx.createMediaStreamSource(stream);
      source.connect(analyser);

      audioCtxRef.current = audioCtx;
      setIsTestingMic(true);

      const bufferLength = analyser.frequencyBinCount;
      const dataArray = new Uint8Array(bufferLength);

      const updateMeter = () => {
        analyser.getByteFrequencyData(dataArray);
        let sum = 0;
        for (let i = 0; i < dataArray.length; i++) {
          sum += dataArray[i];
        }
        const avg = sum / dataArray.length;
        // Factor in sensitivity slider
        const gainFactor = sensitivity / 50;
        const normalized = Math.min(100, Math.round((avg / 128) * 100 * gainFactor));
        setAudioLevel(normalized);

        micAnimFrameRef.current = requestAnimationFrame(updateMeter);
      };

      updateMeter();
    } catch (err) {
      console.warn('Microphone meter test error:', err);
    }
  };

  const stopMicTest = () => {
    if (micAnimFrameRef.current) cancelAnimationFrame(micAnimFrameRef.current);
    if (micStreamRef.current) {
      micStreamRef.current.getTracks().forEach((t) => t.stop());
      micStreamRef.current = null;
    }
    if (audioCtxRef.current && audioCtxRef.current.state !== 'closed') {
      audioCtxRef.current.close().catch(() => {});
      audioCtxRef.current = null;
    }
    setIsTestingMic(false);
    setAudioLevel(0);
  };

  const stopAllTests = () => {
    stopCameraTest();
    stopMicTest();
  };

  const handleSave = () => {
    localStorage.setItem('preferred_mic_device_id', selectedAudioDeviceId);
    localStorage.setItem('preferred_camera_device_id', selectedVideoDeviceId);
    localStorage.setItem('mic_sensitivity', sensitivity.toString());
    stopAllTests();
    onClose();
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-[#1A0F22]/80 backdrop-blur-md animate-in fade-in duration-200">
      <div className="bg-[rgba(42,27,51,0.92)] border border-[rgba(248,244,233,0.12)] rounded-3xl p-6 sm:p-8 max-w-lg w-full shadow-2xl space-y-6 relative text-[#F8F4E9]">
        <button
          onClick={() => {
            stopAllTests();
            onClose();
          }}
          className="absolute top-5 right-5 p-2 rounded-xl text-[rgba(248,244,233,0.5)] hover:text-[#F8F4E9] hover:bg-[rgba(147,80,115,0.2)] transition cursor-pointer"
        >
          <X className="w-5 h-5" />
        </button>

        {/* Header */}
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-2xl bg-[rgba(80,45,85,0.6)] text-[#F6DBC0] border border-[rgba(246,219,192,0.3)] flex items-center justify-center shadow-[0_0_15px_rgba(147,80,115,0.3)]">
            <Camera className="w-5 h-5" />
          </div>
          <div>
            <h2 className="text-xl font-extrabold text-[#F8F4E9]">Camera & Audio Settings</h2>
            <p className="text-xs text-[rgba(248,244,233,0.65)] font-medium">
              Configure webcam stream, microphone selection & audio levels
            </p>
          </div>
        </div>

        {/* Tabs: Camera vs Microphone */}
        <div className="flex rounded-2xl bg-[rgba(26,15,34,0.6)] p-1 border border-[rgba(248,244,233,0.08)]">
          <button
            type="button"
            onClick={() => setActiveTab('camera')}
            className={`flex-1 py-2 rounded-xl text-xs font-bold transition flex items-center justify-center gap-2 cursor-pointer ${
              activeTab === 'camera'
                ? 'bg-[#935073] text-[#F8F4E9] shadow-[0_0_12px_rgba(147,80,115,0.4)] border border-[rgba(246,219,192,0.3)]'
                : 'text-[rgba(248,244,233,0.6)] hover:text-[#F8F4E9]'
            }`}
          >
            <Camera className="w-4 h-4 text-[#F6DBC0]" />
            <span>Webcam & Video</span>
          </button>

          <button
            type="button"
            onClick={() => {
              setActiveTab('mic');
              if (!isTestingMic) startMicTest();
            }}
            className={`flex-1 py-2 rounded-xl text-xs font-bold transition flex items-center justify-center gap-2 cursor-pointer ${
              activeTab === 'mic'
                ? 'bg-[#935073] text-[#F8F4E9] shadow-[0_0_12px_rgba(147,80,115,0.4)] border border-[rgba(246,219,192,0.3)]'
                : 'text-[rgba(248,244,233,0.6)] hover:text-[#F8F4E9]'
            }`}
          >
            <Mic className="w-4 h-4 text-[#F6DBC0]" />
            <span>Microphone & Levels</span>
          </button>
        </div>

        {/* Tab 1: Camera Settings */}
        {activeTab === 'camera' && (
          <div className="space-y-4">
            {/* Live Video Preview Box */}
            <div className="relative rounded-2xl overflow-hidden bg-[#1A0F22] border border-[rgba(248,244,233,0.1)] h-48 flex items-center justify-center">
              <video
                ref={videoRef}
                autoPlay
                playsInline
                muted
                className={`w-full h-full object-cover ${isMirrored ? '-scale-x-100' : ''}`}
              />

              {cameraPermissionError && (
                <div className="absolute inset-0 bg-[#1A0F22]/90 p-4 flex flex-col items-center justify-center text-center text-xs text-[#E57373]">
                  <p>{cameraPermissionError}</p>
                </div>
              )}

              <div className="absolute bottom-2 right-2 flex items-center gap-1.5 z-10">
                <button
                  type="button"
                  onClick={() => setIsMirrored((prev) => !prev)}
                  className="px-2.5 py-1 rounded-lg bg-[rgba(26,15,34,0.85)] hover:bg-[rgba(80,45,85,0.8)] text-[11px] font-bold text-[#F8F4E9] border border-[rgba(248,244,233,0.15)] backdrop-blur-md flex items-center gap-1 cursor-pointer"
                >
                  <FlipHorizontal className="w-3 h-3 text-[#F6DBC0]" />
                  <span>Mirror: {isMirrored ? 'On' : 'Off'}</span>
                </button>
              </div>
            </div>

            {/* Video Device Selector */}
            <div className="space-y-1.5">
              <label className="block text-xs font-bold text-[#F8F4E9] uppercase tracking-wider flex items-center justify-between">
                <span>Selected Camera</span>
                <button
                  type="button"
                  onClick={loadAllDevices}
                  className="text-[11px] text-[#F6DBC0] hover:underline flex items-center gap-1 font-semibold cursor-pointer"
                >
                  <RefreshCw className="w-3 h-3 text-[#F6DBC0]" /> Refresh
                </button>
              </label>

              <select
                value={selectedVideoDeviceId}
                onChange={(e) => {
                  setSelectedVideoDeviceId(e.target.value);
                  startCameraTest(e.target.value);
                }}
                className="w-full px-4 py-2.5 rounded-xl border border-[rgba(248,244,233,0.1)] bg-[rgba(26,15,34,0.6)] text-[#F8F4E9] text-xs font-semibold focus:border-[#935073] outline-none"
              >
                {videoDevices.length === 0 ? (
                  <option value="" className="bg-[#1A0F22] text-[#F8F4E9]">Default Front Camera</option>
                ) : (
                  videoDevices.map((device, idx) => (
                    <option key={device.deviceId || idx} value={device.deviceId} className="bg-[#1A0F22] text-[#F8F4E9]">
                      {device.label || `Camera ${idx + 1}`}
                    </option>
                  ))
                )}
              </select>
            </div>
          </div>
        )}

        {/* Tab 2: Microphone Settings */}
        {activeTab === 'mic' && (
          <div className="space-y-4">
            {/* Audio Device Selector */}
            <div className="space-y-1.5">
              <label className="block text-xs font-bold text-[#F8F4E9] uppercase tracking-wider flex items-center justify-between">
                <span>Preferred Microphone</span>
                <button
                  type="button"
                  onClick={loadAllDevices}
                  className="text-[11px] text-[#F6DBC0] hover:underline flex items-center gap-1 font-semibold cursor-pointer"
                >
                  <RefreshCw className="w-3 h-3 text-[#F6DBC0]" /> Refresh
                </button>
              </label>
              <select
                value={selectedAudioDeviceId}
                onChange={(e) => {
                  setSelectedAudioDeviceId(e.target.value);
                  startMicTest(e.target.value);
                }}
                className="w-full px-4 py-2.5 rounded-xl border border-[rgba(248,244,233,0.1)] bg-[rgba(26,15,34,0.6)] text-[#F8F4E9] text-xs font-semibold focus:border-[#935073] outline-none"
              >
                {audioDevices.length === 0 ? (
                  <option value="" className="bg-[#1A0F22] text-[#F8F4E9]">Default Microphone</option>
                ) : (
                  audioDevices.map((device, idx) => (
                    <option key={device.deviceId || idx} value={device.deviceId} className="bg-[#1A0F22] text-[#F8F4E9]">
                      {device.label || `Microphone ${idx + 1}`}
                    </option>
                  ))
                )}
              </select>
            </div>

            {/* Sensitivity Slider */}
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <label className="text-xs font-bold text-[#F8F4E9] uppercase tracking-wider flex items-center gap-1.5">
                  <Sliders className="w-3.5 h-3.5 text-[#F6DBC0]" />
                  Voice Sensitivity ({sensitivity}%)
                </label>
                <span className="text-xs font-bold text-[#F6DBC0] bg-[rgba(80,45,85,0.5)] px-2 py-0.5 rounded border border-[rgba(246,219,192,0.2)]">
                  {sensitivity > 75 ? 'High Gain' : sensitivity > 35 ? 'Balanced' : 'Low Gate'}
                </span>
              </div>

              <input
                type="range"
                min="10"
                max="100"
                step="5"
                value={sensitivity}
                onChange={(e) => setSensitivity(Number(e.target.value))}
                className="w-full h-2 bg-[rgba(26,15,34,0.8)] rounded-lg appearance-none cursor-pointer accent-[#935073]"
              />
            </div>

            {/* Live Audio Meter */}
            <div className="bg-[rgba(26,15,34,0.6)] p-3.5 rounded-2xl border border-[rgba(248,244,233,0.08)] space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-[#F8F4E9] flex items-center gap-1.5">
                  <Radio className={`w-3.5 h-3.5 ${isTestingMic ? 'text-[#7FE3B9] animate-pulse' : 'text-[rgba(248,244,233,0.4)]'}`} />
                  Live Mic Level
                </span>

                <button
                  type="button"
                  onClick={isTestingMic ? stopMicTest : () => startMicTest()}
                  className={`px-2.5 py-1 rounded-lg text-xs font-bold transition cursor-pointer ${
                    isTestingMic
                      ? 'bg-[rgba(229,115,115,0.2)] text-[#E57373] border border-[rgba(229,115,115,0.4)]'
                      : 'bg-gradient-to-r from-[#502D55] to-[#935073] text-[#F8F4E9] border border-[rgba(246,219,192,0.2)]'
                  }`}
                >
                  {isTestingMic ? 'Stop Test' : 'Test Audio'}
                </button>
              </div>

              <div className="h-3.5 bg-[rgba(80,45,85,0.4)] rounded-full overflow-hidden relative border border-[rgba(248,244,233,0.06)]">
                <div
                  className={`h-full transition-all duration-75 rounded-full ${
                    audioLevel > 80
                      ? 'bg-[#E57373]'
                      : audioLevel > 40
                      ? 'bg-[#7FE3B9]'
                      : 'bg-gradient-to-r from-[#502D55] to-[#935073]'
                  }`}
                  style={{ width: `${audioLevel}%` }}
                />
              </div>
            </div>
          </div>
        )}

        {/* Action Buttons */}
        <div className="flex items-center justify-end gap-3 pt-2">
          <button
            type="button"
            onClick={() => {
              stopAllTests();
              onClose();
            }}
            className="px-5 py-2.5 rounded-xl border border-[rgba(248,244,233,0.12)] text-[rgba(248,244,233,0.7)] text-xs font-bold hover:bg-[rgba(147,80,115,0.15)] transition cursor-pointer"
          >
            Cancel
          </button>
          <button
            type="button"
            onClick={handleSave}
            className="px-5 py-2.5 rounded-xl bg-gradient-to-r from-[#502D55] to-[#935073] hover:from-[#603766] hover:to-[#ba6d95] border border-[rgba(246,219,192,0.3)] text-[#F8F4E9] text-xs font-bold shadow-[0_0_16px_rgba(147,80,115,0.35)] transition flex items-center gap-1.5 cursor-pointer hover:scale-[1.01]"
          >
            <Check className="w-4 h-4 text-[#F6DBC0]" /> Save Preferences
          </button>
        </div>
      </div>
    </div>
  );
};
