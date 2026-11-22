import React, { useState } from 'react';
import { AlertTriangle, Coins, Plus, ShoppingBag, X } from 'lucide-react';
import { GoldCoinIcon, StoreCard } from '../components/Cards';
import { AppHeader } from '../components/Header';
import { EntryShowcaseArt } from '../components/MizoLogo';
import { StoreCategory, StoreItem } from '../types/mizo';

interface StoreScreenProps {
  items: StoreItem[];
  coins: number;
  userAvatar: string;
  equippedFrameId: string | null;
  equippedEntryId: string | null;
  equippedAssetId: string | null;
  onOpenWallet: () => void;
  onPreviewItem: (item: StoreItem) => void;
  onPurchaseOrEquip: (item: StoreItem) => Promise<{ ok: boolean; insufficient?: boolean }>;
}

const STORE_CATEGORIES: StoreCategory[] = [
  'VIP Frames',
  'Special Entry',
  'Custom Gift',
  'Premium Assets',
];

export const StoreScreen: React.FC<StoreScreenProps> = ({
  items,
  coins,
  userAvatar,
  equippedFrameId,
  equippedEntryId,
  equippedAssetId,
  onOpenWallet,
  onPreviewItem,
  onPurchaseOrEquip,
}) => {
  const [selectedCategory, setSelectedCategory] = useState<StoreCategory>('VIP Frames');
  const [confirmItem, setConfirmItem] = useState<StoreItem | null>(null);
  const [insufficientItem, setInsufficientItem] = useState<StoreItem | null>(null);
  const [purchasing, setPurchasing] = useState(false);

  const featuredEntry =
    items.find((i) => i.id === 'entry-royal-crown') || items[0];

  const visibleItems = items.filter((item) => item.category === selectedCategory);

  const isItemEquipped = (item: StoreItem): boolean => {
    if (item.category === 'VIP Frames') return equippedFrameId === item.id;
    if (item.category === 'Special Entry') return equippedEntryId === item.id;
    if (item.category === 'Premium Assets') return equippedAssetId === item.id;
    return Boolean(item.equipped);
  };

  const handleBuyClick = async (item: StoreItem) => {
    if (item.owned) {
      await onPurchaseOrEquip(item);
      return;
    }
    if (coins < item.price) {
      setInsufficientItem(item);
      return;
    }
    setConfirmItem(item);
  };

  const handleConfirmPurchase = async () => {
    if (!confirmItem) return;
    setPurchasing(true);
    const result = await onPurchaseOrEquip(confirmItem);
    setPurchasing(false);
    setConfirmItem(null);
    if (!result.ok && result.insufficient) {
      setInsufficientItem(confirmItem);
    }
  };

  return (
    <div className="min-h-screen pb-24">
      <AppHeader
        title="Mizo Store"
        showBrand={false}
        rightSlot={
          <div className="flex items-center gap-1.5">
            <div className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-[#190D30] border border-amber-400/40">
              <GoldCoinIcon size={15} />
              <span className="text-xs font-mono-num font-bold text-amber-300">
                {coins.toLocaleString()}
              </span>
            </div>
            <button
              type="button"
              onClick={onOpenWallet}
              className="min-h-[34px] px-3 rounded-full mizo-gold-gradient text-[#1E0B3B] text-xs font-extrabold inline-flex items-center gap-1 shadow"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>Recharge</span>
            </button>
          </div>
        }
      />

      <main className="max-w-5xl mx-auto px-4 pt-4 space-y-5">
        {/* 4 Store Categories */}
        <div
          role="tablist"
          aria-label="Store categories"
          className="flex items-center gap-2 overflow-x-auto no-scrollbar py-1"
        >
          {STORE_CATEGORIES.map((category) => {
            const active = selectedCategory === category;
            return (
              <button
                key={category}
                type="button"
                role="tab"
                aria-selected={active}
                onClick={() => setSelectedCategory(category)}
                className={`min-h-[42px] px-4 rounded-full text-xs sm:text-sm font-bold transition-all whitespace-nowrap shrink-0 ${
                  active
                    ? 'mizo-gold-gradient text-[#1E0B3B] shadow-md'
                    : 'bg-[#150C28] text-slate-300 border border-purple-500/25 hover:text-white'
                }`}
              >
                {category}
              </button>
            );
          })}
        </div>

        {/* Featured Royal Entry Banner */}
        <section className="relative rounded-3xl overflow-hidden bg-gradient-to-r from-[#2D0F5E] via-[#4C1D95] to-[#1D0B3B] border border-amber-400/45 p-5 shadow-[0_10px_36px_rgba(147,51,234,0.32)]">
          <div className="flex items-center justify-between gap-4">
            <div className="space-y-2 max-w-[62%]">
              <div className="inline-flex items-center gap-1.5 text-[11px] font-bold text-amber-300">
                <ShoppingBag className="w-3.5 h-3.5" />
                <span>Featured Collection</span>
              </div>
              <h2 className="text-xl sm:text-2xl font-display font-extrabold text-white leading-tight">
                Royal Entry
              </h2>
              <p className="text-xs sm:text-sm text-purple-100/90">
                Make Your Moment Special
              </p>
              <button
                type="button"
                onClick={() => featuredEntry && onPreviewItem(featuredEntry)}
                className="mt-1 min-h-[40px] px-5 rounded-full mizo-gold-gradient text-[#1E0B3B] text-xs font-bold shadow-lg active:scale-95 transition-transform"
              >
                Preview Now
              </button>
            </div>

            <div className="shrink-0">
              <EntryShowcaseArt styleType="royal-crown" size={104} animate />
            </div>
          </div>
        </section>

        {/* Category Products Grid */}
        <section aria-label={selectedCategory} className="space-y-3">
          <div className="flex items-center justify-between">
            <h3 className="text-base sm:text-lg font-display font-bold text-white">
              {selectedCategory}
            </h3>
            <span className="text-xs text-slate-400">
              Server-validated Coin Store
            </span>
          </div>

          <div className="grid grid-cols-2 md:grid-cols-4 gap-3.5">
            {visibleItems.map((item) => (
              <StoreCard
                key={item.id}
                item={item}
                userAvatar={userAvatar}
                isEquipped={isItemEquipped(item)}
                onPreview={onPreviewItem}
                onBuy={handleBuyClick}
              />
            ))}
          </div>
        </section>
      </main>

      {/* Purchase Confirmation Modal */}
      {confirmItem && (
        <div
          className="fixed inset-0 z-50 bg-black/80 backdrop-blur-md flex items-center justify-center p-4"
          role="dialog"
          aria-modal="true"
          aria-label="Confirm Store Purchase"
        >
          <div className="w-full max-w-xs rounded-3xl mizo-royal-card p-5 text-center space-y-4 border border-amber-400/50">
            <div className="flex items-center justify-between">
              <h3 className="text-base font-display font-bold text-white">
                Confirm Purchase
              </h3>
              <button
                type="button"
                onClick={() => setConfirmItem(null)}
                className="w-8 h-8 rounded-xl bg-white/5 flex items-center justify-center text-slate-300"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <p className="text-sm font-bold text-amber-300">{confirmItem.name}</p>
            <p className="text-xs text-slate-300">{confirmItem.subtitle}</p>

            <div className="rounded-xl bg-[#140A28] border border-purple-500/25 p-3 text-xs space-y-1">
              <div className="flex justify-between">
                <span className="text-slate-400">Item Price:</span>
                <span className="font-mono-num font-bold text-amber-300 inline-flex items-center gap-1">
                  <GoldCoinIcon size={12} /> {confirmItem.price.toLocaleString()}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-400">Remaining Balance:</span>
                <span className="font-mono-num font-bold text-white">
                  {(coins - confirmItem.price).toLocaleString()} Coins
                </span>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-2.5">
              <button
                type="button"
                onClick={() => setConfirmItem(null)}
                className="min-h-[42px] rounded-xl bg-white/10 text-xs font-bold text-white"
              >
                Cancel
              </button>
              <button
                type="button"
                disabled={purchasing}
                onClick={handleConfirmPurchase}
                className="min-h-[42px] rounded-xl mizo-gold-gradient text-[#1E0B3B] text-xs font-extrabold disabled:opacity-60"
              >
                {purchasing ? 'Buying...' : 'Buy & Equip'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Insufficient Balance Warning Modal */}
      {insufficientItem && (
        <div
          className="fixed inset-0 z-50 bg-black/80 backdrop-blur-md flex items-center justify-center p-4"
          role="alertdialog"
          aria-modal="true"
          aria-label="Insufficient Coin Balance"
        >
          <div className="w-full max-w-xs rounded-3xl mizo-royal-card p-5 text-center space-y-4 border border-rose-400/50">
            <AlertTriangle className="w-10 h-10 text-amber-400 mx-auto" />
            <h3 className="text-base font-display font-bold text-white">
              Insufficient Coin Balance
            </h3>
            <p className="text-xs text-slate-300">
              {insufficientItem.name} costs{' '}
              <span className="text-amber-300 font-bold">
                {insufficientItem.price.toLocaleString()} Coins
              </span>
              , but your balance is {coins.toLocaleString()} Coins.
            </p>
            <div className="grid grid-cols-2 gap-2.5">
              <button
                type="button"
                onClick={() => setInsufficientItem(null)}
                className="min-h-[42px] rounded-xl bg-white/10 text-xs font-bold text-white"
              >
                Close
              </button>
              <button
                type="button"
                onClick={() => {
                  setInsufficientItem(null);
                  onOpenWallet();
                }}
                className="min-h-[42px] rounded-xl mizo-gold-gradient text-[#1E0B3B] text-xs font-extrabold inline-flex items-center justify-center gap-1"
              >
                <Coins className="w-3.5 h-3.5" />
                <span>Recharge</span>
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
