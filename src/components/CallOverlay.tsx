import React, { useEffect, useRef, useState } from 'react';
import {
  Camera,
  CameraOff,
  Coins,
  Mic,
  MicOff,
  Phone,
  PhoneIncoming,
  PhoneOff,
  RefreshCw,
  Volume2,
  VolumeX,
  Video,
  X,
} from 'lucide-react';
import { EconomyConfig } from '../types/mizo';
import { GoldCoinIcon, SafeImage } from './Cards';
import { LevelBadge } from './LevelBadge';

export interface ActiveCallSessionUI {
  callId: string;
  peerName: string;
  peerAvatar: string;
  peerLevel: number;
  callType: 'audio' | 'video';
  direction: 'outgoing' | 'incoming';
  ratePerMin: number;
  totalCharged: number;
}

interface CallOverlayProps {
  pendingConsent: {
    peerName: string;
    peerAvatar: string;
    peerLevel: number;
    callType: 'audio' | 'video';
  } | null;
  incomingCall: {
    callId: string;
    peerName: string;
    peerAvatar: string;
    peerLevel: number;
    callType: 'audio' | 'video';
  } | null;
  activeCall: ActiveCallSessionUI | null;
  economy: EconomyConfig;
  userCoins: number;
  wsRef: React.RefObject<WebSocket | null>;
  onCancelConsent: () => void;
  onConfirmStartCall: (
    peerName: string,
    peerAvatar: string,
    peerLevel: number,
    callType: 'audio' | 'video'
  ) => void;
  onAcceptIncoming: () => void;
  onDeclineIncoming: () => void;
  onCallTick: (callId: string) => Promise<boolean>;
  onEndCall: (callId: string, durationDisplay: string, totalCharged: number) => void;
  onOpenWallet: () => void;
}

