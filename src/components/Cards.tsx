import React, { useState } from 'react';
import { Eye, Film, Play, Sparkles, Users } from 'lucide-react';
import { LiveStream, RoomItem, StoreItem, UserVideo } from '../types/mizo';
import { LevelBadge } from './LevelBadge';
import { EntryShowcaseArt, ProfileFrameOverlay } from './MizoLogo';

interface SafeImageProps {
  src: string;
  alt: string;
  className?: string;
  style?: React.CSSProperties;
}

export const SafeImage: React.FC<SafeImageProps> = ({
  src,
  alt,
  className = '',
  style,
}) => {
  const [failed, setFailed] = useState(false);

  if (failed || !src) {
    return (
      <div
        style={style}
        className={`flex items-center justify-center bg-gradient-to-br from-[#2B1055] via-[#170931] to-[#0B0518] text-amber-300/70 ${className}`}
        role="img"
        aria-label={alt}
      >
        <Film className="w-8 h-8 opacity-60" />
      </div>
    );
  }

  return (
    <img
      src={src}
      alt={alt}
      style={style}
      referrerPolicy="no-referrer"
      onError={() => setFailed(true)}
      className={className}
    />
  );
};

export const GoldCoinIcon: React.FC<{ size?: number }> = ({ size = 16 }) => (
  <span
    style={{ width: size, height: size }}
    className="inline-flex items-center justify-center rounded-full mizo-gold-gradient text-[#2E1065] font-extrabold text-[10px] shadow-sm shrink-0 border border-yellow-200/70"
    aria-hidden="true"
  >
    M
  </span>
);

/* Live Stream Card: Profile Picture, Username, LIVE Badge, Viewer Count, Join Live */
interface LiveCardProps {
  stream: LiveStream;
  onSelect: (stream: LiveStream) => void;
}

export const LiveCard: React.FC<LiveCardProps> = ({ stream, onSelect }) => {
  return (
    <div className="group relative aspect-[4/4.6] w-full rounded-2xl overflow-hidden bg-[#140B26] border border-purple-500/25 hover:border-amber-400/70 transition-all duration-150 shadow-lg flex flex-col justify-end">
      <SafeImage
        src={stream.thumbnail}
        alt={`${stream.username} live stream`}
        className="absolute inset-0 w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
      />

      {/* Top-left LIVE indicator & Viewer Count */}
      <div className="absolute top-2.5 inset-x-2.5 flex items-center justify-between gap-1">
        <div className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md bg-gradient-to-r from-rose-600 to-fuchsia-600 text-white text-[10px] font-bold tracking-wide shadow-md">
          <Play className="w-2.5 h-2.5 fill-white" />
          <span>LIVE</span>
        </div>

        <div className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-black/60 backdrop-blur-md text-[10px] font-mono-num font-semibold text-amber-300 border border-white/10">
          <Eye className="w-3 h-3" />
          <span>{stream.viewerDisplay}</span>
        </div>
      </div>

      {/* Measured Bottom Scrim */}
      <div className="absolute inset-x-0 bottom-0 h-28 bg-gradient-to-t from-black/95 via-black/65 to-transparent pointer-events-none" />

      {/* Bottom Host Info + Join Live CTA */}
      <div className="relative z-10 p-2.5 space-y-2">
        <div className="flex items-center gap-2 min-w-0">
          <SafeImage
            src={stream.avatar}
            alt={stream.username}
            className="w-7 h-7 rounded-full object-cover border border-amber-400 shrink-0"
          />
          <div className="min-w-0 flex-1">
            <div className="flex items-center gap-1">
              <span className="text-xs font-bold text-white truncate">
                {stream.username}
              </span>
              <LevelBadge level={stream.hostLevel} size="xs" />
            </div>
            <p className="text-[10px] text-slate-300 truncate">{stream.title}</p>
          </div>
        </div>

        <button
          type="button"
          onClick={() => onSelect(stream)}
          className="w-full min-h-[34px] rounded-xl mizo-purple-gradient hover:brightness-110 border border-amber-400/40 text-[11px] font-bold text-white shadow-md active:scale-[0.98] transition-all"
        >
          Join Live
        </button>
      </div>
    </div>
  );
};

/* Room Card: Room Cover, Room Name, Host, Participant Count, Join Room */
interface RoomCardProps {
  room: RoomItem;
  onJoin: (room: RoomItem) => void;
}

