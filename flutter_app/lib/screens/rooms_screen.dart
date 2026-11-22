import 'package:flutter/material.dart';
import '../data/mizo_seed_data.dart';
import '../models/mizo_models.dart';
import '../services/agora_service.dart';
import '../state/mizo_app_state.dart';
import '../theme/mizo_theme.dart';
import '../widgets/mizo_widgets.dart';

class RoomsScreen extends StatefulWidget {
  final MizoAppState state;
  final ValueChanged<RoomItem> onOpenRoom;
  final VoidCallback onCreateRoom;

  const RoomsScreen({
    super.key,
    required this.state,
    required this.onOpenRoom,
    required this.onCreateRoom,
  });

  @override
  State<RoomsScreen> createState() => _RoomsScreenState();
}

class _RoomsScreenState extends State<RoomsScreen> {
  String _category = 'All';
  static const _cats = ['All', 'Hot', 'Popular', 'New', 'Recommended'];

  @override
  Widget build(BuildContext context) {
    final rooms = widget.state.rooms.where((r) {
      if (_category == 'All') return true;
      return r.category == _category;
    }).toList();

    return Scaffold(
      appBar: AppBar(
        title: const Text('Party Rooms',
            style: TextStyle(fontWeight: FontWeight.w800)),
        actions: [
          Padding(
            padding: const EdgeInsets.only(right: 12),
            child: ElevatedButton.icon(
              style: ElevatedButton.styleFrom(
                backgroundColor: MizoColors.gold,
                foregroundColor: const Color(0xFF1E0B3B),
              ),
              onPressed: widget.onCreateRoom,
              icon: const Icon(Icons.add, size: 18),
              label: const Text('Host Room',
                  style: TextStyle(fontWeight: FontWeight.w800)),
            ),
          ),
        ],
      ),
      body: Column(
        children: [
          SizedBox(
            height: 48,
            child: ListView.separated(
              padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 6),
              scrollDirection: Axis.horizontal,
              itemCount: _cats.length,
              separatorBuilder: (_, __) => const SizedBox(width: 8),
              itemBuilder: (_, i) {
                final c = _cats[i];
                final active = _category == c;
                return ChoiceChip(
                  label: Text(c),
                  selected: active,
                  selectedColor: MizoColors.gold,
                  labelStyle: TextStyle(
                    color: active ? const Color(0xFF1E0B3B) : null,
                    fontWeight: FontWeight.w700,
                  ),
                  onSelected: (_) => setState(() => _category = c),
                );
              },
            ),
          ),
          Expanded(
            child: GridView.builder(
              padding: const EdgeInsets.all(16),
              gridDelegate: const SliverGridDelegateWithFixedCrossAxisCount(
                crossAxisCount: 2,
                crossAxisSpacing: 12,
                mainAxisSpacing: 12,
                childAspectRatio: 0.78,
              ),
              itemCount: rooms.length,
              itemBuilder: (_, idx) {
                final r = rooms[idx];
                return GestureDetector(
                  onTap: () => widget.onOpenRoom(r),
                  child: ClipRRect(
                    borderRadius: BorderRadius.circular(20),
                    child: Stack(
                      fit: StackFit.expand,
                      children: [
                        Image.asset(r.coverImage, fit: BoxFit.cover),
                        Container(
                          decoration: const BoxDecoration(
                            gradient: LinearGradient(
                              colors: [Colors.transparent, Colors.black87],
                              begin: Alignment.topCenter,
                              end: Alignment.bottomCenter,
                            ),
                          ),
                        ),
                        Positioned(
                          top: 10,
                          left: 10,
                          child: Container(
                            padding: const EdgeInsets.symmetric(
                                horizontal: 8, vertical: 3),
                            decoration: BoxDecoration(
                              color: MizoColors.royalPurple,
                              borderRadius: BorderRadius.circular(999),
                            ),
                            child: Text('${r.seatCapacity} Seats · ${r.roomType}',
                                style: const TextStyle(
                                    color: Colors.white,
                                    fontSize: 9,
                                    fontWeight: FontWeight.w800)),
                          ),
                        ),
                        Positioned(
                          left: 10,
                          right: 10,
                          bottom: 10,
                          child: Column(
                            crossAxisAlignment: CrossAxisAlignment.start,
                            children: [
                              Text(r.name,
                                  maxLines: 1,
                                  overflow: TextOverflow.ellipsis,
                                  style: const TextStyle(
                                      color: Colors.white,
                                      fontSize: 14,
                                      fontWeight: FontWeight.w800)),
                              Text('${r.hostName} · ${r.participantDisplay}',
                                  style: const TextStyle(
                                      color: MizoColors.goldLight, fontSize: 11)),
                            ],
                          ),
                        ),
                      ],
                    ),
                  ),
                );
              },
            ),
          ),
        ],
      ),
    );
  }
}

