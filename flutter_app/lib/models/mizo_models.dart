import 'dart:math' as math;
import 'package:flutter/material.dart';

enum MainTab { home, rooms, store, videos, chat, profile }

enum InboxTab { all, messages, requests, notifications, calls }

enum StoreCategory {
  vipFrames('VIP Frames'),
  animatedFrames('Animated Frames'),
  specialEntry('Special Entry'),
  customGift('Custom Gift'),
  premiumAssets('Premium Assets'),
  profileDecorations('Profile Decorations'),
  nameDecorations('Name Decorations'),
  specialBadges('Special Badges');

  const StoreCategory(this.label);
  final String label;
}

class ActiveUserItem {
  final String id;
  final String name;
  final String handle;
  final String avatar;
  final int level;
  final String status;
  final bool isLive;

  const ActiveUserItem({
    required this.id,
    required this.name,
    required this.handle,
    required this.avatar,
    required this.level,
    required this.status,
    this.isLive = false,
  });
}

class LiveStream {
  final String id;
  final String username;
  final int hostLevel;
  final String title;
  final int viewers;
  final String viewerDisplay;
  final String thumbnail;
  final String avatar;
  final String category;
  final String section;
  final bool isVerified;
  final String roomTopic;

  const LiveStream({
    required this.id,
    required this.username,
    required this.hostLevel,
    required this.title,
    required this.viewers,
    required this.viewerDisplay,
    required this.thumbnail,
    required this.avatar,
    required this.category,
    required this.section,
    this.isVerified = false,
    this.roomTopic = '',
  });
}

class RoomParticipant {
  final String id;
  final String name;
  final String avatar;
  final int level;
  String role;
  bool isMuted;

  RoomParticipant({
    required this.id,
    required this.name,
    required this.avatar,
    required this.level,
    required this.role,
    this.isMuted = false,
  });
}

class RoomSeatItem {
  final int seatIndex;
  String? occupantId;
  String? occupantName;
  String? occupantAvatar;
  int occupantLevel;
  bool isHostSeat;
  bool isMuted;
  bool isLocked;

  RoomSeatItem({
    required this.seatIndex,
    this.occupantId,
    this.occupantName,
    this.occupantAvatar,
    this.occupantLevel = 1,
    this.isHostSeat = false,
    this.isMuted = false,
    this.isLocked = false,
  });
}

class RoomItem {
  final String id;
  String name;
  String description;
  final String coverImage;
  final String hostName;
  final String hostAvatar;
  final int hostLevel;
  String roomType;
  int seatCapacity; // 4, 6, 9, or 12
  final bool isUserHost;
  final int participants;
  final String participantDisplay;
  final String category;

  RoomItem({
    required this.id,
    required this.name,
    required this.description,
    required this.coverImage,
    required this.hostName,
    required this.hostAvatar,
    required this.hostLevel,
    required this.roomType,
    this.seatCapacity = 6,
    this.isUserHost = false,
    required this.participants,
    required this.participantDisplay,
    required this.category,
  });
}

class StoreItem {
  final String id;
  final String name;
  final StoreCategory category;
  final int price;
  final String subtitle;
  final String accentStyle;
  final bool isAnimated;
  bool owned;
  bool equipped;

  StoreItem({
    required this.id,
    required this.name,
    required this.category,
    required this.price,
    required this.subtitle,
    required this.accentStyle,
    this.isAnimated = false,
    this.owned = false,
    this.equipped = false,
  });
}

class GiftItem {
  final String id;
  final String name;
  final String category;
  final int price;
  final String iconKey;
  final int pkPoints;

  const GiftItem({
    required this.id,
    required this.name,
    required this.category,
    required this.price,
    required this.iconKey,
    required this.pkPoints,
  });
}

class GiftHistoryRecord {
  final String id;
  final String senderName;
  final int senderLevel;
  final String recipientName;
  final String giftName;
  final int giftPrice;
  final String iconKey;
  final String timestamp;

  const GiftHistoryRecord({
    required this.id,
    required this.senderName,
    required this.senderLevel,
    required this.recipientName,
    required this.giftName,
    required this.giftPrice,
    required this.iconKey,
    required this.timestamp,
  });
}

class PkOpponent {
  final String id;
  final String username;
  final String avatar;
  final int level;
  final String viewers;

  const PkOpponent({
    required this.id,
    required this.username,
    required this.avatar,
    required this.level,
    required this.viewers,
  });
}

