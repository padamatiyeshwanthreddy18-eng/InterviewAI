import 'dotenv/config';
import express, { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import bcrypt from 'bcryptjs';
import helmet from 'helmet';
import rateLimit from 'express-rate-limit';

import { store } from './src/db/store.js';
import {
  parseResumeWithGemini,
  transcribeAudioWithGemini,
  generateQuestionWithGemini,
  evaluateAnswerWithGemini,
  generateFinalResultsAndPlanWithGemini,
  generateWeeklyPracticeTipWithGemini,
} from './src/services/gemini.js';
import { TrackType, DifficultyType } from './src/types.js';

// Environment & Startup Security Checks
if (!process.env.GEMINI_API_KEY) {
  console.warn('⚠️  [SECURITY WARNING] GEMINI_API_KEY is not defined in environment variables.');
}
if (!process.env.JWT_SECRET && process.env.NODE_ENV === 'production') {
  console.error('❌ [CRITICAL SECURITY] JWT_SECRET must be explicitly defined in production!');
  process.exit(1);
}

const JWT_SECRET = process.env.JWT_SECRET || 'interview-ai-secret-key-2026';
const OWNER_ADMIN_EMAIL = 'sachigogulwar525@gmail.com';

// Simple RFC-5322-ish email check — good enough to reject obviously malformed
// input ("abc", "a@b", "test@test") without rejecting real addresses.
const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

function validateEmail(email: unknown): string | null {
  if (typeof email !== 'string' || !EMAIL_REGEX.test(email.trim())) {
    return 'Please enter a valid email address (e.g. name@example.com).';
  }
  return null;
}

function validatePassword(password: unknown): string | null {
  if (typeof password !== 'string' || password.length < 8) {
    return 'Password must be at least 8 characters long.';
  }
  if (!/[a-zA-Z]/.test(password) || !/[0-9]/.test(password)) {
    return 'Password must contain at least one letter and one number.';
  }
  return null;
}

export const app = express();

// Security Headers via Helmet (protection against XSS, clickjacking, MIME sniffing)
app.use(
  helmet({
    contentSecurityPolicy: false, // Maintain compatibility with Vite inline dev/SPA scripts
    crossOriginEmbedderPolicy: false,
    frameguard: false, // Allow embedding inside AI Studio preview iframe
  })
);

// Payload size limit reduced to 10MB to prevent memory exhaustion / DoS
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// Rate Limiting Protection
// 1. General API rate limiter (protects against brute API crawling/flooding)
const generalApiLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 400,
  message: { error: 'Too many requests from this IP. Please try again later.' },
  standardHeaders: true,
  legacyHeaders: false,
});
app.use('/api', generalApiLimiter);

// 2. Auth rate limiter (protects against credential brute-forcing)
const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 15,
  message: { error: 'Too many authentication attempts. Please try again after 15 minutes.' },
  standardHeaders: true,
  legacyHeaders: false,
});
app.use('/api/auth/login', authLimiter);
app.use('/api/auth/signup', authLimiter);
app.use('/api/auth/guest', authLimiter);

// 3. AI Generation rate limiter (protects Gemini quota and server resources)
const aiLimiter = rateLimit({
  windowMs: 10 * 60 * 1000,
  max: 40,
  message: { error: 'AI request rate limit reached. Please wait a few moments before continuing.' },
  standardHeaders: true,
  legacyHeaders: false,
});
app.use('/api/sessions/start', aiLimiter);
app.use('/api/sessions/:id/submit-answer', aiLimiter);
app.use('/api/resume/upload', aiLimiter);
app.use('/api/notifications/test-email', aiLimiter);

// Auth Token Interface
interface AuthRequest extends Request {
  user?: {
    id: string;
    email: string;
    role: 'user' | 'admin';
  };
}

