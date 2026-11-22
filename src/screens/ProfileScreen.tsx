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
  Eye,
  Film,
  Gift,
  Heart,
  History,
  Lock,
  Pencil,
  PhoneCall,
  Plus,
  Repeat2,
  Settings,
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
  likedVideos: UserVideo[];
  repostedVideos: UserVideo[];
  onEditProfile: () => void;
  onPlayVideo: (video: UserVideo) => void;
  onOpenCreateVideo: () => void;
  onOpenStore: () => void;
  onOpenLevels: () => void;
  onOpenAchievements: () => void;
  onOpenAgency: () => void;
  onOpenWallet: () => void;
  onOpenRankings: () => void;
  onOpenSettings: () => void;
  onOpenCallHistory: () => void;
  onShareProfile: () => void;
  onToggleEquipStoreItem: (item: StoreItem) => void;
}

export const ProfileScreen: React.FC<ProfileScreenProps> = ({
  profile,
  storeItems,
  achievements,
  myVideos,
  savedVideos,
  likedVideos,
  repostedVideos,
  onEditProfile,
  onPlayVideo,
  onOpenCreateVideo,
  onOpenStore,
  onOpenLevels,
  onOpenAchievements,
  onOpenAgency,
  onOpenWallet,
  onOpenRankings,
  onOpenSettings,
  onOpenCallHistory,
  onShareProfile,
  onToggleEquipStoreItem,
}) => {
  const [videoTab, setVideoTab] = useState<ProfileVideoTab>('public');
  const [assetTab, setAssetTab] = useState<'frames' | 'entries' | 'badges' | 'gifts'>('frames');
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
      : videoTab === 'saved'
      ? savedVideos
      : videoTab === 'liked'
      ? likedVideos
      : repostedVideos;

  const clampedLevel = Math.max(1, Math.min(LEVEL_CONFIG.maxLevel, profile.level));
  const tier = getLevelTier(clampedLevel);
  const nextXp = getXpRequiredForLevel(clampedLevel);
  const progressPct = Math.min(100, Math.round((profile.xp / nextXp) * 100));

  const ownedFrames = storeItems.filter(
    (s) => (s.category === 'VIP Frames' || s.category === 'Animated Frames') && s.owned
  );
  const ownedEntries = storeItems.filter((s) => s.category === 'Special Entry' && s.owned);
  const ownedSpecialAssets = storeItems.filter(
    (s) =>
      (s.category === 'Premium Assets' ||
        s.category === 'Profile Decorations' ||
        s.category === 'Name Decorations' ||
        s.category === 'Special Badges' ||
        s.category === 'Custom Gift') &&
      s.owned
  );
  const equippedBadge = achievements.find((b) => b.equipped);

  const themeBannerClass =
    profile.profileTheme === 'obsidian-gold'
      ? 'from-amber-950/60 via-[#0E0804] to-[#06040B]'
      : profile.profileTheme === 'neon-orchid'
      ? 'from-fuchsia-950/70 via-[#1D0528] to-[#06040B]'
      : profile.profileTheme === 'midnight-crown'
      ? 'from-indigo-950/70 via-[#070B22] to-[#06040B]'
      : 'from-purple-950/50 via-[#120624] to-[#06040B]';

  const nameStyleClass =
    profile.equippedNameDecorId === 'name-royal-gold'
      ? 'mizo-gold-text'
      : profile.equippedNameDecorId === 'name-neon-prism'
      ? 'bg-gradient-to-r from-fuchsia-400 via-amber-300 to-purple-300 bg-clip-text text-transparent'
      : 'text-white';

  return (
    <div className={`min-h-screen pb-24 bg-gradient-to-b ${themeBannerClass}`}>
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
              <span>Frames &amp; Assets</span>
            </button>

            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={onEditProfile}
                className="min-h-[38px] px-3 rounded-full bg-black/55 backdrop-blur-md border border-white/20 text-xs font-semibold text-white inline-flex items-center gap-1.5 hover:bg-black/75"
              >
                <Camera className="w-3.5 h-3.5 text-amber-300" />
                <span>Cover</span>
              </button>
              <button
                type="button"
                onClick={onOpenSettings}
                aria-label="Account Settings"
                className="min-w-[38px] min-h-[38px] rounded-full bg-black/55 backdrop-blur-md border border-white/20 flex items-center justify-center text-amber-300 hover:bg-black/75"
              >
                <Settings className="w-4 h-4" />
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
            <h1 className={`text-xl font-display font-extrabold ${nameStyleClass}`}>
              {profile.username}
            </h1>
            {profile.isVerified && (
              <BadgeCheck className="w-5 h-5 text-sky-400 fill-sky-400/20" />
            )}
            <LevelBadge level={clampedLevel} size="sm" onClick={onOpenLevels} />
            {equippedBadge && (
              <span className="px-2 py-0.5 rounded-full bg-purple-900/75 border border-amber-400/50 text-[10px] font-bold text-amber-200">
                {equippedBadge.icon} {equippedBadge.name}
              </span>
            )}
          </div>

          <div className="mt-1 flex items-center justify-center gap-3 text-xs text-slate-300 flex-wrap">
            <button
              type="button"
              onClick={handleCopyId}
              className="inline-flex items-center gap-1 hover:text-amber-300 transition-colors font-mono-num"
            >
              <span>ID: {profile.userId}</span>
              {copiedId ? (
                <Check className="w-3.5 h-3.5 text-emerald-400" />
              ) : (
                <Copy className="w-3.5 h-3.5 opacity-75" />
              )}
            </button>
            <span className="text-slate-500">·</span>
            <span className="inline-flex items-center gap-1 text-slate-400 font-mono-num">
              <Eye className="w-3.5 h-3.5 text-purple-300" />{' '}
              {profile.totalProfileViews.toLocaleString()} views
            </span>
            <span className="text-slate-500">·</span>
            <span className="text-slate-400 capitalize">
              {profile.profilePrivacy} · Joined {profile.accountCreatedAt}
            </span>
          </div>

          {profile.bio && (
            <p className="mt-2 text-xs sm:text-sm text-slate-300 max-w-md">
              {profile.bio}
            </p>
          )}

          {/* Profile Statistics Row */}
          <div className="mt-3.5 w-full max-w-lg grid grid-cols-4 divide-x divide-purple-500/20 py-2 rounded-2xl bg-[#110822]/70 border border-purple-500/20">
            <div>
              <div className="text-base font-display font-bold text-white font-mono-num">
                {profile.followers}
              </div>
              <div className="text-[11px] text-slate-400">Followers</div>
            </div>
            <div>
              <div className="text-base font-display font-bold text-white font-mono-num">
                {profile.following}
              </div>
              <div className="text-[11px] text-slate-400">Following</div>
            </div>
            <div>
              <div className="text-base font-display font-bold text-white font-mono-num">
                {profile.likes}
              </div>
              <div className="text-[11px] text-slate-400">Likes</div>
            </div>
            <div>
              <div className="text-base font-display font-bold text-amber-300 font-mono-num">
                {profile.liveSessionsCount}
              </div>
              <div className="text-[11px] text-slate-400">Lives</div>
            </div>
          </div>

          <div className="mt-2.5 w-full max-w-md grid grid-cols-2 gap-2.5">
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
          {/* Level Card (Levels 1-99 only) */}
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
                <span className="text-slate-400 block">Videos / Gifts</span>
                <span className="text-amber-300 font-bold">
                  {myVideos.length} · {profile.giftsReceivedCount}
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

          {/* VIP Member Card & Super VIP (SVIP) Card */}
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
                <span>Frames Owned: {ownedFrames.length}</span>
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
                <span>Assets Owned: {ownedSpecialAssets.length + ownedEntries.length}</span>
                <span className="text-fuchsia-200">Next: SVIP {profile.svipLevel + 1}</span>
              </div>
            </button>
          </div>

          {/* Profile Assets Inventory (Frames, Entries, Badges, Gifts) */}
          <div className="rounded-2xl mizo-royal-card p-3.5 space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-xs font-display font-bold text-white inline-flex items-center gap-1.5">
                <Gift className="w-4 h-4 text-amber-400" />
                My Profile Assets &amp; Collection
              </span>
              <button
                type="button"
                onClick={onOpenStore}
                className="text-xs font-semibold text-amber-300 hover:underline"
              >
                Open Store
              </button>
            </div>

            <div className="grid grid-cols-4 gap-1.5 p-1 rounded-xl bg-[#100820]">
              {(
                [
                  ['frames', `Frames (${ownedFrames.length})`],
                  ['entries', `Entries (${ownedEntries.length})`],
                  ['badges', `Badges (${achievements.filter((a) => a.earned).length})`],
                  ['gifts', `Assets (${ownedSpecialAssets.length})`],
                ] as const
              ).map(([k, label]) => (
                <button
                  key={k}
                  type="button"
                  onClick={() => setAssetTab(k)}
                  className={`py-1.5 rounded-lg text-[10.5px] font-bold ${
                    assetTab === k
                      ? 'mizo-purple-gradient text-white'
                      : 'text-slate-400 hover:text-white'
                  }`}
                >
                  {label}
                </button>
              ))}
            </div>

            {assetTab === 'frames' && (
              <div className="grid grid-cols-2 gap-2">
                {ownedFrames.length === 0 ? (
                  <p className="col-span-2 text-xs text-slate-400 text-center py-2">
                    No frames unlocked yet. Visit Store!
                  </p>
                ) : (
                  ownedFrames.map((f) => {
                    const equipped = profile.equippedFrameId === f.id;
                    return (
                      <button
                        key={f.id}
                        type="button"
                        onClick={() => onToggleEquipStoreItem(f)}
                        className={`p-2.5 rounded-xl border text-left text-xs flex items-center justify-between ${
                          equipped
                            ? 'bg-purple-900/50 border-amber-400 text-amber-200'
                            : 'bg-[#140A28] border-purple-500/25 text-white'
                        }`}
                      >
                        <span className="truncate font-bold">{f.name}</span>
                        <span className="text-[10px] font-extrabold shrink-0">
                          {equipped ? 'Equipped' : 'Equip'}
                        </span>
                      </button>
                    );
                  })
                )}
              </div>
            )}

            {assetTab === 'entries' && (
              <div className="grid grid-cols-2 gap-2">
                {ownedEntries.length === 0 ? (
                  <p className="col-span-2 text-xs text-slate-400 text-center py-2">
                    Unlock Special Entry effects in Mizo Store.
                  </p>
                ) : (
                  ownedEntries.map((e) => {
                    const equipped = profile.equippedEntryId === e.id;
                    return (
                      <button
                        key={e.id}
                        type="button"
                        onClick={() => onToggleEquipStoreItem(e)}
                        className={`p-2.5 rounded-xl border text-left text-xs flex items-center justify-between ${
                          equipped
                            ? 'bg-purple-900/50 border-amber-400 text-amber-200'
                            : 'bg-[#140A28] border-purple-500/25 text-white'
                        }`}
                      >
                        <span className="truncate font-bold">{e.name}</span>
                        <span className="text-[10px] font-extrabold shrink-0">
                          {equipped ? 'Equipped' : 'Equip'}
                        </span>
                      </button>
                    );
                  })
                )}
              </div>
            )}

            {assetTab === 'badges' && (
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
            )}

            {assetTab === 'gifts' && (
              <div className="grid grid-cols-2 gap-2">
                {ownedSpecialAssets.length === 0 ? (
                  <p className="col-span-2 text-xs text-slate-400 text-center py-2">
                    Collect Profile Decorations, Name Decorations &amp; Badges in Store.
                  </p>
                ) : (
                  ownedSpecialAssets.map((a) => (
                    <button
                      key={a.id}
                      type="button"
                      onClick={() => onToggleEquipStoreItem(a)}
                      className="p-2.5 rounded-xl bg-[#140A28] border border-purple-500/25 text-left text-xs flex items-center justify-between text-white"
                    >
                      <span className="truncate font-bold">{a.name}</span>
                      <span className="text-[10px] text-amber-300 font-bold shrink-0">Use</span>
                    </button>
                  ))
                )}
              </div>
            )}
          </div>

          {/* 7 Profile Shortcuts */}
          <div className="grid grid-cols-4 gap-2">
            <ShortcutTile
              icon={<Trophy className="w-5 h-5 text-amber-400" />}
              label="Achievements"
              onClick={onOpenAchievements}
            />
            <ShortcutTile
              icon={<Building2 className="w-5 h-5 text-purple-300" />}
              label="Agency"
              onClick={onOpenAgency}
            />
            <ShortcutTile
              icon={<Coins className="w-5 h-5 text-amber-300" />}
              label="Wallet"
              onClick={onOpenWallet}
            />
            <ShortcutTile
              icon={<Crown className="w-5 h-5 text-fuchsia-400" />}
              label="Rankings"
              onClick={onOpenRankings}
            />
            <ShortcutTile
              icon={<History className="w-5 h-5 text-emerald-300" />}
              label="Transactions"
              onClick={onOpenWallet}
            />
            <ShortcutTile
              icon={<PhoneCall className="w-5 h-5 text-sky-300" />}
              label="Call History"
              onClick={onOpenCallHistory}
            />
            <ShortcutTile
              icon={<Award className="w-5 h-5 text-amber-200" />}
              label="Level 1-99"
              onClick={onOpenLevels}
            />
            <ShortcutTile
              icon={<Settings className="w-5 h-5 text-purple-200" />}
              label="Settings"
              onClick={onOpenSettings}
            />
          </div>
        </section>

        {/* 5 Profile Video Tabs: Public | Private | Saved | Liked | Reposted */}
        <section className="px-4 mt-5 space-y-4 max-w-4xl mx-auto">
          <div className="flex items-center justify-between gap-2">
            <div className="flex items-center gap-1 p-1 rounded-2xl bg-[#120A22] border border-purple-500/25 flex-1 overflow-x-auto no-scrollbar">
              {(
                [
                  ['public', `Public (${publicVideos.length})`, Film],
                  ['private', `Private (${privateVideos.length})`, Lock],
                  ['saved', `Saved (${savedVideos.length})`, Bookmark],
                  ['liked', `Liked (${likedVideos.length})`, Heart],
                  ['reposted', `Reposted (${repostedVideos.length})`, Repeat2],
                ] as const
              ).map(([key, label, Icon]) => (
                <button
                  key={key}
                  type="button"
                  onClick={() => setVideoTab(key)}
                  className={`py-2 px-2.5 rounded-xl text-[11px] font-bold transition-all whitespace-nowrap inline-flex items-center gap-1 shrink-0 ${
                    videoTab === key
                      ? 'mizo-gold-gradient text-[#1E0B3B] shadow'
                      : 'text-slate-300 hover:text-white'
                  }`}
                >
                  <Icon className="w-3 h-3" />
                  <span>{label}</span>
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
              <Film className="w-8 h-8 text-purple-300 mx-auto mb-2 opacity-75" />
              <p className="text-sm font-semibold text-white capitalize">
                No {videoTab} videos yet
              </p>
              <p className="text-xs text-slate-400 mt-1">
                Explore the Videos tab to like, save, or repost moments, or upload your own clip.
              </p>
              {(videoTab === 'public' || videoTab === 'private') && (
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

const ShortcutTile: React.FC<{
  icon: React.ReactNode;
  label: string;
  onClick: () => void;
}> = ({ icon, label, onClick }) => (
  <button
    type="button"
    onClick={onClick}
    className="rounded-2xl mizo-royal-card p-2.5 flex flex-col items-center gap-1.5 hover:border-amber-400/60 transition-colors"
  >
    {icon}
    <span className="text-[10px] font-bold text-white text-center leading-tight truncate max-w-full">
      {label}
    </span>
  </button>
);
