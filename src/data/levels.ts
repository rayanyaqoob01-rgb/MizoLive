export interface LevelTier {
  name: string;
  minLevel: number;
  maxLevel: number;
  gradient: string;
  border: string;
  textColor: string;
  icon: string;
}

export interface LevelConfig {
  maxLevel: number;
  baseXp: number;
  xpStepMultiplier: number;
  xpRewards: {
    watchLiveMinute: number;
    sendChat: number;
    likeVideo: number;
    commentVideo: number;
    uploadVideo: number;
    hostRoom: number;
    sendGiftBonus: number;
  };
}

export const LEVEL_CONFIG: LevelConfig = {
  maxLevel: 99,
  baseXp: 100,
  xpStepMultiplier: 1.12,
  xpRewards: {
    watchLiveMinute: 25,
    sendChat: 15,
    likeVideo: 10,
    commentVideo: 20,
    uploadVideo: 80,
    hostRoom: 60,
    sendGiftBonus: 35,
  },
};

export const LEVEL_TIERS: LevelTier[] = [
  {
    name: 'Beginner',
    minLevel: 1,
    maxLevel: 10,
    gradient: 'from-slate-600 to-slate-800',
    border: 'border-slate-400/50',
    textColor: 'text-slate-100',
    icon: '✦',
  },
  {
    name: 'Rising Member',
    minLevel: 11,
    maxLevel: 20,
    gradient: 'from-emerald-600 to-teal-800',
    border: 'border-emerald-400/50',
    textColor: 'text-emerald-100',
    icon: '◈',
  },
  {
    name: 'Active Member',
    minLevel: 21,
    maxLevel: 30,
    gradient: 'from-sky-600 to-blue-800',
    border: 'border-sky-400/50',
    textColor: 'text-sky-100',
    icon: '★',
  },
  {
    name: 'Advanced Member',
    minLevel: 31,
    maxLevel: 40,
    gradient: 'from-indigo-600 to-violet-800',
    border: 'border-indigo-400/50',
    textColor: 'text-indigo-100',
    icon: '✧',
  },
  {
    name: 'Elite Member',
    minLevel: 41,
    maxLevel: 50,
    gradient: 'from-purple-600 to-fuchsia-800',
    border: 'border-purple-400/60',
    textColor: 'text-purple-100',
    icon: '❖',
  },
  {
    name: 'Premium Member',
    minLevel: 51,
    maxLevel: 60,
    gradient: 'from-fuchsia-600 to-rose-700',
    border: 'border-fuchsia-400/60',
    textColor: 'text-fuchsia-100',
    icon: '✵',
  },
  {
    name: 'Royal Member',
    minLevel: 61,
    maxLevel: 70,
    gradient: 'from-purple-700 via-fuchsia-600 to-amber-500',
    border: 'border-amber-300/70',
    textColor: 'text-amber-100',
    icon: '♛',
  },
  {
    name: 'Diamond Member',
    minLevel: 71,
    maxLevel: 80,
    gradient: 'from-cyan-500 via-blue-600 to-purple-700',
    border: 'border-cyan-300/80',
    textColor: 'text-cyan-50',
    icon: '◆',
  },
  {
    name: 'Emperor Member',
    minLevel: 81,
    maxLevel: 90,
    gradient: 'from-amber-500 via-orange-600 to-rose-700',
    border: 'border-amber-300/90',
    textColor: 'text-amber-50',
    icon: '♚',
  },
  {
    name: 'Legendary Member',
    minLevel: 91,
    maxLevel: 99,
    gradient: 'from-yellow-300 via-amber-500 to-purple-700',
    border: 'border-yellow-200',
    textColor: 'text-white',
    icon: '👑',
  },
];

export function getLevelTier(level: number): LevelTier {
  const clamped = Math.max(1, Math.min(LEVEL_CONFIG.maxLevel, level));
  return (
    LEVEL_TIERS.find((t) => clamped >= t.minLevel && clamped <= t.maxLevel) ||
    LEVEL_TIERS[0]
  );
}

/** XP required to advance from `level` to `level + 1` */
export function getXpRequiredForLevel(level: number): number {
  const clamped = Math.max(1, Math.min(LEVEL_CONFIG.maxLevel, level));
  return Math.round(
    LEVEL_CONFIG.baseXp * Math.pow(LEVEL_CONFIG.xpStepMultiplier, Math.min(clamped - 1, 35)) +
      (clamped - 1) * 45
  );
}

export function getAllLevels(): Array<{
  level: number;
  xpRequired: number;
  tier: LevelTier;
}> {
  return Array.from({ length: LEVEL_CONFIG.maxLevel }, (_, idx) => {
    const level = idx + 1;
    return {
      level,
      xpRequired: getXpRequiredForLevel(level),
      tier: getLevelTier(level),
    };
  });
}
