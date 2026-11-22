import React from 'react';
import {
  Camera,
  CameraOff,
  Mic,
  MicOff,
  RefreshCw,
  RotateCw,
  Sliders,
  Sparkles,
  Wand2,
  X,
} from 'lucide-react';
import {
  BackgroundEffectMode,
  HostControlState,
  VideoFilterMode,
  VisualEffectMode,
} from '../types/mizo';

interface HostControlPanelProps {
  open: boolean;
  controls: HostControlState;
  onChange: (next: HostControlState) => void;
  onClose: () => void;
}

const FILTERS: VideoFilterMode[] = ['Natural', 'Beauty', 'Smooth', 'Warm', 'Cool', 'Royal'];
const EFFECTS: VisualEffectMode[] = ['None', 'Golden Sparkles', 'Neon Aura', 'Crown Halo'];
const BACKGROUNDS: BackgroundEffectMode[] = ['None', 'Studio Blur', 'Royal Stage'];

export function getCssFilterForMode(mode: VideoFilterMode): string {
  switch (mode) {
    case 'Beauty':
      return 'brightness(1.08) contrast(0.96) saturate(1.12)';
    case 'Smooth':
      return 'brightness(1.05) blur(0.4px) saturate(1.06)';
    case 'Warm':
      return 'sepia(0.24) saturate(1.22) brightness(1.04)';
    case 'Cool':
      return 'hue-rotate(190deg) saturate(0.95) brightness(1.02)';
    case 'Royal':
      return 'contrast(1.12) saturate(1.28) hue-rotate(-10deg)';
    default:
      return 'none';
  }
}

