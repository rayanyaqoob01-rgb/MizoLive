import AgoraRTC, {
  IAgoraRTCClient,
  IAgoraRTCRemoteUser,
  ICameraVideoTrack,
  IMicrophoneAudioTrack,
  ConnectionState,
} from 'agora-rtc-sdk-ng';
import { apiClient } from './apiClient';

AgoraRTC.setLogLevel(3); // Warning & Error logs only

export type AgoraSessionKind = 'live' | 'pk' | 'call' | 'room';

export type AgoraStatus =
  | 'idle'
  | 'connecting'
  | 'connected'
  | 'reconnecting'
  | 'disconnected'
  | 'credentials_required'
  | 'permission_denied'
  | 'error';

export interface AgoraTokenResponse {
  ok: boolean;
  configured?: boolean;
  appId?: string;
  token?: string;
  channelName?: string;
  uid?: number;
  expiresAt?: number;
  error?: string;
  code?: string;
}

export interface AgoraSessionEvents {
  onStatusChange?: (status: AgoraStatus, detail: string) => void;
  onRemoteUsersChange?: (users: IAgoraRTCRemoteUser[]) => void;
  onError?: (message: string) => void;
}

interface ManagedAgoraSession {
  sessionId: string;
  kind: AgoraSessionKind;
  channelName: string;
  client: IAgoraRTCClient;
  localAudioTrack: IMicrophoneAudioTrack | null;
  localVideoTrack: ICameraVideoTrack | null;
  remoteUsers: Map<string | number, IAgoraRTCRemoteUser>;
  cameras: MediaDeviceInfo[];
  cameraIndex: number;
  torchOn: boolean;
}

class CentralizedAgoraService {
  private sessions = new Map<string, ManagedAgoraSession>();
  private lastStatus: AgoraStatus = 'idle';
  private lastDetail = 'Standby';
  private lastError: string | null = null;
  private serverConfigured: boolean | null = null;

  getDiagnostics() {
    return {
      activeSessionsCount: this.sessions.size,
      activeChannels: Array.from(this.sessions.values()).map((s) => ({
        sessionId: s.sessionId,
        kind: s.kind,
        channelName: s.channelName,
        remoteCount: s.remoteUsers.size,
      })),
      lastStatus: this.lastStatus,
      lastDetail: this.lastDetail,
      lastError: this.lastError,
      serverConfigured: this.serverConfigured,
    };
  }

  async checkServerStatus(): Promise<boolean> {
    const res = await apiClient.get<{ agora?: { configured: boolean } }>('/api/health');
    if (res.ok && res.data?.agora) {
      this.serverConfigured = Boolean(res.data.agora.configured);
      return this.serverConfigured;
    }
    return false;
  }