class VideoCommentReply {
  final String id;
  final String username;
  final String avatar;
  final int level;
  final String text;
  final String timestamp;

  const VideoCommentReply({
    required this.id,
    required this.username,
    required this.avatar,
    required this.level,
    required this.text,
    required this.timestamp,
  });
}

class VideoComment {
  final String id;
  final String username;
  final String avatar;
  final int level;
  final String text;
  final String timestamp;
  final List<VideoCommentReply> replies;

  VideoComment({
    required this.id,
    required this.username,
    required this.avatar,
    required this.level,
    required this.text,
    required this.timestamp,
    List<VideoCommentReply>? replies,
  }) : replies = replies ?? [];
}

class FeedVideo {
  final String id;
  final String creatorName;
  final String creatorHandle;
  final String creatorAvatar;
  final int creatorLevel;
  bool isFollowing;
  final String description;
  final String audioTitle;
  final String thumbnail;
  final String? videoUrl;
  int likes;
  bool isLiked;
  bool isSaved;
  final List<VideoComment> comments;
  int shares;
  int reposts;
  bool isReposted;

  FeedVideo({
    required this.id,
    required this.creatorName,
    required this.creatorHandle,
    required this.creatorAvatar,
    required this.creatorLevel,
    this.isFollowing = false,
    required this.description,
    required this.audioTitle,
    required this.thumbnail,
    this.videoUrl,
    required this.likes,
    this.isLiked = false,
    this.isSaved = false,
    List<VideoComment>? comments,
    required this.shares,
    required this.reposts,
    this.isReposted = false,
  }) : comments = comments ?? [];
}

class UserVideo {
  final String id;
  final String title;
  final String description;
  final String privacy;
  final String thumbnail;
  final String? videoUrl;
  final String duration;
  final String views;
  final String likes;
  final String creatorName;
  final String createdAt;

  const UserVideo({
    required this.id,
    required this.title,
    required this.description,
    required this.privacy,
    required this.thumbnail,
    this.videoUrl,
    required this.duration,
    required this.views,
    required this.likes,
    required this.creatorName,
    required this.createdAt,
  });
}

class ChatMessage {
  final String id;
  final bool isMe;
  final String text;
  final String timestamp;
  final String status;

  const ChatMessage({
    required this.id,
    required this.isMe,
    required this.text,
    required this.timestamp,
    this.status = 'Delivered',
  });
}

class InboxItem {
  final String id;
  String type; // message, request, notification
  final String senderName;
  final int senderLevel;
  final String? avatar;
  String preview;
  String timestamp;
  int unreadCount;
  final List<ChatMessage> messages;

  InboxItem({
    required this.id,
    required this.type,
    required this.senderName,
    this.senderLevel = 1,
    this.avatar,
    required this.preview,
    required this.timestamp,
    this.unreadCount = 0,
    List<ChatMessage>? messages,
  }) : messages = messages ?? [];
}

class CallRecord {
  final String id;
  final String peerName;
  final String peerAvatar;
  final int peerLevel;
  final String callType; // audio | video
  final String direction; // outgoing | incoming | missed
  final String durationDisplay;
  final int coinsBilled;
  final String timestamp;

  const CallRecord({
    required this.id,
    required this.peerName,
    required this.peerAvatar,
    required this.peerLevel,
    required this.callType,
    required this.direction,
    required this.durationDisplay,
    required this.coinsBilled,
    required this.timestamp,
  });
}

class NotificationPrefs {
  bool messages;
  bool calls;
  bool live;
  bool rooms;
  bool pk;
  bool gifts;
  bool follows;
  bool system;

  NotificationPrefs({
    this.messages = true,
    this.calls = true,
    this.live = true,
    this.rooms = true,
    this.pk = true,
    this.gifts = true,
    this.follows = true,
    this.system = true,
  });
}

class CoinPackage {
  final String id;
  final int coins;
  final int bonus;
  final String priceUsd;
  final String label;

  const CoinPackage({
    required this.id,
    required this.coins,
    required this.bonus,
    required this.priceUsd,
    required this.label,
  });

  factory CoinPackage.fromJson(Map<String, dynamic> json) => CoinPackage(
        id: (json['id'] ?? '').toString(),
        coins: (json['coins'] as num?)?.toInt() ?? 0,
        bonus: (json['bonus'] as num?)?.toInt() ?? 0,
        priceUsd: (json['priceUsd'] ?? '').toString(),
        label: (json['label'] ?? '').toString(),
      );
}

