import React, { useEffect, useState } from 'react';
import {
  Activity,
  AlertTriangle,
  CheckCircle2,
  Database,
  Lock,
  Radio,
  RefreshCw,
  Server,
  ShieldAlert,
} from 'lucide-react';
import { AppHeader } from '../components/Header';
import { agoraService } from '../services/agoraService';
import { apiClient } from '../services/apiClient';
import {
  getFirebaseDiagnosticsStatus,
  testFirestoreConnection,
} from '../services/firebase';

interface AdminDiagnosticsScreenProps {
  isAdmin: boolean;
  adminEmail: string | null;
  onBack: () => void;
}

interface ServerDiagnosticsPayload {
  ok: boolean;
  adminEmail: string;
  uptimeSec: number;
  backendStatus: string;
  agoraConfigured: boolean;
  activeCallsCount: number;
  activeAccountsCount: number;
  reportsCount: number;
  recentServerErrors: Array<{ endpoint: string; message: string; timestamp: string }>;
}

export const AdminDiagnosticsScreen: React.FC<AdminDiagnosticsScreenProps> = ({
  isAdmin,
  adminEmail,
  onBack,
}) => {
  const [refreshTick, setRefreshTick] = useState(0);
  const [serverData, setServerData] = useState<ServerDiagnosticsPayload | null>(null);
  const [serverError, setServerError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const loadDiagnostics = async () => {
    if (!isAdmin) return;
    setLoading(true);
    setServerError(null);
    await testFirestoreConnection();
    await agoraService.checkServerStatus();
    const res = await apiClient.get<ServerDiagnosticsPayload>('/api/admin/diagnostics');
    if (res.ok && res.data) {
      setServerData(res.data);
    } else {
      setServerError(res.error || 'Failed to load server diagnostics');
    }
    setLoading(false);
    setRefreshTick((t) => t + 1);
  };

  useEffect(() => {
    loadDiagnostics();
  }, [isAdmin]);

  if (!isAdmin) {
    return (
      <div className="min-h-screen pb-16">
        <AppHeader title="Access Denied" onBack={onBack} />
        <main className="max-w-md mx-auto px-4 pt-12 text-center space-y-4">
          <div className="w-16 h-16 mx-auto rounded-2xl bg-rose-950/70 border border-rose-500/50 flex items-center justify-center">
            <Lock className="w-8 h-8 text-rose-400" />
          </div>
          <h2 className="text-xl font-display font-bold text-white">
            Protected Admin Diagnostics
          </h2>
          <p className="text-xs text-slate-300">
            This screen is strictly restricted to verified Mizo Live administrators. Regular users do not have access.
          </p>
        </main>
      </div>
    );
  }

  const fb = getFirebaseDiagnosticsStatus();
  const agora = agoraService.getDiagnostics();
  const apiDiag = apiClient.getDiagnostics();

  return (
    <div className="min-h-screen pb-16" data-refresh={refreshTick}>
      <AppHeader
        title="Admin Diagnostics"
        onBack={onBack}
        rightSlot={
          <button
            type="button"
            onClick={loadDiagnostics}
            disabled={loading}
            className="min-h-[34px] px-3 rounded-full mizo-gold-gradient text-[#1E0B3B] text-xs font-extrabold inline-flex items-center gap-1"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} />
            <span>Refresh</span>
          </button>
        }
      />

      <main className="max-w-3xl mx-auto px-4 pt-4 space-y-4">
        <div className="rounded-2xl bg-purple-950/50 border border-amber-400/50 p-3.5 flex items-center justify-between text-xs">
          <div className="flex items-center gap-2 text-amber-200">
            <Activity className="w-4 h-4 text-amber-400" />
            <span>Authenticated Admin: {adminEmail}</span>
          </div>
          <span className="px-2.5 py-0.5 rounded-full bg-emerald-500/20 text-emerald-300 font-bold">
            VERIFIED
          </span>
        </div>

        {/* Service Status Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <StatusCard
            icon={<Database className="w-4 h-4 text-amber-400" />}
            title="Firebase Core & Firestore"
            ok={fb.firebaseCoreReady && fb.firestoreConnected}
            detail={`Project: ${fb.projectId} · DB: ${fb.firestoreDatabaseId}`}
            sub={fb.firestoreError || 'Firestore server check succeeded'}
          />
          <StatusCard
            icon={<CheckCircle2 className="w-4 h-4 text-emerald-400" />}
            title="Firebase Auth & Storage"
            ok={fb.authReady && fb.storageReady}
            detail={`Bucket: ${fb.storageBucket}`}
            sub={`AppCheck: ${fb.appCheckStatus} · RemoteConfig: ${fb.remoteConfigStatus}`}
          />
          <StatusCard
            icon={<Radio className="w-4 h-4 text-purple-300" />}
            title="Agora Real-Time RTC"
            ok={Boolean(serverData?.agoraConfigured || agora.serverConfigured)}
            detail={`Status: ${agora.lastStatus} · Active Channels: ${agora.activeSessionsCount}`}
            sub={
              serverData?.agoraConfigured
                ? 'Server AGORA_APP_ID & Certificate active'
                : 'Requires AGORA_APP_ID & AGORA_APP_CERTIFICATE in server .env'
            }
          />
          <StatusCard
            icon={<Server className="w-4 h-4 text-sky-400" />}
            title="Backend API & Notifications"
            ok={Boolean(serverData?.ok || apiDiag.backendReachable)}
            detail={`Uptime: ${serverData?.uptimeSec ?? 0}s · Active Calls: ${
              serverData?.activeCallsCount ?? 0
            }`}
            sub={`FCM: ${fb.fcmStatus} · Crash Listener: ${fb.crashReportingStatus}`}
          />
        </div>

        {/* Last Successful Request */}
        <section className="mizo-royal-card rounded-2xl p-4 space-y-2">
          <h3 className="text-sm font-display font-bold text-white">
            Last Successful API Request
          </h3>
          {apiDiag.lastSuccess ? (
            <div className="rounded-xl bg-[#120A22] border border-emerald-500/30 p-3 text-xs font-mono-num space-y-1">
              <p className="text-emerald-300 font-bold">
                {apiDiag.lastSuccess.method} {apiDiag.lastSuccess.endpoint} → HTTP{' '}
                {apiDiag.lastSuccess.status} ({apiDiag.lastSuccess.durationMs}ms)
              </p>
              <p className="text-slate-400">{apiDiag.lastSuccess.timestamp}</p>
            </div>
          ) : (
            <p className="text-xs text-slate-400">No successful requests recorded yet.</p>
          )}
        </section>

        {/* Recent Errors (Client + Server) */}
        <section className="mizo-royal-card rounded-2xl p-4 space-y-2.5">
          <div className="flex items-center gap-2">
            <ShieldAlert className="w-4 h-4 text-amber-400" />
            <h3 className="text-sm font-display font-bold text-white">
              Recent Errors ({apiDiag.recentErrors.length + (serverData?.recentServerErrors.length || 0)})
            </h3>
          </div>

          {serverError && (
            <div className="rounded-xl bg-rose-950/70 border border-rose-500/40 p-2.5 text-xs text-rose-200">
              {serverError}
            </div>
          )}

          {apiDiag.recentErrors.length === 0 &&
          (!serverData?.recentServerErrors || serverData.recentServerErrors.length === 0) ? (
            <p className="text-xs text-emerald-300">No errors logged in current session.</p>
          ) : (
            <div className="space-y-2 max-h-60 overflow-y-auto">
              {apiDiag.recentErrors.map((err) => (
                <div
                  key={err.id}
                  className="rounded-xl bg-[#160B2C] border border-rose-500/30 p-2.5 text-xs space-y-0.5"
                >
                  <p className="font-bold text-rose-300 font-mono-num">
                    [{err.status}] {err.method} {err.endpoint}
                  </p>
                  <p className="text-slate-200">{err.message}</p>
                  <p className="text-[10px] text-slate-400">{err.timestamp}</p>
                </div>
              ))}
              {serverData?.recentServerErrors.map((err, i) => (
                <div
                  key={`srv-${i}`}
                  className="rounded-xl bg-[#160B2C] border border-amber-500/30 p-2.5 text-xs space-y-0.5"
                >
                  <p className="font-bold text-amber-300 font-mono-num">
                    [SERVER] {err.endpoint}
                  </p>
                  <p className="text-slate-200">{err.message}</p>
                  <p className="text-[10px] text-slate-400">{err.timestamp}</p>
                </div>
              ))}
            </div>
          )}
        </section>
      </main>
    </div>
  );
};

const StatusCard: React.FC<{
  icon: React.ReactNode;
  title: string;
  ok: boolean;
  detail: string;
  sub: string;
}> = ({ icon, title, ok, detail, sub }) => (
  <div className="mizo-royal-card rounded-2xl p-4 space-y-1.5 border border-purple-500/30">
    <div className="flex items-center justify-between gap-2">
      <div className="flex items-center gap-2">
        {icon}
        <h3 className="text-xs font-display font-bold text-white">{title}</h3>
      </div>
      <span
        className={`px-2 py-0.5 rounded-full text-[10px] font-bold inline-flex items-center gap-1 ${
          ok
            ? 'bg-emerald-500/20 text-emerald-300'
            : 'bg-amber-500/20 text-amber-300'
        }`}
      >
        {ok ? <CheckCircle2 className="w-3 h-3" /> : <AlertTriangle className="w-3 h-3" />}
        {ok ? 'OPERATIONAL' : 'ACTION NEEDED'}
      </span>
    </div>
    <p className="text-[11px] text-slate-200 font-mono-num">{detail}</p>
    <p className="text-[11px] text-slate-400">{sub}</p>
  </div>
);
