import {
  db,
  auth,
  doc,
  getDoc,
  getDocs,
  setDoc,
  updateDoc,
  deleteDoc,
  collection,
  collectionGroup,
  query,
  where,
  orderBy,
  limit,
  serverTimestamp,
  handleFirestoreError,
  OperationType,
  UserPreferences,
  WeeklyTipSettings,
} from './firebase';
import { TrackType, DifficultyType, InterviewSession, ProctoringReport } from '../types';

export interface FirestoreSessionDoc {
  id: string;
  userId: string;
  roleTrack: TrackType;
  track: TrackType;
  difficulty: DifficultyType;
  companyPreset?: string;
  jobDescription?: string;
  status: 'in_progress' | 'completed' | 'abandoned';
  startedAt: any;
  endedAt?: any;
  durationSeconds?: number;
  overallScore?: number;
  technicalScore?: number;
  communicationScore?: number;
  sentimentScore?: number;
  feedbackSummary?: string;
  strengths?: string[];
  weaknesses?: string[];
  improvements?: string[];
  totalQuestionsCount: number;
  completedAt?: any;
  createdAt?: any;
  proctoring?: ProctoringReport;
}

export interface FirestoreTranscriptTurn {
  id: string;
  sessionId: string;
  speaker: 'ai' | 'user';
  text: string;
  timestamp: any;
  order: number;
  questionId?: string;
  technicalScore?: number;
  communicationScore?: number;
  aiFeedback?: string;
}

export interface FirestoreTipDoc {
  id: string;
  userId: string;
  targetCategory: string;
  subject: string;
  headline: string;
  coreTip: string;
  actionableExercise: string;
  sampleAnswerSnippet: string;
  createdAt: any;
  sentAt?: any;
}

export interface RoleTrackDoc {
  id: string;
  name: string;
  shortCode: string;
  description: string;
  framework: string;
  idealPacing: string;
  mindset: string;
  checklist: string[];
  focusAreas: string[];
  tips?: {
    coreTechnical?: string[];
    communication?: string[];
    pitfalls?: string[];
    confidence?: string[];
  };
  icon?: string;
}

