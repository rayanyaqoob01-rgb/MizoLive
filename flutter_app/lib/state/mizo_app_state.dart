import 'dart:async';
import 'package:connectivity_plus/connectivity_plus.dart';
import 'package:firebase_auth/firebase_auth.dart';
import 'package:flutter/material.dart';
import '../data/mizo_seed_data.dart';
import '../models/mizo_models.dart';
import 'agora_service.dart';
import 'api_client.dart';
import 'firebase_service.dart';
import 'websocket_service.dart';

class MizoAppState extends ChangeNotifier {
  ThemeMode themeMode = ThemeMode.dark;
  MainTab currentTab = MainTab.home;
  InboxTab inboxInitialTab = InboxTab.all;
  int videoFeedIndex = 0;

  bool isOffline = false;
  bool showAuthScreen = false;
  String? toastMessage;

  User? firebaseUser;
  bool get isGuest => firebaseUser == null || firebaseUser!.isAnonymous;
  bool get isAdmin => MizoFirebaseService.instance.isVerifiedAdmin(firebaseUser);

  UserProfile profile = buildInitialProfile();
  EconomyConfig economy = const EconomyConfig(
    coinPackages: [
      CoinPackage(id: 'pkg-100', coins: 500, bonus: 25, priceUsd: '\$4.99', label: 'Starter Pouch'),
      CoinPackage(id: 'pkg-500', coins: 1500, bonus: 150, priceUsd: '\$14.99', label: 'Royal Chest'),
      CoinPackage(id: 'pkg-3000', coins: 3500, bonus: 500, priceUsd: '\$29.99', label: 'VIP Vault'),
      CoinPackage(id: 'pkg-10000', coins: 10000, bonus: 2000, priceUsd: '\$79.99', label: 'Emperor Treasury'),
    ],
  );

  ServerWalletAccount wallet = ServerWalletAccount(
    userId: '12345678',
    coins: 2750,
    spentCoins: 640,
    receivedCoins: 1280,
    callEarnings: 420,
    ownedItemIds: const ['frame-gold-wreath'],
    transactions: const [],
  );

  final List<ActiveUserItem> activeUsers = buildInitialActiveUsers();
  final List<LiveStream> streams = buildInitialLiveStreams();
  final List<RoomItem> rooms = buildInitialRooms();
  final List<StoreItem> storeItems = buildInitialStoreItems();
  final List<GiftItem> gifts = buildSampleGifts();
  final List<FeedVideo> feedVideos = buildInitialFeedVideos();
  final List<InboxItem> inboxItems = buildInitialInboxItems();
  final List<CallRecord> callHistory = buildInitialCallHistory();
  final List<UserVideo> myVideos = buildInitialMyVideos();
  final List<AchievementBadge> achievements = buildInitialAchievements();
  final NotificationPrefs notificationPrefs = NotificationPrefs();

  final List<BlockedUserItem> blockedUsers = [];
  final List<ReportHistoryItem> reportHistory = [];
  String language = 'English';

  StreamSubscription? _connSub;
  StreamSubscription? _authSub;

  int get totalUnreadInbox =>
      inboxItems.fold(0, (sum, item) => sum + item.unreadCount);

  List<UserVideo> get savedVideos => feedVideos
      .where((v) => v.isSaved)
      .map((v) => UserVideo(
            id: v.id,
            title: v.description,
            description: v.description,
            privacy: 'Public',
            thumbnail: v.thumbnail,
            duration: '0:35',
            views: '${v.likes + 450}',
            likes: '${v.likes}',
            creatorName: v.creatorName,
            createdAt: 'Saved',
          ))
      .toList();

  List<UserVideo> get likedVideos => feedVideos
      .where((v) => v.isLiked)
      .map((v) => UserVideo(
            id: v.id,
            title: v.description,
            description: v.description,
            privacy: 'Public',
            thumbnail: v.thumbnail,
            duration: '0:35',
            views: '${v.likes + 450}',
            likes: '${v.likes}',
            creatorName: v.creatorName,
            createdAt: 'Liked',
          ))
      .toList();

  List<UserVideo> get repostedVideos => feedVideos
      .where((v) => v.isReposted)
      .map((v) => UserVideo(
            id: v.id,
            title: v.description,
            description: v.description,
            privacy: 'Public',
            thumbnail: v.thumbnail,
            duration: '0:35',
            views: '${v.likes + 450}',
            likes: '${v.likes}',
            creatorName: v.creatorName,
            createdAt: 'Reposted',
          ))
      .toList();

