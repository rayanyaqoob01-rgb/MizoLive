import 'dart:io';
import 'package:flutter/material.dart';
import 'package:image_picker/image_picker.dart';
import '../data/mizo_seed_data.dart';
import '../models/mizo_models.dart';
import '../services/firebase_service.dart';
import '../state/mizo_app_state.dart';
import '../theme/mizo_theme.dart';
import '../widgets/mizo_widgets.dart';

class VideosScreen extends StatefulWidget {
  final MizoAppState state;
  const VideosScreen({super.key, required this.state});

  @override
  State<VideosScreen> createState() => _VideosScreenState();
}

class _VideosScreenState extends State<VideosScreen> {
  late final PageController _pageCtrl;

  @override
  void initState() {
    super.initState();
    _pageCtrl = PageController(initialPage: widget.state.videoFeedIndex);
  }

  @override
  void dispose() {
    _pageCtrl.dispose();
    super.dispose();
  }

  void _openComments(FeedVideo video) {
    final ctrl = TextEditingController();
    showModalBottomSheet(
      context: context,
      isScrollControlled: true,
      backgroundColor: MizoColors.royalCard,
      builder: (ctx) => StatefulBuilder(
        builder: (ctx, setModalState) => Padding(
          padding: EdgeInsets.only(
            left: 16,
            right: 16,
            top: 16,
            bottom: MediaQuery.of(ctx).viewInsets.bottom + 16,
          ),
          child: SizedBox(
            height: 360,
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Text('Comments (${video.comments.length})',
                    style: const TextStyle(
                        fontSize: 16,
                        fontWeight: FontWeight.w800,
                        color: Colors.white)),
                const SizedBox(height: 10),
                Expanded(
                  child: ListView.builder(
                    itemCount: video.comments.length,
                    itemBuilder: (_, idx) {
                      final c = video.comments[idx];
                      return ListTile(
                        leading: CircleAvatar(
                            backgroundImage: AssetImage(c.avatar)),
                        title: Text(c.username,
                            style: const TextStyle(
                                color: MizoColors.goldLight,
                                fontSize: 12,
                                fontWeight: FontWeight.w700)),
                        subtitle: Text(c.text,
                            style: const TextStyle(
                                color: Colors.white, fontSize: 13)),
                        trailing: Text(c.timestamp,
                            style: const TextStyle(
                                color: Colors.white54, fontSize: 10)),
                      );
                    },
                  ),
                ),
                Row(
                  children: [
                    Expanded(
                      child: TextField(
                        controller: ctrl,
                        decoration:
                            const InputDecoration(hintText: 'Add a comment...'),
                      ),
                    ),
                    IconButton(
                      onPressed: () {
                        final t = ctrl.text.trim();
                        if (t.isEmpty) return;
                        setModalState(() {
                          video.comments.insert(
                            0,
                            VideoComment(
                              id: 'vc-${DateTime.now().millisecondsSinceEpoch}',
                              username: widget.state.profile.username,
                              avatar: widget.state.profile.avatar,
                              level: widget.state.profile.level,
                              text: t,
                              timestamp: 'Just now',
                            ),
                          );
                          ctrl.clear();
                        });
                        widget.state.addActivityXp(20, 'Comment');
                      },
                      icon: const Icon(Icons.send, color: MizoColors.gold),
                    ),
                  ],
                ),
              ],
            ),
          ),
        ),
      ),
    );
  }

  @override
  Widget build(BuildContext context) {
    final videos = widget.state.feedVideos;
    return PageView.builder(
      controller: _pageCtrl,
      scrollDirection: Axis.vertical,
      itemCount: videos.length,
      itemBuilder: (_, idx) {
        final v = videos[idx];
        return GestureDetector(
          onDoubleTap: () {
            setState(() {
              if (!v.isLiked) {
                v.isLiked = true;
                v.likes += 1;
                widget.state.addActivityXp(10);
              }
            });
          },
          child: Stack(
            fit: StackFit.expand,
            children: [
              Image.asset(v.thumbnail, fit: BoxFit.cover),
              Container(
                decoration: const BoxDecoration(
                  gradient: LinearGradient(
                    colors: [
                      Colors.black45,
                      Colors.transparent,
                      Colors.black87,
                    ],
                    begin: Alignment.topCenter,
                    end: Alignment.bottomCenter,
                  ),
                ),
              ),
              Positioned(
                top: 46,
                left: 16,
                child: Container(
                  padding:
                      const EdgeInsets.symmetric(horizontal: 12, vertical: 6),
                  decoration: BoxDecoration(
                    color: Colors.black54,
                    borderRadius: BorderRadius.circular(999),
                  ),
                  child: const Text('MizoLive Reels · Swipe Up',
                      style: TextStyle(
                          color: Colors.white,
                          fontSize: 12,
                          fontWeight: FontWeight.w700)),
                ),
              ),
              Positioned(
                right: 12,
                bottom: 84,
                child: Column(
                  children: [
                    _actionBtn(
                      icon: v.isLiked ? Icons.favorite : Icons.favorite_border,
                      color: v.isLiked ? MizoColors.crimson : Colors.white,
                      label: '${v.likes}',
                      onTap: () => setState(() {
                        v.isLiked = !v.isLiked;
                        v.likes += v.isLiked ? 1 : -1;
                        if (v.isLiked) widget.state.addActivityXp(10);
                      }),
                    ),
                    _actionBtn(
                      icon: Icons.chat_bubble_outline,
                      color: Colors.white,
                      label: '${v.comments.length}',
                      onTap: () => _openComments(v),
                    ),
                    _actionBtn(
                      icon: v.isSaved ? Icons.bookmark : Icons.bookmark_border,
                      color: v.isSaved ? MizoColors.gold : Colors.white,
                      label: 'Save',
                      onTap: () {
                        setState(() => v.isSaved = !v.isSaved);
                        widget.state.showToast(
                            v.isSaved ? 'Saved to Profile' : 'Removed');
                      },
                    ),
                    _actionBtn(
                      icon: Icons.repeat,
                      color: v.isReposted ? MizoColors.emerald : Colors.white,
                      label: '${v.reposts}',
                      onTap: () => setState(() {
                        v.isReposted = !v.isReposted;
                        v.reposts += v.isReposted ? 1 : -1;
                      }),
                    ),
                    _actionBtn(
                      icon: Icons.share,
                      color: Colors.white,
                      label: '${v.shares}',
                      onTap: () {
                        setState(() => v.shares += 1);
                        widget.state.showToast('Video link copied');
                      },
                    ),
                  ],
                ),
              ),
              Positioned(
                left: 16,
                right: 84,
                bottom: 24,
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    Row(
                      children: [
                        ProfileFrameAvatar(
                            imageAsset: v.creatorAvatar, size: 38),
                        const SizedBox(width: 10),
                        Expanded(
                          child: Column(
                            crossAxisAlignment: CrossAxisAlignment.start,
                            children: [
                              Text(v.creatorName,
                                  style: const TextStyle(
                                      color: Colors.white,
                                      fontWeight: FontWeight.w800)),
                              Text(v.creatorHandle,
                                  style: const TextStyle(
                                      color: Colors.white70, fontSize: 11)),
                            ],
                          ),
                        ),
                        ElevatedButton(
                          style: ElevatedButton.styleFrom(
                            backgroundColor: v.isFollowing
                                ? Colors.white24
                                : MizoColors.gold,
                            foregroundColor: v.isFollowing
                                ? Colors.white
                                : const Color(0xFF1E0B3B),
                            padding: const EdgeInsets.symmetric(horizontal: 12),
                          ),
                          onPressed: () =>
                              setState(() => v.isFollowing = !v.isFollowing),
                          child: Text(v.isFollowing ? 'Following' : 'Follow',
                              style: const TextStyle(
                                  fontSize: 11, fontWeight: FontWeight.w800)),
                        ),
                      ],
                    ),
                    const SizedBox(height: 10),
                    Text(v.description,
                        maxLines: 3,
                        overflow: TextOverflow.ellipsis,
                        style:
                            const TextStyle(color: Colors.white, fontSize: 13)),
                    const SizedBox(height: 6),
                    Row(
                      children: [
                        const Icon(Icons.music_note,
                            size: 14, color: MizoColors.gold),
                        const SizedBox(width: 4),
                        Expanded(
                          child: Text(v.audioTitle,
                              maxLines: 1,
                              overflow: TextOverflow.ellipsis,
                              style: const TextStyle(
                                  color: MizoColors.goldLight, fontSize: 11)),
                        ),
                      ],
                    ),
                  ],
                ),
              ),
            ],
          ),
        );
      },
    );
  }

  Widget _actionBtn({
    required IconData icon,
    required Color color,
    required String label,
    required VoidCallback onTap,
  }) {
    return Padding(
      padding: const EdgeInsets.only(bottom: 14),
      child: GestureDetector(
        onTap: onTap,
        child: Column(
          children: [
            CircleAvatar(
              radius: 22,
              backgroundColor: Colors.black54,
              child: Icon(icon, color: color, size: 22),
            ),
            const SizedBox(height: 3),
            Text(label,
                style: const TextStyle(
                    color: Colors.white,
                    fontSize: 11,
                    fontWeight: FontWeight.w700)),
          ],
        ),
      ),
    );
  }
}

