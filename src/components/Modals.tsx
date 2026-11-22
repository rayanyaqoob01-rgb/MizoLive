import React, { useEffect, useState } from 'react';
import {
  Check,
  ChevronRight,
  Clapperboard,
  Gift,
  Home as HomeIcon,
  Info,
  Lock,
  LogOut,
  Mic,
  MicOff,
  Minimize2,
  Play,
  Plus,
  Radio,
  Send,
  Settings,
  Share2,
  Shield,
  Unlock,
  UserMinus,
  UserPlus,
  Users,
  Video,
  VideoOff,
  X,
} from 'lucide-react';
import { INITIAL_ACTIVE_USERS, SAMPLE_ROOM_PARTICIPANTS } from '../data/mizoData';
import { agoraService, AgoraStatus } from '../services/agoraService';
import {
  GiftHistoryRecord,
  GiftItem,
  RoomItem,
  RoomParticipant,
  RoomSeatItem,
  RoomSeatLayout,
  StoreItem,
  UserVideo,
} from '../types/mizo';
import { GoldCoinIcon, SafeImage } from './Cards';
import { GiftArtIcon, GiftPanel } from './GiftPanel';
import { LevelBadge } from './LevelBadge';
import { CrownOrnament, EntryShowcaseArt, ProfileFrameOverlay } from './MizoLogo';
import { UserInfoTarget } from './UserInfoModal';

/* =========================================================
   1. CENTRAL CREATE ACTION MENU (STRICTLY 3 OPTIONS)
   ========================================================= */
interface CreateActionMenuProps {
  open: boolean;
  onClose: () => void;
  onSelectUploadVideo: () => void;
  onSelectGoLive: () => void;
  onSelectCreateRoom: () => void;
}

export const CreateActionMenu: React.FC<CreateActionMenuProps> = ({
  open,
  onClose,
  onSelectUploadVideo,
  onSelectGoLive,
  onSelectCreateRoom,
}) => {
  if (!open) return null;

  return (
    <div
      className="fixed inset-0 z-50 flex items-end md:items-center justify-center bg-black/80 backdrop-blur-md p-4"
      role="dialog"
      aria-modal="true"
      aria-label="Create on Mizo Live"
    >
      <div className="w-full max-w-md rounded-3xl bg-gradient-to-b from-[#170B2E] via-[#0E061D] to-[#06040B] border border-purple-500/35 p-5 shadow-[0_0_50px_rgba(147,51,234,0.35)] relative">
        <div className="flex items-center justify-between mb-5">
          <span className="text-sm font-semibold text-purple-200/80">
            Create on Mizo Live
          </span>
          <button
            type="button"
            onClick={onClose}
            aria-label="Close create menu"
            className="min-w-[44px] min-h-[44px] -mr-2 flex items-center justify-center rounded-xl text-slate-200 hover:text-white hover:bg-white/10 transition-colors"
          >
            <X className="w-6 h-6" />
          </button>
        </div>

        {/* Strictly Three Options */}
        <div className="flex flex-col gap-3.5">
          <button
            type="button"
            onClick={onSelectUploadVideo}
            className="w-full min-h-[76px] px-4 py-3.5 rounded-2xl bg-gradient-to-r from-[#5B21B6] via-[#7C3AED] to-[#9333EA] border border-purple-300/40 shadow-lg shadow-purple-900/50 flex items-center justify-between gap-3 text-left hover:brightness-110 active:scale-[0.98] transition-all"
          >
            <div className="flex items-center gap-3.5">
              <div className="w-12 h-12 rounded-xl bg-white/15 border border-white/25 flex items-center justify-center shrink-0">
                <Clapperboard className="w-6 h-6 text-white" />
              </div>
              <div>
                <div className="text-base font-display font-bold text-white">
                  Upload Video
                </div>
                <div className="text-xs text-purple-100/85">
                  Share Your Video
                </div>
              </div>
            </div>
            <ChevronRight className="w-5 h-5 text-white/90 shrink-0" />
          </button>

          <button
            type="button"
            onClick={onSelectGoLive}
            className="w-full min-h-[76px] px-4 py-3.5 rounded-2xl mizo-gold-gradient border border-yellow-200/70 shadow-lg shadow-amber-500/25 flex items-center justify-between gap-3 text-left hover:brightness-105 active:scale-[0.98] transition-all"
          >
            <div className="flex items-center gap-3.5">
              <div className="w-12 h-12 rounded-xl bg-black/15 border border-black/15 flex items-center justify-center shrink-0">
                <Radio className="w-6 h-6 text-[#1E0B3B]" />
              </div>
              <div>
                <div className="text-base font-display font-bold text-[#1E0B3B]">
                  Go Live
                </div>
                <div className="text-xs font-medium text-[#3B176E]">
                  Start Live Stream
                </div>
              </div>
            </div>
            <ChevronRight className="w-5 h-5 text-[#1E0B3B] shrink-0" />
          </button>

          <button
            type="button"
            onClick={onSelectCreateRoom}
            className="w-full min-h-[76px] px-4 py-3.5 rounded-2xl bg-gradient-to-r from-[#6D28D9] via-[#A21CAF] to-[#7E22CE] border border-fuchsia-300/40 shadow-lg shadow-fuchsia-900/40 flex items-center justify-between gap-3 text-left hover:brightness-110 active:scale-[0.98] transition-all"
          >
            <div className="flex items-center gap-3.5">
              <div className="w-12 h-12 rounded-xl bg-white/15 border border-white/25 flex items-center justify-center shrink-0">
                <HomeIcon className="w-6 h-6 text-white" />
              </div>
              <div>
                <div className="text-base font-display font-bold text-white">
                  Create Room
                </div>
                <div className="text-xs text-purple-100/85">
                  Start Your Room
                </div>
              </div>
            </div>
            <ChevronRight className="w-5 h-5 text-white/90 shrink-0" />
          </button>
        </div>

        <div className="mt-6">
          <CrownOrnament />
        </div>
      </div>
    </div>
  );
};

/* =========================================================
   2. ROOM LOUNGE MODAL WITH 4/6/9/12 SEATS, AGORA RTC, MODERATORS & HOST CONTROLS
   ========================================================= */
