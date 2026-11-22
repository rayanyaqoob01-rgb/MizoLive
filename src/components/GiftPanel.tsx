import React, { useState } from 'react';
import { Gift, History, Sparkles, X } from 'lucide-react';
import { SAMPLE_GIFTS } from '../data/mizoData';
import { GiftCategory, GiftHistoryRecord, GiftItem } from '../types/mizo';
import { GoldCoinIcon } from './Cards';

const GIFT_CATEGORIES: GiftCategory[] = [
  'Popular Gifts',
  'Love Gifts',
  'Premium Gifts',
  'VIP Gifts',
  'Special Gifts',
];

export const GiftArtIcon: React.FC<{
  iconKey: GiftItem['iconKey'];
  size?: number;
}> = ({ iconKey, size = 40 }) => {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 64 64"
      fill="none"
      className="drop-shadow-[0_0_10px_rgba(250,204,21,0.35)] shrink-0"
      aria-hidden="true"
    >
      <defs>
        <linearGradient id="giftGold" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor="#FEF08A" />
          <stop offset="50%" stopColor="#FACC15" />
          <stop offset="100%" stopColor="#B45309" />
        </linearGradient>
        <linearGradient id="giftPurp" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor="#E879F9" />
          <stop offset="100%" stopColor="#7C3AED" />
        </linearGradient>
      </defs>

      {iconKey === 'rose' && (
        <>
          <path d="M32 34 L32 56" stroke="#22C55E" strokeWidth="3.5" strokeLinecap="round" />
          <path d="M32 45 C40 42, 43 38, 42 35 C37 36, 34 39, 32 45 Z" fill="#4ADE80" />
          <path d="M20 22 C20 12, 44 12, 44 22 C44 31, 37 36, 32 36 C27 36, 20 31, 20 22 Z" fill="#F43F5E" stroke="#FDA4AF" strokeWidth="1.5" />
          <path d="M26 20 C26 15, 38 15, 38 20 C38 25, 32 28, 32 28 C32 28, 26 25, 26 20 Z" fill="#FB7185" />
        </>
      )}

      {iconKey === 'star' && (
        <polygon
          points="32,8 39,23 55,25 43,36 46,53 32,45 18,53 21,36 9,25 25,23"
          fill="url(#giftPurp)"
          stroke="#FEF08A"
          strokeWidth="2"
          strokeLinejoin="round"
        />
      )}

      {iconKey === 'crown' && (
        <>
          <path
            d="M12 44 L9 20 L23 31 L32 14 L41 31 L55 20 L52 44 Z"
            fill="url(#giftGold)"
            stroke="#FEF9C3"
            strokeWidth="2"
            strokeLinejoin="round"
          />
          <rect x="12" y="45" width="40" height="6" rx="3" fill="url(#giftPurp)" />
        </>
      )}

      {iconKey === 'wings' && (
        <>
          <path d="M30 42 C14 38, 6 24, 8 12 C18 20, 24 26, 30 34 Z" fill="url(#giftGold)" />
          <path d="M34 42 C50 38, 58 24, 56 12 C46 20, 40 26, 34 34 Z" fill="url(#giftGold)" />
          <circle cx="32" cy="34" r="9" fill="url(#giftPurp)" stroke="#FEF08A" strokeWidth="2" />
        </>
      )}

      {iconKey === 'castle' && (
        <>
          <rect x="14" y="28" width="36" height="24" rx="2" fill="url(#giftPurp)" stroke="#FEF08A" strokeWidth="1.8" />
          <polygon points="12,28 20,14 28,28" fill="url(#giftGold)" />
          <polygon points="24,26 32,8 40,26" fill="url(#giftGold)" />
          <polygon points="36,28 44,14 52,28" fill="url(#giftGold)" />
          <rect x="27" y="38" width="10" height="14" rx="5" fill="#FEF08A" />
        </>
      )}

      {iconKey === 'dragon' && (
        <>
          <circle cx="32" cy="32" r="22" fill="url(#giftPurp)" fillOpacity="0.35" stroke="url(#giftGold)" strokeWidth="2.5" />
          <path d="M22 42 C18 30, 24 18, 36 16 C44 16, 48 22, 46 28 C42 26, 36 26, 34 30 C39 32, 43 38, 39 45 C33 48, 25 46, 22 42 Z" fill="url(#giftGold)" />
          <circle cx="37" cy="21" r="2" fill="#E879F9" />
        </>
      )}
    </svg>
  );
};