export const RoomCard: React.FC<RoomCardProps> = ({ room, onJoin }) => {
  return (
    <div className="group mizo-royal-card rounded-2xl overflow-hidden flex flex-col shadow-lg hover:border-amber-400/50 transition-colors">
      <div className="relative aspect-[4/3] w-full overflow-hidden">
        <SafeImage
          src={room.coverImage}
          alt={room.name}
          className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-[#0E071B] via-transparent to-black/25 pointer-events-none" />

        <div className="absolute top-2.5 left-2.5 flex items-center gap-1.5 bg-black/55 backdrop-blur-md pr-2.5 pl-1 py-1 rounded-full border border-white/15 max-w-[88%]">
          <SafeImage
            src={room.hostAvatar}
            alt={room.hostName}
            className="w-6 h-6 rounded-full object-cover border border-amber-400/70 shrink-0"
          />
          <span className="text-[11px] font-medium text-slate-100 truncate">
            {room.hostName}
          </span>
          <LevelBadge level={room.hostLevel} size="xs" />
        </div>
      </div>

      <div className="p-3 flex flex-col gap-2.5 flex-1 justify-between">
        <div>
          <h3 className="text-sm sm:text-base font-display font-bold text-white truncate">
            {room.name}
          </h3>
          <p className="text-xs text-slate-400 mt-0.5 line-clamp-1">
            {room.description}
          </p>
        </div>

        <div className="flex items-center justify-between gap-2 pt-1">
          <div className="flex items-center gap-1 text-xs text-slate-200 min-w-0">
            <Users className="w-3.5 h-3.5 text-amber-400 shrink-0" />
            <span className="font-mono-num font-semibold">{room.participantDisplay}</span>
          </div>

          <button
            type="button"
            onClick={() => onJoin(room)}
            className="min-h-[36px] px-3.5 py-1.5 rounded-xl mizo-purple-gradient hover:brightness-110 text-white text-xs font-semibold border border-amber-400/35 shadow-md shadow-purple-900/40 active:scale-95 transition-all whitespace-nowrap shrink-0"
          >
            Join Room
          </button>
        </div>
      </div>
    </div>
  );
};

/* Store Card */
interface StoreCardProps {
  item: StoreItem;
  userAvatar: string;
  isEquipped: boolean;
  onPreview: (item: StoreItem) => void;
  onBuy: (item: StoreItem) => void;
}

export const StoreCard: React.FC<StoreCardProps> = ({
  item,
  userAvatar,
  isEquipped,
  onPreview,
  onBuy,
}) => {
  const actionLabel = isEquipped
    ? 'Equipped'
    : item.owned
    ? 'Equip'
    : 'Buy';

  return (
    <div className="mizo-royal-card rounded-2xl p-3.5 flex flex-col justify-between gap-3 hover:border-amber-400/50 transition-colors">
      <div className="h-28 rounded-xl bg-gradient-to-b from-[#1D0E3D] to-[#0B0517] border border-purple-500/20 flex items-center justify-center relative overflow-hidden">
        {item.isAnimated && (
          <span className="absolute top-1.5 right-2 text-[10px] font-semibold text-amber-300/90 inline-flex items-center gap-0.5">
            <Sparkles className="w-2.5 h-2.5" /> Animated
          </span>
        )}
        {item.category === 'VIP Frames' || item.category === 'Animated Frames' ? (
          <div className="relative w-16 h-16 flex items-center justify-center animate-mizo-float">
            <SafeImage
              src={userAvatar}
              alt={`${item.name} frame preview`}
              className="w-16 h-16 rounded-full object-cover"
            />
            <ProfileFrameOverlay frameId={item.id} size={64} />
          </div>
        ) : (
          <EntryShowcaseArt styleType={item.accentStyle} size={78} animate />
        )}
      </div>

      <div className="text-center">
        <p className="text-[10px] font-semibold text-purple-300 truncate">
          {item.category}
        </p>
        <h3 className="text-sm font-display font-bold text-white truncate">
          {item.name}
        </h3>
        <p className="text-[11px] text-slate-400 truncate mt-0.5">
          {item.subtitle}
        </p>
        <div className="mt-2 inline-flex items-center justify-center gap-1.5 text-amber-300 font-mono-num text-sm font-bold">
          <GoldCoinIcon size={16} />
          <span>{item.price.toLocaleString()}</span>
        </div>
      </div>

      <div className="grid grid-cols-2 gap-2">
        <button
          type="button"
          onClick={() => onPreview(item)}
          className="min-h-[40px] px-2 rounded-xl bg-white/5 hover:bg-white/10 border border-purple-400/30 text-xs font-semibold text-slate-100 transition-colors whitespace-nowrap"
        >
          Preview
        </button>
        <button
          type="button"
          onClick={() => onBuy(item)}
          className={`min-h-[40px] px-2 rounded-xl text-xs font-bold transition-all active:scale-95 whitespace-nowrap ${
            isEquipped
              ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-400/40'
              : item.owned
              ? 'mizo-purple-gradient text-white border border-purple-300/30'
              : 'mizo-gold-gradient text-[#1E0B3B] shadow-md shadow-amber-500/20'
          }`}
        >
          {actionLabel}
        </button>
      </div>
    </div>
  );
};

/* Video Thumbnail Card */
interface VideoCardProps {
  video: UserVideo;
  onPlay: (video: UserVideo) => void;
}

export const VideoCard: React.FC<VideoCardProps> = ({ video, onPlay }) => {
  return (
    <button
      type="button"
      onClick={() => onPlay(video)}
      className="group relative aspect-[3/4] w-full rounded-2xl overflow-hidden bg-[#130A24] border border-purple-500/20 hover:border-amber-400/60 transition-all text-left active:scale-[0.98]"
    >
      <SafeImage
        src={video.thumbnail}
        alt={video.title}
        className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
      />
      <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/25 to-transparent" />

      <div className="absolute inset-0 flex items-center justify-center opacity-85 group-hover:opacity-100 transition-opacity">
        <span className="w-10 h-10 rounded-full bg-black/55 backdrop-blur-md border border-amber-400/50 flex items-center justify-center text-white">
          <Play className="w-4 h-4 fill-white ml-0.5" />
        </span>
      </div>

      <div className="absolute inset-x-0 bottom-0 p-2.5">
        <p className="text-xs font-semibold text-white line-clamp-1">
          {video.title}
        </p>
        <div className="flex items-center justify-between text-[11px] text-slate-300 mt-0.5 font-mono-num">
          <span>{video.views} views</span>
          <span>{video.duration}</span>
        </div>
      </div>
    </button>
  );
};
