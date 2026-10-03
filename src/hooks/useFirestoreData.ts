import { useState, useEffect, useCallback, useRef } from 'react';
import {
  db,
  auth,
  doc,
  collection,
  collectionGroup,
  query,
  orderBy,
  onSnapshot,
  handleFirestoreError,
  OperationType,
  UserProfileDoc,
  UserPreferences,
  WeeklyTipSettings,
} from '../services/firebase';
import {
  FirestoreSessionDoc,
  FirestoreTranscriptTurn,
  FirestoreTipDoc,
  RoleTrackDoc,
  INITIAL_ROLE_TRACKS,
  seedInitialRoleTracksAndTips,
  updateCandidatePreferences,
  updateWeeklyTipSubscription,
  saveCandidateTip,
  deleteFirestoreSession,
} from '../services/dataService';
import { InterviewSession, TrackType, DifficultyType } from '../types';

/**
 * 1. useSessions() hook
 * Subscribes to real-time interview sessions for candidate or all sessions for admin
 */
export function useSessions(userId?: string, isAdminQuery: boolean = false) {
  const [sessions, setSessions] = useState<InterviewSession[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const currentUid = userId || auth.currentUser?.uid;
    if (!currentUid && !isAdminQuery) {
      setSessions([]);
      setLoading(false);
      return;
    }

    setLoading(true);
    setError(null);

    let unsubscribe = () => {};

    try {
      if (isAdminQuery) {
        // Collection group query for admins to view all sessions across candidates
        const sessionsRef = collectionGroup(db, 'sessions');
        const q = query(sessionsRef, orderBy('createdAt', 'desc'));
        unsubscribe = onSnapshot(
          q,
          (snapshot) => {
            const list: InterviewSession[] = snapshot.docs.map((docSnap) => {
              const data = docSnap.data() as FirestoreSessionDoc;
              return mapFirestoreToInterviewSession(docSnap.id, data);
            });
            setSessions(list);
            setLoading(false);
          },
          (err) => {
            console.warn('Admin sessions onSnapshot notice:', err);
            setError(err.message || 'Error syncing sessions');
            setLoading(false);
          }
        );
      } else {
        const path = `users/${currentUid}/sessions`;
        const userSessionsRef = collection(db, 'users', currentUid!, 'sessions');
        const q = query(userSessionsRef, orderBy('createdAt', 'desc'));

        unsubscribe = onSnapshot(
          q,
          (snapshot) => {
            const list: InterviewSession[] = snapshot.docs.map((docSnap) => {
              const data = docSnap.data() as FirestoreSessionDoc;
              return mapFirestoreToInterviewSession(docSnap.id, data);
            });
            setSessions(list);
            setLoading(false);
          },
          (err) => {
            console.warn('User sessions onSnapshot note:', err);
            // Non-fatal degraded mode
            setError(err.message || 'Real-time updates paused');
            setLoading(false);
          }
        );
      }
    } catch (err: any) {
      console.warn('Setup sessions listener note:', err);
      setError(err.message || 'Offline mode');
      setLoading(false);
    }

    return () => {
      unsubscribe();
    };
  }, [userId, isAdminQuery]);

  const removeSession = useCallback(
    async (sessionId: string) => {
      const currentUid = userId || auth.currentUser?.uid;
      if (!currentUid) return;
      try {
        await deleteFirestoreSession(currentUid, sessionId);
      } catch (err: any) {
        console.error('Failed to delete session:', err);
        throw err;
      }
    },
    [userId]
  );

  return { sessions, loading, error, deleteSession: removeSession };
}

/**
 * 2. useSession(sessionId) hook
 * Subscribes to a single interview session doc and its real-time transcript subcollection
 */
