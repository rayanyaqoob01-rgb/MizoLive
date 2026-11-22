import React from 'react';
import { ArrowLeft, Bell, Search, X } from 'lucide-react';
import { MizoAppIcon, MizoWordmark } from './MizoLogo';

interface AppHeaderProps {
  title?: string;
  showBrand?: boolean;
  onBack?: () => void;
  showSearch?: boolean;
  searchOpen?: boolean;
  searchValue?: string;
  onToggleSearch?: () => void;
  onSearchChange?: (value: string) => void;
  searchPlaceholder?: string;
  showNotification?: boolean;
  unreadNotifications?: number;
  onNotificationClick?: () => void;
  rightSlot?: React.ReactNode;
}

export const AppHeader: React.FC<AppHeaderProps> = ({
  title,
  showBrand = false,
  onBack,
  showSearch = false,
  searchOpen = false,
  searchValue = '',
  onToggleSearch,
  onSearchChange,
  searchPlaceholder = 'Search Mizo Live...',
  showNotification = false,
  unreadNotifications = 0,
  onNotificationClick,
  rightSlot,
}) => {
  return (
    <header className="sticky top-0 z-30 bg-[#06040B]/90 backdrop-blur-xl border-b border-purple-500/15 pt-safe">
      <div className="max-w-6xl mx-auto px-4 h-[52px] flex items-center justify-between gap-3">
        {/* Left Zone */}
        <div className="flex items-center gap-2.5 min-w-0">
          {onBack && (
            <button
              type="button"
              onClick={onBack}
              aria-label="Go back"
              className="min-w-[44px] min-h-[44px] -ml-2 flex items-center justify-center rounded-xl text-slate-200 hover:text-white hover:bg-white/5 transition-colors"
            >
              <ArrowLeft className="w-5 h-5" />
            </button>
          )}

          {showBrand ? (
            <div className="flex items-center gap-2.5 shrink-0">
              <MizoAppIcon size={34} />
              <MizoWordmark className="text-xl" />
            </div>
          ) : (
            <h1 className="text-lg font-display font-bold text-white truncate">
              {title}
            </h1>
          )}
        </div>

        {/* Right Zone */}
        <div className="flex items-center gap-1 shrink-0">
          {showSearch && onToggleSearch && (
            <button
              type="button"
              onClick={onToggleSearch}
              aria-label={searchOpen ? 'Close search' : 'Open search'}
              className="min-w-[44px] min-h-[44px] flex items-center justify-center rounded-xl text-slate-200 hover:text-amber-300 hover:bg-white/5 transition-colors"
            >
              {searchOpen ? <X className="w-5 h-5" /> : <Search className="w-5 h-5" />}
            </button>
          )}

          {showNotification && onNotificationClick && (
            <button
              type="button"
              onClick={onNotificationClick}
              aria-label="Notifications"
              className="min-w-[44px] min-h-[44px] relative flex items-center justify-center rounded-xl text-slate-200 hover:text-amber-300 hover:bg-white/5 transition-colors"
            >
              <Bell className="w-5 h-5" />
              {unreadNotifications > 0 && (
                <span className="absolute top-1.5 right-1.5 min-w-[17px] h-[17px] px-1 rounded-full bg-rose-500 text-white text-[10px] font-bold flex items-center justify-center font-mono-num border border-[#06040B]">
                  {unreadNotifications > 9 ? '9+' : unreadNotifications}
                </span>
              )}
            </button>
          )}

          {rightSlot}
        </div>
      </div>

      {/* Expandable Inline Search Bar */}
      {showSearch && searchOpen && onSearchChange && (
        <div className="max-w-6xl mx-auto px-4 pb-3">
          <div className="relative">
            <Search className="w-4 h-4 text-purple-300/70 absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
            <input
              type="search"
              value={searchValue}
              onChange={(e) => onSearchChange(e.target.value)}
              placeholder={searchPlaceholder}
              autoFocus
              className="w-full h-10 pl-10 pr-4 rounded-xl bg-[#140C26] border border-purple-500/35 text-sm text-white placeholder:text-slate-400 focus:outline-none focus:border-amber-400 transition-colors"
            />
          </div>
        </div>
      )}
    </header>
  );
};