export const INITIAL_ROLE_TRACKS: RoleTrackDoc[] = [
  {
    id: 'SDE',
    name: 'Software Engineer (SDE)',
    shortCode: 'SDE',
    description: 'System design, microservices, distributed caching, algorithms & concurrency.',
    framework: 'Understand → Brute Force → Optimize → Code → Test Edge Cases',
    idealPacing: '2-3 min clarifying problem, 15 min coding, 5 min testing',
    mindset: 'Think out loud continuously. Interviewers care as much about your problem-solving reasoning as the final code.',
    checklist: [
      'Reviewed Big-O cheat sheet for arrays, heaps, and tree traversals',
      'Prepared 2 questions regarding system scale and API constraints',
      'Tested voice input or microphone clarity',
    ],
    focusAreas: ['Distributed Systems', 'Data Structures & Algorithms', 'Concurrency', 'Caching & Databases'],
    tips: {
      coreTechnical: ['Refresh time & space complexity analysis (Big-O notation).', 'Review core data structures: Hash Maps, Trees, Graphs.'],
      communication: ['Always state the brute force solution first before jumping into optimizations.', 'Narrate your thought process.'],
      pitfalls: ['Jumping straight into coding without clarifying constraints.', 'Staying silent for longer than 15-20 seconds.'],
      confidence: ['Ask clarifying questions freely.', 'Collaborate with the interviewer as a teammate.'],
    },
    icon: 'Code2',
  },
  {
    id: 'Frontend Engineer',
    name: 'Frontend Engineer',
    shortCode: 'FE',
    description: 'React, performance optimization, state management, CSS architecture & web security.',
    framework: 'Requirements → Architecture / Component Tree → State Model → Performance & Edge Cases',
    idealPacing: '5 min scoping UI states, 15 min component design, 5 min rendering optimization',
    mindset: 'Prioritize user experience, accessibility, and bundle/render performance.',
    checklist: ['Reviewed React fiber lifecycle & hooks mechanics', 'Prepared CSS grid/flexbox & responsive patterns'],
    focusAreas: ['React Architecture', 'Web Performance (Core Web Vitals)', 'Accessibility (a11y)', 'State Management'],
    tips: {
      coreTechnical: ['Understand reconciliation and memoization.', 'Know how browser event loop and paint pipelines operate.'],
      communication: ['Explain state lifting and render optimization choices.'],
      pitfalls: ['Over-engineering state libraries when local state suffices.'],
      confidence: ['Mention real-world accessibility standards (ARIA, keyboard navigation).'],
    },
    icon: 'Layout',
  },
  {
    id: 'Full Stack Engineer',
    name: 'Full Stack Engineer',
    shortCode: 'FS',
    description: 'End-to-end web apps, Node.js/Express, REST/GraphQL APIs & database integrations.',
    framework: 'API Contract → Data Model → Backend Architecture → Frontend Integration → Failure Modes',
    idealPacing: '5 min architecture, 10 min API/DB design, 10 min frontend client integration',
    mindset: 'Demonstrate holistic understanding from browser network calls down to SQL disk writes.',
    checklist: ['Checked REST vs GraphQL tradeoff matrix', 'Prepared database index design principles'],
    focusAreas: ['API Design', 'Database Modeling', 'Full Stack Security', 'Authentication & JWTs'],
    icon: 'Layers',
  },
  {
    id: 'Data Scientist',
    name: 'Data Scientist / AI ML',
    shortCode: 'DS',
    description: 'Machine learning algorithms, model evaluation, feature engineering & A/B testing.',
    framework: 'Business Objective → Metric Definition → Data Pipeline & Features → Model Selection → Offline/Online Eval',
    idealPacing: '5 min framing business metric, 10 min feature engineering, 10 min evaluation & A/B test design',
    mindset: 'Tie every modeling decision back to actionable business metrics and real-world latency.',
    checklist: ['Reviewed Precision vs Recall vs ROC-AUC', 'Prepared statistical significance & p-value thresholds'],
    focusAreas: ['Machine Learning', 'Statistical Modeling', 'Feature Engineering', 'A/B Testing & Evaluation'],
    icon: 'Database',
  },
  {
    id: 'Data Engineer',
    name: 'Data Engineer',
    shortCode: 'DE',
    description: 'ETL pipelines, Spark, Kafka, data warehousing, SQL optimization & schema design.',
    framework: 'Throughput Requirements → Ingestion (Batch/Streaming) → Storage (Lake/Warehouse) → Transformations → Serving',
    idealPacing: '5 min volume & SLA scoping, 12 min pipeline architecture, 8 min failure recovery & idempotency',
    mindset: 'Focus on idempotency, backpressure handling, schema evolution, and partition strategies.',
    checklist: ['Reviewed distributed join strategies (Broadcast vs Shuffle)', 'Prepared Kafka consumer group rebalancing'],
    focusAreas: ['Distributed Data Pipelines', 'Data Warehousing', 'Streaming & Kafka', 'SQL Optimization'],
    icon: 'Cpu',
  },
  {
    id: 'DevOps & Cloud',
    name: 'DevOps & Cloud Architect',
    shortCode: 'DevOps',
    description: 'Kubernetes, Docker, CI/CD pipelines, Terraform, AWS/GCP & infrastructure as code.',
    framework: 'Reliability (SLA/SLO) → Infrastructure as Code → CI/CD Pipeline → Observability (Metrics/Logs/Traces) → Security',
    idealPacing: '5 min requirements & SLOs, 10 min cloud infra topology, 10 min pipeline & disaster recovery',
    mindset: 'Everything as code; design for zero-downtime rollouts and rapid disaster recovery.',
    checklist: ['Reviewed Kubernetes deployment rollout strategies (Canary vs Blue/Green)', 'Prepared Terraform state locking'],
    focusAreas: ['Kubernetes & Containers', 'CI/CD Automation', 'Cloud Security & IAM', 'Observability (Prometheus/Grafana)'],
    icon: 'Cloud',
  },
  {
    id: 'Cybersecurity',
    name: 'Cybersecurity Specialist',
    shortCode: 'Sec',
    description: 'Network defense, zero-trust architectures, vulnerability analysis & incident response.',
    framework: 'Threat Modeling (STRIDE) → Attack Surface Analysis → Defense in Depth → Incident Response Plan',
    idealPacing: '5 min threat vectors, 12 min mitigation controls, 8 min detection & containment',
    mindset: 'Assume breach. Zero trust everywhere: verify explicitly, enforce least privilege.',
    checklist: ['Reviewed OWASP Top 10 vulnerabilities', 'Prepared OAuth 2.0 PKCE and Mutual TLS mechanics'],
    focusAreas: ['Threat Modeling', 'Zero Trust Architecture', 'Application Security', 'Incident Containment'],
    icon: 'Shield',
  },
  {
    id: 'Product Manager',
    name: 'Product Manager',
    shortCode: 'PM',
    description: 'Product strategy, execution frameworks, metric design & cross-functional leadership.',
    framework: 'User Persona & Pain Points → Solution Brainstorming → Prioritization (RICE) → North Star Metric → Launch/Risks',
    idealPacing: '5 min user segmentation, 10 min prioritized solutions, 10 min metrics & trade-offs',
    mindset: 'Customer obsession grounded in business outcomes and ruthlessly prioritized trade-offs.',
    checklist: ['Prepared North Star metric definition framework', 'Reviewed behavioral leadership examples'],
    focusAreas: ['Product Strategy', 'Metric Definition', 'Customer Empathy', 'Execution & Tradeoffs'],
    icon: 'Briefcase',
  },
  {
    id: 'QA & Automation',
    name: 'QA & Test Automation',
    shortCode: 'QA',
    description: 'End-to-end test automation, Playwright/Selenium, load testing & quality strategy.',
    framework: 'Testing Pyramid → Test Plan Matrix → Automation Strategy → CI/CD Integration → Defect Triage',
    idealPacing: '5 min risk matrix, 12 min automation framework architecture, 8 min load/chaos testing',
    mindset: 'Quality is preventative, not reactive; automate the critical path and shift testing left.',
    checklist: ['Reviewed Page Object Model design pattern', 'Prepared API mock and contract testing strategies'],
    focusAreas: ['Test Automation Architecture', 'Load & Stress Testing', 'CI Test Gates', 'Defect Prevention'],
    icon: 'CheckSquare',
  },
  {
    id: 'HR/Behavioral',
    name: 'HR & Behavioral (STAR)',
    shortCode: 'HR',
    description: 'Behavioral scenarios, conflict resolution, leadership principles & culture fit.',
    framework: 'Situation (15%) → Task (15%) → Action (50%) → Result (20% with quantitative metrics)',
    idealPacing: '1 min context & challenge, 2 min actions taken, 1 min quantified outcome & learning',
    mindset: 'Be authentic, emphasize ownership, highlight collaboration, and back claims with concrete numbers.',
    checklist: ['Prepared 4 distinct STAR stories covering conflict, failure, initiative, and leadership', 'Checked company culture principles'],
    focusAreas: ['STAR Method Mastery', 'Conflict Resolution', 'Ownership & Bias for Action', 'Failure & Learning'],
    icon: 'Users',
  },
];

