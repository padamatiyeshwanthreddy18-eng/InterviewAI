import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { Resume } from '../types';
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
} from 'lucide-react';

export const ProfilePage: React.FC = () => {
  const { user, token, updateUserInContext, logout, isLoading: isAuthLoading } = useAuth();
  const navigate = useNavigate();

  const [name, setName] = useState(user?.name || '');
  const [email, setEmail] = useState(user?.email || '');
  const [newPassword, setNewPassword] = useState('');

  const [resume, setResume] = useState<Resume | null>(null);
  const [isUploading, setIsUploading] = useState(false);

  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [isSaving, setIsSaving] = useState(false);

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

  const handleDeleteAccount = async () => {
    try {
      const res = await fetch('/api/auth/account', {
        method: 'DELETE',
        headers: { Authorization: `Bearer ${token}` },
      });

      if (res.ok) {
        logout();
        navigate('/');
      } else {
        setError('Failed to delete account');
      }
    } catch (err) {
      setError('Network error during deletion');
    }
  };

  return (
    <div className="w-full min-h-[calc(100vh-4rem)] py-8 px-4 sm:px-6 lg:px-8 text-[#F8F4E9]">
      <div className="max-w-4xl mx-auto space-y-6">
        {/* Profile Top Banner */}
        <GlassCard className="p-6 sm:p-8 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-6 border-[rgba(147,80,115,0.35)] shadow-[0_20px_45px_rgba(15,7,20,0.8)]">
          <div className="flex items-center gap-4">
            <div className="w-16 h-16 rounded-2xl bg-gradient-to-tr from-[#502D55] to-[#935073] border-2 border-[#F6DBC0] flex items-center justify-center font-black text-xl text-[#F8F4E9] shadow-[0_0_20px_rgba(147,80,115,0.4)] shrink-0">
              {user?.name ? user.name.substring(0, 2).toUpperCase() : 'CA'}
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
            </div>
          </div>
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