class CreateRoomScreen extends StatefulWidget {
  final MizoAppState state;
  const CreateRoomScreen({super.key, required this.state});

  @override
  State<CreateRoomScreen> createState() => _CreateRoomScreenState();
}

class _CreateRoomScreenState extends State<CreateRoomScreen> {
  final _nameCtrl = TextEditingController();
  final _descCtrl = TextEditingController();
  String _roomType = 'Public';
  int _seatLayout = 6;
  String _cover = MizoAssets.royalPalace;

  @override
  void dispose() {
    _nameCtrl.dispose();
    _descCtrl.dispose();
    super.dispose();
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(title: const Text('Create Party Room')),
      body: ListView(
        padding: const EdgeInsets.all(16),
        children: [
          TextField(
            controller: _nameCtrl,
            decoration: const InputDecoration(labelText: 'Room Name'),
          ),
          const SizedBox(height: 12),
          TextField(
            controller: _descCtrl,
            maxLines: 2,
            decoration: const InputDecoration(labelText: 'Topic / Welcome Note'),
          ),
          const SizedBox(height: 16),
          const Text('Seat Layout (4 / 6 / 9 / 12 Seats)',
              style: TextStyle(fontWeight: FontWeight.w800)),
          const SizedBox(height: 8),
          Wrap(
            spacing: 10,
            children: [4, 6, 9, 12]
                .map((count) => ChoiceChip(
                      label: Text('$count Seats'),
                      selected: _seatLayout == count,
                      selectedColor: MizoColors.gold,
                      labelStyle: TextStyle(
                        color: _seatLayout == count
                            ? const Color(0xFF1E0B3B)
                            : null,
                        fontWeight: FontWeight.w800,
                      ),
                      onSelected: (_) => setState(() => _seatLayout = count),
                    ))
                .toList(),
          ),
          const SizedBox(height: 16),
          const Text('Room Type',
              style: TextStyle(fontWeight: FontWeight.w800)),
          const SizedBox(height: 8),
          Wrap(
            spacing: 10,
            children: ['Public', 'VIP', 'Music', 'Chat']
                .map((t) => ChoiceChip(
                      label: Text(t),
                      selected: _roomType == t,
                      selectedColor: MizoColors.royalPurple,
                      onSelected: (_) => setState(() => _roomType = t),
                    ))
                .toList(),
          ),
          const SizedBox(height: 16),
          const Text('Cover Theme',
              style: TextStyle(fontWeight: FontWeight.w800)),
          const SizedBox(height: 8),
          SizedBox(
            height: 76,
            child: ListView(
              scrollDirection: Axis.horizontal,
              children: [
                MizoAssets.royalPalace,
                MizoAssets.musicStage,
                MizoAssets.loveLounge,
                MizoAssets.starKingdom,
                MizoAssets.heroStage,
              ]
                  .map((img) => GestureDetector(
                        onTap: () => setState(() => _cover = img),
                        child: Container(
                          margin: const EdgeInsets.only(right: 10),
                          decoration: BoxDecoration(
                            borderRadius: BorderRadius.circular(14),
                            border: Border.all(
                              color: _cover == img
                                  ? MizoColors.gold
                                  : Colors.transparent,
                              width: 2.5,
                            ),
                          ),
                          child: ClipRRect(
                            borderRadius: BorderRadius.circular(12),
                            child: Image.asset(img,
                                width: 96, height: 76, fit: BoxFit.cover),
                          ),
                        ),
                      ))
                  .toList(),
            ),
          ),
          const SizedBox(height: 24),
          ElevatedButton(
            style: ElevatedButton.styleFrom(
              backgroundColor: MizoColors.gold,
              foregroundColor: const Color(0xFF1E0B3B),
              minimumSize: const Size.fromHeight(50),
            ),
            onPressed: () {
              final title = _nameCtrl.text.trim();
              if (title.isEmpty) {
                widget.state.showToast('Please enter a room name');
                return;
              }
              final newRoom = RoomItem(
                id: 'room-${DateTime.now().millisecondsSinceEpoch}',
                name: title,
                description: _descCtrl.text.trim().isEmpty
                    ? 'Welcome to $title!'
                    : _descCtrl.text.trim(),
                coverImage: _cover,
                hostName: widget.state.profile.username,
                hostAvatar: widget.state.profile.avatar,
                hostLevel: widget.state.profile.level,
                roomType: _roomType,
                seatCapacity: _seatLayout,
                isUserHost: true,
                participants: 1,
                participantDisplay: '1',
                category: 'New',
              );
              widget.state.rooms.insert(0, newRoom);
              widget.state.addActivityXp(60, 'Host Party');
              Navigator.pop(context, newRoom);
            },
            child: const Text('Launch Party Room',
                style: TextStyle(fontWeight: FontWeight.w800)),
          ),
        ],
      ),
    );
  }
}

