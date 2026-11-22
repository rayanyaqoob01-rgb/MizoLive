import React, { useState } from 'react';
import { Home as HomeIcon, Users } from 'lucide-react';
import { SafeImage } from '../components/Cards';
import { AppHeader } from '../components/Header';
import { ASSETS, COVER_PRESETS } from '../data/mizoData';
import { RoomItem, RoomSeatLayout } from '../types/mizo';

interface CreateRoomScreenProps {
  hostName: string;
  hostAvatar: string;
  hostLevel: number;
  onBack: () => void;
  onCreateRoom: (room: RoomItem) => void;
}

const ROOM_TYPES: Array<RoomItem['roomType']> = ['Public', 'VIP', 'Music', 'Chat'];
const SEAT_LAYOUTS: RoomSeatLayout[] = [4, 6, 9, 12];

export const CreateRoomScreen: React.FC<CreateRoomScreenProps> = ({
  hostName,
  hostAvatar,
  hostLevel,
  onBack,
  onCreateRoom,
}) => {
  const [coverImage, setCoverImage] = useState(ASSETS.royalPalace);
  const [roomName, setRoomName] = useState('');
  const [description, setDescription] = useState('');
  const [roomType, setRoomType] = useState<RoomItem['roomType']>('Public');
  const [seatCapacity, setSeatCapacity] = useState<RoomSeatLayout>(6);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!roomName.trim()) {
      setError('Please enter a room name.');
      return;
    }

    const newRoom: RoomItem = {
      id: `room-${Date.now()}`,
      name: roomName.trim(),
      description:
        description.trim() || 'Live voice hangout & music on Mizo Live.',
      coverImage,
      hostName,
      hostAvatar,
      hostLevel,
      roomType,
      seatCapacity,
      isUserHost: true,
      participants: 1,
      participantDisplay: '1',
      category: 'New',
      isJoined: true,
    };

    onCreateRoom(newRoom);
  };

  return (
    <div className="min-h-screen pb-10">
      <AppHeader title="Create Room" onBack={onBack} />

      <form onSubmit={handleSubmit} className="max-w-xl mx-auto px-4 pt-4 space-y-5">
        <section className="space-y-2.5">
          <label className="block text-sm font-display font-bold text-white">
            Room Cover
          </label>
          <div className="relative aspect-[16/9] w-full rounded-2xl overflow-hidden border border-purple-500/35">
            <SafeImage
              src={coverImage}
              alt="Selected room cover"
              className="w-full h-full object-cover"
            />
            <div className="absolute inset-0 bg-gradient-to-t from-black/75 via-transparent to-transparent" />
            <div className="absolute bottom-3 left-3.5">
              <p className="text-base font-display font-bold text-white">
                {roomName.trim() || 'Your New Mizo Room'}
              </p>
              <p className="text-xs text-amber-300">
                Hosted by {hostName} · {roomType} · {seatCapacity} Seats
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2.5 overflow-x-auto no-scrollbar py-1">
            {COVER_PRESETS.map((preset) => (
              <button
                key={preset.label}
                type="button"
                onClick={() => setCoverImage(preset.url)}
                className={`shrink-0 rounded-xl overflow-hidden border-2 transition-all ${
                  coverImage === preset.url
                    ? 'border-amber-400 scale-105'
                    : 'border-transparent opacity-75 hover:opacity-100'
                }`}
              >
                <SafeImage
                  src={preset.url}
                  alt={preset.label}
                  className="w-24 h-14 object-cover"
                />
              </button>
            ))}
          </div>
        </section>

        <section className="space-y-2">
          <label htmlFor="room-name" className="block text-sm font-display font-bold text-white">
            Room Name
          </label>
          <input
            id="room-name"
            type="text"
            required
            maxLength={40}
            value={roomName}
            onChange={(e) => {
              setRoomName(e.target.value);
              setError(null);
            }}
            placeholder="e.g. Royal Midnight Lounge"
            className="w-full h-12 px-4 rounded-xl bg-[#140B26] border border-purple-500/35 text-sm text-white placeholder:text-slate-400 focus:outline-none focus:border-amber-400"
          />
        </section>

        <section className="space-y-2">
          <span className="block text-sm font-display font-bold text-white">
            Room Type
          </span>
          <div className="grid grid-cols-4 gap-2">
            {ROOM_TYPES.map((t) => (
              <button
                key={t}
                type="button"
                onClick={() => setRoomType(t)}
                className={`min-h-[40px] rounded-xl text-xs font-bold transition-all ${
                  roomType === t
                    ? 'mizo-gold-gradient text-[#1E0B3B]'
                    : 'bg-[#140B26] text-slate-300 border border-purple-500/30'
                }`}
              >
                {t}
              </button>
            ))}
          </div>
        </section>

        {/* Configurable Seat Layout: 4, 6, 9, 12 Seats */}
        <section className="space-y-2">
          <span className="text-sm font-display font-bold text-white inline-flex items-center gap-1.5">
            <Users className="w-4 h-4 text-amber-400" />
            <span>Seat Layout</span>
          </span>
          <div className="grid grid-cols-4 gap-2">
            {SEAT_LAYOUTS.map((seats) => (
              <button
                key={seats}
                type="button"
                onClick={() => setSeatCapacity(seats)}
                className={`min-h-[40px] rounded-xl text-xs font-bold transition-all ${
                  seatCapacity === seats
                    ? 'mizo-purple-gradient text-white border border-amber-400/60'
                    : 'bg-[#140B26] text-slate-300 border border-purple-500/30'
                }`}
              >
                {seats} Seats
              </button>
            ))}
          </div>
        </section>

        <section className="space-y-2">
          <label htmlFor="room-desc" className="block text-sm font-display font-bold text-white">
            Description
          </label>
          <textarea
            id="room-desc"
            rows={3}
            maxLength={140}
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            placeholder="Describe the vibe, topic, or rules for your room..."
            className="w-full p-4 rounded-xl bg-[#140B26] border border-purple-500/35 text-sm text-white placeholder:text-slate-400 focus:outline-none focus:border-amber-400 resize-none"
          />
        </section>

        {error && <p className="text-xs font-semibold text-rose-400">{error}</p>}

        <div className="rounded-xl bg-[#120A22] border border-purple-500/20 px-3.5 py-2.5 text-xs text-slate-300">
          As room host, use &ldquo;End This Party&rdquo; when closing so no active party is left unattended.
        </div>

        <button
          type="submit"
          className="w-full min-h-[48px] rounded-2xl bg-gradient-to-r from-[#6D28D9] via-[#A21CAF] to-[#7E22CE] border border-fuchsia-300/40 text-sm font-extrabold text-white shadow-lg shadow-purple-900/50 flex items-center justify-center gap-2 hover:brightness-110 active:scale-[0.99] transition-all"
        >
          <HomeIcon className="w-4 h-4" />
          <span>Create {seatCapacity}-Seat Room</span>
        </button>
      </form>
    </div>
  );
};
