import 'dart:async';
import 'package:agora_rtc_engine/agora_rtc_engine.dart';
import 'package:flutter/material.dart';
import '../data/mizo_seed_data.dart';
import '../models/mizo_models.dart';
import '../services/agora_service.dart';
import '../state/mizo_app_state.dart';
import '../theme/mizo_theme.dart';
import '../widgets/mizo_widgets.dart';

class GoLiveSetupScreen extends StatefulWidget {
  final MizoAppState state;
  const GoLiveSetupScreen({super.key, required this.state});

  @override
  State<GoLiveSetupScreen> createState() => _GoLiveSetupScreenState();
}

class _GoLiveSetupScreenState extends State<GoLiveSetupScreen> {
  final _titleCtrl = TextEditingController(text: 'Late Night Royal Live');
  String _category = 'Music & Talk';

  @override
  void dispose() {
    _titleCtrl.dispose();
    super.dispose();
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(title: const Text('Go Live Studio')),
      body: ListView(
        padding: const EdgeInsets.all(16),
        children: [
          Container(
            height: 200,
            decoration: BoxDecoration(
              borderRadius: BorderRadius.circular(24),
              image: const DecorationImage(
                image: AssetImage(MizoAssets.heroStage),
                fit: BoxFit.cover,
              ),
              border: Border.all(color: MizoColors.gold.withValues(alpha: 0.5)),
            ),
            child: const Center(
              child: Chip(
                backgroundColor: Colors.black54,
                label: Text('Live Camera & Agora Token Ready on Launch',
                    style: TextStyle(color: MizoColors.goldLight)),
              ),
            ),
          ),
          const SizedBox(height: 16),
          TextField(
            controller: _titleCtrl,
            decoration: const InputDecoration(labelText: 'Stream Title'),
          ),
          const SizedBox(height: 14),
          Wrap(
            spacing: 8,
            children: ['Music & Talk', 'Lifestyle', 'PK Stage', 'Chat']
                .map((c) => ChoiceChip(
                      label: Text(c),
                      selected: _category == c,
                      selectedColor: MizoColors.gold,
                      onSelected: (_) => setState(() => _category = c),
                    ))
                .toList(),
          ),
          const SizedBox(height: 24),
          ElevatedButton.icon(
            style: ElevatedButton.styleFrom(
              backgroundColor: MizoColors.gold,
              foregroundColor: const Color(0xFF1E0B3B),
              minimumSize: const Size.fromHeight(52),
            ),
            onPressed: () {
              final s = widget.state;
              final stream = LiveStream(
                id: 'live-${DateTime.now().millisecondsSinceEpoch}',
                username: s.profile.username,
                hostLevel: s.profile.level,
                title: _titleCtrl.text.trim().isEmpty
                    ? 'MizoLive Broadcast'
                    : _titleCtrl.text.trim(),
                viewers: 18,
                viewerDisplay: '18',
                thumbnail: MizoAssets.heroStage,
                avatar: s.profile.avatar,
                category: _category,
                section: 'Live Now',
                isVerified: s.profile.isVerified,
              );
              s.streams.insert(0, stream);
              Navigator.pushReplacement(
                context,
                MaterialPageRoute(
                  builder: (_) =>
                      LiveRoomScreen(state: s, stream: stream, isHost: true),
                ),
              );
            },
            icon: const Icon(Icons.sensors_rounded),
            label: const Text('Start Live Broadcast',
                style: TextStyle(fontWeight: FontWeight.w900)),
          ),
        ],
      ),
    );
  }
}

class LiveRoomScreen extends StatefulWidget {
  final MizoAppState state;
  final LiveStream stream;
  final bool isHost;

  const LiveRoomScreen({
    super.key,
    required this.state,
    required this.stream,
    this.isHost = false,
  });

  @override
  State<LiveRoomScreen> createState() => _LiveRoomScreenState();
}

