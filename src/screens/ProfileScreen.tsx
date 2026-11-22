import React, { useState } from 'react';
import {
  Award,
  BadgeCheck,
  Bookmark,
  Building2,
  Camera,
  Check,
  ChevronRight,
  Coins,
  Copy,
  Crown,
  Film,
  Lock,
  Pencil,
  Plus,
  Share2,
  Shield,
  Sparkles,
  Trophy,
} from 'lucide-react';
import { GoldCoinIcon, SafeImage, VideoCard } from '../components/Cards';
import { LevelBadge } from '../components/LevelBadge';
import { ProfileFrameOverlay } from '../components/MizoLogo';
import { getLevelTier, getXpRequiredForLevel, LEVEL_CONFIG } from '../data/levels';
import {
  AchievementBadge,
  ProfileVideoTab,
  StoreItem,
  UserProfile,
  UserVideo,
} from '../types/mizo';

interface ProfileScreenProps {
  profile: UserProfile;
  storeItems: StoreItem[];
  achievements: AchievementBadge[];
  myVideos: UserVideo[];
  savedVideos: UserVideo[];
  onEditProfile: () => void;
  onPlayVideo: (video: UserVideo) => void;
  onOpenCreateVideo: () => void;
  onOpenStore: () => void;
  onOpenLevels: () => void;
  onOpenAchievements: () => void;
  onOpenAgency: () => void;
  onOpenWallet: () => void;
  onOpenRankings: () => void;
  onShareProfile: () => void;
}

