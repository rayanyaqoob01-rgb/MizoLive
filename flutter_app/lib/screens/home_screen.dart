import 'package:flutter/material.dart';
import '../data/mizo_seed_data.dart';
import '../models/mizo_models.dart';
import '../state/mizo_app_state.dart';
import '../theme/mizo_theme.dart';
import '../widgets/mizo_widgets.dart';

class HomeScreen extends StatefulWidget {
  final MizoAppState state;
  final ValueChanged<LiveStream> onOpenLive;
  final ValueChanged<RoomItem> onOpenRoom;
  final VoidCallback onOpenWallet;
  final ValueChanged<int> onOpenVideos;

  const HomeScreen({
    super.key,
    required this.state,
    required this.onOpenLive,
    required this.onOpenRoom,
    required this.onOpenWallet,
    required this.onOpenVideos,
  });

  @override
  State<HomeScreen> createState() => _HomeScreenState();
}

class _HomeScreenState extends State<HomeScreen> {
  String _query = '';
  bool _searching = false;

  @override
  Widget build(BuildContext context) {
    final s = widget.state;
    final q = _query.trim().toLowerCase();
    final streams = s.streams.where((st) {
      if (q.isEmpty) return true;
      return st.username.toLowerCase().contains(q) ||
          st.title.toLowerCase().contains(q) ||
          st.category.toLowerCase().contains(q);
    }).toList();

    final rooms = s.rooms.where((r) {
      if (q.isEmpty) return true;
      return r.name.toLowerCase().contains(q) ||
          r.hostName.toLowerCase().contains(q);
    }).toList();

    return CustomScrollView(
      slivers: [
        SliverAppBar(
          floating: true,
          titleSpacing: 16,
          title: Row(
            children: [
              const MizoLogoMark(size: 34),
              const SizedBox(width: 10),
              RichText(
                text: TextSpan(
                  style: TextStyle(
                    fontSize: 19,
                    fontWeight: FontWeight.w900,
                    color: Theme.of(context).brightness == Brightness.dark
                        ? Colors.white
                        : const Color(0xFF1A0835),
                  ),
                  children: const [
                    TextSpan(text: 'Mizo'),
                    TextSpan(
                        text: 'Live', style: TextStyle(color: MizoColors.gold)),
                  ],
                ),
              ),
            ],
          ),
          actions: [
            GoldCoinPill(coins: s.profile.coins, onTap: widget.onOpenWallet),
            IconButton(
              onPressed: () => setState(() => _searching = !_searching),
              icon: const Icon(Icons.search_rounded),
            ),
            IconButton(
              onPressed: () =>
                  s.setTab(MainTab.chat, inboxTab: InboxTab.notifications),
              icon: Stack(
                clipBehavior: Clip.none,
                children: [
                  const Icon(Icons.notifications_none_rounded),
                  if (s.totalUnreadInbox > 0)
                    Positioned(
                      right: -3,
                      top: -3,
                      child: Container(
                        width: 10,
                        height: 10,
                        decoration: const BoxDecoration(
                          color: MizoColors.crimson,
                          shape: BoxShape.circle,
                        ),
                      ),
                    ),
                ],
              ),
            ),
          ],
        ),
        if (_searching)
          SliverToBoxAdapter(
            child: Padding(
              padding: const EdgeInsets.fromLTRB(16, 6, 16, 8),
              child: TextField(
                onChanged: (v) => setState(() => _query = v),
                decoration: const InputDecoration(
                  hintText: 'Search live hosts, party rooms, categories...',
                  prefixIcon: Icon(Icons.search),
                ),
              ),
            ),
          ),
        SliverPadding(
          padding: const EdgeInsets.fromLTRB(16, 10, 16, 24),
          sliver: SliverList(
            delegate: SliverChildListDelegate([
              // Hero Banner + Store Entry
              Container(
                padding: const EdgeInsets.all(16),
                decoration: BoxDecoration(
                  borderRadius: BorderRadius.circular(24),
                  image: const DecorationImage(
                    image: AssetImage(MizoAssets.heroStage),
                    fit: BoxFit.cover,
                    opacity: 0.35,
                  ),
                  gradient: MizoColors.neonHeroGradient,
                  border: Border.all(
                      color: MizoColors.gold.withValues(alpha: 0.45)),
                ),
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    const Text(
                      'ROYAL STAGE LIVE',
                      style: TextStyle(
                        color: MizoColors.gold,
                        fontSize: 11,
                        fontWeight: FontWeight.w800,
                        letterSpacing: 1.5,
                      ),
                    ),
                    const SizedBox(height: 6),
                    const Text(
                      'Stream, Battle PK & Host Party Rooms',
                      style: TextStyle(
                        color: Colors.white,
                        fontSize: 18,
                        fontWeight: FontWeight.w800,
                      ),
                    ),
                    const SizedBox(height: 12),
                    Row(
                      children: [
                        ElevatedButton.icon(
                          style: ElevatedButton.styleFrom(
                            backgroundColor: MizoColors.gold,
                            foregroundColor: const Color(0xFF1E0B3B),
                          ),
                          onPressed: () => s.setTab(MainTab.store),
                          icon: const Icon(Icons.shopping_bag_rounded, size: 16),
                          label: const Text('Royal Store',
                              style: TextStyle(fontWeight: FontWeight.w800)),
                        ),
                        const SizedBox(width: 10),
                        OutlinedButton.icon(
                          style: OutlinedButton.styleFrom(
                            foregroundColor: Colors.white,
                            side: const BorderSide(color: MizoColors.neonPurple),
                          ),
                          onPressed: () => widget.onOpenVideos(0),
                          icon: const Icon(Icons.play_arrow_rounded, size: 18),
                          label: const Text('Watch Videos'),
                        ),
                      ],
                    ),
                  ],
                ),
              ),
              const SizedBox(height: 18),

              // Active Creators Strip
              const Text(
                'Online Creators',
                style: TextStyle(fontSize: 15, fontWeight: FontWeight.w800),
              ),
              const SizedBox(height: 10),
              SizedBox(
                height: 92,
                child: ListView.separated(
                  scrollDirection: Axis.horizontal,
                  itemCount: s.activeUsers.length,
                  separatorBuilder: (_, __) => const SizedBox(width: 14),
                  itemBuilder: (ctx, i) {
                    final u = s.activeUsers[i];
                    return GestureDetector(
                      onTap: () {
                        final match = s.streams
                            .where((st) => st.username == u.name)
                            .toList();
                        if (match.isNotEmpty) {
                          widget.onOpenLive(match.first);
                        } else {
                          s.showToast('${u.name} (${u.handle}) · Lv.${u.level}');
                        }
                      },
                      child: Column(
                        children: [
                          Stack(
                            clipBehavior: Clip.none,
                            children: [
                              ProfileFrameAvatar(
                                  imageAsset: u.avatar, size: 54),
                              if (u.isLive)
                                Positioned(
                                  bottom: -3,
                                  left: 10,
                                  right: 10,
                                  child: Container(
                                    padding: const EdgeInsets.symmetric(
                                        vertical: 1),
                                    decoration: BoxDecoration(
                                      color: MizoColors.crimson,
                                      borderRadius: BorderRadius.circular(999),
                                    ),
                                    child: const Text(
                                      'LIVE',
                                      textAlign: TextAlign.center,
                                      style: TextStyle(
                                          fontSize: 8,
                                          fontWeight: FontWeight.w900,
                                          color: Colors.white),
                                    ),
                                  ),
                                ),
                            ],
                          ),
                          const SizedBox(height: 6),
                          Text(u.name,
                              style: const TextStyle(
                                  fontSize: 11, fontWeight: FontWeight.w600)),
                        ],
                      ),
                    );
                  },
                ),
              ),
              const SizedBox(height: 18),

              // Live Streams Grid
              Row(
                mainAxisAlignment: MainAxisAlignment.spaceBetween,
                children: [
                  const Text(
                    'Live Now',
                    style: TextStyle(fontSize: 16, fontWeight: FontWeight.w800),
                  ),
                  Text('${streams.length} streams',
                      style: const TextStyle(
                          fontSize: 12, color: MizoColors.gold)),
                ],
              ),
              const SizedBox(height: 10),
              LayoutBuilder(
                builder: (ctx, constraints) {
                  final cols = constraints.maxWidth >= 960
                      ? 4
                      : (constraints.maxWidth >= 620 ? 3 : 2);
                  return GridView.builder(
                    shrinkWrap: true,
                    physics: const NeverScrollableScrollPhysics(),
                    gridDelegate: SliverGridDelegateWithFixedCrossAxisCount(
                      crossAxisCount: cols,
                      mainAxisSpacing: 12,
                      crossAxisSpacing: 12,
                      childAspectRatio: 0.78,
                    ),
                    itemCount: streams.length,
                    itemBuilder: (ctx, idx) {
                      final st = streams[idx];
                      return GestureDetector(
                        onTap: () => widget.onOpenLive(st),
                        child: ClipRRect(
                          borderRadius: BorderRadius.circular(20),
                          child: Stack(
                            fit: StackFit.expand,
                            children: [
                              Image.asset(st.thumbnail, fit: BoxFit.cover),
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
                                    color: MizoColors.crimson,
                                    borderRadius: BorderRadius.circular(999),
                                  ),
                                  child: const Text('LIVE',
                                      style: TextStyle(
                                          color: Colors.white,
                                          fontSize: 9,
                                          fontWeight: FontWeight.w900)),
                                ),
                              ),
                              Positioned(
                                top: 10,
                                right: 10,
                                child: Container(
                                  padding: const EdgeInsets.symmetric(
                                      horizontal: 7, vertical: 3),
                                  decoration: BoxDecoration(
                                    color: Colors.black54,
                                    borderRadius: BorderRadius.circular(999),
                                  ),
                                  child: Text('👁 ${st.viewerDisplay}',
                                      style: const TextStyle(
                                          color: Colors.white,
                                          fontSize: 10,
                                          fontWeight: FontWeight.w700)),
                                ),
                              ),
                              Positioned(
                                left: 10,
                                right: 10,
                                bottom: 10,
                                child: Column(
                                  crossAxisAlignment: CrossAxisAlignment.start,
                                  children: [
                                    Text(st.title,
                                        maxLines: 1,
                                        overflow: TextOverflow.ellipsis,
                                        style: const TextStyle(
                                            color: Colors.white,
                                            fontWeight: FontWeight.w700,
                                            fontSize: 12)),
                                    const SizedBox(height: 4),
                                    Row(
                                      children: [
                                        Expanded(
                                          child: Text(st.username,
                                              maxLines: 1,
                                              overflow: TextOverflow.ellipsis,
                                              style: const TextStyle(
                                                  color: MizoColors.goldLight,
                                                  fontSize: 11,
                                                  fontWeight: FontWeight.w700)),
                                        ),
                                        LevelBadge(level: st.hostLevel),
                                      ],
                                    ),
                                  ],
                                ),
                              ),
                            ],
                          ),
                        ),
                      );
                    },
                  );
                },
              ),
              const SizedBox(height: 20),

              // Featured Party Rooms
              Row(
                mainAxisAlignment: MainAxisAlignment.spaceBetween,
                children: [
                  const Text('Popular Party Rooms',
                      style:
                          TextStyle(fontSize: 16, fontWeight: FontWeight.w800)),
                  TextButton(
                    onPressed: () => s.setTab(MainTab.rooms),
                    child: const Text('See All',
                        style: TextStyle(color: MizoColors.gold)),
                  ),
                ],
              ),
              ...rooms.take(3).map(
                    (room) => Card(
                      margin: const EdgeInsets.only(bottom: 10),
                      child: ListTile(
                        onTap: () => widget.onOpenRoom(room),
                        leading: ClipRRect(
                          borderRadius: BorderRadius.circular(12),
                          child: Image.asset(room.coverImage,
                              width: 54, height: 54, fit: BoxFit.cover),
                        ),
                        title: Text(room.name,
                            style: const TextStyle(fontWeight: FontWeight.w700)),
                        subtitle: Text(
                            '${room.hostName} · ${room.seatCapacity} Seats · ${room.participantDisplay} in room',
                            style: const TextStyle(fontSize: 12)),
                        trailing: ElevatedButton(
                          style: ElevatedButton.styleFrom(
                            backgroundColor: MizoColors.royalPurple,
                            foregroundColor: Colors.white,
                          ),
                          onPressed: () => widget.onOpenRoom(room),
                          child: const Text('Join'),
                        ),
                      ),
                    ),
                  ),
            ]),
          ),
        ),
      ],
    );
  }
}
