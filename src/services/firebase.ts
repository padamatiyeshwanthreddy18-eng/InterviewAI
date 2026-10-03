import { initializeApp, getApps, getApp } from 'firebase/app';
import {
  getAuth,
  GoogleAuthProvider,
  GithubAuthProvider,
  OAuthProvider,
  signInWithPopup,
  signInWithRedirect,
  getRedirectResult,
  signOut as firebaseSignOut,
  linkWithPopup,
  unlink,
  onAuthStateChanged,
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
  deleteUser as firebaseDeleteUser,
  User as FirebaseUser,
  fetchSignInMethodsForEmail,
} from 'firebase/auth';
import {
  getFirestore,
  doc,
  getDoc,
  getDocFromServer,
  setDoc,
  updateDoc,
  deleteDoc,
  collection,
  collectionGroup,
  query,
  where,
  orderBy,
  limit,
  onSnapshot,
  getDocs,
  serverTimestamp,
  Timestamp,
} from 'firebase/firestore';
import firebaseConfig from '../../firebase-applet-config.json';

export const app = getApps().length > 0 ? getApp() : initializeApp(firebaseConfig);
export const auth = getAuth(app);
export const db = getFirestore(app, firebaseConfig.firestoreDatabaseId);

// Validate Connection to Firestore on startup
export async function testConnection() {
  try {
    await getDocFromServer(doc(db, 'test', 'connection'));
  } catch (error) {
    if (error instanceof Error && error.message.includes('the client is offline')) {
      console.warn('Firestore offline check notice: Please verify your Firebase connection.');
    }
  }
}
testConnection();

// Authentication Providers
export const googleProvider = new GoogleAuthProvider();
googleProvider.setCustomParameters({ prompt: 'select_account' });

export const githubProvider = new GithubAuthProvider();
githubProvider.addScope('read:user');
githubProvider.addScope('user:email');

export const appleProvider = new OAuthProvider('apple.com');
appleProvider.addScope('email');
appleProvider.addScope('name');

// 3. Error handler conforming to FirestoreErrorInfo
export enum OperationType {
  CREATE = 'create',
  UPDATE = 'update',
  DELETE = 'delete',
  LIST = 'list',
  GET = 'get',
  WRITE = 'write',
}

export interface FirestoreErrorInfo {
  error: string;
  operationType: OperationType;
  path: string | null;
  authInfo: {
    userId?: string | null;
    email?: string | null;
    emailVerified?: boolean | null;
    isAnonymous?: boolean | null;
    tenantId?: string | null;
    providerInfo?: {
      providerId?: string | null;
      email?: string | null;
    }[];
  };
}

export function handleFirestoreError(
  error: unknown,
  operationType: OperationType,
  path: string | null
): never {
  const errInfo: FirestoreErrorInfo = {
    error: error instanceof Error ? error.message : String(error),
    authInfo: {
      userId: auth.currentUser?.uid,
      email: auth.currentUser?.email,
      emailVerified: auth.currentUser?.emailVerified,
      isAnonymous: auth.currentUser?.isAnonymous,
      tenantId: auth.currentUser?.tenantId,
      providerInfo:
        auth.currentUser?.providerData?.map((provider) => ({
          providerId: provider.providerId,
          email: provider.email,
        })) || [],
    },
    operationType,
    path,
  };
  console.error('Firestore Error: ', JSON.stringify(errInfo));
  throw new Error(JSON.stringify(errInfo));
}

export interface UserPreferences {
  defaultRoleTrack?: string;
  defaultDifficulty?: 'Beginner' | 'Intermediate' | 'Advanced';
  defaultCompanyPreset?: string;
  cameraEnabled?: boolean;
}

export interface WeeklyTipSettings {
  subscribed: boolean;
  frequency: 'weekly';
  lastSentAt?: string | null;
}

export interface UserProfileDoc {
  uid: string;
  displayName: string;
  email: string;
  photoURL: string;
  provider: string;
  role: 'user' | 'admin';
  createdAt: any;
  lastLoginAt: any;
  preferences?: UserPreferences;
  weeklyTip?: WeeklyTipSettings;
}

/**
 * Creates or updates the users/{uid} profile document in Firestore.
 * Invariant: Never overwrites an existing 'admin' role with 'user'.
 */