export const ProfileScreen: React.FC<ProfileScreenProps> = ({
  profile,
  storeItems,
  achievements,
  myVideos,
  savedVideos,
  onEditProfile,
  onPlayVideo,
  onOpenCreateVideo,
  onOpenStore,
  onOpenLevels,
  onOpenAchievements,
  onOpenAgency,
  onOpenWallet,
  onOpenRankings,
  onShareProfile,
}) => {
  const [videoTab, setVideoTab] = useState<ProfileVideoTab>('public');
  const [copiedId, setCopiedId] = useState(false);
  const [vipModal, setVipModal] = useState<'vip' | 'svip' | null>(null);

  const handleCopyId = () => {
    if (navigator.clipboard) {
      navigator.clipboard.writeText(profile.userId).catch(() => {});
    }
    setCopiedId(true);
    setTimeout(() => setCopiedId(false), 1800);
  };

  const publicVideos = myVideos.filter((v) => v.privacy !== 'Private');
  const privateVideos = myVideos.filter((v) => v.privacy === 'Private');
  const currentVideos =
    videoTab === 'public'
      ? publicVideos
      : videoTab === 'private'
      ? privateVideos
      : savedVideos;

  const clampedLevel = Math.max(1, Math.min(LEVEL_CONFIG.maxLevel, profile.level));
  const tier = getLevelTier(clampedLevel);
  const nextXp = getXpRequiredForLevel(clampedLevel);
  const progressPct = Math.min(100, Math.round((profile.xp / nextXp) * 100));

  const ownedFramesCount = storeItems.filter(
    (s) => s.category === 'VIP Frames' && s.owned
  ).length;
  const ownedAnimatedAssetsCount = storeItems.filter(
    (s) => (s.category === 'Premium Assets' || s.category === 'Special Entry') && s.owned
  ).length;
  const equippedBadge = achievements.find((b) => b.equipped);

  return (
    <div className="min-h-screen pb-24">
      <main className="max-w-4xl mx-auto">
        {/* Large Cover Background */}
        <section className="relative h-48 sm:h-60 w-full overflow-hidden">
          <SafeImage
            src={profile.coverImage}
            alt="Profile cover"
            className="w-full h-full object-cover"
          />
          <div className="absolute inset-0 bg-gradient-to-b from-black/45 via-transparent to-[#06040B]" />

          <div className="absolute top-3 inset-x-4 flex items-center justify-between pt-safe">
            <button
              type="button"
              onClick={onOpenStore}
              aria-label="Open Store for Frames"
              className="min-h-[38px] px-3 rounded-full bg-black/55 backdrop-blur-md border border-amber-400/40 text-xs font-semibold text-amber-300 inline-flex items-center gap-1.5 hover:bg-black/75"
            >
              <Sparkles className="w-3.5 h-3.5" />
              <span>Frames</span>
            </button>

            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={onEditProfile}
                className="min-h-[38px] px-3 rounded-full bg-black/55 backdrop-blur-md border border-white/20 text-xs font-semibold text-white inline-flex items-center gap-1.5 hover:bg-black/75"
              >
                <Camera className="w-3.5 h-3.5 text-amber-300" />
                <span>Cover / Photo</span>
              </button>
              <button
                type="button"
                onClick={onShareProfile}
                aria-label="Share Profile"
                className="min-w-[38px] min-h-[38px] rounded-full bg-black/55 backdrop-blur-md border border-white/20 flex items-center justify-center text-white hover:bg-black/75"
              >
                <Share2 className="w-4 h-4" />
              </button>
            </div>
          </div>
        </section>

        {/* Circular Profile Picture & Core Info */}
        <section className="px-4 -mt-14 relative z-10 text-center flex flex-col items-center">
          <button
            type="button"
            onClick={onEditProfile}
            className="relative w-[104px] h-[104px] rounded-full p-1 bg-[#06040B] group"
            aria-label="Change profile picture"
          >
            <SafeImage
              src={profile.avatar}
              alt={profile.username}
              className="w-full h-full rounded-full object-cover"
            />
            <ProfileFrameOverlay frameId={profile.equippedFrameId} size={96} />
          </button>

          <div className="mt-3 flex items-center justify-center gap-1.5 flex-wrap">
            <h1 className="text-xl font-display font-extrabold text-white">
              {profile.username}
            </h1>
            <BadgeCheck className="w-5 h-5 text-sky-400 fill-sky-400/20" />
            <LevelBadge level={clampedLevel} size="sm" onClick={onOpenLevels} />
            {equippedBadge && (
              <span className="px-2 py-0.5 rounded-full bg-purple-900/75 border border-amber-400/50 text-[10px] font-bold text-amber-200">
                {equippedBadge.icon} {equippedBadge.name}
              </span>
            )}
          </div>

          <button
            type="button"
            onClick={handleCopyId}
            className="mt-1 inline-flex items-center gap-1.5 text-xs text-slate-300 hover:text-amber-300 transition-colors font-mono-num"
          >
            <span>ID: {profile.userId}</span>
            {copiedId ? (
              <Check className="w-3.5 h-3.5 text-emerald-400" />
            ) : (
              <Copy className="w-3.5 h-3.5 opacity-75" />
            )}
          </button>

          {profile.bio && (
            <p className="mt-2 text-xs sm:text-sm text-slate-300 max-w-md">
              {profile.bio}
            </p>
          )}

          {/* Followers / Following / Likes */}
          <div className="mt-3.5 w-full max-w-md grid grid-cols-3 divide-x divide-purple-500/20 py-2">
            <div>
              <div className="text-lg font-display font-bold text-white font-mono-num">
                {profile.followers}
              </div>
              <div className="text-xs text-slate-400">Followers</div>
            </div>
            <div>
              <div className="text-lg font-display font-bold text-white font-mono-num">
                {profile.following}
              </div>
              <div className="text-xs text-slate-400">Following</div>
            </div>
            <div>
              <div className="text-lg font-display font-bold text-white font-mono-num">
                {profile.likes}
              </div>
              <div className="text-xs text-slate-400">Likes</div>
            </div>
          </div>

          <div className="mt-2 w-full max-w-md grid grid-cols-2 gap-2.5">
            <button
              type="button"
              onClick={onEditProfile}
              className="min-h-[42px] rounded-2xl mizo-purple-gradient border border-purple-300/35 text-xs font-bold text-white inline-flex items-center justify-center gap-1.5 shadow-lg shadow-purple-900/40"
            >
              <Pencil className="w-3.5 h-3.5" />
              <span>Edit Profile</span>
            </button>
            <button
              type="button"
              onClick={onShareProfile}
              className="min-h-[42px] rounded-2xl bg-[#160B2C] border border-amber-400/40 text-xs font-bold text-amber-300 inline-flex items-center justify-center gap-1.5"
            >
              <Share2 className="w-3.5 h-3.5" />
              <span>Share Profile</span>
            </button>
          </div>
        </section>

        {/* Complete Profile Dashboard Cards */}
        <section className="px-4 mt-5 space-y-3.5 max-w-2xl mx-auto">
          {/* 13.1 Level Card (Levels 1-99 only) */}
          <button
            type="button"
            onClick={onOpenLevels}
            className="w-full rounded-2xl mizo-royal-card p-4 text-left border border-amber-400/35 hover:border-amber-400/70 transition-colors space-y-2.5"
          >
            <div className="flex items-center justify-between gap-2">
              <div className="flex items-center gap-2">
                <Shield className="w-4 h-4 text-amber-400" />
                <span className="text-sm font-display font-bold text-white">
                  {tier.name} · Level {clampedLevel}
                </span>
              </div>
              <span className="text-xs font-mono-num font-bold text-amber-300 inline-flex items-center gap-0.5">
                {progressPct}%
                <ChevronRight className="w-4 h-4" />
              </span>
            </div>

            <div className="h-2.5 w-full rounded-full bg-black/55 overflow-hidden">
              <div
                style={{ width: `${progressPct}%` }}
                className="h-full rounded-full mizo-gold-gradient transition-all duration-300"
              />
            </div>

            <div className="grid grid-cols-3 gap-2 text-[11px] font-mono-num">
              <div>
                <span className="text-slate-400 block">Spent Coins</span>
                <span className="text-white font-bold inline-flex items-center gap-1">
                  <GoldCoinIcon size={11} /> {profile.spentCoins.toLocaleString()}
                </span>
              </div>
              <div>
                <span className="text-slate-400 block">Next Level Req</span>
                <span className="text-amber-300 font-bold">
                  {nextXp.toLocaleString()} XP
                </span>
              </div>
              <div className="text-right">
                <span className="text-slate-400 block">Next Level</span>
                <span className="text-purple-200 font-bold">
                  {clampedLevel >= 99 ? 'Max Lv.99' : `Lv.${clampedLevel + 1}`}
                </span>
              </div>
            </div>
          </button>

          {/* 13.2 VIP Member Card & 13.3 Super VIP (SVIP) Card */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <button
              type="button"
              onClick={() => setVipModal('vip')}
              className="rounded-2xl bg-gradient-to-br from-[#2B1055] to-[#120726] border border-amber-400/45 p-3.5 text-left space-y-2 hover:border-amber-300 transition-colors"
            >
              <div className="flex items-center justify-between">
                <span className="text-xs font-extrabold text-amber-300 inline-flex items-center gap-1.5">
                  <Crown className="w-4 h-4" /> VIP Member
                </span>
                <span className="px-2 py-0.5 rounded-full mizo-gold-gradient text-[#1E0B3B] text-[10px] font-extrabold">
                  VIP {profile.vipLevel}
                </span>
              </div>
              <div className="flex items-center justify-between text-[11px] text-slate-300">
                <span>Frames Collected: {ownedFramesCount}</span>
                <span className="text-amber-200">Next: VIP {profile.vipLevel + 1}</span>
              </div>
            </button>

            <button
              type="button"
              onClick={() => setVipModal('svip')}
              className="rounded-2xl bg-gradient-to-br from-[#3B0D63] via-[#240942] to-[#110524] border border-fuchsia-400/45 p-3.5 text-left space-y-2 hover:border-fuchsia-300 transition-colors"
            >
              <div className="flex items-center justify-between">
                <span className="text-xs font-extrabold text-fuchsia-300 inline-flex items-center gap-1.5">
                  <Sparkles className="w-4 h-4" /> Super VIP (SVIP)
                </span>
                <span className="px-2 py-0.5 rounded-full bg-fuchsia-600 text-white text-[10px] font-extrabold">
                  SVIP {profile.svipLevel}
                </span>
              </div>
              <div className="flex items-center justify-between text-[11px] text-slate-300">
                <span>Animated Assets: {ownedAnimatedAssetsCount}</span>
                <span className="text-fuchsia-200">Next: SVIP {profile.svipLevel + 1}</span>
              </div>
            </button>
          </div>

          {/* 13.4 Achievement Badges Strip */}
          <div className="rounded-2xl mizo-royal-card p-3.5 space-y-2.5">
            <div className="flex items-center justify-between">
              <span className="text-xs font-display font-bold text-white inline-flex items-center gap-1.5">
                <Award className="w-4 h-4 text-amber-400" />
                Achievement Badges
              </span>
              <button
                type="button"
                onClick={onOpenAchievements}
                className="text-xs font-semibold text-amber-300 hover:underline inline-flex items-center gap-0.5"
              >
                <span>Badge Vault</span>
                <ChevronRight className="w-3.5 h-3.5" />
              </button>
            </div>

            <div className="grid grid-cols-4 gap-2">
              {achievements.map((badge) => (
                <button
                  key={badge.id}
                  type="button"
                  onClick={onOpenAchievements}
                  className={`p-2 rounded-xl border text-center flex flex-col items-center gap-1 ${
                    badge.equipped
                      ? 'bg-[#26114B] border-amber-400'
                      : badge.earned
                      ? 'bg-[#170C2E] border-purple-500/35'
                      : 'bg-[#0D071A] border-purple-500/15 opacity-60'
                  }`}
                >
                  <span className="text-lg">{badge.icon}</span>
                  <span className="text-[10px] font-bold text-white truncate max-w-full">
                    {badge.name}
                  </span>
                </button>
              ))}
            </div>
          </div>

          {/* 13.5 Four Profile Shortcuts: Top Achievements, Agency, Wallet, Rankings */}
          <div className="grid grid-cols-4 gap-2.5">
            <button
              type="button"
              onClick={onOpenAchievements}
              className="rounded-2xl mizo-royal-card p-3 flex flex-col items-center gap-1.5 hover:border-amber-400/60 transition-colors"
            >
              <Trophy className="w-5 h-5 text-amber-400" />
              <span className="text-[10.5px] font-bold text-white text-center leading-tight">
                Top Achievements
              </span>
            </button>

            <button
              type="button"
              onClick={onOpenAgency}
              className="rounded-2xl mizo-royal-card p-3 flex flex-col items-center gap-1.5 hover:border-amber-400/60 transition-colors"
            >
              <Building2 className="w-5 h-5 text-purple-300" />
              <span className="text-[10.5px] font-bold text-white text-center leading-tight">
                Agency
              </span>
            </button>

            <button
              type="button"
              onClick={onOpenWallet}
              className="rounded-2xl mizo-royal-card p-3 flex flex-col items-center gap-1.5 hover:border-amber-400/60 transition-colors"
            >
              <Coins className="w-5 h-5 text-amber-300" />
              <span className="text-[10.5px] font-bold text-white text-center leading-tight">
                Wallet
              </span>
            </button>

            <button
              type="button"
              onClick={onOpenRankings}
              className="rounded-2xl mizo-royal-card p-3 flex flex-col items-center gap-1.5 hover:border-amber-400/60 transition-colors"
            >
              <Crown className="w-5 h-5 text-fuchsia-400" />
              <span className="text-[10.5px] font-bold text-white text-center leading-tight">
                Rankings
              </span>
            </button>
          </div>
        </section>

        {/* 13.6 Video Showcase: Public | Private | Saved + Upload */}
        <section className="px-4 mt-5 space-y-4 max-w-4xl mx-auto">
          <div className="flex items-center justify-between gap-2 max-w-2xl mx-auto">
            <div className="grid grid-cols-3 gap-1.5 p-1 rounded-2xl bg-[#120A22] border border-purple-500/25 flex-1">
              {(
                [
                  ['public', `Public (${publicVideos.length})`],
                  ['private', `Private (${privateVideos.length})`],
                  ['saved', `Saved (${savedVideos.length})`],
                ] as const
              ).map(([key, label]) => (
                <button
                  key={key}
                  type="button"
                  onClick={() => setVideoTab(key)}
                  className={`py-2 px-2 rounded-xl text-xs font-bold transition-all whitespace-nowrap ${
                    videoTab === key
                      ? 'mizo-gold-gradient text-[#1E0B3B] shadow'
                      : 'text-slate-300 hover:text-white'
                  }`}
                >
                  {label}
                </button>
              ))}
            </div>

            <button
              type="button"
              onClick={onOpenCreateVideo}
              className="min-h-[38px] px-3.5 rounded-xl mizo-purple-gradient border border-purple-300/35 text-xs font-bold text-white inline-flex items-center gap-1 shrink-0"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>Upload</span>
            </button>
          </div>

          {currentVideos.length === 0 ? (
            <div className="max-w-2xl mx-auto mizo-royal-card rounded-2xl p-8 text-center">
              {videoTab === 'saved' ? (
                <Bookmark className="w-8 h-8 text-purple-300 mx-auto mb-2 opacity-75" />
              ) : videoTab === 'private' ? (
                <Lock className="w-8 h-8 text-purple-300 mx-auto mb-2 opacity-75" />
              ) : (
                <Film className="w-8 h-8 text-purple-300 mx-auto mb-2 opacity-75" />
              )}
              <p className="text-sm font-semibold text-white">
                {videoTab === 'public'
                  ? 'No public videos yet'
                  : videoTab === 'private'
                  ? 'No private videos yet'
                  : 'No saved videos yet'}
              </p>
              <p className="text-xs text-slate-400 mt-1">
                {videoTab === 'saved'
                  ? 'Tap Save on any clip in the Videos tab to bookmark it here.'
                  : 'Share your first moment with the Mizo Live community.'}
              </p>
              {videoTab !== 'saved' && (
                <button
                  type="button"
                  onClick={onOpenCreateVideo}
                  className="mt-4 min-h-[40px] px-5 rounded-full mizo-gold-gradient text-[#1E0B3B] text-xs font-extrabold"
                >
                  Upload First Moment
                </button>
              )}
            </div>
          ) : (
            <div className="grid grid-cols-3 md:grid-cols-4 gap-2.5 sm:gap-3.5 max-w-4xl mx-auto">
              {currentVideos.map((video) => (
                <VideoCard key={video.id} video={video} onPlay={onPlayVideo} />
              ))}
            </div>
          )}
        </section>
      </main>

      {/* VIP / SVIP Requirements Modal */}
      {vipModal && (
        <div
          className="fixed inset-0 z-50 bg-black/80 backdrop-blur-md flex items-center justify-center p-4"
          role="dialog"
          aria-modal="true"
          aria-label="Membership Details"
        >
          <div className="w-full max-w-xs rounded-3xl mizo-royal-card p-5 text-center space-y-3.5 border border-amber-400/50">
            <Crown className="w-10 h-10 text-amber-400 mx-auto" />
            <h3 className="text-lg font-display font-bold text-white">
              {vipModal === 'vip'
                ? `VIP ${profile.vipLevel} Privileges`
                : `SVIP ${profile.svipLevel} Sovereign Tier`}
            </h3>
            <p className="text-xs text-slate-300">
              {vipModal === 'vip'
                ? `Collect VIP Frames from Store and spend coins in live rooms to reach VIP ${
                    profile.vipLevel + 1
                  }.`
                : `Unlock Premium Animated Assets and Special Entries to ascend to SVIP ${
                    profile.svipLevel + 1
                  }.`}
            </p>
            <div className="grid grid-cols-2 gap-2.5 pt-1">
              <button
                type="button"
                onClick={() => setVipModal(null)}
                className="min-h-[40px] rounded-xl bg-white/10 text-xs font-bold text-white"
              >
                Close
              </button>
              <button
                type="button"
                onClick={() => {
                  setVipModal(null);
                  onOpenStore();
                }}
                className="min-h-[40px] rounded-xl mizo-gold-gradient text-[#1E0B3B] text-xs font-extrabold"
              >
                Visit Store
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
