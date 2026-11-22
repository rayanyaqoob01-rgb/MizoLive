import React, { useEffect, useRef, useState } from 'react';
import {
  Ban,
  Clock,
  Crown,
  Eye,
  Flag,
  Gift,
  Heart,
  Info,
  MicOff,
  Minimize2,
  Send,
  Share2,
  Shield,
  Sliders,
  Swords,
  Trophy,
  UserMinus,
  Users,
  X,
} from 'lucide-react';
import { GoldCoinIcon, SafeImage } from '../components/Cards';
import { GiftArtIcon, GiftPanel } from '../components/GiftPanel';
import { getCssFilterForMode, HostControlPanel } from '../components/HostControlPanel';
import { LevelBadge } from '../components/LevelBadge';
import { PkBattleStage, PkInvitePanel } from '../components/PkBattle';
import { UserInfoTarget } from '../components/UserInfoModal';
import { SAMPLE_ROOM_PARTICIPANTS } from '../data/mizoData';
import { agoraService, AgoraStatus } from '../services/agoraService';
import {
  GiftHistoryRecord,
  GiftItem,
  HostControlState,
  LiveSessionSummary,
  LiveStream,
  PkOpponent,
  RoomParticipant,
} from '../types/mizo';

interface LiveRoomScreenProps {
  stream: LiveStream;
  isHost: boolean;
  minimized: boolean;
  userCoins: number;
  username: string;
  userLevel: number;
  userVipLevel?: number;
  onMinimize: () => void;
  onCloseViewer: () => void;
  onCompleteEndLive: (summary: LiveSessionSummary) => void;
  onSendGift: (gift: GiftItem, recipient: string) => Promise<boolean>;
  onOpenUserInfo: (user: UserInfoTarget) => void;
  onAddActivityXp: (amount: number) => void;
  onBlockUser?: (name: string, reason: string) => void;
  onReportTarget?: (targetName: string, targetType: 'live' | 'user', reason: string) => void;
}

interface FloatingHeart {
  id: number;
  leftPct: number;
}

