import React, { useState } from 'react';
import {
  AlertCircle,
  ArrowLeft,
  CheckCircle2,
  Crown,
  Eye,
  EyeOff,
  KeyRound,
  Lock,
  Mail,
  RefreshCw,
  ShieldCheck,
  Sparkles,
  User as UserIcon,
  X,
} from 'lucide-react';
import { MizoAppIcon } from '../components/MizoLogo';

export type AuthScreenMode = 'welcome' | 'login' | 'signup' | 'forgot';

interface SplashScreenProps {
  visible: boolean;
}

export const SplashScreen: React.FC<SplashScreenProps> = ({ visible }) => {
  if (!visible) return null;
  return (
    <div
      className="fixed inset-0 z-[90] bg-[#06040B] flex flex-col items-center justify-center p-6 text-center"
      role="status"
      aria-label="Loading Mizo Live"
    >
      <div className="relative flex flex-col items-center gap-4">
        <div className="w-24 h-24 rounded-3xl mizo-royal-card border border-amber-400/50 flex items-center justify-center shadow-[0_0_55px_rgba(147,51,234,0.6)] animate-mizo-float">
          <MizoAppIcon size={64} />
        </div>
        <div>
          <h1 className="text-3xl font-display font-extrabold tracking-tight">
            <span className="text-white">MIZO</span>{' '}
            <span className="mizo-gold-text">LIVE</span>
          </h1>
          <p className="text-xs text-purple-200/80 mt-1 tracking-widest uppercase">
            Live · Connect · Enjoy
          </p>
        </div>
        <div className="w-36 h-1 rounded-full bg-purple-950 overflow-hidden mt-2">
          <div className="h-full w-2/3 mizo-gold-gradient animate-pulse rounded-full" />
        </div>
      </div>
    </div>
  );
};

interface AuthFlowScreenProps {
  open: boolean;
  initialMode?: AuthScreenMode;
  onGoogleLogin: () => Promise<{ ok: boolean; error?: string }>;
  onFacebookLogin: () => Promise<{ ok: boolean; error?: string }>;
  onEmailLogin: (email: string, password: string) => Promise<{ ok: boolean; error?: string }>;
  onEmailSignup: (
    email: string,
    password: string,
    username: string
  ) => Promise<{ ok: boolean; error?: string }>;
  onForgotPassword: (email: string) => Promise<{ ok: boolean; error?: string }>;
  onGuestExplore: () => Promise<{ ok: boolean; error?: string }>;
  onClose?: () => void;
}

