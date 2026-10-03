import fs from 'fs';
import path from 'path';
import bcrypt from 'bcryptjs';
import {
  User,
  Resume,
  InterviewSession,
  InterviewQuestion,
  InterviewAnswer,
  ImprovementPlan,
  AdminAnalytics,
  TrackType,
  DifficultyType,
} from '../types.js';

const DATA_DIR = process.env.NETLIFY === 'true'
  ? '/tmp/interview-ai-data'
  : path.join(process.cwd(), 'data');
const DB_FILE = path.join(DATA_DIR, 'db.json');

interface DBData {
  users: (User & { passwordHash: string })[];
  resumes: Resume[];
  sessions: InterviewSession[];
  questions: InterviewQuestion[];
  answers: InterviewAnswer[];
  improvementPlans: ImprovementPlan[];
}

class Store {
  private data: DBData = {
    users: [],
    resumes: [],
    sessions: [],
    questions: [],
    answers: [],
    improvementPlans: [],
  };

  constructor() {
    this.init();
  }

  private init() {
    try {
      if (!fs.existsSync(DATA_DIR)) {
        fs.mkdirSync(DATA_DIR, { recursive: true });
      }
      if (fs.existsSync(DB_FILE)) {
        const raw = fs.readFileSync(DB_FILE, 'utf-8');
        this.data = JSON.parse(raw);
        // Clean up legacy alex user if present
        if (this.data.users) {
          const hadAlex = this.data.users.some((u) => u.email === 'alex@example.com');
          if (hadAlex) {
            this.data.users = this.data.users.filter((u) => u.email !== 'alex@example.com');
            this.data.sessions = this.data.sessions.filter((s) => s.userId !== 'user-1');
            this.data.resumes = this.data.resumes.filter((r) => r.userId !== 'user-1');
            this.save();
          }
        }
      } else {
        this.seedInitialData();
        this.save();
      }
    } catch (err) {
      console.error('Error initializing store:', err);
      this.seedInitialData();
    }
  }

  private save() {
    try {
      fs.writeFileSync(DB_FILE, JSON.stringify(this.data, null, 2), 'utf-8');
    } catch (err) {
      console.error('Failed to save DB file:', err);
    }
  }

  private seedInitialData() {
    const salt = bcrypt.genSaltSync(10);
    const demoPasswordHash = bcrypt.hashSync('Password123!', salt);

    const adminUser: User & { passwordHash: string } = {
      id: 'admin-1',
      email: 'admin@interviewai.com',
      name: 'System Admin',
      role: 'admin',
      passwordHash: demoPasswordHash,
      createdAt: new Date(Date.now() - 30 * 86400000).toISOString(),
    };

    this.data.users = [adminUser];
    this.data.resumes = [];
    this.data.sessions = [];
    this.data.questions = [];
    this.data.answers = [];
    this.data.improvementPlans = [];
  }

  // --- USER METHODS ---
  getUsers(): User[] {
    return this.data.users.map(({ passwordHash, ...u }) => u);
  }

  getUserById(id: string): User | null {
    const u = this.data.users.find((x) => x.id === id);
    if (!u) return null;
    const { passwordHash, ...userWithoutPass } = u;
    return userWithoutPass;
  }

  getUserByEmail(email: string): (User & { passwordHash: string }) | null {
    return this.data.users.find((x) => x.email.toLowerCase() === email.toLowerCase()) || null;
  }

  createUser(email: string, name: string, passwordHash: string, role: 'user' | 'admin' = 'user'): User {
    const newUser: User & { passwordHash: string } = {
      id: `user-${Date.now()}-${Math.random().toString(36).substr(2, 4)}`,
      email,
      name,
      role,
      passwordHash,
      createdAt: new Date().toISOString(),
    };
    this.data.users.push(newUser);
    this.save();
    const { passwordHash: _, ...u } = newUser;
    return u;
  }

  updateUser(id: string, updates: Partial<User & { passwordHash?: string }>): User | null {
    const index = this.data.users.findIndex((u) => u.id === id);
    if (index === -1) return null;
    const current = this.data.users[index];
    if (updates.name !== undefined) current.name = updates.name;
    if (updates.email !== undefined) current.email = updates.email;
    if (updates.passwordHash !== undefined) current.passwordHash = updates.passwordHash;
    if (updates.role !== undefined) current.role = updates.role;
    if (updates.photoURL !== undefined) current.photoURL = updates.photoURL;
    if (updates.provider !== undefined) current.provider = updates.provider;
    if (updates.lastLoginAt !== undefined) current.lastLoginAt = updates.lastLoginAt;
    this.save();
    const { passwordHash: _, ...u } = current;
    return u;
  }

