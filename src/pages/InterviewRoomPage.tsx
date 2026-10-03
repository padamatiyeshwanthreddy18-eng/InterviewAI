import React, { useState, useEffect, useRef } from 'react';
import { useParams, useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { InterviewSession, InterviewQuestion, QuestionWithAnswer } from '../types';
import { TtsVoiceSettingsModal, VOICE_PROFILES, VoiceProfile } from '../components/TtsVoiceSettingsModal';
import { KeyboardShortcutsModal } from '../components/KeyboardShortcutsModal';
import { AudioSettingsModal } from '../components/AudioSettingsModal';
import { CameraVideoStage } from '../components/CameraVideoStage';
import { TabProctoringHUD } from '../components/TabProctoringHUD';
import { ProctoringReport } from '../types';
import {
  GlassCard,
  VoiceOrb,
  PillButton,
  PrimaryButton,
  Badge,
} from '../components/ui';
import {
  Mic,
  MicOff,
  Camera,
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
  Play,
  RotateCcw,
  LogOut,
} from 'lucide-react';
import {
  createFirestoreSession,
  appendTranscriptTurn,
  completeFirestoreSession,
  abandonFirestoreSession,
} from '../services/dataService';

export const InterviewRoomPage: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const { token, user, isLoading: isAuthLoading } = useAuth();
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

  const sessionStartTimeRef = useRef<number>(Date.now());
  const hasInitializedFirestoreRef = useRef<boolean>(false);

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
        setSession(data.session);

        if (data.session.questions && data.session.questions.length > 0) {
          const unanswered = data.session.questions.find((q: QuestionWithAnswer) => !q.answer);
          setCurrentQuestion(unanswered || data.session.questions[data.session.questions.length - 1]);
        }
      } catch (err) {
        console.error('Failed to load session:', err);
        if (!session && !activeQuestion) {
          setError('Network error loading session.');
        }
      }
    };

    fetchSession();
  }, [id, token, isAuthLoading]);

  // Ensure session document exists in Firestore (users/{userId}/sessions/{sessionId})
  useEffect(() => {
    if (!id || !user?.uid || !session || hasInitializedFirestoreRef.current) return;
    hasInitializedFirestoreRef.current = true;

    createFirestoreSession(user.uid, {
      sessionId: id,
      roleTrack: session.track,
      difficulty: session.difficulty,
      companyPreset: session.companyPreset,
      jobDescription: session.jobDescription,
      totalQuestionsCount: session.totalQuestionsCount || 3,
      initialQuestionText: activeQuestion?.questionText,
      initialQuestionType: activeQuestion?.questionType,
    }).catch((err) => {
      console.warn('Firestore initial session sync note (offline fallback):', err);
    });
  }, [id, user?.uid, session, activeQuestion]);

  // Reset timer on question change
  useEffect(() => {
    setTimeLeft(120);
    setRecordedAudioBase64(null);
    setAudioBlobUrl(null);
    setTextAnswer('');
  }, [activeQuestion?.id]);

  // Countdown Timer
  useEffect(() => {
    if (timeLeft <= 0) return;
    const timer = setInterval(() => {
      setTimeLeft((prev) => prev - 1);
    }, 1000);
    return () => clearInterval(timer);
  }, [timeLeft]);

  // Read Question Aloud via Web Speech API (TTS)
  const speakQuestion = (text: string) => {
    if (!('speechSynthesis' in window)) return;

    window.speechSynthesis.cancel();

    const utterance = new SpeechSynthesisUtterance(text);
    utterance.rate = ttsRate;
    utterance.pitch = ttsPitch;

    const voices = window.speechSynthesis.getVoices();
    if (voices.length > 0) {
      let targetVoice = null;
      if (selectedVoiceProfile.gender === 'female') {
        targetVoice = voices.find((v) =>
          /female|woman|samantha|zira|karen|victoria|moira|fiona/i.test(v.name)
        );
      } else {
        targetVoice = voices.find((v) =>
          /male|man|david|alex|daniel|george|fred/i.test(v.name)
        );
      }
      utterance.voice = targetVoice || voices.find((v) => v.lang.startsWith('en')) || voices[0];
    }

    utterance.onstart = () => setIsSpeaking(true);
    utterance.onend = () => setIsSpeaking(false);
    utterance.onerror = () => setIsSpeaking(false);

    window.speechSynthesis.speak(utterance);
  };

  const stopTTS = () => {
    if ('speechSynthesis' in window) {
      window.speechSynthesis.cancel();
      setIsSpeaking(false);
    }
  };

  const toggleTTS = () => {
    if (isSpeaking) {
      stopTTS();
    } else if (activeQuestion) {
      speakQuestion(activeQuestion.questionText);
    }
  };

  // Auto-read on new question
  useEffect(() => {
    if (activeQuestion && autoReadQuestion) {
      const timer = setTimeout(() => {
        speakQuestion(activeQuestion.questionText);
      }, 700);
      return () => clearTimeout(timer);
    }
  }, [activeQuestion?.id, autoReadQuestion]);

  // Stop TTS on unmount
  useEffect(() => {
    return () => {
      if ('speechSynthesis' in window) {
        window.speechSynthesis.cancel();
      }
    };
  }, []);

  // Audio Visualizer Loop
  const startVisualizer = (stream: MediaStream) => {
    try {
      const AudioCtxClass = window.AudioContext || (window as any).webkitAudioContext;
      const audioCtx = new AudioCtxClass();
      const analyser = audioCtx.createAnalyser();
      analyser.fftSize = 64;

      const source = audioCtx.createMediaStreamSource(stream);
      source.connect(analyser);

      audioCtxRef.current = audioCtx;
      analyserRef.current = analyser;

      const bufferLength = analyser.frequencyBinCount;
      const dataArray = new Uint8Array(bufferLength);

      const draw = () => {
        animFrameRef.current = requestAnimationFrame(draw);
        if (!canvasRef.current) return;
        const canvas = canvasRef.current;
        const ctx = canvas.getContext('2d');
        if (!ctx) return;

        analyser.getByteFrequencyData(dataArray);

        ctx.clearRect(0, 0, canvas.width, canvas.height);

        const barWidth = (canvas.width / bufferLength) * 1.5;
        let x = 0;

        for (let i = 0; i < bufferLength; i++) {
          const barHeight = (dataArray[i] / 255) * canvas.height;
          // Violet Dusk Mauve to Peach audio bar
          ctx.fillStyle = `rgba(147, 80, 115, ${dataArray[i] / 255 + 0.25})`;
          ctx.fillRect(x, canvas.height - barHeight, barWidth, barHeight);
          x += barWidth + 2;
        }
      };

      draw();
    } catch (e) {
      console.warn('Audio Visualizer setup error:', e);
    }
  };

  const stopVisualizer = () => {
    if (animFrameRef.current) cancelAnimationFrame(animFrameRef.current);
    if (audioCtxRef.current && audioCtxRef.current.state !== 'closed') {
      audioCtxRef.current.close().catch(() => {});
    }
    if (canvasRef.current) {
      const ctx = canvasRef.current.getContext('2d');
      if (ctx) ctx.clearRect(0, 0, canvasRef.current.width, canvasRef.current.height);
    }
  };

  // Start Mic Recording
  const startRecording = async () => {
    setError(null);
    stopTTS();

    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      recordingStreamRef.current = stream;

      const mediaRecorder = new MediaRecorder(stream, {
        mimeType: MediaRecorder.isTypeSupported('audio/webm')
          ? 'audio/webm'
          : MediaRecorder.isTypeSupported('audio/mp4')
          ? 'audio/mp4'
          : '',
      });

      mediaRecorderRef.current = mediaRecorder;
      audioChunksRef.current = [];

      mediaRecorder.ondataavailable = (event) => {
        if (event.data.size > 0) {
          audioChunksRef.current.push(event.data);
        }
      };

      mediaRecorder.onstop = () => {
        const audioBlob = new Blob(audioChunksRef.current, { type: mediaRecorder.mimeType || 'audio/webm' });
        const blobUrl = URL.createObjectURL(audioBlob);
        setAudioBlobUrl(blobUrl);

        const reader = new FileReader();
        reader.onloadend = () => {
          const base64String = (reader.result as string).split(',')[1];
          setRecordedAudioBase64(base64String);
        };
        reader.readAsDataURL(audioBlob);

        if (recordingStreamRef.current) {
          recordingStreamRef.current.getTracks().forEach((track) => track.stop());
        }
        stopVisualizer();
      };

      mediaRecorder.start(250);
      setIsRecording(true);
      startVisualizer(stream);
    } catch (err: any) {
      console.error('Error accessing microphone:', err);
      setError('Microphone access denied. You can still type your answer in text mode.');
      setInputMode('text');
    }
  };

  // Stop Mic Recording
  const stopRecording = () => {
    if (mediaRecorderRef.current && isRecording) {
      mediaRecorderRef.current.stop();
      setIsRecording(false);
    }
  };

  // Submit Answer
  const handleSubmitAnswer = async () => {
    if (!activeQuestion) return;
    if (isRecording) {
      stopRecording();
    }

    if (!recordedAudioBase64 && !textAnswer.trim()) {
      setError('Please record audio or type your answer before submitting.');
      return;
    }

    setIsSubmitting(true);
    setError(null);
    stopTTS();

    const activeToken = localStorage.getItem('interview_ai_token') || token;

    try {
      const res = await fetch(`/api/sessions/${id}/submit-answer`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${activeToken}`,
        },
        body: JSON.stringify({
          questionId: activeQuestion.id,
          audioBase64: recordedAudioBase64 || undefined,
          textAnswer: textAnswer.trim() || undefined,
          proctoringReport: latestProctoringReport || undefined,
        }),
      });

      if (!res.ok) {
        const errData = await res.json();
        throw new Error(errData.error || 'Failed to submit answer');
      }

      const data = await res.json();

      // Real-time Firestore sync of candidate answer and next prompt
      if (user?.uid && id) {
        const answeredCount = (data.session?.questions?.filter((q: any) => q.answer).length || 1);
        const finalAnswer = textAnswer || 'Candidate provided spoken response';
        appendTranscriptTurn(user.uid, id, {
          turnId: `turn-${answeredCount * 2}`,
          speaker: 'user',
          text: data.answer?.transcriptText || finalAnswer,
          order: answeredCount * 2,
          questionId: activeQuestion.id,
          technicalScore: data.evaluation?.technicalScore,
          communicationScore: data.evaluation?.communicationScore,
          aiFeedback: data.evaluation?.aiFeedback,
        }).catch((e) => console.warn('Transcript turn sync note:', e));

        if (data.nextQuestion) {
          appendTranscriptTurn(user.uid, id, {
            turnId: `turn-${answeredCount * 2 + 1}`,
            speaker: 'ai',
            text: data.nextQuestion.questionText,
            order: answeredCount * 2 + 1,
            questionId: data.nextQuestion.id,
          }).catch((e) => console.warn('Next question turn sync note:', e));
        }

        if (data.isFinished || data.isSessionCompleted) {
          const elapsedSeconds = Math.max(1, Math.round((Date.now() - sessionStartTimeRef.current) / 1000));
          completeFirestoreSession(user.uid, id, {
            overallScore: data.session?.overallScore ?? data.evaluation?.technicalScore ?? 80,
            technicalScore: data.evaluation?.technicalScore,
            communicationScore: data.evaluation?.communicationScore,
            sentimentScore: data.evaluation?.sentimentScore,
            feedbackSummary: data.evaluation?.aiFeedback || '',
            strengths: data.session?.strengths,
            weaknesses: data.session?.weaknesses,
            improvements: data.session?.improvementPlan?.suggestedPractice,
            durationSeconds: elapsedSeconds,
            proctoring: latestProctoringReport || undefined,
          }).catch((e) => console.warn('Complete session sync note:', e));
        }
      }

      if (data.isFinished || data.isSessionCompleted) {
        navigate(`/results/${id}`);
      } else {
        setSession(data.session);
        setCurrentQuestion(data.nextQuestion);
        setRecordedAudioBase64(null);
        setAudioBlobUrl(null);
        setTextAnswer('');
      }
    } catch (err: any) {
      console.error('Error submitting answer:', err);
      setError(err.message || 'Error evaluating answer. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleAbandonInterview = async () => {
    const confirmLeave = window.confirm(
      'Exit interview round early? Your answered questions and transcript will be saved to your dashboard as an unfinished session.'
    );
    if (!confirmLeave) return;

    stopRecording();
    stopTTS();

    if (user?.uid && id) {
      const elapsedSeconds = Math.max(1, Math.round((Date.now() - sessionStartTimeRef.current) / 1000));
      try {
        await abandonFirestoreSession(user.uid, id, elapsedSeconds);
      } catch (e) {
        console.warn('Abandon session note:', e);
      }
    }

    navigate('/dashboard');
  };

  // Global Keyboard Shortcuts
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      const target = e.target as HTMLElement;
      const isTyping = target.tagName === 'INPUT' || target.tagName === 'TEXTAREA';

      if (e.code === 'Space' && !isTyping) {
        e.preventDefault();
        if (isRecording) {
          stopRecording();
        } else {
          startRecording();
        }
        return;
      }

      if ((e.ctrlKey || e.metaKey) && e.key === 'Enter') {
        e.preventDefault();
        handleSubmitAnswer();
        return;
      }

      if (e.altKey && e.code === 'KeyR') {
        e.preventDefault();
        if (isRecording) stopRecording();
        else startRecording();
        return;
      }

      if (e.altKey && e.code === 'KeyS') {
        e.preventDefault();
        toggleTTS();
        return;
      }

      if (e.altKey && e.code === 'KeyV') {
        e.preventDefault();
        setIsVoiceModalOpen((prev) => !prev);
        return;
      }

      if (e.key === '?' && !isTyping) {
        e.preventDefault();
        setIsShortcutsModalOpen((prev) => !prev);
        return;
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isRecording, recordedAudioBase64, textAnswer, isSubmitting, activeQuestion]);

  if (error && (!session || !activeQuestion)) {
    return (
      <div className="min-h-[80vh] flex flex-col items-center justify-center p-6 text-center max-w-md mx-auto space-y-4 text-[#F8F4E9]">
        <div className="w-14 h-14 rounded-2xl bg-[rgba(229,115,115,0.15)] border border-[rgba(229,115,115,0.3)] text-[#E57373] flex items-center justify-center shadow-lg">
          <AlertCircle className="w-7 h-7" />
        </div>
        <h2 className="text-xl font-black text-[#F8F4E9]">Interview Session Notice</h2>
        <p className="text-xs text-[rgba(248,244,233,0.7)] leading-relaxed font-medium">{error}</p>
        <PrimaryButton
          onClick={() => navigate('/track-selection')}
          icon={<ArrowRight className="w-4 h-4 rotate-180" />}
          size="md"
        >
          Return to Role Tracks
        </PrimaryButton>
      </div>
    );
  }

  if (!session || !activeQuestion) {
    return (
      <div className="min-h-[85vh] py-6 px-4 sm:px-6 lg:px-8 max-w-6xl mx-auto space-y-6 animate-pulse text-[#F8F4E9]">
        <div className="h-16 bg-[rgba(42,27,51,0.6)] rounded-3xl w-full border border-[rgba(248,244,233,0.08)]" />
        <div className="h-96 bg-[rgba(42,27,51,0.6)] rounded-3xl w-full border border-[rgba(248,244,233,0.08)]" />
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
    <div className="w-full min-h-[calc(100vh-4rem)] py-6 px-4 sm:px-6 lg:px-8 text-[#F8F4E9] relative">
      <div className="max-w-7xl mx-auto space-y-6">
        {/* TOP STATUS BAR: Question Progress & Timer Pill Widgets */}
        <GlassCard className="p-4 sm:p-5 flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-gradient-to-tr from-[#502D55] to-[#935073] border border-[rgba(246,219,192,0.3)] flex items-center justify-center font-black text-sm text-[#F8F4E9] shadow-[0_0_12px_rgba(147,80,115,0.4)]">
              {currentQuestionNumber}/{totalQuestions}
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="text-xs font-black uppercase tracking-wider text-[#F8F4E9]">
                  {session.track}
                </span>
                <Badge variant="peach" size="sm">
                  {session.difficulty}
                </Badge>
                {session.companyPreset && (
                  <Badge variant="mint" size="sm">
                    {session.companyPreset}
                  </Badge>
                )}
              </div>
              <p className="text-[11px] text-[rgba(248,244,233,0.5)] font-mono">
                Question {currentQuestionNumber} of {totalQuestions} · {progressPercent}% Completed
              </p>
            </div>
          </div>

          {/* Quick Pill Controls: Cam/Mic, Shortcuts, Countdown Timer */}
          <div className="flex flex-wrap items-center gap-2.5">
            <PillButton
              onClick={() => setIsAudioModalOpen(true)}
              icon={<Camera className="w-3.5 h-3.5 text-[#F6DBC0]" />}
              size="sm"
            >
              <span className="hidden sm:inline">Cam & Mic</span>
            </PillButton>

            <PillButton
              onClick={() => setIsShortcutsModalOpen(true)}
              icon={<Keyboard className="w-3.5 h-3.5 text-[#F6DBC0]" />}
              size="sm"
            >
              <span className="hidden sm:inline">Shortcuts</span>
              <kbd className="text-[9px] bg-[rgba(248,244,233,0.1)] px-1 rounded font-mono">?</kbd>
            </PillButton>

            {/* Countdown Timer Pill Widget */}
            <div
              className={`flex items-center gap-2 px-3.5 py-1.5 rounded-full border font-mono text-xs font-bold transition-all shadow-sm ${
                timeLeft < 30
                  ? 'bg-[rgba(229,115,115,0.2)] border-[rgba(229,115,115,0.5)] text-[#E57373] animate-pulse shadow-[0_0_15px_rgba(229,115,115,0.4)]'
                  : 'bg-[rgba(26,15,34,0.7)] border-[rgba(248,244,233,0.1)] text-[#F8F4E9]'
              }`}
            >
              <Clock className={`w-3.5 h-3.5 ${timeLeft < 30 ? 'text-[#E57373]' : 'text-[#F6DBC0]'}`} />
              <span className="text-[10px] text-[rgba(248,244,233,0.5)] uppercase tracking-wider">Time</span>
              <span className="font-dot text-sm text-[#F6DBC0] tabular-nums font-black">{formattedTime}</span>
            </div>

            <PillButton
              onClick={handleAbandonInterview}
              icon={<LogOut className="w-3.5 h-3.5 text-[#E57373]" />}
              size="sm"
            >
              <span className="text-[#E57373] font-bold">Exit Round</span>
            </PillButton>
          </div>
        </GlassCard>

        {/* Real-Time Exam Proctoring HUD */}
        <TabProctoringHUD
          sessionId={id}
          onProctoringUpdate={(report) => setLatestProctoringReport(report)}
        />

        {/* Camera Stage */}
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

        {/* MAIN STAGE BENTO GRID: Voice Orb Center Stage (left) + Glass Side Panel Transcript & Question (right) */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          {/* CENTRE STAGE: LARGE ANIMATED VOICE ORB / WAVEFORM (7 Cols) */}
          <GlassCard className="lg:col-span-7 flex flex-col items-center justify-between p-8 text-center relative overflow-hidden min-h-[460px]">
            {/* Top voice persona status */}
            <div className="w-full flex items-center justify-between pb-4 border-b border-[rgba(248,244,233,0.06)]">
              <div className="flex items-center gap-2">
                <div className={`w-2.5 h-2.5 rounded-full ${isSpeaking ? 'bg-[#F6DBC0] animate-ping' : isRecording ? 'bg-[#7FE3B9] animate-pulse' : 'bg-[#935073]'}`} />
                <span className="text-xs font-bold uppercase tracking-wider text-[rgba(248,244,233,0.7)]">
                  {isSpeaking ? 'AI Voice Coach Speaking' : isRecording ? 'Recording Your Spoken Answer' : 'Listening & Standing By'}
                </span>
              </div>

              <button
                onClick={() => setIsVoiceModalOpen(true)}
                className="flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold text-[#F6DBC0] bg-[rgba(147,80,115,0.2)] border border-[rgba(147,80,115,0.3)] hover:bg-[rgba(147,80,115,0.35)] transition-all cursor-pointer"
              >
                <Settings2 className="w-3.5 h-3.5" />
                <span>{selectedVoiceProfile.name}</span>
              </button>
            </div>

            {/* Central Animated Voice Orb */}
            <div className="my-auto py-6 flex flex-col items-center justify-center">
              <VoiceOrb
                isSpeaking={isSpeaking}
                isRecording={isRecording}
                audioLevel={isRecording ? 0.6 : isSpeaking ? 0.8 : 0.15}
                size={230}
                onClick={isRecording ? stopRecording : startRecording}
              />

              <span className="text-xs font-bold text-[rgba(248,244,233,0.6)] mt-4">
                {isRecording ? (
                  <span className="text-[#7FE3B9] font-bold flex items-center gap-1.5">
                    <span className="w-2 h-2 rounded-full bg-[#7FE3B9] animate-ping" />
                    Recording live microphone... click orb to finish speaking
                  </span>
                ) : isSpeaking ? (
                  <span className="text-[#F6DBC0] font-bold flex items-center gap-1.5">
                    <Volume2 className="w-4 h-4 animate-bounce" />
                    AI Coach speaking prompt aloud...
                  </span>
                ) : (
                  'Click orb or press Spacebar to start speaking'
                )}
              </span>
            </div>

            {/* Visualizer canvas */}
            <div className="w-full max-w-sm flex flex-col items-center">
              <canvas
                ref={canvasRef}
                width={320}
                height={48}
                className="w-full h-12 rounded-xl bg-[rgba(26,15,34,0.4)] border border-[rgba(248,244,233,0.04)]"
              />
            </div>
          </GlassCard>

          {/* GLASS SIDE PANEL: QUESTION & LIVE TRANSCRIPT (5 Cols) */}
          <GlassCard className="lg:col-span-5 flex flex-col justify-between p-6 sm:p-7 space-y-5">
            {/* Question Header */}
            <div>
              <div className="flex items-center justify-between pb-3 border-b border-[rgba(248,244,233,0.06)] mb-4">
                <div className="flex items-center gap-2">
                  <BrainCircuit className="w-4 h-4 text-[#F6DBC0]" />
                  <span className="text-xs font-bold uppercase tracking-wider text-[rgba(248,244,233,0.7)]">
                    {displayedQuestion.questionType.replace('_', ' ')}
                  </span>
                </div>

                <button
                  onClick={toggleTTS}
                  className="flex items-center gap-1 text-xs font-bold text-[#F6DBC0] hover:text-[#F8F4E9] transition-colors cursor-pointer"
                >
                  {isSpeaking ? <VolumeX className="w-4 h-4 text-[#F6DBC0]" /> : <Volume2 className="w-4 h-4 text-[#F6DBC0]" />}
                  <span>{isSpeaking ? 'Stop Audio' : 'Read Aloud'}</span>
                </button>
              </div>

              <h2 className="text-lg sm:text-xl font-bold text-[#F8F4E9] leading-snug">
                "{displayedQuestion.questionText}"
              </h2>

              {displayedQuestion.isFollowup && (
                <div className="mt-2.5">
                  <Badge variant="peach" size="sm">
                    Adaptive Follow-Up Question
                  </Badge>
                </div>
              )}
            </div>

            {/* Answer Mode Switcher */}
            <div className="flex items-center justify-between pt-2 border-t border-[rgba(248,244,233,0.06)]">
              <span className="text-xs font-bold text-[rgba(248,244,233,0.7)] uppercase tracking-wider">
                Response Mode
              </span>

              <div className="flex items-center gap-1 bg-[rgba(26,15,34,0.7)] border border-[rgba(248,244,233,0.08)] p-1 rounded-full text-xs">
                <button
                  type="button"
                  onClick={() => setInputMode('mic')}
                  className={`px-3 py-1 rounded-full font-bold transition-all flex items-center gap-1.5 cursor-pointer ${
                    inputMode === 'mic'
                      ? 'bg-[#935073] text-[#F8F4E9] shadow-sm'
                      : 'text-[rgba(248,244,233,0.6)] hover:text-[#F8F4E9]'
                  }`}
                >
                  <Mic className="w-3.5 h-3.5" />
                  <span>Voice</span>
                </button>
                <button
                  type="button"
                  onClick={() => setInputMode('text')}
                  className={`px-3 py-1 rounded-full font-bold transition-all flex items-center gap-1.5 cursor-pointer ${
                    inputMode === 'text'
                      ? 'bg-[#935073] text-[#F8F4E9] shadow-sm'
                      : 'text-[rgba(248,244,233,0.6)] hover:text-[#F8F4E9]'
                  }`}
                >
                  <Keyboard className="w-3.5 h-3.5" />
                  <span>Text</span>
                </button>
              </div>
            </div>

            {/* Recorded Audio Audio Player if captured */}
            {audioBlobUrl && !isRecording && (
              <div className="p-3 rounded-2xl bg-[rgba(26,15,34,0.6)] border border-[rgba(147,80,115,0.3)] space-y-2">
                <div className="flex items-center justify-between text-xs font-bold text-[#7FE3B9]">
                  <span className="flex items-center gap-1.5">
                    <CheckCircle2 className="w-4 h-4" />
                    Voice response ready for AI evaluation
                  </span>
                  <button
                    onClick={() => {
                      setAudioBlobUrl(null);
                      setRecordedAudioBase64(null);
                    }}
                    className="text-[11px] text-[rgba(248,244,233,0.5)] hover:text-[#E57373] flex items-center gap-1 cursor-pointer"
                  >
                    <RotateCcw className="w-3 h-3" />
                    Re-record
                  </button>
                </div>
                <audio controls src={audioBlobUrl} className="w-full h-8" />
              </div>
            )}

            {/* Text Input area (always available or in text mode) */}
            <div className="space-y-1.5 flex-1">
              <label className="block text-xs font-bold text-[rgba(248,244,233,0.6)]">
                {inputMode === 'text' ? 'Written Solution / Code Architecture:' : 'Optional Text or Notes:'}
              </label>
              <textarea
                value={textAnswer}
                onChange={(e) => setTextAnswer(e.target.value)}
                placeholder="Elaborate on your approach, edge cases, trade-offs, or pseudocode..."
                rows={4}
                className="w-full bg-[rgba(26,15,34,0.7)] border border-[rgba(248,244,233,0.08)] rounded-2xl p-3.5 text-xs text-[#F8F4E9] placeholder-[rgba(248,244,233,0.35)] outline-none focus:border-[#935073] focus:shadow-[0_0_15px_rgba(147,80,115,0.3)] font-mono resize-none transition"
              />
            </div>
          </GlassCard>
        </div>

        {/* FLOATING BOTTOM CONTROL PILL */}
        <div className="sticky bottom-6 z-30 flex items-center justify-center px-4">
          <div className="flex items-center gap-3 p-2 rounded-full bg-[rgba(42,27,51,0.92)] backdrop-blur-2xl border border-[rgba(248,244,233,0.15)] shadow-[0_20px_45px_rgba(15,7,20,0.9),0_0_30px_rgba(147,80,115,0.3)]">
            {/* Primary Mic Button */}
            <button
              onClick={isRecording ? stopRecording : startRecording}
              className={`flex items-center gap-2 px-5 py-2.5 rounded-full font-extrabold text-xs sm:text-sm transition-all cursor-pointer ${
                isRecording
                  ? 'bg-[#E57373] text-[#1A0F22] shadow-[0_0_20px_rgba(229,115,115,0.7)] animate-pulse'
                  : 'bg-gradient-to-r from-[#502D55] via-[#935073] to-[#F6DBC0] text-[#F8F4E9] hover:scale-103 shadow-[0_0_20px_rgba(147,80,115,0.5)]'
              }`}
            >
              {isRecording ? <MicOff className="w-4 h-4" /> : <Mic className="w-4 h-4 text-[#F6DBC0]" />}
              <span>{isRecording ? 'Stop Recording' : 'Record Mic (Space)'}</span>
            </button>

            {/* Submit Answer CTA */}
            <PrimaryButton
              onClick={handleSubmitAnswer}
              disabled={isSubmitting || (!recordedAudioBase64 && !textAnswer.trim())}
              size="sm"
              icon={isSubmitting ? <Sparkles className="w-4 h-4 text-[#F6DBC0] animate-spin" /> : <Send className="w-4 h-4" />}
            >
              {isSubmitting ? 'Evaluating...' : 'Submit & Next (Ctrl+Enter)'}
            </PrimaryButton>
          </div>
        </div>

        {/* Error Notification */}
        {error && (
          <div className="p-4 bg-[rgba(229,115,115,0.15)] border border-[rgba(229,115,115,0.35)] rounded-2xl text-xs text-[#E57373] flex items-center gap-3 font-semibold">
            <AlertCircle className="w-4 h-4 shrink-0" />
            <span>{error}</span>
          </div>
        )}
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
  );
};
