import React, { useState } from 'react';
import {
  Activity,
  Bell,
  Ban,
  CheckCircle2,
  Eye,
  FileWarning,
  Globe,
  KeyRound,
  Link2,
  Lock,
  LogOut,
  Shield,
  Trash2,
  UserCheck,
} from 'lucide-react';
import { AppHeader } from '../components/Header';
import {
  BlockedUserItem,
  NotificationPrefs,
  ProfileThemeId,
  ReportHistoryItem,
  UserProfile,
} from '../types/mizo';

interface AccountSettingsScreenProps {
  profile: UserProfile;
  authEmail: string | null;
  isGuest: boolean;
  isAdmin: boolean;
  linkedProviders: string[];
  notificationPrefs: NotificationPrefs;
  blockedUsers: BlockedUserItem[];
  reportHistory: ReportHistoryItem[];
  language: string;
  onBack: () => void;
  onEditProfile: () => void;
  onChangePassword: (currentPwd: string, nextPwd: string) => Promise<{ ok: boolean; error?: string }>;
  onLinkGoogle: () => Promise<{ ok: boolean; error?: string }>;
  onUpdatePrivacy: (
    privacy: UserProfile['profilePrivacy'],
    theme: ProfileThemeId
  ) => void;
  onUnblockUser: (id: string) => void;
  onUpdateNotifPrefs: (next: NotificationPrefs) => void;
  onChangeLanguage: (lang: string) => void;
  onEnablePushNotifications: () => void;
  onOpenAdminDiagnostics: () => void;
  onLogout: () => void;
  onDeleteAccount: () => Promise<{ ok: boolean; error?: string }>;
}

const THEMES: Array<{ id: ProfileThemeId; label: string }> = [
  { id: 'royal-purple', label: 'Royal Purple' },
  { id: 'obsidian-gold', label: 'Obsidian Gold' },
  { id: 'neon-orchid', label: 'Neon Orchid' },
  { id: 'midnight-crown', label: 'Midnight Crown' },
];

const LANGUAGES = ['English', 'Urdu', 'Arabic', 'Hindi', 'Spanish', 'Turkish'];