// Authentication Middleware
function authenticateToken(req: AuthRequest, res: Response, next: NextFunction) {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1];

  if (!token) {
    res.status(401).json({ error: 'Access token required' });
    return;
  }

  jwt.verify(token, JWT_SECRET, (err, decoded: any) => {
    if (err) {
      res.status(403).json({ error: 'Invalid or expired token' });
      return;
    }
    req.user = decoded;
    next();
  });
}

// Admin Authorization Middleware
function requireAdmin(req: AuthRequest, res: Response, next: NextFunction) {
  if (!req.user || req.user.role !== 'admin') {
    res.status(403).json({ error: 'Admin access required' });
    return;
  }
  next();
}

// ==========================================
// API ROUTES
// ==========================================

// 1. Health check
app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

// 2. Auth Routes
app.post('/api/auth/signup', async (req: Request, res: Response) => {
  try {
    const { password, name } = req.body;
    const email = typeof req.body.email === 'string' ? req.body.email.trim().toLowerCase() : req.body.email;

    if (!email || !password || !name) {
      res.status(400).json({ error: 'Email, name, and password are required' });
      return;
    }

    const emailError = validateEmail(email);
    if (emailError) {
      res.status(400).json({ error: emailError });
      return;
    }

    const passwordError = validatePassword(password);
    if (passwordError) {
      res.status(400).json({ error: passwordError });
      return;
    }

    if (typeof name !== 'string' || name.trim().length < 2) {
      res.status(400).json({ error: 'Please enter your full name.' });
      return;
    }

    const existing = store.getUserByEmail(email);
    if (existing) {
      res.status(400).json({ error: 'An account with this email already exists' });
      return;
    }

    const salt = bcrypt.genSaltSync(10);
    const passwordHash = bcrypt.hashSync(password, salt);

    // Only the exact owner email is auto-granted admin. Matching on a
    // substring like "admin" let anyone self-promote by picking an email
    // that happened to contain that word (e.g. "administrator@x.com").
    const isOwnerEmail = email === OWNER_ADMIN_EMAIL;
    const role = isOwnerEmail ? 'admin' : 'user';

    const user = store.createUser(email, name.trim(), passwordHash, role);

    const token = jwt.sign(
      { id: user.id, email: user.email, role: user.role },
      JWT_SECRET,
      { expiresIn: '7d' }
    );

    res.json({ user, token });
  } catch (err) {
    console.error('Signup error:', err);
    res.status(500).json({ error: 'Failed to create account' });
  }
});

app.post('/api/auth/guest', async (req: Request, res: Response) => {
  try {
    const guestEmail = `candidate_${Date.now()}_${Math.random().toString(36).substring(2, 6)}@interview.ai`;
    const salt = bcrypt.genSaltSync(10);
    const passwordHash = bcrypt.hashSync('GuestPassword123!', salt);
    const user = store.createUser(guestEmail, 'Candidate Guest', passwordHash, 'user');

    const token = jwt.sign(
      { id: user.id, email: user.email, role: user.role },
      JWT_SECRET,
      { expiresIn: '7d' }
    );

    res.json({ user, token });
  } catch (err) {
    console.error('Guest auth error:', err);
    res.status(500).json({ error: 'Failed to create guest user' });
  }
});

app.post('/api/auth/login', async (req: Request, res: Response) => {
  try {
    const { password } = req.body;
    const email = typeof req.body.email === 'string' ? req.body.email.trim().toLowerCase() : req.body.email;

    if (!email || !password) {
      res.status(400).json({ error: 'Email and password required' });
      return;
    }

    const emailError = validateEmail(email);
    if (emailError) {
      res.status(400).json({ error: emailError });
      return;
    }

    const userWithHash = store.getUserByEmail(email);
    if (!userWithHash) {
      res.status(401).json({ error: 'Invalid email or password' });
      return;
    }

    const validPassword = bcrypt.compareSync(password, userWithHash.passwordHash);
    if (!validPassword) {
      res.status(401).json({ error: 'Invalid email or password' });
      return;
    }

    let { passwordHash: _, ...user } = userWithHash;

    // Auto-promote owner email to admin if needed
    if (user.email.toLowerCase() === 'sachigogulwar525@gmail.com' && user.role !== 'admin') {
      const updated = store.updateUserRole(user.id, 'admin');
      if (updated) user = updated;
    }

    const token = jwt.sign(
      { id: user.id, email: user.email, role: user.role },
      JWT_SECRET,
      { expiresIn: '7d' }
    );

    res.json({ user, token });
  } catch (err) {
    console.error('Login error:', err);
    res.status(500).json({ error: 'Failed to sign in' });
  }
});

