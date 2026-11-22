import { useEffect, useMemo, useRef, useState } from 'react';
import { User } from 'firebase/auth';
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
import { AccountSettingsScreen } from './screens/AccountSettingsScreen';
import { AdminDiagnosticsScreen } from './screens/AdminDiagnosticsScreen';
import {
  AuthFlowScreen,
  AuthScreenMode,
  EmailVerificationBanner,
  GuestRestrictionModal,
  SplashScreen,
} from './screens/AuthScreens';
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
import { apiClient } from './services/apiClient';
import {
  auth,
  changeAccountPassword,
  deleteCurrentFirebaseAccount,
  initializeExtendedFirebaseServices,
  isVerifiedAdminUser,
  linkGuestWithGoogle,
  requestFcmPushToken,
  resendVerificationEmail,
  sendPasswordReset,
  signInAsGuest,
  signInWithEmail,
  signInWithFacebook,
  signInWithGoogle,
  signOutFirebase,
  signUpWithEmail,
  submitReportToFirestore,
  subscribeAuth,
  syncUserProfileToFirestore,
} from './services/firebase';
import {
  AchievementBadge,
  ActiveUserItem,
  AppScreen,
  BlockedUserItem,
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
  ProfileThemeId,
  ReportHistoryItem,
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

  // Boot Splash & Firebase Authentication State
  const [splashVisible, setSplashVisible] = useState(true);
  const [authUser, setAuthUser] = useState<User | null>(null);
  const [authReady, setAuthReady] = useState(false);
  const [authModalOpen, setAuthModalOpen] = useState(false);
  const [authModalMode, setAuthModalMode] = useState<AuthScreenMode>('welcome');
  const [guestPromptAction, setGuestPromptAction] = useState<string | null>(null);

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
  const [blockedUsers, setBlockedUsers] = useState<BlockedUserItem[]>([]);
  const [reportHistory, setReportHistory] = useState<ReportHistoryItem[]>([]);
  const [language, setLanguage] = useState('English');

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
  const activeCallRef = useRef<ActiveCallSessionUI | null>(null);
  activeCallRef.current = activeCall;

  const isGuest = !authUser || authUser.isAnonymous;
  const isAdmin = isVerifiedAdminUser(authUser);
  const linkedProviders = useMemo(
    () => authUser?.providerData?.map((p) => p.providerId) || [],
    [authUser]
  );

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => {
      setToastMessage((curr) => (curr === msg ? null : curr));
    }, 3000);
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

  // Boot Splash Timer
  useEffect(() => {
    const t = setTimeout(() => setSplashVisible(false), 500);
    return () => clearTimeout(t);
  }, []);

  // Firebase Auth Subscription & Header Injection
  useEffect(() => {
    const unsub = subscribeAuth((user) => {
      setAuthUser(user);
      setAuthReady(true);

      apiClient.setAuthHeadersProvider(() => ({
        'x-mizo-user-id': user?.uid || profile.userId,
        ...(user?.email ? { 'x-mizo-admin-email': user.email } : {}),
        'x-mizo-email-verified': String(Boolean(user?.emailVerified)),
      }));

      if (user && !user.isAnonymous) {
        setAuthModalOpen(false);
        const nextUsername =
          user.displayName?.trim() ||
          (user.email ? user.email.split('@')[0] : '') ||
          profile.username;
        setProfile((prev) => ({
          ...prev,
          username: prev.username === INITIAL_PROFILE.username ? nextUsername : prev.username,
          avatar:
            user.photoURL && prev.avatar === INITIAL_PROFILE.avatar
              ? user.photoURL
              : prev.avatar,
        }));
      }
    });

    initializeExtendedFirebaseServices().catch(() => {});

    return () => unsub();
  }, []);

  // Open Welcome/Auth Screen on fresh unauthenticated load once splash ends
  useEffect(() => {
    if (authReady && !splashVisible && !authUser) {
      setAuthModalMode('welcome');
      setAuthModalOpen(true);
    }
  }, [authReady, splashVisible, authUser]);

  // Load configurable server economy & wallet on mount + connect WebSocket signaling
  useEffect(() => {
    apiClient.get<{ economy: EconomyConfig }>('/api/config').then((res) => {
      if (res.ok && res.data?.economy) {
        setEconomy(res.data.economy);
      }
    });

    const walletUserId = authUser?.uid || profile.userId;
    apiClient
      .get<ServerWalletAccount>(`/api/wallet?userId=${encodeURIComponent(walletUserId)}`)
      .then((res) => {
        if (res.ok && res.data && typeof res.data.coins === 'number') {
          syncAccountFromServer(res.data);
        }
      });
  }, [authUser?.uid]);

  useEffect(() => {
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
        } else if (
          msg.type === 'call:end' &&
          activeCallRef.current?.callId === msg.callId
        ) {
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
  }, [profile.userId]);

  const requireAuthenticatedAction = (actionLabel: string): boolean => {
    if (!isGuest) return true;
    setGuestPromptAction(actionLabel);
    return false;
  };

  // Auth Flow Handlers
  const handleGoogleLogin = async () => {
    try {
      await signInWithGoogle();
      setAuthModalOpen(false);
      showToast('Signed in with Google');
      return { ok: true };
    } catch (err: any) {
      return { ok: false, error: err?.message || 'Google sign-in cancelled or failed.' };
    }
  };

  const handleFacebookLogin = async () => {
    try {
      await signInWithFacebook();
      setAuthModalOpen(false);
      showToast('Signed in with Facebook');
      return { ok: true };
    } catch (err: any) {
      return {
        ok: false,
        error:
          err?.message ||
          'Facebook sign-in failed. Ensure Facebook provider is enabled in Firebase Console.',
      };
    }
  };

  const handleEmailLogin = async (email: string, password: string) => {
    try {
      await signInWithEmail(email, password);
      setAuthModalOpen(false);
      showToast('Welcome back to Mizo Live');
      return { ok: true };
    } catch (err: any) {
      return { ok: false, error: err?.message || 'Invalid email or password.' };
    }
  };

  const handleEmailSignup = async (email: string, password: string, username: string) => {
    try {
      await signUpWithEmail(email, password, username);
      if (username.trim()) {
        setProfile((prev) => ({ ...prev, username: username.trim() }));
      }
      setAuthModalOpen(false);
      showToast('Account created — check inbox to verify email');
      return { ok: true };
    } catch (err: any) {
      return { ok: false, error: err?.message || 'Could not create account.' };
    }
  };

  const handleForgotPassword = async (email: string) => {
    try {
      await sendPasswordReset(email);
      return { ok: true };
    } catch (err: any) {
      return { ok: false, error: err?.message || 'Failed to send reset link.' };
    }
  };

  const handleGuestExplore = async () => {
    try {
      await signInAsGuest();
    } catch {
      // Allow local guest browsing even if Anonymous Auth is disabled in Firebase Console
    }
    setAuthModalOpen(false);
    showToast('Exploring Mizo Live as Guest');
    return { ok: true };
  };

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

  const mapFeedToUserVideo = (v: FeedVideo, label: string): UserVideo => ({
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
    createdAt: label,
  });

  const savedVideos = useMemo<UserVideo[]>(
    () => feedVideos.filter((v) => v.isSaved).map((v) => mapFeedToUserVideo(v, 'Saved')),
    [feedVideos]
  );

  const likedVideos = useMemo<UserVideo[]>(
    () => feedVideos.filter((v) => v.isLiked).map((v) => mapFeedToUserVideo(v, 'Liked')),
    [feedVideos]
  );

  const repostedVideos = useMemo<UserVideo[]>(
    () =>
      feedVideos.filter((v) => v.isReposted).map((v) => mapFeedToUserVideo(v, 'Reposted')),
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
    if (!requireAuthenticatedAction('recharge coins')) return;
    const res = await apiClient.post<{ account?: ServerWalletAccount; added?: number }>(
      '/api/wallet/recharge',
      { userId: authUser?.uid || profile.userId, packageId }
    );
    if (res.ok && res.data?.account) {
      syncAccountFromServer(res.data.account);
      showToast(`+${(res.data.added || 0).toLocaleString()} Sandbox Coins added`);
    } else {
      showToast(res.error || 'Recharge failed');
    }
  };

  // Store Equip / Unequip Toggle (All 8 Categories)
  const applyStoreItemEquipState = (item: StoreItem, forceEquip?: boolean) => {
    const isFrameCat =
      item.category === 'VIP Frames' || item.category === 'Animated Frames';
    const isAssetCat =
      item.category === 'Premium Assets' || item.category === 'Profile Decorations';

    const currentlyEquipped =
      (isFrameCat && profile.equippedFrameId === item.id) ||
      (item.category === 'Special Entry' && profile.equippedEntryId === item.id) ||
      (isAssetCat && profile.equippedAssetId === item.id) ||
      (item.category === 'Name Decorations' && profile.equippedNameDecorId === item.id) ||
      (item.category === 'Special Badges' && profile.equippedSpecialBadgeId === item.id);

    const nextEquipped = forceEquip !== undefined ? forceEquip : !currentlyEquipped;

    setStoreItems((prev) =>
      prev.map((s) => {
        if (s.id === item.id) {
          return { ...s, owned: true, equipped: nextEquipped };
        }
        const sameSlot =
          (isFrameCat &&
            (s.category === 'VIP Frames' || s.category === 'Animated Frames')) ||
          (isAssetCat &&
            (s.category === 'Premium Assets' || s.category === 'Profile Decorations')) ||
          s.category === item.category;
        return sameSlot && nextEquipped ? { ...s, equipped: false } : s;
      })
    );

    setProfile((prev) => {
      const next: UserProfile = {
        ...prev,
        equippedFrameId: isFrameCat
          ? nextEquipped
            ? item.id
            : null
          : prev.equippedFrameId,
        equippedEntryId:
          item.category === 'Special Entry'
            ? nextEquipped
              ? item.id
              : null
            : prev.equippedEntryId,
        equippedAssetId: isAssetCat
          ? nextEquipped
            ? item.id
            : null
          : prev.equippedAssetId,
        equippedNameDecorId:
          item.category === 'Name Decorations'
            ? nextEquipped
              ? item.id
              : null
            : prev.equippedNameDecorId,
        equippedSpecialBadgeId:
          item.category === 'Special Badges'
            ? nextEquipped
              ? item.id
              : null
            : prev.equippedSpecialBadgeId,
      };
      syncUserProfileToFirestore(next).catch(() => {});
      return next;
    });

    return nextEquipped;
  };

  // Store Purchase / Equip Handler (Server-authoritative)
  const handlePurchaseOrEquipStoreItem = async (
    item: StoreItem
  ): Promise<{ ok: boolean; insufficient?: boolean }> => {
    if (item.owned) {
      const equippedNow = applyStoreItemEquipState(item);
      showToast(equippedNow ? `${item.name} equipped!` : `${item.name} unequipped`);
      return { ok: true };
    }

    if (!requireAuthenticatedAction(`purchase ${item.name}`)) {
      return { ok: false };
    }

    const res = await apiClient.post<{ account?: ServerWalletAccount }>(
      '/api/store/purchase',
      { userId: authUser?.uid || profile.userId, itemId: item.id }
    );
    if (res.status === 402) {
      return { ok: false, insufficient: true };
    }
    if (!res.ok) {
      showToast(res.error || 'Purchase failed');
      return { ok: false };
    }
    if (res.data?.account) syncAccountFromServer(res.data.account);
    applyStoreItemEquipState(item, true);
    showToast(`Purchased & equipped ${item.name}!`);
    return { ok: true };
  };

  // Server-Validated Gift Sending (Live & Rooms)
  const handleSendGift = async (gift: GiftItem, recipient: string): Promise<boolean> => {
    if (!requireAuthenticatedAction('send gifts')) return false;
    if (profile.coins < gift.price) {
      showToast('Insufficient coin balance — recharge in Wallet');
      return false;
    }
    const res = await apiClient.post<{ account?: ServerWalletAccount }>(
      '/api/gifts/send',
      {
        userId: authUser?.uid || profile.userId,
        giftId: gift.id,
        recipientName: recipient,
      }
    );
    if (!res.ok) {
      showToast(res.error || 'Insufficient coins');
      return false;
    }
    if (res.data?.account) syncAccountFromServer(res.data.account);
    addActivityXp(LEVEL_CONFIG.xpRewards.sendGiftBonus);
    showToast(`Sent ${gift.name} to ${recipient}`);
    return true;
  };

  // Coin-Based Audio / Video Call Flow
  const handleConfirmStartCall = async (
    peerName: string,
    peerAvatar: string,
    peerLevel: number,
    callType: 'audio' | 'video'
  ) => {
    if (!requireAuthenticatedAction(`start a ${callType} call`)) return;
    const res = await apiClient.post<{
      account?: ServerWalletAccount;
      session?: { callId: string; ratePerMin: number; totalCharged: number };
    }>('/api/calls/start', {
      userId: authUser?.uid || profile.userId,
      calleeName: peerName,
      callType,
      consentConfirmed: true,
    });
    if (!res.ok || !res.data?.session) {
      showToast(res.error || 'Unable to start call');
      return;
    }
    if (res.data.account) syncAccountFromServer(res.data.account);
    setPendingCallConsent(null);
    setActiveCall({
      callId: res.data.session.callId,
      peerName,
      peerAvatar,
      peerLevel,
      callType,
      direction: 'outgoing',
      ratePerMin: res.data.session.ratePerMin,
      totalCharged: res.data.session.totalCharged,
    });

    if (wsRef.current?.readyState === WebSocket.OPEN) {
      wsRef.current.send(
        JSON.stringify({
          type: 'call:invite',
          callId: res.data.session.callId,
          callerName: profile.username,
          callerAvatar: profile.avatar,
          callerLevel: profile.level,
          callType,
        })
      );
    }
  };

  const handleCallTick = async (callId: string): Promise<boolean> => {
    const res = await apiClient.post<{
      account?: ServerWalletAccount;
      session?: { totalCharged: number };
    }>('/api/calls/tick', { callId });
    if (!res.ok || !res.data?.session) {
      showToast(res.error || 'Insufficient coins — call ending');
      return false;
    }
    if (res.data.account) syncAccountFromServer(res.data.account);
    setActiveCall((prev) =>
      prev && prev.callId === callId
        ? { ...prev, totalCharged: res.data!.session!.totalCharged }
        : prev
    );
    return true;
  };

  const handleEndCall = async (
    callId: string,
    durationDisplay: string,
    totalCharged: number
  ) => {
    const endingCall = activeCall;
    setActiveCall(null);

    const res = await apiClient.post<{ account?: ServerWalletAccount }>(
      '/api/calls/end',
      { callId }
    );
    if (res.ok && res.data?.account) {
      syncAccountFromServer(res.data.account);
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
    setProfile((prev) => {
      const next = { ...prev, ...updates };
      syncUserProfileToFirestore(next).catch(() => {});
      return next;
    });
    setScreen('profile');
    showToast('Profile updated');
  };

  const handleUpdatePrivacyAndTheme = (
    profilePrivacy: UserProfile['profilePrivacy'],
    profileTheme: ProfileThemeId
  ) => {
    setProfile((prev) => {
      const next = { ...prev, profilePrivacy, profileTheme };
      syncUserProfileToFirestore(next).catch(() => {});
      return next;
    });
    showToast('Privacy & theme updated');
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

  // Moderation: Block & Report
  const handleBlockUser = (name: string, reason: string) => {
    setBlockedUsers((prev) => {
      if (prev.some((b) => b.name.toLowerCase() === name.toLowerCase())) return prev;
      return [
        {
          id: `blk-${Date.now()}`,
          name,
          reason,
          blockedAt: 'Just now',
        },
        ...prev,
      ];
    });
    showToast(`Blocked ${name}`);
  };

  const handleReportTarget = async (
    targetName: string,
    targetType: 'user' | 'live' | 'room' | 'video',
    reason: string
  ) => {
    const res = await apiClient.post<{ report?: ReportHistoryItem }>('/api/reports', {
      userId: authUser?.uid || profile.userId,
      targetName,
      targetType,
      reason,
    });
    const rec: ReportHistoryItem = res.data?.report || {
      id: `rep-${Date.now()}`,
      targetName,
      targetType,
      reason,
      status: 'open',
      timestamp: 'Just now',
    };
    setReportHistory((prev) => [rec, ...prev]);
    submitReportToFirestore({
      targetId: targetName,
      targetName,
      targetType,
      reason,
    }).catch(() => {});
    showToast('Moderation report submitted');
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

      {/* Email Verification Reminder Banner */}
      {authUser && !authUser.isAnonymous && authUser.email && !authUser.emailVerified && (
        <div className="relative z-30">
          <EmailVerificationBanner
            email={authUser.email}
            onResend={async () => {
              try {
                await resendVerificationEmail();
                showToast('Verification email sent');
              } catch (err: any) {
                showToast(err?.message || 'Could not resend verification email');
              }
            }}
            onRefresh={async () => {
              if (auth.currentUser) {
                await auth.currentUser.reload();
                setAuthUser({ ...auth.currentUser } as User);
                showToast(
                  auth.currentUser.emailVerified
                    ? 'Email verified!'
                    : 'Still awaiting email verification'
                );
              }
            }}
          />
        </div>
      )}

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
            equippedNameDecorId={profile.equippedNameDecorId}
            equippedSpecialBadgeId={profile.equippedSpecialBadgeId}
            transactions={wallet.transactions}
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
            onStartCall={(peerName, peerAvatar, peerLevel, callType) => {
              if (!requireAuthenticatedAction(`start a ${callType} call`)) return;
              setPendingCallConsent({ peerName, peerAvatar, peerLevel, callType });
            }}
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
            likedVideos={likedVideos}
            repostedVideos={repostedVideos}
            onEditProfile={() => setScreen('edit-profile')}
            onPlayVideo={(v) => setPlayingVideo(v)}
            onOpenCreateVideo={() => {
              if (!requireAuthenticatedAction('upload a video')) return;
              setScreen('upload-video');
            }}
            onOpenStore={() => setScreen('store')}
            onOpenLevels={() => setScreen('level-details')}
            onOpenAchievements={() => setScreen('achievements')}
            onOpenAgency={() => setScreen('agency')}
            onOpenWallet={() => setScreen('wallet')}
            onOpenRankings={() => setScreen('rankings')}
            onOpenSettings={() => setScreen('account-settings')}
            onOpenCallHistory={() => {
              setInboxInitialTab('Calls');
              setScreen('chat');
            }}
            onShareProfile={() => {
              if (navigator.clipboard) {
                navigator.clipboard
                  .writeText(`${window.location.origin}/@${profile.userId}`)
                  .catch(() => {});
              }
              showToast('Profile link copied!');
            }}
            onToggleEquipStoreItem={(item) => {
              const equippedNow = applyStoreItemEquipState(item);
              showToast(equippedNow ? `${item.name} equipped!` : `${item.name} unequipped`);
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

        {screen === 'account-settings' && (
          <AccountSettingsScreen
            profile={profile}
            authEmail={authUser?.email || null}
            isGuest={isGuest}
            isAdmin={isAdmin}
            linkedProviders={linkedProviders}
            notificationPrefs={notificationPrefs}
            blockedUsers={blockedUsers}
            reportHistory={reportHistory}
            language={language}
            onBack={() => setScreen('profile')}
            onEditProfile={() => setScreen('edit-profile')}
            onChangePassword={async (currPwd, nextPwd) => {
              try {
                await changeAccountPassword(currPwd, nextPwd);
                showToast('Password updated');
                return { ok: true };
              } catch (err: any) {
                return { ok: false, error: err?.message || 'Password update failed.' };
              }
            }}
            onLinkGoogle={async () => {
              try {
                await linkGuestWithGoogle();
                showToast('Google account linked');
                return { ok: true };
              } catch (err: any) {
                showToast(err?.message || 'Google link failed');
                return { ok: false, error: err?.message };
              }
            }}
            onUpdatePrivacy={handleUpdatePrivacyAndTheme}
            onUnblockUser={(id) => {
              setBlockedUsers((prev) => prev.filter((b) => b.id !== id));
              showToast('User unblocked');
            }}
            onUpdateNotifPrefs={(next) => {
              setNotificationPrefs(next);
              showToast('Notification preferences saved');
            }}
            onChangeLanguage={(lang) => {
              setLanguage(lang);
              showToast(`Language set to ${lang}`);
            }}
            onEnablePushNotifications={async () => {
              const res = await requestFcmPushToken();
              showToast(
                res.ok
                  ? 'Push notifications enabled (FCM)'
                  : res.reason || 'Push notifications unavailable'
              );
            }}
            onOpenAdminDiagnostics={() => {
              if (isAdmin) setScreen('admin-diagnostics');
            }}
            onLogout={async () => {
              await signOutFirebase().catch(() => {});
              setAuthUser(null);
              setScreen('home');
              setAuthModalMode('welcome');
              setAuthModalOpen(true);
              showToast('Logged out');
            }}
            onDeleteAccount={async () => {
              try {
                await deleteCurrentFirebaseAccount();
                setAuthUser(null);
                setScreen('home');
                setAuthModalMode('welcome');
                setAuthModalOpen(true);
                showToast('Account deleted');
                return { ok: true };
              } catch (err: any) {
                showToast(err?.message || 'Recent login required to delete account');
                return { ok: false, error: err?.message };
              }
            }}
          />
        )}

        {screen === 'admin-diagnostics' && (
          <AdminDiagnosticsScreen
            isAdmin={isAdmin}
            adminEmail={authUser?.email || null}
            onBack={() => setScreen('account-settings')}
          />
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
          if (!requireAuthenticatedAction('upload a video')) return;
          setScreen('upload-video');
        }}
        onSelectGoLive={() => {
          setCreateMenuOpen(false);
          if (!requireAuthenticatedAction('go live')) return;
          setScreen('go-live');
        }}
        onSelectCreateRoom={() => {
          setCreateMenuOpen(false);
          if (!requireAuthenticatedAction('create a party room')) return;
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
          userVipLevel={profile.vipLevel}
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
          onBlockUser={handleBlockUser}
          onReportTarget={handleReportTarget}
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

      {/* WebRTC / Agora Audio / Video Call Overlay + Server Billing */}
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

      {/* Auth, Splash & Guest Gate */}
      <SplashScreen visible={splashVisible} />

      <AuthFlowScreen
        key={`${authModalOpen ? 'open' : 'closed'}-${authModalMode}`}
        open={authModalOpen}
        initialMode={authModalMode}
        onGoogleLogin={handleGoogleLogin}
        onFacebookLogin={handleFacebookLogin}
        onEmailLogin={handleEmailLogin}
        onEmailSignup={handleEmailSignup}
        onForgotPassword={handleForgotPassword}
        onGuestExplore={handleGuestExplore}
        onClose={authUser ? () => setAuthModalOpen(false) : undefined}
      />

      <GuestRestrictionModal
        actionLabel={guestPromptAction}
        onClose={() => setGuestPromptAction(null)}
        onSignInGoogle={() => {
          handleGoogleLogin();
        }}
        onOpenAuthModal={() => {
          setAuthModalMode('login');
          setAuthModalOpen(true);
        }}
      />

      {/* Non-blocking Status Toast */}
      {toastMessage && (
        <div
          role="status"
          className="fixed top-16 left-1/2 -translate-x-1/2 z-[95] px-4 py-2 rounded-full bg-[#1C0F36]/95 backdrop-blur-md border border-amber-400/55 text-xs font-semibold text-amber-200 shadow-xl whitespace-nowrap"
        >
          {toastMessage}
        </div>
      )}
    </div>
  );
}
