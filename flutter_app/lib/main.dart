import 'dart:async';
import 'package:flutter/material.dart';
import 'config/app_config.dart';
import 'models/mizo_models.dart';
import 'screens/home_screen.dart';
import 'screens/inbox_screen.dart';
import 'screens/live_room_screen.dart';
import 'screens/profile_screen.dart';
import 'screens/rooms_screen.dart';
import 'screens/splash_auth_screen.dart';
import 'screens/store_screen.dart';
import 'screens/videos_screen.dart';
import 'screens/wallet_and_features_screens.dart';
import 'services/firebase_service.dart';
import 'state/mizo_app_state.dart';
import 'theme/mizo_theme.dart';
import 'widgets/mizo_widgets.dart';

Future<void> main() async {
  WidgetsFlutterBinding.ensureInitialized();

  ErrorWidget.builder = (details) => Material(
        color: MizoColors.obsidian,
        child: Center(
          child: Padding(
            padding: const EdgeInsets.all(24),
            child: Column(
              mainAxisSize: MainAxisSize.min,
              children: [
                const Icon(Icons.error_outline,
                    color: MizoColors.gold, size: 42),
                const SizedBox(height: 12),
                const Text(
                  'MizoLive recovered from a view error.',
                  style: TextStyle(
                      color: Colors.white,
                      fontWeight: FontWeight.w800,
                      fontSize: 16),
                ),
                const SizedBox(height: 6),
                Text(
                  details.exceptionAsString(),
                  maxLines: 3,
                  overflow: TextOverflow.ellipsis,
                  textAlign: TextAlign.center,
                  style: const TextStyle(color: Colors.white60, fontSize: 12),
                ),
              ],
            ),
          ),
        ),
      );

  final state = MizoAppState();
  await state.initialize();
  runApp(MizoLiveApp(state: state));
}

class MizoLiveApp extends StatefulWidget {
  final MizoAppState state;
  const MizoLiveApp({super.key, required this.state});

  @override
  State<MizoLiveApp> createState() => _MizoLiveAppState();
}

class _MizoLiveAppState extends State<MizoLiveApp> {
  bool _showSplash = true;
  Timer? _splashTimer;

  @override
  void initState() {
    super.initState();
    _splashTimer = Timer(const Duration(milliseconds: 1400), () {
      if (mounted) setState(() => _showSplash = false);
    });
  }

  @override
  void dispose() {
    _splashTimer?.cancel();
    widget.state.dispose();
    super.dispose();
  }

  @override
  Widget build(BuildContext context) {
    return AnimatedBuilder(
      animation: widget.state,
      builder: (context, _) {
        final s = widget.state;
        return MaterialApp(
          title: AppConfig.appName,
          debugShowCheckedModeBanner: false,
          theme: MizoTheme.lightTheme(),
          darkTheme: MizoTheme.darkTheme(),
          themeMode: s.themeMode,
          home: _showSplash
              ? const SplashScreenView()
              : _MizoShell(state: s),
        );
      },
    );
  }
}

class _MizoShell extends StatelessWidget {
  final MizoAppState state;
  const _MizoShell({required this.state});

  void _openWallet(BuildContext context) {
    Navigator.push(
      context,
      MaterialPageRoute(builder: (_) => WalletScreen(state: state)),
    );
  }

