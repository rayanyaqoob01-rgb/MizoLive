import React, { useRef, useState } from 'react';
import {
  BadgeCheck,
  Bookmark,
  ChevronDown,
  ChevronUp,
  Copy,
  CornerDownRight,
  Heart,
  Link2,
  MessageCircle,
  Music,
  Play,
  Plus,
  Repeat2,
  Send,
  Share2,
  X,
} from 'lucide-react';
import { SafeImage } from '../components/Cards';
import { LevelBadge } from '../components/LevelBadge';
import { UserInfoTarget } from '../components/UserInfoModal';
import { FeedVideo } from '../types/mizo';

interface VideoFeedScreenProps {
  videos: FeedVideo[];
  initialIndex?: number;
  userLevel: number;
  onToggleLike: (videoId: string, forceLike?: boolean) => void;
  onToggleSave: (videoId: string) => void;
  onToggleFollow: (videoId: string) => void;
  onAddComment: (videoId: string, text: string) => void;
  onAddCommentReply: (videoId: string, commentId: string, text: string) => void;
  onShareVideo: (videoId: string) => void;
  onRepostVideo: (videoId: string) => void;
  onOpenCreatorInfo: (user: UserInfoTarget) => void;
}

export const VideoFeedScreen: React.FC<VideoFeedScreenProps> = ({
  videos,
  initialIndex = 0,
  userLevel,
  onToggleLike,
  onToggleSave,
  onToggleFollow,
  onAddComment,
  onAddCommentReply,
  onShareVideo,
  onRepostVideo,
  onOpenCreatorInfo,
}) => {
  const [currentIndex, setCurrentIndex] = useState(
    Math.min(initialIndex, Math.max(0, videos.length - 1))
  );
  const [commentsOpen, setCommentsOpen] = useState(false);
  const [shareOpen, setShareOpen] = useState(false);
  const [commentInput, setCommentInput] = useState('');
  const [replyingTo, setReplyingTo] = useState<{ id: string; username: string } | null>(
    null
  );
  const [heartBurst, setHeartBurst] = useState<{ id: number; x: number; y: number } | null>(
    null
  );
  const [isPlayingDemo, setIsPlayingDemo] = useState(true);
  const [shareCopied, setShareCopied] = useState(false);

  const lastTapRef = useRef<number>(0);
  const lastDoubleLikeRef = useRef<number>(0);
  const touchStartYRef = useRef<number | null>(null);

  const currentVideo = videos[currentIndex];

  const goNext = () => {
    setCurrentIndex((idx) => (idx + 1 < videos.length ? idx + 1 : 0));
    setIsPlayingDemo(true);
    setCommentsOpen(false);
    setShareOpen(false);
  };

  const goPrev = () => {
    setCurrentIndex((idx) => (idx - 1 >= 0 ? idx - 1 : videos.length - 1));
    setIsPlayingDemo(true);
    setCommentsOpen(false);
    setShareOpen(false);
  };

  // Accurate double-tap like with duplicate-tap protection
  const handleVideoTap = (e: React.MouseEvent<HTMLDivElement>) => {
    const now = Date.now();
    if (now - lastTapRef.current < 280) {
      if (now - lastDoubleLikeRef.current > 450 && currentVideo) {
        lastDoubleLikeRef.current = now;
        const rect = e.currentTarget.getBoundingClientRect();
        setHeartBurst({
          id: now,
          x: e.clientX - rect.left,
          y: e.clientY - rect.top,
        });
        if (!currentVideo.isLiked) {
          onToggleLike(currentVideo.id, true);
        }
        setTimeout(() => setHeartBurst(null), 700);
      }
      lastTapRef.current = 0;
    } else {
      lastTapRef.current = now;
      setIsPlayingDemo((p) => !p);
    }
  };

  const handleTouchStart = (e: React.TouchEvent) => {
    touchStartYRef.current = e.touches[0].clientY;
  };

  const handleTouchEnd = (e: React.TouchEvent) => {
    if (touchStartYRef.current === null) return;
    const diff = touchStartYRef.current - e.changedTouches[0].clientY;
    if (diff > 55) goNext();
    else if (diff < -55) goPrev();
    touchStartYRef.current = null;
  };

  const handleCommentSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!currentVideo || !commentInput.trim()) return;
    if (replyingTo) {
      onAddCommentReply(currentVideo.id, replyingTo.id, commentInput.trim());
      setReplyingTo(null);
    } else {
      onAddComment(currentVideo.id, commentInput.trim());
    }
    setCommentInput('');
  };

  const formatCount = (n: number) =>
    n >= 1000 ? `${(n / 1000).toFixed(1)}K` : String(n);

  if (!currentVideo) return null;

  const totalCommentsAndReplies = currentVideo.comments.reduce(
    (sum, c) => sum + 1 + (c.replies?.length || 0),
    0
  );

  return (
    <div
      className="fixed inset-x-0 top-0 bottom-[62px] z-30 bg-[#05030A] flex items-center justify-center"
      onKeyDown={(e) => {
        if (e.key === 'ArrowDown') goNext();
        if (e.key === 'ArrowUp') goPrev();
      }}
    >
      {/* 9:16 Vertical Stage */}
      <div
        onTouchStart={handleTouchStart}
        onTouchEnd={handleTouchEnd}
        className="relative w-full h-full sm:h-[calc(100vh-88px)] sm:max-w-[430px] sm:rounded-3xl overflow-hidden bg-black border-0 sm:border sm:border-purple-500/35 shadow-[0_0_50px_rgba(147,51,234,0.3)]"
      >
        {/* Video / Media Canvas */}
        <div
          onClick={handleVideoTap}
          className="relative w-full h-full cursor-pointer select-none"
        >
          {currentVideo.videoUrl ? (
            <video
              src={currentVideo.videoUrl}
              autoPlay
              loop
              playsInline
              className="w-full h-full object-cover"
            />
          ) : (
            <SafeImage
              src={currentVideo.thumbnail}
              alt={currentVideo.description}
              className={`w-full h-full object-cover transition-transform duration-700 ${
                isPlayingDemo ? 'scale-[1.03]' : 'scale-100 brightness-75'
              }`}
            />
          )}

          <div className="absolute inset-0 bg-gradient-to-b from-black/60 via-transparent to-black/90 pointer-events-none" />

          {!isPlayingDemo && !currentVideo.videoUrl && (
            <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
              <div className="w-16 h-16 rounded-full bg-black/55 backdrop-blur-md border border-amber-400/60 flex items-center justify-center text-white">
                <Play className="w-7 h-7 fill-white ml-1" />
              </div>
            </div>
          )}

          {/* Double-Tap Heart Burst */}
          {heartBurst && (
            <div
              key={heartBurst.id}
              style={{ left: heartBurst.x - 40, top: heartBurst.y - 40 }}
              className="absolute pointer-events-none w-20 h-20 flex items-center justify-center animate-ping"
            >
              <Heart className="w-16 h-16 text-rose-500 fill-rose-500 drop-shadow-[0_0_16px_rgba(244,63,94,0.9)]" />
            </div>
          )}
        </div>

        {/* Top Bar */}
        <div className="absolute top-3 inset-x-3 z-20 flex items-center justify-between pt-safe">
          <div className="px-3.5 py-1.5 rounded-full bg-black/55 backdrop-blur-md border border-purple-400/35 text-xs font-bold text-amber-300">
            Videos · {currentIndex + 1}/{videos.length}
          </div>

          <div className="flex items-center gap-1.5">
            <button
              type="button"
              onClick={goPrev}
              aria-label="Previous video"
              className="w-9 h-9 rounded-full bg-black/55 backdrop-blur-md border border-white/15 flex items-center justify-center text-white hover:border-amber-400"
            >
              <ChevronUp className="w-4 h-4" />
            </button>
            <button
              type="button"
              onClick={goNext}
              aria-label="Next video"
              className="w-9 h-9 rounded-full bg-black/55 backdrop-blur-md border border-white/15 flex items-center justify-center text-white hover:border-amber-400"
            >
              <ChevronDown className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Right Side Vertical Action Rail */}
        <div className="absolute right-3 bottom-20 z-20 flex flex-col items-center gap-3.5">
          {/* Creator Avatar + Quick Follow */}
          <div className="relative mb-1">
            <button
              type="button"
              onClick={() =>
                onOpenCreatorInfo({
                  name: currentVideo.creatorName,
                  handle: currentVideo.creatorHandle,
                  avatar: currentVideo.creatorAvatar,
                  level: currentVideo.creatorLevel,
                  isFollowing: currentVideo.isFollowing,
                })
              }
              className="w-12 h-12 rounded-full p-0.5 mizo-gold-gradient block"
            >
              <SafeImage
                src={currentVideo.creatorAvatar}
                alt={currentVideo.creatorName}
                className="w-full h-full rounded-full object-cover"
              />
            </button>
            <button
              type="button"
              onClick={() => onToggleFollow(currentVideo.id)}
              aria-label={currentVideo.isFollowing ? 'Following creator' : 'Follow creator'}
              className={`absolute -bottom-2 left-1/2 -translate-x-1/2 w-6 h-6 rounded-full flex items-center justify-center text-white text-xs font-bold border border-black ${
                currentVideo.isFollowing ? 'bg-emerald-500' : 'bg-rose-500'
              }`}
            >
              {currentVideo.isFollowing ? '✓' : <Plus className="w-3.5 h-3.5" />}
            </button>
          </div>

          {/* Like */}
          <button
            type="button"
            onClick={() => onToggleLike(currentVideo.id)}
            className="flex flex-col items-center gap-0.5 min-w-[44px]"
          >
            <span className="w-10 h-10 rounded-full bg-black/50 backdrop-blur-md border border-white/15 flex items-center justify-center">
              <Heart
                className={`w-5 h-5 transition-transform active:scale-125 ${
                  currentVideo.isLiked ? 'text-rose-500 fill-rose-500' : 'text-white'
                }`}
              />
            </span>
            <span className="text-[11px] font-mono-num font-bold text-white drop-shadow">
              {formatCount(currentVideo.likes)}
            </span>
          </button>

          {/* Comments */}
          <button
            type="button"
            onClick={() => setCommentsOpen(true)}
            className="flex flex-col items-center gap-0.5 min-w-[44px]"
          >
            <span className="w-10 h-10 rounded-full bg-black/50 backdrop-blur-md border border-white/15 flex items-center justify-center text-white">
              <MessageCircle className="w-5 h-5" />
            </span>
            <span className="text-[11px] font-mono-num font-bold text-white drop-shadow">
              {totalCommentsAndReplies}
            </span>
          </button>

          {/* Save */}
          <button
            type="button"
            onClick={() => onToggleSave(currentVideo.id)}
            aria-label={currentVideo.isSaved ? 'Unsave video' : 'Save video'}
            className="flex flex-col items-center gap-0.5 min-w-[44px]"
          >
            <span
              className={`w-10 h-10 rounded-full bg-black/50 backdrop-blur-md border flex items-center justify-center ${
                currentVideo.isSaved
                  ? 'border-amber-400 text-amber-300'
                  : 'border-white/15 text-white'
              }`}
            >
              <Bookmark
                className={`w-5 h-5 ${currentVideo.isSaved ? 'fill-amber-300' : ''}`}
              />
            </span>
            <span className="text-[11px] font-bold text-white drop-shadow">
              {currentVideo.isSaved ? 'Saved' : 'Save'}
            </span>
          </button>

          {/* Repost */}
          <button
            type="button"
            onClick={() => onRepostVideo(currentVideo.id)}
            className="flex flex-col items-center gap-0.5 min-w-[44px]"
          >
            <span
              className={`w-10 h-10 rounded-full bg-black/50 backdrop-blur-md border flex items-center justify-center ${
                currentVideo.isReposted
                  ? 'border-amber-400 text-amber-300'
                  : 'border-white/15 text-white'
              }`}
            >
              <Repeat2 className="w-5 h-5" />
            </span>
            <span className="text-[11px] font-mono-num font-bold text-white drop-shadow">
              {formatCount(currentVideo.reposts)}
            </span>
          </button>

          {/* Share */}
          <button
            type="button"
            onClick={() => setShareOpen(true)}
            className="flex flex-col items-center gap-0.5 min-w-[44px]"
          >
            <span className="w-10 h-10 rounded-full bg-black/50 backdrop-blur-md border border-white/15 flex items-center justify-center text-white">
              <Share2 className="w-5 h-5" />
            </span>
            <span className="text-[11px] font-mono-num font-bold text-white drop-shadow">
              {formatCount(currentVideo.shares)}
            </span>
          </button>
        </div>

        {/* Bottom Creator & Description Overlay */}
        <div className="absolute inset-x-0 bottom-0 z-10 p-4 pr-20 space-y-2 pointer-events-auto">
          <div className="flex items-center gap-2 flex-wrap">
            <button
              type="button"
              onClick={() =>
                onOpenCreatorInfo({
                  name: currentVideo.creatorName,
                  handle: currentVideo.creatorHandle,
                  avatar: currentVideo.creatorAvatar,
                  level: currentVideo.creatorLevel,
                  isFollowing: currentVideo.isFollowing,
                })
              }
              className="text-sm font-display font-bold text-white hover:text-amber-300 inline-flex items-center gap-1"
            >
              <span>{currentVideo.creatorName}</span>
              <BadgeCheck className="w-4 h-4 text-sky-400" />
            </button>
            <LevelBadge level={currentVideo.creatorLevel} size="xs" />
            <button
              type="button"
              onClick={() => onToggleFollow(currentVideo.id)}
              className={`px-3 py-1 rounded-full text-[11px] font-bold transition-colors ${
                currentVideo.isFollowing
                  ? 'bg-white/15 text-white'
                  : 'mizo-gold-gradient text-[#1E0B3B]'
              }`}
            >
              {currentVideo.isFollowing ? 'Following' : 'Follow'}
            </button>
          </div>

          <p className="text-xs sm:text-sm text-slate-100 leading-snug line-clamp-2">
            {currentVideo.description}
          </p>

          <div className="flex items-center gap-2 text-xs text-amber-200">
            <Music
              className="w-3.5 h-3.5 shrink-0 animate-spin"
              style={{ animationDuration: '4s' }}
            />
            <span className="truncate">{currentVideo.audioTitle}</span>
          </div>
          <p className="text-[10px] text-slate-400">
            Double-tap video to like · Swipe or tap arrows to browse
          </p>
        </div>

        {/* Video Comments & Replies Drawer */}
        {commentsOpen && (
          <div className="absolute inset-x-0 bottom-0 z-30 h-[68%] rounded-t-3xl bg-[#0D061B]/95 backdrop-blur-2xl border-t border-purple-500/40 flex flex-col">
            <div className="px-4 py-3 border-b border-purple-500/20 flex items-center justify-between">
              <span className="text-sm font-display font-bold text-white">
                Comments ({totalCommentsAndReplies})
              </span>
              <button
                type="button"
                onClick={() => {
                  setCommentsOpen(false);
                  setReplyingTo(null);
                }}
                aria-label="Close comments"
                className="min-w-[36px] min-h-[36px] rounded-xl flex items-center justify-center text-slate-300 hover:text-white"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="flex-1 overflow-y-auto p-4 space-y-3.5">
              {currentVideo.comments.length === 0 ? (
                <p className="text-xs text-slate-400 text-center py-8">
                  No comments yet. Be the first to comment!
                </p>
              ) : (
                currentVideo.comments.map((c) => (
                  <div key={c.id} className="space-y-2">
                    <div className="flex items-start gap-2.5">
                      <SafeImage
                        src={c.avatar}
                        alt={c.username}
                        className="w-8 h-8 rounded-full object-cover border border-amber-400/50 shrink-0"
                      />
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-1.5 flex-wrap">
                          <span className="text-xs font-bold text-white">
                            {c.username}
                          </span>
                          <LevelBadge level={c.level} size="xs" />
                          <span className="text-[10px] text-slate-400">
                            {c.timestamp}
                          </span>
                        </div>
                        <p className="text-xs text-slate-200 mt-0.5">{c.text}</p>
                        <button
                          type="button"
                          onClick={() =>
                            setReplyingTo({ id: c.id, username: c.username })
                          }
                          className="mt-1 text-[11px] font-semibold text-amber-300 hover:underline inline-flex items-center gap-1"
                        >
                          <CornerDownRight className="w-3 h-3" />
                          <span>Reply</span>
                        </button>
                      </div>
                    </div>

                    {/* Replies */}
                    {c.replies && c.replies.length > 0 && (
                      <div className="ml-9 pl-3 border-l border-purple-500/30 space-y-2">
                        {c.replies.map((rep) => (
                          <div key={rep.id} className="flex items-start gap-2">
                            <SafeImage
                              src={rep.avatar}
                              alt={rep.username}
                              className="w-6 h-6 rounded-full object-cover border border-purple-400/50 shrink-0"
                            />
                            <div className="min-w-0">
                              <div className="flex items-center gap-1.5 flex-wrap">
                                <span className="text-[11px] font-bold text-white">
                                  {rep.username}
                                </span>
                                <LevelBadge level={rep.level} size="xs" />
                                <span className="text-[10px] text-slate-400">
                                  {rep.timestamp}
                                </span>
                              </div>
                              <p className="text-xs text-slate-300 mt-0.5">{rep.text}</p>
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                ))
              )}
            </div>

            {replyingTo && (
              <div className="px-4 py-1.5 bg-purple-950/80 border-t border-purple-500/25 flex items-center justify-between text-xs">
                <span className="text-amber-300">
                  Replying to <span className="font-bold">@{replyingTo.username}</span>
                </span>
                <button
                  type="button"
                  onClick={() => setReplyingTo(null)}
                  className="text-slate-300 hover:text-white"
                >
                  Cancel
                </button>
              </div>
            )}

            <form
              onSubmit={handleCommentSubmit}
              className="p-3 border-t border-purple-500/20 flex items-center gap-2"
            >
              <LevelBadge level={userLevel} size="xs" />
              <input
                type="text"
                value={commentInput}
                onChange={(e) => setCommentInput(e.target.value)}
                placeholder={
                  replyingTo
                    ? `Write a reply to ${replyingTo.username}...`
                    : 'Add a comment...'
                }
                className="flex-1 h-10 px-3.5 rounded-full bg-[#170D2C] border border-purple-500/35 text-xs text-white placeholder:text-slate-400 focus:outline-none focus:border-amber-400"
              />
              <button
                type="submit"
                aria-label="Post comment"
                className="w-10 h-10 rounded-full mizo-gold-gradient text-[#1E0B3B] flex items-center justify-center shrink-0"
              >
                <Send className="w-4 h-4" />
              </button>
            </form>
          </div>
        )}

        {/* Video Share Sheet */}
        {shareOpen && (
          <div className="absolute inset-x-0 bottom-0 z-30 rounded-t-3xl bg-[#0D061B]/95 backdrop-blur-2xl border-t border-purple-500/40 p-5 space-y-4">
            <div className="flex items-center justify-between">
              <span className="text-sm font-display font-bold text-white">Share Video</span>
              <button
                type="button"
                onClick={() => setShareOpen(false)}
                aria-label="Close share sheet"
                className="min-w-[36px] min-h-[36px] rounded-xl flex items-center justify-center text-slate-300"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="grid grid-cols-3 gap-3 text-center">
              <button
                type="button"
                onClick={() => {
                  onShareVideo(currentVideo.id);
                  setShareCopied(true);
                  setTimeout(() => setShareCopied(false), 1800);
                }}
                className="p-3 rounded-2xl bg-[#180E30] border border-purple-500/30 flex flex-col items-center gap-1.5 hover:border-amber-400"
              >
                <Link2 className="w-5 h-5 text-amber-300" />
                <span className="text-xs font-semibold text-white">
                  {shareCopied ? 'Copied!' : 'Copy Link'}
                </span>
              </button>

              <button
                type="button"
                onClick={() => {
                  onRepostVideo(currentVideo.id);
                  setShareOpen(false);
                }}
                className="p-3 rounded-2xl bg-[#180E30] border border-purple-500/30 flex flex-col items-center gap-1.5 hover:border-amber-400"
              >
                <Repeat2 className="w-5 h-5 text-purple-300" />
                <span className="text-xs font-semibold text-white">Repost</span>
              </button>

              <button
                type="button"
                onClick={() => {
                  onShareVideo(currentVideo.id);
                  setShareOpen(false);
                }}
                className="p-3 rounded-2xl bg-[#180E30] border border-purple-500/30 flex flex-col items-center gap-1.5 hover:border-amber-400"
              >
                <Copy className="w-5 h-5 text-sky-300" />
                <span className="text-xs font-semibold text-white">Share Feed</span>
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
