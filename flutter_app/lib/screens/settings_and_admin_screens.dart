import 'package:flutter/material.dart';
import '../config/app_config.dart';
import '../services/agora_service.dart';
import '../services/api_client.dart';
import '../services/firebase_service.dart';
import '../state/mizo_app_state.dart';
import '../theme/mizo_theme.dart';

class AccountSettingsScreen extends StatefulWidget {
  final MizoAppState state;
  const AccountSettingsScreen({super.key, required this.state});

  @override
  State<AccountSettingsScreen> createState() => _AccountSettingsScreenState();
}

class _AccountSettingsScreenState extends State<AccountSettingsScreen> {
  final _curPwdCtrl = TextEditingController();
  final _newPwdCtrl = TextEditingController();
  bool _busy = false;

  @override
  void dispose() {
    _curPwdCtrl.dispose();
    _newPwdCtrl.dispose();
    super.dispose();
  }

  @override
  Widget build(BuildContext context) {
    final s = widget.state;
    final isDark = s.themeMode == ThemeMode.dark;

    return Scaffold(
      appBar: AppBar(title: const Text('Settings & Account')),
      body: ListView(
        padding: const EdgeInsets.all(16),
        children: [
          // Theme & Appearance
          Card(
            child: SwitchListTile(
              secondary: Icon(
                isDark ? Icons.dark_mode : Icons.light_mode,
                color: MizoColors.gold,
              ),
              title: const Text('Luxury Dark Mode',
                  style: TextStyle(fontWeight: FontWeight.w800)),
              subtitle: Text(isDark
                  ? 'Black · Royal Purple · Gold Active'
                  : 'Royal Lavender Light Theme Active'),
              value: isDark,
              onChanged: (_) => setState(() => s.toggleThemeMode()),
            ),
          ),
          const SizedBox(height: 10),

          // Language & Privacy
          Card(
            child: Column(
              children: [
                ListTile(
                  leading: const Icon(Icons.language, color: MizoColors.gold),
                  title: const Text('App Language'),
                  trailing: DropdownButton<String>(
                    value: s.language,
                    underline: const SizedBox.shrink(),
                    items: const [
                      DropdownMenuItem(value: 'English', child: Text('English')),
                      DropdownMenuItem(value: 'Urdu', child: Text('Urdu')),
                      DropdownMenuItem(value: 'Arabic', child: Text('Arabic')),
                      DropdownMenuItem(value: 'Hindi', child: Text('Hindi')),
                    ],
                    onChanged: (v) {
                      if (v != null) {
                        setState(() => s.language = v);
                        s.showToast('Language updated to $v');
                      }
                    },
                  ),
                ),
                const Divider(height: 1),
                ListTile(
                  leading: const Icon(Icons.lock_outline, color: MizoColors.gold),
                  title: const Text('Profile Privacy'),
                  trailing: DropdownButton<String>(
                    value: s.profile.profilePrivacy,
                    underline: const SizedBox.shrink(),
                    items: const [
                      DropdownMenuItem(value: 'public', child: Text('Public')),
                      DropdownMenuItem(
                          value: 'followers', child: Text('Followers Only')),
                      DropdownMenuItem(value: 'private', child: Text('Private')),
                    ],
                    onChanged: (v) {
                      if (v != null) {
                        setState(() => s.profile.profilePrivacy = v);
                        MizoFirebaseService.instance
                            .syncProfileToFirestore(s.profile);
                        s.showToast('Privacy set to $v');
                      }
                    },
                  ),
                ),
              ],
            ),
          ),
          const SizedBox(height: 10),

          // Notifications
          Card(
            child: Column(
              children: [
                ListTile(
                  leading: const Icon(Icons.notifications_active,
                      color: MizoColors.gold),
                  title: const Text('Push Notifications (FCM)',
                      style: TextStyle(fontWeight: FontWeight.w800)),
                  subtitle: Text(
                      'Status: ${MizoFirebaseService.instance.diagnostics.fcmStatus}'),
                  trailing: ElevatedButton(
                    onPressed: () async {
                      final token = await MizoFirebaseService.instance
                          .registerPushNotifications();
                      if (mounted) {
                        setState(() {});
                        s.showToast(token != null
                            ? 'FCM Push Notifications Enabled'
                            : 'FCM pending Google Services config');
                      }
                    },
                    child: const Text('Enable'),
                  ),
                ),
                const Divider(height: 1),
                SwitchListTile(
                  title: const Text('Live & PK Alerts'),
                  value: s.notificationPrefs.live,
                  onChanged: (v) =>
                      setState(() => s.notificationPrefs.live = v),
                ),
                SwitchListTile(
                  title: const Text('Incoming Calls & Messages'),
                  value: s.notificationPrefs.calls,
                  onChanged: (v) =>
                      setState(() => s.notificationPrefs.calls = v),
                ),
              ],
            ),
          ),
          const SizedBox(height: 10),

          // Security & Linked Providers
          Card(
            child: Padding(
              padding: const EdgeInsets.all(14),
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  const Text('Account Security',
                      style:
                          TextStyle(fontWeight: FontWeight.w800, fontSize: 15)),
                  const SizedBox(height: 6),
                  Text(
                    s.isGuest
                        ? 'Currently browsing in Guest Mode'
                        : 'Signed in as ${s.firebaseUser?.email ?? s.firebaseUser?.uid}',
                    style: const TextStyle(fontSize: 12, color: Colors.grey),
                  ),
                  const SizedBox(height: 12),
                  Row(
                    children: [
                      Expanded(
                        child: OutlinedButton.icon(
                          onPressed: _busy
                              ? null
                              : () async {
                                  setState(() => _busy = true);
                                  try {
                                    await MizoFirebaseService.instance
                                        .linkWithGoogle();
                                    s.showToast('Google account linked');
                                  } catch (e) {
                                    s.showToast(e.toString());
                                  } finally {
                                    if (mounted) setState(() => _busy = false);
                                  }
                                },
                          icon: const Icon(Icons.g_mobiledata),
                          label: const Text('Link Google'),
                        ),
                      ),
                      const SizedBox(width: 8),
                      Expanded(
                        child: OutlinedButton.icon(
                          onPressed: () {
                            s.showAuthScreen = true;
                            // ignore: invalid_use_of_protected_member, invalid_use_of_visible_for_testing_member
                            s.notifyListeners();
                            Navigator.pop(context);
                          },
                          icon: const Icon(Icons.login),
                          label: Text(s.isGuest ? 'Sign In' : 'Switch Account'),
                        ),
                      ),
                    ],
                  ),
                  if (!s.isGuest && s.firebaseUser?.email != null) ...[
                    const SizedBox(height: 12),
                    TextField(
                      controller: _curPwdCtrl,
                      obscureText: true,
                      decoration: const InputDecoration(
                          labelText: 'Current Password'),
                    ),
                    const SizedBox(height: 8),
                    TextField(
                      controller: _newPwdCtrl,
                      obscureText: true,
                      decoration:
                          const InputDecoration(labelText: 'New Password'),
                    ),
                    const SizedBox(height: 8),
                    ElevatedButton(
                      onPressed: _busy
                          ? null
                          : () async {
                              if (_newPwdCtrl.text.length < 6) {
                                s.showToast(
                                    'New password must be at least 6 characters');
                                return;
                              }
                              setState(() => _busy = true);
                              try {
                                await MizoFirebaseService.instance
                                    .changePassword(
                                        _curPwdCtrl.text, _newPwdCtrl.text);
                                _curPwdCtrl.clear();
                                _newPwdCtrl.clear();
                                s.showToast('Password updated');
                              } catch (e) {
                                s.showToast(e.toString());
                              } finally {
                                if (mounted) setState(() => _busy = false);
                              }
                            },
                      child: const Text('Update Password'),
                    ),
                  ],
                ],
              ),
            ),
          ),
          const SizedBox(height: 10),

          // Blocked Users & Report History
          Card(
            child: ExpansionTile(
              leading: const Icon(Icons.shield_outlined, color: MizoColors.gold),
              title: Text(
                  'Safety · ${s.blockedUsers.length} Blocked · ${s.reportHistory.length} Reports'),
              children: [
                if (s.blockedUsers.isEmpty && s.reportHistory.isEmpty)
                  const Padding(
                    padding: EdgeInsets.all(14),
                    child: Text('No blocked users or submitted reports yet.',
                        style: TextStyle(fontSize: 12, color: Colors.grey)),
                  ),
                ...s.blockedUsers.map((b) => ListTile(
                      title: Text(b.name),
                      subtitle: Text('Blocked (${b.reason}) · ${b.blockedAt}'),
                      trailing: TextButton(
                        onPressed: () {
                          setState(() => s.blockedUsers.removeWhere((x) => x.id == b.id));
                          s.showToast('Unblocked ${b.name}');
                        },
                        child: const Text('Unblock'),
                      ),
                    )),
                ...s.reportHistory.map((r) => ListTile(
                      leading: const Icon(Icons.flag, color: MizoColors.crimson),
                      title: Text('${r.targetName} (${r.targetType})'),
                      subtitle: Text('${r.reason} · ${r.status} · ${r.timestamp}'),
                    )),
              ],
            ),
          ),
          const SizedBox(height: 10),

          // Admin-only Diagnostics entry (strictly gated on verified admin email)
          if (s.isAdmin) ...[
            Card(
              color: MizoColors.royalSurface,
              child: ListTile(
                leading: const Icon(Icons.admin_panel_settings,
                    color: MizoColors.gold),
                title: const Text('Admin System Diagnostics',
                    style: TextStyle(
                        color: MizoColors.goldLight,
                        fontWeight: FontWeight.w800)),
                subtitle: Text('Verified Admin: ${AppConfig.adminEmail}',
                    style: const TextStyle(color: Colors.white60, fontSize: 11)),
                trailing: const Icon(Icons.chevron_right, color: MizoColors.gold),
                onTap: () => Navigator.push(
                  context,
                  MaterialPageRoute(
                      builder: (_) => AdminDiagnosticsScreen(state: s)),
                ),
              ),
            ),
            const SizedBox(height: 10),
          ],

          // Logout & Delete Account
          Row(
            children: [
              Expanded(
                child: OutlinedButton.icon(
                  onPressed: () async {
                    await MizoFirebaseService.instance.signOut();
                    s.showToast('Signed out');
                    if (mounted) Navigator.pop(context);
                  },
                  icon: const Icon(Icons.logout),
                  label: const Text('Logout'),
                ),
              ),
              const SizedBox(width: 10),
              Expanded(
                child: OutlinedButton.icon(
                  style: OutlinedButton.styleFrom(
                      foregroundColor: MizoColors.crimson,
                      side: const BorderSide(color: MizoColors.crimson)),
                  onPressed: s.isGuest
                      ? null
                      : () async {
                          final ok = await showDialog<bool>(
                            context: context,
                            builder: (ctx) => AlertDialog(
                              title: const Text('Delete Account?'),
                              content: const Text(
                                  'This permanently deletes your Firebase Auth account.'),
                              actions: [
                                TextButton(
                                    onPressed: () => Navigator.pop(ctx, false),
                                    child: const Text('Cancel')),
                                ElevatedButton(
                                    style: ElevatedButton.styleFrom(
                                        backgroundColor: MizoColors.crimson),
                                    onPressed: () => Navigator.pop(ctx, true),
                                    child: const Text('Delete')),
                              ],
                            ),
                          );
                          if (ok == true) {
                            try {
                              await MizoFirebaseService.instance.deleteAccount();
                              s.showToast('Account deleted');
                              if (mounted) Navigator.pop(context);
                            } catch (e) {
                              s.showToast(e.toString());
                            }
                          }
                        },
                  icon: const Icon(Icons.delete_forever),
                  label: const Text('Delete Account'),
                ),
              ),
            ],
          ),
        ],
      ),
    );
  }
}