  void _openCreateModal(BuildContext context) {
    showModalBottomSheet(
      context: context,
      backgroundColor: MizoColors.royalCard,
      shape: const RoundedRectangleBorder(
        borderRadius: BorderRadius.vertical(top: Radius.circular(28)),
      ),
      builder: (ctx) => Padding(
        padding: const EdgeInsets.fromLTRB(20, 20, 20, 28),
        child: Column(
          mainAxisSize: MainAxisSize.min,
          children: [
            Container(
              width: 44,
              height: 4,
              decoration: BoxDecoration(
                color: Colors.white24,
                borderRadius: BorderRadius.circular(999),
              ),
            ),
            const SizedBox(height: 16),
            const Text(
              'Create on MizoLive',
              style: TextStyle(
                  color: Colors.white,
                  fontSize: 18,
                  fontWeight: FontWeight.w900),
            ),
            const SizedBox(height: 16),
            _createOption(
              icon: Icons.videocam,
              title: 'Go Live',
              subtitle: 'Broadcast real-time live video & PK battles',
              gradient: const [MizoColors.gold, Color(0xFFD97706)],
              onTap: () async {
                Navigator.pop(ctx);
                final ok = await ensureAuthenticatedOrPrompt(
                    context, state, 'start a live broadcast');
                if (!ok || !context.mounted) return;
                Navigator.push(
                  context,
                  MaterialPageRoute(
                      builder: (_) => GoLiveSetupScreen(state: state)),
                );
              },
            ),
            const SizedBox(height: 10),
            _createOption(
              icon: Icons.meeting_room,
              title: 'Create Room',
              subtitle: 'Host a 4, 6, 9, or 12-seat audio/video party room',
              gradient: const [MizoColors.neonPurple, MizoColors.magentaAccent],
              onTap: () async {
                Navigator.pop(ctx);
                final ok = await ensureAuthenticatedOrPrompt(
                    context, state, 'create a party room');
                if (!ok || !context.mounted) return;
                Navigator.push(
                  context,
                  MaterialPageRoute(
                      builder: (_) => CreateRoomScreen(state: state)),
                );
              },
            ),
            const SizedBox(height: 10),
            _createOption(
              icon: Icons.upload_file,
              title: 'Upload Video',
              subtitle: 'Share a short reel with MizoLive followers',
              gradient: const [Color(0xFF4F46E5), MizoColors.neonPurple],
              onTap: () async {
                Navigator.pop(ctx);
                final ok = await ensureAuthenticatedOrPrompt(
                    context, state, 'upload videos');
                if (!ok || !context.mounted) return;
                Navigator.push(
                  context,
                  MaterialPageRoute(
                      builder: (_) => UploadVideoScreen(state: state)),
                );
              },
            ),
          ],
        ),
      ),
    );
  }

