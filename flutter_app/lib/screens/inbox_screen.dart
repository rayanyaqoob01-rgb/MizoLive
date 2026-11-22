import 'dart:async';
import 'package:flutter/material.dart';
import '../models/mizo_models.dart';
import '../services/agora_service.dart';
import '../services/api_client.dart';
import '../services/websocket_service.dart';
import '../state/mizo_app_state.dart';
import '../theme/mizo_theme.dart';
import '../widgets/mizo_widgets.dart';

class InboxScreen extends StatefulWidget {
  final MizoAppState state;
  final VoidCallback onOpenWallet;

  const InboxScreen({
    super.key,
    required this.state,
    required this.onOpenWallet,
  });

  @override
  State<InboxScreen> createState() => _InboxScreenState();
}

class _InboxScreenState extends State<InboxScreen> {
  late InboxTab _tab;

  @override
  void initState() {
    super.initState();
    _tab = widget.state.inboxInitialTab;
  }

  Future<void> _initiateCall(
    String peerName,
    String peerAvatar,
    int peerLevel,
    String callType,
  ) async {
    final s = widget.state;
    final okAuth =
        await ensureAuthenticatedOrPrompt(context, s, 'start a $callType call');
    if (!okAuth) return;

    final rate = callType == 'video'
        ? s.economy.videoCallCoinsPerMin
        : s.economy.audioCallCoinsPerMin;

    final confirmed = await showDialog<bool>(
      context: context,
      builder: (ctx) => AlertDialog(
        backgroundColor: MizoColors.royalCard,
        title: Text('${callType == 'video' ? 'Video' : 'Audio'} Call Confirmation',
            style: const TextStyle(color: Colors.white)),
        content: Text(
          'Call with $peerName costs $rate Coins/min (first minute billed upfront on server). Your balance: ${s.profile.coins} Coins.',
          style: const TextStyle(color: Colors.white70, fontSize: 13),
        ),
        actions: [
          TextButton(
            onPressed: () => Navigator.pop(ctx, false),
            child: const Text('Cancel'),
          ),
          ElevatedButton(
            style: ElevatedButton.styleFrom(
                backgroundColor: MizoColors.gold,
                foregroundColor: const Color(0xFF1E0B3B)),
            onPressed: () => Navigator.pop(ctx, true),
            child: const Text('Start Call'),
          ),
        ],
      ),
    );
    if (confirmed != true) return;

    final res = await MizoApiClient.instance.post('/api/calls/start', {
      'userId': s.firebaseUser?.uid ?? s.profile.userId,
      'calleeName': peerName,
      'callType': callType,
      'consentConfirmed': true,
    });
    if (!res.ok || res.data?['session'] == null) {
      s.showToast(res.error ?? 'Unable to start call');
      if (res.status == 402 && mounted) widget.onOpenWallet();
      return;
    }

    if (res.data?['account'] is Map<String, dynamic>) {
      final acc = ServerWalletAccount.fromJson(
          res.data!['account'] as Map<String, dynamic>);
      s.profile.coins = acc.coins;
    }
    final callId = res.data!['session']['callId'].toString();
    MizoWebSocketService.instance.send({
      'type': 'call:invite',
      'callId': callId,
      'callerName': s.profile.username,
      'callType': callType,
    });

    if (!mounted) return;
    await Navigator.push(
      context,
      MaterialPageRoute(
        builder: (_) => ActiveCallScreen(
          state: s,
          callId: callId,
          peerName: peerName,
          peerAvatar: peerAvatar,
          peerLevel: peerLevel,
          callType: callType,
          ratePerMin: rate,
        ),
      ),
    );
  }