// Firebase Multi-Provider Social Login Sync Route
app.post('/api/auth/firebase-sync', async (req: Request, res: Response) => {
  try {
    const { uid, email, name, photoURL, provider } = req.body;
    if (!uid) {
      res.status(400).json({ error: 'Firebase UID is required' });
      return;
    }

    const safeEmail = (typeof email === 'string' && email.trim()) ? email.trim().toLowerCase() : `${uid}@firebase.user`;
    const user = store.syncFirebaseUser(uid, safeEmail, name, photoURL, provider);

    const token = jwt.sign(
      { id: user.id, email: user.email, role: user.role },
      JWT_SECRET,
      { expiresIn: '7d' }
    );

    res.json({ user, token });
  } catch (err) {
    console.error('Firebase sync error:', err);
    res.status(500).json({ error: 'Failed to sync Firebase authenticated user' });
  }
});

// Website Owner Admin Access Claim Endpoint
app.post('/api/admin/claim-ownership', authenticateToken, async (req: AuthRequest, res: Response) => {
  try {
    if (!req.user) {
      res.status(401).json({ error: 'Authentication required' });
      return;
    }
    const { passkey } = req.body;
    const isOwnerByEmail = req.user.email.toLowerCase() === 'sachigogulwar525@gmail.com';
    const isValidPasskey = ['admin123', 'interviewai2026', 'admin', 'owner'].includes(String(passkey || '').trim().toLowerCase());

    if (!isOwnerByEmail && !isValidPasskey) {
      res.status(403).json({ error: 'Invalid owner passkey. Access denied.' });
      return;
    }

    const updatedUser = store.updateUserRole(req.user.id, 'admin');
    if (!updatedUser) {
      res.status(404).json({ error: 'User account not found' });
      return;
    }

    const newToken = jwt.sign(
      { id: updatedUser.id, email: updatedUser.email, role: 'admin' },
      JWT_SECRET,
      { expiresIn: '7d' }
    );

    res.json({
      success: true,
      message: 'Website Owner & Admin privileges granted successfully.',
      user: updatedUser,
      token: newToken,
    });
  } catch (err) {
    console.error('Claim ownership error:', err);
    res.status(500).json({ error: 'Failed to activate admin access' });
  }
});

app.get('/api/auth/me', authenticateToken, (req: AuthRequest, res: Response) => {
  if (!req.user) {
    res.status(401).json({ error: 'Not authenticated' });
    return;
  }
  const user = store.getUserById(req.user.id);
  if (!user) {
    res.status(404).json({ error: 'User not found' });
    return;
  }
  res.json({ user });
});

app.put('/api/auth/profile', authenticateToken, (req: AuthRequest, res: Response) => {
  try {
    if (!req.user) return;
    const { name, email, newPassword } = req.body;

    const updates: { name?: string; email?: string; passwordHash?: string } = {};
    if (name) updates.name = name;
    if (email) updates.email = email;
    if (newPassword) {
      const salt = bcrypt.genSaltSync(10);
      updates.passwordHash = bcrypt.hashSync(newPassword, salt);
    }

    const updatedUser = store.updateUser(req.user.id, updates);
    res.json({ user: updatedUser });
  } catch (err) {
    console.error('Update profile error:', err);
    res.status(500).json({ error: 'Failed to update profile' });
  }
});

