import React, { useEffect, useRef, useState } from 'react';
import { Camera, Mic, MicOff, Radio, Video, VideoOff } from 'lucide-react';
import { SafeImage } from '../components/Cards';
import { AppHeader } from '../components/Header';
import { ASSETS, COVER_PRESETS } from '../data/mizoData';

interface GoLiveScreenProps {
  username: string;
  onBack: () => void;
  onStartLiveDemo: (title: string, coverImage: string) => void;
}

export const GoLiveScreen: React.FC<GoLiveScreenProps> = ({
  username,
  onBack,
  onStartLiveDemo,
}) => {
  const [title, setTitle] = useState(`${username} Live Lounge`);
  const [coverImage, setCoverImage] = useState(ASSETS.heroStage);
  const [cameraActive, setCameraActive] = useState(false);
  const [micGranted, setMicGranted] = useState(false);
  const [cameraError, setCameraError] = useState<string | null>(null);
  const videoRef = useRef<HTMLVideoElement>(null);
  const streamRef = useRef<MediaStream | null>(null);

  const stopCamera = () => {
    if (streamRef.current) {
      streamRef.current.getTracks().forEach((t) => t.stop());
      streamRef.current = null;
    }
    setCameraActive(false);
    setMicGranted(false);
  };

  useEffect(() => {
    return () => {
      if (streamRef.current) {
        streamRef.current.getTracks().forEach((t) => t.stop());
      }
    };
  }, []);

  const toggleCameraAndMicPreview = async () => {
    if (cameraActive) {
      stopCamera();
      return;
    }
    setCameraError(null);
    try {
      const mediaStream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: 'user' },
        audio: true,
      });
      streamRef.current = mediaStream;
      setCameraActive(true);
      setMicGranted(mediaStream.getAudioTracks().length > 0);
      if (videoRef.current) {
        videoRef.current.srcObject = mediaStream;
      }
    } catch {
      setCameraError(
        'Camera/Microphone permission unavailable in this browser — studio cover fallback ready.'
      );
      setCameraActive(false);
      setMicGranted(false);
    }
  };

  const handleStartLive = (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim()) return;
    stopCamera();
    onStartLiveDemo(title.trim(), coverImage);
  };

  return (
    <div className="min-h-screen pb-10">
      <AppHeader
        title="Go Live Setup"
        onBack={() => {
          stopCamera();
          onBack();
        }}
      />

      <form onSubmit={handleStartLive} className="max-w-xl mx-auto px-4 pt-4 space-y-5">
        {/* Real Camera Preview & Mic Permission */}
        <section className="space-y-2">
          <div className="flex items-center justify-between gap-2">
            <span className="text-sm font-display font-bold text-white">
              Camera &amp; Mic Preview
            </span>
            <button
              type="button"
              onClick={toggleCameraAndMicPreview}
              className="text-xs font-semibold text-amber-300 hover:text-amber-200 inline-flex items-center gap-1.5"
            >
              {cameraActive ? <VideoOff className="w-3.5 h-3.5" /> : <Video className="w-3.5 h-3.5" />}
              <span>{cameraActive ? 'Stop Preview' : 'Test Camera & Mic'}</span>
            </button>
          </div>

          <div className="relative aspect-[4/3] w-full rounded-2xl overflow-hidden mizo-royal-card border border-purple-500/35">
            {cameraActive ? (
              <video
                ref={videoRef}
                autoPlay
                muted
                playsInline
                className="w-full h-full object-cover scale-x-[-1]"
              />
            ) : (
              <>
                <SafeImage
                  src={coverImage}
                  alt="Live cover preview"
                  className="w-full h-full object-cover opacity-55"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/30 to-transparent flex flex-col items-center justify-center p-5 text-center">
                  <div className="w-14 h-14 rounded-full mizo-gold-gradient flex items-center justify-center text-[#1E0B3B] mb-2.5 shadow-lg">
                    <Camera className="w-7 h-7" />
                  </div>
                  <p className="text-sm font-bold text-white">Camera &amp; Mic Setup</p>
                  <p className="text-xs text-slate-300 mt-0.5">
                    Tap &ldquo;Test Camera &amp; Mic&rdquo; or press Start Live to launch stream
                  </p>
                </div>
              </>
            )}

            <div className="absolute bottom-2.5 right-2.5 px-2.5 py-1 rounded-full bg-black/70 border border-white/15 text-[11px] font-semibold inline-flex items-center gap-1">
              {micGranted ? (
                <>
                  <Mic className="w-3.5 h-3.5 text-emerald-400" />
                  <span className="text-emerald-300">Mic Ready</span>
                </>
              ) : (
                <>
                  <MicOff className="w-3.5 h-3.5 text-slate-300" />
                  <span className="text-slate-300">Mic Permission Pending</span>
                </>
              )}
            </div>
          </div>

          {cameraError && <p className="text-xs text-amber-300">{cameraError}</p>}
        </section>

        {/* Live Cover Selection */}
        <section className="space-y-2">
          <label className="block text-sm font-display font-bold text-white">
            Live Cover
          </label>
          <div className="flex items-center gap-2.5 overflow-x-auto no-scrollbar py-1">
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
                  className="w-24 h-14 object-cover"
                />
              </button>
            ))}
          </div>
        </section>

        {/* Live Title */}
        <section className="space-y-2">
          <label htmlFor="live-title" className="block text-sm font-display font-bold text-white">
            Live Title
          </label>
          <input
            id="live-title"
            type="text"
            required
            maxLength={60}
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            placeholder="Give your live stream a title..."
            className="w-full h-12 px-4 rounded-xl bg-[#140B26] border border-purple-500/35 text-sm text-white placeholder:text-slate-400 focus:outline-none focus:border-amber-400"
          />
        </section>

        <button
          type="submit"
          className="w-full min-h-[48px] rounded-2xl mizo-gold-gradient text-[#1E0B3B] text-sm font-extrabold shadow-lg shadow-amber-500/25 flex items-center justify-center gap-2 active:scale-[0.99] transition-transform"
        >
          <Radio className="w-4 h-4" />
          <span>Start Live</span>
        </button>
      </form>
    </div>
  );
};
