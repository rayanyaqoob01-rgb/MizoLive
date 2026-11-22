import React, { useState } from 'react';
import {
  ArrowDownLeft,
  ArrowUpRight,
  Coins,
  CreditCard,
  History,
  PhoneCall,
} from 'lucide-react';
import { GoldCoinIcon } from '../components/Cards';
import { AppHeader } from '../components/Header';
import { EconomyConfig, ServerWalletAccount } from '../types/mizo';

interface WalletScreenProps {
  wallet: ServerWalletAccount;
  economy: EconomyConfig;
  onBack: () => void;
  onRechargePackage: (packageId: string) => Promise<void>;
}

export const WalletScreen: React.FC<WalletScreenProps> = ({
  wallet,
  economy,
  onBack,
  onRechargePackage,
}) => {
  const [filter, setFilter] = useState<'all' | 'in' | 'out' | 'calls'>('all');
  const [loadingPkg, setLoadingPkg] = useState<string | null>(null);

  const filteredTx = wallet.transactions.filter((tx) => {
    if (filter === 'all') return true;
    if (filter === 'in') return tx.direction === 'in';
    if (filter === 'out') return tx.direction === 'out';
    return tx.type === 'call_charge' || tx.type === 'call_earning';
  });

  const handleBuyPkg = async (pkgId: string) => {
    setLoadingPkg(pkgId);
    await onRechargePackage(pkgId);
    setLoadingPkg(null);
  };

  return (
    <div className="min-h-screen pb-12">
      <AppHeader title="Wallet & Coins" onBack={onBack} />

      <main className="max-w-4xl mx-auto px-4 pt-4 space-y-5">
        {/* Balance Summary Card */}
        <section className="rounded-3xl bg-gradient-to-br from-[#2C105D] via-[#1B093C] to-[#0E051F] border border-amber-400/50 p-5 shadow-[0_10px_40px_rgba(147,51,234,0.3)] space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs font-semibold text-purple-200/80">
                Current Coin Balance
              </p>
              <div className="mt-1 flex items-center gap-2.5">
                <GoldCoinIcon size={28} />
                <span className="text-3xl font-display font-extrabold text-amber-300 font-mono-num">
                  {wallet.coins.toLocaleString()}
                </span>
              </div>
            </div>
            <Coins className="w-10 h-10 text-amber-400/50" />
          </div>

          <div className="grid grid-cols-3 gap-2.5 pt-3 border-t border-purple-400/20 text-center">
            <div className="rounded-2xl bg-black/30 p-2.5">
              <p className="text-[11px] text-slate-400">Coins Received</p>
              <p className="text-sm font-mono-num font-bold text-emerald-300 mt-0.5">
                +{wallet.receivedCoins.toLocaleString()}
              </p>
            </div>
            <div className="rounded-2xl bg-black/30 p-2.5">
              <p className="text-[11px] text-slate-400">Coins Spent</p>
              <p className="text-sm font-mono-num font-bold text-rose-300 mt-0.5">
                -{wallet.spentCoins.toLocaleString()}
              </p>
            </div>
            <div className="rounded-2xl bg-black/30 p-2.5">
              <p className="text-[11px] text-slate-400">Call Earnings</p>
              <p className="text-sm font-mono-num font-bold text-amber-300 mt-0.5">
                +{wallet.callEarnings.toLocaleString()}
              </p>
            </div>
          </div>
        </section>

        {/* Configurable Coin Packages */}
        <section className="space-y-3">
          <div className="flex items-center justify-between">
            <h2 className="text-base font-display font-bold text-white inline-flex items-center gap-2">
              <CreditCard className="w-4 h-4 text-amber-400" />
              <span>Recharge Coin Packages</span>
            </h2>
            <span className="text-[11px] text-slate-400">
              Sandbox Mode · Requires Payment Gateway
            </span>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            {economy.coinPackages.map((pkg) => (
              <div
                key={pkg.id}
                className="mizo-royal-card rounded-2xl p-3.5 flex flex-col justify-between gap-3 text-center hover:border-amber-400/60 transition-colors"
              >
                <div>
                  <p className="text-[11px] font-semibold text-purple-300">{pkg.label}</p>
                  <div className="mt-1.5 flex items-center justify-center gap-1.5 text-lg font-mono-num font-extrabold text-amber-300">
                    <GoldCoinIcon size={18} />
                    <span>{pkg.coins.toLocaleString()}</span>
                  </div>
                  <p className="text-[11px] text-emerald-300 font-semibold mt-0.5">
                    +{pkg.bonus} Bonus Coins
                  </p>
                </div>

                <button
                  type="button"
                  disabled={loadingPkg === pkg.id}
                  onClick={() => handleBuyPkg(pkg.id)}
                  className="min-h-[40px] w-full rounded-xl mizo-gold-gradient text-[#1E0B3B] text-xs font-extrabold shadow active:scale-95 transition-transform disabled:opacity-60"
                >
                  {loadingPkg === pkg.id ? 'Adding...' : `${pkg.priceUsd} (Sandbox)`}
                </button>
              </div>
            ))}
          </div>

          <div className="rounded-2xl bg-[#120A22] border border-purple-500/25 px-4 py-3 text-xs text-slate-300 flex items-center justify-between gap-3 flex-wrap">
            <span className="inline-flex items-center gap-1.5">
              <PhoneCall className="w-4 h-4 text-amber-400" />
              Server Call Rates: Audio {economy.audioCallCoinsPerMin} Coins/min · Video{' '}
              {economy.videoCallCoinsPerMin} Coins/min
            </span>
            <span className="text-purple-300">
              Platform Commission: {economy.platformCommissionPct}%
            </span>
          </div>
        </section>

        {/* Transaction History */}
        <section className="space-y-3">
          <div className="flex items-center justify-between flex-wrap gap-2">
            <h2 className="text-base font-display font-bold text-white inline-flex items-center gap-2">
              <History className="w-4 h-4 text-amber-400" />
              <span>Transaction History</span>
            </h2>

            <div className="flex items-center gap-1.5">
              {(['all', 'in', 'out', 'calls'] as const).map((tab) => (
                <button
                  key={tab}
                  type="button"
                  onClick={() => setFilter(tab)}
                  className={`px-3 py-1 rounded-full text-xs font-bold capitalize ${
                    filter === tab
                      ? 'mizo-gold-gradient text-[#1E0B3B]'
                      : 'bg-[#150C28] text-slate-300 border border-purple-500/25'
                  }`}
                >
                  {tab === 'in'
                    ? 'Received'
                    : tab === 'out'
                    ? 'Spent'
                    : tab === 'calls'
                    ? 'Calls'
                    : 'All'}
                </button>
              ))}
            </div>
          </div>

          <div className="mizo-royal-card rounded-2xl divide-y divide-purple-500/15 overflow-hidden">
            {filteredTx.length === 0 ? (
              <p className="text-xs text-slate-400 text-center py-8">
                No transactions in this category yet.
              </p>
            ) : (
              filteredTx.map((tx) => (
                <div
                  key={tx.id}
                  className="px-4 py-3 flex items-center justify-between gap-3"
                >
                  <div className="flex items-center gap-3 min-w-0">
                    <div
                      className={`w-9 h-9 rounded-xl flex items-center justify-center shrink-0 ${
                        tx.direction === 'in'
                          ? 'bg-emerald-500/15 text-emerald-300'
                          : 'bg-rose-500/15 text-rose-300'
                      }`}
                    >
                      {tx.direction === 'in' ? (
                        <ArrowDownLeft className="w-4 h-4" />
                      ) : (
                        <ArrowUpRight className="w-4 h-4" />
                      )}
                    </div>
                    <div className="min-w-0">
                      <p className="text-xs sm:text-sm font-semibold text-white truncate">
                        {tx.title}
                      </p>
                      <p className="text-[11px] text-slate-400 truncate">
                        {tx.timestamp}
                        {tx.meta ? ` · ${tx.meta}` : ''}
                      </p>
                    </div>
                  </div>

                  <span
                    className={`text-xs sm:text-sm font-mono-num font-bold shrink-0 ${
                      tx.direction === 'in' ? 'text-emerald-300' : 'text-rose-300'
                    }`}
                  >
                    {tx.direction === 'in' ? '+' : '-'}
                    {tx.amount.toLocaleString()}
                  </span>
                </div>
              ))
            )}
          </div>
        </section>
      </main>
    </div>
  );
};