export async function syncUserProfileDoc(
  fbUser: FirebaseUser,
  providerOverride?: string
): Promise<{ role: 'user' | 'admin' }> {
  try {
    const userRef = doc(db, 'users', fbUser.uid);
    let existingSnap;
    try {
      existingSnap = await getDoc(userRef);
    } catch (err) {
      handleFirestoreError(err, OperationType.GET, `users/${fbUser.uid}`);
    }

    const providerId =
      providerOverride ||
      fbUser.providerData?.[0]?.providerId ||
      'firebase';

    const displayName =
      fbUser.displayName ||
      fbUser.email?.split('@')[0] ||
      'Candidate';

    const photoURL = fbUser.photoURL || '';

    if (existingSnap.exists()) {
      const data = existingSnap.data() as UserProfileDoc;
      const currentRole = data.role === 'admin' ? 'admin' : 'user';

      try {
        await updateDoc(userRef, {
          displayName: displayName || data.displayName,
          email: fbUser.email || data.email,
          photoURL: photoURL || data.photoURL,
          provider: providerId || data.provider,
          lastLoginAt: serverTimestamp(),
        });
      } catch (err) {
        handleFirestoreError(err, OperationType.UPDATE, `users/${fbUser.uid}`);
      }

      return { role: currentRole };
    } else {
      const isOwnerEmail = fbUser.email?.toLowerCase() === 'sachigogulwar525@gmail.com';
      const initialRole: 'user' | 'admin' = isOwnerEmail ? 'admin' : 'user';

      const newDoc: UserProfileDoc = {
        uid: fbUser.uid,
        displayName,
        email: fbUser.email || `${fbUser.uid}@firebase.user`,
        photoURL,
        provider: providerId,
        role: initialRole,
        createdAt: serverTimestamp(),
        lastLoginAt: serverTimestamp(),
        preferences: {
          defaultRoleTrack: 'SDE',
          defaultDifficulty: 'Intermediate',
          defaultCompanyPreset: 'General Tech',
          cameraEnabled: true,
        },
        weeklyTip: {
          subscribed: true,
          frequency: 'weekly',
          lastSentAt: null,
        },
      };

      try {
        await setDoc(userRef, newDoc);
      } catch (err) {
        handleFirestoreError(err, OperationType.CREATE, `users/${fbUser.uid}`);
      }

      return { role: initialRole };
    }
  } catch (err) {
    console.warn('Firestore profile sync note (continuing with session):', err);
    return {
      role: fbUser.email?.toLowerCase() === 'sachigogulwar525@gmail.com' ? 'admin' : 'user',
    };
  }
}

/**
 * Friendly error message mapper for Firebase Auth error codes
 */
export function getFriendlyAuthErrorMessage(error: any): string {
  if (!error) return 'An unexpected authentication error occurred.';
  const code = error.code || '';
  const message = error.message || '';

  switch (code) {
    case 'auth/popup-closed-by-user':
      return 'Sign in was cancelled because the popup was closed before completing.';
    case 'auth/popup-blocked':
      return 'The sign-in popup was blocked by your browser. Please allow popups or use redirect mode.';
    case 'auth/network-request-failed':
      return 'Network connection error. Please verify your internet connection and try again.';
    case 'auth/account-exists-with-different-credential':
      return 'An account already exists with the same email using a different sign-in provider. Sign in with that provider to link accounts.';
    case 'auth/invalid-credential':
    case 'auth/wrong-password':
      return 'Invalid email or password. Please verify and try again.';
    case 'auth/user-not-found':
      return 'No account exists with this email address. Please sign up first.';
    case 'auth/email-already-in-use':
      return 'An account with this email address already exists. Please log in.';
    case 'auth/weak-password':
      return 'Password must be at least 6 characters.';
    case 'auth/invalid-email':
      return 'Please enter a valid email address.';
    case 'auth/operation-not-allowed':
      return 'This sign-in provider is not enabled in Firebase Console yet. Please check your Authentication settings.';
    case 'auth/cancelled-popup-request':
      return 'Previous sign-in request cancelled. Please try again.';
    case 'auth/requires-recent-login':
      return 'This action requires recent authentication. Please sign out and sign in again before proceeding.';
    default:
      if (message.includes('API key')) {
        return 'Firebase Authentication is initializing. If using custom credentials, please verify your environment configuration.';
      }
      return message || 'Authentication failed. Please try again.';
  }
}

export {
  signInWithPopup,
  signInWithRedirect,
  getRedirectResult,
  firebaseSignOut,
  linkWithPopup,
  unlink,
  onAuthStateChanged,
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
  firebaseDeleteUser,
  fetchSignInMethodsForEmail,
  doc,
  getDoc,
  getDocFromServer,
  setDoc,
  updateDoc,
  deleteDoc,
  collection,
  collectionGroup,
  query,
  where,
  orderBy,
  limit,
  onSnapshot,
  getDocs,
  serverTimestamp,
  Timestamp,
};
