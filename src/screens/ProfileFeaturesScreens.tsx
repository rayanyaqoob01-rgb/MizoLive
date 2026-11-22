import React, { useState } from 'react';
import {
  Award,
  Building2,
  Check,
  Crown,
  Lock,
  Medal,
  ShieldCheck,
  Trophy,
  UserPlus,
  Users,
} from 'lucide-react';
import { SafeImage } from '../components/Cards';
import { AppHeader } from '../components/Header';
import { LevelBadge } from '../components/LevelBadge';
import { ASSETS } from '../data/mizoData';
import { AchievementBadge } from '../types/mizo';

/* =========================================================
   1. TOP ACHIEVEMENTS & BADGE VAULT SCREEN
   ========================================================= */
interface AchievementsScreenProps {
  badges: AchievementBadge[];
  onBack: () => void;
  onToggleEquip: (badgeId: string) => void;
}

export const AchievementsScreen: React.FC<AchievementsScreenProps> = ({
  badges,
  onBack,
  onToggleEquip,
}) => {
  const [filter, setFilter] = useState<'all' | 'earned' | 'locked'>('all');

  const filtered = badges.filter((b) => {
    if (filter === 'earned') return b.earned;
    if (filter === 'locked') return !b.earned;
    return true;
  });

  const earnedCount = badges.filter((b) => b.earned).length;

  return (
    <div className="min-h-screen pb-12">
      <AppHeader title="Top Achievements & Badge Vault" onBack={onBack} />

      <main className="max-w-4xl mx-auto px-4 pt-4 space-y-5">
        <section className="rounded-3xl mizo-royal-card p-5 flex items-center justify-between gap-4 border border-amber-400/40">
          <div>
            <p className="text-xs font-semibold text-amber-300">Badge Vault</p>
            <h2 className="text-xl font-display font-extrabold text-white mt-0.5">
              {earnedCount} / {badges.length} Badges Earned
            </h2>
            <p className="text-xs text-slate-300 mt-1">
              Equip an earned badge to display it prominently on your Profile.
            </p>
          </div>
          <Trophy className="w-11 h-11 text-amber-400 shrink-0" />
        </section>

        <div className="flex items-center gap-2">
          {(['all', 'earned', 'locked'] as const).map((tab) => (
            <button
              key={tab}
              type="button"
              onClick={() => setFilter(tab)}
              className={`px-4 py-2 rounded-full text-xs font-bold capitalize ${
                filter === tab
                  ? 'mizo-gold-gradient text-[#1E0B3B]'
                  : 'bg-[#150C28] text-slate-300 border border-purple-500/25'
              }`}
            >
              {tab}
            </button>
          ))}
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
          {filtered.map((badge) => {
            const pct = Math.min(100, Math.round((badge.progress / badge.target) * 100));
            return (
              <div
                key={badge.id}
                className={`rounded-2xl p-4 border flex flex-col justify-between gap-3 ${
                  badge.earned
                    ? 'mizo-royal-card border-amber-400/40'
                    : 'bg-[#0D071A] border-purple-500/15 opacity-80'
                }`}
              >
                <div className="flex items-start justify-between gap-3">
                  <div className="flex items-center gap-3">
                    <div className="w-12 h-12 rounded-2xl bg-[#1C0F36] border border-purple-400/35 flex items-center justify-center text-2xl shrink-0">
                      {badge.icon}
                    </div>
                    <div>
                      <div className="flex items-center gap-1.5">
                        <h3 className="text-sm font-display font-bold text-white">
                          {badge.name}
                        </h3>
                        {!badge.earned && <Lock className="w-3.5 h-3.5 text-slate-400" />}
                      </div>
                      <p className="text-xs text-slate-300 mt-0.5">{badge.description}</p>
                    </div>
                  </div>
                </div>

                <div className="space-y-1.5">
                  <div className="h-2 w-full rounded-full bg-black/50 overflow-hidden">
                    <div
                      style={{ width: `${pct}%` }}
                      className="h-full mizo-gold-gradient"
                    />
                  </div>
                  <div className="flex items-center justify-between text-[11px] font-mono-num text-slate-400">
                    <span>
                      {badge.progress}/{badge.target}
                    </span>
                    <span>{badge.earned ? `Earned ${badge.earnedAt || ''}` : `${pct}%`}</span>
                  </div>
                </div>

                {badge.earned && (
                  <button
                    type="button"
                    onClick={() => onToggleEquip(badge.id)}
                    className={`min-h-[38px] rounded-xl text-xs font-bold inline-flex items-center justify-center gap-1.5 ${
                      badge.equipped
                        ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-400/40'
                        : 'mizo-purple-gradient text-white border border-purple-300/30'
                    }`}
                  >
                    {badge.equipped && <Check className="w-3.5 h-3.5" />}
                    <span>{badge.equipped ? 'Equipped (Tap to Unequip)' : 'Equip Badge'}</span>
                  </button>
                )}
              </div>
            );
          })}
        </div>
      </main>
    </div>
  );
};