/**
 * 7. One-Time Seed:
 * Populates roleTracks collection from hardcoded array on first run if empty,
 * and seeds an initial personalized practice tip for the user.
 */
export async function seedInitialRoleTracksAndTips(userId?: string): Promise<void> {
  try {
    const tracksColl = collection(db, 'roleTracks');
    let snap;
    try {
      snap = await getDocs(tracksColl);
    } catch (err) {
      console.warn('Checking roleTracks note:', err);
      return;
    }

    if (snap.empty) {
      console.log('Seeding roleTracks catalog to Firestore...');
      for (const track of INITIAL_ROLE_TRACKS) {
        const trackRef = doc(db, 'roleTracks', track.id);
        try {
          await setDoc(trackRef, track);
        } catch (err) {
          handleFirestoreError(err, OperationType.CREATE, `roleTracks/${track.id}`);
        }
      }
      console.log('Role tracks successfully seeded.');
    }

    // Seed default weekly tip if user provided and tips collection is empty
    if (userId) {
      const tipsColl = collection(db, 'users', userId, 'tips');
      let tipsSnap;
      try {
        tipsSnap = await getDocs(tipsColl);
      } catch (err) {
        console.warn('Checking user tips note:', err);
        return;
      }

      if (tipsSnap.empty) {
        const defaultTipRef = doc(db, 'users', userId, 'tips', 'welcome-tip-1');
        const defaultTip: FirestoreTipDoc = {
          id: 'welcome-tip-1',
          userId,
          targetCategory: 'System Architecture & Edge Case Coverage',
          subject: 'Mastering System Design Tradeoffs & Edge Cases',
          headline: 'Never propose a solution without stating its primary drawback',
          coreTip: 'Top-tier tech interviewers evaluate senior candidates by their ability to anticipate system bottlenecks before they happen. Always discuss read/write ratios, cache invalidation, and data consistency models.',
          actionableExercise: 'Pick a feature you built recently. Write down 3 ways it could fail if user volume increased 100x, and how you would mitigate each.',
          sampleAnswerSnippet: 'While a Redis write-through cache guarantees read freshness, it increases write latency. For our write-heavy pipeline, an asynchronous write-back cache with a dead-letter queue is a more resilient choice.',
          createdAt: serverTimestamp(),
          sentAt: serverTimestamp(),
        };

        try {
          await setDoc(defaultTipRef, defaultTip);
        } catch (err) {
          handleFirestoreError(err, OperationType.CREATE, `users/${userId}/tips/welcome-tip-1`);
        }
      }
    }
  } catch (err) {
    console.warn('Seeding note (continuing safely):', err);
  }
}