  Future<void> initialize() async {
    _connSub = Connectivity().onConnectivityChanged.listen((results) {
      isOffline = results.every((r) => r == ConnectivityResult.none);
      notifyListeners();
    });

    await MizoFirebaseService.instance.initialize();
    _authSub = MizoFirebaseService.instance.authStateChanges().listen((user) {
      firebaseUser = user;
      MizoApiClient.instance.setAuthHeadersProvider(() => {
            'x-mizo-user-id': user?.uid ?? profile.userId,
            if (user?.email != null) 'x-mizo-admin-email': user!.email!,
            'x-mizo-email-verified': '${user?.emailVerified ?? false}',
          });
      if (user != null && !user.isAnonymous) {
        showAuthScreen = false;
        if (user.displayName != null && user.displayName!.trim().isNotEmpty) {
          profile.username = user.displayName!.trim();
        }
        loadServerConfigAndWallet();
      }
      notifyListeners();
    });

    MizoWebSocketService.instance.connect();
    await loadServerConfigAndWallet();
  }

  Future<void> loadServerConfigAndWallet() async {
    final cfgRes = await MizoApiClient.instance.get('/api/config');
    if (cfgRes.ok && cfgRes.data?['economy'] is Map<String, dynamic>) {
      economy = EconomyConfig.fromJson(
          cfgRes.data!['economy'] as Map<String, dynamic>);
    }

    final uid = firebaseUser?.uid ?? profile.userId;
    final walletRes =
        await MizoApiClient.instance.get('/api/wallet?userId=$uid');
    if (walletRes.ok && walletRes.data != null) {
      _syncWallet(ServerWalletAccount.fromJson(walletRes.data!));
    }
    notifyListeners();
  }

  void _syncWallet(ServerWalletAccount acc) {
    wallet = acc;
    profile.coins = acc.coins;
    profile.spentCoins = acc.spentCoins;
    for (final item in storeItems) {
      if (acc.ownedItemIds.contains(item.id)) item.owned = true;
    }
  }

  void setTab(MainTab tab, {InboxTab? inboxTab}) {
    if (inboxTab != null) inboxInitialTab = inboxTab;
    currentTab = tab;
    notifyListeners();
  }

  void toggleThemeMode() {
    themeMode = themeMode == ThemeMode.dark ? ThemeMode.light : ThemeMode.dark;
    notifyListeners();
  }

  void showToast(String msg) {
    toastMessage = msg;
    notifyListeners();
    Future.delayed(const Duration(seconds: 3), () {
      if (toastMessage == msg) {
        toastMessage = null;
        notifyListeners();
      }
    });
  }

  void addActivityXp(int amount, [String? label]) {
    var level = profile.level.clamp(1, LevelSystem.maxLevel);
    var xp = profile.xp + amount;
    while (level < LevelSystem.maxLevel) {
      final req = LevelSystem.getXpRequired(level);
      if (xp >= req) {
        xp -= req;
        level += 1;
      } else {
        break;
      }
    }
    if (level > profile.level) {
      showToast('Level Up! Reached Level $level!');
    } else if (label != null) {
      showToast('+$amount XP ($label)');
    }
    profile.level = level;
    profile.xp = xp;
    notifyListeners();
  }

  Future<bool> rechargePackage(String packageId) async {
    final uid = firebaseUser?.uid ?? profile.userId;
    final res = await MizoApiClient.instance.post('/api/wallet/recharge', {
      'userId': uid,
      'packageId': packageId,
    });
    if (res.ok && res.data?['account'] is Map<String, dynamic>) {
      _syncWallet(ServerWalletAccount.fromJson(
          res.data!['account'] as Map<String, dynamic>));
      final added = res.data?['added'] ?? 0;
      showToast('+$added Sandbox Coins added');
      notifyListeners();
      return true;
    }
    showToast(res.error ?? 'Recharge failed');
    return false;
  }

  Future<String> purchaseOrEquipStoreItem(StoreItem item) async {
    if (item.owned) {
      toggleEquipStoreItem(item);
      return 'equipped';
    }
    final uid = firebaseUser?.uid ?? profile.userId;
    final res = await MizoApiClient.instance.post('/api/store/purchase', {
      'userId': uid,
      'itemId': item.id,
    });
    if (res.status == 402) return 'insufficient';
    if (!res.ok) {
      showToast(res.error ?? 'Purchase failed');
      return 'error';
    }
    if (res.data?['account'] is Map<String, dynamic>) {
      _syncWallet(ServerWalletAccount.fromJson(
          res.data!['account'] as Map<String, dynamic>));
    }
    item.owned = true;
    toggleEquipStoreItem(item, forceEquip: true);
    showToast('Purchased & equipped ${item.name}!');
    notifyListeners();
    return 'ok';
  }