interface RoomLoungeModalProps {
  room: RoomItem | null;
  minimized: boolean;
  userAvatar: string;
  username: string;
  userLevel: number;
  userCoins: number;
  onMinimize: () => void;
  onLeaveRoom: () => void;
  onEndParty: (roomId: string) => void;
  onUpdateRoom: (roomId: string, updates: Partial<RoomItem>) => void;
  onSendGift: (gift: GiftItem, recipient: string) => Promise<boolean>;
  onOpenUserInfo: (user: UserInfoTarget) => void;
  onAddActivityXp: (amount: number) => void;
}

function buildInitialSeats(
  capacity: RoomSeatLayout,
  room: RoomItem,
  username: string,
  userAvatar: string,
  userLevel: number,
  isHost: boolean,
  participants: RoomParticipant[]
): RoomSeatItem[] {
  const seats: RoomSeatItem[] = [];
  for (let i = 0; i < capacity; i++) {
    if (i === 0) {
      seats.push({
        seatIndex: 0,
        occupantId: 'host',
        occupantName: room.hostName,
        occupantAvatar: room.hostAvatar,
        occupantLevel: room.hostLevel,
        isHostSeat: true,
        isMuted: false,
        isLocked: false,
        hasVideo: true,
      });
    } else if (i === 1 && !isHost) {
      seats.push({
        seatIndex: 1,
        occupantId: 'you',
        occupantName: `${username} (You)`,
        occupantAvatar: userAvatar,
        occupantLevel: userLevel,
        isMuted: true,
        isLocked: false,
        hasVideo: false,
      });
    } else {
      const candidate = participants[i - (isHost ? 1 : 2)];
      if (candidate && candidate.role !== 'Listener') {
        seats.push({
          seatIndex: i,
          occupantId: candidate.id,
          occupantName: candidate.name,
          occupantAvatar: candidate.avatar,
          occupantLevel: candidate.level,
          isMuted: Boolean(candidate.isMuted),
          isLocked: false,
        });
      } else {
        seats.push({
          seatIndex: i,
          occupantId: null,
          occupantName: null,
          occupantAvatar: null,
          occupantLevel: 1,
          isMuted: false,
          isLocked: false,
        });
      }
    }
  }
  return seats;
}