  syncFirebaseUser(uid: string, email: string, name?: string, photoURL?: string, provider?: string): User {
    let existing = this.getUserById(uid) || this.getUserByEmail(email);
    if (existing) {
      const updates: Partial<User> = {
        lastLoginAt: new Date().toISOString(),
      };
      if (name && (!existing.name || existing.name === 'Candidate')) updates.name = name;
      if (photoURL) updates.photoURL = photoURL;
      if (provider) updates.provider = provider;
      const updated = this.updateUser(existing.id, updates);
      return updated || existing;
    }

    const salt = bcrypt.genSaltSync(10);
    const passwordHash = bcrypt.hashSync(`firebase-${uid}-${Date.now()}`, salt);
    const isOwner = email.toLowerCase() === 'sachigogulwar525@gmail.com';
    const role: 'user' | 'admin' = isOwner ? 'admin' : 'user';

    const newUser: User & { passwordHash: string } = {
      id: uid,
      email,
      name: name || email.split('@')[0] || 'Candidate',
      role,
      passwordHash,
      createdAt: new Date().toISOString(),
      lastLoginAt: new Date().toISOString(),
      photoURL,
      provider: provider || 'google.com',
    };
    this.data.users.push(newUser);
    this.save();
    const { passwordHash: _, ...u } = newUser;
    return u;
  }

  updateUserRole(userId: string, role: 'user' | 'admin'): User | null {
    return this.updateUser(userId, { role });
  }

  deleteUser(id: string): boolean {
    const initialLen = this.data.users.length;
    this.data.users = this.data.users.filter((u) => u.id !== id);
    this.data.sessions = this.data.sessions.filter((s) => s.userId !== id);
    this.data.resumes = this.data.resumes.filter((r) => r.userId !== id);
    this.save();
    return this.data.users.length < initialLen;
  }

  deleteSession(sessionId: string): boolean {
    const initialLen = this.data.sessions.length;
    this.data.sessions = this.data.sessions.filter((s) => s.id !== sessionId);
    this.data.questions = this.data.questions.filter((q) => q.sessionId !== sessionId);
    this.data.improvementPlans = this.data.improvementPlans.filter((p) => p.sessionId !== sessionId);
    this.save();
    return this.data.sessions.length < initialLen;
  }

  // --- RESUME METHODS ---
  getResumeByUserId(userId: string): Resume | null {
    return this.data.resumes.find((r) => r.userId === userId) || null;
  }

  saveResume(userId: string, fileName: string, parsedSkills: string[], parsedExperience: string): Resume {
    const existingIndex = this.data.resumes.findIndex((r) => r.userId === userId);
    const newResume: Resume = {
      id: `resume-${Date.now()}`,
      userId,
      fileName,
      parsedSkills,
      parsedExperience,
      uploadedAt: new Date().toISOString(),
    };
    if (existingIndex !== -1) {
      this.data.resumes[existingIndex] = newResume;
    } else {
      this.data.resumes.push(newResume);
    }
    this.save();
    return newResume;
  }

  // --- SESSION METHODS ---
  createSession(
    userId: string,
    track: TrackType,
    difficulty: DifficultyType,
    jobDescription?: string,
    totalQuestionsCount: number = 3,
    companyPreset?: string
  ): InterviewSession {
    const session: InterviewSession = {
      id: `session-${Date.now()}-${Math.random().toString(36).substr(2, 4)}`,
      userId,
      track,
      difficulty,
      jobDescription,
      companyPreset,
      status: 'in_progress',
      createdAt: new Date().toISOString(),
      totalQuestionsCount,
    };
    this.data.sessions.push(session);
    this.save();
    return session;
  }

  getSessionById(id: string): InterviewSession | null {
    const session = this.data.sessions.find((s) => s.id === id);
    if (!session) return null;

    const questions = this.data.questions
      .filter((q) => q.sessionId === id)
      .sort((a, b) => a.orderIndex - b.orderIndex)
      .map((q) => {
        const answer = this.data.answers.find((a) => a.questionId === q.id);
        return { ...q, answer };
      });

    const improvementPlan = this.data.improvementPlans.find((p) => p.sessionId === id);

    return {
      ...session,
      questions,
      improvementPlan,
    };
  }

  getUserSessions(userId: string): InterviewSession[] {
    return this.data.sessions
      .filter((s) => s.userId === userId)
      .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
      .map((s) => this.getSessionById(s.id)!);
  }

