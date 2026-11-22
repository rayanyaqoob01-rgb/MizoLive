import React, { useRef, useState } from 'react';
import { Clapperboard, Film, Globe, Lock, Play, Upload } from 'lucide-react';
import { SafeImage } from '../components/Cards';
import { AppHeader } from '../components/Header';
import { ASSETS, COVER_PRESETS } from '../data/mizoData';
import { UserVideo } from '../types/mizo';

interface UploadVideoScreenProps {
  creatorName: string;
  onBack: () => void;
  onUploadComplete: (video: UserVideo) => void;
}

export const UploadVideoScreen: React.FC<UploadVideoScreenProps> = ({
  creatorName,
  onBack,
  onUploadComplete,
}) => {
  const [selectedFileUrl, setSelectedFileUrl] = useState<string | undefined>(undefined);
  const [selectedFileName, setSelectedFileName] = useState<string>('');
  const [selectedThumbnail, setSelectedThumbnail] = useState<string>(ASSETS.heroStage);
  const [caption, setCaption] = useState('');
  const [description, setDescription] = useState('');
  const [privacy, setPrivacy] = useState<'Public' | 'Private'>('Public');
  const [error, setError] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleVideoPick = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setSelectedFileUrl(URL.createObjectURL(file));
    setSelectedFileName(file.name);
    setError(null);
  };

  const handleUpload = (e: React.FormEvent) => {
    e.preventDefault();
    if (!caption.trim()) {
      setError('Please add a caption before uploading.');
      return;
    }

    const newVideo: UserVideo = {
      id: `vid-${Date.now()}`,
      title: caption.trim(),
      description: description.trim() || caption.trim(),
      privacy,
      thumbnail: selectedThumbnail,
      videoUrl: selectedFileUrl,
      duration: '0:30',
      views: '1',
      likes: '0',
      creatorName,
      createdAt: 'Just now',
    };

    onUploadComplete(newVideo);
  };

  return (
    <div className="min-h-screen pb-10">
      <AppHeader title="Upload Video" onBack={onBack} />

      <form onSubmit={handleUpload} className="max-w-xl mx-auto px-4 pt-4 space-y-5">
        {/* Video Selection & Preview Area */}
        <section className="space-y-3">
          <div className="flex items-center justify-between">
            <span className="text-sm font-display font-bold text-white">
              Video Preview
            </span>
            <button
              type="button"
              onClick={() => fileInputRef.current?.click()}
              className="text-xs font-semibold text-amber-300 hover:text-amber-200 inline-flex items-center gap-1.5"
            >
              <Upload className="w-3.5 h-3.5" />
              <span>Select Video</span>
            </button>
            <input
              ref={fileInputRef}
              type="file"
              accept="video/*"
              className="hidden"
              onChange={handleVideoPick}
            />
          </div>

          {selectedFileUrl ? (
            <div className="relative aspect-[9/12] max-h-[340px] w-full rounded-2xl overflow-hidden bg-black border border-purple-500/40">
              <video
                src={selectedFileUrl}
                controls
                className="w-full h-full object-contain"
              />
            </div>
          ) : (
            <div
              onClick={() => fileInputRef.current?.click()}
              role="button"
              tabIndex={0}
              onKeyDown={(e) => {
                if (e.key === 'Enter' || e.key === ' ') fileInputRef.current?.click();
              }}
              className="cursor-pointer relative aspect-[16/10] w-full rounded-2xl overflow-hidden mizo-royal-card border-dashed border-2 border-purple-400/45 hover:border-amber-400/70 transition-colors flex flex-col items-center justify-center p-6 text-center group"
            >
              <SafeImage
                src={selectedThumbnail}
                alt="Video cover preview"
                className="absolute inset-0 w-full h-full object-cover opacity-35 group-hover:opacity-45 transition-opacity"
              />
              <div className="relative z-10 flex flex-col items-center gap-2">
                <div className="w-14 h-14 rounded-2xl mizo-purple-gradient border border-amber-400/50 flex items-center justify-center shadow-lg">
                  <Clapperboard className="w-7 h-7 text-white" />
                </div>
                <p className="text-sm font-bold text-white">
                  Tap to select a video from your device
                </p>
                <p className="text-xs text-slate-300">
                  Or pick a cover frame below
                </p>
              </div>
            </div>
          )}

          {selectedFileName && (
            <p className="text-xs text-emerald-300 flex items-center gap-1.5">
              <Film className="w-3.5 h-3.5" />
              <span className="truncate">Selected: {selectedFileName}</span>
            </p>
          )}

          {!selectedFileUrl && (
            <div className="space-y-1.5">
              <p className="text-xs text-slate-400">Preview Cover Frame</p>
              <div className="flex items-center gap-2 overflow-x-auto no-scrollbar py-1">
                {COVER_PRESETS.map((preset) => (
                  <button
                    key={preset.label}
                    type="button"
                    onClick={() => setSelectedThumbnail(preset.url)}
                    className={`relative shrink-0 rounded-xl overflow-hidden border-2 transition-all ${
                      selectedThumbnail === preset.url
                        ? 'border-amber-400 scale-105'
                        : 'border-transparent opacity-70 hover:opacity-100'
                    }`}
                  >
                    <SafeImage
                      src={preset.url}
                      alt={preset.label}
                      className="w-20 h-12 object-cover"
                    />
                    <span className="absolute inset-0 flex items-center justify-center bg-black/25">
                      <Play className="w-3.5 h-3.5 text-white fill-white" />
                    </span>
                  </button>
                ))}
              </div>
            </div>
          )}
        </section>

        {/* Caption */}
        <section className="space-y-2">
          <label htmlFor="video-caption" className="block text-sm font-display font-bold text-white">
            Caption
          </label>
          <input
            id="video-caption"
            type="text"
            maxLength={80}
            value={caption}
            onChange={(e) => {
              setCaption(e.target.value);
              setError(null);
            }}
            placeholder="Write a catchy title or caption..."
            className="w-full h-12 px-4 rounded-xl bg-[#140B26] border border-purple-500/35 text-sm text-white placeholder:text-slate-400 focus:outline-none focus:border-amber-400"
          />
        </section>

        {/* Description */}
        <section className="space-y-2">
          <label htmlFor="video-desc" className="block text-sm font-display font-bold text-white">
            Description
          </label>
          <textarea
            id="video-desc"
            rows={2}
            maxLength={160}
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            placeholder="Add hashtags, music credits, or story details..."
            className="w-full p-3.5 rounded-xl bg-[#140B26] border border-purple-500/35 text-sm text-white placeholder:text-slate-400 focus:outline-none focus:border-amber-400 resize-none"
          />
        </section>

        {/* Privacy Selector */}
        <section className="space-y-2">
          <span className="block text-sm font-display font-bold text-white">
            Privacy
          </span>
          <div className="grid grid-cols-2 gap-2.5">
            <button
              type="button"
              onClick={() => setPrivacy('Public')}
              className={`min-h-[44px] rounded-xl border text-xs font-bold inline-flex items-center justify-center gap-1.5 ${
                privacy === 'Public'
                  ? 'mizo-gold-gradient text-[#1E0B3B] border-amber-300'
                  : 'bg-[#140B26] text-slate-300 border-purple-500/30'
              }`}
            >
              <Globe className="w-4 h-4" />
              <span>Public</span>
            </button>
            <button
              type="button"
              onClick={() => setPrivacy('Private')}
              className={`min-h-[44px] rounded-xl border text-xs font-bold inline-flex items-center justify-center gap-1.5 ${
                privacy === 'Private'
                  ? 'mizo-gold-gradient text-[#1E0B3B] border-amber-300'
                  : 'bg-[#140B26] text-slate-300 border-purple-500/30'
              }`}
            >
              <Lock className="w-4 h-4" />
              <span>Private</span>
            </button>
          </div>
        </section>

        {error && <p className="text-xs font-semibold text-rose-400">{error}</p>}

        <button
          type="submit"
          className="w-full min-h-[48px] rounded-2xl mizo-purple-gradient border border-purple-300/40 text-sm font-extrabold text-white shadow-lg shadow-purple-900/45 hover:brightness-110 active:scale-[0.99] transition-all"
        >
          Upload Video
        </button>
      </form>
    </div>
  );
};