/**
 * 3. Saving a Session:
 * Create session doc in users/{userId}/sessions/{sessionId} (status: "in_progress")
 * Append initial AI question transcript turn
 */
export async function createFirestoreSession(
  userId: string,
  sessionData: {
    sessionId: string;
    roleTrack: TrackType;
    difficulty: DifficultyType;
    companyPreset?: string;
    jobDescription?: string;
    totalQuestionsCount: number;
    initialQuestionText?: string;
    initialQuestionType?: string;
  }
): Promise<void> {
  const path = `users/${userId}/sessions/${sessionData.sessionId}`;
  try {
    const sessionRef = doc(db, 'users', userId, 'sessions', sessionData.sessionId);
    const sessionDoc: FirestoreSessionDoc = {
      id: sessionData.sessionId,
      userId,
      roleTrack: sessionData.roleTrack,
      track: sessionData.roleTrack,
      difficulty: sessionData.difficulty,
      companyPreset: sessionData.companyPreset || 'General Tech',
      jobDescription: sessionData.jobDescription || '',
      status: 'in_progress',
      startedAt: serverTimestamp(),
      createdAt: serverTimestamp(),
      totalQuestionsCount: sessionData.totalQuestionsCount,
    };

    await setDoc(sessionRef, sessionDoc);

    // Append initial question turn if provided
    if (sessionData.initialQuestionText) {
      const turnPath = `${path}/transcript/turn-1`;
      const turnRef = doc(db, 'users', userId, 'sessions', sessionData.sessionId, 'transcript', 'turn-1');
      const firstTurn: FirestoreTranscriptTurn = {
        id: 'turn-1',
        sessionId: sessionData.sessionId,
        speaker: 'ai',
        text: sessionData.initialQuestionText,
        timestamp: serverTimestamp(),
        order: 1,
      };
      await setDoc(turnRef, firstTurn);
    }
  } catch (err) {
    handleFirestoreError(err, OperationType.CREATE, path);
  }
}

/**
 * Append transcript turns in real time
 */
export async function appendTranscriptTurn(
  userId: string,
  sessionId: string,
  turnData: {
    turnId: string;
    speaker: 'ai' | 'user';
    text: string;
    order: number;
    questionId?: string;
    technicalScore?: number;
    communicationScore?: number;
    aiFeedback?: string;
  }
): Promise<void> {
  const path = `users/${userId}/sessions/${sessionId}/transcript/${turnData.turnId}`;
  try {
    const turnRef = doc(db, 'users', userId, 'sessions', sessionId, 'transcript', turnData.turnId);
    const turnDoc: FirestoreTranscriptTurn = {
      id: turnData.turnId,
      sessionId,
      speaker: turnData.speaker,
      text: turnData.text,
      timestamp: serverTimestamp(),
      order: turnData.order,
      questionId: turnData.questionId,
      technicalScore: turnData.technicalScore,
      communicationScore: turnData.communicationScore,
      aiFeedback: turnData.aiFeedback,
    };
    await setDoc(turnRef, turnDoc);
  } catch (err) {
    handleFirestoreError(err, OperationType.CREATE, path);
  }
}