  getSessionsByUserId(userId: string): InterviewSession[] {
    return this.getUserSessions(userId);
  }

  updateSession(id: string, updates: Partial<InterviewSession>): InterviewSession | null {
    const index = this.data.sessions.findIndex((s) => s.id === id);
    if (index === -1) return null;
    this.data.sessions[index] = { ...this.data.sessions[index], ...updates };
    this.save();
    return this.getSessionById(id);
  }

  // --- QUESTION & ANSWER METHODS ---
  addQuestion(
    sessionId: string,
    questionText: string,
    questionType: 'technical' | 'behavioral' | 'situational' | 'system_design',
    orderIndex: number,
    isFollowup: boolean = false,
    parentQuestionId?: string
  ): InterviewQuestion {
    const q: InterviewQuestion = {
      id: `q-${Date.now()}-${Math.random().toString(36).substr(2, 4)}`,
      sessionId,
      questionText,
      questionType,
      orderIndex,
      isFollowup,
      parentQuestionId,
    };
    this.data.questions.push(q);
    this.save();
    return q;
  }

  addAnswer(
    questionId: string,
    transcriptText: string,
    technicalScore: number,
    communicationScore: number,
    sentimentScore: number,
    aiFeedback: string,
    audioUrl?: string
  ): InterviewAnswer {
    const a: InterviewAnswer = {
      id: `a-${Date.now()}-${Math.random().toString(36).substr(2, 4)}`,
      questionId,
      transcriptText,
      technicalScore,
      communicationScore,
      sentimentScore,
      aiFeedback,
      audioUrl,
      createdCompletedAt: new Date().toISOString(),
    };
    this.data.answers.push(a);
    this.save();
    return a;
  }

  // --- IMPROVEMENT PLAN METHODS ---
  saveImprovementPlan(sessionId: string, focusAreas: string[], suggestedPractice: string[]): ImprovementPlan {
    const plan: ImprovementPlan = {
      id: `plan-${Date.now()}`,
      sessionId,
      focusAreas,
      suggestedPractice,
      completed: false,
    };
    this.data.improvementPlans.push(plan);
    this.save();
    return plan;
  }

  toggleImprovementPlan(sessionId: string): ImprovementPlan | null {
    const plan = this.data.improvementPlans.find((p) => p.sessionId === sessionId);
    if (!plan) return null;
    plan.completed = !plan.completed;
    this.save();
    return plan;
  }

  // --- ADMIN ANALYTICS ---
  getAllSessions(): InterviewSession[] {
    return this.data.sessions
      .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
      .map((s) => this.getSessionById(s.id)!);
  }

  getAdminAnalytics(): AdminAnalytics {
    const totalUsers = this.data.users.length;
    const totalSessions = this.data.sessions.length;
    const completedSessions = this.data.sessions.filter((s) => s.status === 'completed' && s.overallScore !== undefined);

    const avgOverallScore = completedSessions.length > 0
      ? Math.round(completedSessions.reduce((acc, s) => acc + (s.overallScore || 0), 0) / completedSessions.length)
      : 0;

    // Signups over time (last 7 days or grouped by date)
    const signupsByDate: { [key: string]: number } = {};
    this.data.users.forEach((u) => {
      const date = u.createdAt.split('T')[0];
      signupsByDate[date] = (signupsByDate[date] || 0) + 1;
    });

    const signupsOverTime = Object.entries(signupsByDate)
      .map(([date, count]) => ({ date, count }))
      .sort((a, b) => a.date.localeCompare(b.date));

    // Sessions per day
    const sessionsByDate: { [key: string]: number } = {};
    this.data.sessions.forEach((s) => {
      const date = s.createdAt.split('T')[0];
      sessionsByDate[date] = (sessionsByDate[date] || 0) + 1;
    });

    const sessionsPerDay = Object.entries(sessionsByDate)
      .map(([date, count]) => ({ date, count }))
      .sort((a, b) => a.date.localeCompare(b.date));

    // Track popularity
    const trackCounts: { [key: string]: number } = {};
    this.data.sessions.forEach((s) => {
      trackCounts[s.track] = (trackCounts[s.track] || 0) + 1;
    });

    const trackPopularity = Object.entries(trackCounts).map(([track, count]) => ({ track, count }));

    return {
      totalUsers,
      totalSessions,
      avgOverallScore,
      signupsOverTime,
      sessionsPerDay,
      trackPopularity,
    };
  }
}

export const store = new Store();