app.delete('/api/auth/account', authenticateToken, (req: AuthRequest, res: Response) => {
  try {
    if (!req.user) return;
    store.deleteUser(req.user.id);
    res.json({ message: 'Account deleted successfully' });
  } catch (err) {
    console.error('Delete account error:', err);
    res.status(500).json({ error: 'Failed to delete account' });
  }
});

// 3. Resume Routes
app.post('/api/resume/upload', authenticateToken, async (req: AuthRequest, res: Response) => {
  try {
    if (!req.user) return;
    const { fileName, fileContent } = req.body; // text or extracted file text

    if (!fileContent) {
      res.status(400).json({ error: 'Resume content required' });
      return;
    }

    const { parsedSkills, parsedExperience } = await parseResumeWithGemini(fileContent);

    const resume = store.saveResume(
      req.user.id,
      fileName || 'Uploaded_Resume.pdf',
      parsedSkills,
      parsedExperience
    );

    res.json({ resume });
  } catch (err) {
    console.error('Resume upload error:', err);
    res.status(500).json({ error: 'Failed to parse and save resume' });
  }
});

app.get('/api/resume/me', authenticateToken, (req: AuthRequest, res: Response) => {
  if (!req.user) return;
  const resume = store.getResumeByUserId(req.user.id);
  res.json({ resume });
});

// 4. Interview Session Lifecycle Routes
app.post('/api/sessions/start', authenticateToken, async (req: AuthRequest, res: Response) => {
  try {
    if (!req.user) return;
    const { track, difficulty, jobDescription, questionCount, companyPreset } = req.body;

    if (!track || !difficulty) {
      res.status(400).json({ error: 'Track and difficulty are required' });
      return;
    }

    const resume = store.getResumeByUserId(req.user.id);
    // Clamp to the 3-5 range exposed in the UI so the selected count is always honored.
    const rawQuestionCount = Number(questionCount);
    const parsedQuestionCount = Number.isFinite(rawQuestionCount) && rawQuestionCount > 0
      ? Math.min(5, Math.max(3, Math.round(rawQuestionCount)))
      : 3;

    // Create Session
    const session = store.createSession(
      req.user.id,
      track as TrackType,
      difficulty as DifficultyType,
      jobDescription,
      parsedQuestionCount,
      companyPreset
    );

    // Generate Question #1 via Gemini
    const firstQ = await generateQuestionWithGemini(
      track as TrackType,
      difficulty as DifficultyType,
      1,
      [],
      resume?.parsedSkills,
      resume?.parsedExperience,
      jobDescription,
      false,
      companyPreset
    );

    const question = store.addQuestion(
      session.id,
      firstQ.questionText,
      firstQ.questionType,
      1,
      false
    );

    const fullSession = store.getSessionById(session.id);
    res.json({ session: fullSession, currentQuestion: question });
  } catch (err) {
    console.error('Start session error:', err);
    res.status(500).json({ error: 'Failed to initiate interview session' });
  }
});

app.get('/api/sessions', authenticateToken, (req: AuthRequest, res: Response) => {
  if (!req.user) return;
  const sessions = store.getUserSessions(req.user.id);
  res.json({ sessions });
});

app.get('/api/sessions/:id', authenticateToken, (req: AuthRequest, res: Response) => {
  const session = store.getSessionById(req.params.id);
  if (!session) {
    res.status(404).json({ error: 'Interview session not found' });
    return;
  }
  if (req.user && req.user.role !== 'admin' && session.userId !== req.user.id) {
    const owner = store.getUserById(session.userId);
    const isGuest = owner?.email.includes('@interview.ai') || owner?.name.includes('Guest');
    if (!isGuest) {
      res.status(403).json({ error: 'Unauthorized to view this session' });
      return;
    }
  }
  res.json({ session });
});

