import 'package:flutter/material.dart';
import '../models/mizo_models.dart';
import '../state/mizo_app_state.dart';
import '../theme/mizo_theme.dart';

class MizoLogoMark extends StatelessWidget {
  final double size;
  const MizoLogoMark({super.key, this.size = 38});

  @override
  Widget build(BuildContext context) {
    return Container(
      width: size,
      height: size,
      decoration: BoxDecoration(
        borderRadius: BorderRadius.circular(size * 0.28),
        gradient: const LinearGradient(
          colors: [Color(0xFF3B0E6E), Color(0xFF14072A), Color(0xFF06040B)],
          begin: Alignment.topLeft,
          end: Alignment.bottomRight,
        ),
        border: Border.all(color: MizoColors.gold.withValues(alpha: 0.7), width: 1.4),
        boxShadow: [
          BoxShadow(
            color: MizoColors.neonPurple.withValues(alpha: 0.45),
            blurRadius: 14,
          ),
        ],
      ),
      child: Center(
        child: Stack(
          alignment: Alignment.center,
          children: [
            Positioned(
              top: size * 0.12,
              child: Icon(Icons.workspace_premium,
                  size: size * 0.30, color: MizoColors.gold),
            ),
            Positioned(
              bottom: size * 0.14,
              child: ShaderMask(
                shaderCallback: (rect) =>
                    MizoColors.goldGradient.createShader(rect),
                child: Text(
                  'M',
                  style: TextStyle(
                    fontSize: size * 0.46,
                    fontWeight: FontWeight.w900,
                    color: Colors.white,
                    height: 1,
                  ),
                ),
              ),
            ),
          ],
        ),
      ),
    );
  }
}

class LevelBadge extends StatelessWidget {
  final int level;
  final bool showTierName;
  const LevelBadge({super.key, required this.level, this.showTierName = false});

  @override
  Widget build(BuildContext context) {
    final tier = LevelSystem.getTier(level);
    return Container(
      padding: const EdgeInsets.symmetric(horizontal: 7, vertical: 2),
      decoration: BoxDecoration(
        borderRadius: BorderRadius.circular(999),
        gradient: LinearGradient(colors: tier.colors),
        border: Border.all(color: Colors.white24, width: 0.8),
      ),
      child: Row(
        mainAxisSize: MainAxisSize.min,
        children: [
          Text(tier.icon, style: const TextStyle(fontSize: 10)),
          const SizedBox(width: 3),
          Text(
            showTierName ? 'Lv.$level ${tier.name}' : 'Lv.$level',
            style: const TextStyle(
              fontSize: 10,
              fontWeight: FontWeight.w800,
              color: Colors.white,
            ),
          ),
        ],
      ),
    );
  }
}

class GoldCoinPill extends StatelessWidget {
  final int coins;
  final VoidCallback? onTap;
  const GoldCoinPill({super.key, required this.coins, this.onTap});

  @override
  Widget build(BuildContext context) {
    return GestureDetector(
      onTap: onTap,
      child: Container(
        padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 5),
        decoration: BoxDecoration(
          color: const Color(0xFF1A0D33),
          borderRadius: BorderRadius.circular(999),
          border: Border.all(color: MizoColors.gold.withValues(alpha: 0.55)),
        ),
        child: Row(
          mainAxisSize: MainAxisSize.min,
          children: [
            const Icon(Icons.monetization_on, color: MizoColors.gold, size: 16),
            const SizedBox(width: 4),
            Text(
              '$coins',
              style: const TextStyle(
                color: MizoColors.goldLight,
                fontSize: 12,
                fontWeight: FontWeight.w800,
              ),
            ),
          ],
        ),
      ),
    );
  }
}

class ProfileFrameAvatar extends StatelessWidget {
  final String imageAsset;
  final double size;
  final String? frameId;
  const ProfileFrameAvatar({
    super.key,
    required this.imageAsset,
    this.size = 64,
    this.frameId,
  });

  @override
  Widget build(BuildContext context) {
    final ringColors = frameId == 'frame-neon-galaxy' || frameId == 'frame-animated-halo'
        ? [MizoColors.neonPurple, MizoColors.magentaAccent, MizoColors.gold]
        : [MizoColors.goldLight, MizoColors.gold, MizoColors.neonPurple];
    return Container(
      width: size + 6,
      height: size + 6,
      padding: const EdgeInsets.all(3),
      decoration: BoxDecoration(
        shape: BoxShape.circle,
        gradient: LinearGradient(colors: ringColors),
        boxShadow: [
          BoxShadow(
            color: (frameId != null ? MizoColors.gold : MizoColors.neonPurple)
                .withValues(alpha: 0.45),
            blurRadius: 12,
          ),
        ],
      ),
      child: ClipOval(
        child: Image.asset(
          imageAsset,
          width: size,
          height: size,
          fit: BoxFit.cover,
          errorBuilder: (_, __, ___) => Container(
            color: MizoColors.royalSurface,
            child: const Icon(Icons.person, color: MizoColors.gold),
          ),
        ),
      ),
    );
  }
}

class MizoBottomNavBar extends StatelessWidget {
  final MainTab activeTab;
  final int unreadCount;
  final ValueChanged<MainTab> onSelectTab;
  final VoidCallback onOpenCreate;

  const MizoBottomNavBar({
    super.key,
    required this.activeTab,
    required this.unreadCount,
    required this.onSelectTab,
    required this.onOpenCreate,
  });