class _LiveRoomScreenState extends State<LiveRoomScreen> {
  final _chatCtrl = TextEditingController();
  final List<String> _chat = [
    '[VIP 1] Aarav: Welcome to the live stage!',
    '[VIP 4] Cute Queen: Golden vibes tonight!',
  ];
  final List<GiftHistoryRecord> _giftHistory = [];
  int _likes = 1840;
  int _elapsedSec = 0;
  bool _following = false;
  String? _giftBanner;
  String _agoraNote = 'Connecting to Agora live channel...';
  Timer? _timer;

  // PK Battle State
  PkOpponent? _pkOpponent;
  int _pkLeftScore = 0;
  int _pkRightScore = 0;
  int _pkSecondsLeft = 120;

  @override
  void initState() {
    super.initState();
    _initAgora();
    _timer = Timer.periodic(const Duration(seconds: 1), (_) {
      if (!mounted) return;
      setState(() {
        _elapsedSec += 1;
        if (_pkOpponent != null && _pkSecondsLeft > 0) _pkSecondsLeft -= 1;
      });
    });
  }

  Future<void> _initAgora() async {
    final res = await MizoAgoraService.instance.joinChannel(
      channelName: 'live_${widget.stream.id}',
      isPublisher: widget.isHost,
      withVideo: true,
    );
    if (mounted) setState(() => _agoraNote = res.message);
  }

  @override
  void dispose() {
    _timer?.cancel();
    _chatCtrl.dispose();
    MizoAgoraService.instance.leaveChannel();
    super.dispose();
  }

  void _openGiftSheet() {
    showModalBottomSheet(
      context: context,
      backgroundColor: MizoColors.royalCard,
      builder: (ctx) => StatefulBuilder(
        builder: (ctx, setModalState) => Padding(
          padding: const EdgeInsets.all(16),
          child: Column(
            mainAxisSize: MainAxisSize.min,
            children: [
              Row(
                mainAxisAlignment: MainAxisAlignment.spaceBetween,
                children: [
                  Text('Send Gift to ${widget.stream.username}',
                      style: const TextStyle(
                          color: Colors.white,
                          fontSize: 15,
                          fontWeight: FontWeight.w800)),
                  GoldCoinPill(coins: widget.state.profile.coins),
                ],
              ),
              const SizedBox(height: 12),
              GridView.builder(
                shrinkWrap: true,
                itemCount: widget.state.gifts.length,
                gridDelegate: const SliverGridDelegateWithFixedCrossAxisCount(
                  crossAxisCount: 4,
                  crossAxisSpacing: 8,
                  mainAxisSpacing: 8,
                  childAspectRatio: 0.85,
                ),
                itemBuilder: (_, idx) {
                  final g = widget.state.gifts[idx];
                  return GestureDetector(
                    onTap: () async {
                      final okAuth = await ensureAuthenticatedOrPrompt(
                          context, widget.state, 'send gifts');
                      if (!okAuth) return;
                      final sent = await widget.state
                          .sendGift(g, widget.stream.username);
                      if (sent && mounted) {
                        setState(() {
                          _giftHistory.insert(
                            0,
                            GiftHistoryRecord(
                              id: 'gh-${DateTime.now().millisecondsSinceEpoch}',
                              senderName: widget.state.profile.username,
                              senderLevel: widget.state.profile.level,
                              recipientName: widget.stream.username,
                              giftName: g.name,
                              giftPrice: g.price,
                              iconKey: g.iconKey,
                              timestamp: 'Just now',
                            ),
                          );
                          _giftBanner =
                              '${widget.state.profile.username} sent ${g.name} (+${g.price} Coins)!';
                          if (_pkOpponent != null) _pkLeftScore += g.pkPoints;
                        });
                        setModalState(() {});
                        Navigator.pop(ctx);
                      }
                    },
                    child: Container(
                      decoration: BoxDecoration(
                        color: MizoColors.royalSurface,
                        borderRadius: BorderRadius.circular(14),
                        border: Border.all(
                            color: MizoColors.gold.withValues(alpha: 0.35)),
                      ),
                      child: Column(
                        mainAxisAlignment: MainAxisAlignment.center,
                        children: [
                          const Icon(Icons.card_giftcard,
                              color: MizoColors.gold, size: 24),
                          const SizedBox(height: 4),
                          Text(g.name,
                              maxLines: 1,
                              overflow: TextOverflow.ellipsis,
                              style: const TextStyle(
                                  color: Colors.white, fontSize: 10)),
                          Text('${g.price}',
                              style: const TextStyle(
                                  color: MizoColors.gold,
                                  fontSize: 11,
                                  fontWeight: FontWeight.w800)),
                        ],
                      ),
                    ),
                  );
                },
              ),
            ],
          ),
        ),
      ),
    );
  }