interface GiftPanelProps {
  open: boolean;
  coins: number;
  recipientName: string;
  recipientOptions?: string[];
  onSelectRecipient?: (name: string) => void;
  giftHistory: GiftHistoryRecord[];
  onClose: () => void;
  onSendGift: (gift: GiftItem, recipient: string) => Promise<boolean>;
}

export const GiftPanel: React.FC<GiftPanelProps> = ({
  open,
  coins,
  recipientName,
  recipientOptions,
  onSelectRecipient,
  giftHistory,
  onClose,
  onSendGift,
}) => {
  const [category, setCategory] = useState<GiftCategory>('Popular Gifts');
  const [selectedGift, setSelectedGift] = useState<GiftItem>(SAMPLE_GIFTS[0]);
  const [previewing, setPreviewing] = useState(false);
  const [showHistory, setShowHistory] = useState(false);
  const [sending, setSending] = useState(false);

  if (!open) return null;

  const filtered = SAMPLE_GIFTS.filter((g) => g.category === category);

  const handleSend = async () => {
    setSending(true);
    await onSendGift(selectedGift, recipientName);
    setSending(false);
  };

  return (
    <div
      className="fixed inset-x-0 bottom-0 z-50 flex justify-center pointer-events-none"
      role="dialog"
      aria-modal="false"
      aria-label="Gift Panel"
    >
      <div className="pointer-events-auto w-full max-w-lg rounded-t-3xl bg-[#0D061B]/95 backdrop-blur-2xl border-t border-x border-purple-500/40 shadow-[0_-16px_48px_rgba(0,0,0,0.8)] p-4 pb-safe space-y-3">
        <div className="flex items-center justify-between gap-2">
          <div className="flex items-center gap-2">
            <Gift className="w-4 h-4 text-amber-400" />
            <span className="text-sm font-display font-bold text-white">
              Send Gift {recipientName ? `to ${recipientName}` : ''}
            </span>
          </div>

          <div className="flex items-center gap-2">
            <div className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-[#190D30] border border-amber-400/35">
              <GoldCoinIcon size={14} />
              <span className="text-xs font-mono-num font-bold text-amber-300">
                {coins.toLocaleString()}
              </span>
            </div>

            <button
              type="button"
              onClick={() => setShowHistory((h) => !h)}
              aria-label="Toggle gift history"
              className={`min-w-[36px] min-h-[36px] rounded-xl flex items-center justify-center border transition-colors ${
                showHistory
                  ? 'bg-purple-600 border-amber-400 text-white'
                  : 'bg-white/5 border-white/10 text-slate-300 hover:text-white'
              }`}
            >
              <History className="w-4 h-4" />
            </button>

            <button
              type="button"
              onClick={onClose}
              aria-label="Close gift panel"
              className="min-w-[36px] min-h-[36px] rounded-xl bg-white/5 flex items-center justify-center text-slate-300 hover:text-white"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>

        {recipientOptions && recipientOptions.length > 1 && onSelectRecipient && (
          <div className="flex items-center gap-1.5 overflow-x-auto no-scrollbar">
            <span className="text-[11px] text-slate-400 shrink-0 mr-1">To:</span>
            {recipientOptions.map((name) => (
              <button
                key={name}
                type="button"
                onClick={() => onSelectRecipient(name)}
                className={`px-3 py-1 rounded-full text-[11px] font-semibold whitespace-nowrap shrink-0 transition-colors ${
                  recipientName === name
                    ? 'mizo-purple-gradient text-white border border-amber-400/50'
                    : 'bg-white/5 text-slate-300 border border-white/10'
                }`}
              >
                {name}
              </button>
            ))}
          </div>
        )}

        {showHistory ? (
          <div className="max-h-56 overflow-y-auto space-y-2 py-1">
            <p className="text-xs font-semibold text-amber-300">Recent Gifts</p>
            {giftHistory.length === 0 ? (
              <p className="text-xs text-slate-400 py-6 text-center">
                No gifts sent in this session yet.
              </p>
            ) : (
              giftHistory.map((rec) => (
                <div
                  key={rec.id}
                  className="flex items-center justify-between gap-2 px-3 py-2 rounded-xl bg-[#160B2C] border border-purple-500/20 text-xs"
                >
                  <div className="flex items-center gap-2 min-w-0">
                    <GiftArtIcon iconKey={rec.iconKey} size={24} />
                    <div className="min-w-0">
                      <p className="text-white font-semibold truncate">
                        {rec.senderName} &rarr; {rec.recipientName}
                      </p>
                      <p className="text-[11px] text-slate-400">
                        {rec.giftName} · {rec.timestamp}
                      </p>
                    </div>
                  </div>
                  <span className="inline-flex items-center gap-1 font-mono-num font-bold text-amber-300 shrink-0">
                    <GoldCoinIcon size={12} />
                    {rec.giftPrice}
                  </span>
                </div>
              ))
            )}
          </div>
        ) : (
          <>
            <div className="flex items-center gap-2 overflow-x-auto no-scrollbar">
              {GIFT_CATEGORIES.map((cat) => (
                <button
                  key={cat}
                  type="button"
                  onClick={() => {
                    setCategory(cat);
                    const first = SAMPLE_GIFTS.find((g) => g.category === cat);
                    if (first) setSelectedGift(first);
                  }}
                  className={`px-3.5 py-1.5 rounded-full text-xs font-bold transition-colors whitespace-nowrap shrink-0 ${
                    category === cat
                      ? 'mizo-gold-gradient text-[#1E0B3B]'
                      : 'bg-white/5 text-slate-300 hover:text-white'
                  }`}
                >
                  {cat}
                </button>
              ))}
            </div>

            <div className="grid grid-cols-3 gap-2.5">
              {filtered.map((gift) => {
                const selected = selectedGift.id === gift.id;
                return (
                  <button
                    key={gift.id}
                    type="button"
                    onClick={() => {
                      setSelectedGift(gift);
                      setPreviewing(false);
                    }}
                    className={`p-2.5 rounded-2xl flex flex-col items-center gap-1 border transition-all ${
                      selected
                        ? 'bg-[#231048] border-amber-400 shadow-[0_0_16px_rgba(250,204,21,0.25)]'
                        : 'bg-[#140A28] border-purple-500/20 hover:border-purple-400/50'
                    }`}
                  >
                    <GiftArtIcon iconKey={gift.iconKey} size={42} />
                    <span className="text-xs font-semibold text-white truncate max-w-full">
                      {gift.name}
                    </span>
                    <span className="inline-flex items-center gap-1 text-[11px] font-mono-num font-bold text-amber-300">
                      <GoldCoinIcon size={12} />
                      {gift.price}
                    </span>
                  </button>
                );
              })}
            </div>

            {previewing && (
              <div className="rounded-xl bg-gradient-to-r from-purple-900/70 via-fuchsia-900/60 to-amber-900/40 border border-amber-400/40 px-3 py-2 flex items-center justify-center gap-2.5 animate-mizo-float">
                <GiftArtIcon iconKey={selectedGift.iconKey} size={28} />
                <span className="text-xs font-bold text-amber-200">
                  Preview: {selectedGift.name} (+{selectedGift.pkPoints} PK pts)
                </span>
              </div>
            )}

            <div className="flex items-center justify-between gap-2 pt-1">
              <button
                type="button"
                onClick={() => setPreviewing((p) => !p)}
                className="min-h-[42px] px-4 rounded-xl bg-white/5 hover:bg-white/10 border border-purple-400/35 text-xs font-semibold text-purple-100 inline-flex items-center gap-1.5"
              >
                <Sparkles className="w-3.5 h-3.5 text-amber-300" />
                <span>Preview</span>
              </button>

              <button
                type="button"
                disabled={sending}
                onClick={handleSend}
                className="flex-1 min-h-[42px] rounded-xl mizo-gold-gradient text-[#1E0B3B] text-xs font-extrabold shadow-lg active:scale-[0.98] transition-transform disabled:opacity-60"
              >
                {sending
                  ? 'Sending...'
                  : `Send ${selectedGift.name} (${selectedGift.price} Coins)`}
              </button>
            </div>
          </>
        )}
      </div>
    </div>
  );
};