/* =========================================================
   2. AGENCY MANAGEMENT SCREEN
   ========================================================= */
export const AgencyScreen: React.FC<{ onBack: () => void }> = ({ onBack }) => {
  const [members, setMembers] = useState([
    { id: 'ag-1', name: 'Cute Queen', level: 64, avatar: ASSETS.cuteQueen, role: 'Star Host', revenue: '18,400' },
    { id: 'ag-2', name: 'King Rayan', level: 82, avatar: ASSETS.kingRayan, role: 'PK Captain', revenue: '24,900' },
    { id: 'ag-3', name: 'Sweet Girl', level: 45, avatar: ASSETS.sweetGirl, role: 'Host', revenue: '9,250' },
  ]);
  const [inviteName, setInviteName] = useState('');

  const handleInvite = (e: React.FormEvent) => {
    e.preventDefault();
    if (!inviteName.trim()) return;
    setMembers((prev) => [
      {
        id: `ag-${Date.now()}`,
        name: inviteName.trim(),
        level: 12,
        avatar: ASSETS.mrKhan,
        role: 'Invited Host',
        revenue: '0',
      },
      ...prev,
    ]);
    setInviteName('');
  };

  return (
    <div className="min-h-screen pb-12">
      <AppHeader title="Agency Center" onBack={onBack} />

      <main className="max-w-4xl mx-auto px-4 pt-4 space-y-5">
        <section className="rounded-3xl mizo-royal-card p-5 border border-amber-400/40 space-y-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 rounded-2xl mizo-gold-gradient flex items-center justify-center text-[#1E0B3B]">
                <Building2 className="w-6 h-6" />
              </div>
              <div>
                <h2 className="text-lg font-display font-extrabold text-white">
                  Mizo Royal Talent Agency
                </h2>
                <p className="text-xs text-amber-300 inline-flex items-center gap-1">
                  <ShieldCheck className="w-3.5 h-3.5" /> Verified Partner · ID AG-8821
                </p>
              </div>
            </div>
          </div>

          <div className="grid grid-cols-3 gap-2.5 pt-2 text-center">
            <div className="rounded-xl bg-black/35 p-2.5">
              <p className="text-[11px] text-slate-400">Roster</p>
              <p className="text-base font-mono-num font-bold text-white">{members.length}</p>
            </div>
            <div className="rounded-xl bg-black/35 p-2.5">
              <p className="text-[11px] text-slate-400">Monthly Coins</p>
              <p className="text-base font-mono-num font-bold text-amber-300">52.5K</p>
            </div>
            <div className="rounded-xl bg-black/35 p-2.5">
              <p className="text-[11px] text-slate-400">Agency Split</p>
              <p className="text-base font-mono-num font-bold text-emerald-300">15%</p>
            </div>
          </div>
        </section>

        <form onSubmit={handleInvite} className="flex items-center gap-2">
          <input
            type="text"
            value={inviteName}
            onChange={(e) => setInviteName(e.target.value)}
            placeholder="Invite creator username to agency..."
            className="flex-1 h-11 px-4 rounded-xl bg-[#140B26] border border-purple-500/35 text-xs text-white placeholder:text-slate-400 focus:outline-none focus:border-amber-400"
          />
          <button
            type="submit"
            className="min-h-[44px] px-4 rounded-xl mizo-gold-gradient text-[#1E0B3B] text-xs font-extrabold inline-flex items-center gap-1.5 shrink-0"
          >
            <UserPlus className="w-4 h-4" />
            <span>Invite</span>
          </button>
        </form>

        <section className="space-y-2.5">
          <h3 className="text-sm font-display font-bold text-white inline-flex items-center gap-2">
            <Users className="w-4 h-4 text-amber-400" />
            <span>Agency Members</span>
          </h3>
          <div className="mizo-royal-card rounded-2xl divide-y divide-purple-500/15">
            {members.map((m) => (
              <div key={m.id} className="p-3.5 flex items-center justify-between gap-3">
                <div className="flex items-center gap-3 min-w-0">
                  <SafeImage
                    src={m.avatar}
                    alt={m.name}
                    className="w-11 h-11 rounded-full object-cover border border-amber-400/50 shrink-0"
                  />
                  <div className="min-w-0">
                    <div className="flex items-center gap-1.5">
                      <span className="text-sm font-bold text-white truncate">{m.name}</span>
                      <LevelBadge level={m.level} size="xs" />
                    </div>
                    <p className="text-xs text-slate-400">{m.role}</p>
                  </div>
                </div>
                <span className="text-xs font-mono-num font-bold text-amber-300 shrink-0">
                  {m.revenue} Coins
                </span>
              </div>
            ))}
          </div>
        </section>
      </main>
    </div>
  );
};