  void _openPkModal() {
    final hosts = buildEligiblePkHosts();
    showModalBottomSheet(
      context: context,
      backgroundColor: MizoColors.royalCard,
      builder: (ctx) => ListView(
        padding: const EdgeInsets.all(16),
        children: [
          const Text('Invite Host to PK Battle',
              style: TextStyle(
                  color: Colors.white,
                  fontSize: 16,
                  fontWeight: FontWeight.w800)),
          const SizedBox(height: 10),
          ...hosts.map((h) => ListTile(
                leading: ProfileFrameAvatar(imageAsset: h.avatar, size: 40),
                title:
                    Text(h.username, style: const TextStyle(color: Colors.white)),
                subtitle: Text('${h.viewers} watching · Lv.${h.level}',
                    style: const TextStyle(color: Colors.white60, fontSize: 12)),
                trailing: ElevatedButton(
                  style: ElevatedButton.styleFrom(
                      backgroundColor: MizoColors.gold,
                      foregroundColor: const Color(0xFF1E0B3B)),
                  onPressed: () {
                    setState(() {
                      _pkOpponent = h;
                      _pkLeftScore = 120;
                      _pkRightScore = 95;
                      _pkSecondsLeft = 120;
                    });
                    Navigator.pop(ctx);
                  },
                  child: const Text('Start PK'),
                ),
              )),
        ],
      ),
    );
  }

  void _openReportBlock() {
    showModalBottomSheet(
      context: context,
      backgroundColor: MizoColors.royalCard,
      builder: (ctx) => Padding(
        padding: const EdgeInsets.all(16),
        child: Column(
          mainAxisSize: MainAxisSize.min,
          children: [
            ListTile(
              leading: const Icon(Icons.flag, color: MizoColors.gold),
              title: Text('Report ${widget.stream.username}',
                  style: const TextStyle(color: Colors.white)),
              onTap: () {
                Navigator.pop(ctx);
                widget.state.submitReport(
                  widget.stream.username,
                  'live',
                  'Reported from live room moderation menu',
                );
              },
            ),
            ListTile(
              leading: const Icon(Icons.block, color: MizoColors.crimson),
              title: Text('Block ${widget.stream.username}',
                  style: const TextStyle(color: Colors.white)),
              onTap: () {
                Navigator.pop(ctx);
                widget.state.blockUser(
                    widget.stream.username, 'Blocked during live stream');
                Navigator.pop(context);
              },
            ),
          ],
        ),
      ),
    );
  }

