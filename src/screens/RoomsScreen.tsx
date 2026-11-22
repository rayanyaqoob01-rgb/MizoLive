import React, { useState } from 'react';
import { RoomCard } from '../components/Cards';
import { AppHeader } from '../components/Header';
import { RoomCategory, RoomItem } from '../types/mizo';

interface RoomsScreenProps {
  rooms: RoomItem[];
  onJoinRoom: (room: RoomItem) => void;
}

const ROOM_CATEGORIES: RoomCategory[] = ['All', 'Popular', 'Hot', 'New', 'Recommended'];

export const RoomsScreen: React.FC<RoomsScreenProps> = ({ rooms, onJoinRoom }) => {
  const [selectedCategory, setSelectedCategory] = useState<RoomCategory>('All');
  const [searchOpen, setSearchOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');

  const filteredRooms = rooms.filter((room) => {
    const matchesCategory =
      selectedCategory === 'All' || room.category === selectedCategory;
    const q = searchQuery.trim().toLowerCase();
    const matchesQuery =
      !q ||
      room.name.toLowerCase().includes(q) ||
      room.hostName.toLowerCase().includes(q) ||
      room.description.toLowerCase().includes(q) ||
      room.roomType.toLowerCase().includes(q);
    return matchesCategory && matchesQuery;
  });

  return (
    <div className="min-h-screen pb-24">
      <AppHeader
        title="Rooms"
        showBrand={false}
        showSearch
        searchOpen={searchOpen}
        searchValue={searchQuery}
        onToggleSearch={() => {
          setSearchOpen((prev) => !prev);
          if (searchOpen) setSearchQuery('');
        }}
        onSearchChange={setSearchQuery}
        searchPlaceholder="Search rooms, types, or hosts..."
      />

      <main className="max-w-6xl mx-auto px-4 pt-3 space-y-4">
        {/* Category Switcher: All, Popular, Hot, New, Recommended */}
        <div
          role="tablist"
          aria-label="Room categories"
          className="flex items-center gap-2 overflow-x-auto no-scrollbar py-1"
        >
          {ROOM_CATEGORIES.map((category) => {
            const active = selectedCategory === category;
            return (
              <button
                key={category}
                type="button"
                role="tab"
                aria-selected={active}
                onClick={() => setSelectedCategory(category)}
                className={`min-h-[40px] px-4 rounded-full text-xs sm:text-sm font-bold transition-all whitespace-nowrap shrink-0 ${
                  active
                    ? 'mizo-gold-gradient text-[#1E0B3B] shadow-md shadow-amber-500/25'
                    : 'bg-[#150C28] text-slate-300 border border-purple-500/25 hover:border-purple-400/50 hover:text-white'
                }`}
              >
                {category}
              </button>
            );
          })}
        </div>

        {/* Two-Column Room Grid */}
        {filteredRooms.length === 0 ? (
          <div className="mizo-royal-card rounded-2xl p-8 text-center">
            <p className="text-sm font-semibold text-white">No rooms found</p>
            <p className="text-xs text-slate-400 mt-1">
              Switch category or create a new room using the + button below.
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3.5">
            {filteredRooms.map((room) => (
              <RoomCard key={room.id} room={room} onJoin={onJoinRoom} />
            ))}
          </div>
        )}
      </main>
    </div>
  );
};