  void toggleEquipStoreItem(StoreItem item, {bool? forceEquip}) {
    final isFrame = item.category == StoreCategory.vipFrames ||
        item.category == StoreCategory.animatedFrames;
    final isAsset = item.category == StoreCategory.premiumAssets ||
        item.category == StoreCategory.profileDecorations;

    final wasEquipped = (isFrame && profile.equippedFrameId == item.id) ||
        (item.category == StoreCategory.specialEntry &&
            profile.equippedEntryId == item.id) ||
        (isAsset && profile.equippedAssetId == item.id) ||
        (item.category == StoreCategory.nameDecorations &&
            profile.equippedNameDecorId == item.id) ||
        (item.category == StoreCategory.specialBadges &&
            profile.equippedSpecialBadgeId == item.id);

    final nextEquip = forceEquip ?? !wasEquipped;
    for (final s in storeItems) {
      final sameSlot = (isFrame &&
              (s.category == StoreCategory.vipFrames ||
                  s.category == StoreCategory.animatedFrames)) ||
          (isAsset &&
              (s.category == StoreCategory.premiumAssets ||
                  s.category == StoreCategory.profileDecorations)) ||
          s.category == item.category;
      if (s.id == item.id) {
        s.equipped = nextEquip;
      } else if (sameSlot && nextEquip) {
        s.equipped = false;
      }
    }
    if (isFrame) profile.equippedFrameId = nextEquip ? item.id : null;
    if (item.category == StoreCategory.specialEntry) {
      profile.equippedEntryId = nextEquip ? item.id : null;
    }
    if (isAsset) profile.equippedAssetId = nextEquip ? item.id : null;
    if (item.category == StoreCategory.nameDecorations) {
      profile.equippedNameDecorId = nextEquip ? item.id : null;
    }
    if (item.category == StoreCategory.specialBadges) {
      profile.equippedSpecialBadgeId = nextEquip ? item.id : null;
    }
    MizoFirebaseService.instance.syncProfileToFirestore(profile);
    notifyListeners();
  }

  Future<bool> sendGift(GiftItem gift, String recipientName) async {
    if (profile.coins < gift.price) {
      showToast('Insufficient coins — recharge in Wallet');
      return false;
    }
    final uid = firebaseUser?.uid ?? profile.userId;
    final res = await MizoApiClient.instance.post('/api/gifts/send', {
      'userId': uid,
      'giftId': gift.id,
      'recipientName': recipientName,
    });
    if (!res.ok) {
      showToast(res.error ?? 'Failed to send gift');
      return false;
    }
    if (res.data?['account'] is Map<String, dynamic>) {
      _syncWallet(ServerWalletAccount.fromJson(
          res.data!['account'] as Map<String, dynamic>));
    }
    addActivityXp(35);
    showToast('Sent ${gift.name} to $recipientName');
    notifyListeners();
    return true;
  }

  Future<void> submitReport(
      String targetName, String targetType, String reason) async {
    final uid = firebaseUser?.uid ?? profile.userId;
    final res = await MizoApiClient.instance.post('/api/reports', {
      'userId': uid,
      'targetName': targetName,
      'targetType': targetType,
      'reason': reason,
    });
    final rec = res.data?['report'] is Map<String, dynamic>
        ? ReportHistoryItem.fromJson(
            res.data!['report'] as Map<String, dynamic>)
        : ReportHistoryItem(
            id: 'rep-${DateTime.now().millisecondsSinceEpoch}',
            targetName: targetName,
            targetType: targetType,
            reason: reason,
            status: 'open',
            timestamp: 'Just now',
          );
    reportHistory.insert(0, rec);
    await MizoFirebaseService.instance.submitReportToFirestore(
      targetName: targetName,
      targetType: targetType,
      reason: reason,
    );
    showToast('Report submitted');
    notifyListeners();
  }

  void blockUser(String name, String reason) {
    if (!blockedUsers.any((b) => b.name.toLowerCase() == name.toLowerCase())) {
      blockedUsers.insert(
        0,
        BlockedUserItem(
          id: 'blk-${DateTime.now().millisecondsSinceEpoch}',
          name: name,
          reason: reason,
          blockedAt: 'Just now',
        ),
      );
      showToast('Blocked $name');
      notifyListeners();
    }
  }

  @override
  void dispose() {
    _connSub?.cancel();
    _authSub?.cancel();
    MizoAgoraService.instance.leaveChannel();
    MizoWebSocketService.instance.disconnect();
    super.dispose();
  }
}
