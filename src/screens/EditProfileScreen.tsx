import React, { useRef, useState } from 'react';
import { Camera, Upload } from 'lucide-react';
import { SafeImage } from '../components/Cards';
import { AppHeader } from '../components/Header';
import { AVATAR_PRESETS, COVER_PRESETS } from '../data/mizoData';
import { UserProfile } from '../types/mizo';

interface EditProfileScreenProps {
  profile: UserProfile;
  onCancel: () => void;
  onSave: (updates: Pick<UserProfile, 'username' | 'bio' | 'avatar' | 'coverImage'>) => void;
}

export const EditProfileScreen: React.FC<EditProfileScreenProps> = ({
  profile,
  onCancel,
  onSave,
}) => {
  const [username, setUsername] = useState(profile.username);
  const [bio, setBio] = useState(profile.bio);
  const [avatar, setAvatar] = useState(profile.avatar);
  const [coverImage, setCoverImage] = useState(profile.coverImage);

  const avatarInputRef = useRef<HTMLInputElement>(null);
  const coverInputRef = useRef<HTMLInputElement>(null);

  const handleImageFile = (
    e: React.ChangeEvent<HTMLInputElement>,
    setter: (val: string) => void
  ) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const url = URL.createObjectURL(file);
    setter(url);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSave({
      username: username.trim() || profile.username,
      bio: bio.trim(),
      avatar,
      coverImage,
    });
  };

  return (
    <div className="min-h-screen pb-10">
      <AppHeader title="Edit Profile" onBack={onCancel} />

      <form onSubmit={handleSubmit} className="max-w-2xl mx-auto px-4 pt-4 space-y-6">
        {/* Change Cover Image */}
        <section className="space-y-2.5">
          <div className="flex items-center justify-between">
            <label className="text-sm font-display font-bold text-white">
              Cover Image
            </label>
            <button
              type="button"
              onClick={() => coverInputRef.current?.click()}
              className="text-xs font-semibold text-amber-300 hover:text-amber-200 inline-flex items-center gap-1"
            >
              <Upload className="w-3.5 h-3.5" />
              <span>Upload Photo</span>
            </button>
            <input
              ref={coverInputRef}
              type="file"
              accept="image/*"
              className="hidden"
              onChange={(e) => handleImageFile(e, setCoverImage)}
            />
          </div>

          <div className="relative h-36 rounded-2xl overflow-hidden border border-purple-500/35">
            <SafeImage src={coverImage} alt="Selected cover" className="w-full h-full object-cover" />
            <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-transparent to-transparent" />
            <button
              type="button"
              onClick={() => coverInputRef.current?.click()}
              className="absolute bottom-3 right-3 px-3 py-1.5 rounded-xl bg-black/65 border border-white/20 text-xs font-semibold text-white inline-flex items-center gap-1.5"
            >
              <Camera className="w-3.5 h-3.5 text-amber-300" />
              <span>Change Cover</span>
            </button>
          </div>

          <div className="flex items-center gap-2 overflow-x-auto no-scrollbar py-1">
            {COVER_PRESETS.map((preset) => (
              <button
                key={preset.label}
                type="button"
                onClick={() => setCoverImage(preset.url)}
                className={`shrink-0 rounded-xl overflow-hidden border-2 transition-all ${
                  coverImage === preset.url
                    ? 'border-amber-400 scale-105'
                    : 'border-transparent opacity-75 hover:opacity-100'
                }`}
              >
                <SafeImage
                  src={preset.url}
                  alt={preset.label}
                  className="w-20 h-12 object-cover"
                />
              </button>
            ))}
          </div>
        </section>

        {/* Change Profile Picture */}
        <section className="space-y-3">
          <label className="block text-sm font-display font-bold text-white">
            Profile Picture
          </label>
          <div className="flex items-center gap-4">
            <div className="relative w-20 h-20 rounded-full p-0.5 mizo-gold-gradient shrink-0">
              <SafeImage
                src={avatar}
                alt="Selected avatar"
                className="w-full h-full rounded-full object-cover"
              />
            </div>

            <div className="flex flex-col gap-2">
              <button
                type="button"
                onClick={() => avatarInputRef.current?.click()}
                className="min-h-[40px] px-4 rounded-xl bg-[#190D30] border border-purple-400/40 text-xs font-semibold text-white inline-flex items-center gap-2 hover:border-amber-400"
              >
                <Camera className="w-4 h-4 text-amber-300" />
                <span>Change Profile Picture</span>
              </button>
              <input
                ref={avatarInputRef}
                type="file"
                accept="image/*"
                className="hidden"
                onChange={(e) => handleImageFile(e, setAvatar)}
              />
              <div className="flex items-center gap-2">
                {AVATAR_PRESETS.map((preset) => (
                  <button
                    key={preset.label}
                    type="button"
                    onClick={() => setAvatar(preset.url)}
                    className={`w-9 h-9 rounded-full overflow-hidden border-2 transition-transform ${
                      avatar === preset.url
                        ? 'border-amber-400 scale-110'
                        : 'border-purple-500/30 opacity-75 hover:opacity-100'
                    }`}
                    title={preset.label}
                  >
                    <SafeImage src={preset.url} alt={preset.label} className="w-full h-full object-cover" />
                  </button>
                ))}
              </div>
            </div>
          </div>
        </section>

        {/* Username */}
        <section className="space-y-2">
          <label htmlFor="edit-username" className="block text-sm font-display font-bold text-white">
            Username
          </label>
          <input
            id="edit-username"
            type="text"
            required
            maxLength={32}
            value={username}
            onChange={(e) => setUsername(e.target.value)}
            placeholder="Enter your username"
            className="w-full h-12 px-4 rounded-xl bg-[#140B26] border border-purple-500/35 text-sm text-white placeholder:text-slate-400 focus:outline-none focus:border-amber-400"
          />
        </section>

        {/* Bio */}
        <section className="space-y-2">
          <label htmlFor="edit-bio" className="block text-sm font-display font-bold text-white">
            Bio
          </label>
          <textarea
            id="edit-bio"
            rows={3}
            maxLength={140}
            value={bio}
            onChange={(e) => setBio(e.target.value)}
            placeholder="Tell your audience about your streams..."
            className="w-full p-4 rounded-xl bg-[#140B26] border border-purple-500/35 text-sm text-white placeholder:text-slate-400 focus:outline-none focus:border-amber-400 resize-none"
          />
          <p className="text-right text-[11px] text-slate-400 font-mono-num">
            {bio.length}/140
          </p>
        </section>

        {/* Save Changes */}
        <div className="pt-2">
          <button
            type="submit"
            className="w-full min-h-[48px] rounded-2xl mizo-gold-gradient text-[#1E0B3B] text-sm font-extrabold shadow-lg shadow-amber-500/25 active:scale-[0.99] transition-transform"
          >
            Save Changes
          </button>
        </div>
      </form>
    </div>
  );
};