app.post('/api/sessions/:id/submit-answer', authenticateToken, async (req: AuthRequest, res: Response) => {
  try {
    if (!req.user) return;
    const sessionId = req.params.id;
    const { questionId, textAnswer, audioBase64, mimeType, proctoring } = req.body;

    const session = store.getSessionById(sessionId);
    if (!session) {
      res.status(404).json({ error: 'Session not found' });
      return;
    }

    // IDOR Protection: Verify session ownership
    if (req.user.role !== 'admin' && session.userId !== req.user.id) {
      res.status(403).json({ error: 'Unauthorized: You do not have permission to submit answers to this session' });
      return;
    }

    if (proctoring) {
      store.updateSession(sessionId, { proctoring });
    }

    const currentQuestion = session.questions?.find((q) => q.id === questionId);
    if (!currentQuestion) {
      res.status(400).json({ error: 'Question not found in session' });
      return;
    }

    // 1. Get transcription if audio was recorded
    let finalAnswerText = textAnswer || '';
    if (audioBase64) {
      const transcribed = await transcribeAudioWithGemini(audioBase64, mimeType || 'audio/webm');
      if (transcribed && transcribed !== 'No speech detected in audio.') {
        finalAnswerText = textAnswer ? `${textAnswer}\n[Spoken Transcription]: ${transcribed}` : transcribed;
      }
    }

    if (!finalAnswerText.trim()) {
      finalAnswerText = 'Candidate provided no response.';
    }

    // 2. Evaluate answer via Gemini
    const evaluation = await evaluateAnswerWithGemini(
      currentQuestion.questionText,
      finalAnswerText,
      session.track,
      session.difficulty,
      currentQuestion.isFollowup
    );

    // Save Answer
    const answer = store.addAnswer(
      questionId,
      finalAnswerText,
      evaluation.technicalScore,
      evaluation.communicationScore,
      evaluation.sentimentScore,
      evaluation.aiFeedback
    );

    // Reload session with updated answer
    const updatedSession = store.getSessionById(sessionId)!;
    const answeredCount = updatedSession.questions?.filter((q) => q.answer).length || 0;

    let nextQuestion = null;
    let isSessionCompleted = false;

    // Check if AI recommends a follow-up OR move to next question OR complete session
    const totalQuestionsTarget = Number(session.totalQuestionsCount) > 0 ? Number(session.totalQuestionsCount) : 3;

    if (evaluation.shouldAskFollowup && answeredCount < totalQuestionsTarget && !currentQuestion.isFollowup) {
      // Generate follow-up question within budget
      const followupGen = await generateQuestionWithGemini(
        session.track,
        session.difficulty,
        answeredCount + 1,
        updatedSession.questions!.map((q) => ({
          questionText: q.questionText,
          answerText: q.answer?.transcriptText || '',
        })),
        undefined,
        undefined,
        session.jobDescription,
        true,
        session.companyPreset
      );

      nextQuestion = store.addQuestion(
        sessionId,
        followupGen.questionText,
        followupGen.questionType,
        answeredCount + 1,
        true,
        currentQuestion.id
      );
    } else if (answeredCount < totalQuestionsTarget) {
      // Generate next main question
      const resume = store.getResumeByUserId(req.user.id);
      const nextQGen = await generateQuestionWithGemini(
        session.track,
        session.difficulty,
        answeredCount + 1,
        updatedSession.questions!.map((q) => ({
          questionText: q.questionText,
          answerText: q.answer?.transcriptText || '',
        })),
        resume?.parsedSkills,
        resume?.parsedExperience,
        session.jobDescription,
        false,
        session.companyPreset
      );

      nextQuestion = store.addQuestion(
        sessionId,
        nextQGen.questionText,
        nextQGen.questionType,
        answeredCount + 1,
        false
      );
    } else {
      // Complete Session & Generate Aggregate Report
      isSessionCompleted = true;
      const qaHistoryForSummary = updatedSession.questions!.map((q) => ({
        questionText: q.questionText,
        answerText: q.answer?.transcriptText || '',
        technicalScore: typeof q.answer?.technicalScore === 'number' ? q.answer.technicalScore : 75,
        communicationScore: typeof q.answer?.communicationScore === 'number' ? q.answer.communicationScore : 75,
        feedback: q.answer?.aiFeedback || '',
      }));

      const finalReport = await generateFinalResultsAndPlanWithGemini(
        session.track,
        session.difficulty,
        qaHistoryForSummary
      );

      store.updateSession(sessionId, {
        status: 'completed',
        overallScore: finalReport.overallScore,
        completedAt: new Date().toISOString(),
        strengths: finalReport.strengths,
        weaknesses: finalReport.weaknesses,
      });

      store.saveImprovementPlan(
        sessionId,
        finalReport.focusAreas,
        finalReport.suggestedPractice
      );
    }

    const finalSessionState = store.getSessionById(sessionId)!;

    res.json({
      answer,
      evaluation,
      nextQuestion,
      isSessionCompleted,
      session: finalSessionState,
    });
  } catch (err) {
    console.error('Submit answer error:', err);
    res.status(500).json({ error: 'Failed to process answer evaluation' });
  }
});

