import React from 'react';
import { BadgeCheck, UserPlus, X } from 'lucide-react';
import { SafeImage } from './Cards';
import { LevelBadge } from './LevelBadge';
import { getLevelTier } from '../data/levels';

export interface UserInfoTarget {
  name: string;
  handle?: string;
  avatar: string;
  level: number;
  bio?: string;
  followers?: string;
  isFollowing?: boolean;
}

interface UserInfoModalProps {
  user: UserInfoTarget | null;
  onClose: () => void;
  onToggleFollow?: () => void;
  onOpenLevelDetails?: (level: number) => void;
}

export const UserInfoModal: React.FC<UserInfoModalProps> = ({
  user,
  onClose,
  onToggleFollow,
  onOpenLevelDetails,
}) => {
  if (!user) return null;

  const tier = getLevelTier(user.level);

  return (
    <div
      className="fixed inset-0 z-50 bg-black/75 backdrop-blur-sm flex items-center justify-center p-4"
      role="dialog"
      aria-modal="true"
      aria-label={`${user.name} info card`}
    >
      <div className="w-full max-w-xs rounded-3xl mizo-royal-card p-5 text-center relative shadow-[0_0_40px_rgba(147,51,234,0.45)]">
        <button
          type="button"
          onClick={onClose}
          aria-label="Close user card"
          className="absolute top-3 right-3 min-w-[38px] min-h-[38px] rounded-xl flex items-center justify-center text-slate-300 hover:text-white hover:bg-white/10"
        >
          <X className="w-4 h-4" />
        </button>

        <div className="w-20 h-20 mx-auto rounded-full p-0.5 mizo-gold-gradient">
          <SafeImage
            src={user.avatar}
            alt={user.name}
            className="w-full h-full rounded-full object-cover"
          />
        </div>

        <div className="mt-3 flex items-center justify-center gap-1.5">
          <h3 className="text-lg font-display font-bold text-white">{user.name}</h3>
          <BadgeCheck className="w-4 h-4 text-sky-400" />
        </div>
        {user.handle && (
          <p className="text-xs text-slate-400">{user.handle}</p>
        )}

        <div className="mt-2.5 flex justify-center">
          <LevelBadge
            level={user.level}
            size="md"
            showTierName
            onClick={
              onOpenLevelDetails
                ? () => {
                    onClose();
                    onOpenLevelDetails(user.level);
                  }
                : undefined
            }
          />
        </div>

        <p className="mt-3 text-xs text-slate-300">
          {user.bio || `${tier.name} creator on Mizo Live.`}
        </p>

        <div className="mt-4 pt-3 border-t border-purple-500/20 flex items-center justify-center gap-6 text-xs">
          <div>
            <p className="font-mono-num font-bold text-white">{user.followers || '18.4K'}</p>
            <p className="text-slate-400">Followers</p>
          </div>
          <div>
            <p className="font-mono-num font-bold text-amber-300">Lv.{user.level}</p>
            <p className="text-slate-400">Rank</p>
          </div>
        </div>

        {onToggleFollow && (
          <button
            type="button"
            onClick={onToggleFollow}
            className={`mt-4 w-full min-h-[42px] rounded-xl text-xs font-bold inline-flex items-center justify-center gap-1.5 transition-all ${
              user.isFollowing
                ? 'bg-white/10 text-white border border-white/20'
                : 'mizo-gold-gradient text-[#1E0B3B]'
            }`}
          >
            <UserPlus className="w-4 h-4" />
            <span>{user.isFollowing ? 'Following' : 'Follow'}</span>
          </button>
        )}
      </div>
    </div>
  );
};