class EconomyConfig {
  final int audioCallCoinsPerMin;
  final int videoCallCoinsPerMin;
  final int platformCommissionPct;
  final List<CoinPackage> coinPackages;

  const EconomyConfig({
    this.audioCallCoinsPerMin = 40,
    this.videoCallCoinsPerMin = 90,
    this.platformCommissionPct = 20,
    this.coinPackages = const [],
  });

  factory EconomyConfig.fromJson(Map<String, dynamic> json) {
    final rawPkgs = (json['coinPackages'] as List?) ?? [];
    return EconomyConfig(
      audioCallCoinsPerMin: (json['audioCallCoinsPerMin'] as num?)?.toInt() ?? 40,
      videoCallCoinsPerMin: (json['videoCallCoinsPerMin'] as num?)?.toInt() ?? 90,
      platformCommissionPct:
          (json['platformCommissionPct'] as num?)?.toInt() ?? 20,
      coinPackages: rawPkgs
          .whereType<Map<String, dynamic>>()
          .map(CoinPackage.fromJson)
          .toList(),
    );
  }
}

class LedgerTx {
  final String id;
  final String type;
  final String title;
  final int amount;
  final String direction; // in | out
  final String? meta;
  final String timestamp;

  const LedgerTx({
    required this.id,
    required this.type,
    required this.title,
    required this.amount,
    required this.direction,
    this.meta,
    required this.timestamp,
  });

  factory LedgerTx.fromJson(Map<String, dynamic> json) => LedgerTx(
        id: (json['id'] ?? '').toString(),
        type: (json['type'] ?? '').toString(),
        title: (json['title'] ?? '').toString(),
        amount: (json['amount'] as num?)?.toInt() ?? 0,
        direction: (json['direction'] ?? 'out').toString(),
        meta: json['meta']?.toString(),
        timestamp: (json['timestamp'] ?? '').toString(),
      );
}

class ServerWalletAccount {
  final String userId;
  final int coins;
  final int spentCoins;
  final int receivedCoins;
  final int callEarnings;
  final List<String> ownedItemIds;
  final List<LedgerTx> transactions;

  const ServerWalletAccount({
    required this.userId,
    required this.coins,
    required this.spentCoins,
    required this.receivedCoins,
    required this.callEarnings,
    required this.ownedItemIds,
    required this.transactions,
  });

  factory ServerWalletAccount.fromJson(Map<String, dynamic> json) {
    final owned = ((json['ownedItemIds'] as List?) ?? [])
        .map((e) => e.toString())
        .toList();
    final txs = ((json['transactions'] as List?) ?? [])
        .whereType<Map<String, dynamic>>()
        .map(LedgerTx.fromJson)
        .toList();
    return ServerWalletAccount(
      userId: (json['userId'] ?? '12345678').toString(),
      coins: (json['coins'] as num?)?.toInt() ?? 0,
      spentCoins: (json['spentCoins'] as num?)?.toInt() ?? 0,
      receivedCoins: (json['receivedCoins'] as num?)?.toInt() ?? 0,
      callEarnings: (json['callEarnings'] as num?)?.toInt() ?? 0,
      ownedItemIds: owned,
      transactions: txs,
    );
  }
}

class AchievementBadge {
  final String id;
  final String name;
  final String description;
  final String icon;
  final int progress;
  final int target;
  final bool earned;
  bool equipped;
  final String? earnedAt;

  AchievementBadge({
    required this.id,
    required this.name,
    required this.description,
    required this.icon,
    required this.progress,
    required this.target,
    required this.earned,
    this.equipped = false,
    this.earnedAt,
  });
}

class BlockedUserItem {
  final String id;
  final String name;
  final String reason;
  final String blockedAt;

  const BlockedUserItem({
    required this.id,
    required this.name,
    required this.reason,
    required this.blockedAt,
  });
}

class ReportHistoryItem {
  final String id;
  final String targetName;
  final String targetType;
  final String reason;
  final String status;
  final String timestamp;

  const ReportHistoryItem({
    required this.id,
    required this.targetName,
    required this.targetType,
    required this.reason,
    required this.status,
    required this.timestamp,
  });