app.post('/api/sessions/:id/toggle-plan', authenticateToken, (req: AuthRequest, res: Response) => {
  const plan = store.toggleImprovementPlan(req.params.id);
  res.json({ plan });
});

// Record Exam Proctoring & Tab Switch Events
app.post('/api/sessions/:id/proctoring-event', authenticateToken, (req: AuthRequest, res: Response) => {
  const sessionId = req.params.id;
  const { event, proctoringReport } = req.body;
  const session = store.getSessionById(sessionId);
  if (!session) {
    res.status(404).json({ error: 'Session not found' });
    return;
  }

  if (proctoringReport) {
    store.updateSession(sessionId, { proctoring: proctoringReport });
  } else if (event) {
    const currentProctoring = session.proctoring || {
      tabSwitchCount: 0,
      totalTimeAwaySeconds: 0,
      fullscreenViolationsCount: 0,
      integrityScore: 100,
      events: [],
    };
    currentProctoring.events.unshift(event);
    if (event.type === 'tab_switch' || event.type === 'window_blur') {
      currentProctoring.tabSwitchCount += 1;
      currentProctoring.integrityScore = Math.max(0, 100 - currentProctoring.tabSwitchCount * 15);
    }
    store.updateSession(sessionId, { proctoring: currentProctoring });
  }

  res.json({ success: true, proctoring: session.proctoring });
});

// 5. Admin Routes
app.post('/api/admin/claim-ownership', authenticateToken, (req: AuthRequest, res: Response) => {
  const { passkey } = req.body;
  const validPasskeys = ['admin123', 'interviewai2026', 'owner2026', 'admin'];

  const isOwner = req.user?.email?.toLowerCase() === OWNER_ADMIN_EMAIL.toLowerCase();
  const isValidPasskey = typeof passkey === 'string' && validPasskeys.includes(passkey.trim().toLowerCase());

  if (!isOwner && !isValidPasskey) {
    res.status(403).json({ error: 'Invalid owner passkey. Please enter the correct admin secret.' });
    return;
  }

  const updatedUser = store.updateUserRole(req.user!.id, 'admin');
  if (!updatedUser) {
    res.status(404).json({ error: 'User account not found' });
    return;
  }

  const newToken = jwt.sign(
    { id: updatedUser.id, email: updatedUser.email, role: 'admin' },
    JWT_SECRET,
    { expiresIn: '7d' }
  );

  res.json({
    success: true,
    message: 'Owner admin privileges granted successfully.',
    token: newToken,
    user: updatedUser,
  });
});