  @override
  Widget build(BuildContext context) {
    final s = widget.state;
    final items = s.inboxItems.where((it) {
      if (_tab == InboxTab.messages) return it.type == 'message';
      if (_tab == InboxTab.requests) return it.type == 'request';
      if (_tab == InboxTab.notifications) return it.type == 'notification';
      return true;
    }).toList();

    return Scaffold(
      appBar: AppBar(
        title: const Text('Chat & Inbox',
            style: TextStyle(fontWeight: FontWeight.w800)),
        actions: [
          TextButton(
            onPressed: () {
              setState(() {
                for (final it in s.inboxItems) {
                  it.unreadCount = 0;
                }
              });
              s.showToast('All marked read');
            },
            child: const Text('Read All',
                style: TextStyle(color: MizoColors.gold)),
          ),
        ],
      ),
      body: Column(
        children: [
          SizedBox(
            height: 46,
            child: ListView(
              padding: const EdgeInsets.symmetric(horizontal: 14, vertical: 6),
              scrollDirection: Axis.horizontal,
              children: InboxTab.values
                  .map((t) => Padding(
                        padding: const EdgeInsets.only(right: 8),
                        child: ChoiceChip(
                          label: Text(
                              t.name[0].toUpperCase() + t.name.substring(1)),
                          selected: _tab == t,
                          selectedColor: MizoColors.gold,
                          labelStyle: TextStyle(
                            color: _tab == t ? const Color(0xFF1E0B3B) : null,
                            fontWeight: FontWeight.w700,
                          ),
                          onSelected: (_) => setState(() => _tab = t),
                        ),
                      ))
                  .toList(),
            ),
          ),
          Expanded(
            child: _tab == InboxTab.calls
                ? ListView.builder(
                    itemCount: s.callHistory.length,
                    itemBuilder: (_, idx) {
                      final c = s.callHistory[idx];
                      return ListTile(
                        leading: ProfileFrameAvatar(
                            imageAsset: c.peerAvatar, size: 42),
                        title: Text(c.peerName,
                            style: const TextStyle(fontWeight: FontWeight.w700)),
                        subtitle: Text(
                            '${c.callType.toUpperCase()} · ${c.direction} · ${c.durationDisplay} · ${c.coinsBilled} Coins',
                            style: const TextStyle(fontSize: 12)),
                        trailing: Row(
                          mainAxisSize: MainAxisSize.min,
                          children: [
                            IconButton(
                              icon: const Icon(Icons.call,
                                  color: MizoColors.emerald),
                              onPressed: () => _initiateCall(c.peerName,
                                  c.peerAvatar, c.peerLevel, 'audio'),
                            ),
                            IconButton(
                              icon: const Icon(Icons.videocam,
                                  color: MizoColors.gold),
                              onPressed: () => _initiateCall(c.peerName,
                                  c.peerAvatar, c.peerLevel, 'video'),
                            ),
                          ],
                        ),
                      );
                    },
                  )
                : ListView.builder(
                    itemCount: items.length,
                    itemBuilder: (_, idx) {
                      final it = items[idx];
                      return ListTile(
                        onTap: () {
                          setState(() => it.unreadCount = 0);
                          if (it.type == 'message') {
                            Navigator.push(
                              context,
                              MaterialPageRoute(
                                builder: (_) => ChatThreadScreen(
                                  state: s,
                                  item: it,
                                  onCall: (type) => _initiateCall(
                                      it.senderName,
                                      it.avatar ?? s.profile.avatar,
                                      it.senderLevel,
                                      type),
                                ),
                              ),
                            );
                          }
                        },
                        leading: it.avatar != null
                            ? ProfileFrameAvatar(
                                imageAsset: it.avatar!, size: 44)
                            : const CircleAvatar(
                                backgroundColor: MizoColors.royalSurface,
                                child: Icon(Icons.notifications,
                                    color: MizoColors.gold),
                              ),
                        title: Row(
                          children: [
                            Expanded(
                              child: Text(it.senderName,
                                  style: const TextStyle(
                                      fontWeight: FontWeight.w700)),
                            ),
                            Text(it.timestamp,
                                style: const TextStyle(
                                    fontSize: 11, color: Colors.white54)),
                          ],
                        ),
                        subtitle: Text(it.preview,
                            maxLines: 1,
                            overflow: TextOverflow.ellipsis,
                            style: const TextStyle(fontSize: 12)),
                        trailing: it.type == 'request'
                            ? Row(
                                mainAxisSize: MainAxisSize.min,
                                children: [
                                  IconButton(
                                    icon: const Icon(Icons.check_circle,
                                        color: MizoColors.emerald),
                                    onPressed: () => setState(() {
                                      it.type = 'message';
                                      it.unreadCount = 0;
                                    }),
                                  ),
                                  IconButton(
                                    icon: const Icon(Icons.cancel,
                                        color: MizoColors.crimson),
                                    onPressed: () => setState(
                                        () => s.inboxItems.remove(it)),
                                  ),
                                ],
                              )
                            : it.unreadCount > 0
                                ? CircleAvatar(
                                    radius: 10,
                                    backgroundColor: MizoColors.crimson,
                                    child: Text('${it.unreadCount}',
                                        style: const TextStyle(
                                            fontSize: 10,
                                            color: Colors.white,
                                            fontWeight: FontWeight.w800)),
                                  )
                                : null,
                      );
                    },
                  ),
          ),
        ],
      ),
    );
  }
}