  Widget _createOption({
    required IconData icon,
    required String title,
    required String subtitle,
    required List<Color> gradient,
    required VoidCallback onTap,
  }) =>
      InkWell(
        onTap: onTap,
        borderRadius: BorderRadius.circular(18),
        child: Container(
          padding: const EdgeInsets.all(14),
          decoration: BoxDecoration(
            borderRadius: BorderRadius.circular(18),
            gradient: LinearGradient(colors: gradient),
          ),
          child: Row(
            children: [
              CircleAvatar(
                backgroundColor: Colors.black26,
                child: Icon(icon, color: Colors.white),
              ),
              const SizedBox(width: 12),
              Expanded(
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    Text(title,
                        style: const TextStyle(
                            color: Colors.white,
                            fontWeight: FontWeight.w900,
                            fontSize: 15)),
                    Text(subtitle,
                        style: const TextStyle(
                            color: Colors.white70, fontSize: 11.5)),
                  ],
                ),
              ),
              const Icon(Icons.chevron_right, color: Colors.white),
            ],
          ),
        ),
      );

  @override
  Widget build(BuildContext context) {
    final user = state.firebaseUser;
    final showVerifyBanner =
        user != null && !user.isAnonymous && user.email != null && !user.emailVerified;

    Widget body;
    switch (state.currentTab) {
      case MainTab.home:
        body = HomeScreen(
          state: state,
          onOpenLive: (stream) => Navigator.push(
            context,
            MaterialPageRoute(
                builder: (_) => LiveRoomScreen(state: state, stream: stream)),
          ),
          onOpenRoom: (room) => Navigator.push(
            context,
            MaterialPageRoute(
                builder: (_) => PartyRoomScreen(state: state, room: room)),
          ),
          onOpenWallet: () => _openWallet(context),
          onOpenVideos: (idx) {
            state.videoFeedIndex = idx;
            state.setTab(MainTab.videos);
          },
        );
      case MainTab.rooms:
        body = RoomsScreen(
          state: state,
          onOpenRoom: (room) => Navigator.push(
            context,
            MaterialPageRoute(
                builder: (_) => PartyRoomScreen(state: state, room: room)),
          ),
          onCreateRoom: () async {
            final ok = await ensureAuthenticatedOrPrompt(
                context, state, 'create a room');
            if (!ok || !context.mounted) return;
            Navigator.push(
              context,
              MaterialPageRoute(builder: (_) => CreateRoomScreen(state: state)),
            );
          },
        );
      case MainTab.store:
        body = StoreScreen(
          state: state,
          onOpenWallet: () => _openWallet(context),
        );
      case MainTab.videos:
        body = VideosScreen(state: state);
      case MainTab.chat:
        body = InboxScreen(
          state: state,
          onOpenWallet: () => _openWallet(context),
        );
      case MainTab.profile:
        body = ProfileScreen(state: state);
    }

    return Stack(
      children: [
        Scaffold(
          body: Column(
            children: [
              if (state.isOffline)
                Material(
                  color: MizoColors.crimson,
                  child: const SafeArea(
                    bottom: false,
                    child: Padding(
                      padding:
                          EdgeInsets.symmetric(horizontal: 14, vertical: 6),
                      child: Row(
                        children: [
                          Icon(Icons.wifi_off, color: Colors.white, size: 16),
                          SizedBox(width: 8),
                          Expanded(
                            child: Text(
                              'No internet connection — live sync and gifts paused.',
                              style: TextStyle(
                                  color: Colors.white,
                                  fontSize: 12,
                                  fontWeight: FontWeight.w700),
                            ),
                          ),
                        ],
                      ),
                    ),
                  ),
                ),
              if (showVerifyBanner)
                Material(
                  color: const Color(0xFF4C1D95),
                  child: SafeArea(
                    bottom: false,
                    child: Padding(
                      padding:
                          const EdgeInsets.symmetric(horizontal: 12, vertical: 4),
                      child: Row(
                        children: [
                          const Icon(Icons.mark_email_unread,
                              color: MizoColors.gold, size: 16),
                          const SizedBox(width: 8),
                          const Expanded(
                            child: Text(
                              'Verify your email address to unlock full account security.',
                              style:
                                  TextStyle(color: Colors.white, fontSize: 11),
                            ),
                          ),
                          TextButton(
                            onPressed: () async {
                              try {
                                await MizoFirebaseService.instance.auth.currentUser
                                    ?.sendEmailVerification();
                                state.showToast('Verification email resent');
                              } catch (e) {
                                state.showToast(e.toString());
                              }
                            },
                            child: const Text('Resend',
                                style: TextStyle(
                                    color: MizoColors.gold,
                                    fontWeight: FontWeight.w800)),
                          ),
                        ],
                      ),
                    ),
                  ),
                ),
              Expanded(child: body),
            ],
          ),
          bottomNavigationBar: MizoBottomNavBar(
            activeTab: state.currentTab,
            unreadCount: state.totalUnreadInbox,
            onSelectTab: (tab) => state.setTab(tab),
            onOpenCreate: () => _openCreateModal(context),
          ),
        ),

        if (state.showAuthScreen)
          AuthScreenView(
            state: state,
            onClose: () {
              state.showAuthScreen = false;
              // ignore: invalid_use_of_protected_member, invalid_use_of_visible_for_testing_member
              state.notifyListeners();
            },
          ),

        if (state.toastMessage != null)
          Positioned(
            top: MediaQuery.of(context).padding.top + 12,
            left: 20,
            right: 20,
            child: IgnorePointer(
              child: Material(
                color: Colors.transparent,
                child: Container(
                  padding:
                      const EdgeInsets.symmetric(horizontal: 16, vertical: 10),
                  decoration: BoxDecoration(
                    color: const Color(0xFF1F0C3C),
                    borderRadius: BorderRadius.circular(14),
                    border: Border.all(color: MizoColors.gold),
                    boxShadow: [
                      BoxShadow(
                        color: Colors.black.withValues(alpha: 0.45),
                        blurRadius: 16,
                      ),
                    ],
                  ),
                  child: Text(
                    state.toastMessage!,
                    textAlign: TextAlign.center,
                    style: const TextStyle(
                        color: MizoColors.goldLight,
                        fontWeight: FontWeight.w700,
                        fontSize: 13),
                  ),
                ),
              ),
            ),
          ),
      ],
    );
  }
}