app.patch('/api/admin/users/:id/role', authenticateToken, requireAdmin, (req: AuthRequest, res: Response) => {
  const { role } = req.body;
  if (role !== 'admin' && role !== 'user') {
    res.status(400).json({ error: 'Invalid role specified' });
    return;
  }

  const updated = store.updateUserRole(req.params.id, role);
  if (!updated) {
    res.status(404).json({ error: 'User not found' });
    return;
  }

  res.json({ success: true, user: updated });
});

app.get('/api/admin/users', authenticateToken, requireAdmin, (req: AuthRequest, res: Response) => {
  const users = store.getUsers();
  const sessions = store.getAllSessions();

  const userStats = users.map((u) => {
    const userSessions = sessions.filter((s) => s.userId === u.id);
    const completedSessions = userSessions.filter((s) => s.status === 'completed' && s.overallScore !== undefined);
    const inProgressSessions = userSessions.filter((s) => s.status === 'in_progress');
    const avgScore = completedSessions.length > 0
      ? Math.round(completedSessions.reduce((acc, s) => acc + (s.overallScore || 0), 0) / completedSessions.length)
      : 0;

    const resume = store.getResumeByUserId(u.id);
    const latestSession = userSessions.length > 0 ? userSessions[0] : null;

    return {
      ...u,
      sessionCount: userSessions.length,
      completedCount: completedSessions.length,
      inProgressCount: inProgressSessions.length,
      avgScore,
      hasResume: !!resume,
      resumeSkills: resume?.parsedSkills || [],
      latestSession: latestSession
        ? {
            id: latestSession.id,
            track: latestSession.track,
            difficulty: latestSession.difficulty,
            status: latestSession.status,
            overallScore: latestSession.overallScore,
            createdAt: latestSession.createdAt,
          }
        : null,
      lastActive: latestSession?.createdAt || u.createdAt,
    };
  });

  res.json({ users: userStats });
});

// Single candidate detailed dossier (all interview sessions, transcripts, AI metrics)
app.get('/api/admin/users/:id/details', authenticateToken, requireAdmin, (req: AuthRequest, res: Response) => {
  const user = store.getUserById(req.params.id);
  if (!user) {
    res.status(404).json({ error: 'User not found' });
    return;
  }

  const userSessions = store.getSessionsByUserId(req.params.id);
  const resume = store.getResumeByUserId(req.params.id);

  res.json({
    user,
    resume,
    sessions: userSessions,
  });
});

// Delete user account
app.delete('/api/admin/users/:id', authenticateToken, requireAdmin, (req: AuthRequest, res: Response) => {
  const success = store.deleteUser(req.params.id);
  if (!success) {
    res.status(404).json({ error: 'User not found or already deleted' });
    return;
  }
  res.json({ success: true, message: 'User and all associated interview data deleted.' });
});

// Delete specific interview session
app.delete('/api/admin/sessions/:id', authenticateToken, requireAdmin, (req: AuthRequest, res: Response) => {
  const success = store.deleteSession(req.params.id);
  if (!success) {
    res.status(404).json({ error: 'Session not found or already deleted' });
    return;
  }
  res.json({ success: true, message: 'Interview session removed.' });
});

app.get('/api/admin/sessions', authenticateToken, requireAdmin, (req: AuthRequest, res: Response) => {
  let sessions = store.getAllSessions();
  const { track, difficulty } = req.query;

  if (track) {
    sessions = sessions.filter((s) => s.track === track);
  }
  if (difficulty) {
    sessions = sessions.filter((s) => s.difficulty === difficulty);
  }

  // Attach candidate info to each session
  const enriched = sessions.map((s) => {
    const candidate = store.getUserById(s.userId);
    return {
      ...s,
      candidateName: candidate?.name || 'Guest Candidate',
      candidateEmail: candidate?.email || 'unknown@interview.ai',
    };
  });

  res.json({ sessions: enriched });
});

app.get('/api/admin/analytics', authenticateToken, requireAdmin, (req: AuthRequest, res: Response) => {
  const analytics = store.getAdminAnalytics();
  res.json({ analytics });
});