/* =========================================================
   3. RANKINGS SCREEN (WEEKLY, MONTHLY, LEVEL, CONTRIBUTOR)
   ========================================================= */
export const RankingsScreen: React.FC<{ onBack: () => void }> = ({ onBack }) => {
  const [tab, setTab] = useState<'Weekly' | 'Monthly' | 'Level' | 'Contributor'>('Weekly');

  const rows = [
    { rank: 1, name: 'King Rayan', avatar: ASSETS.kingRayan, level: 82, weekly: '48.2K', monthly: '192K', contrib: '64.1K' },
    { rank: 2, name: 'Cute Queen', avatar: ASSETS.cuteQueen, level: 64, weekly: '41.5K', monthly: '165K', contrib: '52.8K' },
    { rank: 3, name: 'Mr. Khan', avatar: ASSETS.mrKhan, level: 53, weekly: '29.8K', monthly: '118K', contrib: '39.0K' },
    { rank: 4, name: 'Sweet Girl', avatar: ASSETS.sweetGirl, level: 45, weekly: '21.4K', monthly: '84K', contrib: '27.5K' },
  ];

  const sorted =
    tab === 'Level'
      ? [...rows].sort((a, b) => b.level - a.level)
      : rows;

  return (
    <div className="min-h-screen pb-12">
      <AppHeader title="Mizo Rankings" onBack={onBack} />

      <main className="max-w-4xl mx-auto px-4 pt-4 space-y-5">
        <div className="flex items-center gap-2 overflow-x-auto no-scrollbar">
          {(['Weekly', 'Monthly', 'Level', 'Contributor'] as const).map((t) => (
            <button
              key={t}
              type="button"
              onClick={() => setTab(t)}
              className={`px-4 py-2 rounded-full text-xs font-bold whitespace-nowrap shrink-0 ${
                tab === t
                  ? 'mizo-gold-gradient text-[#1E0B3B]'
                  : 'bg-[#150C28] text-slate-300 border border-purple-500/25'
              }`}
            >
              {t}
            </button>
          ))}
        </div>

        <div className="mizo-royal-card rounded-2xl divide-y divide-purple-500/15 overflow-hidden">
          {sorted.map((row, idx) => (
            <div key={row.name} className="p-4 flex items-center justify-between gap-3">
              <div className="flex items-center gap-3 min-w-0">
                <div className="w-8 text-center font-display font-extrabold text-base shrink-0">
                  {idx === 0 ? (
                    <Crown className="w-5 h-5 text-amber-400 mx-auto" />
                  ) : idx === 1 ? (
                    <Medal className="w-5 h-5 text-slate-200 mx-auto" />
                  ) : idx === 2 ? (
                    <Award className="w-5 h-5 text-amber-600 mx-auto" />
                  ) : (
                    <span className="text-slate-400 font-mono-num">#{idx + 1}</span>
                  )}
                </div>

                <SafeImage
                  src={row.avatar}
                  alt={row.name}
                  className="w-11 h-11 rounded-full object-cover border border-amber-400/50 shrink-0"
                />

                <div className="min-w-0">
                  <div className="flex items-center gap-1.5">
                    <span className="text-sm font-bold text-white truncate">{row.name}</span>
                    <LevelBadge level={row.level} size="xs" />
                  </div>
                  <p className="text-[11px] text-slate-400">{tab} Leaderboard</p>
                </div>
              </div>

              <span className="text-xs sm:text-sm font-mono-num font-bold text-amber-300 shrink-0">
                {tab === 'Level'
                  ? `Level ${row.level}`
                  : tab === 'Monthly'
                  ? `${row.monthly} pts`
                  : tab === 'Contributor'
                  ? `${row.contrib} Coins`
                  : `${row.weekly} pts`}
              </span>
            </div>
          ))}
        </div>
      </main>
    </div>
  );
};