class UploadVideoScreen extends StatefulWidget {
  final MizoAppState state;
  const UploadVideoScreen({super.key, required this.state});

  @override
  State<UploadVideoScreen> createState() => _UploadVideoScreenState();
}

class _UploadVideoScreenState extends State<UploadVideoScreen> {
  final _titleCtrl = TextEditingController();
  final _descCtrl = TextEditingController();
  String _privacy = 'Public';
  XFile? _pickedVideo;
  bool _uploading = false;

  @override
  void dispose() {
    _titleCtrl.dispose();
    _descCtrl.dispose();
    super.dispose();
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(title: const Text('Upload Video')),
      body: ListView(
        padding: const EdgeInsets.all(16),
        children: [
          OutlinedButton.icon(
            style: OutlinedButton.styleFrom(
              minimumSize: const Size.fromHeight(54),
              side: const BorderSide(color: MizoColors.gold),
            ),
            onPressed: () async {
              final picker = ImagePicker();
              final file = await picker.pickVideo(source: ImageSource.gallery);
              if (file != null) setState(() => _pickedVideo = file);
            },
            icon: const Icon(Icons.video_library, color: MizoColors.gold),
            label: Text(
              _pickedVideo != null
                  ? 'Selected: ${_pickedVideo!.name}'
                  : 'Select Video from Android Gallery',
            ),
          ),
          const SizedBox(height: 14),
          TextField(
            controller: _titleCtrl,
            decoration: const InputDecoration(labelText: 'Video Caption / Title'),
          ),
          const SizedBox(height: 12),
          TextField(
            controller: _descCtrl,
            maxLines: 3,
            decoration: const InputDecoration(labelText: 'Description & Hashtags'),
          ),
          const SizedBox(height: 14),
          Row(
            children: ['Public', 'Private']
                .map((p) => Padding(
                      padding: const EdgeInsets.only(right: 10),
                      child: ChoiceChip(
                        label: Text(p),
                        selected: _privacy == p,
                        selectedColor: MizoColors.gold,
                        onSelected: (_) => setState(() => _privacy = p),
                      ),
                    ))
                .toList(),
          ),
          const SizedBox(height: 22),
          ElevatedButton(
            style: ElevatedButton.styleFrom(
              backgroundColor: MizoColors.gold,
              foregroundColor: const Color(0xFF1E0B3B),
              minimumSize: const Size.fromHeight(50),
            ),
            onPressed: _uploading
                ? null
                : () async {
                    final caption = _titleCtrl.text.trim();
                    if (caption.isEmpty) {
                      widget.state.showToast('Add a caption first');
                      return;
                    }
                    setState(() => _uploading = true);
                    String? remoteUrl;
                    if (_pickedVideo != null) {
                      remoteUrl = await MizoFirebaseService.instance
                          .uploadFile('videos', File(_pickedVideo!.path));
                    }
                    final item = UserVideo(
                      id: 'vid-${DateTime.now().millisecondsSinceEpoch}',
                      title: caption,
                      description: _descCtrl.text.trim().isEmpty
                          ? caption
                          : _descCtrl.text.trim(),
                      privacy: _privacy,
                      thumbnail: MizoAssets.heroStage,
                      videoUrl: remoteUrl,
                      duration: '0:30',
                      views: '1',
                      likes: '0',
                      creatorName: widget.state.profile.username,
                      createdAt: 'Just now',
                    );
                    widget.state.myVideos.insert(0, item);
                    if (_privacy == 'Public') {
                      widget.state.feedVideos.insert(
                        0,
                        FeedVideo(
                          id: 'feed-${item.id}',
                          creatorName: widget.state.profile.username,
                          creatorHandle: '@${widget.state.profile.username.toLowerCase()}',
                          creatorAvatar: widget.state.profile.avatar,
                          creatorLevel: widget.state.profile.level,
                          description: item.description,
                          audioTitle: 'Original Audio · ${widget.state.profile.username}',
                          thumbnail: item.thumbnail,
                          videoUrl: remoteUrl,
                          likes: 1,
                          shares: 0,
                          reposts: 0,
                        ),
                      );
                    }
                    widget.state.addActivityXp(80, 'Upload Video');
                    if (mounted) Navigator.pop(context);
                  },
            child: Text(_uploading ? 'Uploading...' : 'Publish Video',
                style: const TextStyle(fontWeight: FontWeight.w800)),
          ),
        ],
      ),
    );
  }
}