  @override
  Widget build(BuildContext context) {
    final mm = (_elapsedSec ~/ 60).toString().padLeft(2, '0');
    final ss = (_elapsedSec % 60).toString().padLeft(2, '0');

    return Scaffold(
      backgroundColor: MizoColors.obsidian,
      body: GestureDetector(
        onDoubleTap: () {
          setState(() => _likes += 1);
          widget.state.addActivityXp(5);
        },
        child: Stack(
          fit: StackFit.expand,
          children: [
            if (MizoAgoraService.instance.status == AgoraStatus.connected &&
                MizoAgoraService.instance.engine != null &&
                (widget.isHost || MizoAgoraService.instance.remoteUids.isNotEmpty))
              AgoraVideoView(
                controller: widget.isHost
                    ? VideoViewController(
                        rtcEngine: MizoAgoraService.instance.engine!,
                        canvas: const VideoCanvas(uid: 0),
                      )
                    : VideoViewController.remote(
                        rtcEngine: MizoAgoraService.instance.engine!,
                        canvas: VideoCanvas(
                          uid: MizoAgoraService.instance.remoteUids.first,
                        ),
                        connection: RtcConnection(
                          channelId: 'live_${widget.stream.id}',
                        ),
                      ),
              )
            else
              Image.asset(widget.stream.thumbnail, fit: BoxFit.cover),
            Container(
              decoration: const BoxDecoration(
                gradient: LinearGradient(
                  colors: [Colors.black54, Colors.transparent, Colors.black87],
                  begin: Alignment.topCenter,
                  end: Alignment.bottomCenter,
                ),
              ),
            ),
            SafeArea(
              child: Column(
                children: [
                  // Top Bar
                  Padding(
                    padding: const EdgeInsets.symmetric(
                        horizontal: 12, vertical: 8),
                    child: Row(
                      children: [
                        ProfileFrameAvatar(
                            imageAsset: widget.stream.avatar, size: 38),
                        const SizedBox(width: 8),
                        Expanded(
                          child: Column(
                            crossAxisAlignment: CrossAxisAlignment.start,
                            children: [
                              Text(widget.stream.username,
                                  style: const TextStyle(
                                      color: Colors.white,
                                      fontWeight: FontWeight.w800)),
                              Text(
                                  '${widget.stream.viewerDisplay} viewers · $mm:$ss · ❤ $_likes',
                                  style: const TextStyle(
                                      color: MizoColors.goldLight,
                                      fontSize: 11)),
                            ],
                          ),
                        ),
                        if (!widget.isHost)
                          ElevatedButton(
                            style: ElevatedButton.styleFrom(
                              backgroundColor: _following
                                  ? Colors.white24
                                  : MizoColors.gold,
                              foregroundColor: _following
                                  ? Colors.white
                                  : const Color(0xFF1E0B3B),
                            ),
                            onPressed: () =>
                                setState(() => _following = !_following),
                            child: Text(_following ? 'Following' : 'Follow',
                                style: const TextStyle(
                                    fontSize: 11, fontWeight: FontWeight.w800)),
                          ),
                        IconButton(
                          onPressed: _openReportBlock,
                          icon:
                              const Icon(Icons.more_vert, color: Colors.white),
                        ),
                        IconButton(
                          onPressed: () => Navigator.pop(context),
                          icon: const Icon(Icons.close, color: Colors.white),
                        ),
                      ],
                    ),
                  ),
                  Container(
                    margin: const EdgeInsets.symmetric(horizontal: 12),
                    padding:
                        const EdgeInsets.symmetric(horizontal: 12, vertical: 6),
                    decoration: BoxDecoration(
                      color: Colors.black54,
                      borderRadius: BorderRadius.circular(12),
                      border: Border.all(
                          color: MizoColors.gold.withValues(alpha: 0.35)),
                    ),
                    child: Text(
                      'Agora RTC: $_agoraNote',
                      style: const TextStyle(
                          color: MizoColors.goldLight, fontSize: 11),
                    ),
                  ),
                  if (_pkOpponent != null)
                    Container(
                      margin: const EdgeInsets.all(12),
                      padding: const EdgeInsets.all(12),
                      decoration: BoxDecoration(
                        color: MizoColors.royalCard.withValues(alpha: 0.92),
                        borderRadius: BorderRadius.circular(18),
                        border: Border.all(color: MizoColors.gold),
                      ),
                      child: Column(
                        children: [
                          Row(
                            mainAxisAlignment: MainAxisAlignment.spaceBetween,
                            children: [
                              Text('${widget.stream.username}: $_pkLeftScore',
                                  style: const TextStyle(
                                      color: MizoColors.gold,
                                      fontWeight: FontWeight.w800)),
                              Text('PK ${_pkSecondsLeft}s',
                                  style: const TextStyle(
                                      color: Colors.white,
                                      fontWeight: FontWeight.w900)),
                              Text('${_pkOpponent!.username}: $_pkRightScore',
                                  style: const TextStyle(
                                      color: MizoColors.magentaAccent,
                                      fontWeight: FontWeight.w800)),
                            ],
                          ),
                          const SizedBox(height: 6),
                          LinearProgressIndicator(
                            value: _pkLeftScore /
                                ((_pkLeftScore + _pkRightScore) == 0
                                    ? 1
                                    : (_pkLeftScore + _pkRightScore)),
                            color: MizoColors.gold,
                            backgroundColor: MizoColors.magentaAccent,
                          ),
                        ],
                      ),
                    ),
                  if (_giftBanner != null)
                    Container(
                      margin: const EdgeInsets.symmetric(
                          horizontal: 16, vertical: 6),
                      padding: const EdgeInsets.symmetric(
                          horizontal: 14, vertical: 8),
                      decoration: BoxDecoration(
                        gradient: MizoColors.goldGradient,
                        borderRadius: BorderRadius.circular(999),
                      ),
                      child: Text(
                        _giftBanner!,
                        style: const TextStyle(
                            color: Color(0xFF1E0B3B),
                            fontWeight: FontWeight.w900,
                            fontSize: 12),
                      ),
                    ),
                  const Spacer(),
                  // Chat Feed
                  SizedBox(
                    height: 150,
                    child: ListView.builder(
                      padding: const EdgeInsets.symmetric(horizontal: 14),
                      itemCount: _chat.length,
                      itemBuilder: (_, idx) => Container(
                        margin: const EdgeInsets.only(bottom: 4),
                        padding: const EdgeInsets.symmetric(
                            horizontal: 10, vertical: 5),
                        decoration: BoxDecoration(
                          color: Colors.black54,
                          borderRadius: BorderRadius.circular(12),
                        ),
                        child: Text(_chat[idx],
                            style: const TextStyle(
                                color: Colors.white, fontSize: 12)),
                      ),
                    ),
                  ),
                  // Bottom Controls
                  Padding(
                    padding: const EdgeInsets.all(12),
                    child: Row(
                      children: [
                        Expanded(
                          child: TextField(
                            controller: _chatCtrl,
                            decoration: const InputDecoration(
                              hintText: 'Comment in live chat...',
                              isDense: true,
                            ),
                          ),
                        ),
                        IconButton(
                          onPressed: () {
                            final t = _chatCtrl.text.trim();
                            if (t.isEmpty) return;
                            setState(() {
                              _chat.add('${widget.state.profile.username}: $t');
                              _chatCtrl.clear();
                            });
                            widget.state.addActivityXp(15);
                          },
                          icon: const Icon(Icons.send_rounded,
                              color: MizoColors.gold),
                        ),
                        IconButton.filled(
                          style: IconButton.styleFrom(
                              backgroundColor: MizoColors.gold),
                          onPressed: _openGiftSheet,
                          icon: const Icon(Icons.card_giftcard,
                              color: Color(0xFF1E0B3B)),
                        ),
                        if (widget.isHost) ...[
                          IconButton(
                            onPressed: _openPkModal,
                            icon: const Icon(Icons.flash_on,
                                color: MizoColors.gold),
                          ),
                          IconButton(
                            onPressed: MizoAgoraService.instance.toggleFlash,
                            icon: const Icon(Icons.flashlight_on,
                                color: Colors.white),
                          ),
                          IconButton(
                            onPressed: MizoAgoraService.instance.switchCamera,
                            icon: const Icon(Icons.cameraswitch,
                                color: Colors.white),
                          ),
                        ],
                      ],
                    ),
                  ),
                ],
              ),
            ),
          ],
        ),
      ),
    );
  }
}
