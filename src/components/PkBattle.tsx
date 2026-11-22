import React, { useState } from 'react';
import { Check, Search, Swords, Trophy, X } from 'lucide-react';
import { ELIGIBLE_PK_HOSTS } from '../data/mizoData';
import { PkOpponent } from '../types/mizo';
import { SafeImage } from './Cards';
import { LevelBadge } from './LevelBadge';

interface PkInvitePanelProps {
  open: boolean;
  pendingOpponent: PkOpponent | null;
  onClose: () => void;
  onSendInvite: (opponent: PkOpponent) => void;
  onSimulateResponse: (accepted: boolean) => void;
}

export const PkInvitePanel: React.FC<PkInvitePanelProps> = ({
  open,
  pendingOpponent,
  onClose,
  onSendInvite,
  onSimulateResponse,
}) => {
  const [query, setQuery] = useState('');

  if (!open) return null;

  const filtered = ELIGIBLE_PK_HOSTS.filter((h) =>
    h.username.toLowerCase().includes(query.trim().toLowerCase())
  );

  return (
    <div
      className="fixed inset-x-0 bottom-0 z-50 flex justify-center pointer-events-none"
      role="dialog"
      aria-modal="false"
      aria-label="PK Battle Invitation"
    >
      <div className="pointer-events-auto w-full max-w-lg rounded-t-3xl bg-[#0D061B]/95 backdrop-blur-2xl border-t border-x border-purple-500/40 p-4 pb-safe space-y-4 shadow-[0_-16px_48px_rgba(0,0,0,0.85)]">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Swords className="w-4 h-4 text-amber-400" />
            <h3 className="text-sm font-display font-bold text-white">
              Invite Host to PK Battle
            </h3>
          </div>
          <button
            type="button"
            onClick={onClose}
            aria-label="Close PK panel"
            className="min-w-[36px] min-h-[36px] rounded-xl bg-white/5 flex items-center justify-center text-slate-300 hover:text-white"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {pendingOpponent ? (
          <div className="rounded-2xl bg-[#180D31] border border-amber-400/45 p-4 text-center space-y-3">
            <div className="w-16 h-16 mx-auto rounded-full p-0.5 mizo-gold-gradient">
              <SafeImage
                src={pendingOpponent.avatar}
                alt={pendingOpponent.username}
                className="w-full h-full rounded-full object-cover"
              />
            </div>
            <div>
              <p className="text-sm font-bold text-white">
                PK Invitation sent to {pendingOpponent.username}
              </p>
              <p className="text-xs text-slate-300 mt-1">
                Battle will only begin if {pendingOpponent.username} accepts.
              </p>
            </div>

            <div className="pt-2 border-t border-purple-500/20 space-y-2">
              <p className="text-[11px] text-amber-300 font-semibold">
                Demo Host Response Simulator
              </p>
              <div className="grid grid-cols-2 gap-2.5">
                <button
                  type="button"
                  onClick={() => onSimulateResponse(false)}
                  className="min-h-[42px] rounded-xl bg-white/10 hover:bg-white/15 border border-white/15 text-xs font-bold text-slate-200"
                >
                  Decline
                </button>
                <button
                  type="button"
                  onClick={() => onSimulateResponse(true)}
                  className="min-h-[42px] rounded-xl mizo-gold-gradient text-[#1E0B3B] text-xs font-extrabold inline-flex items-center justify-center gap-1"
                >
                  <Check className="w-4 h-4" />
                  <span>Accept PK</span>
                </button>
              </div>
            </div>
          </div>
        ) : (
          <>
            <div className="relative">
              <Search className="w-4 h-4 text-purple-300/70 absolute left-3.5 top-1/2 -translate-y-1/2" />
              <input
                type="search"
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder="Search eligible live hosts..."
                className="w-full h-10 pl-10 pr-4 rounded-xl bg-[#160C2B] border border-purple-500/35 text-xs text-white placeholder:text-slate-400 focus:outline-none focus:border-amber-400"
              />
            </div>

            <div className="max-h-60 overflow-y-auto space-y-2">
              {filtered.map((host) => (
                <div
                  key={host.id}
                  className="flex items-center justify-between gap-3 p-2.5 rounded-2xl bg-[#160B2C] border border-purple-500/25"
                >
                  <div className="flex items-center gap-2.5 min-w-0">
                    <SafeImage
                      src={host.avatar}
                      alt={host.username}
                      className="w-11 h-11 rounded-full object-cover border border-amber-400/60 shrink-0"
                    />
                    <div className="min-w-0">
                      <div className="flex items-center gap-1.5">
                        <span className="text-xs font-bold text-white truncate">
                          {host.username}
                        </span>
                        <LevelBadge level={host.level} size="xs" />
                      </div>
                      <p className="text-[11px] text-slate-400 font-mono-num">
                        {host.viewers} watching
                      </p>
                    </div>
                  </div>

                  <button
                    type="button"
                    onClick={() => onSendInvite(host)}
                    className="min-h-[36px] px-3.5 rounded-xl mizo-purple-gradient border border-amber-400/40 text-xs font-bold text-white shrink-0 hover:brightness-110"
                  >
                    Invite PK
                  </button>
                </div>
              ))}
            </div>
          </>
        )}
      </div>
    </div>
  );
};

