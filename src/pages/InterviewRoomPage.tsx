import React, { useState, useEffect, useRef } from 'react';
import { useParams, useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { InterviewSession, InterviewQuestion } from '../types';
import { TtsVoiceSettingsModal, VOICE_PROFILES, VoiceProfile } from '../components/TtsVoiceSettingsModal';
import { KeyboardShortcutsModal } from '../components/KeyboardShortcutsModal';
import { AudioSettingsModal } from '../components/AudioSettingsModal';
import { CameraVideoStage } from '../components/CameraVideoStage';
import { TabProctoringHUD } from '../components/TabProctoringHUD';
import { ProctoringReport } from '../types';
import {
  Mic,
  MicOff,
  Camera,
  CameraOff,
  Video,
  Volume2,
  VolumeX,
  Send,
  Clock,
  Sparkles,
  BrainCircuit,
  AlertCircle,
  HelpCircle,
  CheckCircle2,
  ArrowRight,
  Bot,
  Keyboard,
  Settings2,
} from 'lucide-react';

export const InterviewRoomPage: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const { token, user, isLoading: isAuthLoading, login } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  const initialSession = (location.state as any)?.session || null;
  const initialQuestion = (location.state as any)?.currentQuestion || null;

  const [session, setSession] = useState<InterviewSession | null>(initialSession);
  const [currentQuestion, setCurrentQuestion] = useState<InterviewQuestion | null>(initialQuestion);
  const [textAnswer, setTextAnswer] = useState('');
  const [inputMode, setInputMode] = useState<'mic' | 'text'>('mic');
  const [latestProctoringReport, setLatestProctoringReport] = useState<ProctoringReport | null>(null);

  // Modal states
  const [isVoiceModalOpen, setIsVoiceModalOpen] = useState(false);
  const [isShortcutsModalOpen, setIsShortcutsModalOpen] = useState(false);
  const [isAudioModalOpen, setIsAudioModalOpen] = useState(false);

  // Voice Persona Profile & TTS state
  const [selectedVoiceProfile, setSelectedVoiceProfile] = useState<VoiceProfile>(VOICE_PROFILES[0]);
  const [ttsPitch, setTtsPitch] = useState<number>(1.1);
  const [ttsRate, setTtsRate] = useState<number>(1.0);
  const [autoReadQuestion, setAutoReadQuestion] = useState<boolean>(true);

  // Recording State
  const [isRecording, setIsRecording] = useState(false);
  const [recordedAudioBase64, setRecordedAudioBase64] = useState<string | null>(null);
  const [audioBlobUrl, setAudioBlobUrl] = useState<string | null>(null);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const recordingStreamRef = useRef<MediaStream | null>(null);
  const audioChunksRef = useRef<Blob[]>([]);

  // Audio Canvas visualizer refs
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const audioCtxRef = useRef<AudioContext | null>(null);
  const analyserRef = useRef<AnalyserNode | null>(null);
  const animFrameRef = useRef<number | null>(null);

  // Speech Synthesis state
  const [isSpeaking, setIsSpeaking] = useState(false);

  // Timer
  const [timeLeft, setTimeLeft] = useState<number>(120); // 2 minutes per question

  // Submission & Loading State
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Active Question resolution (from state, currentQuestion, or session questions)
  const activeQuestion: InterviewQuestion | null =
    currentQuestion ||
    (session?.questions && session.questions.length > 0
      ? session.questions.find((q) => !q.answer) || session.questions[session.questions.length - 1]
      : null);

  // Sync activeQuestion back to currentQuestion state if needed
  useEffect(() => {
    if (!currentQuestion && activeQuestion) {
      setCurrentQuestion(activeQuestion);
    }
  }, [activeQuestion, currentQuestion]);

  // Load Session Data
  useEffect(() => {
    if (isAuthLoading) return;

    const activeToken = localStorage.getItem('interview_ai_token') || token;

    const fetchSession = async () => {
      if (!activeToken) {
        if (!session && !activeQuestion) {
          setError('Session token missing. Please select an interview track to start a practice session.');
        }
        return;
      }

      try {
        const res = await fetch(`/api/sessions/${id}`, {
          headers: { Authorization: `Bearer ${activeToken}` },
        });
        if (!res.ok) {
          if (!session && !activeQuestion) {
            setError('Unable to load interview session. It may have expired or does not exist.');
          }
          return;
        }
        const data = await res.json();
        const s: InterviewSession = data.session;
        setSession(s);
        setError(null);

        if (s.status === 'completed') {
          navigate(`/results/${s.id}`);
          return;
        }

        // Find current unanswered question or latest question
        const questions = s.questions || [];
        const unanswered = questions.find((q) => !q.answer);
        if (unanswered) {
          setCurrentQuestion(unanswered);
        } else if (questions.length > 0) {
          setCurrentQuestion(questions[questions.length - 1]);
        }
      } catch (err) {
        console.error('Error loading session:', err);
        if (!session && !activeQuestion) {
          setError('Network error loading session.');
        }
      }
    };

    fetchSession();
  }, [id, token, isAuthLoading, navigate]);

  // Timer Countdown Effect
  useEffect(() => {
    if (!currentQuestion || isSubmitting) return;

    setTimeLeft(120); // Reset timer to 2 minutes
    const interval = setInterval(() => {
      setTimeLeft((prev) => {
        if (prev <= 1) {
          clearInterval(interval);
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(interval);
  }, [currentQuestion, isSubmitting]);

  // Cleanup all audio, streams, and speech on unmount
  useEffect(() => {
    return () => {
      if ('speechSynthesis' in window) {
        window.speechSynthesis.cancel();
      }
      if (mediaRecorderRef.current && mediaRecorderRef.current.state !== 'inactive') {
        try {
          mediaRecorderRef.current.stop();
        } catch (_) {}
      }
      if (recordingStreamRef.current) {
        recordingStreamRef.current.getTracks().forEach((track) => track.stop());
        recordingStreamRef.current = null;
      }
      if (audioCtxRef.current && audioCtxRef.current.state !== 'closed') {
        audioCtxRef.current.close().catch(() => {});
      }
      if (animFrameRef.current) {
        cancelAnimationFrame(animFrameRef.current);
      }
    };
  }, []);

  // Speech Synthesis player function with voice profile support
  const speakQuestionText = (text: string) => {
    if (!('speechSynthesis' in window)) return;
    window.speechSynthesis.cancel();

    const utterance = new SpeechSynthesisUtterance(text);
    utterance.pitch = ttsPitch;
    utterance.rate = ttsRate;

    const voices = window.speechSynthesis.getVoices();
    if (voices.length > 0) {
      const p = selectedVoiceProfile;
      const matchedVoice = voices.find(
        (v) =>
          v.name.toLowerCase().includes(p.name.toLowerCase()) ||
          (p.genderPref === 'female' &&
            (v.name.includes('Female') || v.name.includes('Zira') || v.name.includes('Samantha') || v.name.includes('Google US English'))) ||
          (p.genderPref === 'male' &&
            (v.name.includes('Male') || v.name.includes('David') || v.name.includes('Alex')))
      );
      if (matchedVoice) utterance.voice = matchedVoice;
    }

    utterance.onstart = () => setIsSpeaking(true);
    utterance.onend = () => setIsSpeaking(false);
    utterance.onerror = () => setIsSpeaking(false);

    window.speechSynthesis.speak(utterance);
  };

  // Auto read aloud question when question changes
  useEffect(() => {
    if (currentQuestion && autoReadQuestion && !isSubmitting) {
      speakQuestionText(currentQuestion.questionText);
    }
    return () => {
      if ('speechSynthesis' in window) {
        window.speechSynthesis.cancel();
        setIsSpeaking(false);
      }
    };
  }, [currentQuestion?.id, selectedVoiceProfile, ttsPitch, ttsRate, autoReadQuestion]);

  const toggleTTS = () => {
    if (!currentQuestion) return;
    if ('speechSynthesis' in window) {
      if (isSpeaking) {
        window.speechSynthesis.cancel();
        setIsSpeaking(false);
      } else {
        speakQuestionText(currentQuestion.questionText);
      }
    }
  };

  // Start Mic Recording & Audio Visualizer
  const startRecording = async () => {
    try {
      // Immediately cancel any TTS audio reading so mic won't pick it up
      if ('speechSynthesis' in window) {
        window.speechSynthesis.cancel();
        setIsSpeaking(false);
      }

      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      recordingStreamRef.current = stream;
      audioChunksRef.current = [];

      const recorder = new MediaRecorder(stream, { mimeType: 'audio/webm' });
      recorder.ondataavailable = (e) => {
        if (e.data.size > 0) {
          audioChunksRef.current.push(e.data);
        }
      };

      recorder.onstop = async () => {
        const blob = new Blob(audioChunksRef.current, { type: 'audio/webm' });
        const url = URL.createObjectURL(blob);
        setAudioBlobUrl(url);

        // Convert blob to base64
        const reader = new FileReader();
        reader.readAsDataURL(blob);
        reader.onloadend = () => {
          const base64data = reader.result as string;
          // strip "data:audio/webm;base64," prefix
          const base64Clean = base64data.split(',')[1];
          setRecordedAudioBase64(base64Clean);
        };

        // Stop stream tracks
        stream.getTracks().forEach((track) => track.stop());
        recordingStreamRef.current = null;
      };

      recorder.start(100);
      mediaRecorderRef.current = recorder;
      setIsRecording(true);

      // Audio Visualizer Setup
      const audioCtx = new (window.AudioContext || (window as any).webkitAudioContext)();
      const analyser = audioCtx.createAnalyser();
      analyser.fftSize = 64;
      const source = audioCtx.createMediaStreamSource(stream);
      source.connect(analyser);

      audioCtxRef.current = audioCtx;
      analyserRef.current = analyser;

      drawVisualizer();
    } catch (err) {
      console.error('Microphone access denied:', err);
      setError('Microphone access was denied or dismissed by the browser. We have switched you to text response mode so you can type your answer.');
      setInputMode('text');
    }
  };

  const drawVisualizer = () => {
    if (!canvasRef.current || !analyserRef.current) return;
    const canvas = canvasRef.current;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const bufferLength = analyserRef.current.frequencyBinCount;
    const dataArray = new Uint8Array(bufferLength);

    const render = () => {
      if (!isRecording) return;
      animFrameRef.current = requestAnimationFrame(render);
      analyserRef.current!.getByteFrequencyData(dataArray);

      ctx.clearRect(0, 0, canvas.width, canvas.height);

      const barWidth = (canvas.width / bufferLength) * 1.5;
      let x = 0;

      for (let i = 0; i < bufferLength; i++) {
        const barHeight = (dataArray[i] / 255) * canvas.height;

        const gradient = ctx.createLinearGradient(0, canvas.height, 0, 0);
        gradient.addColorStop(0, '#6366f1');
        gradient.addColorStop(1, '#a855f7');

        ctx.fillStyle = gradient;
        ctx.fillRect(x, canvas.height - barHeight, barWidth - 2, barHeight);

        x += barWidth;
      }
    };

    render();
  };

  const stopRecording = () => {
    if (mediaRecorderRef.current && mediaRecorderRef.current.state !== 'inactive') {
      try {
        mediaRecorderRef.current.stop();
      } catch (_) {}
    }
    if (recordingStreamRef.current) {
      recordingStreamRef.current.getTracks().forEach((track) => track.stop());
      recordingStreamRef.current = null;
    }
    setIsRecording(false);
    if (animFrameRef.current) {
      cancelAnimationFrame(animFrameRef.current);
      animFrameRef.current = null;
    }
    if (audioCtxRef.current && audioCtxRef.current.state !== 'closed') {
      audioCtxRef.current.close().catch(() => {});
      audioCtxRef.current = null;
    }
  };

  // Submit Answer Handlers
  const handleSubmitAnswer = async () => {
    const targetQuestion = currentQuestion || displayedQuestion;
    if (!targetQuestion || isSubmitting) return;

    // 1. Immediately cancel any speech/question reading audio
    if ('speechSynthesis' in window) {
      window.speechSynthesis.cancel();
      setIsSpeaking(false);
    }

    // 2. Stop recording if active
    if (isRecording) {
      stopRecording();
    }

    if (!recordedAudioBase64 && !textAnswer.trim()) {
      setError('Please record your spoken answer or type your response before submitting.');
      return;
    }

    setIsSubmitting(true);
    setError(null);

    const activeToken = localStorage.getItem('interview_ai_token') || token;

    try {
      const res = await fetch(`/api/sessions/${id}/submit-answer`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${activeToken}`,
        },
        body: JSON.stringify({
          questionId: targetQuestion.id,
          textAnswer: textAnswer.trim(),
          audioBase64: recordedAudioBase64,
          mimeType: 'audio/webm',
          proctoring: latestProctoringReport,
        }),
      });

      const data = await res.json();
      if (!res.ok) {
        setError(data.error || 'Failed to submit answer');
        setIsSubmitting(false);
        return;
      }

      // Reset recording and answer states
      setRecordedAudioBase64(null);
      setAudioBlobUrl(null);
      setTextAnswer('');

      // Ensure speech synthesis is completely cancelled before next question / transition
      if ('speechSynthesis' in window) {
        window.speechSynthesis.cancel();
        setIsSpeaking(false);
      }

      const updatedSession: InterviewSession = data.session;
      setSession(updatedSession);

      if (data.isSessionCompleted || updatedSession.status === 'completed') {
        navigate(`/results/${id}`);
      } else if (data.nextQuestion) {
        setCurrentQuestion(data.nextQuestion);
      }
    } catch (err: any) {
      setError(err.message || 'Error evaluating answer');
    } finally {
      setIsSubmitting(false);
    }
  };

  // Global Keyboard Shortcuts Listener
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      const targetTag = (e.target as HTMLElement)?.tagName?.toLowerCase();
      const isTyping = targetTag === 'input' || targetTag === 'textarea';

      // Space: Toggle Mic Recording (if not typing in text field)
      if (e.code === 'Space' && !isTyping && inputMode === 'mic') {
        e.preventDefault();
        if (isRecording) {
          stopRecording();
        } else {
          startRecording();
        }
        return;
      }

      // Ctrl+Enter or Cmd+Enter: Submit Answer
      if ((e.ctrlKey || e.metaKey) && e.key === 'Enter') {
        e.preventDefault();
        handleSubmitAnswer();
        return;
      }

      // Alt+R: Toggle Mic Recording
      if (e.altKey && e.code === 'KeyR') {
        e.preventDefault();
        if (isRecording) stopRecording();
        else startRecording();
        return;
      }

      // Alt+C: Toggle Camera
      if (e.altKey && e.code === 'KeyC') {
        e.preventDefault();
        const current = localStorage.getItem('interview_camera_enabled') !== 'false';
        localStorage.setItem('interview_camera_enabled', String(!current));
        window.dispatchEvent(new Event('storage'));
        return;
      }

      // Alt+S: Read / Replay question
      if (e.altKey && e.code === 'KeyS') {
        e.preventDefault();
        toggleTTS();
        return;
      }

      // Alt+V: Voice Settings Modal
      if (e.altKey && e.code === 'KeyV') {
        e.preventDefault();
        setIsVoiceModalOpen((prev) => !prev);
        return;
      }

      // Shift + ?: Shortcuts Legend Modal
      if (e.key === '?' && !isTyping) {
        e.preventDefault();
        setIsShortcutsModalOpen((prev) => !prev);
        return;
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [
    isRecording,
    inputMode,
    recordedAudioBase64,
    textAnswer,
    isSubmitting,
    currentQuestion,
    selectedVoiceProfile,
    ttsPitch,
    ttsRate,
  ]);

  if (error && (!session || !activeQuestion)) {
    return (
      <div className="min-h-[80vh] flex flex-col items-center justify-center p-6 text-center max-w-md mx-auto space-y-4">
        <div className="w-14 h-14 rounded-2xl bg-rose-100 dark:bg-rose-950/60 border border-rose-200 dark:border-rose-800 text-rose-600 dark:text-rose-400 flex items-center justify-center shadow-sm">
          <AlertCircle className="w-7 h-7" />
        </div>
        <h2 className="text-lg font-black text-slate-900 dark:text-white">Interview Session Notice</h2>
        <p className="text-xs text-slate-600 dark:text-slate-400 leading-relaxed font-medium">{error}</p>
        <div className="flex items-center gap-3 pt-2">
          <button
            onClick={() => navigate('/track-selection')}
            className="px-6 py-3 bg-slate-900 hover:bg-slate-800 dark:bg-indigo-600 dark:hover:bg-indigo-500 text-white font-extrabold text-xs rounded-xl shadow-md transition flex items-center gap-2"
          >
            <ArrowRight className="w-4 h-4 rotate-180" />
            <span>Return to Role Tracks</span>
          </button>
        </div>
      </div>
    );
  }

  if (!session || !activeQuestion) {
    return (
      <div className="min-h-[85vh] bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-slate-100 py-6 px-4 sm:px-6 lg:px-8 max-w-5xl xl:max-w-7xl mx-auto space-y-6 animate-pulse">
        <div className="h-16 bg-slate-200 dark:bg-slate-900 rounded-2xl w-full border border-slate-300 dark:border-slate-800" />
        <div className="h-44 bg-slate-200 dark:bg-slate-900 rounded-3xl w-full border border-slate-300 dark:border-slate-800" />
        <div className="h-64 bg-slate-200 dark:bg-slate-900 rounded-3xl w-full border border-slate-300 dark:border-slate-800" />
      </div>
    );
  }

  const displayedQuestion = activeQuestion;
  const questionsList = session.questions || [];
  const currentQuestionNumber = displayedQuestion.orderIndex || questionsList.length;
  const totalQuestions = Number(session.totalQuestionsCount) > 0 ? Number(session.totalQuestionsCount) : 3;
  const progressPercent = Math.round((currentQuestionNumber / totalQuestions) * 100);

  const minutes = Math.floor(timeLeft / 60);
  const seconds = timeLeft % 60;
  const formattedTime = `${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;

  return (
    <div className="w-full min-h-[calc(100vh-4rem)] bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-slate-100 py-6 px-4 sm:px-6 lg:px-8 transition-colors">
      <div className="max-w-6xl xl:max-w-7xl mx-auto space-y-6">
      {/* Top Session Progress Bar & Controls */}
      <div className="bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 rounded-3xl p-5 sm:p-6 space-y-4 shadow-xs">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="w-11 h-11 rounded-2xl bg-indigo-600 text-white flex items-center justify-center font-black text-sm shadow-md">
              {currentQuestionNumber}/{totalQuestions}
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="text-xs font-black text-slate-900 dark:text-white uppercase tracking-wider">{session.track}</span>
                <span className="text-[10px] bg-indigo-50 dark:bg-indigo-950 text-indigo-700 dark:text-indigo-300 px-2 py-0.5 rounded-full border border-indigo-200 dark:border-indigo-800 font-bold">
                  {session.difficulty}
                </span>
                {session.companyPreset && (
                  <span className="text-[10px] bg-emerald-50 dark:bg-emerald-950 text-emerald-700 dark:text-emerald-300 px-2 py-0.5 rounded-full border border-emerald-200 dark:border-emerald-800 font-bold">
                    {session.companyPreset}
                  </span>
                )}
              </div>
              <p className="text-xs text-slate-500 dark:text-slate-400 font-medium">
                Question {currentQuestionNumber} of {totalQuestions} • {progressPercent}% Progress
              </p>
            </div>
          </div>

          {/* Controls: Mic Settings, Shortcuts & Countdown Timer */}
          <div className="flex flex-wrap items-center gap-2">
            <button
              onClick={() => setIsAudioModalOpen(true)}
              className="p-2.5 rounded-xl bg-slate-100 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 text-slate-700 dark:text-slate-300 hover:text-indigo-600 dark:hover:text-indigo-400 font-bold text-xs flex items-center gap-1.5 transition"
              title="Camera & Microphone Device Settings"
            >
              <Camera className="w-4 h-4 text-indigo-500" />
              <span className="hidden md:inline">Cam & Mic</span>
            </button>

            <button
              onClick={() => setIsShortcutsModalOpen(true)}
              className="p-2.5 rounded-xl bg-slate-100 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 text-slate-700 dark:text-slate-300 hover:text-indigo-600 dark:hover:text-indigo-400 font-bold text-xs flex items-center gap-1.5 transition"
              title="Global Keyboard Shortcuts (Shift + ?)"
            >
              <Keyboard className="w-4 h-4 text-indigo-500" />
              <span className="hidden md:inline">Shortcuts</span>
              <kbd className="text-[10px] bg-slate-200 dark:bg-slate-800 px-1.5 py-0.5 rounded font-mono font-bold">?</kbd>
            </button>

            {/* Countdown Timer Badge */}
            <div className={`flex items-center gap-2 px-3.5 py-2 rounded-xl border font-mono text-xs font-bold transition-all shadow-xs ${
              timeLeft < 30
                ? 'bg-rose-50 dark:bg-rose-950/80 border-rose-300 dark:border-rose-500 text-rose-700 dark:text-rose-300 ring-2 ring-rose-500/20 animate-pulse'
                : 'bg-slate-900 text-white dark:bg-slate-950 dark:text-slate-200 border-slate-800 dark:border-slate-800'
            }`}>
              <Clock className={`w-4 h-4 ${timeLeft < 30 ? 'text-rose-500 animate-spin' : 'text-amber-400'}`} />
              <div className="flex flex-col text-left leading-none">
                <span className="text-[9px] uppercase tracking-wider text-slate-400 font-mono">Time Left</span>
                <span className="text-sm font-black">{formattedTime}</span>
              </div>
            </div>
          </div>
        </div>

        {/* Visual Progress Bar & Step Indicators */}
        <div className="space-y-2 pt-1 border-t border-slate-100 dark:border-slate-800">
          <div className="flex items-center justify-between text-xs font-bold text-slate-600 dark:text-slate-400">
            <span>Question Track Progress</span>
            <span>{questionsList.filter(q => q.answer).length} / {totalQuestions} Answered</span>
          </div>

          <div className="w-full bg-slate-100 dark:bg-slate-800 h-2.5 rounded-full overflow-hidden flex">
            <div
              className="bg-gradient-to-r from-indigo-500 via-purple-500 to-emerald-500 h-full transition-all duration-500 rounded-full"
              style={{ width: `${progressPercent}%` }}
            />
          </div>

          {/* Step Indicators */}
          <div className="grid grid-cols-4 sm:grid-cols-6 lg:grid-cols-8 gap-2 pt-1">
            {[...Array(totalQuestions)].map((_, idx) => {
              const qNum = idx + 1;
              const isDone = qNum < currentQuestionNumber;
              const isCurrent = qNum === currentQuestionNumber;

              return (
                <div
                  key={idx}
                  className={`py-1.5 px-2 rounded-xl border text-center text-[11px] font-extrabold flex items-center justify-center gap-1 transition-all ${
                    isDone
                      ? 'bg-emerald-50 dark:bg-emerald-950/60 border-emerald-200 dark:border-emerald-800/80 text-emerald-700 dark:text-emerald-300'
                      : isCurrent
                      ? 'bg-indigo-600 border-indigo-500 text-white shadow-sm ring-2 ring-indigo-500/30'
                      : 'bg-slate-50 dark:bg-slate-950 border-slate-200 dark:border-slate-800 text-slate-400'
                  }`}
                >
                  {isDone ? (
                    <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400" />
                  ) : (
                    <span>Q{qNum}</span>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      </div>

      {error && (
        <div className="p-4 bg-rose-50 dark:bg-rose-950/80 border border-rose-200 dark:border-rose-500/50 rounded-xl text-xs text-rose-800 dark:text-rose-200 flex items-center gap-3 font-medium">
          <AlertCircle className="w-5 h-5 text-rose-600 dark:text-rose-400 shrink-0" />
          <span>{error}</span>
        </div>
      )}

      {/* Real-Time Exam Tab & Window Focus Proctoring HUD */}
      <TabProctoringHUD
        sessionId={id}
        onProctoringUpdate={(report) => setLatestProctoringReport(report)}
      />

      {/* Live AI Interviewer Persona & Candidate Webcam Proctoring Stage */}
      <CameraVideoStage
        isRecording={isRecording}
        isSpeaking={isSpeaking}
        selectedVoiceProfile={selectedVoiceProfile}
        trackName={session.track}
        difficulty={session.difficulty}
        companyPreset={session.companyPreset}
        candidateName={user?.name || 'Candidate'}
        onToggleMicRecording={isRecording ? stopRecording : startRecording}
        onOpenDeviceSettings={() => setIsAudioModalOpen(true)}
      />

      {/* Core Question Card */}
      <div className="bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 rounded-3xl p-6 sm:p-8 space-y-6 shadow-xs relative overflow-hidden">
        <div className="flex items-center justify-between pb-4 border-b border-slate-200 dark:border-slate-800">
          <div className="flex items-center gap-2">
            <BrainCircuit className="w-5 h-5 text-indigo-600 dark:text-indigo-400" />
            <span className="text-xs font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider">
              {displayedQuestion.questionType.replace('_', ' ')}
            </span>
            {displayedQuestion.isFollowup && (
              <span className="bg-amber-50 dark:bg-amber-500/20 text-amber-800 dark:text-amber-300 border border-amber-200 dark:border-amber-500/30 text-[10px] px-2.5 py-0.5 rounded-full font-bold animate-pulse">
                Probing Follow-Up
              </span>
            )}
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={() => setIsVoiceModalOpen(true)}
              className="p-2 rounded-xl text-xs font-bold flex items-center gap-1.5 transition bg-slate-100 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 text-slate-700 dark:text-slate-300 hover:text-indigo-600 dark:hover:text-indigo-400"
              title="Change Interviewer Voice & Speech Settings (Alt + V)"
            >
              <Settings2 className="w-4 h-4 text-purple-500" />
              <span className="hidden sm:inline">{selectedVoiceProfile.name} Voice</span>
            </button>

            <button
              onClick={toggleTTS}
              className={`p-2 rounded-xl text-xs font-bold flex items-center gap-1.5 transition ${
                isSpeaking
                  ? 'bg-slate-900 text-white dark:bg-indigo-600 dark:text-white animate-pulse'
                  : 'bg-slate-100 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 text-slate-700 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white'
              }`}
              title="Read Question Aloud (Alt + S)"
            >
              {isSpeaking ? <VolumeX className="w-4 h-4 text-amber-400" /> : <Volume2 className="w-4 h-4 text-indigo-600 dark:text-indigo-400" />}
              <span>{isSpeaking ? 'Stop Audio' : 'Read Aloud'}</span>
            </button>
          </div>
        </div>

        {/* Question Text */}
        <div className="text-xl sm:text-2xl font-bold text-slate-900 dark:text-white leading-relaxed">
          "{displayedQuestion.questionText}"
        </div>
      </div>

      {/* Answer Input Section */}
      <div className="bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 rounded-3xl p-6 sm:p-8 space-y-6 shadow-xs">
        <div className="flex items-center justify-between">
          <h3 className="text-sm font-bold text-slate-800 dark:text-slate-200 uppercase tracking-wider flex items-center gap-2">
            Your Spoken or Written Response
          </h3>

          <div className="flex items-center gap-2 bg-slate-100 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 p-1 rounded-xl text-xs">
            <button
              type="button"
              onClick={() => setInputMode('mic')}
              className={`px-3 py-1.5 rounded-lg font-bold transition flex items-center gap-1.5 ${
                inputMode === 'mic' ? 'bg-slate-900 dark:bg-indigo-600 text-white font-bold' : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
              }`}
            >
              <Mic className="w-3.5 h-3.5" />
              Voice Record
            </button>
            <button
              type="button"
              onClick={() => setInputMode('text')}
              className={`px-3 py-1.5 rounded-lg font-bold transition flex items-center gap-1.5 ${
                inputMode === 'text' ? 'bg-slate-900 dark:bg-indigo-600 text-white font-bold' : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
              }`}
            >
              <Keyboard className="w-3.5 h-3.5" />
              Type Text
            </button>
          </div>
        </div>

        {/* Voice Recording View */}
        {inputMode === 'mic' && (
          <div className="space-y-4">
            <div className="bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-2xl p-6 flex flex-col items-center justify-center space-y-4">
              {/* Visualizer Canvas */}
              <canvas
                ref={canvasRef}
                width={300}
                height={60}
                className="w-full max-w-xs h-16 bg-white dark:bg-slate-900/50 rounded-xl border border-slate-200 dark:border-transparent"
              />

              <div className="flex items-center gap-4">
                {!isRecording ? (
                  <button
                    onClick={startRecording}
                    className="px-6 py-3 bg-rose-600 hover:bg-rose-500 text-white font-bold rounded-2xl shadow-sm transition flex items-center gap-2 text-sm"
                  >
                    <Mic className="w-5 h-5 animate-pulse" />
                    <span>Start Recording Answer</span>
                  </button>
                ) : (
                  <button
                    onClick={stopRecording}
                    className="px-6 py-3 bg-slate-900 hover:bg-slate-800 dark:bg-slate-800 dark:hover:bg-slate-700 border border-slate-800 text-white font-bold rounded-2xl transition flex items-center gap-2 text-sm"
                  >
                    <MicOff className="w-5 h-5 text-rose-400" />
                    <span>Stop Recording</span>
                  </button>
                )}
              </div>

              {isRecording && (
                <p className="text-xs text-rose-600 dark:text-rose-400 font-bold flex items-center gap-1.5 animate-pulse">
                  <span className="w-2 h-2 rounded-full bg-rose-500" />
                  Recording live audio... speak clearly into your microphone.
                </p>
              )}

              {audioBlobUrl && !isRecording && (
                <div className="w-full max-w-md pt-2 space-y-2 text-center">
                  <p className="text-xs text-emerald-700 dark:text-emerald-400 font-bold flex items-center justify-center gap-1">
                    <CheckCircle2 className="w-4 h-4" /> Answer audio recorded successfully!
                  </p>
                  <audio controls src={audioBlobUrl} className="w-full h-9 rounded-lg" />
                </div>
              )}
            </div>
          </div>
        )}

        {/* Text Input Option / Fallback */}
        {(inputMode === 'text' || recordedAudioBase64) && (
          <div className="space-y-2">
            <label className="block text-xs font-bold text-slate-700 dark:text-slate-400">
              {recordedAudioBase64 ? 'Additional Text or Code Snippet (Optional):' : 'Type your answer:'}
            </label>
            <textarea
              value={textAnswer}
              onChange={(e) => setTextAnswer(e.target.value)}
              placeholder="Type your response or system design approach here..."
              rows={4}
              className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-2xl p-4 text-xs text-slate-900 dark:text-white placeholder-slate-400 outline-none focus:border-slate-900 dark:focus:border-indigo-500 font-medium transition resize-none shadow-xs"
            />
          </div>
        )}

        {/* Submit Button */}
        <div className="pt-2 flex justify-end">
          <button
            onClick={handleSubmitAnswer}
            disabled={isSubmitting || (!recordedAudioBase64 && !textAnswer.trim())}
            className="w-full sm:w-auto px-8 py-3.5 bg-slate-900 hover:bg-slate-800 dark:bg-indigo-600 dark:hover:bg-indigo-500 disabled:opacity-40 text-white font-extrabold rounded-xl shadow-md transition flex items-center justify-center gap-2 text-sm"
          >
            {isSubmitting ? (
              <span className="flex items-center gap-2">
                <Sparkles className="w-4 h-4 text-amber-300 animate-spin" />
                Evaluating the answer...
              </span>
            ) : (
              <>
                <span>Submit Answer</span>
                <Send className="w-4 h-4" />
              </>
            )}
          </button>
        </div>
      </div>

      {/* Voice Settings Modal */}
      <TtsVoiceSettingsModal
        isOpen={isVoiceModalOpen}
        onClose={() => setIsVoiceModalOpen(false)}
        selectedProfileId={selectedVoiceProfile.id}
        onSelectProfile={(profile) => setSelectedVoiceProfile(profile)}
        pitch={ttsPitch}
        setPitch={setTtsPitch}
        rate={ttsRate}
        setRate={setTtsRate}
        autoRead={autoReadQuestion}
        setAutoRead={setAutoReadQuestion}
      />

      {/* Keyboard Shortcuts Modal */}
      <KeyboardShortcutsModal
        isOpen={isShortcutsModalOpen}
        onClose={() => setIsShortcutsModalOpen(false)}
      />

      {/* Audio & Mic Settings Modal */}
      <AudioSettingsModal
        isOpen={isAudioModalOpen}
        onClose={() => setIsAudioModalOpen(false)}
      />
    </div>
  </div>
);
};
