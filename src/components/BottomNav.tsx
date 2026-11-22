import React from 'react';
import {
  Clapperboard,
  Home,
  MessageCircle,
  Plus,
  ShoppingBag,
  User,
  Users,
} from 'lucide-react';
import { MainTab } from '../types/mizo';

interface BottomNavProps {
  activeTab: MainTab;
  onSelectTab: (tab: MainTab) => void;
  onOpenCreate: () => void;
  unreadCount: number;
}

export const BottomNav: React.FC<BottomNavProps> = ({
  activeTab,
  onSelectTab,
  onOpenCreate,
  unreadCount,
}) => {
  return (
    <nav
      aria-label="Primary Bottom Navigation"
      className="fixed bottom-0 left-0 right-0 z-40 flex justify-center pointer-events-none"
    >
      <div className="pointer-events-auto w-full md:max-w-2xl md:mb-3 md:rounded-2xl bg-[#0D071A]/95 backdrop-blur-xl border-t md:border border-purple-500/30 shadow-[0_-8px_32px_rgba(0,0,0,0.7)] pb-safe">
        <div className="grid grid-cols-7 items-center h-[62px] px-0.5 sm:px-2">
          {/* 1. Home */}
          <button
            type="button"
            onClick={() => onSelectTab('home')}
            className="min-h-[44px] flex flex-col items-center justify-center gap-0.5 transition-colors rounded-lg"
            aria-current={activeTab === 'home' ? 'page' : undefined}
          >
            <Home
              className={`w-[19px] h-[19px] transition-transform duration-150 ${
                activeTab === 'home'
                  ? 'text-amber-400 fill-amber-400/20 scale-105'
                  : 'text-slate-300/80 hover:text-white'
              }`}
              strokeWidth={activeTab === 'home' ? 2.4 : 1.9}
            />
            <span
              className={`text-[9.5px] sm:text-[10.5px] font-medium whitespace-nowrap ${
                activeTab === 'home' ? 'text-amber-400 font-semibold' : 'text-slate-400'
              }`}
            >
              Home
            </span>
          </button>

          {/* 2. Rooms */}
          <button
            type="button"
            onClick={() => onSelectTab('rooms')}
            className="min-h-[44px] flex flex-col items-center justify-center gap-0.5 transition-colors rounded-lg"
            aria-current={activeTab === 'rooms' ? 'page' : undefined}
          >
            <Users
              className={`w-[19px] h-[19px] transition-transform duration-150 ${
                activeTab === 'rooms'
                  ? 'text-amber-400 fill-amber-400/20 scale-105'
                  : 'text-slate-300/80 hover:text-white'
              }`}
              strokeWidth={activeTab === 'rooms' ? 2.4 : 1.9}
            />
            <span
              className={`text-[9.5px] sm:text-[10.5px] font-medium whitespace-nowrap ${
                activeTab === 'rooms' ? 'text-amber-400 font-semibold' : 'text-slate-400'
              }`}
            >
              Rooms
            </span>
          </button>

          {/* 3. Store */}
          <button
            type="button"
            onClick={() => onSelectTab('store')}
            className="min-h-[44px] flex flex-col items-center justify-center gap-0.5 transition-colors rounded-lg"
            aria-current={activeTab === 'store' ? 'page' : undefined}
          >
            <ShoppingBag
              className={`w-[19px] h-[19px] transition-transform duration-150 ${
                activeTab === 'store'
                  ? 'text-amber-400 fill-amber-400/20 scale-105'
                  : 'text-slate-300/80 hover:text-white'
              }`}
              strokeWidth={activeTab === 'store' ? 2.4 : 1.9}
            />
            <span
              className={`text-[9.5px] sm:text-[10.5px] font-medium whitespace-nowrap ${
                activeTab === 'store' ? 'text-amber-400 font-semibold' : 'text-slate-400'
              }`}
            >
              Store
            </span>
          </button>

          {/* 4. Central Create (+) */}
          <div className="flex items-center justify-center">
            <button
              type="button"
              onClick={onOpenCreate}
              aria-label="Create content"
              className="-mt-4 w-12 h-12 sm:w-14 sm:h-14 rounded-full p-[2.5px] mizo-gold-gradient shadow-[0_0_22px_rgba(168,85,247,0.7),0_0_12px_rgba(250,204,21,0.45)] active:scale-95 transition-transform"
            >
              <span className="w-full h-full rounded-full bg-gradient-to-br from-[#A855F7] via-[#7C3AED] to-[#4C1D95] flex items-center justify-center border border-white/25">
                <Plus className="w-6 h-6 text-white drop-shadow" strokeWidth={2.8} />
              </span>
            </button>
          </div>

          {/* 5. Videos */}
          <button
            type="button"
            onClick={() => onSelectTab('videos')}
            className="min-h-[44px] flex flex-col items-center justify-center gap-0.5 transition-colors rounded-lg"
            aria-current={activeTab === 'videos' ? 'page' : undefined}
          >
            <Clapperboard
              className={`w-[19px] h-[19px] transition-transform duration-150 ${
                activeTab === 'videos'
                  ? 'text-amber-400 fill-amber-400/20 scale-105'
                  : 'text-slate-300/80 hover:text-white'
              }`}
              strokeWidth={activeTab === 'videos' ? 2.4 : 1.9}
            />
            <span
              className={`text-[9.5px] sm:text-[10.5px] font-medium whitespace-nowrap ${
                activeTab === 'videos' ? 'text-amber-400 font-semibold' : 'text-slate-400'
              }`}
            >
              Videos
            </span>
          </button>

          {/* 6. Chat */}
          <button
            type="button"
            onClick={() => onSelectTab('chat')}
            className="min-h-[44px] relative flex flex-col items-center justify-center gap-0.5 transition-colors rounded-lg"
            aria-current={activeTab === 'chat' ? 'page' : undefined}
          >
            <div className="relative">
              <MessageCircle
                className={`w-[19px] h-[19px] transition-transform duration-150 ${
                  activeTab === 'chat'
                    ? 'text-amber-400 fill-amber-400/20 scale-105'
                    : 'text-slate-300/80 hover:text-white'
                }`}
                strokeWidth={activeTab === 'chat' ? 2.4 : 1.9}
              />
              {unreadCount > 0 && (
                <span className="absolute -top-1.5 -right-2 min-w-[15px] h-[15px] px-0.5 rounded-full bg-rose-500 text-white text-[9px] font-bold flex items-center justify-center font-mono-num border border-[#0D071A]">
                  {unreadCount > 99 ? '99+' : unreadCount}
                </span>
              )}
            </div>
            <span
              className={`text-[9.5px] sm:text-[10.5px] font-medium whitespace-nowrap ${
                activeTab === 'chat' ? 'text-amber-400 font-semibold' : 'text-slate-400'
              }`}
            >
              Chat
            </span>
          </button>

          {/* 7. Profile */}
          <button
            type="button"
            onClick={() => onSelectTab('profile')}
            className="min-h-[44px] flex flex-col items-center justify-center gap-0.5 transition-colors rounded-lg"
            aria-current={activeTab === 'profile' ? 'page' : undefined}
          >
            <User
              className={`w-[19px] h-[19px] transition-transform duration-150 ${
                activeTab === 'profile'
                  ? 'text-amber-400 fill-amber-400/20 scale-105'
                  : 'text-slate-300/80 hover:text-white'
              }`}
              strokeWidth={activeTab === 'profile' ? 2.4 : 1.9}
            />
            <span
              className={`text-[9.5px] sm:text-[10.5px] font-medium whitespace-nowrap ${
                activeTab === 'profile' ? 'text-amber-400 font-semibold' : 'text-slate-400'
              }`}
            >
              Profile
            </span>
          </button>
        </div>
      </div>
    </nav>
  );
};
