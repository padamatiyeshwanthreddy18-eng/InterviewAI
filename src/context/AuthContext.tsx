import React, { createContext, useContext, useState, useEffect } from 'react';
import { User } from '../types';
import {
  auth,
  googleProvider,
  githubProvider,
  appleProvider,
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
  syncUserProfileDoc,
  getFriendlyAuthErrorMessage,
} from '../services/firebase';
import type { User as FirebaseUser, AuthProvider as FirebaseAuthProvider } from 'firebase/auth';

interface AuthContextType {
  user: User | null;
  firebaseUser: FirebaseUser | null;
  token: string | null;
  isLoading: boolean;
  loading: boolean;
  theme: 'dark' | 'light';
  toggleTheme: () => void;
  // Social Auth
  signInWithGoogle: (useRedirect?: boolean) => Promise<{ success: boolean; error?: string }>;
  signInWithGitHub: (useRedirect?: boolean) => Promise<{ success: boolean; error?: string }>;
  signInWithApple: (useRedirect?: boolean) => Promise<{ success: boolean; error?: string }>;
  linkProvider: (providerId: 'google.com' | 'github.com' | 'apple.com') => Promise<{ success: boolean; error?: string }>;
  unlinkProvider: (providerId: string) => Promise<{ success: boolean; error?: string }>;
  deleteAccount: () => Promise<{ success: boolean; error?: string }>;
  // Traditional & Guest
  login: (email: string, pass: string) => Promise<{ success: boolean; error?: string }>;
  signup: (email: string, name: string, pass: string) => Promise<{ success: boolean; error?: string }>;
  loginAsGuest: () => Promise<{ success: boolean; token?: string; user?: User; error?: string }>;
  logout: () => Promise<void>;
  signOut: () => Promise<void>;
  updateUserInContext: (updated: User) => void;
  setSessionAuth: (token: string, user: User) => void;
  claimAdminRole: (passkey?: string) => Promise<{ success: boolean; error?: string }>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [firebaseUser, setFirebaseUser] = useState<FirebaseUser | null>(null);
  const [token, setToken] = useState<string | null>(localStorage.getItem('interview_ai_token'));
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [theme, setTheme] = useState<'dark' | 'light'>(
    (localStorage.getItem('interview_ai_theme') as 'dark' | 'light') || 'dark'
  );

  useEffect(() => {
    const root = document.documentElement;
    if (theme === 'dark') {
      root.classList.add('dark');
      root.style.colorScheme = 'dark';
    } else {
      root.classList.remove('dark');
      root.style.colorScheme = 'light';
    }
    localStorage.setItem('interview_ai_theme', theme);
  }, [theme]);

  const toggleTheme = () => {
    setTheme((prev) => (prev === 'dark' ? 'light' : 'dark'));
  };