/**
 * Complete session doc with final scores, report, and metrics
 */
export async function completeFirestoreSession(
  userId: string,
  sessionId: string,
  summary: {
    overallScore: number;
    technicalScore?: number;
    communicationScore?: number;
    sentimentScore?: number;
    feedbackSummary?: string;
    strengths?: string[];
    weaknesses?: string[];
    improvements?: string[];
    durationSeconds?: number;
    proctoring?: ProctoringReport;
  }
): Promise<void> {
  const path = `users/${userId}/sessions/${sessionId}`;
  try {
    const sessionRef = doc(db, 'users', userId, 'sessions', sessionId);
    await updateDoc(sessionRef, {
      status: 'completed',
      endedAt: serverTimestamp(),
      completedAt: serverTimestamp(),
      overallScore: summary.overallScore,
      technicalScore: summary.technicalScore ?? summary.overallScore,
      communicationScore: summary.communicationScore ?? 80,
      sentimentScore: summary.sentimentScore ?? 85,
      feedbackSummary: summary.feedbackSummary || '',
      strengths: summary.strengths || [],
      weaknesses: summary.weaknesses || [],
      improvements: summary.improvements || [],
      durationSeconds: summary.durationSeconds || 0,
      ...(summary.proctoring ? { proctoring: summary.proctoring } : {}),
    });
  } catch (err) {
    handleFirestoreError(err, OperationType.UPDATE, path);
  }
}

/**
 * Mark session as abandoned if user exits early
 */
export async function abandonFirestoreSession(
  userId: string,
  sessionId: string,
  durationSeconds?: number
): Promise<void> {
  const path = `users/${userId}/sessions/${sessionId}`;
  try {
    const sessionRef = doc(db, 'users', userId, 'sessions', sessionId);
    await updateDoc(sessionRef, {
      status: 'abandoned',
      endedAt: serverTimestamp(),
      durationSeconds: durationSeconds || 0,
    });
  } catch (err) {
    handleFirestoreError(err, OperationType.UPDATE, path);
  }
}

/**
 * Delete a session from Firestore
 */
export async function deleteFirestoreSession(userId: string, sessionId: string): Promise<void> {
  const path = `users/${userId}/sessions/${sessionId}`;
  try {
    const sessionRef = doc(db, 'users', userId, 'sessions', sessionId);
    await deleteDoc(sessionRef);
  } catch (err) {
    handleFirestoreError(err, OperationType.DELETE, path);
  }
}

/**
 * Update candidate preferences in users/{uid}
 */
export async function updateCandidatePreferences(
  userId: string,
  prefs: UserPreferences
): Promise<void> {
  const path = `users/${userId}`;
  try {
    const userRef = doc(db, 'users', userId);
    await updateDoc(userRef, {
      preferences: prefs,
    });
  } catch (err) {
    handleFirestoreError(err, OperationType.UPDATE, path);
  }
}

/**
 * Toggle weekly practice tip subscription in users/{uid}
 */
export async function updateWeeklyTipSubscription(
  userId: string,
  subscribed: boolean
): Promise<void> {
  const path = `users/${userId}`;
  try {
    const userRef = doc(db, 'users', userId);
    await updateDoc(userRef, {
      'weeklyTip.subscribed': subscribed,
      'weeklyTip.lastSentAt': serverTimestamp(),
    });
  } catch (err) {
    handleFirestoreError(err, OperationType.UPDATE, path);
  }
}

/**
 * Save newly generated tip into users/{userId}/tips/{tipId}
 */
export async function saveCandidateTip(
  userId: string,
  tip: {
    targetCategory: string;
    subject: string;
    headline: string;
    coreTip: string;
    actionableExercise: string;
    sampleAnswerSnippet: string;
  }
): Promise<FirestoreTipDoc> {
  const tipId = `tip-${Date.now()}`;
  const path = `users/${userId}/tips/${tipId}`;
  try {
    const tipRef = doc(db, 'users', userId, 'tips', tipId);
    const newTip: FirestoreTipDoc = {
      id: tipId,
      userId,
      ...tip,
      createdAt: serverTimestamp(),
      sentAt: serverTimestamp(),
    };
    await setDoc(tipRef, newTip);
    return newTip;
  } catch (err) {
    handleFirestoreError(err, OperationType.CREATE, path);
  }
}
