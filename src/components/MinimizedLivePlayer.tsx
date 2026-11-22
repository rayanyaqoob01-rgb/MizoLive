import React from 'react';
import { Maximize2, Play, X } from 'lucide-react';
import { LiveStream } from '../types/mizo';
import { SafeImage } from './Cards';

interface MinimizedLivePlayerProps {
  stream: LiveStream | null;
  isHost: boolean;
  onRestore: () => void;
  onClose: () => void;
}

export const MinimizedLivePlayer: React.FC<MinimizedLivePlayerProps> = ({
  stream,
  isHost,
  onRestore,
  onClose,
}) => {
  if (!stream) return null;

  return (
    <div
      className="fixed bottom-[78px] md:bottom-24 left-3 sm:left-5 z-40 max-w-[270px] rounded-2xl bg-[#160B2E]/95 backdrop-blur-xl border border-rose-500/60 shadow-[0_8px_32px_rgba(244,63,94,0.35)] p-2 flex items-center gap-2.5"
      role="region"
      aria-label="Minimized live stream"
    >
      <button
        type="button"
        onClick={onRestore}
        className="flex items-center gap-2.5 min-w-0 text-left flex-1"
      >
        <div className="relative w-11 h-14 rounded-xl overflow-hidden border border-amber-400/60 shrink-0">
          <SafeImage
            src={stream.thumbnail}
            alt={stream.username}
            className="w-full h-full object-cover"
          />
          <span className="absolute top-0.5 left-0.5 px-1 rounded bg-rose-600 text-[8px] font-bold text-white inline-flex items-center gap-0.5">
            <Play className="w-2 h-2 fill-white" />
            LIVE
          </span>
        </div>

        <div className="min-w-0">
          <p className="text-xs font-display font-bold text-white truncate">
            {stream.username}
          </p>
          <p className="text-[10px] text-amber-300 truncate">
            {isHost ? 'Host Broadcast Active' : `${stream.viewerDisplay} watching`}
          </p>
        </div>
      </button>

      <button
        type="button"
        onClick={onRestore}
        aria-label="Reopen live stream"
        className="w-8 h-8 rounded-xl bg-white/10 hover:bg-white/20 flex items-center justify-center text-amber-300 shrink-0"
      >
        <Maximize2 className="w-3.5 h-3.5" />
      </button>

      {!isHost && (
        <button
          type="button"
          onClick={onClose}
          aria-label="Close minimized live"
          className="w-8 h-8 rounded-xl bg-rose-500/20 hover:bg-rose-500/35 flex items-center justify-center text-rose-300 shrink-0"
        >
          <X className="w-3.5 h-3.5" />
        </button>
      )}
    </div>
  );
};