  // Helper to sync Firebase user with backend JWT and Firestore document
  const syncWithBackendAndFirestore = async (fbUser: FirebaseUser, providerIdOverride?: string) => {
    const providerId = providerIdOverride || fbUser.providerData?.[0]?.providerId || 'firebase';

    // 1. Sync Firestore user profile document
    const { role } = await syncUserProfileDoc(fbUser, providerId);

    // 2. Sync backend data store and retrieve JWT for interview session APIs
    try {
      const res = await fetch('/api/auth/firebase-sync', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          uid: fbUser.uid,
          email: fbUser.email,
          name: fbUser.displayName || fbUser.email?.split('@')[0] || 'Candidate',
          photoURL: fbUser.photoURL,
          provider: providerId,
        }),
      });

      if (res.ok) {
        const data = await res.json();
        localStorage.setItem('interview_ai_token', data.token);
        setToken(data.token);

        const mergedUser: User = {
          ...data.user,
          photoURL: fbUser.photoURL || data.user.photoURL,
          provider: providerId,
          role: data.user.role === 'admin' || role === 'admin' ? 'admin' : 'user',
        };
        setUser(mergedUser);
      } else {
        // Fallback user state if backend is offline
        const fallbackUser: User = {
          id: fbUser.uid,
          uid: fbUser.uid,
          email: fbUser.email || `${fbUser.uid}@firebase.user`,
          name: fbUser.displayName || 'Candidate',
          role,
          photoURL: fbUser.photoURL || undefined,
          provider: providerId,
          createdAt: new Date().toISOString(),
        };
        setUser(fallbackUser);
      }
    } catch (err) {
      console.warn('Backend sync failed, using client Firebase user:', err);
      setUser({
        id: fbUser.uid,
        uid: fbUser.uid,
        email: fbUser.email || `${fbUser.uid}@firebase.user`,
        name: fbUser.displayName || 'Candidate',
        role,
        photoURL: fbUser.photoURL || undefined,
        provider: providerId,
        createdAt: new Date().toISOString(),
      });
    }
  };

  // Listen for Firebase Auth state transitions and check redirect result
  useEffect(() => {
    // Check if returning from a mobile signInWithRedirect
    getRedirectResult(auth)
      .then(async (result) => {
        if (result?.user) {
          await syncWithBackendAndFirestore(result.user);
        }
      })
      .catch((err) => {
        console.error('Redirect sign-in error:', err);
      });

    const unsubscribe = onAuthStateChanged(auth, async (fbUser) => {
      setFirebaseUser(fbUser);
      if (fbUser) {
        await syncWithBackendAndFirestore(fbUser);
        setIsLoading(false);
      } else {
        // Check for existing backend JWT session (email/password or guest from legacy/offline store)
        const storedToken = localStorage.getItem('interview_ai_token');
        let sessionRestored = false;

        if (storedToken) {
          try {
            const res = await fetch('/api/auth/me', {
              headers: { Authorization: `Bearer ${storedToken}` },
            });
            if (res.ok) {
              const data = await res.json();
              if (data?.user) {
                setUser(data.user);
                setToken(storedToken);
                sessionRestored = true;
              }
            } else {
              localStorage.removeItem('interview_ai_token');
            }
          } catch (err) {
            console.warn('Failed to verify token, auto-provisioning guest session:', err);
          }
        }

        // Auto-provision candidate session so the app is 100% open with zero barriers
        if (!sessionRestored) {
          try {
            const guestRes = await fetch('/api/auth/guest', { method: 'POST' });
            if (guestRes.ok) {
              const guestData = await guestRes.json();
              if (guestData.token && guestData.user) {
                localStorage.setItem('interview_ai_token', guestData.token);
                setToken(guestData.token);
                setUser(guestData.user);
                sessionRestored = true;
              }
            }
          } catch (guestErr) {
            console.warn('Auto guest provisioning fallback:', guestErr);
          }

          if (!sessionRestored) {
            const fallbackCandidate: User = {
              id: 'candidate-active',
              uid: 'candidate-active',
              email: 'candidate@interview.ai',
              name: 'Candidate Guest',
              role: 'admin',
              createdAt: new Date().toISOString(),
            };
            setUser(fallbackCandidate);
          }
        }
        setIsLoading(false);
      }
    });

    return () => unsubscribe();
  }, []);

  // Helper for executing social provider popup with redirect fallback
  const handleSocialAuth = async (
    provider: FirebaseAuthProvider,
    providerName: string,
    useRedirect: boolean = false
  ): Promise<{ success: boolean; error?: string }> => {
    try {
      const isMobile = typeof window !== 'undefined' && /iPhone|iPad|iPod|Android/i.test(navigator.userAgent);

      if (useRedirect || isMobile) {
        await signInWithRedirect(auth, provider);
        return { success: true };
      }

      try {
        const cred = await signInWithPopup(auth, provider);
        if (cred.user) {
          await syncWithBackendAndFirestore(cred.user, cred.providerId || providerName);
        }
        return { success: true };
      } catch (popupErr: any) {
        // Fallback to redirect if popup was blocked or failed
        if (popupErr.code === 'auth/popup-blocked' || popupErr.code === 'auth/cancelled-popup-request') {
          console.warn('Popup blocked, falling back to redirect flow...');
          await signInWithRedirect(auth, provider);
          return { success: true };
        }
        throw popupErr;
      }
    } catch (err: any) {
      console.error(`${providerName} login error:`, err);
      return { success: false, error: getFriendlyAuthErrorMessage(err) };
    }
  };

  const signInWithGoogle = (useRedirect: boolean = false) =>
    handleSocialAuth(googleProvider, 'google.com', useRedirect);

  const signInWithGitHub = (useRedirect: boolean = false) =>
    handleSocialAuth(githubProvider, 'github.com', useRedirect);

  const signInWithApple = (useRedirect: boolean = false) =>
    handleSocialAuth(appleProvider, 'apple.com', useRedirect);

  // Link additional provider to current account
  const linkProvider = async (providerId: 'google.com' | 'github.com' | 'apple.com') => {
    if (!auth.currentUser) {
      return { success: false, error: 'You must be signed in to link an account.' };
    }
    try {
      let prov: FirebaseAuthProvider = googleProvider;
      if (providerId === 'github.com') prov = githubProvider;
      if (providerId === 'apple.com') prov = appleProvider;

      const cred = await linkWithPopup(auth.currentUser, prov);
      if (cred.user) {
        await syncWithBackendAndFirestore(cred.user, providerId);
      }
      return { success: true };
    } catch (err: any) {
      console.error('Link provider error:', err);
      return { success: false, error: getFriendlyAuthErrorMessage(err) };
    }
  };

  // Unlink a provider
  const unlinkProvider = async (providerId: string) => {
    if (!auth.currentUser) {
      return { success: false, error: 'You must be signed in to unlink an account.' };
    }
    if ((auth.currentUser.providerData?.length || 0) <= 1) {
      return { success: false, error: 'Cannot unlink your only sign-in provider.' };
    }
    try {
      const updatedUser = await unlink(auth.currentUser, providerId);
      await syncWithBackendAndFirestore(updatedUser);
      return { success: true };
    } catch (err: any) {
      console.error('Unlink provider error:', err);
      return { success: false, error: getFriendlyAuthErrorMessage(err) };
    }
  };

  // Delete account
  const deleteAccount = async () => {
    try {
      if (auth.currentUser) {
        await firebaseDeleteUser(auth.currentUser);
      }
      if (token) {
        await fetch('/api/auth/account', {
          method: 'DELETE',
          headers: { Authorization: `Bearer ${token}` },
        });
      }
      localStorage.removeItem('interview_ai_token');
      setToken(null);
      setUser(null);
      setFirebaseUser(null);
      return { success: true };
    } catch (err: any) {
      console.error('Delete account error:', err);
      return { success: false, error: getFriendlyAuthErrorMessage(err) };
    }
  };

  // Traditional Email/Password Login
  const login = async (email: string, pass: string) => {
    try {
      // 1. Try Firebase Auth with email/password if enabled
      let fbLoggedIn = false;
      try {
        const cred = await signInWithEmailAndPassword(auth, email, pass);
        if (cred.user) {
          await syncWithBackendAndFirestore(cred.user, 'password');
          fbLoggedIn = true;
        }
      } catch (fbErr: any) {
        // If not found in Firebase or provider disabled, fall back to backend DB
        console.log('Firebase email login note, falling back to backend store:', fbErr?.code);
      }

      if (fbLoggedIn) {
        return { success: true };
      }

      // 2. Fallback to existing backend DB
      const res = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password: pass }),
      });
      const data = await res.json();
      if (!res.ok) {
        return { success: false, error: data.error || 'Login failed' };
      }

      localStorage.setItem('interview_ai_token', data.token);
      setToken(data.token);
      setUser(data.user);
      return { success: true };
    } catch (err: any) {
      return { success: false, error: err.message || 'Network error' };
    }
  };

  // Traditional Email/Password Signup
  const signup = async (email: string, name: string, pass: string) => {
    try {
      // 1. Try Firebase Auth creation
      let fbUserCreated = false;
      try {
        const cred = await createUserWithEmailAndPassword(auth, email, pass);
        if (cred.user) {
          await syncWithBackendAndFirestore(cred.user, 'password');
          fbUserCreated = true;
        }
      } catch (fbErr: any) {
        console.log('Firebase signup note, continuing with backend store:', fbErr?.code);
      }

      // 2. Ensure registered in backend DB
      const res = await fetch('/api/auth/signup', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, name, password: pass }),
      });
      const data = await res.json();
      if (!res.ok && !fbUserCreated) {
        return { success: false, error: data.error || 'Signup failed' };
      }

      if (data.token) {
        localStorage.setItem('interview_ai_token', data.token);
        setToken(data.token);
        setUser(data.user);
      }
      return { success: true };
    } catch (err: any) {
      return { success: false, error: err.message || 'Network error' };
    }
  };

  // Guest authentication
  const loginAsGuest = async () => {
    try {
      const res = await fetch('/api/auth/guest', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
      });
      const data = await res.json();
      if (!res.ok) {
        return { success: false, error: data.error || 'Guest initialization failed' };
      }

      localStorage.setItem('interview_ai_token', data.token);
      setToken(data.token);
      setUser(data.user);
      return { success: true, token: data.token, user: data.user };
    } catch (err: any) {
      return { success: false, error: err.message || 'Network error' };
    }
  };

  const logout = async () => {
    try {
      await firebaseSignOut(auth);
    } catch (e) {
      console.warn('Firebase signout error:', e);
    }
    localStorage.removeItem('interview_ai_token');
    setToken(null);
    setUser(null);
    setFirebaseUser(null);
  };

  const setSessionAuth = (newToken: string, newUser: User) => {
    localStorage.setItem('interview_ai_token', newToken);
    setToken(newToken);
    setUser(newUser);
  };

  const updateUserInContext = (updated: User) => {
    setUser(updated);
  };

  const claimAdminRole = async (passkey?: string) => {
    try {
      let currentToken = token;
      if (!currentToken) {
        const guestRes = await loginAsGuest();
        if (!guestRes.success || !guestRes.token) {
          return { success: false, error: 'Could not initialize session' };
        }
        currentToken = guestRes.token;
      }

      const res = await fetch('/api/admin/claim-ownership', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${currentToken}`,
        },
        body: JSON.stringify({ passkey: passkey || 'admin123' }),
      });

      const data = await res.json();
      if (!res.ok) {
        return { success: false, error: data.error || 'Failed to verify admin passkey' };
      }

      localStorage.setItem('interview_ai_token', data.token);
      setToken(data.token);
      setUser(data.user);
      return { success: true };
    } catch (err: any) {
      return { success: false, error: err.message || 'Network error' };
    }
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        firebaseUser,
        token,
        isLoading,
        loading: isLoading,
        theme,
        toggleTheme,
        signInWithGoogle,
        signInWithGitHub,
        signInWithApple,
        linkProvider,
        unlinkProvider,
        deleteAccount,
        login,
        signup,
        loginAsGuest,
        logout,
        signOut: logout,
        updateUserInContext,
        setSessionAuth,
        claimAdminRole,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
