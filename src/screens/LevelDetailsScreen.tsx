import React, { useState } from 'react';
import { Award, Flame, Sparkles, Trophy, Zap } from 'lucide-react';
import { AppHeader } from '../components/Header';
import { LevelBadge } from '../components/LevelBadge';
import {
  getAllLevels,
  getLevelTier,
  getXpRequiredForLevel,
  LEVEL_CONFIG,
  LEVEL_TIERS,
} from '../data/levels';

interface LevelDetailsScreenProps {
  currentLevel: number;
  currentXp: number;
  onBack: () => void;
  onAddDemoXp: (amount: number, source: string) => void;
}

export const LevelDetailsScreen: React.FC<LevelDetailsScreenProps> = ({
  currentLevel,
  currentXp,
  onBack,
  onAddDemoXp,
}) => {
  const [selectedTierFilter, setSelectedTierFilter] = useState<string>('All');
  const [justLeveledUp, setJustLeveledUp] = useState(false);

  const tier = getLevelTier(currentLevel);
  const nextReq = getXpRequiredForLevel(currentLevel);
  const progressPct = Math.min(100, Math.round((currentXp / nextReq) * 100));
  const allLevels = getAllLevels();

  const visibleLevels =
    selectedTierFilter === 'All'
      ? allLevels
      : allLevels.filter((l) => l.tier.name === selectedTierFilter);

  const triggerActivityXp = (amount: number, label: string) => {
    const willLevelUp = currentXp + amount >= nextReq && currentLevel < LEVEL_CONFIG.maxLevel;
    onAddDemoXp(amount, label);
    if (willLevelUp) {
      setJustLeveledUp(true);
      setTimeout(() => setJustLeveledUp(false), 3000);
    }
  };

  return (
    <div className="min-h-screen pb-12">
      <AppHeader title="Level Progress (1–99)" onBack={onBack} />

      <main className="max-w-4xl mx-auto px-4 pt-4 space-y-5">
        {/* Level-Up Celebration Banner */}
        {justLeveledUp && (
          <div className="rounded-2xl mizo-gold-gradient p-4 text-[#1E0B3B] flex items-center justify-between gap-3 shadow-[0_0_32px_rgba(250,204,21,0.5)] animate-mizo-float">
            <div className="flex items-center gap-3">
              <Trophy className="w-7 h-7 shrink-0" />
              <div>
                <p className="text-sm font-display font-extrabold">
                  Level Up! Welcome to Level {currentLevel}
                </p>
                <p className="text-xs font-semibold opacity-90">
                  {tier.name} badge unlocked!
                </p>
              </div>
            </div>
            <Sparkles className="w-5 h-5 shrink-0" />
          </div>
        )}

        {/* Current Level Progress Card */}
        <section className="rounded-3xl mizo-royal-card p-5 space-y-4 border border-amber-400/35 shadow-xl">
          <div className="flex items-center justify-between gap-3 flex-wrap">
            <div className="space-y-1">
              <p className="text-xs text-purple-200/80 font-medium">Your Current Rank</p>
              <div className="flex items-center gap-2.5">
                <LevelBadge level={currentLevel} size="md" showTierName />
              </div>
            </div>
            <div className="text-right">
              <p className="text-xs text-slate-400">Next Level Goal</p>
              <p className="text-sm font-mono-num font-bold text-amber-300">
                {currentXp.toLocaleString()} / {nextReq.toLocaleString()} XP
              </p>
            </div>
          </div>

          {/* Progress Bar */}
          <div className="space-y-1.5">
            <div className="h-3.5 w-full rounded-full bg-black/55 border border-purple-500/30 overflow-hidden p-0.5">
              <div
                style={{ width: `${progressPct}%` }}
                className="h-full rounded-full mizo-gold-gradient transition-all duration-300"
              />
            </div>
            <div className="flex items-center justify-between text-[11px] text-slate-300 font-mono-num">
              <span>{progressPct}% to Level {Math.min(99, currentLevel + 1)}</span>
              <span>{Math.max(0, nextReq - currentXp)} XP needed</span>
            </div>
          </div>

          {/* Configurable Activity XP Actions (Not Money-Only) */}
          <div className="pt-2 border-t border-purple-500/20 space-y-2.5">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-white flex items-center gap-1.5">
                <Zap className="w-3.5 h-3.5 text-amber-400" />
                Earn Activity XP (Demo Participation)
              </span>
              <span className="text-[11px] text-slate-400">Configurable curve</span>
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
              <button
                type="button"
                onClick={() =>
                  triggerActivityXp(LEVEL_CONFIG.xpRewards.watchLiveMinute, 'Watch Live')
                }
                className="min-h-[40px] px-3 rounded-xl bg-[#190D30] hover:bg-purple-900/50 border border-purple-500/30 text-xs font-semibold text-white"
              >
                Watch Live +{LEVEL_CONFIG.xpRewards.watchLiveMinute} XP
              </button>
              <button
                type="button"
                onClick={() =>
                  triggerActivityXp(LEVEL_CONFIG.xpRewards.sendChat, 'Room Chat')
                }
                className="min-h-[40px] px-3 rounded-xl bg-[#190D30] hover:bg-purple-900/50 border border-purple-500/30 text-xs font-semibold text-white"
              >
                Chat +{LEVEL_CONFIG.xpRewards.sendChat} XP
              </button>
              <button
                type="button"
                onClick={() =>
                  triggerActivityXp(LEVEL_CONFIG.xpRewards.uploadVideo, 'Creator Video')
                }
                className="min-h-[40px] px-3 rounded-xl bg-[#190D30] hover:bg-purple-900/50 border border-purple-500/30 text-xs font-semibold text-white"
              >
                Upload +{LEVEL_CONFIG.xpRewards.uploadVideo} XP
              </button>
              <button
                type="button"
                onClick={() =>
                  triggerActivityXp(LEVEL_CONFIG.xpRewards.hostRoom, 'Host Party')
                }
                className="min-h-[40px] px-3 rounded-xl mizo-gold-gradient text-[#1E0B3B] text-xs font-bold"
              >
                Host +{LEVEL_CONFIG.xpRewards.hostRoom} XP
              </button>
            </div>
          </div>
        </section>

        {/* Tier Overview Filter */}
        <section className="space-y-3">
          <div className="flex items-center gap-2">
            <Award className="w-4 h-4 text-amber-400" />
            <h2 className="text-base font-display font-bold text-white">
              All 99 Levels &amp; Progression Tiers
            </h2>
          </div>

          <div className="flex items-center gap-2 overflow-x-auto no-scrollbar py-1">
            <button
              type="button"
              onClick={() => setSelectedTierFilter('All')}
              className={`px-3.5 py-1.5 rounded-full text-xs font-bold whitespace-nowrap shrink-0 ${
                selectedTierFilter === 'All'
                  ? 'mizo-gold-gradient text-[#1E0B3B]'
                  : 'bg-[#150C28] text-slate-300 border border-purple-500/25'
              }`}
            >
              All (1–99)
            </button>
            {LEVEL_TIERS.map((t) => (
              <button
                key={t.name}
                type="button"
                onClick={() => setSelectedTierFilter(t.name)}
                className={`px-3.5 py-1.5 rounded-full text-xs font-bold whitespace-nowrap shrink-0 ${
                  selectedTierFilter === t.name
                    ? 'mizo-gold-gradient text-[#1E0B3B]'
                    : 'bg-[#150C28] text-slate-300 border border-purple-500/25'
                }`}
              >
                {t.minLevel}–{t.maxLevel} {t.name}
              </button>
            ))}
          </div>

          {/* Grid of Levels */}
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-2.5">
            {visibleLevels.map((item) => {
              const isCurrent = item.level === currentLevel;
              const isUnlocked = item.level <= currentLevel;
              return (
                <div
                  key={item.level}
                  className={`rounded-2xl p-3 border flex flex-col gap-1.5 transition-colors ${
                    isCurrent
                      ? 'bg-[#26114B] border-amber-400 shadow-[0_0_16px_rgba(250,204,21,0.25)]'
                      : isUnlocked
                      ? 'bg-[#150B29] border-purple-500/35'
                      : 'bg-[#0D071A] border-purple-500/15 opacity-75'
                  }`}
                >
                  <div className="flex items-center justify-between gap-1">
                    <LevelBadge level={item.level} size="sm" />
                    {isCurrent && (
                      <span className="text-[10px] font-bold text-amber-300 inline-flex items-center gap-0.5">
                        <Flame className="w-3 h-3" /> Now
                      </span>
                    )}
                  </div>
                  <p className="text-xs font-semibold text-white truncate">
                    {item.tier.name}
                  </p>
                  <p className="text-[11px] text-slate-400 font-mono-num">
                    Req: {item.xpRequired.toLocaleString()} XP
                  </p>
                </div>
              );
            })}
          </div>
        </section>
      </main>
    </div>
  );
};
