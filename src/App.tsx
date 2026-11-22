import { useEffect, useMemo, useRef, useState } from 'react';
import { BottomNav } from './components/BottomNav';
import { ActiveCallSessionUI, CallOverlay } from './components/CallOverlay';
import { MinimizedLivePlayer } from './components/MinimizedLivePlayer';
import { MinimizedRoomPlayer } from './components/MinimizedRoomPlayer';
import {
  CreateActionMenu,
  RoomLoungeModal,
  StorePreviewModal,
  VideoPlayerModal,
} from './components/Modals';
import { UserInfoModal, UserInfoTarget } from './components/UserInfoModal';
import { getXpRequiredForLevel, LEVEL_CONFIG } from './data/levels';
import {
  INITIAL_ACHIEVEMENTS,
  INITIAL_ACTIVE_USERS,
  INITIAL_CALL_HISTORY,
  INITIAL_FEED_VIDEOS,
  INITIAL_INBOX_ITEMS,
  INITIAL_LIVE_STREAMS,
  INITIAL_MY_VIDEOS,
  INITIAL_NOTIFICATION_PREFS,
  INITIAL_PROFILE,
  INITIAL_ROOMS,
  INITIAL_STORE_ITEMS,
} from './data/mizoData';
import { CreateRoomScreen } from './screens/CreateRoomScreen';
import { EditProfileScreen } from './screens/EditProfileScreen';
import { GoLiveScreen } from './screens/GoLiveScreen';
import { HomeScreen } from './screens/HomeScreen';
import { InboxScreen } from './screens/InboxScreen';
import { LevelDetailsScreen } from './screens/LevelDetailsScreen';
import { LiveRoomScreen, LiveSummaryModal } from './screens/LiveRoomScreen';
import {
  AchievementsScreen,
  AgencyScreen,
  RankingsScreen,
} from './screens/ProfileFeaturesScreens';
import { ProfileScreen } from './screens/ProfileScreen';
import { RoomsScreen } from './screens/RoomsScreen';
import { StoreScreen } from './screens/StoreScreen';
import { UploadVideoScreen } from './screens/UploadVideoScreen';
import { VideoFeedScreen } from './screens/VideoFeedScreen';
import { WalletScreen } from './screens/WalletScreen';
import {
  AchievementBadge,
  ActiveUserItem,
  AppScreen,
  CallRecord,
  EconomyConfig,
  FeedVideo,
  GiftItem,
  InboxItem,
  InboxTab,
  LiveSessionSummary,
  LiveStream,
  MainTab,
  NotificationPrefs,
  RoomItem,
  ServerWalletAccount,
  StoreItem,
  UserProfile,
  UserVideo,
} from './types/mizo';

const MAIN_TABS: MainTab[] = ['home', 'rooms', 'store', 'videos', 'chat', 'profile'];

const FALLBACK_ECONOMY: EconomyConfig = {
  audioCallCoinsPerMin: 40,
  videoCallCoinsPerMin: 90,
  platformCommissionPct: 20,
  coinPackages: [],
};

const INITIAL_WALLET: ServerWalletAccount = {
  userId: INITIAL_PROFILE.userId,
  coins: INITIAL_PROFILE.coins,
  spentCoins: INITIAL_PROFILE.spentCoins,
  receivedCoins: 1280,
  callEarnings: 420,
  ownedItemIds: ['frame-gold-wreath'],
  transactions: [],
};