export const LiveRoomScreen: React.FC<LiveRoomScreenProps> = ({
  stream,
  isHost,
  minimized,
  userCoins,
  username,
  userLevel,
  userVipLevel = 0,
  onMinimize,
  onCloseViewer,
  onCompleteEndLive,
  onSendGift,
  onOpenUserInfo,
  onAddActivityXp,
  onBlockUser,
  onReportTarget,
}) => {
  const [elapsedSec, setElapsedSec] = useState(isHost ? 0 : 254);
  const [likesCount, setLikesCount] = useState(isHost ? 24 : 1840);
  const [floatingHearts, setFloatingHearts] = useState<FloatingHeart[]>([]);
  const [following, setFollowing] = useState(false);

  // Live Chat (with VIP badges + Moderation)
  const [chatInput, setChatInput] = useState('');
  const [chatPaused, setChatPaused] = useState(false);
  const [chatMessages, setChatMessages] = useState<
    Array<{ id: string; user: string; level: number; vip?: number; text: string }>
  >([
    { id: 'lc-1', user: 'Aarav', level: 19, vip: 1, text: 'Welcome to the live stage!' },
    { id: 'lc-2', user: 'Cute Queen', level: 64, vip: 4, text: 'Golden vibes tonight!' },
  ]);

  // Panels, Leaderboard & Info
  const [giftPanelOpen, setGiftPanelOpen] = useState(false);
  const [giftHistory, setGiftHistory] = useState<GiftHistoryRecord[]>([]);
  const [activeGiftBanner, setActiveGiftBanner] = useState<GiftHistoryRecord | null>(null);
  const [roomInfoOpen, setRoomInfoOpen] = useState(false);
  const [leaderboardOpen, setLeaderboardOpen] = useState(false);
  const [participants, setParticipants] = useState<RoomParticipant[]>(SAMPLE_ROOM_PARTICIPANTS);
  const [shareToast, setShareToast] = useState(false);

  // Agora RTC Live State
  const [agoraStatus, setAgoraStatus] = useState<AgoraStatus>('idle');
  const [agoraNote, setAgoraNote] = useState<string>('');

  // Host-only Real Camera / Microphone Controls (strictly hidden for viewers)
  const [hostControlsOpen, setHostControlsOpen] = useState(false);
  const [hostControls, setHostControls] = useState<HostControlState>({
    cameraOn: true,
    facingMode: 'front',
    rotationDeg: 0,
    micOn: true,
    flashOn: false,
    filter: 'Natural',
    effect: 'None',
    backgroundEffect: 'None',
  });
  const [mediaStatus, setMediaStatus] = useState<'active' | 'denied' | 'initializing'>(
    isHost ? 'initializing' : 'active'
  );

  const hostVideoRef = useRef<HTMLVideoElement>(null);
  const pkHostVideoRef = useRef<HTMLVideoElement>(null);
  const mediaStreamRef = useRef<MediaStream | null>(null);

  // PK Battle State
  const [pkInviteOpen, setPkInviteOpen] = useState(false);
  const [pendingPkOpponent, setPendingPkOpponent] = useState<PkOpponent | null>(null);
  const [activePkOpponent, setActivePkOpponent] = useState<PkOpponent | null>(null);
  const [pkSecondsLeft, setPkSecondsLeft] = useState(120);
  const [pkLeftScore, setPkLeftScore] = useState(0);
  const [pkRightScore, setPkRightScore] = useState(0);
  const [pkContributions, setPkContributions] = useState<
    Array<{ id: string; text: string; team: 'left' | 'right' }>
  >([]);
  const [pkWinner, setPkWinner] = useState<'left' | 'right' | 'draw' | null>(null);

  // End Live Confirmation (Host-only)
  const [endLiveDialogOpen, setEndLiveDialogOpen] = useState(false);

  const lastTapRef = useRef<number>(0);
  const lastDoubleBurstRef = useRef<number>(0);

  const stopAllHostTracks = () => {
    if (mediaStreamRef.current) {
      mediaStreamRef.current.getTracks().forEach((t) => t.stop());
      mediaStreamRef.current = null;
    }
    agoraService.leaveSession(`live-${stream.id}`);
  };

  // Connect Agora Live Channel + Host getUserMedia Camera/Mic
  useEffect(() => {
    let cancelled = false;
    const sessionId = `live-${stream.id}`;

    agoraService.startSession({
      sessionId,
      kind: 'live',
      channelName: `mizo_live_${stream.id}`,
      role: isHost ? 'host' : 'audience',
      enableAudio: isHost,
      enableVideo: isHost,
      events: {
        onStatusChange: (status, detail) => {
          if (!cancelled) {
            setAgoraStatus(status);
            setAgoraNote(detail);
          }
        },
      },
    });

    if (isHost) {
      const initMedia = async () => {
        try {
          const media = await navigator.mediaDevices.getUserMedia({
            video: { facingMode: hostControls.facingMode === 'front' ? 'user' : 'environment' },
            audio: true,
          });
          if (cancelled) {
            media.getTracks().forEach((t) => t.stop());
            return;
          }
          mediaStreamRef.current = media;
          setMediaStatus('active');
          if (hostVideoRef.current) {
            hostVideoRef.current.srcObject = media;
          }
        } catch {
          if (!cancelled) {
            setMediaStatus('denied');
          }
        }
      };
      initMedia();
    }

    return () => {
      cancelled = true;
      stopAllHostTracks();
    };
  }, [isHost, stream.id]);

  // Attach real video stream to <video> whenever un-minimized or camera toggled
  useEffect(() => {
    if (!isHost || !mediaStreamRef.current) return;
    if (hostVideoRef.current && hostVideoRef.current.srcObject !== mediaStreamRef.current) {
      hostVideoRef.current.srcObject = mediaStreamRef.current;
    }
    if (pkHostVideoRef.current && pkHostVideoRef.current.srcObject !== mediaStreamRef.current) {
      pkHostVideoRef.current.srcObject = mediaStreamRef.current;
    }
  }, [minimized, hostControls.cameraOn, activePkOpponent, isHost]);

  // Sync real track.enabled for Camera & Microphone
  useEffect(() => {
    if (!isHost) return;
    agoraService.setCameraEnabled(`live-${stream.id}`, hostControls.cameraOn);
    agoraService.setMicEnabled(`live-${stream.id}`, hostControls.micOn);
    if (mediaStreamRef.current) {
      mediaStreamRef.current.getVideoTracks().forEach((t) => {
        t.enabled = hostControls.cameraOn;
      });
      mediaStreamRef.current.getAudioTracks().forEach((t) => {
        t.enabled = hostControls.micOn;
      });
    }
  }, [isHost, hostControls.cameraOn, hostControls.micOn, stream.id]);

  // Real Front / Rear Camera Switch
  const prevFacingRef = useRef<'front' | 'rear'>(hostControls.facingMode);
  useEffect(() => {
    if (!isHost || prevFacingRef.current === hostControls.facingMode) return;
    prevFacingRef.current = hostControls.facingMode;
    agoraService.switchCamera(`live-${stream.id}`);
    if (!mediaStreamRef.current) return;

    const switchCamera = async () => {
      try {
        const nextCamStream = await navigator.mediaDevices.getUserMedia({
          video: {
            facingMode: hostControls.facingMode === 'front' ? 'user' : 'environment',
          },
          audio: false,
        });
        const newTrack = nextCamStream.getVideoTracks()[0];
        if (!newTrack) return;

        mediaStreamRef.current?.getVideoTracks().forEach((t) => {
          mediaStreamRef.current?.removeTrack(t);
          t.stop();
        });
        mediaStreamRef.current?.addTrack(newTrack);
        newTrack.enabled = hostControls.cameraOn;
        if (hostVideoRef.current && mediaStreamRef.current) {
          hostVideoRef.current.srcObject = mediaStreamRef.current;
        }
      } catch {
        // Single camera device fallback
      }
    };

    switchCamera();
  }, [isHost, hostControls.facingMode, stream.id]);

  // Live duration timer
  useEffect(() => {
    const t = setInterval(() => setElapsedSec((s) => s + 1), 1000);
    return () => clearInterval(t);
  }, []);

  // PK countdown timer
  useEffect(() => {
    if (!activePkOpponent || pkWinner) return;
    const t = setInterval(() => {
      setPkSecondsLeft((prev) => {
        if (prev <= 1) {
          setPkWinner(
            pkLeftScore > pkRightScore
              ? 'left'
              : pkRightScore > pkLeftScore
              ? 'right'
              : 'draw'
          );
          return 0;
        }
        return prev - 1;
      });
    }, 1000);
    return () => clearInterval(t);
  }, [activePkOpponent, pkWinner, pkLeftScore, pkRightScore]);

  if (minimized) return null;

  const formatDuration = (total: number) => {
    const m = String(Math.floor(total / 60)).padStart(2, '0');
    const s = String(total % 60).padStart(2, '0');
    return `${m}:${s}`;
  };

  const handleToggleFlash = async () => {
    const next = !hostControls.flashOn;
    const res = await agoraService.setTorch(`live-${stream.id}`, next, mediaStreamRef.current);
    setHostControls((prev) => ({ ...prev, flashOn: res.supported ? res.active : next }));
  };

  const spawnFloatingHeart = () => {
    const id = Date.now() + Math.random();
    const leftPct = 65 + Math.random() * 25;
    setFloatingHearts((prev) => [...prev.slice(-10), { id, leftPct }]);
    setLikesCount((c) => c + 1);
    setTimeout(() => {
      setFloatingHearts((prev) => prev.filter((h) => h.id !== id));
    }, 1100);
  };

  const handleStageTap = () => {
    const now = Date.now();
    if (now - lastTapRef.current < 280) {
      if (now - lastDoubleBurstRef.current > 350) {
        lastDoubleBurstRef.current = now;
        spawnFloatingHeart();
      }
      lastTapRef.current = 0;
    } else {
      lastTapRef.current = now;
    }
  };

  const handleSendChat = (e: React.FormEvent) => {
    e.preventDefault();
    if (!chatInput.trim() || chatPaused) return;
    setChatMessages((prev) => [
      ...prev.slice(-20),
      {
        id: `lc-${Date.now()}`,
        user: username,
        level: userLevel,
        vip: userVipLevel,
        text: chatInput.trim(),
      },
    ]);
    setChatInput('');
    onAddActivityXp(15);
  };

  const handleGiftPurchase = async (gift: GiftItem, recipient: string) => {
    const ok = await onSendGift(gift, recipient);
    if (!ok) return false;

    const record: GiftHistoryRecord = {
      id: `gh-${Date.now()}`,
      senderName: username,
      senderLevel: userLevel,
      recipientName: recipient,
      giftName: gift.name,
      giftPrice: gift.price,
      iconKey: gift.iconKey,
      timestamp: 'Just now',
    };
    setGiftHistory((prev) => [record, ...prev]);
    setActiveGiftBanner(record);
    setTimeout(() => {
      setActiveGiftBanner((curr) => (curr?.id === record.id ? null : curr));
    }, 2800);

    if (activePkOpponent && !pkWinner) {
      setPkLeftScore((s) => s + gift.pkPoints);
      setPkContributions((prev) => [
        {
          id: `pkc-${Date.now()}`,
          text: `${username} sent ${gift.name} (+${gift.pkPoints} pts)`,
          team: 'left',
        },
        ...prev.slice(0, 4),
      ]);
    }
    return true;
  };

  const handlePkInviteResponse = (accepted: boolean) => {
    if (!pendingPkOpponent) return;
    if (!accepted) {
      setPendingPkOpponent(null);
      setPkInviteOpen(false);
      setChatMessages((prev) => [
        ...prev,
        {
          id: `sys-${Date.now()}`,
          user: 'System',
          level: 99,
          text: `${pendingPkOpponent.username} declined the PK invitation.`,
        },
      ]);
      return;
    }

    setActivePkOpponent(pendingPkOpponent);
    setPendingPkOpponent(null);
    setPkInviteOpen(false);
    setPkSecondsLeft(120);
    setPkLeftScore(120);
    setPkRightScore(100);
    setPkWinner(null);
    setPkContributions([
      { id: 'pk-init', text: 'PK Battle Started! Send gifts to boost your host!', team: 'left' },
    ]);
  };

  const handleConfirmEndLive = () => {
    stopAllHostTracks();
    const summary: LiveSessionSummary = {
      title: stream.title,
      durationDisplay: formatDuration(elapsedSec),
      totalViewers: Math.max(stream.viewers, 148),
      peakViewers: Math.max(stream.viewers, 94),
      totalLikes: likesCount,
      giftsReceivedCount: giftHistory.length,
      giftsReceivedCoins: giftHistory.reduce((s, g) => s + g.giftPrice, 0),
      newFollowers: 14,
    };
    setEndLiveDialogOpen(false);
    onCompleteEndLive(summary);
  };

  const cssFilter = isHost ? getCssFilterForMode(hostControls.filter) : 'none';
  const stageStyle: React.CSSProperties = {
    filter: `${cssFilter}${
      isHost && hostControls.backgroundEffect === 'Studio Blur' ? ' blur(1px)' : ''
    }`,
    transform: isHost
      ? `rotate(${hostControls.rotationDeg}deg) ${
          hostControls.facingMode === 'front' ? 'scaleX(-1)' : ''
        }`
      : undefined,
  };

  // Gift Leaderboard aggregation
  const leaderboard = Object.entries(
    giftHistory.reduce<Record<string, number>>((acc, g) => {
      acc[g.senderName] = (acc[g.senderName] || 0) + g.giftPrice;
      return acc;
    }, { 'King Rayan': 1200, 'Cute Queen': 850 })
  )
    .sort((a, b) => b[1] - a[1])
    .slice(0, 5);

  return (
    <div className="fixed inset-0 z-50 bg-[#05030A] flex items-center justify-center sm:p-4">
      <div className="relative w-full h-full sm:h-[90vh] sm:max-w-[460px] sm:rounded-3xl overflow-hidden bg-[#090412] border-0 sm:border sm:border-purple-500/40 flex flex-col shadow-[0_0_60px_rgba(147,51,234,0.35)]">
        {/* Live Video Stage Backdrop */}
        <div
          onClick={handleStageTap}
          className="absolute inset-0 cursor-pointer select-none overflow-hidden"
        >
          {isHost && !hostControls.cameraOn ? (
            <div className="w-full h-full bg-gradient-to-b from-[#160B2C] to-[#06040B] flex flex-col items-center justify-center p-6 text-center">
              <SafeImage
                src={stream.avatar}
                alt={stream.username}
                className="w-24 h-24 rounded-full object-cover border-2 border-amber-400 mb-3"
              />
              <p className="text-sm font-bold text-white">Camera Paused (Host)</p>
              <p className="text-xs text-slate-400 mt-1">
                {hostControls.micOn ? 'Microphone track active' : 'Microphone muted'}
              </p>
            </div>
          ) : isHost && mediaStatus === 'active' ? (
            <video
              ref={hostVideoRef}
              autoPlay
              muted
              playsInline
              style={stageStyle}
              className="w-full h-full object-cover transition-all duration-300"
            />
          ) : (
            <div className="relative w-full h-full">
              <SafeImage
                src={stream.thumbnail}
                alt={stream.username}
                style={stageStyle}
                className="w-full h-full object-cover transition-all duration-300"
              />
              {isHost && mediaStatus === 'denied' && (
                <div className="absolute top-28 inset-x-4 text-center">
                  <span className="px-3 py-1 rounded-full bg-black/75 border border-rose-400/50 text-[11px] text-rose-200">
                    Camera permission blocked in browser — grant access to stream live camera
                  </span>
                </div>
              )}
            </div>
          )}

          {isHost && hostControls.backgroundEffect === 'Royal Stage' && (
            <div className="absolute inset-0 pointer-events-none bg-[radial-gradient(circle_at_top,rgba(147,51,234,0.35),transparent_55%)]" />
          )}
          {isHost && hostControls.effect === 'Neon Aura' && (
            <div className="absolute inset-0 pointer-events-none ring-4 ring-inset ring-fuchsia-500/50 shadow-[inset_0_0_60px_rgba(192,38,211,0.45)]" />
          )}
          {isHost && hostControls.effect === 'Golden Sparkles' && (
            <div className="absolute inset-0 pointer-events-none bg-[radial-gradient(circle_at_25%_25%,rgba(250,204,21,0.22),transparent_40%),radial-gradient(circle_at_75%_60%,rgba(250,204,21,0.2),transparent_40%)]" />
          )}
          {isHost && hostControls.effect === 'Crown Halo' && (
            <div className="absolute top-20 left-1/2 -translate-x-1/2 pointer-events-none text-4xl drop-shadow-[0_0_20px_rgba(250,204,21,0.9)] animate-mizo-float">
              👑
            </div>
          )}

          <div className="absolute inset-0 bg-gradient-to-b from-black/75 via-transparent to-black/90 pointer-events-none" />
        </div>

        {/* Top Bar */}
        <header className="relative z-20 p-3 pt-safe flex items-center justify-between gap-2">
          <div className="flex items-center gap-2 bg-black/55 backdrop-blur-md rounded-full pl-1.5 pr-3 py-1 border border-white/15 min-w-0">
            <button
              type="button"
              onClick={() =>
                onOpenUserInfo({
                  name: stream.username,
                  avatar: stream.avatar,
                  level: stream.hostLevel,
                  isFollowing: following,
                })
              }
              className="shrink-0"
            >
              <SafeImage
                src={stream.avatar}
                alt={stream.username}
                className="w-9 h-9 rounded-full object-cover border border-amber-400"
              />
            </button>
            <div className="min-w-0">
              <div className="flex items-center gap-1">
                <span className="text-xs font-bold text-white truncate">
                  {stream.username}
                </span>
                <LevelBadge level={stream.hostLevel} size="xs" />
              </div>
              <div className="flex items-center gap-2 text-[10px] text-amber-300 font-mono-num">
                <span className="inline-flex items-center gap-0.5">
                  <Eye className="w-3 h-3" /> {stream.viewerDisplay}
                </span>
                <span className="inline-flex items-center gap-0.5 text-slate-300">
                  <Clock className="w-3 h-3" /> {formatDuration(elapsedSec)}
                </span>
              </div>
            </div>

            {!isHost && (
              <button
                type="button"
                onClick={() => setFollowing((f) => !f)}
                className={`ml-1 px-2.5 py-1 rounded-full text-[10px] font-bold whitespace-nowrap ${
                  following
                    ? 'bg-white/15 text-white'
                    : 'mizo-gold-gradient text-[#1E0B3B]'
                }`}
              >
                {following ? 'Following' : 'Follow'}
              </button>
            )}
          </div>

          <div className="flex items-center gap-1 shrink-0">
            <button
              type="button"
              onClick={() => setLeaderboardOpen(true)}
              aria-label="Gift Leaderboard"
              className="w-8 h-8 rounded-full bg-black/55 backdrop-blur-md border border-white/15 flex items-center justify-center text-amber-300"
            >
              <Trophy className="w-4 h-4" />
            </button>
            <button
              type="button"
              onClick={onMinimize}
              aria-label="Minimize live stream"
              className="w-8 h-8 rounded-full bg-black/55 backdrop-blur-md border border-white/15 flex items-center justify-center text-amber-300 hover:border-amber-400"
            >
              <Minimize2 className="w-4 h-4" />
            </button>
            <button
              type="button"
              onClick={() => setRoomInfoOpen(true)}
              aria-label="Room information"
              className="w-8 h-8 rounded-full bg-black/55 backdrop-blur-md border border-white/15 flex items-center justify-center text-white hover:border-amber-400"
            >
              <Info className="w-4 h-4" />
            </button>
            <button
              type="button"
              onClick={() => (isHost ? setEndLiveDialogOpen(true) : onCloseViewer())}
              aria-label={isHost ? 'End Live Stream' : 'Leave Live Stream'}
              className="w-8 h-8 rounded-full bg-black/55 backdrop-blur-md border border-white/15 flex items-center justify-center text-white hover:bg-rose-600/80"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </header>

        {/* Sub-Header Status: Live Title + Agora Status + Host-Only Controls / PK */}
        <div className="relative z-20 px-3 flex items-center justify-between gap-2 flex-wrap">
          <div className="flex items-center gap-1.5 flex-wrap">
            <span className="text-[11px] text-purple-200 bg-black/50 backdrop-blur-md px-2.5 py-1 rounded-full border border-purple-400/30">
              {stream.title}
              {isHost && !hostControls.micOn ? ' · Mic Muted' : ''}
            </span>
            <span
              title={agoraNote}
              className="text-[10px] text-amber-200 bg-black/55 px-2 py-0.5 rounded-full border border-white/10"
            >
              {agoraStatus === 'connected'
                ? 'Agora Live HD'
                : agoraStatus === 'credentials_required'
                ? 'Agora Keys Pending'
                : `RTC: ${agoraStatus}`}
            </span>
          </div>

          {isHost && (
            <div className="flex items-center gap-1.5">
              <button
                type="button"
                onClick={() => setHostControlsOpen(true)}
                className="px-3 py-1 rounded-full bg-purple-700/85 hover:bg-purple-600 border border-amber-400/50 text-[11px] font-bold text-white inline-flex items-center gap-1"
              >
                <Sliders className="w-3 h-3 text-amber-300" />
                <span>Controls</span>
              </button>
              <button
                type="button"
                onClick={() => setPkInviteOpen(true)}
                className="px-3 py-1 rounded-full mizo-gold-gradient text-[#1E0B3B] text-[11px] font-extrabold inline-flex items-center gap-1 shadow"
              >
                <Swords className="w-3 h-3" />
                <span>PK</span>
              </button>
            </div>
          )}
        </div>

        {/* PK Battle Split Stage */}
        {activePkOpponent && (
          <div className="relative z-20 space-y-2">
            <div className="mx-3 mt-2 grid grid-cols-2 gap-1.5 rounded-2xl overflow-hidden border border-amber-400/50 bg-black h-36">
              <div className="relative h-full bg-[#120726]">
                {isHost && mediaStatus === 'active' && hostControls.cameraOn ? (
                  <video
                    ref={pkHostVideoRef}
                    autoPlay
                    muted
                    playsInline
                    className="w-full h-full object-cover"
                  />
                ) : (
                  <SafeImage
                    src={stream.thumbnail}
                    alt={stream.username}
                    className="w-full h-full object-cover"
                  />
                )}
                <span className="absolute bottom-1.5 left-1.5 px-2 py-0.5 rounded bg-black/70 text-[10px] font-bold text-amber-300">
                  {stream.username}
                </span>
              </div>

              <div className="relative h-full bg-[#1C0728]">
                <SafeImage
                  src={activePkOpponent.avatar}
                  alt={activePkOpponent.username}
                  className="w-full h-full object-cover"
                />
                <span className="absolute bottom-1.5 right-1.5 px-2 py-0.5 rounded bg-black/70 text-[10px] font-bold text-fuchsia-300">
                  {activePkOpponent.username}
                </span>
              </div>
            </div>

            <PkBattleStage
              leftName={stream.username}
              leftAvatar={stream.avatar}
              leftLevel={stream.hostLevel}
              leftScore={pkLeftScore}
              rightHost={activePkOpponent}
              rightScore={pkRightScore}
              secondsLeft={pkSecondsLeft}
              contributions={pkContributions}
              winner={pkWinner}
              onBoostScore={(team) => {
                if (pkWinner) return;
                if (team === 'left') setPkLeftScore((s) => s + 50);
                else setPkRightScore((s) => s + 50);
              }}
              onEndPk={() => {
                if (!pkWinner) {
                  setPkWinner(
                    pkLeftScore > pkRightScore
                      ? 'left'
                      : pkRightScore > pkLeftScore
                      ? 'right'
                      : 'draw'
                  );
                } else {
                  setActivePkOpponent(null);
                }
              }}
            />
          </div>
        )}

        {/* Gift Animation Banner */}
        {activeGiftBanner && (
          <div className="relative z-20 mx-3 mt-2 rounded-2xl bg-gradient-to-r from-purple-900/90 via-fuchsia-800/85 to-amber-600/85 border border-amber-300 px-3.5 py-2 flex items-center gap-2.5 shadow-xl animate-mizo-float">
            <GiftArtIcon iconKey={activeGiftBanner.iconKey} size={34} />
            <div className="min-w-0">
              <p className="text-xs font-extrabold text-white truncate">
                {activeGiftBanner.senderName} sent {activeGiftBanner.giftName}!
              </p>
              <p className="text-[10px] text-amber-100">
                To {activeGiftBanner.recipientName}
              </p>
            </div>
          </div>
        )}

        {/* Floating Double-Tap Hearts */}
        <div className="pointer-events-none absolute inset-x-0 bottom-28 h-48 z-20 overflow-hidden">
          {floatingHearts.map((h) => (
            <div
              key={h.id}
              style={{ left: `${h.leftPct}%` }}
              className="absolute bottom-0 animate-bounce"
            >
              <Heart className="w-7 h-7 text-rose-500 fill-rose-500 drop-shadow-[0_0_12px_rgba(244,63,94,0.85)]" />
            </div>
          ))}
        </div>

        {/* Bottom Chat & Action Bar */}
        <div className="relative z-20 mt-auto p-3 pb-safe space-y-2.5">
          <div className="max-h-36 overflow-y-auto space-y-1.5 pr-1">
            {chatMessages.map((msg) => (
              <div
                key={msg.id}
                className="self-start max-w-[90%] rounded-xl bg-black/55 backdrop-blur-md px-2.5 py-1.5 text-xs border border-white/10 inline-flex items-center gap-1.5 flex-wrap"
              >
                <LevelBadge level={msg.level} size="xs" />
                {msg.vip && msg.vip > 0 && (
                  <span className="px-1.5 py-0.5 rounded bg-amber-400/20 text-amber-300 text-[9px] font-extrabold inline-flex items-center gap-0.5">
                    <Crown className="w-2.5 h-2.5" /> VIP{msg.vip}
                  </span>
                )}
                <span className="font-bold text-amber-300">{msg.user}:</span>
                <span className="text-slate-100">{msg.text}</span>
              </div>
            ))}
          </div>

          <div className="flex items-center gap-2">
            <form onSubmit={handleSendChat} className="flex-1 flex items-center gap-1.5">
              <input
                type="text"
                disabled={chatPaused}
                value={chatInput}
                onChange={(e) => setChatInput(e.target.value)}
                placeholder={chatPaused ? 'Chat paused by host' : 'Chat (double-tap live to like)...'}
                className="flex-1 h-11 px-3.5 rounded-full bg-black/60 backdrop-blur-md border border-purple-400/35 text-xs text-white placeholder:text-slate-400 focus:outline-none focus:border-amber-400 disabled:opacity-50"
              />
              <button
                type="submit"
                aria-label="Send chat message"
                className="w-10 h-10 rounded-full mizo-purple-gradient flex items-center justify-center text-white shrink-0"
              >
                <Send className="w-4 h-4" />
              </button>
            </form>

            <button
              type="button"
              onClick={() => setGiftPanelOpen(true)}
              aria-label="Open Gift Panel"
              className="w-11 h-11 rounded-full mizo-gold-gradient text-[#1E0B3B] flex items-center justify-center shadow-lg shadow-amber-500/30 shrink-0 active:scale-95 transition-transform"
            >
              <Gift className="w-5 h-5" />
            </button>

            <button
              type="button"
              onClick={() => {
                setShareToast(true);
                setTimeout(() => setShareToast(false), 1800);
              }}
              aria-label="Share live stream"
              className="w-10 h-10 rounded-full bg-black/60 border border-white/15 text-white flex items-center justify-center shrink-0"
            >
              <Share2 className="w-4 h-4" />
            </button>

            <button
              type="button"
              onClick={spawnFloatingHeart}
              aria-label="Send like"
              className="h-10 px-2.5 rounded-full bg-rose-600/90 text-white text-xs font-bold inline-flex items-center gap-1 shrink-0"
            >
              <Heart className="w-4 h-4 fill-white" />
              <span className="font-mono-num">{likesCount}</span>
            </button>
          </div>
        </div>

        {shareToast && (
          <div className="absolute top-16 left-1/2 -translate-x-1/2 z-40 px-4 py-1.5 rounded-full bg-black/85 border border-amber-400/50 text-xs font-semibold text-amber-200">
            Live stream invite link copied
          </div>
        )}

        {/* Live Gift Leaderboard & Gift Collection */}
        {leaderboardOpen && (
          <div className="absolute inset-x-0 bottom-0 z-40 rounded-t-3xl bg-[#0D061B]/95 backdrop-blur-2xl border-t border-amber-400/40 p-5 pb-safe space-y-3.5">
            <div className="flex items-center justify-between">
              <h3 className="text-sm font-display font-bold text-white inline-flex items-center gap-2">
                <Trophy className="w-4 h-4 text-amber-400" />
                <span>Live Gift Leaderboard</span>
              </h3>
              <button
                type="button"
                onClick={() => setLeaderboardOpen(false)}
                className="w-8 h-8 rounded-xl bg-white/5 flex items-center justify-center text-slate-300"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
            <div className="space-y-2">
              {leaderboard.map(([name, coins], idx) => (
                <div
                  key={name}
                  className="flex items-center justify-between p-2.5 rounded-xl bg-[#160B2C] border border-purple-500/20 text-xs"
                >
                  <div className="flex items-center gap-2">
                    <span className="w-5 h-5 rounded-full mizo-gold-gradient text-[#1E0B3B] font-extrabold text-[10px] flex items-center justify-center">
                      {idx + 1}
                    </span>
                    <span className="font-bold text-white">{name}</span>
                  </div>
                  <span className="font-mono-num font-bold text-amber-300 inline-flex items-center gap-1">
                    <GoldCoinIcon size={12} /> {coins.toLocaleString()}
                  </span>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Viewer Management, Moderators, Stats, Block & Report Sheet */}
        {roomInfoOpen && (
          <div className="absolute inset-x-0 bottom-0 z-40 rounded-t-3xl bg-[#0D061B]/95 backdrop-blur-2xl border-t border-purple-500/40 p-5 pb-safe space-y-4 max-h-[75%] overflow-y-auto">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Users className="w-4 h-4 text-amber-400" />
                <h3 className="text-sm font-display font-bold text-white">
                  Live Stats &amp; Viewer Management
                </h3>
              </div>
              <button
                type="button"
                onClick={() => setRoomInfoOpen(false)}
                className="min-w-[36px] min-h-[36px] rounded-xl flex items-center justify-center text-slate-300"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Live Statistics Summary */}
            <div className="grid grid-cols-3 gap-2 text-center text-xs">
              <div className="p-2 rounded-xl bg-[#160B2C] border border-purple-500/25">
                <p className="text-[10px] text-slate-400">Viewers</p>
                <p className="font-mono-num font-bold text-white">{stream.viewerDisplay}</p>
              </div>
              <div className="p-2 rounded-xl bg-[#160B2C] border border-purple-500/25">
                <p className="text-[10px] text-slate-400">Likes</p>
                <p className="font-mono-num font-bold text-rose-300">{likesCount}</p>
              </div>
              <div className="p-2 rounded-xl bg-[#160B2C] border border-purple-500/25">
                <p className="text-[10px] text-slate-400">Comments</p>
                <p className="font-mono-num font-bold text-amber-300">{chatMessages.length}</p>
              </div>
            </div>

            {isHost && (
              <div className="flex items-center justify-between p-2.5 rounded-xl bg-[#160B2C] border border-amber-400/30 text-xs">
                <span className="font-semibold text-white">Live Chat Moderation</span>
                <button
                  type="button"
                  onClick={() => setChatPaused((p) => !p)}
                  className={`px-3 py-1 rounded-lg font-bold ${
                    chatPaused ? 'bg-rose-600 text-white' : 'mizo-gold-gradient text-[#1E0B3B]'
                  }`}
                >
                  {chatPaused ? 'Resume Chat' : 'Pause Chat'}
                </button>
              </div>
            )}

            <div className="space-y-2">
              {participants.map((p) => (
                <div
                  key={p.id}
                  className="flex items-center justify-between p-2 rounded-xl bg-[#160B2C] border border-purple-500/20"
                >
                  <div className="flex items-center gap-2.5 min-w-0">
                    <SafeImage
                      src={p.avatar}
                      alt={p.name}
                      className="w-8 h-8 rounded-full object-cover shrink-0"
                    />
                    <div className="min-w-0">
                      <div className="flex items-center gap-1">
                        <span className="text-xs font-semibold text-white truncate">{p.name}</span>
                        <LevelBadge level={p.level} size="xs" />
                      </div>
                      <span className="text-[10px] text-amber-300">{p.role}</span>
                    </div>
                  </div>
                  <div className="flex items-center gap-1 shrink-0">
                    {isHost && (
                      <>
                        <button
                          type="button"
                          onClick={() =>
                            setParticipants((prev) =>
                              prev.map((x) =>
                                x.id === p.id
                                  ? { ...x, role: x.role === 'Moderator' ? 'Listener' : 'Moderator' }
                                  : x
                              )
                            )
                          }
                          aria-label={`Moderator toggle ${p.name}`}
                          className="w-7 h-7 rounded-lg bg-white/10 flex items-center justify-center text-amber-300"
                        >
                          <Shield className="w-3.5 h-3.5" />
                        </button>
                        <button
                          type="button"
                          onClick={() =>
                            setParticipants((prev) =>
                              prev.map((x) => (x.id === p.id ? { ...x, isMuted: !x.isMuted } : x))
                            )
                          }
                          aria-label={`Mute ${p.name}`}
                          className="w-7 h-7 rounded-lg bg-white/10 flex items-center justify-center text-purple-200"
                        >
                          <MicOff className="w-3.5 h-3.5" />
                        </button>
                        <button
                          type="button"
                          onClick={() => setParticipants((prev) => prev.filter((x) => x.id !== p.id))}
                          aria-label={`Kick ${p.name}`}
                          className="w-7 h-7 rounded-lg bg-rose-500/20 flex items-center justify-center text-rose-300"
                        >
                          <UserMinus className="w-3.5 h-3.5" />
                        </button>
                      </>
                    )}
                    <button
                      type="button"
                      onClick={() => onBlockUser?.(p.name, 'Blocked from live stream')}
                      aria-label={`Block ${p.name}`}
                      className="w-7 h-7 rounded-lg bg-white/5 flex items-center justify-center text-slate-300 hover:text-rose-300"
                    >
                      <Ban className="w-3.5 h-3.5" />
                    </button>
                    <button
                      type="button"
                      onClick={() =>
                        onReportTarget?.(p.name, 'user', 'Reported during live stream')
                      }
                      aria-label={`Report ${p.name}`}
                      className="w-7 h-7 rounded-lg bg-white/5 flex items-center justify-center text-slate-300 hover:text-amber-300"
                    >
                      <Flag className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Gift Panel */}
        <GiftPanel
          open={giftPanelOpen}
          coins={userCoins}
          recipientName={stream.username}
          giftHistory={giftHistory}
          onClose={() => setGiftPanelOpen(false)}
          onSendGift={handleGiftPurchase}
        />

        {/* Host Control Panel */}
        {isHost && (
          <HostControlPanel
            open={hostControlsOpen}
            controls={hostControls}
            onChange={setHostControls}
            onToggleFlash={handleToggleFlash}
            onClose={() => setHostControlsOpen(false)}
          />
        )}

        {/* PK Invitation Panel */}
        {isHost && (
          <PkInvitePanel
            open={pkInviteOpen}
            pendingOpponent={pendingPkOpponent}
            onClose={() => setPkInviteOpen(false)}
            onSendInvite={(opp) => setPendingPkOpponent(opp)}
            onSimulateResponse={handlePkInviteResponse}
          />
        )}

        {/* End Live Confirmation Dialog */}
        {isHost && endLiveDialogOpen && (
          <div
            className="absolute inset-0 z-50 bg-black/80 backdrop-blur-md flex items-center justify-center p-5"
            role="alertdialog"
            aria-modal="true"
            aria-labelledby="end-live-title"
          >
            <div className="w-full max-w-xs rounded-3xl mizo-royal-card p-5 text-center space-y-4 border border-amber-400/40">
              <h3 id="end-live-title" className="text-lg font-display font-bold text-white">
                End Live Stream?
              </h3>
              <p className="text-xs text-slate-300">
                Ending your broadcast will stop camera &amp; microphone tracks and disconnect viewers.
              </p>
              <div className="grid grid-cols-2 gap-2.5">
                <button
                  type="button"
                  onClick={() => setEndLiveDialogOpen(false)}
                  className="min-h-[44px] rounded-xl bg-white/10 hover:bg-white/15 text-xs font-bold text-white"
                >
                  Continue Live
                </button>
                <button
                  type="button"
                  onClick={handleConfirmEndLive}
                  className="min-h-[44px] rounded-xl bg-rose-600 hover:bg-rose-500 text-xs font-bold text-white"
                >
                  End Live
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

/* =========================================================
   LIVE SUMMARY SCREEN (AFTER HOST ENDS LIVE)
   ========================================================= */
interface LiveSummaryModalProps {
  summary: LiveSessionSummary | null;
  hostAvatar: string;
  hostName: string;
  onDone: () => void;
}

export const LiveSummaryModal: React.FC<LiveSummaryModalProps> = ({
  summary,
  hostAvatar,
  hostName,
  onDone,
}) => {
  if (!summary) return null;

  return (
    <div
      className="fixed inset-0 z-50 bg-black/90 backdrop-blur-md flex items-center justify-center p-4"
      role="dialog"
      aria-modal="true"
      aria-label="Live Broadcast Summary"
    >
      <div className="w-full max-w-sm rounded-3xl mizo-royal-card p-6 text-center space-y-5 border border-amber-400/45 shadow-[0_0_50px_rgba(147,51,234,0.45)]">
        <div className="w-20 h-20 mx-auto rounded-full p-0.5 mizo-gold-gradient">
          <SafeImage
            src={hostAvatar}
            alt={hostName}
            className="w-full h-full rounded-full object-cover"
          />
        </div>

        <div>
          <span className="inline-flex items-center gap-1 text-xs font-bold text-amber-300">
            <Trophy className="w-3.5 h-3.5" /> Live Broadcast Ended
          </span>
          <h2 className="text-xl font-display font-extrabold text-white mt-1">
            {summary.title}
          </h2>
          <p className="text-xs text-slate-400 mt-0.5">Session Summary</p>
        </div>

        <div className="grid grid-cols-2 gap-3 text-left">
          <div className="rounded-2xl bg-[#160B2C] border border-purple-500/25 p-3">
            <p className="text-[11px] text-slate-400">Live Duration</p>
            <p className="text-base font-mono-num font-bold text-white mt-0.5">
              {summary.durationDisplay}
            </p>
          </div>
          <div className="rounded-2xl bg-[#160B2C] border border-purple-500/25 p-3">
            <p className="text-[11px] text-slate-400">Total Viewers</p>
            <p className="text-base font-mono-num font-bold text-white mt-0.5">
              {summary.totalViewers.toLocaleString()}
            </p>
          </div>
          <div className="rounded-2xl bg-[#160B2C] border border-purple-500/25 p-3">
            <p className="text-[11px] text-slate-400">Peak Viewers</p>
            <p className="text-base font-mono-num font-bold text-amber-300 mt-0.5">
              {summary.peakViewers.toLocaleString()}
            </p>
          </div>
          <div className="rounded-2xl bg-[#160B2C] border border-purple-500/25 p-3">
            <p className="text-[11px] text-slate-400">Total Likes</p>
            <p className="text-base font-mono-num font-bold text-rose-300 mt-0.5">
              {summary.totalLikes.toLocaleString()}
            </p>
          </div>
          <div className="rounded-2xl bg-[#160B2C] border border-purple-500/25 p-3">
            <p className="text-[11px] text-slate-400">Gifts Received</p>
            <p className="text-base font-mono-num font-bold text-amber-300 mt-0.5 inline-flex items-center gap-1">
              <GoldCoinIcon size={14} />
              {summary.giftsReceivedCoins.toLocaleString()}
            </p>
          </div>
          <div className="rounded-2xl bg-[#160B2C] border border-purple-500/25 p-3">
            <p className="text-[11px] text-slate-400">New Followers</p>
            <p className="text-base font-mono-num font-bold text-emerald-300 mt-0.5">
              +{summary.newFollowers}
            </p>
          </div>
        </div>

        <button
          type="button"
          onClick={onDone}
          className="w-full min-h-[46px] rounded-2xl mizo-gold-gradient text-[#1E0B3B] text-sm font-extrabold shadow-lg"
        >
          Back to Mizo Live
        </button>
      </div>
    </div>
  );
};