  factory ReportHistoryItem.fromJson(Map<String, dynamic> json) =>
      ReportHistoryItem(
        id: (json['id'] ?? '').toString(),
        targetName: (json['targetName'] ?? '').toString(),
        targetType: (json['targetType'] ?? 'user').toString(),
        reason: (json['reason'] ?? '').toString(),
        status: (json['status'] ?? 'open').toString(),
        timestamp: (json['timestamp'] ?? 'Just now').toString(),
      );
}

class UserProfile {
  String username;
  String userId;
  String bio;
  String avatar;
  String coverImage;
  int followers;
  int following;
  String likes;
  int totalProfileViews;
  String accountCreatedAt;
  String profileTheme;
  String profilePrivacy;
  bool isVerified;
  int liveSessionsCount;
  int giftsReceivedCount;
  int coins;
  int spentCoins;
  int level;
  int xp;
  int vipLevel;
  int svipLevel;
  String? equippedFrameId;
  String? equippedEntryId;
  String? equippedAssetId;
  String? equippedNameDecorId;
  String? equippedSpecialBadgeId;

  UserProfile({
    required this.username,
    required this.userId,
    required this.bio,
    required this.avatar,
    required this.coverImage,
    required this.followers,
    required this.following,
    required this.likes,
    required this.totalProfileViews,
    required this.accountCreatedAt,
    required this.profileTheme,
    required this.profilePrivacy,
    required this.isVerified,
    required this.liveSessionsCount,
    required this.giftsReceivedCount,
    required this.coins,
    required this.spentCoins,
    required this.level,
    required this.xp,
    required this.vipLevel,
    required this.svipLevel,
    this.equippedFrameId,
    this.equippedEntryId,
    this.equippedAssetId,
    this.equippedNameDecorId,
    this.equippedSpecialBadgeId,
  });
}

class LevelTier {
  final String name;
  final int minLevel;
  final int maxLevel;
  final List<Color> colors;
  final String icon;

  const LevelTier({
    required this.name,
    required this.minLevel,
    required this.maxLevel,
    required this.colors,
    required this.icon,
  });
}

class LevelSystem {
  static const int maxLevel = 99;
  static const int baseXp = 100;
  static const double xpStepMultiplier = 1.12;

  static const List<LevelTier> tiers = [
    LevelTier(name: 'Beginner', minLevel: 1, maxLevel: 10, colors: [Color(0xFF475569), Color(0xFF1E293B)], icon: '✦'),
    LevelTier(name: 'Rising Member', minLevel: 11, maxLevel: 20, colors: [Color(0xFF059669), Color(0xFF115E59)], icon: '◈'),
    LevelTier(name: 'Active Member', minLevel: 21, maxLevel: 30, colors: [Color(0xFF0284C7), Color(0xFF1E40AF)], icon: '★'),
    LevelTier(name: 'Advanced Member', minLevel: 31, maxLevel: 40, colors: [Color(0xFF4F46E5), Color(0xFF5B21B6)], icon: '✧'),
    LevelTier(name: 'Elite Member', minLevel: 41, maxLevel: 50, colors: [Color(0xFF9333EA), Color(0xFF86198F)], icon: '❖'),
    LevelTier(name: 'Premium Member', minLevel: 51, maxLevel: 60, colors: [Color(0xFFC026D3), Color(0xFFBE123C)], icon: '✵'),
    LevelTier(name: 'Royal Member', minLevel: 61, maxLevel: 70, colors: [Color(0xFF7E22CE), Color(0xFFF59E0B)], icon: '♛'),
    LevelTier(name: 'Diamond Member', minLevel: 71, maxLevel: 80, colors: [Color(0xFF06B6D4), Color(0xFF6D28D9)], icon: '◆'),
    LevelTier(name: 'Emperor Member', minLevel: 81, maxLevel: 90, colors: [Color(0xFFF59E0B), Color(0xFFBE123C)], icon: '♚'),
    LevelTier(name: 'Legendary Member', minLevel: 91, maxLevel: 99, colors: [Color(0xFFFDE047), Color(0xFF7E22CE)], icon: '👑'),
  ];

  static LevelTier getTier(int level) {
    final clamped = level.clamp(1, maxLevel);
    return tiers.firstWhere(
      (t) => clamped >= t.minLevel && clamped <= t.maxLevel,
      orElse: () => tiers.first,
    );
  }

  static int getXpRequired(int level) {
    final clamped = level.clamp(1, maxLevel);
    final exp = math.min(clamped - 1, 35);
    return (baseXp * math.pow(xpStepMultiplier, exp) + (clamped - 1) * 45).round();
  }
}