export const HostControlPanel: React.FC<HostControlPanelProps> = ({
  open,
  controls,
  onChange,
  onClose,
}) => {
  if (!open) return null;

  const rotateCamera = () => {
    const order: Array<0 | 90 | 180 | 270> = [0, 90, 180, 270];
    const next = order[(order.indexOf(controls.rotationDeg) + 1) % order.length];
    onChange({ ...controls, rotationDeg: next });
  };

  return (
    <div
      className="fixed inset-x-0 bottom-0 z-50 flex justify-center pointer-events-none"
      role="dialog"
      aria-modal="false"
      aria-label="Host Control Panel"
    >
      <div className="pointer-events-auto w-full max-w-lg rounded-t-3xl bg-[#0D061B]/95 backdrop-blur-2xl border-t border-x border-purple-500/40 p-4 pb-safe space-y-4 shadow-[0_-16px_48px_rgba(0,0,0,0.85)] max-h-[78vh] overflow-y-auto">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Sliders className="w-4 h-4 text-amber-400" />
            <h3 className="text-sm font-display font-bold text-white">
              Host Studio Controls
            </h3>
          </div>
          <button
            type="button"
            onClick={onClose}
            aria-label="Close host controls"
            className="min-w-[36px] min-h-[36px] rounded-xl bg-white/5 flex items-center justify-center text-slate-300 hover:text-white"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Camera & Microphone Controls */}
        <div className="grid grid-cols-4 gap-2">
          <button
            type="button"
            onClick={() => onChange({ ...controls, cameraOn: !controls.cameraOn })}
            className={`p-2.5 rounded-2xl border flex flex-col items-center gap-1 text-[11px] font-semibold transition-colors ${
              controls.cameraOn
                ? 'bg-purple-900/50 border-amber-400/60 text-white'
                : 'bg-rose-950/60 border-rose-500/50 text-rose-200'
            }`}
          >
            {controls.cameraOn ? <Camera className="w-5 h-5 text-amber-300" /> : <CameraOff className="w-5 h-5 text-rose-400" />}
            <span>{controls.cameraOn ? 'Cam ON' : 'Cam OFF'}</span>
          </button>

          <button
            type="button"
            onClick={() => onChange({ ...controls, micOn: !controls.micOn })}
            className={`p-2.5 rounded-2xl border flex flex-col items-center gap-1 text-[11px] font-semibold transition-colors ${
              controls.micOn
                ? 'bg-purple-900/50 border-amber-400/60 text-white'
                : 'bg-rose-950/60 border-rose-500/50 text-rose-200'
            }`}
          >
            {controls.micOn ? <Mic className="w-5 h-5 text-amber-300" /> : <MicOff className="w-5 h-5 text-rose-400" />}
            <span>{controls.micOn ? 'Mic ON' : 'Mic OFF'}</span>
          </button>

          <button
            type="button"
            onClick={() =>
              onChange({
                ...controls,
                facingMode: controls.facingMode === 'front' ? 'rear' : 'front',
              })
            }
            className="p-2.5 rounded-2xl bg-[#160B2C] border border-purple-500/30 hover:border-amber-400/50 flex flex-col items-center gap-1 text-[11px] font-semibold text-white"
          >
            <RefreshCw className="w-5 h-5 text-purple-300" />
            <span>{controls.facingMode === 'front' ? 'Front' : 'Rear'}</span>
          </button>

          <button
            type="button"
            onClick={rotateCamera}
            className="p-2.5 rounded-2xl bg-[#160B2C] border border-purple-500/30 hover:border-amber-400/50 flex flex-col items-center gap-1 text-[11px] font-semibold text-white"
          >
            <RotateCw className="w-5 h-5 text-purple-300" />
            <span>{controls.rotationDeg}&deg;</span>
          </button>
        </div>

        {/* Video Filters */}
        <div className="space-y-2">
          <div className="flex items-center justify-between text-xs">
            <span className="font-bold text-white inline-flex items-center gap-1.5">
              <Wand2 className="w-3.5 h-3.5 text-amber-400" />
              Video Filters
            </span>
            <span className="text-amber-300 font-semibold">{controls.filter}</span>
          </div>
          <div className="flex items-center gap-2 overflow-x-auto no-scrollbar py-0.5">
            {FILTERS.map((f) => (
              <button
                key={f}
                type="button"
                onClick={() => onChange({ ...controls, filter: f })}
                className={`px-3.5 py-2 rounded-xl text-xs font-bold whitespace-nowrap shrink-0 transition-all ${
                  controls.filter === f
                    ? 'mizo-gold-gradient text-[#1E0B3B]'
                    : 'bg-[#170C2E] text-slate-300 border border-purple-500/25'
                }`}
              >
                {f}
              </button>
            ))}
          </div>
        </div>

        {/* Visual Effects */}
        <div className="space-y-2">
          <div className="flex items-center justify-between text-xs">
            <span className="font-bold text-white inline-flex items-center gap-1.5">
              <Sparkles className="w-3.5 h-3.5 text-purple-300" />
              Stage Effects
            </span>
            <span className="text-purple-200 font-semibold">
              {controls.effect === 'None' ? 'OFF' : `${controls.effect} (ON)`}
            </span>
          </div>
          <div className="flex items-center gap-2 overflow-x-auto no-scrollbar py-0.5">
            {EFFECTS.map((ef) => (
              <button
                key={ef}
                type="button"
                onClick={() => onChange({ ...controls, effect: ef })}
                className={`px-3.5 py-2 rounded-xl text-xs font-bold whitespace-nowrap shrink-0 transition-all ${
                  controls.effect === ef
                    ? 'mizo-purple-gradient text-white border border-amber-400/50'
                    : 'bg-[#170C2E] text-slate-300 border border-purple-500/25'
                }`}
              >
                {ef}
              </button>
            ))}
          </div>
        </div>

        {/* Background Effects */}
        <div className="space-y-2">
          <div className="flex items-center justify-between text-xs">
            <span className="font-bold text-white">Background Effect</span>
            <span className="text-slate-300">{controls.backgroundEffect}</span>
          </div>
          <div className="grid grid-cols-3 gap-2">
            {BACKGROUNDS.map((bg) => (
              <button
                key={bg}
                type="button"
                onClick={() => onChange({ ...controls, backgroundEffect: bg })}
                className={`py-2 px-2 rounded-xl text-xs font-semibold transition-all ${
                  controls.backgroundEffect === bg
                    ? 'bg-purple-700 text-white border border-amber-400/50'
                    : 'bg-[#170C2E] text-slate-300 border border-purple-500/25'
                }`}
              >
                {bg}
              </button>
            ))}
          </div>
        </div>

        <p className="text-[11px] text-slate-400 text-center">
          Interactive Host Studio Demo — hardware camera &amp; filters run locally when device permissions are active.
        </p>
      </div>
    </div>
  );
};