export function useSession(sessionId: string | undefined, userId?: string) {
  const [session, setSession] = useState<InterviewSession | null>(null);
  const [transcript, setTranscript] = useState<FirestoreTranscriptTurn[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!sessionId) {
      setSession(null);
      setTranscript([]);
      setLoading(false);
      return;
    }

    const currentUid = userId || auth.currentUser?.uid;
    if (!currentUid) {
      setLoading(false);
      return;
    }

    setLoading(true);
    setError(null);

    const sessionRef = doc(db, 'users', currentUid, 'sessions', sessionId);
    const transcriptRef = collection(db, 'users', currentUid, 'sessions', sessionId, 'transcript');
    const transcriptQuery = query(transcriptRef, orderBy('order', 'asc'));

    const unsubSession = onSnapshot(
      sessionRef,
      (docSnap) => {
        if (docSnap.exists()) {
          const data = docSnap.data() as FirestoreSessionDoc;
          setSession(mapFirestoreToInterviewSession(docSnap.id, data));
        } else {
          setSession(null);
        }
        setLoading(false);
      },
      (err) => {
        console.warn('Session doc onSnapshot note:', err);
        setError(err.message);
        setLoading(false);
      }
    );

    const unsubTranscript = onSnapshot(
      transcriptQuery,
      (snapshot) => {
        const turns: FirestoreTranscriptTurn[] = snapshot.docs.map((docSnap) => {
          return { id: docSnap.id, ...(docSnap.data() as any) };
        });
        setTranscript(turns);
      },
      (err) => {
        console.warn('Transcript onSnapshot note:', err);
      }
    );

    return () => {
      unsubSession();
      unsubTranscript();
    };
  }, [sessionId, userId]);

  return { session, transcript, loading, error };
}

/**
 * 3. useProfile(userId) hook
 * Subscribes to real-time user profile, preferences, and weekly tip settings
 */
const DEFAULT_PROFILE_PREFERENCES: UserPreferences = {
  defaultRoleTrack: 'SDE',
  defaultDifficulty: 'Intermediate',
  defaultCompanyPreset: 'General Tech',
  cameraEnabled: true,
};

const DEFAULT_WEEKLY_TIP: WeeklyTipSettings = {
  subscribed: true,
  frequency: 'weekly',
  lastSentAt: null,
};

export function useProfile(userId?: string) {
  const [profile, setProfile] = useState<UserProfileDoc | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const currentUid = userId || auth.currentUser?.uid;
    if (!currentUid) {
      setProfile(null);
      setLoading(false);
      return;
    }

    setLoading(true);
    setError(null);

    const userRef = doc(db, 'users', currentUid);
    const unsubscribe = onSnapshot(
      userRef,
      (docSnap) => {
        if (docSnap.exists()) {
          setProfile(docSnap.data() as UserProfileDoc);
        } else {
          setProfile(null);
        }
        setLoading(false);
      },
      (err) => {
        console.warn('User profile onSnapshot note:', err);
        setError(err.message);
        setLoading(false);
      }
    );

    return () => unsubscribe();
  }, [userId]);

  const updatePreferences = useCallback(
    async (prefs: UserPreferences) => {
      const currentUid = userId || auth.currentUser?.uid;
      if (!currentUid) return;
      await updateCandidatePreferences(currentUid, prefs);
    },
    [userId]
  );

  const toggleWeeklyTip = useCallback(
    async (subscribed: boolean) => {
      const currentUid = userId || auth.currentUser?.uid;
      if (!currentUid) return;
      await updateWeeklyTipSubscription(currentUid, subscribed);
    },
    [userId]
  );

  return {
    profile,
    preferences: profile?.preferences || DEFAULT_PROFILE_PREFERENCES,
    weeklyTip: profile?.weeklyTip || DEFAULT_WEEKLY_TIP,
    loading,
    error,
    updatePreferences,
    toggleWeeklyTip,
  };
}

/**
 * 4. useRoleTracks() hook
 * Reads/subscribes to global roleTracks catalog; auto-seeds on first run if empty
 */
