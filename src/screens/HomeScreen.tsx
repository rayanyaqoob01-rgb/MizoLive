import React, { useState } from 'react';
import {
  ChevronRight,
  Clapperboard,
  Flame,
  Heart,
  Play,
  ShoppingBag,
  Sparkles,
  Star,
  Users,
} from 'lucide-react';
import { GoldCoinIcon, LiveCard, RoomCard, SafeImage } from '../components/Cards';
import { AppHeader } from '../components/Header';
import { LevelBadge } from '../components/LevelBadge';
import { MizoHeroEmblem, MizoWordmark } from '../components/MizoLogo';
import { UserInfoTarget } from '../components/UserInfoModal';
import { ASSETS } from '../data/mizoData';
import { ActiveUserItem, FeedVideo, LiveStream, RoomItem } from '../types/mizo';

interface HomeScreenProps {
  streams: LiveStream[];
  rooms: RoomItem[];
  activeUsers: ActiveUserItem[];
  feedVideos: FeedVideo[];
  coins: number;
  unreadNotifications: number;
  onOpenStore: () => void;
  onOpenWallet: () => void;
  onOpenRooms: () => void;
  onOpenNotifications: () => void;
  onSelectStream: (stream: LiveStream) => void;
  onJoinRoom: (room: RoomItem) => void;
  onOpenVideoFeed: (initialIndex?: number) => void;
  onOpenUserInfo: (user: UserInfoTarget) => void;
}

