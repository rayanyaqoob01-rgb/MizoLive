export type MainTab = 'home' | 'rooms' | 'store' | 'videos' | 'chat' | 'profile';

export type AppScreen =
  | MainTab
  | 'edit-profile'
  | 'upload-video'
  | 'go-live'
  | 'create-room'
  | 'level-details'
  | 'wallet'
  | 'agency'
  | 'rankings'
  | 'achievements'
  | 'account-settings'
  | 'admin-diagnostics';

export type RoomCategory = 'All' | 'Popular' | 'Hot' | 'New' | 'Recommended';

export type StoreCategory =
  | 'VIP Frames'
  | 'Special Entry'
  | 'Custom Gift'
  | 'Premium Assets'
  | 'Profile Decorations'
  | 'Animated Frames'
  | 'Name Decorations'
  | 'Special Badges';

export type InboxTab = 'All' | 'Messages' | 'Requests' | 'Notifications' | 'Calls';
export type ProfileVideoTab = 'public' | 'private' | 'saved' | 'liked' | 'reposted';
export type RoomSeatLayout = 4 | 6 | 9 | 12;

export interface ActiveUserItem {
  id: string;
  name: string;
  handle: string;
  avatar: string;
  level: number;
  status: string;
  isLive?: boolean;
}

export interface LiveStream {
  id: string;
  username: string;
  hostLevel: number;
  title: string;
  viewers: number;
  viewerDisplay: string;
  thumbnail: string;
  avatar: string;
  category: string;
  section: 'Live Now' | 'Popular Live' | 'Recommended Live';
  isVerified?: boolean;
  roomTopic?: string;
}

export interface RoomParticipant {
  id: string;
  name: string;
  avatar: string;
  level: number;
  role: 'Host' | 'Moderator' | 'Speaker' | 'Listener';
  isMuted?: boolean;
  canSpeak?: boolean;
  canVideo?: boolean;
}

export interface RoomSeatItem {
  seatIndex: number;
  occupantId: string | null;
  occupantName: string | null;
  occupantAvatar: string | null;
  occupantLevel: number;
  isHostSeat?: boolean;
  isMuted: boolean;
  isLocked: boolean;
  hasVideo?: boolean;
}

export interface RoomItem {
  id: string;
  name: string;
  description: string;
  coverImage: string;
  hostName: string;
  hostAvatar: string;
  hostLevel: number;
  roomType: 'Public' | 'VIP' | 'Music' | 'Chat';
  seatCapacity?: RoomSeatLayout;
  isUserHost?: boolean;
  participants: number;
  participantDisplay: string;
  category: Exclude<RoomCategory, 'All'>;
  homeSection?: 'Popular Rooms' | 'Recommended Rooms';
  isJoined?: boolean;
}

export interface StoreItem {
  id: string;
  name: string;
  category: StoreCategory;
  price: number;
  subtitle: string;
  accentStyle:
    | 'royal-crown'
    | 'golden-wings'
    | 'diamond-aura'
    | 'amethyst-flame'
    | 'gold-wreath'
    | 'neon-halo';
  isAnimated?: boolean;
  owned?: boolean;
  equipped?: boolean;
}

export interface ChatMessage {
  id: string;
  sender: 'me' | 'them';
  text: string;
  imageUrl?: string;
  status?: 'Sent' | 'Delivered' | 'Read';
  timestamp: string;
}

export interface InboxItem {
  id: string;
  type: 'message' | 'request' | 'notification';
  notifCategory?:
    | 'messages'
    | 'calls'
    | 'live'
    | 'rooms'
    | 'pk'
    | 'gifts'
    | 'follows'
    | 'system';
  senderName: string;
  senderLevel?: number;
  avatar?: string;
  iconType?: 'gift' | 'system' | 'mizo' | 'call' | 'pk';
  preview: string;
  timestamp: string;
  unreadCount: number;
  messages?: ChatMessage[];
}

export interface CallRecord {
  id: string;
  peerName: string;
  peerAvatar: string;
  peerLevel: number;
  callType: 'audio' | 'video';
  direction: 'outgoing' | 'incoming' | 'missed';
  durationDisplay: string;
  coinsBilled: number;
  timestamp: string;
}

export interface NotificationPrefs {
  messages: boolean;
  calls: boolean;
  live: boolean;
  rooms: boolean;
  pk: boolean;
  gifts: boolean;
  follows: boolean;
  system: boolean;
}

export interface UserVideo {
  id: string;
  title: string;
  description?: string;
  privacy: 'Public' | 'Private';
  thumbnail: string;
  videoUrl?: string;
  duration: string;
  views: string;
  likes: string;
  creatorName: string;
  createdAt: string;
}

export interface VideoCommentReply {
  id: string;
  username: string;
  avatar: string;
  level: number;
  text: string;
  timestamp: string;
}