export const AuthFlowScreen: React.FC<AuthFlowScreenProps> = ({
  open,
  initialMode = 'welcome',
  onGoogleLogin,
  onFacebookLogin,
  onEmailLogin,
  onEmailSignup,
  onForgotPassword,
  onGuestExplore,
  onClose,
}) => {
  const [mode, setMode] = useState<AuthScreenMode>(initialMode);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [username, setUsername] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);

  if (!open) return null;

  const resetMessages = () => {
    setErrorMsg(null);
    setSuccessMsg(null);
  };

  const runAction = async (fn: () => Promise<{ ok: boolean; error?: string }>, successText?: string) => {
    resetMessages();
    setLoading(true);
    try {
      const res = await fn();
      if (!res.ok) {
        setErrorMsg(res.error || 'Authentication failed. Check Firebase provider configuration.');
      } else if (successText) {
        setSuccessMsg(successText);
      }
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (mode === 'login') {
      await runAction(() => onEmailLogin(email, password));
    } else if (mode === 'signup') {
      if (password.length < 6) {
        setErrorMsg('Password must be at least 6 characters.');
        return;
      }
      await runAction(
        () => onEmailSignup(email, password, username),
        'Account created! Verification email sent — check your inbox.'
      );
    } else if (mode === 'forgot') {
      await runAction(
        () => onForgotPassword(email),
        'Password reset email sent. Check your inbox.'
      );
    }
  };

  return (
    <div
      className="fixed inset-0 z-[80] bg-[#06040B]/98 backdrop-blur-2xl overflow-y-auto flex items-center justify-center p-4"
      role="dialog"
      aria-modal="true"
      aria-label="Mizo Live Authentication"
    >
      <div className="w-full max-w-md rounded-3xl mizo-royal-card border border-purple-500/40 p-6 space-y-5 shadow-[0_0_60px_rgba(147,51,234,0.45)] relative">
        {onClose && (
          <button
            type="button"
            onClick={onClose}
            aria-label="Close authentication"
            className="absolute top-4 right-4 w-9 h-9 rounded-xl bg-white/5 hover:bg-white/10 flex items-center justify-center text-slate-300"
          >
            <X className="w-4 h-4" />
          </button>
        )}

        {mode !== 'welcome' && (
          <button
            type="button"
            onClick={() => {
              resetMessages();
              setMode('welcome');
            }}
            className="inline-flex items-center gap-1.5 text-xs font-semibold text-amber-300 hover:text-amber-200"
          >
            <ArrowLeft className="w-4 h-4" />
            <span>Back to Welcome</span>
          </button>
        )}

        {/* Header */}
        <div className="text-center space-y-2 pt-1">
          <div className="w-16 h-16 mx-auto rounded-2xl bg-[#190B33] border border-amber-400/45 flex items-center justify-center shadow-lg">
            <MizoAppIcon size={44} />
          </div>
          <h2 className="text-2xl font-display font-extrabold text-white">
            {mode === 'welcome'
              ? 'Welcome to Mizo Live'
              : mode === 'login'
              ? 'Sign In'
              : mode === 'signup'
              ? 'Create Account'
              : 'Reset Password'}
          </h2>
          <p className="text-xs text-slate-300">
            {mode === 'welcome'
              ? 'Luxury Live Streaming · Party Rooms · Short Videos · Real-Time Gifts'
              : mode === 'login'
              ? 'Sign in with your verified Mizo Live account'
              : mode === 'signup'
              ? 'Join Mizo Live to go live, host rooms, and earn coins'
              : 'Enter your account email to receive a password reset link'}
          </p>
        </div>

        {errorMsg && (
          <div className="rounded-xl bg-rose-950/80 border border-rose-500/50 p-3 text-xs text-rose-200 flex items-start gap-2">
            <AlertCircle className="w-4 h-4 text-rose-400 shrink-0 mt-0.5" />
            <span>{errorMsg}</span>
          </div>
        )}

        {successMsg && (
          <div className="rounded-xl bg-emerald-950/80 border border-emerald-500/50 p-3 text-xs text-emerald-200 flex items-start gap-2">
            <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
            <span>{successMsg}</span>
          </div>
        )}

        {mode === 'welcome' ? (
          <div className="space-y-3">
            <button
              type="button"
              disabled={loading}
              onClick={() => runAction(onGoogleLogin)}
              className="w-full min-h-[48px] rounded-2xl bg-white text-[#1E0B3B] font-extrabold text-sm flex items-center justify-center gap-2.5 shadow-lg hover:bg-slate-100 disabled:opacity-60"
            >
              <span className="w-5 h-5 rounded-full bg-gradient-to-tr from-amber-400 via-rose-500 to-sky-500 text-white text-[11px] font-black flex items-center justify-center">
                G
              </span>
              <span>Continue with Google</span>
            </button>

            <button
              type="button"
              disabled={loading}
              onClick={() => runAction(onFacebookLogin)}
              className="w-full min-h-[48px] rounded-2xl bg-[#1877F2] hover:bg-[#166FE5] text-white font-bold text-sm flex items-center justify-center gap-2 shadow-lg disabled:opacity-60"
            >
              <span className="w-5 h-5 rounded-full bg-white text-[#1877F2] text-xs font-black flex items-center justify-center">
                f
              </span>
              <span>Continue with Facebook</span>
            </button>

            <div className="grid grid-cols-2 gap-2.5">
              <button
                type="button"
                onClick={() => {
                  resetMessages();
                  setMode('login');
                }}
                className="min-h-[46px] rounded-2xl mizo-purple-gradient border border-purple-300/35 text-xs font-bold text-white"
              >
                Email Login
              </button>
              <button
                type="button"
                onClick={() => {
                  resetMessages();
                  setMode('signup');
                }}
                className="min-h-[46px] rounded-2xl mizo-gold-gradient text-[#1E0B3B] text-xs font-extrabold"
              >
                Create Account
              </button>
            </div>

            <div className="pt-2 border-t border-purple-500/20">
              <button
                type="button"
                disabled={loading}
                onClick={() => runAction(onGuestExplore)}
                className="w-full min-h-[44px] rounded-2xl bg-[#150C28] hover:bg-[#1E1238] border border-amber-400/35 text-xs font-bold text-amber-200 flex items-center justify-center gap-2"
              >
                <Sparkles className="w-4 h-4 text-amber-400" />
                <span>Explore as Guest (Anonymous)</span>
              </button>
            </div>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="space-y-3.5">
            {mode === 'signup' && (
              <div className="space-y-1">
                <label className="text-xs font-semibold text-slate-300">Username</label>
                <div className="relative">
                  <UserIcon className="w-4 h-4 text-purple-300 absolute left-3.5 top-1/2 -translate-y-1/2" />
                  <input
                    type="text"
                    required
                    maxLength={32}
                    value={username}
                    onChange={(e) => setUsername(e.target.value)}
                    placeholder="Choose your stage name"
                    className="w-full h-11 pl-10 pr-4 rounded-xl bg-[#140B26] border border-purple-500/35 text-sm text-white placeholder:text-slate-400 focus:outline-none focus:border-amber-400"
                  />
                </div>
              </div>
            )}

            <div className="space-y-1">
              <label className="text-xs font-semibold text-slate-300">Email Address</label>
              <div className="relative">
                <Mail className="w-4 h-4 text-purple-300 absolute left-3.5 top-1/2 -translate-y-1/2" />
                <input
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="you@example.com"
                  className="w-full h-11 pl-10 pr-4 rounded-xl bg-[#140B26] border border-purple-500/35 text-sm text-white placeholder:text-slate-400 focus:outline-none focus:border-amber-400"
                />
              </div>
            </div>

            {mode !== 'forgot' && (
              <div className="space-y-1">
                <label className="text-xs font-semibold text-slate-300">Password</label>
                <div className="relative">
                  <Lock className="w-4 h-4 text-purple-300 absolute left-3.5 top-1/2 -translate-y-1/2" />
                  <input
                    type={showPassword ? 'text' : 'password'}
                    required
                    minLength={6}
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="Minimum 6 characters"
                    className="w-full h-11 pl-10 pr-10 rounded-xl bg-[#140B26] border border-purple-500/35 text-sm text-white placeholder:text-slate-400 focus:outline-none focus:border-amber-400"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword((s) => !s)}
                    aria-label="Toggle password visibility"
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-white"
                  >
                    {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
              </div>
            )}

            {mode === 'login' && (
              <div className="flex justify-end">
                <button
                  type="button"
                  onClick={() => {
                    resetMessages();
                    setMode('forgot');
                  }}
                  className="text-xs font-semibold text-amber-300 hover:underline inline-flex items-center gap-1"
                >
                  <KeyRound className="w-3.5 h-3.5" />
                  <span>Forgot Password?</span>
                </button>
              </div>
            )}

            <button
              type="submit"
              disabled={loading}
              className="w-full min-h-[46px] rounded-2xl mizo-gold-gradient text-[#1E0B3B] text-sm font-extrabold shadow-lg disabled:opacity-60"
            >
              {loading
                ? 'Please wait...'
                : mode === 'login'
                ? 'Sign In'
                : mode === 'signup'
                ? 'Create Mizo Live Account'
                : 'Send Reset Link'}
            </button>

            <div className="text-center text-xs text-slate-300 pt-1">
              {mode === 'login' ? (
                <button
                  type="button"
                  onClick={() => {
                    resetMessages();
                    setMode('signup');
                  }}
                  className="text-amber-300 font-semibold hover:underline"
                >
                  New to Mizo Live? Create Account
                </button>
              ) : (
                <button
                  type="button"
                  onClick={() => {
                    resetMessages();
                    setMode('login');
                  }}
                  className="text-amber-300 font-semibold hover:underline"
                >
                  Already have an account? Sign In
                </button>
              )}
            </div>
          </form>
        )}
      </div>
    </div>
  );
};