class PartyRoomScreen extends StatefulWidget {
  final MizoAppState state;
  final RoomItem room;
  const PartyRoomScreen({super.key, required this.state, required this.room});

  @override
  State<PartyRoomScreen> createState() => _PartyRoomScreenState();
}

class _PartyRoomScreenState extends State<PartyRoomScreen> {
  late List<RoomSeatItem> _seats;
  final _chatCtrl = TextEditingController();
  final List<String> _messages = ['Welcome to the MizoLive Party Lounge!'];
  bool _agoraTried = false;
  String _agoraNote = 'Connecting to Agora room audio...';

  @override
  void initState() {
    super.initState();
    _buildSeats(widget.room.seatCapacity);
    _joinAgoraRoom();
  }

  void _buildSeats(int capacity) {
    _seats = List.generate(capacity, (idx) {
      if (idx == 0) {
        return RoomSeatItem(
          seatIndex: 0,
          occupantId: 'host',
          occupantName: widget.room.hostName,
          occupantAvatar: widget.room.hostAvatar,
          occupantLevel: widget.room.hostLevel,
          isHostSeat: true,
        );
      }
      if (idx == 1) {
        return RoomSeatItem(
          seatIndex: 1,
          occupantId: 'p-2',
          occupantName: 'Cute Queen',
          occupantAvatar: MizoAssets.cuteQueen,
          occupantLevel: 64,
        );
      }
      return RoomSeatItem(seatIndex: idx);
    });
  }

  Future<void> _joinAgoraRoom() async {
    final res = await MizoAgoraService.instance.joinChannel(
      channelName: 'room_${widget.room.id}',
      isPublisher: widget.room.isUserHost,
      withVideo: false,
    );
    if (mounted) {
      setState(() {
        _agoraTried = true;
        _agoraNote = res.message;
      });
    }
  }

  @override
  void dispose() {
    _chatCtrl.dispose();
    MizoAgoraService.instance.leaveChannel();
    super.dispose();
  }

