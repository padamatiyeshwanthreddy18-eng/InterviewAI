import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { Resume, ROLE_TRACKS, TrackType, DifficultyType } from '../types';
import { useProfile } from '../hooks/useFirestoreData';
import { WeeklyTipNotificationCard } from '../components/WeeklyTipNotificationCard';
import {
  GlassCard,
  PrimaryButton,
  PillButton,
  Badge,
  Modal,
} from '../components/ui';
import {
  User as UserIcon,
  Mail,
  Lock,
  FileText,
  Upload,
  Trash2,
  CheckCircle2,
  AlertCircle,
  Save,
  ShieldAlert,
  Sparkles,
  LogOut,
  Link2,
  Loader2,
  Sliders,
  Camera,
} from 'lucide-react';

export const ProfilePage: React.FC = () => {
  const {
    user,
    firebaseUser,
    token,
    updateUserInContext,
    logout,
    linkProvider,
    unlinkProvider,
    deleteAccount,
    isLoading: isAuthLoading,
  } = useAuth();
  const navigate = useNavigate();

  const { profile, preferences, updatePreferences } = useProfile(user?.uid);

  const [name, setName] = useState(user?.name || '');
  const [email, setEmail] = useState(user?.email || '');
  const [newPassword, setNewPassword] = useState('');

  // Preference fields
  const [prefTrack, setPrefTrack] = useState<TrackType>((preferences?.defaultRoleTrack as TrackType) || 'SDE');
  const [prefDiff, setPrefDiff] = useState<DifficultyType>((preferences?.defaultDifficulty as DifficultyType) || 'Intermediate');
  const [prefCompany, setPrefCompany] = useState<string>(preferences?.defaultCompanyPreset || 'General Tech');
  const [prefCam, setPrefCam] = useState<boolean>(preferences?.cameraEnabled ?? true);
  const [isSavingPrefs, setIsSavingPrefs] = useState(false);

  useEffect(() => {
    if (preferences) {
      if (preferences.defaultRoleTrack) setPrefTrack(preferences.defaultRoleTrack as TrackType);
      if (preferences.defaultDifficulty) setPrefDiff(preferences.defaultDifficulty as DifficultyType);
      if (preferences.defaultCompanyPreset) setPrefCompany(preferences.defaultCompanyPreset);
      if (preferences.cameraEnabled !== undefined) setPrefCam(preferences.cameraEnabled);
    }
  }, [preferences]);

  const handleSavePreferences = async () => {
    setIsSavingPrefs(true);
    try {
      await updatePreferences({
        defaultRoleTrack: prefTrack,
        defaultDifficulty: prefDiff,
        defaultCompanyPreset: prefCompany,
        cameraEnabled: prefCam,
      });
      setMessage('Practice preferences saved to your account!');
    } catch (err: any) {
      setError('Failed to update preferences: ' + err.message);
    } finally {
      setIsSavingPrefs(false);
    }
  };

  const [resume, setResume] = useState<Resume | null>(null);
  const [isUploading, setIsUploading] = useState(false);

  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [isSaving, setIsSaving] = useState(false);
  const [providerActionLoading, setProviderActionLoading] = useState<string | null>(null);

  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);

  useEffect(() => {
    if (isAuthLoading) return;

    if (!user) {
      navigate('/auth');
      return;
    }

    const fetchResume = async () => {
      try {
        const res = await fetch('/api/resume/me', {
          headers: { Authorization: `Bearer ${token}` },
        });
        if (res.ok) {
          const data = await res.json();
          setResume(data.resume);
        }
      } catch (err) {
        console.error('Failed to load resume:', err);
      }
    };

    fetchResume();
  }, [user, token, navigate, isAuthLoading]);

  const handleUpdateProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSaving(true);
    setMessage(null);
    setError(null);

    try {
      const res = await fetch('/api/auth/profile', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          name,
          email,
          newPassword: newPassword.trim() || undefined,
        }),
      });

      const data = await res.json();
      if (!res.ok) {
        setError(data.error || 'Failed to update profile');
      } else {
        updateUserInContext(data.user);
        setMessage('Profile updated successfully!');
        setNewPassword('');
      }
    } catch (err: any) {
      setError(err.message || 'Error updating profile');
    } finally {
      setIsSaving(false);
    }
  };

  const handleResumeUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setIsUploading(true);
    setError(null);

    try {
      const text = await file.text();
      const res = await fetch('/api/resume/upload', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          fileName: file.name,
          fileContent: text,
        }),
      });

      if (res.ok) {
        const data = await res.json();
        setResume(data.resume);
        setMessage('Resume analyzed and updated!');
      } else {
        setError('Failed to process resume');
      }
    } catch (err: any) {
      setError('Failed to upload file');
    } finally {
      setIsUploading(false);
    }
  };

  const handleLink = async (providerId: 'google.com' | 'github.com' | 'apple.com') => {
    setProviderActionLoading(providerId);
    setError(null);
    setMessage(null);
    try {
      const res = await linkProvider(providerId);
      if (res.success) {
        setMessage(`Successfully linked ${providerId.replace('.com', '')} to your account!`);
      } else {
        setError(res.error || `Failed to link ${providerId}`);
      }
    } catch (err: any) {
      setError(err.message || 'Error linking account');
    } finally {
      setProviderActionLoading(null);
    }
  };

  const handleUnlink = async (providerId: string) => {
    setProviderActionLoading(providerId);
    setError(null);
    setMessage(null);
    try {
      const res = await unlinkProvider(providerId);
      if (res.success) {
        setMessage(`Successfully unlinked ${providerId.replace('.com', '')} from your account.`);
      } else {
        setError(res.error || `Failed to unlink ${providerId}`);
      }
    } catch (err: any) {
      setError(err.message || 'Error unlinking account');
    } finally {
      setProviderActionLoading(null);
    }
  };

  const handleSignOut = async () => {
    await logout();
    navigate('/');
  };

  const handleDeleteAccount = async () => {
    try {
      const res = await deleteAccount();
      if (res.success) {
        navigate('/');
      } else {
        setError(res.error || 'Failed to delete account');
        setShowDeleteConfirm(false);
      }
    } catch (err: any) {
      setError(err.message || 'Network error during deletion');
      setShowDeleteConfirm(false);
    }
  };

  return (
    <div className="w-full min-h-[calc(100vh-4rem)] py-8 px-4 sm:px-6 lg:px-8 text-[#F8F4E9]">
      <div className="max-w-4xl mx-auto space-y-6">
        {/* Profile Top Banner */}
        <GlassCard className="p-6 sm:p-8 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-6 border-[rgba(147,80,115,0.35)] shadow-[0_20px_45px_rgba(15,7,20,0.8)]">
          <div className="flex items-center gap-4">
            <div className="w-16 h-16 rounded-2xl bg-gradient-to-tr from-[#502D55] to-[#935073] border-2 border-[#F6DBC0] flex items-center justify-center font-black text-xl text-[#F8F4E9] shadow-[0_0_20px_rgba(147,80,115,0.4)] shrink-0 overflow-hidden">
              {user?.photoURL ? (
                <img src={user.photoURL} alt={user.name} className="w-full h-full object-cover" />
              ) : (
                user?.name ? user.name.substring(0, 2).toUpperCase() : 'CA'
              )}
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h1 className="text-2xl sm:text-3xl font-black text-[#F8F4E9]">
                  {user?.name || 'Candidate Profile'}
                </h1>
                <Badge variant="peach" size="sm">
                  {user?.role === 'admin' ? 'Admin' : 'Candidate'}
                </Badge>
              </div>
              <p className="text-xs text-[rgba(248,244,233,0.55)] font-mono mt-0.5">
                {user?.email} · Member since {user?.createdAt ? new Date(user.createdAt).toLocaleDateString() : 'Recent'}
              </p>
              {user?.provider && (
                <span className="inline-block text-[10px] font-mono text-[#F6DBC0] mt-1 bg-[rgba(147,80,115,0.25)] px-2 py-0.5 rounded-full border border-[rgba(147,80,115,0.3)]">
                  Primary Sign-in: {user.provider.replace('.com', '')}
                </span>
              )}
            </div>
          </div>

          <button
            onClick={handleSignOut}
            className="flex items-center gap-2 px-4 py-2 rounded-xl bg-[rgba(229,115,115,0.15)] hover:bg-[rgba(229,115,115,0.25)] border border-[rgba(229,115,115,0.35)] text-xs font-bold text-[#E57373] transition cursor-pointer"
          >
            <LogOut className="w-4 h-4" />
            <span>Sign Out</span>
          </button>
        </GlassCard>

        {message && (
          <div className="p-3.5 bg-[rgba(127,227,185,0.15)] border border-[rgba(127,227,185,0.35)] rounded-2xl text-xs text-[#7FE3B9] flex items-center gap-2.5 font-semibold">
            <CheckCircle2 className="w-4 h-4 text-[#7FE3B9] shrink-0" />
            <span>{message}</span>
          </div>
        )}

        {error && (
          <div className="p-3.5 bg-[rgba(229,115,115,0.15)] border border-[rgba(229,115,115,0.35)] rounded-2xl text-xs text-[#E57373] flex items-center gap-2.5 font-semibold">
            <AlertCircle className="w-4 h-4 text-[#E57373] shrink-0" />
            <span>{error}</span>
          </div>
        )}

        {/* Connected Authentication Providers Card */}
        <GlassCard className="p-6 sm:p-8 space-y-6">
          <div className="flex items-center justify-between">
            <h2 className="text-xs font-bold uppercase tracking-widest text-[#F8F4E9] flex items-center gap-2">
              <Link2 className="w-4 h-4 text-[#F6DBC0]" />
              <span>Connected Authentication Providers</span>
            </h2>
            <span className="text-[11px] text-[rgba(248,244,233,0.5)] font-mono">
              Multi-Provider Social Auth
            </span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            {[
              {
                id: 'google.com' as const,
                name: 'Google',
                icon: (
                  <svg className="w-4 h-4 shrink-0" viewBox="0 0 24 24">
                    <path fill="#EA4335" d="M12 5c1.6 0 3 .6 4.1 1.7l3.1-3.1C17.3 1.8 14.8 1 12 1 7.4 1 3.5 3.6 1.6 7.4l3.7 2.9C6.2 7.3 8.9 5 12 5z" />
                    <path fill="#4285F4" d="M23.5 12.3c0-.8-.1-1.7-.2-2.3H12v4.6h6.5c-.3 1.5-1.1 2.8-2.4 3.7l3.7 2.9c2.2-2 3.7-5 3.7-8.9z" />
                    <path fill="#FBBC05" d="M5.3 14.7c-.2-.7-.4-1.5-.4-2.3 0-.8.2-1.6.4-2.3L1.6 7.2C.6 9.2 0 10.5 0 12.4s.6 3.2 1.6 5.2l3.7-2.9z" />
                    <path fill="#34A853" d="M12 23.8c3.2 0 6-1.1 8-3l-3.7-2.9c-1.1.7-2.5 1.2-4.3 1.2-3.1 0-5.8-2.3-6.7-5.3L1.6 16.7C3.5 20.6 7.4 23.8 12 23.8z" />
                  </svg>
                ),
              },
              {
                id: 'github.com' as const,
                name: 'GitHub',
                icon: (
                  <svg className="w-4 h-4 fill-current shrink-0" viewBox="0 0 24 24">
                    <path d="M12 0C5.37 0 0 5.37 0 12c0 5.31 3.435 9.795 8.205 11.385.6.105.825-.255.825-.57 0-.285-.015-1.23-.015-2.235-3.015.555-3.795-.735-4.035-1.41-.135-.345-.72-1.41-1.23-1.695-.42-.225-1.02-.78-.015-.795.945-.015 1.62.87 1.845 1.23 1.08 1.815 2.805 1.305 3.495.99.105-.78.42-1.305.765-1.605-2.67-.3-5.46-1.335-5.46-5.925 0-1.305.465-2.385 1.23-3.225-.12-.3-.54-1.53.12-3.18 0 0 1.005-.315 3.3 1.23.96-.27 1.98-.405 3-.405s2.04.135 3 .405c2.295-1.56 3.3-1.23 3.3-1.23.66 1.65.24 2.88.12 3.18.765.84 1.23 1.905 1.23 3.225 0 4.605-2.805 5.625-5.475 5.925.435.375.81 1.095.81 2.22 0 1.605-.015 2.895-.015 3.3 0 .315.225.69.825.57A12.02 12.02 0 0024 12c0-6.63-5.37-12-12-12z" />
                  </svg>
                ),
              },
              {
                id: 'apple.com' as const,
                name: 'Apple',
                icon: (
                  <svg className="w-4 h-4 fill-current shrink-0" viewBox="0 0 24 24">
                    <path d="M18.71 19.5c-.83 1.24-1.71 2.45-3.05 2.47-1.34.03-1.77-.79-3.29-.79-1.53 0-2 .77-3.27.82-1.31.05-2.3-1.32-3.14-2.53C4.25 17 2.94 12.45 4.7 9.39c.87-1.52 2.43-2.48 4.12-2.51 1.28-.02 2.5.87 3.29.87.78 0 2.26-1.07 3.81-.91.65.03 2.47.26 3.64 1.98-.09.06-2.17 1.28-2.15 3.81.03 3.02 2.65 4.03 2.68 4.04-.03.07-.42 1.44-1.38 2.83M15.97 6.34c.64-.78 1.08-1.86.96-2.94-1 .04-2.16.66-2.82 1.44-.58.67-1.09 1.77-.95 2.82 1.11.09 2.19-.57 2.81-1.32z" />
                  </svg>
                ),
              },
            ].map((p) => {
              const isLinked =
                firebaseUser?.providerData?.some((pd) => pd.providerId === p.id) ||
                user?.provider === p.id;
              const totalProviders = firebaseUser?.providerData?.length || (user?.provider ? 1 : 0);
              const isLoading = providerActionLoading === p.id;

              return (
                <div
                  key={p.id}
                  className="p-4 rounded-2xl bg-[rgba(26,15,34,0.65)] border border-[rgba(248,244,233,0.08)] flex flex-col justify-between space-y-3"
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2 text-sm font-bold text-[#F8F4E9]">
                      {p.icon}
                      <span>{p.name}</span>
                    </div>
                    {isLinked ? (
                      <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-[rgba(127,227,185,0.15)] text-[#7FE3B9] border border-[rgba(127,227,185,0.3)]">
                        Linked
                      </span>
                    ) : (
                      <span className="text-[10px] text-[rgba(248,244,233,0.4)] font-mono">
                        Not linked
                      </span>
                    )}
                  </div>

                  <div>
                    {isLinked ? (
                      totalProviders > 1 ? (
                        <button
                          type="button"
                          disabled={isLoading}
                          onClick={() => handleUnlink(p.id)}
                          className="w-full py-1.5 px-3 rounded-xl border border-[rgba(229,115,115,0.3)] hover:bg-[rgba(229,115,115,0.15)] text-xs font-bold text-[#E57373] transition cursor-pointer disabled:opacity-50"
                        >
                          {isLoading ? 'Unlinking...' : 'Unlink'}
                        </button>
                      ) : (
                        <span className="text-[10px] text-[rgba(248,244,233,0.4)] block text-center italic">
                          Primary provider
                        </span>
                      )
                    ) : (
                      <button
                        type="button"
                        disabled={isLoading}
                        onClick={() => handleLink(p.id)}
                        className="w-full py-1.5 px-3 rounded-xl bg-[rgba(147,80,115,0.3)] hover:bg-[#935073] border border-[rgba(147,80,115,0.4)] text-xs font-bold text-[#F8F4E9] transition cursor-pointer disabled:opacity-50 flex items-center justify-center gap-1.5"
                      >
                        {isLoading ? (
                          <>
                            <Loader2 className="w-3.5 h-3.5 animate-spin" />
                            <span>Connecting...</span>
                          </>
                        ) : (
                          <span>Link Account</span>
                        )}
                      </button>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </GlassCard>

        {/* Candidate Practice Preferences Card (Persisted to Firestore users/{uid}) */}
        <GlassCard className="p-6 sm:p-8 space-y-6">
          <div className="flex items-center justify-between">
            <h2 className="text-xs font-bold uppercase tracking-widest text-[#F8F4E9] flex items-center gap-2">
              <Sliders className="w-4 h-4 text-[#F6DBC0]" />
              <span>Interview Coaching Preferences</span>
            </h2>
            <span className="text-[11px] text-[rgba(248,244,233,0.5)] font-mono">
              Saved in Cloud Firestore
            </span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-bold text-[rgba(248,244,233,0.7)] mb-1">
                Default Role Track
              </label>
              <select
                value={prefTrack}
                onChange={(e) => setPrefTrack(e.target.value as TrackType)}
                className="w-full bg-[rgba(26,15,34,0.7)] border border-[rgba(248,244,233,0.08)] rounded-xl py-2.5 px-3 text-xs text-[#F8F4E9] font-medium outline-none focus:border-[#935073]"
              >
                {ROLE_TRACKS.map((t) => (
                  <option key={t} value={t} className="bg-[#1A0F22] text-[#F8F4E9]">
                    {t}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-xs font-bold text-[rgba(248,244,233,0.7)] mb-1">
                Default Difficulty
              </label>
              <select
                value={prefDiff}
                onChange={(e) => setPrefDiff(e.target.value as DifficultyType)}
                className="w-full bg-[rgba(26,15,34,0.7)] border border-[rgba(248,244,233,0.08)] rounded-xl py-2.5 px-3 text-xs text-[#F8F4E9] font-medium outline-none focus:border-[#935073]"
              >
                <option value="Beginner" className="bg-[#1A0F22] text-[#F8F4E9]">Beginner - Fundamentals</option>
                <option value="Intermediate" className="bg-[#1A0F22] text-[#F8F4E9]">Intermediate - Tradeoffs & Scenarios</option>
                <option value="Advanced" className="bg-[#1A0F22] text-[#F8F4E9]">Advanced - Principal Depth</option>
              </select>
            </div>

            <div>
              <label className="block text-xs font-bold text-[rgba(248,244,233,0.7)] mb-1">
                Company Target Rubric
              </label>
              <select
                value={prefCompany}
                onChange={(e) => setPrefCompany(e.target.value)}
                className="w-full bg-[rgba(26,15,34,0.7)] border border-[rgba(248,244,233,0.08)] rounded-xl py-2.5 px-3 text-xs text-[#F8F4E9] font-medium outline-none focus:border-[#935073]"
              >
                <option value="General Tech" className="bg-[#1A0F22] text-[#F8F4E9]">General Tech / Startups</option>
                <option value="Google" className="bg-[#1A0F22] text-[#F8F4E9]">Google (Scale & Craft)</option>
                <option value="Amazon" className="bg-[#1A0F22] text-[#F8F4E9]">Amazon (Leadership Principles)</option>
                <option value="Meta" className="bg-[#1A0F22] text-[#F8F4E9]">Meta (Execution & Impact)</option>
                <option value="Microsoft" className="bg-[#1A0F22] text-[#F8F4E9]">Microsoft (Architecture)</option>
                <option value="Stripe" className="bg-[#1A0F22] text-[#F8F4E9]">Stripe (API Rigor & Precision)</option>
              </select>
            </div>

            <div className="flex items-center justify-between p-3 rounded-xl bg-[rgba(26,15,34,0.7)] border border-[rgba(248,244,233,0.08)] mt-auto">
              <div className="flex items-center gap-2">
                <Camera className="w-4 h-4 text-[#F6DBC0]" />
                <div>
                  <p className="text-xs font-bold text-[#F8F4E9]">Camera Stage Preview</p>
                  <p className="text-[10px] text-[rgba(248,244,233,0.5)]">Mirror video during mock rounds</p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setPrefCam(!prefCam)}
                className={`w-11 h-6 flex items-center rounded-full p-1 transition cursor-pointer ${
                  prefCam ? 'bg-[#935073]' : 'bg-[rgba(248,244,233,0.15)]'
                }`}
              >
                <div
                  className={`bg-[#F8F4E9] w-4 h-4 rounded-full shadow-md transform transition ${
                    prefCam ? 'translate-x-5' : ''
                  }`}
                />
              </button>
            </div>
          </div>

          <div className="pt-2 flex justify-end">
            <PrimaryButton
              type="button"
              disabled={isSavingPrefs}
              onClick={handleSavePreferences}
              icon={<Save className="w-4 h-4 text-[#F6DBC0]" />}
              size="md"
            >
              {isSavingPrefs ? 'Saving...' : 'Save Coaching Preferences'}
            </PrimaryButton>
          </div>
        </GlassCard>

        {/* Account Credentials Form */}
        <GlassCard className="p-6 sm:p-8 space-y-6">
          <h2 className="text-xs font-bold uppercase tracking-widest text-[#F8F4E9] flex items-center gap-2">
            <UserIcon className="w-4 h-4 text-[#F6DBC0]" />
            <span>Personal Credentials</span>
          </h2>

          <form onSubmit={handleUpdateProfile} className="space-y-4">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-bold text-[rgba(248,244,233,0.7)] mb-1">
                  Full Name
                </label>
                <div className="relative">
                  <UserIcon className="w-4 h-4 text-[rgba(248,244,233,0.4)] absolute left-3.5 top-1/2 -translate-y-1/2" />
                  <input
                    type="text"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    className="w-full bg-[rgba(26,15,34,0.7)] border border-[rgba(248,244,233,0.08)] rounded-xl py-2.5 pl-10 pr-4 text-xs text-[#F8F4E9] font-medium outline-none focus:border-[#935073]"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-[rgba(248,244,233,0.7)] mb-1">
                  Email Address
                </label>
                <div className="relative">
                  <Mail className="w-4 h-4 text-[rgba(248,244,233,0.4)] absolute left-3.5 top-1/2 -translate-y-1/2" />
                  <input
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="w-full bg-[rgba(26,15,34,0.7)] border border-[rgba(248,244,233,0.08)] rounded-xl py-2.5 pl-10 pr-4 text-xs text-[#F8F4E9] font-medium outline-none focus:border-[#935073]"
                  />
                </div>
              </div>
            </div>

            <div>
              <label className="block text-xs font-bold text-[rgba(248,244,233,0.7)] mb-1">
                New Password (Optional)
              </label>
              <div className="relative">
                <Lock className="w-4 h-4 text-[rgba(248,244,233,0.4)] absolute left-3.5 top-1/2 -translate-y-1/2" />
                <input
                  type="password"
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  placeholder="Leave blank to keep existing password"
                  className="w-full bg-[rgba(26,15,34,0.7)] border border-[rgba(248,244,233,0.08)] rounded-xl py-2.5 pl-10 pr-4 text-xs text-[#F8F4E9] font-medium outline-none focus:border-[#935073]"
                />
              </div>
            </div>

            <div className="pt-2 flex justify-end">
              <PrimaryButton
                type="submit"
                disabled={isSaving}
                icon={<Save className="w-4 h-4 text-[#F6DBC0]" />}
                size="md"
              >
                {isSaving ? 'Updating...' : 'Save Profile Changes'}
              </PrimaryButton>
            </div>
          </form>
        </GlassCard>

        {/* Candidate Resume Management */}
        <GlassCard className="p-6 sm:p-8 space-y-6">
          <div className="flex items-center justify-between">
            <h2 className="text-xs font-bold uppercase tracking-widest text-[#F8F4E9] flex items-center gap-2">
              <FileText className="w-4 h-4 text-[#F6DBC0]" />
              <span>Resume & AI Skill Analysis</span>
            </h2>
            {resume && <Badge variant="mint" size="sm">Active</Badge>}
          </div>

          {resume ? (
            <div className="p-5 rounded-2xl bg-[rgba(26,15,34,0.6)] border border-[rgba(147,80,115,0.3)] space-y-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <FileText className="w-5 h-5 text-[#F6DBC0]" />
                  <div>
                    <span className="font-bold text-sm text-[#F8F4E9] block">{resume.fileName}</span>
                    <span className="text-[10px] text-[rgba(248,244,233,0.5)] font-mono">
                      Uploaded {new Date(resume.uploadedAt).toLocaleDateString()}
                    </span>
                  </div>
                </div>

                <label className="px-3.5 py-1.5 rounded-full text-xs font-bold text-[#F8F4E9] bg-[rgba(147,80,115,0.3)] hover:bg-[#935073] border border-[rgba(147,80,115,0.4)] transition cursor-pointer">
                  {isUploading ? 'Analyzing...' : 'Replace Resume'}
                  <input
                    type="file"
                    accept=".txt,.md,.pdf"
                    onChange={handleResumeUpload}
                    className="hidden"
                    disabled={isUploading}
                  />
                </label>
              </div>

              {/* Extracted Skills */}
              <div>
                <span className="text-[10px] font-bold uppercase tracking-wider text-[rgba(248,244,233,0.5)] block mb-2">
                  Gemini Extracted Skills & Domains:
                </span>
                <div className="flex flex-wrap gap-1.5">
                  {resume.parsedSkills.map((skill, idx) => (
                    <span
                      key={idx}
                      className="px-2.5 py-0.5 rounded-full text-xs font-bold bg-[rgba(147,80,115,0.25)] text-[#F6DBC0] border border-[rgba(147,80,115,0.35)]"
                    >
                      {skill}
                    </span>
                  ))}
                </div>
              </div>

              {resume.parsedExperience && (
                <div className="p-3 rounded-xl bg-[rgba(42,27,51,0.5)] border border-[rgba(248,244,233,0.06)] text-xs text-[rgba(248,244,233,0.7)] leading-relaxed">
                  <strong className="text-[#F8F4E9] block mb-1">Experience Summary:</strong>
                  {resume.parsedExperience}
                </div>
              )}
            </div>
          ) : (
            <label className="border-2 border-dashed border-[rgba(248,244,233,0.12)] hover:border-[rgba(147,80,115,0.4)] rounded-2xl p-8 flex flex-col items-center justify-center text-center cursor-pointer transition-colors bg-[rgba(26,15,34,0.4)]">
              <Upload className="w-8 h-8 text-[#F6DBC0] mb-2" />
              <span className="text-sm font-bold text-[#F8F4E9] block">
                {isUploading ? 'Uploading & Analyzing Resume...' : 'Upload Candidate Resume'}
              </span>
              <span className="text-xs text-[rgba(248,244,233,0.5)] mt-1">
                Upload your resume in .txt, .md, or .pdf format to tailor interview questions
              </span>
              <input
                type="file"
                accept=".txt,.md,.pdf"
                onChange={handleResumeUpload}
                className="hidden"
                disabled={isUploading}
              />
            </label>
          )}
        </GlassCard>

        {/* Weekly Coaching Notifications Card */}
        <WeeklyTipNotificationCard />

        {/* Danger Zone: Account Deletion */}
        <GlassCard className="p-6 border-[rgba(229,115,115,0.25)] space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-xs font-bold text-[#E57373] uppercase tracking-wider flex items-center gap-1.5">
                <ShieldAlert className="w-4 h-4 text-[#E57373]" />
                Account Deletion
              </h3>
              <p className="text-xs text-[rgba(248,244,233,0.5)] mt-0.5">
                Permanently delete all interview history, audio records, and account credentials
              </p>
            </div>

            <PillButton
              variant="danger"
              size="sm"
              onClick={() => setShowDeleteConfirm(true)}
              icon={<Trash2 className="w-3.5 h-3.5" />}
            >
              Delete Account
            </PillButton>
          </div>
        </GlassCard>
      </div>

      {/* Delete Confirmation Modal */}
      <Modal
        isOpen={showDeleteConfirm}
        onClose={() => setShowDeleteConfirm(false)}
        title="Confirm Account Deletion"
        maxWidth="md"
      >
        <div className="space-y-4 text-xs text-[rgba(248,244,233,0.7)]">
          <p>
            Are you sure you want to delete your account? All practice records, audio critique reports, and analytics will be permanently erased.
          </p>
          <div className="flex items-center justify-end gap-3 pt-3">
            <PillButton size="sm" onClick={() => setShowDeleteConfirm(false)}>
              Cancel
            </PillButton>
            <button
              onClick={handleDeleteAccount}
              className="px-4 py-2 rounded-full text-xs font-bold bg-[#E57373] text-[#1A0F22] hover:bg-rose-400 transition cursor-pointer"
            >
              Confirm Delete
            </button>
          </div>
        </div>
      </Modal>
    </div>
  );
};