export function useRoleTracks() {
  const [tracks, setTracks] = useState<RoleTrackDoc[]>(INITIAL_ROLE_TRACKS);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const hasSeededRef = useRef(false);

  useEffect(() => {
    const tracksColl = collection(db, 'roleTracks');

    const unsubscribe = onSnapshot(
      tracksColl,
      async (snapshot) => {
        if (snapshot.empty && !hasSeededRef.current) {
          hasSeededRef.current = true;
          await seedInitialRoleTracksAndTips(auth.currentUser?.uid);
        } else if (!snapshot.empty) {
          const list: RoleTrackDoc[] = snapshot.docs.map((docSnap) => {
            return { id: docSnap.id, ...(docSnap.data() as any) };
          });
          setTracks(list);
        }
        setLoading(false);
      },
      (err) => {
        console.warn('Role tracks listener note (using local fallback catalog):', err);
        setTracks(INITIAL_ROLE_TRACKS);
        setLoading(false);
      }
    );

    return () => unsubscribe();
  }, []);

  return { tracks, loading, error };
}

/**
 * 5. useTips(userId) hook
 * Subscribes to real-time generated weekly tips in users/{uid}/tips
 */
export function useTips(userId?: string) {
  const [tips, setTips] = useState<FirestoreTipDoc[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const currentUid = userId || auth.currentUser?.uid;
    if (!currentUid) {
      setTips([]);
      setLoading(false);
      return;
    }

    setLoading(true);
    setError(null);

    const tipsColl = collection(db, 'users', currentUid, 'tips');
    const q = query(tipsColl, orderBy('createdAt', 'desc'));

    const unsubscribe = onSnapshot(
      q,
      (snapshot) => {
        const list: FirestoreTipDoc[] = snapshot.docs.map((docSnap) => {
          return { id: docSnap.id, ...(docSnap.data() as any) };
        });
        setTips(list);
        setLoading(false);
      },
      (err) => {
        console.warn('Tips onSnapshot note:', err);
        setLoading(false);
      }
    );

    return () => unsubscribe();
  }, [userId]);

  const saveTip = useCallback(
    async (tip: {
      targetCategory: string;
      subject: string;
      headline: string;
      coreTip: string;
      actionableExercise: string;
      sampleAnswerSnippet: string;
    }) => {
      const currentUid = userId || auth.currentUser?.uid;
      if (!currentUid) return null;
      return await saveCandidateTip(currentUid, tip);
    },
    [userId]
  );

  return {
    tips,
    latestTip: tips.length > 0 ? tips[0] : null,
    loading,
    error,
    saveTip,
  };
}

/**
 * Helper to convert FirestoreSessionDoc to UI InterviewSession
 */
function mapFirestoreToInterviewSession(id: string, docData: FirestoreSessionDoc): InterviewSession {
  const parseDate = (val: any): string => {
    if (!val) return new Date().toISOString();
    if (typeof val === 'string') return val;
    if (val.toDate && typeof val.toDate === 'function') {
      return val.toDate().toISOString();
    }
    return new Date().toISOString();
  };

  return {
    id: docData.id || id,
    userId: docData.userId || '',
    track: (docData.roleTrack || docData.track || 'SDE') as TrackType,
    difficulty: (docData.difficulty || 'Intermediate') as DifficultyType,
    companyPreset: docData.companyPreset || 'General Tech',
    jobDescription: docData.jobDescription || '',
    status: (docData.status === 'completed' ? 'completed' : 'in_progress') as any,
    overallScore: docData.overallScore,
    createdAt: parseDate(docData.createdAt || docData.startedAt),
    completedAt: docData.completedAt || docData.endedAt ? parseDate(docData.completedAt || docData.endedAt) : undefined,
    strengths: docData.strengths || [],
    weaknesses: docData.weaknesses || [],
    totalQuestionsCount: docData.totalQuestionsCount || 3,
    proctoring: docData.proctoring,
    improvementPlan: docData.improvements && docData.improvements.length > 0
      ? {
          id: `plan-${id}`,
          sessionId: id,
          focusAreas: docData.weaknesses || [],
          suggestedPractice: docData.improvements || [],
          completed: false,
        }
      : undefined,
  };
}
