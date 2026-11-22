import 'package:flutter/material.dart';
import '../models/mizo_models.dart';
import '../services/firebase_service.dart';
import '../state/mizo_app_state.dart';
import '../theme/mizo_theme.dart';
import '../widgets/mizo_widgets.dart';
import 'settings_and_admin_screens.dart';
import 'wallet_and_features_screens.dart';

class ProfileScreen extends StatefulWidget {
  final MizoAppState state;
  const ProfileScreen({super.key, required this.state});

  @override
  State<ProfileScreen> createState() => _ProfileScreenState();
}

class _ProfileScreenState extends State<ProfileScreen> {
  String _videoTab = 'public'; // public | private | saved | liked | reposted

  @override
  Widget build(BuildContext context) {
    final s = widget.state;
    final p = s.profile;
    final publicVids = s.myVideos.where((v) => v.privacy != 'Private').toList();
    final privateVids =
        s.myVideos.where((v) => v.privacy == 'Private').toList();

    final displayedVideos = switch (_videoTab) {
      'private' => privateVids,
      'saved' => s.savedVideos,
      'liked' => s.likedVideos,
      'reposted' => s.repostedVideos,
      _ => publicVids,
    };

    final reqXp = LevelSystem.getXpRequired(p.level);
    final ownedItems = s.storeItems.where((i) => i.owned).toList();

    return Scaffold(
      appBar: AppBar(
        title: const Text('My Profile',
            style: TextStyle(fontWeight: FontWeight.w800)),
        actions: [
          IconButton(
            onPressed: () => Navigator.push(
              context,
              MaterialPageRoute(builder: (_) => AccountSettingsScreen(state: s)),
            ),
            icon: const Icon(Icons.settings_outlined),
          ),
        ],
      ),
      body: ListView(
        padding: const EdgeInsets.all(16),
        children: [
          // Header Card
          Container(
            padding: const EdgeInsets.all(18),
            decoration: BoxDecoration(
              borderRadius: BorderRadius.circular(24),
              gradient: MizoColors.neonHeroGradient,
              border: Border.all(color: MizoColors.gold.withValues(alpha: 0.45)),
            ),
            child: Column(
              children: [
                ProfileFrameAvatar(
                  imageAsset: p.avatar,
                  size: 84,
                  frameId: p.equippedFrameId,
                ),
                const SizedBox(height: 12),
                Row(
                  mainAxisAlignment: MainAxisAlignment.center,
                  children: [
                    Text(
                      p.username,
                      style: TextStyle(
                        fontSize: 20,
                        fontWeight: FontWeight.w900,
                        color: p.equippedNameDecorId != null
                            ? MizoColors.gold
                            : Colors.white,
                      ),
                    ),
                    if (p.isVerified) ...[
                      const SizedBox(width: 6),
                      const Icon(Icons.verified,
                          color: Colors.lightBlueAccent, size: 18),
                    ],
                  ],
                ),
                const SizedBox(height: 4),
                Text('ID: ${p.userId} · VIP ${p.vipLevel} · SVIP ${p.svipLevel}',
                    style: const TextStyle(
                        color: MizoColors.goldLight, fontSize: 12)),
                const SizedBox(height: 8),
                LevelBadge(level: p.level, showTierName: true),
                const SizedBox(height: 10),
                LinearProgressIndicator(
                  value: (p.xp / (reqXp == 0 ? 1 : reqXp)).clamp(0.0, 1.0),
                  color: MizoColors.gold,
                  backgroundColor: Colors.white12,
                ),
                const SizedBox(height: 4),
                Text('XP ${p.xp} / $reqXp to Level ${p.level + 1}',
                    style: const TextStyle(color: Colors.white60, fontSize: 10)),
                const SizedBox(height: 12),
                Text(p.bio,
                    textAlign: TextAlign.center,
                    style: const TextStyle(color: Colors.white70, fontSize: 12)),
                const SizedBox(height: 14),
                Row(
                  mainAxisAlignment: MainAxisAlignment.spaceEvenly,
                  children: [
                    _stat('${p.followers}', 'Followers'),
                    _stat('${p.following}', 'Following'),
                    _stat(p.likes, 'Likes'),
                    _stat('${p.coins}', 'Coins'),
                  ],
                ),
                const SizedBox(height: 14),
                Row(
                  children: [
                    Expanded(
                      child: ElevatedButton(
                        style: ElevatedButton.styleFrom(
                          backgroundColor: MizoColors.gold,
                          foregroundColor: const Color(0xFF1E0B3B),
                        ),
                        onPressed: () => _openEditProfileDialog(s),
                        child: const Text('Edit Profile',
                            style: TextStyle(fontWeight: FontWeight.w800)),
                      ),
                    ),
                    const SizedBox(width: 10),
                    Expanded(
                      child: OutlinedButton(
                        style: OutlinedButton.styleFrom(
                          foregroundColor: Colors.white,
                          side: const BorderSide(color: MizoColors.neonPurple),
                        ),
                        onPressed: () {
                          if (s.isGuest) {
                            s.showAuthScreen = true;
                            // ignore: invalid_use_of_protected_member, invalid_use_of_visible_for_testing_member
                            s.notifyListeners();
                          } else {
                            Navigator.push(
                              context,
                              MaterialPageRoute(
                                  builder: (_) => WalletScreen(state: s)),
                            );
                          }
                        },
                        child: Text(s.isGuest ? 'Sign In' : 'Wallet'),
                      ),
                    ),
                  ],
                ),
              ],
            ),
          ),
          const SizedBox(height: 16),

          // Quick Shortcuts Grid
          GridView.count(
            shrinkWrap: true,
            physics: const NeverScrollableScrollPhysics(),
            crossAxisCount: 4,
            mainAxisSpacing: 10,
            crossAxisSpacing: 10,
            children: [
              _shortcut(context, Icons.account_balance_wallet, 'Wallet',
                  () => Navigator.push(context, MaterialPageRoute(builder: (_) => WalletScreen(state: s)))),
              _shortcut(context, Icons.military_tech, 'Levels',
                  () => Navigator.push(context, MaterialPageRoute(builder: (_) => LevelDetailsScreen(state: s)))),
              _shortcut(context, Icons.emoji_events, 'Badges',
                  () => Navigator.push(context, MaterialPageRoute(builder: (_) => AchievementsScreen(state: s)))),
              _shortcut(context, Icons.business, 'Agency',
                  () => Navigator.push(context, MaterialPageRoute(builder: (_) => AgencyScreen(state: s)))),
              _shortcut(context, Icons.leaderboard, 'Rankings',
                  () => Navigator.push(context, MaterialPageRoute(builder: (_) => RankingsScreen(state: s)))),
              _shortcut(context, Icons.shopping_bag, 'Store',
                  () => s.setTab(MainTab.store)),
              _shortcut(context, Icons.phone_in_talk, 'Calls',
                  () => s.setTab(MainTab.chat, inboxTab: InboxTab.calls)),
              _shortcut(context, Icons.settings, 'Settings',
                  () => Navigator.push(context, MaterialPageRoute(builder: (_) => AccountSettingsScreen(state: s)))),
            ],
          ),
          const SizedBox(height: 16),

          // Owned Assets Row
          if (ownedItems.isNotEmpty) ...[
            const Text('Profile Assets',
                style: TextStyle(fontSize: 15, fontWeight: FontWeight.w800)),
            const SizedBox(height: 8),
            SizedBox(
              height: 44,
              child: ListView.separated(
                scrollDirection: Axis.horizontal,
                itemCount: ownedItems.length,
                separatorBuilder: (_, __) => const SizedBox(width: 8),
                itemBuilder: (_, idx) {
                  final it = ownedItems[idx];
                  return ActionChip(
                    avatar: Icon(
                      it.equipped ? Icons.check_circle : Icons.auto_awesome,
                      color: it.equipped ? MizoColors.emerald : MizoColors.gold,
                      size: 16,
                    ),
                    label: Text(it.name),
                    onPressed: () => s.toggleEquipStoreItem(it),
                  );
                },
              ),
            ),
            const SizedBox(height: 16),
          ],

          // 5 Video Tabs
          SingleChildScrollView(
            scrollDirection: Axis.horizontal,
            child: Row(
              children: [
                ('public', 'Public (${publicVids.length})'),
                ('private', 'Private (${privateVids.length})'),
                ('saved', 'Saved (${s.savedVideos.length})'),
                ('liked', 'Liked (${s.likedVideos.length})'),
                ('reposted', 'Reposted (${s.repostedVideos.length})'),
              ]
                  .map((e) => Padding(
                        padding: const EdgeInsets.only(right: 8),
                        child: ChoiceChip(
                          label: Text(e.$2),
                          selected: _videoTab == e.$1,
                          selectedColor: MizoColors.gold,
                          labelStyle: TextStyle(
                            color: _videoTab == e.$1
                                ? const Color(0xFF1E0B3B)
                                : null,
                            fontWeight: FontWeight.w700,
                          ),
                          onSelected: (_) => setState(() => _videoTab = e.$1),
                        ),
                      ))
                  .toList(),
            ),
          ),
          const SizedBox(height: 12),
          if (displayedVideos.isEmpty)
            const Padding(
              padding: EdgeInsets.all(24),
              child: Center(child: Text('No videos in this tab yet.')),
            )
          else
            GridView.builder(
              shrinkWrap: true,
              physics: const NeverScrollableScrollPhysics(),
              gridDelegate: const SliverGridDelegateWithFixedCrossAxisCount(
                crossAxisCount: 3,
                crossAxisSpacing: 8,
                mainAxisSpacing: 8,
                childAspectRatio: 0.72,
              ),
              itemCount: displayedVideos.length,
              itemBuilder: (_, idx) {
                final v = displayedVideos[idx];
                return ClipRRect(
                  borderRadius: BorderRadius.circular(14),
                  child: Stack(
                    fit: StackFit.expand,
                    children: [
                      Image.asset(v.thumbnail, fit: BoxFit.cover),
                      Positioned(
                        left: 6,
                        bottom: 6,
                        right: 6,
                        child: Text(
                          v.title,
                          maxLines: 1,
                          overflow: TextOverflow.ellipsis,
                          style: const TextStyle(
                            color: Colors.white,
                            fontSize: 10,
                            fontWeight: FontWeight.w700,
                            shadows: [Shadow(blurRadius: 4)],
                          ),
                        ),
                      ),
                    ],
                  ),
                );
              },
            ),
        ],
      ),
    );
  }

