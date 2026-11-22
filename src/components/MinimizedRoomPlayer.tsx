import React from 'react';
import { Maximize2, Radio, X } from 'lucide-react';
import { RoomItem } from '../types/mizo';
import { SafeImage } from './Cards';

interface MinimizedRoomPlayerProps {
  room: RoomItem | null;
  onRestore: () => void;
  onLeave: () => void;
}

export const MinimizedRoomPlayer: React.FC<MinimizedRoomPlayerProps> = ({
  room,
  onRestore,
  onLeave,
}) => {
  if (!room) return null;

  return (
    <div
      className="fixed bottom-[78px] md:bottom-24 right-3 sm:right-5 z-40 max-w-[270px] rounded-2xl bg-[#160B2E]/95 backdrop-blur-xl border border-amber-400/55 shadow-[0_8px_32px_rgba(147,51,234,0.45)] p-2 flex items-center gap-2.5"
      role="region"
      aria-label="Minimized room player"
    >
      <button
        type="button"
        onClick={onRestore}
        className="flex items-center gap-2.5 min-w-0 text-left flex-1"
      >
        <div className="relative w-11 h-11 rounded-xl overflow-hidden border border-amber-400/60 shrink-0">
          <SafeImage
            src={room.coverImage}
            alt={room.name}
            className="w-full h-full object-cover"
          />
          <span className="absolute bottom-0.5 right-0.5 w-4 h-4 rounded-full bg-purple-700 flex items-center justify-center">
            <Radio className="w-2.5 h-2.5 text-amber-300" />
          </span>
        </div>

        <div className="min-w-0">
          <p className="text-xs font-display font-bold text-white truncate">
            {room.name}
          </p>
          <p className="text-[10px] text-amber-300 truncate">
            Tap to return · {room.participantDisplay}
          </p>
        </div>
      </button>

      <button
        type="button"
        onClick={onRestore}
        aria-label="Reopen room"
        className="w-8 h-8 rounded-xl bg-white/10 hover:bg-white/20 flex items-center justify-center text-amber-300 shrink-0"
      >
        <Maximize2 className="w-3.5 h-3.5" />
      </button>

      <button
        type="button"
        onClick={onLeave}
        aria-label="Leave minimized room"
        className="w-8 h-8 rounded-xl bg-rose-500/20 hover:bg-rose-500/35 flex items-center justify-center text-rose-300 shrink-0"
      >
        <X className="w-3.5 h-3.5" />
      </button>
    </div>
  );
};