class AdminDiagnosticsScreen extends StatefulWidget {
  final MizoAppState state;
  const AdminDiagnosticsScreen({super.key, required this.state});

  @override
  State<AdminDiagnosticsScreen> createState() => _AdminDiagnosticsScreenState();
}

class _AdminDiagnosticsScreenState extends State<AdminDiagnosticsScreen> {
  Map<String, dynamic>? _serverDiag;
  bool _loading = true;
  String? _error;

  @override
  void initState() {
    super.initState();
    _load();
  }

  Future<void> _load() async {
    setState(() {
      _loading = true;
      _error = null;
    });
    final res = await MizoApiClient.instance.get('/api/admin/diagnostics');
    if (!mounted) return;
    setState(() {
      _loading = false;
      if (res.ok) {
        _serverDiag = res.data;
      } else {
        _error = res.error ?? 'Failed to fetch server diagnostics';
      }
    });
  }

  @override
  Widget build(BuildContext context) {
    if (!widget.state.isAdmin) {
      return Scaffold(
        appBar: AppBar(title: const Text('Unauthorized')),
        body: const Center(
            child: Text('Admin diagnostics require verified admin privileges.')),
      );
    }

    final fb = MizoFirebaseService.instance.diagnostics;
    final api = MizoApiClient.instance;
    final agora = MizoAgoraService.instance;

    return Scaffold(
      appBar: AppBar(
        title: const Text('Admin System Diagnostics'),
        actions: [
          IconButton(onPressed: _load, icon: const Icon(Icons.refresh)),
        ],
      ),
      body: ListView(
        padding: const EdgeInsets.all(16),
        children: [
          _sectionCard('Firebase Status', [
            _row('Project ID', AppConfig.firebaseOptions.projectId),
            _row('Firestore DB ID', AppConfig.firestoreDatabaseId),
            _row('Core Ready', '${fb.coreReady}'),
            _row('Firestore Connected', '${fb.firestoreConnected}'),
            _row('FCM Push', fb.fcmStatus),
            _row('Remote Config', fb.remoteConfigStatus),
            if (fb.firestoreError != null) _row('Last Error', fb.firestoreError!),
          ]),
          const SizedBox(height: 12),
          _sectionCard('Agora RTC Engine', [
            _row('Status', agora.status.name),
            _row('Active Channel', agora.activeChannel ?? 'None'),
            _row('Detail', agora.statusDetail ?? 'Idle'),
          ]),
          const SizedBox(height: 12),
          _sectionCard('Backend Server & API', [
            _row('API Base URL', AppConfig.apiBaseUrl),
            if (api.lastSuccess != null)
              _row('Last OK',
                  '${api.lastSuccess!.endpoint} (${api.lastSuccess!.durationMs}ms)'),
            if (_loading)
              const Padding(
                padding: EdgeInsets.all(8),
                child: LinearProgressIndicator(),
              )
            else if (_error != null)
              _row('Server Diagnostics Error', _error!)
            else if (_serverDiag != null) ...[
              _row('Agora Configured', '${_serverDiag!['agoraConfigured']}'),
              _row('WS Clients', '${_serverDiag!['wsClients'] ?? 0}'),
              _row('Active Streams', '${_serverDiag!['activeStreams'] ?? 0}'),
              _row('Uptime', '${_serverDiag!['uptimeSeconds'] ?? 0}s'),
            ],
          ]),
          const SizedBox(height: 12),
          _sectionCard('Recent Client Errors (${api.recentErrors.length})', [
            if (api.recentErrors.isEmpty)
              const Padding(
                padding: EdgeInsets.all(8),
                child: Text('No errors recorded in this session.'),
              )
            else
              ...api.recentErrors.take(10).map((e) => ListTile(
                    dense: true,
                    title: Text('${e.method} ${e.endpoint} (${e.status})'),
                    subtitle: Text(e.message),
                  )),
          ]),
        ],
      ),
    );
  }

  Widget _sectionCard(String title, List<Widget> children) => Card(
        child: Padding(
          padding: const EdgeInsets.all(14),
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              Text(title,
                  style: const TextStyle(
                      fontWeight: FontWeight.w800,
                      fontSize: 15,
                      color: MizoColors.gold)),
              const SizedBox(height: 8),
              ...children,
            ],
          ),
        ),
      );

  Widget _row(String k, String v) => Padding(
        padding: const EdgeInsets.symmetric(vertical: 3),
        child: Row(
          children: [
            Expanded(
              flex: 2,
              child: Text(k,
                  style: const TextStyle(fontSize: 12, color: Colors.grey)),
            ),
            Expanded(
              flex: 3,
              child: Text(v,
                  style: const TextStyle(
                      fontSize: 12, fontWeight: FontWeight.w700)),
            ),
          ],
        ),
      );
}
