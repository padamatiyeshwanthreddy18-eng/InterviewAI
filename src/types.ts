export type RoleType = 'user' | 'admin';

export type TrackType =
  | 'SDE'
  | 'Frontend Engineer'
  | 'Full Stack Engineer'
  | 'Data Scientist'
  | 'Data Engineer'
  | 'DevOps & Cloud'
  | 'Cybersecurity'
  | 'Product Manager'
  | 'QA & Automation'
  | 'HR/Behavioral';

export const ROLE_TRACKS: TrackType[] = [
  'SDE',
  'Frontend Engineer',
  'Full Stack Engineer',
  'Data Scientist',
  'Data Engineer',
  'DevOps & Cloud',
  'Cybersecurity',
  'Product Manager',
  'QA & Automation',
  'HR/Behavioral',
];

export type DifficultyType = 'Beginner' | 'Intermediate' | 'Advanced';

export interface User {
  id: string;
  email: string;
  name: string;
  role: RoleType;
  createdAt: string;
  emailTipEnabled?: boolean;
  photoURL?: string;
  provider?: string;
  lastLoginAt?: string;
  uid?: string;
}

export interface Resume {
  id: string;
  userId: string;
  fileName: string;
  parsedSkills: string[];
  parsedExperience: string;
  uploadedAt: string;
}

export interface InterviewQuestion {
  id: string;
  sessionId: string;
  questionText: string;
  questionType: 'technical' | 'behavioral' | 'situational' | 'system_design';
  orderIndex: number;
  isFollowup: boolean;
  parentQuestionId?: string;
  ttsAudioUrl?: string;
}

export interface InterviewAnswer {
  id: string;
  questionId: string;
  transcriptText: string;
  audioUrl?: string;
  technicalScore: number; // 0-100
  communicationScore: number; // 0-100
  sentimentScore: number; // 0-100 (confidence)
  aiFeedback: string; // 2-3 sentence critique
  createdCompletedAt?: string;
}

export interface QuestionWithAnswer extends InterviewQuestion {
  answer?: InterviewAnswer;
}

export interface ImprovementPlan {
  id: string;
  sessionId: string;
  focusAreas: string[];
  suggestedPractice: string[];
  completed: boolean;
}

export interface ProctoringEvent {
  id: string;
  type: 'tab_switch' | 'window_blur' | 'fullscreen_exit' | 'screen_share_change';
  timestamp: string;
  durationSeconds?: number;
  details?: string;
}

export interface ProctoringReport {
  tabSwitchCount: number;
  totalTimeAwaySeconds: number;
  fullscreenViolationsCount: number;
  integrityScore: number; // 0-100%
  events: ProctoringEvent[];
  lastTabSwitchTime?: string;
  activeScreenStatus?: 'clean' | 'suspicious' | 'flagged';
}

export interface InterviewSession {
  id: string;
  userId: string;
  track: TrackType;
  difficulty: DifficultyType;
  jobDescription?: string;
  companyPreset?: string;
  status: 'in_progress' | 'completed';
  overallScore?: number; // 0-100
  createdAt: string;
  completedAt?: string;
  strengths?: string[];
  weaknesses?: string[];
  totalQuestionsCount: number;
  questions?: QuestionWithAnswer[];
  improvementPlan?: ImprovementPlan;
  proctoring?: ProctoringReport;
}

export interface AdminAnalytics {
  totalUsers: number;
  totalSessions: number;
  avgOverallScore: number;
  signupsOverTime: { date: string; count: number }[];
  sessionsPerDay: { date: string; count: number }[];
  trackPopularity: { track: string; count: number }[];
}

export interface AuthState {
  user: User | null;
  token: string | null;
}