  async startSession(params: {
    sessionId: string;
    kind: AgoraSessionKind;
    channelName: string;
    role: 'host' | 'audience';
    enableVideo: boolean;
    enableAudio: boolean;
    uid?: number;
    events?: AgoraSessionEvents;
  }): Promise<{
    ok: boolean;
    status: AgoraStatus;
    localVideoTrack: ICameraVideoTrack | null;
    localAudioTrack: IMicrophoneAudioTrack | null;
    remoteUsers: IAgoraRTCRemoteUser[];
    error?: string;
  }> {
    // Clean up existing session with same ID to avoid channel leaks
    if (this.sessions.has(params.sessionId)) {
      await this.leaveSession(params.sessionId);
    }

    const emitStatus = (status: AgoraStatus, detail: string) => {
      this.lastStatus = status;
      this.lastDetail = detail;
      params.events?.onStatusChange?.(status, detail);
    };

    emitStatus('connecting', `Requesting secure Agora RTC token for ${params.channelName}...`);

    // 1. Fetch server-generated RTC token (never hardcoded in frontend)
    const tokenRes = await apiClient.post<AgoraTokenResponse>('/api/agora/token', {
      channelName: params.channelName,
      role: params.role === 'host' ? 'publisher' : 'subscriber',
      uid: params.uid || 0,
    });

    if (!tokenRes.ok || !tokenRes.data?.appId || !tokenRes.data?.token) {
      const missingCreds =
        tokenRes.code === 'AGORA_CREDENTIALS_MISSING' || tokenRes.status === 503;
      const status: AgoraStatus = missingCreds ? 'credentials_required' : 'error';
      const detail = missingCreds
        ? 'Agora App ID & App Certificate required on server (.env) for live cloud RTC.'
        : tokenRes.error || 'Failed to acquire Agora RTC token';

      this.serverConfigured = missingCreds ? false : this.serverConfigured;
      this.lastError = detail;
      emitStatus(status, detail);
      params.events?.onError?.(detail);
      return {
        ok: false,
        status,
        localVideoTrack: null,
        localAudioTrack: null,
        remoteUsers: [],
        error: detail,
      };
    }

    this.serverConfigured = true;
    const { appId, token, uid } = tokenRes.data;

    // 2. Create mode-appropriate Agora RTC client
    const mode = params.kind === 'live' || params.kind === 'pk' ? 'live' : 'rtc';
    const client = AgoraRTC.createClient({ mode, codec: 'vp8' });

    if (mode === 'live') {
      await client.setClientRole(params.role === 'host' ? 'host' : 'audience');
    }

    const session: ManagedAgoraSession = {
      sessionId: params.sessionId,
      kind: params.kind,
      channelName: params.channelName,
      client,
      localAudioTrack: null,
      localVideoTrack: null,
      remoteUsers: new Map(),
      cameras: [],
      cameraIndex: 0,
      torchOn: false,
    };
    this.sessions.set(params.sessionId, session);

    // 3. Register Agora lifecycle & media event callbacks
    client.on('connection-state-change', (curState: ConnectionState, _revState, reason) => {
      if (curState === 'RECONNECTING') {
        emitStatus('reconnecting', `Reconnecting Agora channel (${reason || 'network'})...`);
      } else if (curState === 'CONNECTED') {
        emitStatus('connected', `Agora ${mode.toUpperCase()} channel connected`);
      } else if (curState === 'DISCONNECTED') {
        emitStatus('disconnected', `Disconnected from Agora (${reason || 'closed'})`);
      }
    });

    client.on('user-published', async (user, mediaType) => {
      try {
        await client.subscribe(user, mediaType);
        session.remoteUsers.set(user.uid, user);
        if (mediaType === 'audio') {
          user.audioTrack?.play();
        }
        params.events?.onRemoteUsersChange?.(Array.from(session.remoteUsers.values()));
      } catch (err: any) {
        params.events?.onError?.(err?.message || 'Failed to subscribe remote media');
      }
    });

    client.on('user-unpublished', (user) => {
      session.remoteUsers.set(user.uid, user);
      params.events?.onRemoteUsersChange?.(Array.from(session.remoteUsers.values()));
    });

    client.on('user-left', (user) => {
      session.remoteUsers.delete(user.uid);
      params.events?.onRemoteUsersChange?.(Array.from(session.remoteUsers.values()));
    });

    // 4. Join Agora channel & create/publish local tracks if publisher
    try {
      await client.join(appId, params.channelName, token, uid ?? null);

      if (params.role === 'host') {
        const tracksToPublish: Array<IMicrophoneAudioTrack | ICameraVideoTrack> = [];
        if (params.enableAudio) {
          session.localAudioTrack = await AgoraRTC.createMicrophoneAudioTrack();
          tracksToPublish.push(session.localAudioTrack);
        }
        if (params.enableVideo) {
          session.cameras = await AgoraRTC.getCameras();
          session.localVideoTrack = await AgoraRTC.createCameraVideoTrack();
          tracksToPublish.push(session.localVideoTrack);
        }
        if (tracksToPublish.length > 0) {
          await client.publish(tracksToPublish);
        }
      }

      emitStatus('connected', `Agora ${params.channelName} active`);
      return {
        ok: true,
        status: 'connected',
        localVideoTrack: session.localVideoTrack,
        localAudioTrack: session.localAudioTrack,
        remoteUsers: Array.from(session.remoteUsers.values()),
      };
    } catch (err: any) {
      const msg = err?.message || 'Agora channel connection failed';
      const isPerm =
        err?.code === 'PERMISSION_DENIED' ||
        msg.toLowerCase().includes('permission') ||
        msg.toLowerCase().includes('notallowed');
      const status: AgoraStatus = isPerm ? 'permission_denied' : 'error';
      this.lastError = msg;
      emitStatus(status, msg);
      params.events?.onError?.(msg);
      await this.leaveSession(params.sessionId);
      return {
        ok: false,
        status,
        localVideoTrack: null,
        localAudioTrack: null,
        remoteUsers: [],
        error: msg,
      };
    }
  }

  async setCameraEnabled(sessionId: string, enabled: boolean) {
    const s = this.sessions.get(sessionId);
    if (!s?.localVideoTrack) return;
    await s.localVideoTrack.setEnabled(enabled);
  }

  async setMicEnabled(sessionId: string, enabled: boolean) {
    const s = this.sessions.get(sessionId);
    if (!s?.localAudioTrack) return;
    await s.localAudioTrack.setEnabled(enabled);
  }

  async switchCamera(sessionId: string): Promise<boolean> {
    const s = this.sessions.get(sessionId);
    if (!s?.localVideoTrack) return false;
    try {
      const cams = await AgoraRTC.getCameras();
      if (cams.length <= 1) return false;
      s.cameras = cams;
      s.cameraIndex = (s.cameraIndex + 1) % cams.length;
      await s.localVideoTrack.setDevice(cams[s.cameraIndex].deviceId);
      return true;
    } catch {
      return false;
    }
  }

  async setTorch(
    sessionId: string,
    enabled: boolean,
    fallbackStream?: MediaStream | null
  ): Promise<{ supported: boolean; active: boolean }> {
    const s = this.sessions.get(sessionId);
    const mediaTrack =
      s?.localVideoTrack?.getMediaStreamTrack() ||
      fallbackStream?.getVideoTracks()?.[0] ||
      null;

    if (!mediaTrack) return { supported: false, active: false };
    try {
      const capabilities = mediaTrack.getCapabilities?.() as MediaTrackCapabilities & {
        torch?: boolean;
      };
      if (!capabilities || !('torch' in capabilities)) {
        return { supported: false, active: false };
      }
      await mediaTrack.applyConstraints({
        advanced: [{ torch: enabled } as MediaTrackConstraintSet],
      });
      if (s) s.torchOn = enabled;
      return { supported: true, active: enabled };
    } catch {
      return { supported: false, active: false };
    }
  }

  async leaveSession(sessionId: string) {
    const s = this.sessions.get(sessionId);
    if (!s) return;
    this.sessions.delete(sessionId);

    try {
      if (s.localAudioTrack) {
        s.localAudioTrack.stop();
        s.localAudioTrack.close();
      }
      if (s.localVideoTrack) {
        s.localVideoTrack.stop();
        s.localVideoTrack.close();
      }
      await s.client.leave();
    } catch {
      // Safe teardown
    }

    if (this.sessions.size === 0) {
      this.lastStatus = 'idle';
      this.lastDetail = 'Standby';
    }
  }
}

export const agoraService = new CentralizedAgoraService();