export const RoomLoungeModal: React.FC<RoomLoungeModalProps> = ({
  room,
  minimized,
  userAvatar,
  username,
  userLevel,
  userCoins,
  onMinimize,
  onLeaveRoom,
  onEndParty,
  onUpdateRoom,
  onSendGift,
  onOpenUserInfo,
  onAddActivityXp,
}) => {
  const [muted, setMuted] = useState(true);
  const [videoOn, setVideoOn] = useState(false);
  const [msgInput, setMsgInput] = useState('');
  const [messages, setMessages] = useState<
    Array<{ id: string; sender: string; level: number; text: string }>
  >([
    {
      id: 'r1',
      sender: 'Host',
      level: 64,
      text: 'Welcome to the room! Grab a seat and say hello.',
    },
  ]);

  const [participants, setParticipants] = useState<RoomParticipant[]>(SAMPLE_ROOM_PARTICIPANTS);
  const [seatLayout, setSeatLayout] = useState<RoomSeatLayout>(room?.seatCapacity || 6);
  const [seats, setSeats] = useState<RoomSeatItem[]>([]);
  const [selectedSeat, setSelectedSeat] = useState<RoomSeatItem | null>(null);
  const [pendingSeatRequest, setPendingSeatRequest] = useState<{
    name: string;
    avatar: string;
    level: number;
    seatIndex: number;
  } | null>(null);

  const [participantsOpen, setParticipantsOpen] = useState(false);
  const [giftPanelOpen, setGiftPanelOpen] = useState(false);
  const [giftRecipient, setGiftRecipient] = useState('');
  const [giftHistory, setGiftHistory] = useState<GiftHistoryRecord[]>([]);
  const [giftBanner, setGiftBanner] = useState<GiftHistoryRecord | null>(null);

  // Agora Room RTC Connection State
  const [agoraStatus, setAgoraStatus] = useState<AgoraStatus>('idle');
  const [agoraDetail, setAgoraDetail] = useState<string>('Connecting room audio...');

  // Room Info, Settings, Invitations & Share
  const [roomInfoOpen, setRoomInfoOpen] = useState(false);
  const [settingsOpen, setSettingsOpen] = useState(false);
  const [inviteOpen, setInviteOpen] = useState(false);
  const [invitedIds, setInvitedIds] = useState<string[]>([]);
  const [shareToast, setShareToast] = useState(false);

  const [editName, setEditName] = useState('');
  const [editDesc, setEditDesc] = useState('');
  const [editType, setEditType] = useState<RoomItem['roomType']>('Public');
  const [editSeats, setEditSeats] = useState<RoomSeatLayout>(6);

  // Role-gated exit dialogs
  const [leaveDialogOpen, setLeaveDialogOpen] = useState(false);
  const [endPartyDialogOpen, setEndPartyDialogOpen] = useState(false);

  // Initialize Seats when Room or Layout changes
  useEffect(() => {
    if (!room) return;
    const cap = room.seatCapacity || 6;
    setSeatLayout(cap);
    setSeats(
      buildInitialSeats(
        cap,
        room,
        username,
        userAvatar,
        userLevel,
        Boolean(room.isUserHost),
        participants
      )
    );
  }, [room?.id, room?.seatCapacity]);

  // Connect / Cleanup Agora Room Session
  useEffect(() => {
    if (!room) return;
    const sessionId = `room-${room.id}`;
    agoraService.startSession({
      sessionId,
      kind: 'room',
      channelName: `mizo_room_${room.id}`,
      role: room.isUserHost || !muted ? 'host' : 'audience',
      enableAudio: !muted,
      enableVideo: videoOn,
      events: {
        onStatusChange: (status, detail) => {
          setAgoraStatus(status);
          setAgoraDetail(detail);
        },
      },
    });

    return () => {
      agoraService.leaveSession(sessionId);
    };
  }, [room?.id]);

  if (!room || minimized) return null;

  const isHost = Boolean(room.isUserHost);
  const activeRecipient = giftRecipient || room.hostName;

  const fullParticipantsList: RoomParticipant[] = [
    {
      id: 'host',
      name: room.hostName,
      avatar: room.hostAvatar,
      level: room.hostLevel,
      role: 'Host',
    },
    {
      id: 'you',
      name: username,
      avatar: userAvatar,
      level: userLevel,
      role: isHost ? 'Host' : 'Speaker',
      isMuted: muted,
      canSpeak: true,
      canVideo: videoOn,
    },
    ...participants,
  ];

  const handleToggleMic = async () => {
    const nextMuted = !muted;
    setMuted(nextMuted);
    await agoraService.setMicEnabled(`room-${room.id}`, !nextMuted);
    setSeats((prev) =>
      prev.map((s) => (s.occupantId === 'you' || (isHost && s.isHostSeat) ? { ...s, isMuted: nextMuted } : s))
    );
  };

  const handleToggleVideo = async () => {
    const nextVideo = !videoOn;
    setVideoOn(nextVideo);
    await agoraService.setCameraEnabled(`room-${room.id}`, nextVideo);
    setSeats((prev) =>
      prev.map((s) => (s.occupantId === 'you' || (isHost && s.isHostSeat) ? { ...s, hasVideo: nextVideo } : s))
    );
  };

  const handleSeatAction = (action: 'take' | 'leave' | 'mute' | 'remove' | 'lock' | 'invite') => {
    if (!selectedSeat) return;
    const idx = selectedSeat.seatIndex;
    if (action === 'take') {
      setSeats((prev) =>
        prev.map((s) =>
          s.seatIndex === idx
            ? {
                ...s,
                occupantId: 'you',
                occupantName: `${username} (You)`,
                occupantAvatar: userAvatar,
                occupantLevel: userLevel,
                isMuted: muted,
              }
            : s
        )
      );
    } else if (action === 'leave' || action === 'remove') {
      setSeats((prev) =>
        prev.map((s) =>
          s.seatIndex === idx
            ? {
                ...s,
                occupantId: null,
                occupantName: null,
                occupantAvatar: null,
                isMuted: false,
              }
            : s
        )
      );
    } else if (action === 'mute') {
      setSeats((prev) =>
        prev.map((s) => (s.seatIndex === idx ? { ...s, isMuted: !s.isMuted } : s))
      );
    } else if (action === 'lock') {
      setSeats((prev) =>
        prev.map((s) => (s.seatIndex === idx ? { ...s, isLocked: !s.isLocked } : s))
      );
    } else if (action === 'invite') {
      const guest = INITIAL_ACTIVE_USERS[idx % INITIAL_ACTIVE_USERS.length];
      setPendingSeatRequest({
        name: guest.name,
        avatar: guest.avatar,
        level: guest.level,
        seatIndex: idx,
      });
    }
    setSelectedSeat(null);
  };

  const handleAcceptSeatInvite = (accepted: boolean) => {
    if (!pendingSeatRequest) return;
    if (accepted) {
      setSeats((prev) =>
        prev.map((s) =>
          s.seatIndex === pendingSeatRequest.seatIndex
            ? {
                ...s,
                occupantId: `guest-${pendingSeatRequest.seatIndex}`,
                occupantName: pendingSeatRequest.name,
                occupantAvatar: pendingSeatRequest.avatar,
                occupantLevel: pendingSeatRequest.level,
                isMuted: false,
              }
            : s
        )
      );
    }
    setPendingSeatRequest(null);
  };

  const handleSend = (e: React.FormEvent) => {
    e.preventDefault();
    if (!msgInput.trim()) return;
    setMessages((prev) => [
      ...prev,
      { id: `rm-${Date.now()}`, sender: username, level: userLevel, text: msgInput.trim() },
    ]);
    setMsgInput('');
    onAddActivityXp(15);
  };

  const handleRoomGift = async (gift: GiftItem, recipient: string) => {
    const ok = await onSendGift(gift, recipient);
    if (!ok) return false;
    const rec: GiftHistoryRecord = {
      id: `rg-${Date.now()}`,
      senderName: username,
      senderLevel: userLevel,
      recipientName: recipient,
      giftName: gift.name,
      giftPrice: gift.price,
      iconKey: gift.iconKey,
      timestamp: 'Just now',
    };
    setGiftHistory((prev) => [rec, ...prev]);
    setGiftBanner(rec);
    setTimeout(() => {
      setGiftBanner((curr) => (curr?.id === rec.id ? null : curr));
    }, 2800);
    return true;
  };

  const handleExitPress = () => {
    if (isHost) {
      setEndPartyDialogOpen(true);
    } else {
      setLeaveDialogOpen(true);
    }
  };

  const openRoomSettings = () => {
    setEditName(room.name);
    setEditDesc(room.description);
    setEditType(room.roomType);
    setEditSeats(seatLayout);
    setSettingsOpen(true);
  };

  const handleSaveRoomSettings = (e: React.FormEvent) => {
    e.preventDefault();
    if (!editName.trim()) return;
    setSeatLayout(editSeats);
    setSeats(
      buildInitialSeats(
        editSeats,
        room,
        username,
        userAvatar,
        userLevel,
        isHost,
        participants
      )
    );
    onUpdateRoom(room.id, {
      name: editName.trim(),
      description: editDesc.trim() || room.description,
      roomType: editType,
      seatCapacity: editSeats,
    });
    setSettingsOpen(false);
  };

  const toggleParticipantMute = (id: string) => {
    setParticipants((prev) =>
      prev.map((p) => (p.id === id ? { ...p, isMuted: !p.isMuted } : p))
    );
  };

  const toggleModeratorRole = (id: string) => {
    setParticipants((prev) =>
      prev.map((p) =>
        p.id === id
          ? { ...p, role: p.role === 'Moderator' ? 'Speaker' : 'Moderator' }
          : p
      )
    );
  };

  const removeParticipant = (id: string) => {
    setParticipants((prev) => prev.filter((p) => p.id !== id));
    setSeats((prev) =>
      prev.map((s) =>
        s.occupantId === id
          ? { ...s, occupantId: null, occupantName: null, occupantAvatar: null }
          : s
      )
    );
  };

  const seatGridColsClass = seatLayout === 4 ? 'grid-cols-4' : seatLayout === 6 ? 'grid-cols-3' : 'grid-cols-4';

  return (
    <div
      className="fixed inset-0 z-50 bg-black/85 backdrop-blur-md flex items-center justify-center p-0 sm:p-4"
      role="dialog"
      aria-modal="true"
      aria-label={`${room.name} lounge`}
    >
      <div className="relative w-full h-full sm:h-[90vh] sm:max-w-md sm:rounded-3xl overflow-hidden bg-[#0D061B] border border-purple-500/35 flex flex-col">
        {/* Room Cover Header */}
        <div className="relative h-36 shrink-0">
          <SafeImage src={room.coverImage} alt={room.name} className="w-full h-full object-cover" />
          <div className="absolute inset-0 bg-gradient-to-b from-black/80 via-black/40 to-[#0D061B]" />
          <div className="absolute top-3 inset-x-3.5 flex items-start justify-between pt-safe gap-2">
            <div className="min-w-0">
              <div className="flex items-center gap-1.5 flex-wrap">
                <h2 className="text-base font-display font-bold text-white truncate">{room.name}</h2>
                <span className="px-2 py-0.5 rounded-full bg-purple-700/80 border border-purple-300/35 text-[10px] font-bold text-white shrink-0">
                  {room.roomType} · {seatLayout} Seats
                </span>
                {isHost && (
                  <span className="px-2 py-0.5 rounded-full mizo-gold-gradient text-[#1E0B3B] text-[10px] font-extrabold shrink-0">
                    HOST
                  </span>
                )}
              </div>
              <button
                type="button"
                onClick={() => setParticipantsOpen(true)}
                className="text-xs text-amber-300 font-mono-num inline-flex items-center gap-1 hover:underline mt-0.5"
              >
                <Users className="w-3.5 h-3.5" /> {room.participantDisplay} · Manage Seats &amp; Mods
              </button>
              <p className="text-[10px] text-purple-200/90 mt-0.5 truncate" title={agoraDetail}>
                Agora RTC: {agoraStatus === 'connected' ? 'Connected' : agoraStatus === 'credentials_required' ? 'Server Agora Keys Needed' : agoraStatus}
              </p>
            </div>

            <div className="flex items-center gap-1 shrink-0">
              <button
                type="button"
                onClick={() => setInviteOpen(true)}
                aria-label="Invite users to room"
                className="w-8 h-8 rounded-xl bg-black/55 border border-white/15 flex items-center justify-center text-amber-300 hover:border-amber-400"
              >
                <UserPlus className="w-4 h-4" />
              </button>
              <button
                type="button"
                onClick={() => {
                  setShareToast(true);
                  setTimeout(() => setShareToast(false), 1800);
                }}
                aria-label="Share room"
                className="w-8 h-8 rounded-xl bg-black/55 border border-white/15 flex items-center justify-center text-white hover:border-amber-400"
              >
                <Share2 className="w-4 h-4" />
              </button>
              <button
                type="button"
                onClick={() => setRoomInfoOpen(true)}
                aria-label="Room info"
                className="w-8 h-8 rounded-xl bg-black/55 border border-white/15 flex items-center justify-center text-white hover:border-amber-400"
              >
                <Info className="w-4 h-4" />
              </button>
              {isHost && (
                <button
                  type="button"
                  onClick={openRoomSettings}
                  aria-label="Room settings"
                  className="w-8 h-8 rounded-xl bg-black/55 border border-amber-400/40 flex items-center justify-center text-amber-300"
                >
                  <Settings className="w-4 h-4" />
                </button>
              )}
              <button
                type="button"
                onClick={handleExitPress}
                aria-label={isHost ? 'End This Party' : 'Leave or Minimize Room'}
                className="w-8 h-8 rounded-xl bg-black/55 border border-white/15 flex items-center justify-center text-white hover:bg-rose-600/80"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
          </div>
        </div>

        {/* Host Layout Switcher Bar */}
        {isHost && (
          <div className="px-3 pb-2 flex items-center justify-between gap-2 text-[10px]">
            <span className="text-slate-400 font-semibold">Seat Layout:</span>
            <div className="flex items-center gap-1">
              {([4, 6, 9, 12] as const).map((cap) => (
                <button
                  key={cap}
                  type="button"
                  onClick={() => {
                    setSeatLayout(cap);
                    setSeats(
                      buildInitialSeats(
                        cap,
                        room,
                        username,
                        userAvatar,
                        userLevel,
                        isHost,
                        participants
                      )
                    );
                    onUpdateRoom(room.id, { seatCapacity: cap });
                  }}
                  className={`px-2 py-0.5 rounded-lg font-bold ${
                    seatLayout === cap
                      ? 'mizo-gold-gradient text-[#1E0B3B]'
                      : 'bg-white/10 text-slate-300'
                  }`}
                >
                  {cap}
                </button>
              ))}
            </div>
          </div>
        )}

        {shareToast && (
          <div className="mx-3 mb-2 rounded-xl bg-purple-900/90 border border-amber-400/50 px-3 py-1.5 text-center text-xs font-semibold text-amber-200">
            Room invite link copied!
          </div>
        )}

        {pendingSeatRequest && (
          <div className="mx-3 mb-2 rounded-xl bg-[#1A0D36] border border-amber-400/60 px-3 py-2 flex items-center justify-between gap-2 text-xs">
            <span className="text-white truncate">
              Invite <b className="text-amber-300">{pendingSeatRequest.name}</b> to Seat #{pendingSeatRequest.seatIndex + 1}?
            </span>
            <div className="flex items-center gap-1.5 shrink-0">
              <button
                type="button"
                onClick={() => handleAcceptSeatInvite(false)}
                className="px-2 py-1 rounded-lg bg-white/10 text-slate-200 font-bold"
              >
                Decline
              </button>
              <button
                type="button"
                onClick={() => handleAcceptSeatInvite(true)}
                className="px-2 py-1 rounded-lg mizo-gold-gradient text-[#1E0B3B] font-extrabold inline-flex items-center gap-0.5"
              >
                <Check className="w-3 h-3" /> Accept
              </button>
            </div>
          </div>
        )}

        {/* Gift Animation Banner */}
        {giftBanner && (
          <div className="mx-3 mb-2 rounded-2xl bg-gradient-to-r from-purple-900/90 via-fuchsia-800/85 to-amber-600/85 border border-amber-300 px-3.5 py-2 flex items-center gap-2.5 shadow-lg animate-mizo-float">
            <GiftArtIcon iconKey={giftBanner.iconKey} size={32} />
            <div className="min-w-0">
              <p className="text-xs font-extrabold text-white truncate">
                {giftBanner.senderName} sent {giftBanner.giftName}
              </p>
              <p className="text-[10px] text-amber-100">
                To {giftBanner.recipientName}
              </p>
            </div>
          </div>
        )}

        {/* Interactive 4 / 6 / 9 / 12 Audio/Video Seats Grid */}
        <div
          className={`px-3 py-2.5 grid ${seatGridColsClass} gap-2.5 border-b border-purple-500/20 max-h-56 overflow-y-auto`}
        >
          {seats.map((seat) => (
            <button
              key={seat.seatIndex}
              type="button"
              onClick={() => setSelectedSeat(seat)}
              className="flex flex-col items-center gap-1 group"
            >
              {seat.occupantName && seat.occupantAvatar ? (
                <div
                  className={`relative w-12 h-12 rounded-full p-0.5 ${
                    seat.isHostSeat
                      ? 'mizo-gold-gradient'
                      : 'bg-purple-500/70 border border-purple-300/40'
                  }`}
                >
                  <SafeImage
                    src={seat.occupantAvatar}
                    alt={seat.occupantName}
                    className="w-full h-full rounded-full object-cover"
                  />
                  {seat.isMuted && (
                    <span className="absolute -bottom-0.5 -right-0.5 w-4 h-4 rounded-full bg-rose-600 flex items-center justify-center">
                      <MicOff className="w-2.5 h-2.5 text-white" />
                    </span>
                  )}
                </div>
              ) : (
                <div className="w-12 h-12 rounded-full bg-[#170D2E] border border-dashed border-purple-400/40 group-hover:border-amber-400 flex items-center justify-center text-purple-300">
                  {seat.isLocked ? (
                    <Lock className="w-4 h-4 text-rose-400" />
                  ) : (
                    <Plus className="w-4 h-4" />
                  )}
                </div>
              )}
              <span className="text-[10px] text-slate-200 truncate max-w-full">
                {seat.occupantName || (seat.isLocked ? 'Locked' : `Seat ${seat.seatIndex + 1}`)}
              </span>
            </button>
          ))}
        </div>

        {/* Room Chat with Level Badges */}
        <div className="flex-1 overflow-y-auto p-3.5 flex flex-col gap-2">
          <p className="text-xs text-slate-400 mb-1">{room.description}</p>
          {messages.map((m) => (
            <div
              key={m.id}
              className="rounded-xl bg-[#180E30] border border-purple-500/20 px-3 py-2 text-xs inline-flex items-center gap-1.5 flex-wrap"
            >
              <LevelBadge level={m.level} size="xs" />
              <span className="font-bold text-amber-300">{m.sender}:</span>
              <span className="text-slate-100">{m.text}</span>
            </div>
          ))}
        </div>

        {/* Footer Controls: Mic, Video, Chat, Gift */}
        <div className="p-3 pb-safe border-t border-purple-500/20 flex items-center gap-1.5 bg-[#0A0515]">
          <button
            type="button"
            onClick={handleToggleMic}
            aria-label={muted ? 'Unmute mic' : 'Mute mic'}
            className={`w-9 h-9 rounded-full flex items-center justify-center border shrink-0 transition-colors ${
              muted
                ? 'bg-white/5 border-white/15 text-slate-300'
                : 'bg-purple-600 border-amber-400 text-white'
            }`}
          >
            {muted ? <MicOff className="w-4 h-4" /> : <Mic className="w-4 h-4" />}
          </button>

          <button
            type="button"
            onClick={handleToggleVideo}
            aria-label={videoOn ? 'Turn seat video off' : 'Turn seat video on'}
            className={`w-9 h-9 rounded-full flex items-center justify-center border shrink-0 transition-colors ${
              videoOn
                ? 'bg-purple-600 border-amber-400 text-white'
                : 'bg-white/5 border-white/15 text-slate-300'
            }`}
          >
            {videoOn ? <Video className="w-4 h-4" /> : <VideoOff className="w-4 h-4" />}
          </button>

          <form onSubmit={handleSend} className="flex-1 flex items-center gap-1.5">
            <input
              type="text"
              value={msgInput}
              onChange={(e) => setMsgInput(e.target.value)}
              placeholder="Send room message..."
              className="flex-1 h-9 px-3 rounded-full bg-[#150C29] border border-purple-500/30 text-xs text-white placeholder:text-slate-400 focus:outline-none focus:border-amber-400"
            />
            <button
              type="submit"
              aria-label="Send room message"
              className="w-9 h-9 rounded-full mizo-purple-gradient text-white flex items-center justify-center shrink-0"
            >
              <Send className="w-4 h-4" />
            </button>
          </form>

          <button
            type="button"
            onClick={() => setGiftPanelOpen(true)}
            aria-label="Send Room Gift"
            className="w-9 h-9 rounded-full mizo-gold-gradient text-[#1E0B3B] flex items-center justify-center shrink-0 shadow-md"
          >
            <Gift className="w-4 h-4" />
          </button>
        </div>

        {/* Seat Management Sheet */}
        {selectedSeat && (
          <div className="absolute inset-0 z-40 bg-black/75 backdrop-blur-sm flex items-end sm:items-center justify-center p-4">
            <div className="w-full max-w-xs rounded-3xl mizo-royal-card border border-amber-400/50 p-4 space-y-3">
              <div className="flex items-center justify-between">
                <h4 className="text-sm font-display font-bold text-white">
                  Seat #{selectedSeat.seatIndex + 1}{' '}
                  {selectedSeat.occupantName ? `· ${selectedSeat.occupantName}` : '(Empty)'}
                </h4>
                <button
                  type="button"
                  onClick={() => setSelectedSeat(null)}
                  className="w-7 h-7 rounded-lg bg-white/10 flex items-center justify-center text-slate-300"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>
              <div className="grid grid-cols-2 gap-2 text-xs font-bold">
                {!selectedSeat.occupantName && !selectedSeat.isLocked && (
                  <button
                    type="button"
                    onClick={() => handleSeatAction('take')}
                    className="min-h-[38px] rounded-xl mizo-gold-gradient text-[#1E0B3B]"
                  >
                    Take Seat
                  </button>
                )}
                {isHost && !selectedSeat.occupantName && (
                  <button
                    type="button"
                    onClick={() => handleSeatAction('invite')}
                    className="min-h-[38px] rounded-xl mizo-purple-gradient text-white"
                  >
                    Invite to Seat
                  </button>
                )}
                {isHost && selectedSeat.occupantName && !selectedSeat.isHostSeat && (
                  <>
                    <button
                      type="button"
                      onClick={() => handleSeatAction('mute')}
                      className="min-h-[38px] rounded-xl bg-white/10 text-amber-300"
                    >
                      {selectedSeat.isMuted ? 'Unmute Seat' : 'Mute Seat'}
                    </button>
                    <button
                      type="button"
                      onClick={() => handleSeatAction('remove')}
                      className="min-h-[38px] rounded-xl bg-rose-600/80 text-white"
                    >
                      Remove
                    </button>
                  </>
                )}
                {selectedSeat.occupantId === 'you' && (
                  <button
                    type="button"
                    onClick={() => handleSeatAction('leave')}
                    className="min-h-[38px] rounded-xl bg-rose-600/80 text-white"
                  >
                    Step Down
                  </button>
                )}
                {isHost && !selectedSeat.isHostSeat && (
                  <button
                    type="button"
                    onClick={() => handleSeatAction('lock')}
                    className="min-h-[38px] rounded-xl bg-[#160B2C] border border-purple-500/35 text-slate-200 inline-flex items-center justify-center gap-1"
                  >
                    {selectedSeat.isLocked ? (
                      <>
                        <Unlock className="w-3.5 h-3.5" /> Unlock
                      </>
                    ) : (
                      <>
                        <Lock className="w-3.5 h-3.5" /> Lock Seat
                      </>
                    )}
                  </button>
                )}
              </div>
            </div>
          </div>
        )}

        {/* Participant List, Moderators & Host Permission Management Drawer */}
        {participantsOpen && (
          <div className="absolute inset-x-0 bottom-0 z-30 h-[66%] rounded-t-3xl bg-[#0D061B]/95 backdrop-blur-2xl border-t border-purple-500/40 flex flex-col">
            <div className="px-4 py-3 border-b border-purple-500/20 flex items-center justify-between">
              <span className="text-sm font-display font-bold text-white">
                Participants &amp; Moderators ({fullParticipantsList.length})
              </span>
              <button
                type="button"
                onClick={() => setParticipantsOpen(false)}
                className="min-w-[36px] min-h-[36px] rounded-xl flex items-center justify-center text-slate-300"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
            <div className="flex-1 overflow-y-auto p-4 space-y-2">
              {fullParticipantsList.map((p) => {
                const isManageable = isHost && p.id !== 'host' && p.id !== 'you';
                return (
                  <div
                    key={p.id}
                    className="w-full flex items-center justify-between gap-2 p-2.5 rounded-xl bg-[#160B2C] border border-purple-500/20"
                  >
                    <button
                      type="button"
                      onClick={() =>
                        onOpenUserInfo({
                          name: p.name,
                          avatar: p.avatar,
                          level: p.level,
                        })
                      }
                      className="flex items-center gap-2.5 min-w-0 text-left flex-1"
                    >
                      <SafeImage
                        src={p.avatar}
                        alt={p.name}
                        className="w-9 h-9 rounded-full object-cover border border-amber-400/50 shrink-0"
                      />
                      <div className="min-w-0">
                        <div className="flex items-center gap-1.5">
                          <span className="text-xs font-bold text-white truncate">{p.name}</span>
                          <LevelBadge level={p.level} size="xs" />
                        </div>
                        <span className="text-[10px] text-amber-300">{p.role}</span>
                      </div>
                    </button>

                    {isManageable && (
                      <div className="flex items-center gap-1 shrink-0">
                        <button
                          type="button"
                          onClick={() => toggleModeratorRole(p.id)}
                          aria-label={`Toggle moderator for ${p.name}`}
                          className={`w-8 h-8 rounded-lg flex items-center justify-center ${
                            p.role === 'Moderator'
                              ? 'bg-amber-400/25 text-amber-300'
                              : 'bg-white/10 text-slate-300'
                          }`}
                        >
                          <Shield className="w-3.5 h-3.5" />
                        </button>
                        <button
                          type="button"
                          onClick={() => toggleParticipantMute(p.id)}
                          aria-label={p.isMuted ? `Unmute ${p.name}` : `Mute ${p.name}`}
                          className="w-8 h-8 rounded-lg bg-white/10 hover:bg-white/20 flex items-center justify-center text-amber-300"
                        >
                          {p.isMuted ? <MicOff className="w-3.5 h-3.5" /> : <Mic className="w-3.5 h-3.5" />}
                        </button>
                        <button
                          type="button"
                          onClick={() => removeParticipant(p.id)}
                          aria-label={`Remove ${p.name}`}
                          className="w-8 h-8 rounded-lg bg-rose-500/20 hover:bg-rose-500/40 flex items-center justify-center text-rose-300"
                        >
                          <UserMinus className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* Room Info Modal */}
        {roomInfoOpen && (
          <div className="absolute inset-x-0 bottom-0 z-30 rounded-t-3xl bg-[#0D061B]/95 backdrop-blur-2xl border-t border-purple-500/40 p-5 space-y-3">
            <div className="flex items-center justify-between">
              <h3 className="text-sm font-display font-bold text-white">Room Information</h3>
              <button
                type="button"
                onClick={() => setRoomInfoOpen(false)}
                className="w-8 h-8 rounded-xl bg-white/5 flex items-center justify-center text-slate-300"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
            <div className="rounded-2xl bg-[#160B2C] border border-purple-500/25 p-3.5 space-y-1.5 text-xs">
              <p className="text-white font-bold">{room.name}</p>
              <p className="text-slate-300">{room.description}</p>
              <p className="text-amber-300">
                Type: {room.roomType} · Seats: {seatLayout} · Host: {room.hostName}
              </p>
            </div>
          </div>
        )}

        {/* Host Room Settings Modal */}
        {isHost && settingsOpen && (
          <div className="absolute inset-0 z-40 bg-black/80 backdrop-blur-md flex items-center justify-center p-4">
            <form
              onSubmit={handleSaveRoomSettings}
              className="w-full max-w-xs rounded-3xl mizo-royal-card p-5 space-y-3.5 border border-amber-400/45"
            >
              <div className="flex items-center justify-between">
                <h3 className="text-base font-display font-bold text-white">
                  Room Settings
                </h3>
                <button
                  type="button"
                  onClick={() => setSettingsOpen(false)}
                  className="w-8 h-8 rounded-xl bg-white/5 flex items-center justify-center text-slate-300"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>

              <div className="space-y-1">
                <label className="text-xs font-semibold text-slate-300">Room Name</label>
                <input
                  type="text"
                  value={editName}
                  onChange={(e) => setEditName(e.target.value)}
                  className="w-full h-10 px-3 rounded-xl bg-[#150C28] border border-purple-500/35 text-xs text-white focus:outline-none focus:border-amber-400"
                />
              </div>

              <div className="space-y-1">
                <label className="text-xs font-semibold text-slate-300">Description</label>
                <textarea
                  rows={2}
                  value={editDesc}
                  onChange={(e) => setEditDesc(e.target.value)}
                  className="w-full p-2.5 rounded-xl bg-[#150C28] border border-purple-500/35 text-xs text-white focus:outline-none focus:border-amber-400 resize-none"
                />
              </div>

              <div className="space-y-1">
                <label className="text-xs font-semibold text-slate-300">Room Type</label>
                <div className="grid grid-cols-4 gap-1.5">
                  {(['Public', 'VIP', 'Music', 'Chat'] as const).map((t) => (
                    <button
                      key={t}
                      type="button"
                      onClick={() => setEditType(t)}
                      className={`py-1.5 rounded-lg text-[11px] font-bold ${
                        editType === t
                          ? 'mizo-gold-gradient text-[#1E0B3B]'
                          : 'bg-[#150C28] text-slate-300 border border-purple-500/25'
                      }`}
                    >
                      {t}
                    </button>
                  ))}
                </div>
              </div>

              <div className="space-y-1">
                <label className="text-xs font-semibold text-slate-300">Seats Layout</label>
                <div className="grid grid-cols-4 gap-1.5">
                  {([4, 6, 9, 12] as const).map((cap) => (
                    <button
                      key={cap}
                      type="button"
                      onClick={() => setEditSeats(cap)}
                      className={`py-1.5 rounded-lg text-[11px] font-bold ${
                        editSeats === cap
                          ? 'mizo-purple-gradient text-white border border-amber-400/50'
                          : 'bg-[#150C28] text-slate-300 border border-purple-500/25'
                      }`}
                    >
                      {cap}
                    </button>
                  ))}
                </div>
              </div>

              <button
                type="submit"
                className="w-full min-h-[42px] rounded-xl mizo-gold-gradient text-[#1E0B3B] text-xs font-extrabold"
              >
                Save Settings
              </button>
            </form>
          </div>
        )}

        {/* Room Invitations Modal */}
        {inviteOpen && (
          <div className="absolute inset-x-0 bottom-0 z-30 h-[58%] rounded-t-3xl bg-[#0D061B]/95 backdrop-blur-2xl border-t border-purple-500/40 flex flex-col">
            <div className="px-4 py-3 border-b border-purple-500/20 flex items-center justify-between">
              <span className="text-sm font-display font-bold text-white">
                Invite Friends to Room
              </span>
              <button
                type="button"
                onClick={() => setInviteOpen(false)}
                className="w-8 h-8 rounded-xl bg-white/5 flex items-center justify-center text-slate-300"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
            <div className="flex-1 overflow-y-auto p-4 space-y-2">
              {INITIAL_ACTIVE_USERS.map((u) => {
                const invited = invitedIds.includes(u.id);
                return (
                  <div
                    key={u.id}
                    className="flex items-center justify-between p-2.5 rounded-xl bg-[#160B2C] border border-purple-500/20"
                  >
                    <div className="flex items-center gap-2.5">
                      <SafeImage
                        src={u.avatar}
                        alt={u.name}
                        className="w-9 h-9 rounded-full object-cover border border-amber-400/50"
                      />
                      <div>
                        <p className="text-xs font-bold text-white">{u.name}</p>
                        <LevelBadge level={u.level} size="xs" />
                      </div>
                    </div>
                    <button
                      type="button"
                      disabled={invited}
                      onClick={() => setInvitedIds((prev) => [...prev, u.id])}
                      className={`px-3 py-1.5 rounded-xl text-[11px] font-bold ${
                        invited
                          ? 'bg-emerald-500/20 text-emerald-300'
                          : 'mizo-gold-gradient text-[#1E0B3B]'
                      }`}
                    >
                      {invited ? 'Invited' : 'Invite'}
                    </button>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* Room Gift Panel */}
        <GiftPanel
          open={giftPanelOpen}
          coins={userCoins}
          recipientName={activeRecipient}
          recipientOptions={[room.hostName, 'Cute Queen', 'Mr. Khan']}
          onSelectRecipient={setGiftRecipient}
          giftHistory={giftHistory}
          onClose={() => setGiftPanelOpen(false)}
          onSendGift={handleRoomGift}
        />

        {/* 1. Normal Participant Leave / Minimize Dialog */}
        {!isHost && leaveDialogOpen && (
          <div
            className="absolute inset-0 z-40 bg-black/80 backdrop-blur-md flex items-center justify-center p-5"
            role="alertdialog"
            aria-modal="true"
            aria-labelledby="leave-room-title"
          >
            <div className="w-full max-w-xs rounded-3xl mizo-royal-card p-5 text-center space-y-4 border border-purple-400/40">
              <div className="flex items-center justify-between">
                <h3 id="leave-room-title" className="text-base font-display font-bold text-white">
                  Room Options
                </h3>
                <button
                  type="button"
                  onClick={() => setLeaveDialogOpen(false)}
                  aria-label="Stay in room"
                  className="w-8 h-8 rounded-lg bg-white/5 flex items-center justify-center text-slate-300"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>
              <p className="text-xs text-slate-300">
                Minimize to browse Mizo Live while staying connected, or leave this room completely.
              </p>

              <div className="space-y-2.5">
                <button
                  type="button"
                  onClick={() => {
                    setLeaveDialogOpen(false);
                    onMinimize();
                  }}
                  className="w-full min-h-[44px] rounded-xl mizo-purple-gradient border border-purple-300/35 text-xs font-bold text-white inline-flex items-center justify-center gap-2"
                >
                  <Minimize2 className="w-4 h-4" />
                  <span>Minimize</span>
                </button>

                <button
                  type="button"
                  onClick={() => {
                    setLeaveDialogOpen(false);
                    agoraService.leaveSession(`room-${room.id}`);
                    onLeaveRoom();
                  }}
                  className="w-full min-h-[44px] rounded-xl bg-rose-600/90 hover:bg-rose-500 text-xs font-bold text-white inline-flex items-center justify-center gap-2"
                >
                  <LogOut className="w-4 h-4" />
                  <span>Leave Room</span>
                </button>
              </div>
            </div>
          </div>
        )}

        {/* 2. Host-Only "End This Party?" Confirmation */}
        {isHost && endPartyDialogOpen && (
          <div
            className="absolute inset-0 z-40 bg-black/80 backdrop-blur-md flex items-center justify-center p-5"
            role="alertdialog"
            aria-modal="true"
            aria-labelledby="end-party-title"
          >
            <div className="w-full max-w-xs rounded-3xl mizo-royal-card p-5 text-center space-y-4 border border-amber-400/45">
              <h3 id="end-party-title" className="text-lg font-display font-bold text-white">
                End This Party?
              </h3>
              <p className="text-xs text-slate-300">
                As the room host, you must end this party to close the session and disconnect participants.
              </p>
              <div className="grid grid-cols-2 gap-2.5">
                <button
                  type="button"
                  onClick={() => setEndPartyDialogOpen(false)}
                  className="min-h-[44px] rounded-xl bg-white/10 hover:bg-white/15 text-xs font-bold text-white"
                >
                  Cancel
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setEndPartyDialogOpen(false);
                    agoraService.leaveSession(`room-${room.id}`);
                    onEndParty(room.id);
                  }}
                  className="min-h-[44px] rounded-xl bg-rose-600 hover:bg-rose-500 text-xs font-bold text-white"
                >
                  End This Party
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
   3. STORE ITEM ANIMATION / FRAME PREVIEW MODAL
   ========================================================= */
interface StorePreviewModalProps {
  item: StoreItem | null;
  userAvatar: string;
  username: string;
  onClose: () => void;
  onBuyOrSelect: (item: StoreItem) => Promise<{ ok: boolean; insufficient?: boolean }>;
}

export const StorePreviewModal: React.FC<StorePreviewModalProps> = ({
  item,
  userAvatar,
  username,
  onClose,
  onBuyOrSelect,
}) => {
  if (!item) return null;

  return (
    <div
      className="fixed inset-0 z-50 bg-black/80 backdrop-blur-md flex items-center justify-center p-4"
      role="dialog"
      aria-modal="true"
      aria-label={`Preview ${item.name}`}
    >
      <div className="w-full max-w-sm rounded-3xl mizo-royal-card p-5 relative text-center shadow-[0_0_50px_rgba(168,85,247,0.4)]">
        <button
          type="button"
          onClick={onClose}
          aria-label="Close preview"
          className="absolute top-3 right-3 min-w-[44px] min-h-[44px] flex items-center justify-center rounded-xl text-slate-300 hover:text-white hover:bg-white/10"
        >
          <X className="w-5 h-5" />
        </button>

        <p className="text-xs font-semibold text-amber-300 mb-1">
          {item.category} Preview
        </p>
        <h3 className="text-xl font-display font-bold text-white">{item.name}</h3>
        <p className="text-xs text-slate-300 mt-1">{item.subtitle}</p>

        <div className="my-6 py-6 rounded-2xl bg-gradient-to-b from-[#231048] to-[#0B0517] border border-purple-400/25 flex flex-col items-center justify-center gap-3">
          {item.category === 'VIP Frames' || item.category === 'Animated Frames' ? (
            <div className="relative w-24 h-24 flex items-center justify-center animate-mizo-float">
              <SafeImage
                src={userAvatar}
                alt={username}
                className="w-24 h-24 rounded-full object-cover"
              />
              <ProfileFrameOverlay frameId={item.id} size={96} />
            </div>
          ) : (
            <>
              <EntryShowcaseArt styleType={item.accentStyle} size={110} animate />
              <div className="px-4 py-1.5 rounded-full bg-gradient-to-r from-purple-700/80 via-fuchsia-700/80 to-amber-500/80 border border-amber-300/60 text-xs font-bold text-white shadow-lg">
                {item.category === 'Special Entry'
                  ? `${username} entered the room!`
                  : `${item.name} Showcase`}
              </div>
            </>
          )}
        </div>

        <div className="flex items-center justify-center gap-2 text-amber-300 font-mono-num text-base font-bold mb-4">
          <GoldCoinIcon size={20} />
          <span>{item.price.toLocaleString()} Coins</span>
        </div>

        <div className="grid grid-cols-2 gap-3">
          <button
            type="button"
            onClick={onClose}
            className="min-h-[44px] rounded-xl bg-white/5 hover:bg-white/10 border border-white/15 text-sm font-semibold text-white"
          >
            Close
          </button>
          <button
            type="button"
            onClick={async () => {
              await onBuyOrSelect(item);
              onClose();
            }}
            className="min-h-[44px] rounded-xl mizo-gold-gradient text-[#1E0B3B] text-sm font-bold shadow-lg"
          >
            {item.owned ? 'Equip / Use' : 'Purchase'}
          </button>
        </div>
      </div>
    </div>
  );
};

/* =========================================================
   4. VIDEO PLAYER MODAL (PROFILE VIDEOS)
   ========================================================= */
interface VideoPlayerModalProps {
  video: UserVideo | null;
  onClose: () => void;
}

export const VideoPlayerModal: React.FC<VideoPlayerModalProps> = ({ video, onClose }) => {
  if (!video) return null;

  return (
    <div
      className="fixed inset-0 z-50 bg-black/85 backdrop-blur-md flex items-center justify-center p-4"
      role="dialog"
      aria-modal="true"
      aria-label={video.title}
    >
      <div className="w-full max-w-md rounded-3xl mizo-royal-card overflow-hidden">
        <div className="p-3.5 flex items-center justify-between border-b border-purple-500/20">
          <div className="min-w-0">
            <h3 className="text-sm font-display font-bold text-white truncate">{video.title}</h3>
            <p className="text-xs text-slate-400">
              {video.creatorName} · {video.views} views · {video.privacy}
            </p>
          </div>
          <button
            type="button"
            onClick={onClose}
            aria-label="Close video"
            className="min-w-[44px] min-h-[44px] flex items-center justify-center rounded-xl text-slate-300 hover:text-white hover:bg-white/10"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="relative aspect-[9/12] max-h-[65vh] bg-black flex items-center justify-center">
          {video.videoUrl ? (
            <video
              src={video.videoUrl}
              controls
              autoPlay
              className="w-full h-full object-contain"
            />
          ) : (
            <div className="relative w-full h-full">
              <SafeImage
                src={video.thumbnail}
                alt={video.title}
                className="w-full h-full object-cover"
              />
              <div className="absolute inset-0 bg-black/35 flex flex-col items-center justify-center p-6 text-center">
                <div className="w-16 h-16 rounded-full mizo-purple-gradient border border-amber-400/60 flex items-center justify-center mb-3 shadow-lg">
                  <Play className="w-7 h-7 text-white fill-white ml-1" />
                </div>
                <p className="text-sm font-semibold text-white">{video.title}</p>
                {video.description && (
                  <p className="text-xs text-slate-300 mt-1">{video.description}</p>
                )}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