export const AccountSettingsScreen: React.FC<AccountSettingsScreenProps> = ({
  profile,
  authEmail,
  isGuest,
  isAdmin,
  linkedProviders,
  notificationPrefs,
  blockedUsers,
  reportHistory,
  language,
  onBack,
  onEditProfile,
  onChangePassword,
  onLinkGoogle,
  onUpdatePrivacy,
  onUnblockUser,
  onUpdateNotifPrefs,
  onChangeLanguage,
  onEnablePushNotifications,
  onOpenAdminDiagnostics,
  onLogout,
  onDeleteAccount,
}) => {
  const [currPwd, setCurrPwd] = useState('');
  const [newPwd, setNewPwd] = useState('');
  const [pwdStatus, setPwdStatus] = useState<string | null>(null);
  const [confirmDeleteOpen, setConfirmDeleteOpen] = useState(false);

  const handlePasswordSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setPwdStatus(null);
    if (newPwd.length < 6) {
      setPwdStatus('New password must be at least 6 characters.');
      return;
    }
    const res = await onChangePassword(currPwd, newPwd);
    if (res.ok) {
      setCurrPwd('');
      setNewPwd('');
      setPwdStatus('Password updated successfully.');
    } else {
      setPwdStatus(res.error || 'Could not update password.');
    }
  };

  return (
    <div className="min-h-screen pb-16">
      <AppHeader title="Account & Settings" onBack={onBack} />

      <main className="max-w-2xl mx-auto px-4 pt-4 space-y-4">
        {/* Protected Admin-Only Diagnostics Entry */}
        {isAdmin && (
          <button
            type="button"
            onClick={onOpenAdminDiagnostics}
            className="w-full rounded-2xl bg-gradient-to-r from-[#2D0E57] to-[#1A0835] border border-amber-400/60 p-4 flex items-center justify-between text-left shadow-lg hover:border-amber-300"
          >
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl mizo-gold-gradient text-[#1E0B3B] flex items-center justify-center shrink-0">
                <Activity className="w-5 h-5" />
              </div>
              <div>
                <p className="text-sm font-display font-bold text-white">
                  Protected Admin Diagnostics
                </p>
                <p className="text-[11px] text-amber-300">
                  Firebase, Agora RTC, FCM, Storage &amp; Backend API Telemetry
                </p>
              </div>
            </div>
            <span className="px-2.5 py-1 rounded-full bg-amber-400/20 text-amber-200 text-[10px] font-bold">
              ADMIN
            </span>
          </button>
        )}

        {/* 1. Edit Account */}
        <section className="mizo-royal-card rounded-2xl p-4 space-y-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <UserCheck className="w-4 h-4 text-amber-400" />
              <h2 className="text-sm font-display font-bold text-white">Account Identity</h2>
            </div>
            <button
              type="button"
              onClick={onEditProfile}
              className="px-3 py-1.5 rounded-xl mizo-purple-gradient text-xs font-bold text-white"
            >
              Edit Profile
            </button>
          </div>
          <div className="text-xs text-slate-300 space-y-1">
            <p>
              Username: <span className="text-white font-semibold">{profile.username}</span> (ID:{' '}
              {profile.userId})
            </p>
            <p>
              Email:{' '}
              <span className="text-amber-300">
                {authEmail || (isGuest ? 'Guest Session (Unlinked)' : 'Connected')}
              </span>
            </p>
            <p>Member Since: {profile.accountCreatedAt}</p>
          </div>
        </section>

        {/* 2. Linked Accounts */}
        <section className="mizo-royal-card rounded-2xl p-4 space-y-3">
          <div className="flex items-center gap-2">
            <Link2 className="w-4 h-4 text-amber-400" />
            <h2 className="text-sm font-display font-bold text-white">Linked Accounts</h2>
          </div>
          <div className="flex items-center justify-between text-xs">
            <span className="text-slate-300">
              Providers:{' '}
              <span className="text-white font-semibold">
                {linkedProviders.length > 0 ? linkedProviders.join(', ') : isGuest ? 'Anonymous Guest' : 'Local'}
              </span>
            </span>
            <button
              type="button"
              onClick={onLinkGoogle}
              className="px-3 py-1.5 rounded-xl bg-white text-[#1E0B3B] font-extrabold text-xs"
            >
              Link Google
            </button>
          </div>
        </section>

        {/* 3. Change Password */}
        <section className="mizo-royal-card rounded-2xl p-4 space-y-3">
          <div className="flex items-center gap-2">
            <KeyRound className="w-4 h-4 text-amber-400" />
            <h2 className="text-sm font-display font-bold text-white">Change Password</h2>
          </div>
          <form onSubmit={handlePasswordSubmit} className="space-y-2.5">
            <input
              type="password"
              value={currPwd}
              onChange={(e) => setCurrPwd(e.target.value)}
              placeholder="Current password"
              className="w-full h-10 px-3 rounded-xl bg-[#140B26] border border-purple-500/30 text-xs text-white"
            />
            <input
              type="password"
              value={newPwd}
              onChange={(e) => setNewPwd(e.target.value)}
              placeholder="New password (min 6 chars)"
              className="w-full h-10 px-3 rounded-xl bg-[#140B26] border border-purple-500/30 text-xs text-white"
            />
            {pwdStatus && <p className="text-xs text-amber-300">{pwdStatus}</p>}
            <button
              type="submit"
              className="w-full min-h-[40px] rounded-xl mizo-gold-gradient text-[#1E0B3B] text-xs font-extrabold"
            >
              Update Password
            </button>
          </form>
        </section>

        {/* 4. Profile Privacy & Theme */}
        <section className="mizo-royal-card rounded-2xl p-4 space-y-3">
          <div className="flex items-center gap-2">
            <Lock className="w-4 h-4 text-amber-400" />
            <h2 className="text-sm font-display font-bold text-white">
              Privacy Settings &amp; Profile Theme
            </h2>
          </div>

          <div className="space-y-1.5">
            <span className="text-xs text-slate-300 inline-flex items-center gap-1">
              <Eye className="w-3.5 h-3.5 text-purple-300" /> Profile Visibility
            </span>
            <div className="grid grid-cols-3 gap-2">
              {(['public', 'followers', 'private'] as const).map((priv) => (
                <button
                  key={priv}
                  type="button"
                  onClick={() => onUpdatePrivacy(priv, profile.profileTheme)}
                  className={`py-2 rounded-xl text-xs font-bold capitalize ${
                    profile.profilePrivacy === priv
                      ? 'mizo-gold-gradient text-[#1E0B3B]'
                      : 'bg-[#140B26] text-slate-300 border border-purple-500/25'
                  }`}
                >
                  {priv}
                </button>
              ))}
            </div>
          </div>

          <div className="space-y-1.5">
            <span className="text-xs text-slate-300">Profile Theme</span>
            <div className="grid grid-cols-2 gap-2">
              {THEMES.map((theme) => (
                <button
                  key={theme.id}
                  type="button"
                  onClick={() => onUpdatePrivacy(profile.profilePrivacy, theme.id)}
                  className={`py-2 px-3 rounded-xl text-xs font-bold ${
                    profile.profileTheme === theme.id
                      ? 'mizo-purple-gradient text-white border border-amber-400/60'
                      : 'bg-[#140B26] text-slate-300 border border-purple-500/25'
                  }`}
                >
                  {theme.label}
                </button>
              ))}
            </div>
          </div>
        </section>

        {/* 5. Notification Settings & FCM Push */}
        <section className="mizo-royal-card rounded-2xl p-4 space-y-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Bell className="w-4 h-4 text-amber-400" />
              <h2 className="text-sm font-display font-bold text-white">Notification Settings</h2>
            </div>
            <button
              type="button"
              onClick={onEnablePushNotifications}
              className="px-2.5 py-1 rounded-lg bg-amber-400/20 text-amber-200 text-[11px] font-bold"
            >
              Enable Push (FCM)
            </button>
          </div>
          <div className="grid grid-cols-2 gap-2">
            {(Object.keys(notificationPrefs) as Array<keyof NotificationPrefs>).map((k) => (
              <button
                key={k}
                type="button"
                onClick={() =>
                  onUpdateNotifPrefs({ ...notificationPrefs, [k]: !notificationPrefs[k] })
                }
                className={`p-2.5 rounded-xl border text-xs font-semibold flex items-center justify-between ${
                  notificationPrefs[k]
                    ? 'bg-purple-900/40 border-amber-400/40 text-white'
                    : 'bg-[#120A22] border-purple-500/20 text-slate-400'
                }`}
              >
                <span className="capitalize">{k}</span>
                <span>{notificationPrefs[k] ? 'ON' : 'OFF'}</span>
              </button>
            ))}
          </div>
        </section>

        {/* 6. Language */}
        <section className="mizo-royal-card rounded-2xl p-4 space-y-2.5">
          <div className="flex items-center gap-2">
            <Globe className="w-4 h-4 text-amber-400" />
            <h2 className="text-sm font-display font-bold text-white">Language</h2>
          </div>
          <div className="flex flex-wrap gap-2">
            {LANGUAGES.map((lang) => (
              <button
                key={lang}
                type="button"
                onClick={() => onChangeLanguage(lang)}
                className={`px-3 py-1.5 rounded-xl text-xs font-bold ${
                  language === lang
                    ? 'mizo-gold-gradient text-[#1E0B3B]'
                    : 'bg-[#140B26] text-slate-300 border border-purple-500/25'
                }`}
              >
                {lang}
              </button>
            ))}
          </div>
        </section>

        {/* 7. Blocked Users */}
        <section className="mizo-royal-card rounded-2xl p-4 space-y-2.5">
          <div className="flex items-center gap-2">
            <Ban className="w-4 h-4 text-rose-400" />
            <h2 className="text-sm font-display font-bold text-white">
              Blocked Users ({blockedUsers.length})
            </h2>
          </div>
          {blockedUsers.length === 0 ? (
            <p className="text-xs text-slate-400">No blocked users.</p>
          ) : (
            <div className="space-y-2">
              {blockedUsers.map((b) => (
                <div
                  key={b.id}
                  className="flex items-center justify-between p-2.5 rounded-xl bg-[#140B26] border border-purple-500/20 text-xs"
                >
                  <div>
                    <p className="font-bold text-white">{b.name}</p>
                    <p className="text-[11px] text-slate-400">
                      {b.reason} · {b.blockedAt}
                    </p>
                  </div>
                  <button
                    type="button"
                    onClick={() => onUnblockUser(b.id)}
                    className="px-3 py-1 rounded-lg bg-white/10 text-amber-300 font-bold"
                  >
                    Unblock
                  </button>
                </div>
              ))}
            </div>
          )}
        </section>

        {/* 8. Report History */}
        <section className="mizo-royal-card rounded-2xl p-4 space-y-2.5">
          <div className="flex items-center gap-2">
            <FileWarning className="w-4 h-4 text-amber-400" />
            <h2 className="text-sm font-display font-bold text-white">
              Report History ({reportHistory.length})
            </h2>
          </div>
          {reportHistory.length === 0 ? (
            <p className="text-xs text-slate-400">No moderation reports filed.</p>
          ) : (
            <div className="space-y-2">
              {reportHistory.map((r) => (
                <div
                  key={r.id}
                  className="p-2.5 rounded-xl bg-[#140B26] border border-purple-500/20 text-xs flex items-center justify-between gap-2"
                >
                  <div>
                    <p className="font-bold text-white">
                      {r.targetName} ({r.targetType})
                    </p>
                    <p className="text-[11px] text-slate-400">{r.reason}</p>
                  </div>
                  <span className="px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-300 text-[10px] font-bold inline-flex items-center gap-1 shrink-0">
                    <CheckCircle2 className="w-3 h-3" /> {r.status}
                  </span>
                </div>
              ))}
            </div>
          )}
        </section>

        {/* 9. Logout & Delete Account */}
        <section className="grid grid-cols-2 gap-3 pt-2">
          <button
            type="button"
            onClick={onLogout}
            className="min-h-[46px] rounded-2xl bg-[#160B2C] border border-purple-500/35 text-xs font-bold text-white inline-flex items-center justify-center gap-2 hover:bg-purple-900/40"
          >
            <LogOut className="w-4 h-4 text-amber-300" />
            <span>Logout</span>
          </button>

          <button
            type="button"
            onClick={() => setConfirmDeleteOpen(true)}
            className="min-h-[46px] rounded-2xl bg-rose-950/60 border border-rose-500/45 text-xs font-bold text-rose-300 inline-flex items-center justify-center gap-2 hover:bg-rose-900/50"
          >
            <Trash2 className="w-4 h-4" />
            <span>Delete Account</span>
          </button>
        </section>
      </main>

      {confirmDeleteOpen && (
        <div
          className="fixed inset-0 z-50 bg-black/80 backdrop-blur-md flex items-center justify-center p-4"
          role="alertdialog"
          aria-modal="true"
        >
          <div className="w-full max-w-xs rounded-3xl mizo-royal-card border border-rose-500/50 p-5 text-center space-y-4">
            <Shield className="w-10 h-10 text-rose-400 mx-auto" />
            <h3 className="text-base font-display font-bold text-white">
              Delete Account?
            </h3>
            <p className="text-xs text-slate-300">
              This permanently removes your Firebase Auth session and local profile data.
            </p>
            <div className="grid grid-cols-2 gap-2.5">
              <button
                type="button"
                onClick={() => setConfirmDeleteOpen(false)}
                className="min-h-[42px] rounded-xl bg-white/10 text-xs font-bold text-white"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={async () => {
                  setConfirmDeleteOpen(false);
                  await onDeleteAccount();
                }}
                className="min-h-[42px] rounded-xl bg-rose-600 text-xs font-extrabold text-white"
              >
                Delete Forever
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