class ChatThreadScreen extends StatefulWidget {
  final MizoAppState state;
  final InboxItem item;
  final ValueChanged<String> onCall;

  const ChatThreadScreen({
    super.key,
    required this.state,
    required this.item,
    required this.onCall,
  });

  @override
  State<ChatThreadScreen> createState() => _ChatThreadScreenState();
}

class _ChatThreadScreenState extends State<ChatThreadScreen> {
  final _ctrl = TextEditingController();

  @override
  void dispose() {
    _ctrl.dispose();
    super.dispose();
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(
        title: Text(widget.item.senderName),
        actions: [
          IconButton(
              onPressed: () => widget.onCall('audio'),
              icon: const Icon(Icons.call, color: MizoColors.emerald)),
          IconButton(
              onPressed: () => widget.onCall('video'),
              icon: const Icon(Icons.videocam, color: MizoColors.gold)),
        ],
      ),
      body: Column(
        children: [
          Expanded(
            child: ListView.builder(
              padding: const EdgeInsets.all(14),
              itemCount: widget.item.messages.length,
              itemBuilder: (_, idx) {
                final m = widget.item.messages[idx];
                return Align(
                  alignment:
                      m.isMe ? Alignment.centerRight : Alignment.centerLeft,
                  child: Container(
                    margin: const EdgeInsets.only(bottom: 8),
                    padding: const EdgeInsets.symmetric(
                        horizontal: 14, vertical: 10),
                    decoration: BoxDecoration(
                      color: m.isMe
                          ? MizoColors.royalPurple
                          : MizoColors.royalSurface,
                      borderRadius: BorderRadius.circular(16),
                    ),
                    child: Text(m.text,
                        style: const TextStyle(color: Colors.white)),
                  ),
                );
              },
            ),
          ),
          SafeArea(
            top: false,
            child: Padding(
              padding: const EdgeInsets.all(10),
              child: Row(
                children: [
                  Expanded(
                    child: TextField(
                      controller: _ctrl,
                      decoration:
                          const InputDecoration(hintText: 'Write a message...'),
                    ),
                  ),
                  IconButton(
                    onPressed: () {
                      final txt = _ctrl.text.trim();
                      if (txt.isEmpty) return;
                      setState(() {
                        widget.item.messages.add(ChatMessage(
                          id: 'msg-${DateTime.now().millisecondsSinceEpoch}',
                          isMe: true,
                          text: txt,
                          timestamp: 'Just now',
                        ));
                        widget.item.preview = txt;
                        widget.item.timestamp = 'Just now';
                        _ctrl.clear();
                      });
                    },
                    icon: const Icon(Icons.send_rounded, color: MizoColors.gold),
                  ),
                ],
              ),
            ),
          ),
        ],
      ),
    );
  }
}

class ActiveCallScreen extends StatefulWidget {
  final MizoAppState state;
  final String callId;
  final String peerName;
  final String peerAvatar;
  final int peerLevel;
  final String callType;
  final int ratePerMin;

  const ActiveCallScreen({
    super.key,
    required this.state,
    required this.callId,
    required this.peerName,
    required this.peerAvatar,
    required this.peerLevel,
    required this.callType,
    required this.ratePerMin,
  });

  @override
  State<ActiveCallScreen> createState() => _ActiveCallScreenState();
}

class _ActiveCallScreenState extends State<ActiveCallScreen> {
  int _seconds = 0;
  late int _charged;
  Timer? _timer;
  String _agoraState = 'Connecting to Agora RTC...';