  Widget _stat(String val, String label) => Column(
        children: [
          Text(val,
              style: const TextStyle(
                  color: Colors.white,
                  fontSize: 16,
                  fontWeight: FontWeight.w900)),
          Text(label,
              style: const TextStyle(color: Colors.white60, fontSize: 11)),
        ],
      );

  Widget _shortcut(
      BuildContext ctx, IconData icon, String label, VoidCallback onTap) {
    return GestureDetector(
      onTap: onTap,
      child: Card(
        child: Column(
          mainAxisAlignment: MainAxisAlignment.center,
          children: [
            Icon(icon, color: MizoColors.gold, size: 22),
            const SizedBox(height: 4),
            Text(label,
                style:
                    const TextStyle(fontSize: 10, fontWeight: FontWeight.w700)),
          ],
        ),
      ),
    );
  }

  void _openEditProfileDialog(MizoAppState s) {
    final nameCtrl = TextEditingController(text: s.profile.username);
    final bioCtrl = TextEditingController(text: s.profile.bio);
    showDialog(
      context: context,
      builder: (ctx) => AlertDialog(
        backgroundColor: MizoColors.royalCard,
        title: const Text('Edit Profile', style: TextStyle(color: Colors.white)),
        content: Column(
          mainAxisSize: MainAxisSize.min,
          children: [
            TextField(
              controller: nameCtrl,
              decoration: const InputDecoration(labelText: 'Username'),
            ),
            const SizedBox(height: 10),
            TextField(
              controller: bioCtrl,
              maxLines: 2,
              decoration: const InputDecoration(labelText: 'Bio'),
            ),
          ],
        ),
        actions: [
          TextButton(
              onPressed: () => Navigator.pop(ctx), child: const Text('Cancel')),
          ElevatedButton(
            style: ElevatedButton.styleFrom(
                backgroundColor: MizoColors.gold,
                foregroundColor: const Color(0xFF1E0B3B)),
            onPressed: () {
              setState(() {
                s.profile.username = nameCtrl.text.trim().isEmpty
                    ? s.profile.username
                    : nameCtrl.text.trim();
                s.profile.bio = bioCtrl.text.trim();
              });
              MizoFirebaseService.instance.syncProfileToFirestore(s.profile);
              s.showToast('Profile saved');
              Navigator.pop(ctx);
            },
            child: const Text('Save'),
          ),
        ],
      ),
    );
  }
}