export const CallOverlay: React.FC<CallOverlayProps> = ({
  pendingConsent,
  incomingCall,
  activeCall,
  economy,
  userCoins,
  wsRef,
  onCancelConsent,
  onConfirmStartCall,
  onAcceptIncoming,
  onDeclineIncoming,
  onCallTick,
  onEndCall,
  onOpenWallet,
}) => {
  const [micMuted, setMicMuted] = useState(false);
  const [speakerOn, setSpeakerOn] = useState(true);
  const [camOn, setCamOn] = useState(true);
  const [facingMode, setFacingMode] = useState<'user' | 'environment'>('user');
  const [seconds, setSeconds] = useState(0);
  const [mediaStatus, setMediaStatus] = useState<string>('Connecting media...');

  const localVideoRef = useRef<HTMLVideoElement>(null);
  const remoteVideoRef = useRef<HTMLVideoElement>(null);
  const localStreamRef = useRef<MediaStream | null>(null);
  const peerConnRef = useRef<RTCPeerConnection | null>(null);

  // Stop media tracks cleanly
  const cleanupMedia = () => {
    if (localStreamRef.current) {
      localStreamRef.current.getTracks().forEach((t) => t.stop());
      localStreamRef.current = null;
    }
    if (peerConnRef.current) {
      peerConnRef.current.close();
      peerConnRef.current = null;
    }
  };

  // Initialize real getUserMedia + RTCPeerConnection when call becomes active
  useEffect(() => {
    if (!activeCall) {
      cleanupMedia();
      setSeconds(0);
      return;
    }

    let cancelled = false;
    setCamOn(activeCall.callType === 'video');
    setMicMuted(false);
    setSpeakerOn(true);

    const startWebRtc = async () => {
      try {
        const stream = await navigator.mediaDevices.getUserMedia({
          audio: true,
          video:
            activeCall.callType === 'video'
              ? { facingMode }
              : false,
        });

        if (cancelled) {
          stream.getTracks().forEach((t) => t.stop());
          return;
        }

        localStreamRef.current = stream;
        if (localVideoRef.current && activeCall.callType === 'video') {
          localVideoRef.current.srcObject = stream;
        }

        const pc = new RTCPeerConnection({
          iceServers: [{ urls: 'stun:stun.l.google.com:19302' }],
        });
        peerConnRef.current = pc;

        stream.getTracks().forEach((track) => pc.addTrack(track, stream));

        pc.ontrack = (evt) => {
          if (remoteVideoRef.current && evt.streams[0]) {
            remoteVideoRef.current.srcObject = evt.streams[0];
          }
        };

        pc.onicecandidate = (evt) => {
          if (evt.candidate && wsRef.current?.readyState === WebSocket.OPEN) {
            wsRef.current.send(
              JSON.stringify({
                type: 'webrtc:ice',
                callId: activeCall.callId,
                candidate: evt.candidate,
              })
            );
          }
        };

        if (activeCall.direction === 'outgoing') {
          const offer = await pc.createOffer();
          await pc.setLocalDescription(offer);
          if (wsRef.current?.readyState === WebSocket.OPEN) {
            wsRef.current.send(
              JSON.stringify({
                type: 'webrtc:offer',
                callId: activeCall.callId,
                sdp: offer,
              })
            );
          }
        }

        setMediaStatus('Real WebRTC & Media Track Active');
      } catch {
        setMediaStatus('Microphone/camera permission denied or unavailable — timer & server billing active');
      }
    };

    startWebRtc();
    return () => {
      cancelled = true;
      cleanupMedia();
    };
  }, [activeCall?.callId]);

  // Real microphone mute toggle
  const toggleMic = () => {
    const nextMuted = !micMuted;
    setMicMuted(nextMuted);
    localStreamRef.current?.getAudioTracks().forEach((t) => {
      t.enabled = !nextMuted;
    });
  };

  // Real camera ON/OFF toggle
  const toggleCam = () => {
    if (!activeCall || activeCall.callType !== 'video') return;
    const nextCam = !camOn;
    setCamOn(nextCam);
    localStreamRef.current?.getVideoTracks().forEach((t) => {
      t.enabled = nextCam;
    });
  };

  // Real Front / Rear camera switch
  const switchCamera = async () => {
    if (!activeCall || activeCall.callType !== 'video') return;
    const nextFacing = facingMode === 'user' ? 'environment' : 'user';
    setFacingMode(nextFacing);
    try {
      const nextStream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: nextFacing },
        audio: false,
      });
      const newVideoTrack = nextStream.getVideoTracks()[0];
      if (!newVideoTrack) return;

      const oldTracks = localStreamRef.current?.getVideoTracks() || [];
      oldTracks.forEach((t) => {
        localStreamRef.current?.removeTrack(t);
        t.stop();
      });
      localStreamRef.current?.addTrack(newVideoTrack);
      newVideoTrack.enabled = camOn;

      if (localVideoRef.current && localStreamRef.current) {
        localVideoRef.current.srcObject = localStreamRef.current;
      }

      const sender = peerConnRef.current
        ?.getSenders()
        .find((s) => s.track?.kind === 'video');
      if (sender) {
        await sender.replaceTrack(newVideoTrack);
      }
    } catch {
      setMediaStatus('Rear/front switch not supported on this device');
    }
  };

  // Speaker output toggle
  const toggleSpeaker = () => {
    const next = !speakerOn;
    setSpeakerOn(next);
    if (remoteVideoRef.current) {
      remoteVideoRef.current.muted = !next;
    }
  };

  // Call duration timer + per-minute server billing tick
  useEffect(() => {
    if (!activeCall) return;
    const interval = setInterval(() => {
      setSeconds((prev) => {
        const next = prev + 1;
        if (next > 0 && next % 60 === 0) {
          onCallTick(activeCall.callId).then((ok) => {
            if (!ok) {
              const dur = `${String(Math.floor(next / 60)).padStart(2, '0')}:${String(
                next % 60
              ).padStart(2, '0')}`;
              onEndCall(activeCall.callId, dur, activeCall.totalCharged);
            }
          });
        }
        return next;
      });
    }, 1000);
    return () => clearInterval(interval);
  }, [activeCall?.callId]);

  const formatTimer = (total: number) =>
    `${String(Math.floor(total / 60)).padStart(2, '0')}:${String(total % 60).padStart(2, '0')}`;

  /* 1. Pre-Call Coin Rate & Consent Modal */
  if (pendingConsent) {
    const rate =
      pendingConsent.callType === 'video'
        ? economy.videoCallCoinsPerMin
        : economy.audioCallCoinsPerMin;
    const hasEnough = userCoins >= rate;

    return (
      <div
        className="fixed inset-0 z-[60] bg-black/80 backdrop-blur-md flex items-center justify-center p-4"
        role="dialog"
        aria-modal="true"
        aria-label="Call billing consent"
      >
        <div className="w-full max-w-sm rounded-3xl mizo-royal-card p-5 space-y-4 border border-amber-400/45 shadow-2xl">
          <div className="flex items-center justify-between">
            <h3 className="text-base font-display font-bold text-white inline-flex items-center gap-2">
              {pendingConsent.callType === 'video' ? (
                <Video className="w-4 h-4 text-amber-400" />
              ) : (
                <Phone className="w-4 h-4 text-amber-400" />
              )}
              <span>
                {pendingConsent.callType === 'video' ? 'Video Call' : 'Audio Call'} Rate
              </span>
            </h3>
            <button
              type="button"
              onClick={onCancelConsent}
              className="w-8 h-8 rounded-xl bg-white/5 flex items-center justify-center text-slate-300"
            >
              <X className="w-4 h-4" />
            </button>
          </div>

          <div className="flex items-center gap-3 p-3 rounded-2xl bg-[#160B2C] border border-purple-500/25">
            <SafeImage
              src={pendingConsent.peerAvatar}
              alt={pendingConsent.peerName}
              className="w-12 h-12 rounded-full object-cover border border-amber-400"
            />
            <div className="min-w-0">
              <div className="flex items-center gap-1.5">
                <span className="text-sm font-bold text-white truncate">
                  {pendingConsent.peerName}
                </span>
                <LevelBadge level={pendingConsent.peerLevel} size="xs" />
              </div>
              <p className="text-xs text-amber-300 font-mono-num font-semibold mt-0.5">
                {rate} Coins / minute (Server-billed)
              </p>
            </div>
          </div>

          <div className="rounded-xl bg-[#120923] border border-purple-500/20 p-3 text-xs text-slate-300 space-y-1">
            <div className="flex justify-between">
              <span>Your Coin Balance:</span>
              <span className="font-mono-num font-bold text-amber-300 inline-flex items-center gap-1">
                <GoldCoinIcon size={12} /> {userCoins.toLocaleString()}
              </span>
            </div>
            <div className="flex justify-between">
              <span>Creator Share / Platform Fee:</span>
              <span className="font-mono-num text-purple-200">
                {100 - economy.platformCommissionPct}% / {economy.platformCommissionPct}%
              </span>
            </div>
          </div>

          {!hasEnough ? (
            <div className="space-y-3">
              <p className="text-xs font-semibold text-rose-400 text-center">
                Insufficient balance! At least {rate} coins required to start.
              </p>
              <button
                type="button"
                onClick={() => {
                  onCancelConsent();
                  onOpenWallet();
                }}
                className="w-full min-h-[44px] rounded-xl mizo-gold-gradient text-[#1E0B3B] text-xs font-extrabold inline-flex items-center justify-center gap-1.5"
              >
                <Coins className="w-4 h-4" />
                <span>Recharge Coins</span>
              </button>
            </div>
          ) : (
            <div className="grid grid-cols-2 gap-2.5">
              <button
                type="button"
                onClick={onCancelConsent}
                className="min-h-[44px] rounded-xl bg-white/10 text-xs font-bold text-white"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={() =>
                  onConfirmStartCall(
                    pendingConsent.peerName,
                    pendingConsent.peerAvatar,
                    pendingConsent.peerLevel,
                    pendingConsent.callType
                  )
                }
                className="min-h-[44px] rounded-xl mizo-gold-gradient text-[#1E0B3B] text-xs font-extrabold"
              >
                Agree &amp; Start Call
              </button>
            </div>
          )}
        </div>
      </div>
    );
  }

  /* 2. Incoming Call Banner */
  if (incomingCall && !activeCall) {
    return (
      <div
        className="fixed inset-0 z-[60] bg-black/85 backdrop-blur-lg flex items-center justify-center p-4"
        role="dialog"
        aria-modal="true"
        aria-label="Incoming Call"
      >
        <div className="w-full max-w-xs rounded-3xl mizo-royal-card p-6 text-center space-y-5 border border-amber-400/50">
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-purple-900/70 border border-purple-400/40 text-xs font-semibold text-amber-300">
            <PhoneIncoming className="w-3.5 h-3.5 animate-pulse" />
            <span>
              Incoming {incomingCall.callType === 'video' ? 'Video' : 'Audio'} Call
            </span>
          </div>

          <div className="w-24 h-24 mx-auto rounded-full p-1 mizo-gold-gradient animate-mizo-float">
            <SafeImage
              src={incomingCall.peerAvatar}
              alt={incomingCall.peerName}
              className="w-full h-full rounded-full object-cover"
            />
          </div>

          <div>
            <h3 className="text-xl font-display font-bold text-white">
              {incomingCall.peerName}
            </h3>
            <div className="mt-1 flex justify-center">
              <LevelBadge level={incomingCall.peerLevel} size="sm" />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3 pt-2">
            <button
              type="button"
              onClick={onDeclineIncoming}
              className="min-h-[48px] rounded-2xl bg-rose-600 hover:bg-rose-500 text-white text-xs font-bold inline-flex items-center justify-center gap-1.5"
            >
              <PhoneOff className="w-4 h-4" />
              <span>Decline</span>
            </button>
            <button
              type="button"
              onClick={onAcceptIncoming}
              className="min-h-[48px] rounded-2xl bg-emerald-500 hover:bg-emerald-400 text-white text-xs font-bold inline-flex items-center justify-center gap-1.5"
            >
              <Phone className="w-4 h-4" />
              <span>Accept</span>
            </button>
          </div>
        </div>
      </div>
    );
  }

  /* 3. Active Audio / Video Call Screen */
  if (!activeCall) return null;

  return (
    <div
      className="fixed inset-0 z-[60] bg-[#06040B] flex flex-col justify-between p-4 pt-safe pb-safe"
      role="dialog"
      aria-modal="true"
      aria-label="Active Call"
    >
      {/* Remote Video Feed or Audio Avatar Stage */}
      <div className="relative flex-1 max-w-md w-full mx-auto rounded-3xl overflow-hidden mizo-royal-card border border-purple-500/35 flex flex-col items-center justify-center">
        {activeCall.callType === 'video' ? (
          <>
            <video
              ref={remoteVideoRef}
              autoPlay
              playsInline
              className="absolute inset-0 w-full h-full object-cover bg-[#0A0515]"
            />
            {/* Local PiP Camera Feed */}
            <div className="absolute top-4 right-4 w-28 h-40 rounded-2xl overflow-hidden border-2 border-amber-400/70 bg-black shadow-xl z-20">
              {camOn ? (
                <video
                  ref={localVideoRef}
                  autoPlay
                  muted
                  playsInline
                  className="w-full h-full object-cover"
                />
              ) : (
                <div className="w-full h-full flex items-center justify-center text-slate-400 text-[10px]">
                  Cam Off
                </div>
              )}
            </div>
          </>
        ) : (
          <div className="relative z-10 text-center space-y-3 p-6">
            <div className="w-28 h-28 mx-auto rounded-full p-1 mizo-gold-gradient shadow-[0_0_40px_rgba(250,204,21,0.3)]">
              <SafeImage
                src={activeCall.peerAvatar}
                alt={activeCall.peerName}
                className="w-full h-full rounded-full object-cover"
              />
            </div>
            <h2 className="text-xl font-display font-bold text-white">
              {activeCall.peerName}
            </h2>
            <LevelBadge level={activeCall.peerLevel} size="sm" />
          </div>
        )}

        {/* Top Call Telemetry Bar */}
        <div className="absolute top-4 left-4 z-20 space-y-1">
          <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-black/65 backdrop-blur-md border border-white/15 text-xs">
            <span className="font-bold text-white">{activeCall.peerName}</span>
            <span className="font-mono-num font-bold text-amber-300">
              {formatTimer(seconds)}
            </span>
          </div>
          <p className="text-[10px] text-purple-200 bg-black/55 px-2.5 py-0.5 rounded-full inline-block">
            {activeCall.ratePerMin} Coins/min · Billed: {activeCall.totalCharged} Coins
          </p>
        </div>

        <p className="absolute bottom-3 inset-x-4 text-center text-[11px] text-slate-300 bg-black/50 backdrop-blur-sm py-1 px-3 rounded-full z-20">
          {mediaStatus}
        </p>
      </div>

      {/* Call Controls Bar */}
      <div className="max-w-md w-full mx-auto pt-4 flex items-center justify-center gap-3.5">
        <button
          type="button"
          onClick={toggleMic}
          aria-label={micMuted ? 'Unmute microphone' : 'Mute microphone'}
          className={`w-13 h-13 rounded-full flex items-center justify-center border transition-colors ${
            micMuted
              ? 'bg-rose-600/85 border-rose-400 text-white'
              : 'bg-[#180E30] border-purple-400/40 text-white'
          }`}
        >
          {micMuted ? <MicOff className="w-5 h-5" /> : <Mic className="w-5 h-5" />}
        </button>

        <button
          type="button"
          onClick={toggleSpeaker}
          aria-label={speakerOn ? 'Speaker off' : 'Speaker on'}
          className={`w-13 h-13 rounded-full flex items-center justify-center border transition-colors ${
            speakerOn
              ? 'bg-purple-700 border-amber-400/50 text-white'
              : 'bg-[#180E30] border-purple-400/40 text-slate-300'
          }`}
        >
          {speakerOn ? <Volume2 className="w-5 h-5" /> : <VolumeX className="w-5 h-5" />}
        </button>

        {activeCall.callType === 'video' && (
          <>
            <button
              type="button"
              onClick={toggleCam}
              aria-label={camOn ? 'Turn camera off' : 'Turn camera on'}
              className={`w-13 h-13 rounded-full flex items-center justify-center border transition-colors ${
                camOn
                  ? 'bg-[#180E30] border-purple-400/40 text-white'
                  : 'bg-rose-600/85 border-rose-400 text-white'
              }`}
            >
              {camOn ? <Camera className="w-5 h-5" /> : <CameraOff className="w-5 h-5" />}
            </button>

            <button
              type="button"
              onClick={switchCamera}
              aria-label="Switch front or rear camera"
              className="w-13 h-13 rounded-full bg-[#180E30] border border-purple-400/40 text-white flex items-center justify-center"
            >
              <RefreshCw className="w-5 h-5" />
            </button>
          </>
        )}

        <button
          type="button"
          onClick={() =>
            onEndCall(activeCall.callId, formatTimer(seconds), activeCall.totalCharged)
          }
          aria-label="End Call"
          className="w-14 h-14 rounded-full bg-rose-600 hover:bg-rose-500 text-white flex items-center justify-center shadow-lg shadow-rose-600/40"
        >
          <PhoneOff className="w-6 h-6" />
        </button>
      </div>
    </div>
  );
};