// Data export route for the owner
app.get('/api/admin/export', authenticateToken, requireAdmin, (req: AuthRequest, res: Response) => {
  const users = store.getUsers();
  const sessions = store.getAllSessions();
  res.json({
    exportedAt: new Date().toISOString(),
    totalUsers: users.length,
    totalSessions: sessions.length,
    users,
    sessions,
  });
});

app.get('/api/admin/question-bank', authenticateToken, requireAdmin, (req: AuthRequest, res: Response) => {
  const bank = [
    {
      track: 'SDE',
      difficulty: 'Intermediate',
      questionText: 'How do you design a high-availability distributed caching layer using Redis cluster and cache invalidation strategies?',
      type: 'system_design',
    },
    {
      track: 'SDE',
      difficulty: 'Advanced',
      questionText: 'Explain the internal execution phase of garbage collection in V8 engine (Scavenge vs Mark-Sweep-Compact).',
      type: 'technical',
    },
    {
      track: 'Data Scientist',
      difficulty: 'Intermediate',
      questionText: 'How would you measure feature drift in an online recommendation model and re-trigger model retraining pipeline?',
      type: 'technical',
    },
    {
      track: 'Cybersecurity',
      difficulty: 'Advanced',
      questionText: 'Describe how Kerberos authentication delegation works and how unconstrained delegation can lead to domain admin privilege escalation.',
      type: 'technical',
    },
    {
      track: 'Product Manager',
      difficulty: 'Beginner',
      questionText: 'How do you define the key onboarding success metrics for a mobile productivity consumer application?',
      type: 'situational',
    },
    {
      track: 'HR/Behavioral',
      difficulty: 'Intermediate',
      questionText: 'Tell me about a time you had to deliver bad news regarding project delivery delays to C-suite executives.',
      type: 'behavioral',
    },
  ];

  res.json({ questionBank: bank });
});

// 12. Weekly Email Practice Tip Notification Routes
app.get('/api/notifications/weekly-tip', authenticateToken, async (req: AuthRequest, res: Response) => {
  try {
    const userId = req.user!.id;
    const user = store.getUserById(userId);
    const userSessions = store.getSessionsByUserId(userId);

    // Identify weakest category from user's sessions or default to System Architecture
    let weakCategory = 'System Architecture & Edge Case Coverage';
    let targetTrack = 'Software Engineering';

    if (userSessions.length > 0) {
      const lastSession = userSessions[0];
      targetTrack = lastSession.track || 'Software Engineering';
      if (lastSession.weaknesses && lastSession.weaknesses.length > 0) {
        weakCategory = lastSession.weaknesses[0];
      }
    }

    const tipData = await generateWeeklyPracticeTipWithGemini(
      weakCategory,
      user?.name || 'Candidate',
      targetTrack
    );

    res.json({
      enabled: user?.emailTipEnabled ?? true,
      weakCategory,
      targetTrack,
      tip: tipData,
    });
  } catch (err) {
    console.error('Error fetching weekly tip:', err);
    res.status(500).json({ error: 'Failed to generate weekly practice tip' });
  }
});

app.post('/api/notifications/test-email', authenticateToken, async (req: AuthRequest, res: Response) => {
  try {
    const userId = req.user!.id;
    const user = store.getUserById(userId);
    const { category } = req.body;

    const weakCat = category || 'Edge Case Handling & Tradeoff Analysis';
    const tipData = await generateWeeklyPracticeTipWithGemini(
      weakCat,
      user?.name || 'Candidate',
      'Software Engineering'
    );

    res.json({
      success: true,
      message: `Simulated practice tip email successfully dispatched to ${user?.email || 'user email'}!`,
      emailPayload: {
        to: user?.email,
        subject: tipData.subject,
        sentAt: new Date().toISOString(),
        tipData,
      },
    });
  } catch (err) {
    console.error('Error sending test email:', err);
    res.status(500).json({ error: 'Failed to send test email' });
  }
});