export interface VideoComment {
  id: string;
  username: string;
  avatar: string;
  level: number;
  text: string;
  timestamp: string;
  replies?: VideoCommentReply[];
}

export interface FeedVideo {
  id: string;
  creatorName: string;
  creatorHandle: string;
  creatorAvatar: string;
  creatorLevel: number;
  isFollowing: boolean;
  description: string;
  audioTitle: string;
  thumbnail: string;
  videoUrl?: string;
  likes: number;
  isLiked: boolean;
  isSaved: boolean;
  comments: VideoComment[];
  shares: number;
  reposts: number;
  isReposted: boolean;
}

export type GiftCategory =
  | 'Popular Gifts'
  | 'Love Gifts'
  | 'Premium Gifts'
  | 'VIP Gifts'
  | 'Special Gifts';

export interface GiftItem {
  id: string;
  name: string;
  category: GiftCategory;
  price: number;
  iconKey: 'rose' | 'crown' | 'wings' | 'castle' | 'star' | 'dragon';
  pkPoints: number;
}

export interface GiftHistoryRecord {
  id: string;
  senderName: string;
  senderLevel: number;
  recipientName: string;
  giftName: string;
  giftPrice: number;
  iconKey: GiftItem['iconKey'];
  timestamp: string;
}

export interface PkOpponent {
  id: string;
  username: string;
  avatar: string;
  level: number;
  viewers: string;
}

export type VideoFilterMode =
  | 'Natural'
  | 'Beauty'
  | 'Smooth'
  | 'Warm'
  | 'Cool'
  | 'Royal'
  | 'Vivid';
export type VisualEffectMode = 'None' | 'Golden Sparkles' | 'Neon Aura' | 'Crown Halo';
export type BackgroundEffectMode = 'None' | 'Studio Blur' | 'Royal Stage';

export interface HostControlState {
  cameraOn: boolean;
  facingMode: 'front' | 'rear';
  rotationDeg: 0 | 90 | 180 | 270;
  micOn: boolean;
  flashOn: boolean;
  filter: VideoFilterMode;
  effect: VisualEffectMode;
  backgroundEffect: BackgroundEffectMode;
}

export interface LiveSessionSummary {
  title: string;
  durationDisplay: string;
  totalViewers: number;
  peakViewers: number;
  totalLikes: number;
  giftsReceivedCount: number;
  giftsReceivedCoins: number;
  newFollowers: number;
}

export interface AchievementBadge {
  id: string;
  name: string;
  description: string;
  icon: string;
  progress: number;
  target: number;
  earned: boolean;
  equipped: boolean;
  earnedAt?: string;
}

export interface EconomyConfig {
  audioCallCoinsPerMin: number;
  videoCallCoinsPerMin: number;
  platformCommissionPct: number;
  coinPackages: Array<{
    id: string;
    coins: number;
    bonus: number;
    priceUsd: string;
    label: string;
  }>;
}

export interface LedgerTx {
  id: string;
  type:
    | 'recharge'
    | 'gift_sent'
    | 'gift_received'
    | 'store_purchase'
    | 'call_charge'
    | 'call_earning';
  title: string;
  amount: number;
  direction: 'in' | 'out';
  meta?: string;
  timestamp: string;
}

export interface ServerWalletAccount {
  userId: string;
  coins: number;
  spentCoins: number;
  receivedCoins: number;
  callEarnings: number;
  ownedItemIds: string[];
  transactions: LedgerTx[];
}

export interface BlockedUserItem {
  id: string;
  name: string;
  reason: string;
  blockedAt: string;
}

export interface ReportHistoryItem {
  id: string;
  targetName: string;
  targetType: 'user' | 'live' | 'room' | 'video';
  reason: string;
  status: 'open' | 'reviewed';
  timestamp: string;
}

export type ProfileThemeId =
  | 'royal-purple'
  | 'obsidian-gold'
  | 'neon-orchid'
  | 'midnight-crown';

export interface UserProfile {
  username: string;
  userId: string;
  bio: string;
  avatar: string;
  coverImage: string;
  followers: number;
  following: number;
  likes: string;
  totalProfileViews: number;
  accountCreatedAt: string;
  profileTheme: ProfileThemeId;
  profilePrivacy: 'public' | 'followers' | 'private';
  isVerified: boolean;
  liveSessionsCount: number;
  giftsReceivedCount: number;
  coins: number;
  spentCoins: number;
  level: number;
  xp: number;
  vipLevel: number;
  svipLevel: number;
  equippedFrameId: string | null;
  equippedEntryId: string | null;
  equippedAssetId: string | null;
  equippedNameDecorId?: string | null;
  equippedSpecialBadgeId?: string | null;
}