export const HomeScreen: React.FC<HomeScreenProps> = ({
  streams,
  rooms,
  activeUsers,
  feedVideos,
  coins,
  unreadNotifications,
  onOpenStore,
  onOpenWallet,
  onOpenRooms,
  onOpenNotifications,
  onSelectStream,
  onJoinRoom,
  onOpenVideoFeed,
  onOpenUserInfo,
}) => {
  const [searchOpen, setSearchOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');

  const q = searchQuery.trim().toLowerCase();

  const filteredStreams = streams.filter((s) => {
    if (!q) return true;
    return (
      s.username.toLowerCase().includes(q) ||
      s.title.toLowerCase().includes(q) ||
      s.category.toLowerCase().includes(q)
    );
  });

  const filteredRooms = rooms.filter((r) => {
    if (!q) return true;
    return (
      r.name.toLowerCase().includes(q) ||
      r.hostName.toLowerCase().includes(q) ||
      r.description.toLowerCase().includes(q)
    );
  });

  const filteredActiveUsers = activeUsers.filter((u) => {
    if (!q) return true;
    return (
      u.name.toLowerCase().includes(q) ||
      u.handle.toLowerCase().includes(q) ||
      u.status.toLowerCase().includes(q)
    );
  });

  const liveNowStreams = filteredStreams.filter((s) => s.section === 'Live Now');
  const popularLiveStreams = filteredStreams.filter((s) => s.section === 'Popular Live');
  const recommendedLiveStreams = filteredStreams.filter(
    (s) => s.section === 'Recommended Live'
  );

  const popularRooms = filteredRooms.filter((r) => r.homeSection === 'Popular Rooms');
  const recommendedRooms = filteredRooms.filter(
    (r) => r.homeSection === 'Recommended Rooms'
  );

  return (
    <div className="min-h-screen pb-24">
      <AppHeader
        showBrand
        showSearch
        searchOpen={searchOpen}
        searchValue={searchQuery}
        onToggleSearch={() => {
          setSearchOpen((prev) => !prev);
          if (searchOpen) setSearchQuery('');
        }}
        onSearchChange={setSearchQuery}
        searchPlaceholder="Search live creators, rooms, or users..."
        showNotification
        unreadNotifications={unreadNotifications}
        onNotificationClick={onOpenNotifications}
      />

      <main className="max-w-6xl mx-auto px-4 pt-4 space-y-6">
        {/* Hero Welcome Banner */}
        <section className="relative rounded-3xl overflow-hidden border border-purple-500/35 shadow-[0_12px_40px_rgba(124,58,237,0.28)]">
          <SafeImage
            src={ASSETS.heroStage}
            alt="Mizo Live stage"
            className="w-full h-44 sm:h-56 object-cover"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-[#06040B] via-[#120726]/65 to-black/35" />

          <div className="absolute inset-0 flex flex-col items-center justify-center text-center px-4">
            <MizoHeroEmblem size={94} className="mb-1" />
            <p className="text-xs font-medium text-amber-200/95 tracking-wide">
              Welcome to
            </p>
            <h2 className="text-2xl sm:text-3xl leading-tight mt-0.5">
              <MizoWordmark />
            </h2>
            <p className="text-xs sm:text-sm text-amber-300 font-semibold mt-1 tracking-wide">
              ★ Live · Connect · Enjoy ★
            </p>
          </div>
        </section>

        {/* Quick Entry Row: Mizo Store + Watch Videos */}
        <section className="grid grid-cols-1 sm:grid-cols-2 gap-3" aria-label="Home quick access">
          <div className="w-full rounded-2xl mizo-royal-card p-3.5 flex items-center justify-between gap-3 shadow-lg">
            <button
              type="button"
              onClick={onOpenStore}
              className="flex items-center gap-3 min-w-0 text-left flex-1"
            >
              <div className="w-11 h-11 rounded-xl mizo-purple-gradient border border-amber-400/50 flex items-center justify-center shrink-0 shadow-md shadow-purple-900/50">
                <ShoppingBag className="w-5 h-5 text-amber-300" />
              </div>
              <div className="min-w-0">
                <div className="flex items-center gap-2">
                  <span className="text-sm font-display font-bold text-white">
                    Mizo Store
                  </span>
                  <span className="inline-flex items-center gap-1 text-xs font-mono-num font-bold text-amber-300">
                    <GoldCoinIcon size={13} />
                    {coins.toLocaleString()}
                  </span>
                </div>
                <p className="text-xs text-slate-300 truncate">
                  VIP Frames, Entries &amp; Assets
                </p>
              </div>
            </button>

            <button
              type="button"
              onClick={onOpenWallet}
              className="min-h-[36px] px-3.5 rounded-xl mizo-gold-gradient text-[#1E0B3B] text-xs font-bold inline-flex items-center gap-1 shrink-0 shadow-md"
            >
              <span>Wallet</span>
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>

          <button
            type="button"
            onClick={() => onOpenVideoFeed(0)}
            className="w-full rounded-2xl mizo-royal-card p-3.5 flex items-center justify-between gap-3 hover:border-amber-400/60 transition-all active:scale-[0.99] text-left shadow-lg"
          >
            <div className="flex items-center gap-3 min-w-0">
              <div className="w-11 h-11 rounded-xl bg-gradient-to-br from-fuchsia-600 to-purple-800 border border-purple-300/40 flex items-center justify-center shrink-0 shadow-md">
                <Clapperboard className="w-5 h-5 text-white" />
              </div>
              <div className="min-w-0">
                <span className="text-sm font-display font-bold text-white block">
                  Watch Videos
                </span>
                <p className="text-xs text-slate-300 truncate">
                  Short vertical creator feed
                </p>
              </div>
            </div>

            <span className="min-h-[36px] px-3.5 rounded-xl mizo-purple-gradient border border-purple-300/35 text-white text-xs font-bold inline-flex items-center gap-1 shrink-0 shadow-md">
              <Play className="w-3.5 h-3.5 fill-white" />
              <span>Watch</span>
            </span>
          </button>
        </section>

        {/* Active Users Strip */}
        <section aria-labelledby="active-users-heading" className="space-y-2.5">
          <div className="flex items-center justify-between">
            <h2
              id="active-users-heading"
              className="text-base sm:text-lg font-display font-bold text-white inline-flex items-center gap-2"
            >
              <Sparkles className="w-4 h-4 text-amber-400" />
              <span>Active Users</span>
            </h2>
            <span className="text-xs text-slate-400">
              {filteredActiveUsers.length} online
            </span>
          </div>

          <div className="flex items-center gap-3 overflow-x-auto no-scrollbar py-1">
            {filteredActiveUsers.map((user) => (
              <button
                key={user.id}
                type="button"
                onClick={() =>
                  onOpenUserInfo({
                    name: user.name,
                    handle: user.handle,
                    avatar: user.avatar,
                    level: user.level,
                  })
                }
                className="flex flex-col items-center gap-1.5 shrink-0 w-[74px] group"
              >
                <div className="relative w-14 h-14 rounded-full p-0.5 mizo-gold-gradient group-hover:scale-105 transition-transform">
                  <SafeImage
                    src={user.avatar}
                    alt={user.name}
                    className="w-full h-full rounded-full object-cover"
                  />
                  {user.isLive && (
                    <span className="absolute -bottom-1 left-1/2 -translate-x-1/2 px-1.5 py-0.2 rounded bg-rose-600 text-[9px] font-extrabold text-white border border-[#06040B]">
                      LIVE
                    </span>
                  )}
                </div>
                <span className="text-[11px] font-semibold text-white truncate max-w-full">
                  {user.name}
                </span>
                <LevelBadge level={user.level} size="xs" />
              </button>
            ))}
          </div>
        </section>

        {/* Search Empty State */}
        {q &&
          filteredStreams.length === 0 &&
          filteredRooms.length === 0 &&
          filteredActiveUsers.length === 0 && (
            <div className="mizo-royal-card rounded-2xl p-8 text-center">
              <p className="text-sm font-semibold text-white">No matches found</p>
              <p className="text-xs text-slate-400 mt-1">
                Try another creator name, room title, or clear search.
              </p>
            </div>
          )}

        {/* 1. Live Now Section */}
        {liveNowStreams.length > 0 && (
          <section aria-labelledby="live-now-heading" className="space-y-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Flame className="w-5 h-5 text-amber-400 fill-amber-400/30" />
                <h2 id="live-now-heading" className="text-lg font-display font-bold text-white">
                  Live Now
                </h2>
              </div>
            </div>

            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3.5">
              {liveNowStreams.map((stream) => (
                <LiveCard key={stream.id} stream={stream} onSelect={onSelectStream} />
              ))}
            </div>
          </section>
        )}

        {/* 2. Popular Live Section */}
        {popularLiveStreams.length > 0 && (
          <section aria-labelledby="popular-live-heading" className="space-y-3">
            <div className="flex items-center gap-2">
              <Star className="w-5 h-5 text-fuchsia-400" />
              <h2 id="popular-live-heading" className="text-lg font-display font-bold text-white">
                Popular Live
              </h2>
            </div>

            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3.5">
              {popularLiveStreams.map((stream) => (
                <LiveCard key={stream.id} stream={stream} onSelect={onSelectStream} />
              ))}
            </div>
          </section>
        )}

        {/* 3. Recommended Live Section */}
        {recommendedLiveStreams.length > 0 && (
          <section aria-labelledby="recommended-live-heading" className="space-y-3">
            <div className="flex items-center gap-2">
              <Sparkles className="w-5 h-5 text-amber-300" />
              <h2 id="recommended-live-heading" className="text-lg font-display font-bold text-white">
                Recommended Live
              </h2>
            </div>

            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3.5">
              {recommendedLiveStreams.map((stream) => (
                <LiveCard key={stream.id} stream={stream} onSelect={onSelectStream} />
              ))}
            </div>
          </section>
        )}

        {/* 4. Popular Rooms Section */}
        {popularRooms.length > 0 && (
          <section aria-labelledby="popular-rooms-heading" className="space-y-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Users className="w-5 h-5 text-amber-400" />
                <h2 id="popular-rooms-heading" className="text-lg font-display font-bold text-white">
                  Popular Rooms
                </h2>
              </div>
              <button
                type="button"
                onClick={onOpenRooms}
                className="text-xs font-semibold text-amber-300 hover:text-amber-200 inline-flex items-center gap-0.5"
              >
                <span>See All</span>
                <ChevronRight className="w-4 h-4" />
              </button>
            </div>

            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3.5">
              {popularRooms.map((room) => (
                <RoomCard key={room.id} room={room} onJoin={onJoinRoom} />
              ))}
            </div>
          </section>
        )}

        {/* 5. Recommended Rooms Section */}
        {recommendedRooms.length > 0 && (
          <section aria-labelledby="recommended-rooms-heading" className="space-y-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Sparkles className="w-5 h-5 text-purple-300" />
                <h2 id="recommended-rooms-heading" className="text-lg font-display font-bold text-white">
                  Recommended Rooms
                </h2>
              </div>
              <button
                type="button"
                onClick={onOpenRooms}
                className="text-xs font-semibold text-amber-300 hover:text-amber-200 inline-flex items-center gap-0.5"
              >
                <span>Explore</span>
                <ChevronRight className="w-4 h-4" />
              </button>
            </div>

            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3.5">
              {recommendedRooms.map((room) => (
                <RoomCard key={room.id} room={room} onJoin={onJoinRoom} />
              ))}
            </div>
          </section>
        )}

        {/* Trending Videos Strip (Quick jump to separate Videos Tab) */}
        {!q && (
          <section aria-labelledby="videos-heading" className="space-y-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Clapperboard className="w-5 h-5 text-purple-400" />
                <h2 id="videos-heading" className="text-lg font-display font-bold text-white">
                  Trending Videos
                </h2>
              </div>

              <button
                type="button"
                onClick={() => onOpenVideoFeed(0)}
                className="min-h-[36px] px-2 text-xs font-semibold text-amber-300 hover:text-amber-200 inline-flex items-center gap-0.5 transition-colors"
              >
                <span>Open Videos</span>
                <ChevronRight className="w-4 h-4" />
              </button>
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
              {feedVideos.slice(0, 4).map((vid, idx) => (
                <button
                  key={vid.id}
                  type="button"
                  onClick={() => onOpenVideoFeed(idx)}
                  className="group relative aspect-[9/14] rounded-2xl overflow-hidden bg-[#140B26] border border-purple-500/25 hover:border-amber-400/70 transition-all text-left active:scale-[0.98]"
                >
                  <SafeImage
                    src={vid.thumbnail}
                    alt={vid.description}
                    className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/20 to-transparent" />

                  <div className="absolute top-2 left-2 flex items-center gap-1">
                    <LevelBadge level={vid.creatorLevel} size="xs" />
                  </div>

                  <div className="absolute inset-0 flex items-center justify-center opacity-80 group-hover:opacity-100">
                    <span className="w-10 h-10 rounded-full bg-black/55 backdrop-blur-md border border-amber-400/50 flex items-center justify-center text-white">
                      <Play className="w-4 h-4 fill-white ml-0.5" />
                    </span>
                  </div>

                  <div className="absolute inset-x-0 bottom-0 p-2.5 space-y-0.5">
                    <p className="text-xs font-bold text-white truncate">{vid.creatorName}</p>
                    <p className="text-[11px] text-slate-300 line-clamp-1">{vid.description}</p>
                    <p className="text-[10px] text-rose-300 font-mono-num inline-flex items-center gap-1">
                      <Heart className="w-3 h-3 fill-rose-400 text-rose-400" />
                      {vid.likes >= 1000 ? `${(vid.likes / 1000).toFixed(1)}K` : vid.likes}
                    </p>
                  </div>
                </button>
              ))}
            </div>
          </section>
        )}
      </main>
    </div>
  );
};