export default function App() {
  const [screen, setScreen] = useState<AppScreen>('home');
  const [inboxInitialTab, setInboxInitialTab] = useState<InboxTab>('All');
  const [videoFeedIndex, setVideoFeedIndex] = useState(0);

  // Core App State
  const [profile, setProfile] = useState<UserProfile>(INITIAL_PROFILE);
  const [economy, setEconomy] = useState<EconomyConfig>(FALLBACK_ECONOMY);
  const [wallet, setWallet] = useState<ServerWalletAccount>(INITIAL_WALLET);
  const [activeUsers] = useState<ActiveUserItem[]>(INITIAL_ACTIVE_USERS);
  const [streams, setStreams] = useState<LiveStream[]>(INITIAL_LIVE_STREAMS);
  const [feedVideos, setFeedVideos] = useState<FeedVideo[]>(INITIAL_FEED_VIDEOS);
  const [rooms, setRooms] = useState<RoomItem[]>(INITIAL_ROOMS);
  const [storeItems, setStoreItems] = useState<StoreItem[]>(INITIAL_STORE_ITEMS);
  const [inboxItems, setInboxItems] = useState<InboxItem[]>(INITIAL_INBOX_ITEMS);
  const [callHistory, setCallHistory] = useState<CallRecord[]>(INITIAL_CALL_HISTORY);
  const [notificationPrefs, setNotificationPrefs] = useState<NotificationPrefs>(
    INITIAL_NOTIFICATION_PREFS
  );
  const [myVideos, setMyVideos] = useState<UserVideo[]>(INITIAL_MY_VIDEOS);
  const [achievements, setAchievements] =
    useState<AchievementBadge[]>(INITIAL_ACHIEVEMENTS);

  // Overlays & Live / Room / Call States
  const [createMenuOpen, setCreateMenuOpen] = useState(false);
  const [activeStream, setActiveStream] = useState<{
    stream: LiveStream;
    isHost: boolean;
  } | null>(null);
  const [liveMinimized, setLiveMinimized] = useState(false);
  const [liveSummary, setLiveSummary] = useState<LiveSessionSummary | null>(null);

  const [activeRoom, setActiveRoom] = useState<RoomItem | null>(null);
  const [roomMinimized, setRoomMinimized] = useState(false);

  const [pendingCallConsent, setPendingCallConsent] = useState<{
    peerName: string;
    peerAvatar: string;
    peerLevel: number;
    callType: 'audio' | 'video';
  } | null>(null);
  const [incomingCall, setIncomingCall] = useState<{
    callId: string;
    peerName: string;
    peerAvatar: string;
    peerLevel: number;
    callType: 'audio' | 'video';
  } | null>(null);
  const [activeCall, setActiveCall] = useState<ActiveCallSessionUI | null>(null);

  const [previewStoreItem, setPreviewStoreItem] = useState<StoreItem | null>(null);
  const [playingVideo, setPlayingVideo] = useState<UserVideo | null>(null);
  const [userInfoTarget, setUserInfoTarget] = useState<UserInfoTarget | null>(null);
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  const wsRef = useRef<WebSocket | null>(null);

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => {
      setToastMessage((curr) => (curr === msg ? null : curr));
    }, 2800);
  };

  const syncAccountFromServer = (acc: ServerWalletAccount) => {
    setWallet(acc);
    setProfile((prev) => ({
      ...prev,
      coins: acc.coins,
      spentCoins: acc.spentCoins,
    }));
    setStoreItems((prev) =>
      prev.map((item) => ({
        ...item,
        owned: acc.ownedItemIds.includes(item.id) || item.owned,
      }))
    );
  };

  // Load configurable server economy & wallet on mount + connect WebSocket signaling
  useEffect(() => {
    fetch('/api/config')
      .then((r) => (r.ok ? r.json() : null))
      .then((data) => {
        if (data?.economy) setEconomy(data.economy);
      })
      .catch(() => {});

    fetch(`/api/wallet?userId=${encodeURIComponent(profile.userId)}`)
      .then((r) => (r.ok ? r.json() : null))
      .then((acc) => {
        if (acc && typeof acc.coins === 'number') {
          syncAccountFromServer(acc);
        }
      })
      .catch(() => {});

    const protocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:';
    const ws = new WebSocket(`${protocol}//${window.location.host}/ws`);
    wsRef.current = ws;

    ws.onmessage = (event) => {
      try {
        const msg = JSON.parse(event.data);
        if (msg.type === 'call:invite' && msg.targetUserId === profile.userId) {
          setIncomingCall({
            callId: msg.callId,
            peerName: msg.callerName,
            peerAvatar: msg.callerAvatar,
            peerLevel: msg.callerLevel || 24,
            callType: msg.callType === 'video' ? 'video' : 'audio',
          });
        } else if (msg.type === 'call:end' && activeCall?.callId === msg.callId) {
          setActiveCall(null);
          showToast('Call ended by remote peer');
        }
      } catch {
        // Ignore malformed socket frames
      }
    };

    return () => {
      ws.close();
      wsRef.current = null;
    };
  }, []);

  // Configurable 99-Level XP progression helper (strictly 1-99)
  const addActivityXp = (amount: number, sourceLabel?: string) => {
    setProfile((prev) => {
      let nextLevel = Math.min(LEVEL_CONFIG.maxLevel, Math.max(1, prev.level));
      let nextXp = prev.xp + amount;
      while (nextLevel < LEVEL_CONFIG.maxLevel) {
        const req = getXpRequiredForLevel(nextLevel);
        if (nextXp >= req) {
          nextXp -= req;
          nextLevel += 1;
        } else {
          break;
        }
      }
      if (nextLevel >= LEVEL_CONFIG.maxLevel) {
        nextLevel = LEVEL_CONFIG.maxLevel;
      }
      if (nextLevel > prev.level) {
        showToast(`Level Up! You reached Level ${nextLevel}!`);
      } else if (sourceLabel) {
        showToast(`+${amount} XP (${sourceLabel})`);
      }
      return { ...prev, level: nextLevel, xp: nextXp };
    });
  };

  const totalUnreadInbox = useMemo(
    () => inboxItems.reduce((sum, item) => sum + item.unreadCount, 0),
    [inboxItems]
  );

  const unreadNotificationsCount = useMemo(
    () =>
      inboxItems
        .filter((i) => i.type === 'notification')
        .reduce((sum, i) => sum + i.unreadCount, 0) || totalUnreadInbox,
    [inboxItems, totalUnreadInbox]
  );

  const savedVideos = useMemo<UserVideo[]>(
    () =>
      feedVideos
        .filter((v) => v.isSaved)
        .map((v) => ({
          id: v.id,
          title: v.description,
          description: v.description,
          privacy: 'Public',
          thumbnail: v.thumbnail,
          videoUrl: v.videoUrl,
          duration: '0:35',
          views: `${(v.likes + 450).toLocaleString()}`,
          likes: `${v.likes.toLocaleString()}`,
          creatorName: v.creatorName,
          createdAt: 'Saved',
        })),
    [feedVideos]
  );

  const activeTab: MainTab = MAIN_TABS.includes(screen as MainTab)
    ? (screen as MainTab)
    : 'home';

  const showBottomNav = MAIN_TABS.includes(screen as MainTab);

  // Navigation Handlers
  const handleSelectTab = (tab: MainTab) => {
    if (tab === 'chat') {
      setInboxInitialTab('All');
    }
    setScreen(tab);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleOpenNotifications = () => {
    setInboxInitialTab('Notifications');
    setScreen('chat');
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  // Chat, Requests & Notification Handlers
  const handleMarkInboxRead = (id: string) => {
    setInboxItems((prev) =>
      prev.map((item) => (item.id === id ? { ...item, unreadCount: 0 } : item))
    );
  };

  const handleMarkAllInboxRead = () => {
    setInboxItems((prev) => prev.map((item) => ({ ...item, unreadCount: 0 })));
    showToast('All chats and alerts marked as read');
  };

  const handleAcceptRequest = (id: string) => {
    setInboxItems((prev) =>
      prev.map((item) =>
        item.id === id ? { ...item, type: 'message', unreadCount: 0 } : item
      )
    );
    showToast('Message request accepted');
  };

  const handleDeclineRequest = (id: string) => {
    setInboxItems((prev) => prev.filter((item) => item.id !== id));
    showToast('Message request declined');
  };

  const handleSendInboxMessage = (itemId: string, text: string, imageUrl?: string) => {
    setInboxItems((prev) =>
      prev.map((item) => {
        if (item.id !== itemId) return item;
        const newMsg = {
          id: `msg-${Date.now()}`,
          sender: 'me' as const,
          text,
          imageUrl,
          status: 'Delivered' as const,
          timestamp: 'Just now',
        };
        return {
          ...item,
          preview: imageUrl ? 'Sent a photo' : text,
          timestamp: 'Just now',
          unreadCount: 0,
          messages: [...(item.messages || []), newMsg],
        };
      })
    );
  };

  // Wallet Recharge Handler
  const handleRechargePackage = async (packageId: string) => {
    try {
      const res = await fetch('/api/wallet/recharge', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userId: profile.userId, packageId }),
      });
      const data = await res.json();
      if (res.ok && data.account) {
        syncAccountFromServer(data.account);
        showToast(`+${data.added.toLocaleString()} Sandbox Coins added`);
      } else {
        showToast(data.error || 'Recharge failed');
      }
    } catch {
      showToast('Server unavailable for recharge');
    }
  };

  // Store Purchase / Equip Handler (Server-authoritative)
  const handlePurchaseOrEquipStoreItem = async (
    item: StoreItem
  ): Promise<{ ok: boolean; insufficient?: boolean }> => {
    const equipLocally = () => {
      setStoreItems((prev) =>
        prev.map((s) =>
          s.id === item.id
            ? { ...s, owned: true, equipped: true }
            : s.category === item.category
            ? { ...s, equipped: false }
            : s
        )
      );
      setProfile((prev) => ({
        ...prev,
        equippedFrameId:
          item.category === 'VIP Frames' ? item.id : prev.equippedFrameId,
        equippedEntryId:
          item.category === 'Special Entry' ? item.id : prev.equippedEntryId,
        equippedAssetId:
          item.category === 'Premium Assets' ? item.id : prev.equippedAssetId,
      }));
    };

    if (item.owned) {
      equipLocally();
      showToast(`${item.name} equipped!`);
      return { ok: true };
    }

    try {
      const res = await fetch('/api/store/purchase', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userId: profile.userId, itemId: item.id }),
      });
      const data = await res.json();
      if (res.status === 402) {
        return { ok: false, insufficient: true };
      }
      if (!res.ok) {
        showToast(data.error || 'Purchase failed');
        return { ok: false };
      }
      if (data.account) syncAccountFromServer(data.account);
      equipLocally();
      showToast(`Purchased & equipped ${item.name}!`);
      return { ok: true };
    } catch {
      showToast('Unable to reach server');
      return { ok: false };
    }
  };

  // Server-Validated Gift Sending (Live & Rooms)
  const handleSendGift = async (gift: GiftItem, recipient: string): Promise<boolean> => {
    if (profile.coins < gift.price) {
      showToast('Insufficient coin balance — recharge in Wallet');
      return false;
    }
    try {
      const res = await fetch('/api/gifts/send', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          userId: profile.userId,
          giftId: gift.id,
          recipientName: recipient,
        }),
      });
      const data = await res.json();
      if (!res.ok) {
        showToast(data.error || 'Insufficient coins');
        return false;
      }
      if (data.account) syncAccountFromServer(data.account);
      addActivityXp(LEVEL_CONFIG.xpRewards.sendGiftBonus);
      showToast(`Sent ${gift.name} to ${recipient}`);
      return true;
    } catch {
      showToast('Failed to send gift');
      return false;
    }
  };

  // Coin-Based Audio / Video Call Flow
  const handleConfirmStartCall = async (
    peerName: string,
    peerAvatar: string,
    peerLevel: number,
    callType: 'audio' | 'video'
  ) => {
    try {
      const res = await fetch('/api/calls/start', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          userId: profile.userId,
          calleeName: peerName,
          callType,
          consentConfirmed: true,
        }),
      });
      const data = await res.json();
      if (!res.ok) {
        showToast(data.error || 'Unable to start call');
        return;
      }
      if (data.account) syncAccountFromServer(data.account);
      setPendingCallConsent(null);
      setActiveCall({
        callId: data.session.callId,
        peerName,
        peerAvatar,
        peerLevel,
        callType,
        direction: 'outgoing',
        ratePerMin: data.session.ratePerMin,
        totalCharged: data.session.totalCharged,
      });

      if (wsRef.current?.readyState === WebSocket.OPEN) {
        wsRef.current.send(
          JSON.stringify({
            type: 'call:invite',
            callId: data.session.callId,
            callerName: profile.username,
            callerAvatar: profile.avatar,
            callerLevel: profile.level,
            callType,
          })
        );
      }
    } catch {
      showToast('Call server unavailable');
    }
  };

  const handleCallTick = async (callId: string): Promise<boolean> => {
    try {
      const res = await fetch('/api/calls/tick', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ callId }),
      });
      const data = await res.json();
      if (!res.ok) {
        showToast(data.error || 'Insufficient coins — call ending');
        return false;
      }
      if (data.account) syncAccountFromServer(data.account);
      setActiveCall((prev) =>
        prev && prev.callId === callId
          ? { ...prev, totalCharged: data.session.totalCharged }
          : prev
      );
      return true;
    } catch {
      return false;
    }
  };

  const handleEndCall = async (
    callId: string,
    durationDisplay: string,
    totalCharged: number
  ) => {
    const endingCall = activeCall;
    setActiveCall(null);

    try {
      const res = await fetch('/api/calls/end', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ callId }),
      });
      const data = await res.json();
      if (data.account) syncAccountFromServer(data.account);
    } catch {
      // ignore
    }

    if (wsRef.current?.readyState === WebSocket.OPEN) {
      wsRef.current.send(JSON.stringify({ type: 'call:end', callId }));
    }

    if (endingCall) {
      setCallHistory((prev) => [
        {
          id: `ch-${Date.now()}`,
          peerName: endingCall.peerName,
          peerAvatar: endingCall.peerAvatar,
          peerLevel: endingCall.peerLevel,
          callType: endingCall.callType,
          direction: endingCall.direction,
          durationDisplay,
          coinsBilled: totalCharged,
          timestamp: 'Just now',
        },
        ...prev,
      ]);
      showToast(`Call ended (${durationDisplay} · ${totalCharged} Coins)`);
    }
  };

  // Profile & Upload Handlers
  const handleSaveProfile = (
    updates: Pick<UserProfile, 'username' | 'bio' | 'avatar' | 'coverImage'>
  ) => {
    setProfile((prev) => ({ ...prev, ...updates }));
    setScreen('profile');
    showToast('Profile updated');
  };

  const handleUploadComplete = (video: UserVideo) => {
    setMyVideos((prev) => [video, ...prev]);
    if (video.privacy === 'Public') {
      setFeedVideos((prev) => [
        {
          id: `feed-${video.id}`,
          creatorName: profile.username,
          creatorHandle: `@${profile.username.toLowerCase().replace(/\s+/g, '')}`,
          creatorAvatar: profile.avatar,
          creatorLevel: profile.level,
          isFollowing: false,
          description: video.description || video.title,
          audioTitle: `Original Audio · ${profile.username}`,
          thumbnail: video.thumbnail,
          videoUrl: video.videoUrl,
          likes: 1,
          isLiked: false,
          isSaved: false,
          comments: [],
          shares: 0,
          reposts: 0,
          isReposted: false,
        },
        ...prev,
      ]);
    }
    addActivityXp(LEVEL_CONFIG.xpRewards.uploadVideo, 'Upload Video');
    setScreen('profile');
  };

  // Go Live Host Launch
  const handleStartLiveDemo = (title: string, coverImage: string) => {
    const hostStream: LiveStream = {
      id: `live-${Date.now()}`,
      username: profile.username,
      hostLevel: profile.level,
      title,
      viewers: 18,
      viewerDisplay: '18',
      thumbnail: coverImage,
      avatar: profile.avatar,
      category: 'Live Studio',
      section: 'Live Now',
      roomTopic: title,
    };
    setStreams((prev) => [hostStream, ...prev]);
    setActiveStream({ stream: hostStream, isHost: true });
    setLiveMinimized(false);
    setScreen('home');
  };

  const handleCompleteEndLive = (summary: LiveSessionSummary) => {
    if (activeStream) {
      setStreams((prev) => prev.filter((s) => s.id !== activeStream.stream.id));
    }
    setActiveStream(null);
    setLiveMinimized(false);
    setLiveSummary(summary);
  };

  // Room Create / Join / Update / End Party
  const handleCreateRoom = (room: RoomItem) => {
    setRooms((prev) => [room, ...prev]);
    setScreen('rooms');
    setActiveRoom(room);
    setRoomMinimized(false);
    addActivityXp(LEVEL_CONFIG.xpRewards.hostRoom, 'Host Party');
  };

  const handleJoinRoom = (room: RoomItem) => {
    setActiveRoom(room);
    setRoomMinimized(false);
  };

  const handleUpdateRoom = (roomId: string, updates: Partial<RoomItem>) => {
    setRooms((prev) =>
      prev.map((r) => (r.id === roomId ? { ...r, ...updates } : r))
    );
    setActiveRoom((prev) =>
      prev && prev.id === roomId ? { ...prev, ...updates } : prev
    );
    showToast('Room settings saved');
  };

  const handleEndParty = (roomId: string) => {
    setRooms((prev) => prev.filter((r) => r.id !== roomId));
    setActiveRoom(null);
    setRoomMinimized(false);
    showToast('Party ended and room closed');
  };

  // Video Feed Interactions
  const handleToggleFeedLike = (videoId: string, forceLike?: boolean) => {
    setFeedVideos((prev) =>
      prev.map((v) => {
        if (v.id !== videoId) return v;
        const nextLiked = forceLike ? true : !v.isLiked;
        if (nextLiked === v.isLiked) return v;
        if (nextLiked) addActivityXp(LEVEL_CONFIG.xpRewards.likeVideo);
        return {
          ...v,
          isLiked: nextLiked,
          likes: nextLiked ? v.likes + 1 : Math.max(0, v.likes - 1),
        };
      })
    );
  };

  const handleToggleFeedSave = (videoId: string) => {
    setFeedVideos((prev) =>
      prev.map((v) => {
        if (v.id !== videoId) return v;
        const nextSaved = !v.isSaved;
        showToast(nextSaved ? 'Saved to Profile' : 'Removed from Saved');
        return { ...v, isSaved: nextSaved };
      })
    );
  };

  const handleToggleFeedFollow = (videoId: string) => {
    setFeedVideos((prev) =>
      prev.map((v) =>
        v.id === videoId ? { ...v, isFollowing: !v.isFollowing } : v
      )
    );
  };

  const handleAddFeedComment = (videoId: string, text: string) => {
    setFeedVideos((prev) =>
      prev.map((v) => {
        if (v.id !== videoId) return v;
        return {
          ...v,
          comments: [
            {
              id: `vc-${Date.now()}`,
              username: profile.username,
              avatar: profile.avatar,
              level: profile.level,
              text,
              timestamp: 'Just now',
              replies: [],
            },
            ...v.comments,
          ],
        };
      })
    );
    addActivityXp(LEVEL_CONFIG.xpRewards.commentVideo, 'Comment');
  };

  const handleAddFeedCommentReply = (
    videoId: string,
    commentId: string,
    text: string
  ) => {
    setFeedVideos((prev) =>
      prev.map((v) => {
        if (v.id !== videoId) return v;
        return {
          ...v,
          comments: v.comments.map((c) => {
            if (c.id !== commentId) return c;
            return {
              ...c,
              replies: [
                ...(c.replies || []),
                {
                  id: `vcr-${Date.now()}`,
                  username: profile.username,
                  avatar: profile.avatar,
                  level: profile.level,
                  text,
                  timestamp: 'Just now',
                },
              ],
            };
          }),
        };
      })
    );
    addActivityXp(LEVEL_CONFIG.xpRewards.commentVideo, 'Reply');
  };

  const handleShareFeedVideo = (videoId: string) => {
    setFeedVideos((prev) =>
      prev.map((v) => (v.id === videoId ? { ...v, shares: v.shares + 1 } : v))
    );
    showToast('Video link copied');
  };

  const handleRepostFeedVideo = (videoId: string) => {
    setFeedVideos((prev) =>
      prev.map((v) => {
        if (v.id !== videoId) return v;
        const next = !v.isReposted;
        return {
          ...v,
          isReposted: next,
          reposts: next ? v.reposts + 1 : Math.max(0, v.reposts - 1),
        };
      })
    );
    showToast('Repost updated');
  };

  const handleToggleEquipBadge = (badgeId: string) => {
    setAchievements((prev) =>
      prev.map((b) => {
        if (b.id !== badgeId) return { ...b, equipped: false };
        return { ...b, equipped: !b.equipped };
      })
    );
  };

  return (
    <div className="min-h-screen bg-[#06040B] text-white relative">
      {/* Subtle Ambient Brand Glow */}
      <div
        aria-hidden="true"
        className="pointer-events-none fixed inset-x-0 top-0 h-72 bg-[radial-gradient(ellipse_at_top,rgba(147,51,234,0.22),transparent_70%)] z-0"
      />

      <div className="relative z-10">
        {screen === 'home' && (
          <HomeScreen
            streams={streams}
            rooms={rooms}
            activeUsers={activeUsers}
            feedVideos={feedVideos}
            coins={profile.coins}
            unreadNotifications={unreadNotificationsCount}
            onOpenStore={() => setScreen('store')}
            onOpenWallet={() => setScreen('wallet')}
            onOpenRooms={() => setScreen('rooms')}
            onOpenNotifications={handleOpenNotifications}
            onSelectStream={(stream) => {
              setActiveStream({
                stream,
                isHost: stream.username === profile.username,
              });
              setLiveMinimized(false);
            }}
            onJoinRoom={handleJoinRoom}
            onOpenVideoFeed={(idx = 0) => {
              setVideoFeedIndex(idx);
              setScreen('videos');
            }}
            onOpenUserInfo={(u) => setUserInfoTarget(u)}
          />
        )}

        {screen === 'rooms' && (
          <RoomsScreen rooms={rooms} onJoinRoom={handleJoinRoom} />
        )}

        {screen === 'store' && (
          <StoreScreen
            items={storeItems}
            coins={profile.coins}
            userAvatar={profile.avatar}
            equippedFrameId={profile.equippedFrameId}
            equippedEntryId={profile.equippedEntryId}
            equippedAssetId={profile.equippedAssetId}
            onOpenWallet={() => setScreen('wallet')}
            onPreviewItem={(item) => setPreviewStoreItem(item)}
            onPurchaseOrEquip={handlePurchaseOrEquipStoreItem}
          />
        )}

        {screen === 'videos' && (
          <VideoFeedScreen
            videos={feedVideos}
            initialIndex={videoFeedIndex}
            userLevel={profile.level}
            onToggleLike={handleToggleFeedLike}
            onToggleSave={handleToggleFeedSave}
            onToggleFollow={handleToggleFeedFollow}
            onAddComment={handleAddFeedComment}
            onAddCommentReply={handleAddFeedCommentReply}
            onShareVideo={handleShareFeedVideo}
            onRepostVideo={handleRepostFeedVideo}
            onOpenCreatorInfo={(u) => setUserInfoTarget(u)}
          />
        )}

        {screen === 'chat' && (
          <InboxScreen
            key={inboxInitialTab}
            items={inboxItems}
            callHistory={callHistory}
            notificationPrefs={notificationPrefs}
            initialTab={inboxInitialTab}
            onMarkRead={handleMarkInboxRead}
            onMarkAllRead={handleMarkAllInboxRead}
            onAcceptRequest={handleAcceptRequest}
            onDeclineRequest={handleDeclineRequest}
            onSendMessage={handleSendInboxMessage}
            onStartCall={(peerName, peerAvatar, peerLevel, callType) =>
              setPendingCallConsent({ peerName, peerAvatar, peerLevel, callType })
            }
            onUpdateNotifPrefs={(next) => {
              setNotificationPrefs(next);
              showToast('Notification preferences updated');
            }}
            onOpenUserInfo={(u) => setUserInfoTarget(u)}
          />
        )}

        {screen === 'profile' && (
          <ProfileScreen
            profile={profile}
            storeItems={storeItems}
            achievements={achievements}
            myVideos={myVideos}
            savedVideos={savedVideos}
            onEditProfile={() => setScreen('edit-profile')}
            onPlayVideo={(v) => setPlayingVideo(v)}
            onOpenCreateVideo={() => setScreen('upload-video')}
            onOpenStore={() => setScreen('store')}
            onOpenLevels={() => setScreen('level-details')}
            onOpenAchievements={() => setScreen('achievements')}
            onOpenAgency={() => setScreen('agency')}
            onOpenWallet={() => setScreen('wallet')}
            onOpenRankings={() => setScreen('rankings')}
            onShareProfile={() => {
              if (navigator.clipboard) {
                navigator.clipboard
                  .writeText(`${window.location.origin}/@${profile.userId}`)
                  .catch(() => {});
              }
              showToast('Profile link copied!');
            }}
          />
        )}

        {screen === 'edit-profile' && (
          <EditProfileScreen
            profile={profile}
            onCancel={() => setScreen('profile')}
            onSave={handleSaveProfile}
          />
        )}

        {screen === 'upload-video' && (
          <UploadVideoScreen
            creatorName={profile.username}
            onBack={() => setScreen('profile')}
            onUploadComplete={handleUploadComplete}
          />
        )}

        {screen === 'go-live' && (
          <GoLiveScreen
            username={profile.username}
            onBack={() => setScreen('home')}
            onStartLiveDemo={handleStartLiveDemo}
          />
        )}

        {screen === 'create-room' && (
          <CreateRoomScreen
            hostName={profile.username}
            hostAvatar={profile.avatar}
            hostLevel={profile.level}
            onBack={() => setScreen('rooms')}
            onCreateRoom={handleCreateRoom}
          />
        )}

        {screen === 'level-details' && (
          <LevelDetailsScreen
            currentLevel={Math.min(99, profile.level)}
            currentXp={profile.xp}
            onBack={() => setScreen('profile')}
            onAddDemoXp={(amt, src) => addActivityXp(amt, src)}
          />
        )}

        {screen === 'wallet' && (
          <WalletScreen
            wallet={wallet}
            economy={economy}
            onBack={() => setScreen('profile')}
            onRechargePackage={handleRechargePackage}
          />
        )}

        {screen === 'achievements' && (
          <AchievementsScreen
            badges={achievements}
            onBack={() => setScreen('profile')}
            onToggleEquip={handleToggleEquipBadge}
          />
        )}

        {screen === 'agency' && (
          <AgencyScreen onBack={() => setScreen('profile')} />
        )}

        {screen === 'rankings' && (
          <RankingsScreen onBack={() => setScreen('profile')} />
        )}
      </div>

      {/* Minimized Floating Live Player (Separate from Room Minimize) */}
      <MinimizedLivePlayer
        stream={liveMinimized && activeStream ? activeStream.stream : null}
        isHost={Boolean(activeStream?.isHost)}
        onRestore={() => setLiveMinimized(false)}
        onClose={() => {
          setActiveStream(null);
          setLiveMinimized(false);
          showToast('Left live stream');
        }}
      />

      {/* Minimized Floating Room Player */}
      <MinimizedRoomPlayer
        room={roomMinimized ? activeRoom : null}
        onRestore={() => setRoomMinimized(false)}
        onLeave={() => {
          setActiveRoom(null);
          setRoomMinimized(false);
          showToast('Left room');
        }}
      />

      {/* Consistent 7-Item Bottom Navigation on Main Tabs */}
      {showBottomNav && (
        <BottomNav
          activeTab={activeTab}
          onSelectTab={handleSelectTab}
          onOpenCreate={() => setCreateMenuOpen(true)}
          unreadCount={totalUnreadInbox}
        />
      )}

      {/* Central Create (+) Menu — Strictly 3 Options */}
      <CreateActionMenu
        open={createMenuOpen}
        onClose={() => setCreateMenuOpen(false)}
        onSelectUploadVideo={() => {
          setCreateMenuOpen(false);
          setScreen('upload-video');
        }}
        onSelectGoLive={() => {
          setCreateMenuOpen(false);
          setScreen('go-live');
        }}
        onSelectCreateRoom={() => {
          setCreateMenuOpen(false);
          setScreen('create-room');
        }}
      />

      {/* Full Live Streaming Room (Viewer & Host Modes + Minimize) */}
      {activeStream && (
        <LiveRoomScreen
          stream={activeStream.stream}
          isHost={activeStream.isHost}
          minimized={liveMinimized}
          userCoins={profile.coins}
          username={profile.username}
          userLevel={profile.level}
          onMinimize={() => {
            setLiveMinimized(true);
            showToast('Live minimized — tap floating card to return');
          }}
          onCloseViewer={() => {
            setActiveStream(null);
            setLiveMinimized(false);
          }}
          onCompleteEndLive={handleCompleteEndLive}
          onSendGift={handleSendGift}
          onOpenUserInfo={(u) => setUserInfoTarget(u)}
          onAddActivityXp={(amt) => addActivityXp(amt)}
        />
      )}

      {/* Post-Live Summary Screen */}
      <LiveSummaryModal
        summary={liveSummary}
        hostAvatar={profile.avatar}
        hostName={profile.username}
        onDone={() => setLiveSummary(null)}
      />

      {/* Party Room Lounge with Host Management, Settings, Invites & Gifting */}
      <RoomLoungeModal
        room={activeRoom}
        minimized={roomMinimized}
        userAvatar={profile.avatar}
        username={profile.username}
        userLevel={profile.level}
        userCoins={profile.coins}
        onMinimize={() => {
          setRoomMinimized(true);
          showToast('Room minimized — tap floating bar to return');
        }}
        onLeaveRoom={() => {
          setActiveRoom(null);
          setRoomMinimized(false);
          showToast('Left room');
        }}
        onEndParty={handleEndParty}
        onUpdateRoom={handleUpdateRoom}
        onSendGift={handleSendGift}
        onOpenUserInfo={(u) => setUserInfoTarget(u)}
        onAddActivityXp={(amt) => addActivityXp(amt)}
      />

      <StorePreviewModal
        item={previewStoreItem}
        userAvatar={profile.avatar}
        username={profile.username}
        onClose={() => setPreviewStoreItem(null)}
        onBuyOrSelect={handlePurchaseOrEquipStoreItem}
      />

      <VideoPlayerModal
        video={playingVideo}
        onClose={() => setPlayingVideo(null)}
      />

      <UserInfoModal
        user={userInfoTarget}
        onClose={() => setUserInfoTarget(null)}
        onToggleFollow={() =>
          setUserInfoTarget((prev) =>
            prev ? { ...prev, isFollowing: !prev.isFollowing } : null
          )
        }
        onOpenLevelDetails={() => setScreen('level-details')}
      />

      {/* WebRTC Audio / Video Call Overlay + Server Billing */}
      <CallOverlay
        pendingConsent={pendingCallConsent}
        incomingCall={incomingCall}
        activeCall={activeCall}
        economy={economy}
        userCoins={profile.coins}
        wsRef={wsRef}
        onCancelConsent={() => setPendingCallConsent(null)}
        onConfirmStartCall={handleConfirmStartCall}
        onAcceptIncoming={() => {
          if (!incomingCall) return;
          setActiveCall({
            callId: incomingCall.callId,
            peerName: incomingCall.peerName,
            peerAvatar: incomingCall.peerAvatar,
            peerLevel: incomingCall.peerLevel,
            callType: incomingCall.callType,
            direction: 'incoming',
            ratePerMin:
              incomingCall.callType === 'video'
                ? economy.videoCallCoinsPerMin
                : economy.audioCallCoinsPerMin,
            totalCharged: 0,
          });
          setIncomingCall(null);
        }}
        onDeclineIncoming={() => setIncomingCall(null)}
        onCallTick={handleCallTick}
        onEndCall={handleEndCall}
        onOpenWallet={() => setScreen('wallet')}
      />

      {/* Non-blocking Status Toast */}
      {toastMessage && (
        <div
          role="status"
          className="fixed top-16 left-1/2 -translate-x-1/2 z-[70] px-4 py-2 rounded-full bg-[#1C0F36]/95 backdrop-blur-md border border-amber-400/55 text-xs font-semibold text-amber-200 shadow-xl whitespace-nowrap"
        >
          {toastMessage}
        </div>
      )}
    </div>
  );
}