interface PkBattleStageProps {
  leftName: string;
  leftAvatar: string;
  leftLevel: number;
  leftScore: number;
  rightHost: PkOpponent;
  rightScore: number;
  secondsLeft: number;
  contributions: Array<{ id: string; text: string; team: 'left' | 'right' }>;
  winner: 'left' | 'right' | 'draw' | null;
  onBoostScore: (team: 'left' | 'right') => void;
  onEndPk: () => void;
}

export const PkBattleStage: React.FC<PkBattleStageProps> = ({
  leftName,
  leftAvatar,
  leftLevel,
  leftScore,
  rightHost,
  rightScore,
  secondsLeft,
  contributions,
  winner,
  onBoostScore,
  onEndPk,
}) => {
  const total = Math.max(1, leftScore + rightScore);
  const leftPct = Math.round((leftScore / total) * 100);
  const mins = String(Math.floor(secondsLeft / 60)).padStart(2, '0');
  const secs = String(secondsLeft % 60).padStart(2, '0');

  return (
    <div className="mx-3 mt-2 rounded-2xl bg-[#0B0518]/90 backdrop-blur-xl border border-amber-400/45 overflow-hidden shadow-[0_0_30px_rgba(147,51,234,0.45)]">
      {/* Countdown & VS Header */}
      <div className="px-3 py-1.5 bg-gradient-to-r from-purple-900/90 via-[#1D0C3D] to-fuchsia-900/90 flex items-center justify-between text-xs">
        <span className="font-bold text-amber-300 inline-flex items-center gap-1">
          <Swords className="w-3.5 h-3.5" /> PK Battle
        </span>
        <span className="px-2.5 py-0.5 rounded-full bg-black/60 border border-amber-400/50 font-mono-num font-bold text-white">
          {winner ? 'FINISHED' : `${mins}:${secs}`}
        </span>
        <button
          type="button"
          onClick={onEndPk}
          className="text-[11px] font-semibold text-slate-300 hover:text-white"
        >
          {winner ? 'Close' : 'Finish'}
        </button>
      </div>

      {/* Side-by-Side Hosts */}
      <div className="grid grid-cols-2 divide-x divide-amber-400/30">
        {/* Left Team */}
        <div className="p-2.5 flex flex-col items-center gap-1.5 bg-gradient-to-b from-purple-950/50 to-transparent">
          <div className="flex items-center gap-2 w-full">
            <SafeImage
              src={leftAvatar}
              alt={leftName}
              className="w-10 h-10 rounded-full object-cover border-2 border-amber-400 shrink-0"
            />
            <div className="min-w-0">
              <p className="text-xs font-bold text-white truncate">{leftName}</p>
              <LevelBadge level={leftLevel} size="xs" />
            </div>
          </div>
          <button
            type="button"
            onClick={() => onBoostScore('left')}
            className="w-full py-1 rounded-lg bg-amber-400/20 hover:bg-amber-400/30 border border-amber-400/40 text-[10px] font-bold text-amber-200"
          >
            +50 Demo Boost
          </button>
        </div>

        {/* Right Team */}
        <div className="p-2.5 flex flex-col items-center gap-1.5 bg-gradient-to-b from-fuchsia-950/50 to-transparent">
          <div className="flex items-center justify-end gap-2 w-full text-right">
            <div className="min-w-0">
              <p className="text-xs font-bold text-white truncate">{rightHost.username}</p>
              <LevelBadge level={rightHost.level} size="xs" />
            </div>
            <SafeImage
              src={rightHost.avatar}
              alt={rightHost.username}
              className="w-10 h-10 rounded-full object-cover border-2 border-fuchsia-400 shrink-0"
            />
          </div>
          <button
            type="button"
            onClick={() => onBoostScore('right')}
            className="w-full py-1 rounded-lg bg-fuchsia-500/20 hover:bg-fuchsia-500/30 border border-fuchsia-400/40 text-[10px] font-bold text-fuchsia-200"
          >
            +50 Demo Boost
          </button>
        </div>
      </div>

      {/* Dual Score Bar */}
      <div className="px-3 pb-2.5 space-y-1.5">
        <div className="flex items-center justify-between text-xs font-mono-num font-bold">
          <span className="text-amber-300">{leftScore.toLocaleString()}</span>
          <span className="text-fuchsia-300">{rightScore.toLocaleString()}</span>
        </div>
        <div className="h-3 w-full rounded-full bg-fuchsia-600/80 overflow-hidden flex border border-white/15">
          <div
            style={{ width: `${leftPct}%` }}
            className="h-full mizo-gold-gradient transition-all duration-300"
          />
        </div>

        {/* Live Gift Contributions */}
        {contributions.length > 0 && (
          <div className="text-[11px] text-slate-200 truncate text-center">
            {contributions[0].text}
          </div>
        )}

        {/* Winner Banner */}
        {winner && (
          <div className="mt-1 rounded-xl mizo-gold-gradient text-[#1E0B3B] px-3 py-1.5 text-xs font-extrabold flex items-center justify-center gap-1.5">
            <Trophy className="w-4 h-4" />
            <span>
              {winner === 'draw'
                ? 'PK Match Tied!'
                : winner === 'left'
                ? `Winner: ${leftName}!`
                : `Winner: ${rightHost.username}!`}
            </span>
          </div>
        )}
      </div>
    </div>
  );
};