  Widget _navItem(
    BuildContext context, {
    required MainTab tab,
    required IconData icon,
    required String label,
    int badge = 0,
  }) {
    final active = activeTab == tab;
    final color = active
        ? MizoColors.gold
        : (Theme.of(context).brightness == Brightness.dark
            ? Colors.white70
            : const Color(0xFF4C1D95));
    return Expanded(
      child: InkWell(
        onTap: () => onSelectTab(tab),
        child: Padding(
          padding: const EdgeInsets.symmetric(vertical: 6),
          child: Column(
            mainAxisSize: MainAxisSize.min,
            children: [
              Stack(
                clipBehavior: Clip.none,
                children: [
                  Icon(icon, size: 20, color: color),
                  if (badge > 0)
                    Positioned(
                      right: -7,
                      top: -4,
                      child: Container(
                        padding: const EdgeInsets.symmetric(
                            horizontal: 4, vertical: 1),
                        decoration: BoxDecoration(
                          color: MizoColors.crimson,
                          borderRadius: BorderRadius.circular(999),
                        ),
                        child: Text(
                          badge > 9 ? '9+' : '$badge',
                          style: const TextStyle(
                              fontSize: 8,
                              fontWeight: FontWeight.w800,
                              color: Colors.white),
                        ),
                      ),
                    ),
                ],
              ),
              const SizedBox(height: 2),
              Text(
                label,
                maxLines: 1,
                overflow: TextOverflow.ellipsis,
                style: TextStyle(
                  fontSize: 9.5,
                  fontWeight: active ? FontWeight.w800 : FontWeight.w500,
                  color: color,
                ),
              ),
            ],
          ),
        ),
      ),
    );
  }

  @override
  Widget build(BuildContext context) {
    final isDark = Theme.of(context).brightness == Brightness.dark;
    return Container(
      decoration: BoxDecoration(
        color: isDark ? const Color(0xFF0C0618) : Colors.white,
        border: Border(
          top: BorderSide(
              color: MizoColors.neonPurple.withValues(alpha: 0.35), width: 1),
        ),
        boxShadow: [
          BoxShadow(
            color: Colors.black.withValues(alpha: 0.35),
            blurRadius: 16,
            offset: const Offset(0, -4),
          ),
        ],
      ),
      child: SafeArea(
        top: false,
        child: SizedBox(
          height: 60,
          child: Row(
            children: [
              _navItem(context, tab: MainTab.home, icon: Icons.home_rounded, label: 'Home'),
              _navItem(context, tab: MainTab.rooms, icon: Icons.meeting_room_rounded, label: 'Rooms'),
              _navItem(context, tab: MainTab.store, icon: Icons.shopping_bag_rounded, label: 'Store'),
              Expanded(
                child: Center(
                  child: GestureDetector(
                    onTap: onOpenCreate,
                    child: Container(
                      width: 46,
                      height: 46,
                      decoration: BoxDecoration(
                        shape: BoxShape.circle,
                        gradient: const LinearGradient(
                          colors: [MizoColors.neonPurple, MizoColors.gold],
                          begin: Alignment.topLeft,
                          end: Alignment.bottomRight,
                        ),
                        boxShadow: [
                          BoxShadow(
                            color: MizoColors.neonPurple.withValues(alpha: 0.6),
                            blurRadius: 14,
                          ),
                        ],
                      ),
                      child: const Icon(Icons.add_rounded,
                          color: Colors.white, size: 28),
                    ),
                  ),
                ),
              ),
              _navItem(context, tab: MainTab.videos, icon: Icons.play_circle_fill_rounded, label: 'Videos'),
              _navItem(context,
                  tab: MainTab.chat,
                  icon: Icons.chat_bubble_rounded,
                  label: 'Chat',
                  badge: unreadCount),
              _navItem(context, tab: MainTab.profile, icon: Icons.person_rounded, label: 'Profile'),
            ],
          ),
        ),
      ),
    );
  }
}

Future<bool> ensureAuthenticatedOrPrompt(
  BuildContext context,
  MizoAppState state,
  String actionLabel,
) async {
  if (!state.isGuest) return true;
  final goSignIn = await showDialog<bool>(
    context: context,
    builder: (ctx) => AlertDialog(
      backgroundColor: MizoColors.royalCard,
      shape: RoundedRectangleBorder(
        borderRadius: BorderRadius.circular(24),
        side: BorderSide(color: MizoColors.gold.withValues(alpha: 0.5)),
      ),
      title: const Row(
        children: [
          Icon(Icons.workspace_premium, color: MizoColors.gold),
          SizedBox(width: 8),
          Text('Sign In Required',
              style: TextStyle(color: Colors.white, fontSize: 17)),
        ],
      ),
      content: Text(
        'Guest mode supports browsing Live streams, Rooms, and Videos. Sign in to $actionLabel.',
        style: const TextStyle(color: Colors.white70, fontSize: 13),
      ),
      actions: [
        TextButton(
          onPressed: () => Navigator.pop(ctx, false),
          child: const Text('Keep Browsing',
              style: TextStyle(color: Colors.white60)),
        ),
        ElevatedButton(
          style: ElevatedButton.styleFrom(
            backgroundColor: MizoColors.gold,
            foregroundColor: const Color(0xFF1E0B3B),
          ),
          onPressed: () => Navigator.pop(ctx, true),
          child: const Text('Sign In / Register'),
        ),
      ],
    ),
  );
  if (goSignIn == true) {
    state.showAuthScreen = true;
    // ignore: invalid_use_of_protected_member, invalid_use_of_visible_for_testing_member
    state.notifyListeners();
  }
  return false;
}