  @override
  void initState() {
    super.initState();
    _charged = widget.ratePerMin;
    _connectAgora();
    _timer = Timer.periodic(const Duration(seconds: 1), (_) async {
      if (!mounted) return;
      setState(() => _seconds += 1);
      if (_seconds > 0 && _seconds % 60 == 0) {
        final tickRes = await MizoApiClient.instance
            .post('/api/calls/tick', {'callId': widget.callId});
        if (!tickRes.ok) {
          widget.state.showToast(tickRes.error ?? 'Insufficient coins');
          _endCall();
        } else if (tickRes.data?['session'] != null) {
          setState(() => _charged =
              (tickRes.data!['session']['totalCharged'] as num?)?.toInt() ??
                  _charged);
        }
      }
    });
  }

  Future<void> _connectAgora() async {
    final res = await MizoAgoraService.instance.joinChannel(
      channelName: widget.callId,
      isPublisher: true,
      withVideo: widget.callType == 'video',
    );
    if (mounted) setState(() => _agoraState = res.message);
  }

  Future<void> _endCall() async {
    _timer?.cancel();
    await MizoAgoraService.instance.leaveChannel();
    await MizoApiClient.instance
        .post('/api/calls/end', {'callId': widget.callId});
    MizoWebSocketService.instance
        .send({'type': 'call:end', 'callId': widget.callId});
    final mm = (_seconds ~/ 60).toString().padLeft(2, '0');
    final ss = (_seconds % 60).toString().padLeft(2, '0');
    widget.state.callHistory.insert(
      0,
      CallRecord(
        id: widget.callId,
        peerName: widget.peerName,
        peerAvatar: widget.peerAvatar,
        peerLevel: widget.peerLevel,
        callType: widget.callType,
        direction: 'outgoing',
        durationDisplay: '$mm:$ss',
        coinsBilled: _charged,
        timestamp: 'Just now',
      ),
    );
    if (mounted) Navigator.pop(context);
  }

  @override
  void dispose() {
    _timer?.cancel();
    super.dispose();
  }

  @override
  Widget build(BuildContext context) {
    final mm = (_seconds ~/ 60).toString().padLeft(2, '0');
    final ss = (_seconds % 60).toString().padLeft(2, '0');

    return Scaffold(
      backgroundColor: MizoColors.obsidian,
      body: SafeArea(
        child: Padding(
          padding: const EdgeInsets.all(24),
          child: Column(
            mainAxisAlignment: MainAxisAlignment.spaceBetween,
            children: [
              Column(
                children: [
                  Text('${widget.callType.toUpperCase()} CALL',
                      style: const TextStyle(
                          color: MizoColors.gold,
                          fontSize: 12,
                          fontWeight: FontWeight.w800)),
                  const SizedBox(height: 8),
                  Text(_agoraState,
                      textAlign: TextAlign.center,
                      style: const TextStyle(
                          color: Colors.white60, fontSize: 11)),
                ],
              ),
              Column(
                children: [
                  ProfileFrameAvatar(imageAsset: widget.peerAvatar, size: 108),
                  const SizedBox(height: 16),
                  Text(widget.peerName,
                      style: const TextStyle(
                          color: Colors.white,
                          fontSize: 24,
                          fontWeight: FontWeight.w800)),
                  const SizedBox(height: 6),
                  Text('$mm:$ss · $_charged Coins billed',
                      style: const TextStyle(
                          color: MizoColors.goldLight, fontSize: 14)),
                ],
              ),
              Row(
                mainAxisAlignment: MainAxisAlignment.spaceEvenly,
                children: [
                  IconButton.filled(
                    style: IconButton.styleFrom(
                        backgroundColor: MizoColors.royalSurface),
                    onPressed: MizoAgoraService.instance.toggleMic,
                    icon: const Icon(Icons.mic_off, color: Colors.white),
                  ),
                  FloatingActionButton(
                    backgroundColor: MizoColors.crimson,
                    onPressed: _endCall,
                    child: const Icon(Icons.call_end, color: Colors.white),
                  ),
                  if (widget.callType == 'video')
                    IconButton.filled(
                      style: IconButton.styleFrom(
                          backgroundColor: MizoColors.royalSurface),
                      onPressed: MizoAgoraService.instance.switchCamera,
                      icon: const Icon(Icons.cameraswitch, color: Colors.white),
                    ),
                ],
              ),
            ],
          ),
        ),
      ),
    );
  }
}