  @override
  Widget build(BuildContext context) {
    final isHost = widget.room.isUserHost ||
        widget.room.hostName == widget.state.profile.username;
    final cols = _seats.length <= 4 ? 2 : (_seats.length <= 9 ? 3 : 4);

    return Scaffold(
      appBar: AppBar(
        title: Text('${widget.room.name} (${_seats.length} Seats)'),
        actions: [
          if (isHost)
            PopupMenuButton<int>(
              icon: const Icon(Icons.grid_view_rounded, color: MizoColors.gold),
              onSelected: (cap) {
                setState(() {
                  widget.room.seatCapacity = cap;
                  _buildSeats(cap);
                });
              },
              itemBuilder: (_) => const [
                PopupMenuItem(value: 4, child: Text('4 Seats')),
                PopupMenuItem(value: 6, child: Text('6 Seats')),
                PopupMenuItem(value: 9, child: Text('9 Seats')),
                PopupMenuItem(value: 12, child: Text('12 Seats')),
              ],
            ),
          if (isHost)
            IconButton(
              icon: const Icon(Icons.power_settings_new, color: MizoColors.crimson),
              onPressed: () {
                widget.state.rooms.removeWhere((r) => r.id == widget.room.id);
                widget.state.showToast('Party ended');
                Navigator.pop(context);
              },
            ),
        ],
      ),
      body: Column(
        children: [
          Container(
            width: double.infinity,
            padding: const EdgeInsets.symmetric(horizontal: 14, vertical: 8),
            color: MizoColors.royalSurface,
            child: Text(
              _agoraTried ? _agoraNote : 'Initializing Agora audio channel...',
              style: const TextStyle(fontSize: 11, color: MizoColors.goldLight),
            ),
          ),
          Expanded(
            flex: 3,
            child: GridView.builder(
              padding: const EdgeInsets.all(14),
              gridDelegate: SliverGridDelegateWithFixedCrossAxisCount(
                crossAxisCount: cols,
                crossAxisSpacing: 10,
                mainAxisSpacing: 10,
                childAspectRatio: 0.9,
              ),
              itemCount: _seats.length,
              itemBuilder: (_, idx) {
                final seat = _seats[idx];
                return GestureDetector(
                  onTap: () {
                    if (seat.isLocked) {
                      if (isHost) setState(() => seat.isLocked = false);
                      return;
                    }
                    if (seat.occupantName == null) {
                      setState(() {
                        seat.occupantId = widget.state.profile.userId;
                        seat.occupantName = widget.state.profile.username;
                        seat.occupantAvatar = widget.state.profile.avatar;
                        seat.occupantLevel = widget.state.profile.level;
                      });
                    } else if (isHost && !seat.isHostSeat) {
                      setState(() => seat.isMuted = !seat.isMuted);
                    }
                  },
                  onLongPress: isHost && !seat.isHostSeat
                      ? () => setState(() {
                            if (seat.occupantName != null) {
                              seat.occupantName = null;
                              seat.occupantAvatar = null;
                            } else {
                              seat.isLocked = !seat.isLocked;
                            }
                          })
                      : null,
                  child: Container(
                    decoration: BoxDecoration(
                      color: MizoColors.royalCard,
                      borderRadius: BorderRadius.circular(18),
                      border: Border.all(
                        color: seat.isHostSeat
                            ? MizoColors.gold
                            : MizoColors.neonPurple.withValues(alpha: 0.35),
                      ),
                    ),
                    child: Column(
                      mainAxisAlignment: MainAxisAlignment.center,
                      children: [
                        if (seat.occupantAvatar != null)
                          ProfileFrameAvatar(
                              imageAsset: seat.occupantAvatar!, size: 42)
                        else
                          CircleAvatar(
                            radius: 22,
                            backgroundColor: MizoColors.royalSurface,
                            child: Icon(
                              seat.isLocked ? Icons.lock : Icons.mic_none,
                              color: seat.isLocked
                                  ? MizoColors.crimson
                                  : MizoColors.gold,
                            ),
                          ),
                        const SizedBox(height: 6),
                        Text(
                          seat.occupantName ??
                              (seat.isLocked ? 'Locked' : 'Seat ${idx + 1}'),
                          maxLines: 1,
                          overflow: TextOverflow.ellipsis,
                          style: const TextStyle(
                              fontSize: 11, fontWeight: FontWeight.w700),
                        ),
                        if (seat.isMuted)
                          const Icon(Icons.mic_off,
                              size: 12, color: MizoColors.crimson),
                      ],
                    ),
                  ),
                );
              },
            ),
          ),
          Expanded(
            flex: 2,
            child: ListView.builder(
              padding: const EdgeInsets.symmetric(horizontal: 14),
              itemCount: _messages.length,
              itemBuilder: (_, i) => Padding(
                padding: const EdgeInsets.symmetric(vertical: 3),
                child: Text(_messages[i],
                    style: const TextStyle(fontSize: 12, color: Colors.white70)),
              ),
            ),
          ),
          SafeArea(
            top: false,
            child: Padding(
              padding: const EdgeInsets.all(10),
              child: Row(
                children: [
                  IconButton(
                    onPressed: MizoAgoraService.instance.toggleMic,
                    icon: const Icon(Icons.mic, color: MizoColors.gold),
                  ),
                  Expanded(
                    child: TextField(
                      controller: _chatCtrl,
                      decoration: const InputDecoration(
                        hintText: 'Say hello in party room...',
                        isDense: true,
                      ),
                    ),
                  ),
                  IconButton(
                    onPressed: () {
                      final txt = _chatCtrl.text.trim();
                      if (txt.isEmpty) return;
                      setState(() {
                        _messages
                            .add('${widget.state.profile.username}: $txt');
                        _chatCtrl.clear();
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
