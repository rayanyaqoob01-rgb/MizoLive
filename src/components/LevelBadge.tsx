import React from 'react';
import { getLevelTier } from '../data/levels';

interface LevelBadgeProps {
  level: number;
  size?: 'xs' | 'sm' | 'md';
  showTierName?: boolean;
  onClick?: () => void;
}

export const LevelBadge: React.FC<LevelBadgeProps> = ({
  level,
  size = 'sm',
  showTierName = false,
  onClick,
}) => {
  const tier = getLevelTier(level);

  const sizeClasses =
    size === 'xs'
      ? 'h-4 px-1.5 text-[9px] gap-0.5 rounded-md'
      : size === 'md'
      ? 'h-7 px-3 text-xs gap-1.5 rounded-full'
      : 'h-5 px-2 text-[10px] gap-1 rounded-full';

  const content = (
    <span
      className={`inline-flex items-center font-bold bg-gradient-to-r ${tier.gradient} ${tier.border} ${tier.textColor} border shadow-sm whitespace-nowrap shrink-0 ${sizeClasses}`}
    >
      <span aria-hidden="true">{tier.icon}</span>
      <span className="font-mono-num">Lv.{level}</span>
      {showTierName && <span className="opacity-90">· {tier.name}</span>}
    </span>
  );

  if (onClick) {
    return (
      <button
        type="button"
        onClick={onClick}
        className="inline-flex items-center hover:brightness-110 active:scale-95 transition-transform"
      >
        {content}
      </button>
    );
  }

  return content;
};