interface GuestRestrictionModalProps {
  actionLabel: string | null;
  onClose: () => void;
  onSignInGoogle: () => void;
  onOpenAuthModal: () => void;
}

export const GuestRestrictionModal: React.FC<GuestRestrictionModalProps> = ({
  actionLabel,
  onClose,
  onSignInGoogle,
  onOpenAuthModal,
}) => {
  if (!actionLabel) return null;
  return (
    <div
      className="fixed inset-0 z-[75] bg-black/80 backdrop-blur-md flex items-center justify-center p-4"
      role="dialog"
      aria-modal="true"
      aria-label="Account Required"
    >
      <div className="w-full max-w-xs rounded-3xl mizo-royal-card border border-amber-400/50 p-5 text-center space-y-4">
        <Crown className="w-10 h-10 text-amber-400 mx-auto" />
        <h3 className="text-lg font-display font-bold text-white">
          Sign In Required
        </h3>
        <p className="text-xs text-slate-300">
          Guest mode allows browsing Live streams, Rooms, and Videos. Sign in or link your account to{' '}
          <span className="text-amber-300 font-semibold">{actionLabel}</span>.
        </p>
        <div className="space-y-2">
          <button
            type="button"
            onClick={() => {
              onClose();
              onSignInGoogle();
            }}
            className="w-full min-h-[42px] rounded-xl bg-white text-[#1E0B3B] text-xs font-extrabold"
          >
            Continue with Google
          </button>
          <button
            type="button"
            onClick={() => {
              onClose();
              onOpenAuthModal();
            }}
            className="w-full min-h-[42px] rounded-xl mizo-gold-gradient text-[#1E0B3B] text-xs font-extrabold"
          >
            Email Sign In / Sign Up
          </button>
          <button
            type="button"
            onClick={onClose}
            className="w-full min-h-[38px] rounded-xl bg-white/10 text-xs font-semibold text-slate-200"
          >
            Keep Browsing as Guest
          </button>
        </div>
      </div>
    </div>
  );
};

interface EmailVerificationBannerProps {
  email: string;
  onResend: () => void;
  onRefresh: () => void;
}

export const EmailVerificationBanner: React.FC<EmailVerificationBannerProps> = ({
  email,
  onResend,
  onRefresh,
}) => (
  <div className="bg-amber-500/15 border-b border-amber-400/40 px-4 py-2 text-xs flex items-center justify-between gap-2 max-w-5xl mx-auto">
    <div className="flex items-center gap-2 min-w-0 text-amber-200">
      <ShieldCheck className="w-4 h-4 text-amber-400 shrink-0" />
      <span className="truncate">Verify your email ({email}) to unlock full creator features.</span>
    </div>
    <div className="flex items-center gap-2 shrink-0">
      <button
        type="button"
        onClick={onResend}
        className="px-2.5 py-1 rounded-lg bg-amber-400/20 text-amber-200 font-bold hover:bg-amber-400/30"
      >
        Resend
      </button>
      <button
        type="button"
        onClick={onRefresh}
        aria-label="Refresh verification status"
        className="p-1 rounded-lg bg-white/10 text-white hover:bg-white/20"
      >
        <RefreshCw className="w-3.5 h-3.5" />
      </button>
    </div>
  </div>
);
