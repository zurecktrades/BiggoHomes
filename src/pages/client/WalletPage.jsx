import React, { useState, useEffect } from 'react';
import { supabase } from '../../lib/supabaseClient';
import { useAuthStore } from '../../store/useAuthStore';
import { 
  ArrowDownRight, ArrowUpRight, MessageSquare, 
  Bitcoin, Loader2, Copy, Check, AlertCircle 
} from 'lucide-react';
import { toast } from 'react-toastify';

export default function WalletPage() {
  const { user, profile } = useAuthStore();
  
  // Wallet Addresses & Dynamic State
  const [walletData, setWalletData] = useState({});
  const [selectedCoin, setSelectedCoin] = useState('USDT_TRC20');
  const [loadingWallets, setLoadingWallets] = useState(true);
  
  // Deposit Form State
  const [cryptoAmount, setCryptoAmount] = useState('');
  const [depositing, setDepositing] = useState(false);
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    fetchWalletAddresses();
  }, []);

  // Fetch admin-configured wallet addresses dynamically from database
  const fetchWalletAddresses = async () => {
    setLoadingWallets(true);
    const { data, error } = await supabase
      .from('wallet_addresses')
      .select('*');

    if (!error && data) {
      const formattedWallets = {};
      data.forEach((item) => {
        formattedWallets[item.coin_key] = item;
      });
      setWalletData(formattedWallets);
    } else {
      console.error('Failed to load wallet addresses:', error);
    }
    setLoadingWallets(false);
  };

  const currentCoinInfo = walletData[selectedCoin] || {
    coin_name: selectedCoin,
    network: 'Blockchain Network',
    address: 'Loading address...',
  };

  const handleCopyAddress = () => {
    if (!currentCoinInfo.address || currentCoinInfo.address.startsWith('Loading')) return;
    navigator.clipboard.writeText(currentCoinInfo.address);
    setCopied(true);
    toast.success("Wallet address copied to clipboard!");
    setTimeout(() => setCopied(false), 3000);
  };

  // Submit crypto deposit request with unique reference ID generation
  const handleCryptoDepositSubmit = async (e) => {
    e.preventDefault();
    const amount = parseFloat(cryptoAmount);

    if (!amount || isNaN(amount)) {
      toast.error("Please enter a valid deposit amount.");
      return;
    }

    if (amount < 500) {
      toast.error("Minimum deposit amount is $500.00.");
      return;
    }

    setDepositing(true);
    try {
      // 1. Generate unique transaction reference ID
      const randomSuffix = Math.random().toString(36).substring(2, 7).toUpperCase();
      const uniqueReference = `BIG-${selectedCoin}-${Date.now()}-${randomSuffix}`;

      // 2. Insert pending deposit record into transactions table
      const { error: txErr } = await supabase
        .from('transactions')
        .insert({
          user_id: user.id,
          type: 'deposit',
          amount: amount,
          payment_method: selectedCoin,
          description: `Crypto Deposit via ${currentCoinInfo.coin_name || selectedCoin}`,
          status: 'pending',
          reference_id: uniqueReference
        });

      if (txErr) throw txErr;

      toast.success(`Deposit request of $${amount.toLocaleString()} submitted! Ref: ${uniqueReference}`);
      setCryptoAmount('');
    } catch (err) {
      console.error(err);
      toast.error("Failed to submit deposit request.");
    } finally {
      setDepositing(false);
    }
  };

  return (
    <div className="space-y-8 font-sans pb-12 max-w-8xl p-4 mx-auto">
      
      {/* Header */}
      <div>
        <h2 className="text-2xl font-bold tracking-tight">Wallet Hub</h2>
        <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
          Manage your liquid capital and fund your balance securely.
        </p>
      </div>

      {/* Balance Summary Cards ($0.00 Default Clean State) */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
        <div className="p-6 rounded-xl bg-gradient-to-br from-[#0B1F4B] to-[#102a63] text-white border border-amber-500/20 shadow-xl relative overflow-hidden">
          <div className="absolute right-0 bottom-0 w-32 h-32 bg-amber-500/10 rounded-full blur-2xl pointer-events-none" />
          <p className="text-[11px] font-bold uppercase tracking-wider text-slate-300">Available Wallet Cash</p>
          <h3 className="text-3xl font-sans font-bold text-amber-400 mt-2">
            ${(profile?.account_balance || 0).toLocaleString(undefined, { minimumFractionDigits: 2 })}
          </h3>
        </div>

        <div className="p-6 rounded-xl bg-white dark:bg-[#0B1F4B] border border-slate-200 dark:border-slate-800 shadow-sm flex flex-col justify-between">
          <div>
            <p className="text-[10px] font-bold uppercase tracking-wider text-slate-400">Total Deposited</p>
            <h3 className="text-2xl font-bold text-slate-900 dark:text-white mt-1">
              ${(profile?.total_deposited || 0).toLocaleString(undefined, { minimumFractionDigits: 2 })}
            </h3>
          </div>
          <p className="text-xs text-emerald-500 font-semibold flex items-center gap-1 mt-4">
            <ArrowDownRight className="w-4 h-4" /> Lifetime platform deposits
          </p>
        </div>

        <div className="p-6 rounded-xl bg-white dark:bg-[#0B1F4B] border border-slate-200 dark:border-slate-800 shadow-sm flex flex-col justify-between">
          <div>
            <p className="text-[10px] font-bold uppercase tracking-wider text-slate-400">Total Withdrawn</p>
            <h3 className="text-2xl font-bold text-slate-900 dark:text-white mt-1">
              ${(profile?.total_withdrawn || 0).toLocaleString(undefined, { minimumFractionDigits: 2 })}
            </h3>
          </div>
          <p className="text-xs text-blue-500 font-semibold flex items-center gap-1 mt-4">
            <ArrowUpRight className="w-4 h-4" /> Lifetime distributed payouts
          </p>
        </div>
      </div>

      {/* On-Page Funding Options */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        
        {/* Dynamic Crypto Deposit Desk */}
        <div className="p-6 rounded-xl bg-white dark:bg-[#0B1F4B] border border-slate-200 dark:border-slate-800 shadow-sm space-y-4">
          <div className="flex items-center space-x-3">
            <div className="p-2.5 rounded-xl bg-amber-500/10 text-amber-500">
              <Bitcoin className="w-6 h-6" />
            </div>
            <div>
              <h3 className="text-sm font-bold">Crypto Deposit Desk</h3>
              <p className="text-xs text-slate-400">Fund account via USDT (TRC20), BTC, or ETH</p>
            </div>
          </div>

          {/* Coin Selector Tabs */}
          <div className="grid grid-cols-3 gap-2">
            {['USDT_TRC20', 'BTC', 'ETH'].map((key) => {
              const item = walletData[key];
              return (
                <button
                  key={key}
                  type="button"
                  onClick={() => setSelectedCoin(key)}
                  className={`p-2.5 rounded-xl border text-xs font-bold transition flex flex-col items-center justify-center space-y-0.5 ${
                    selectedCoin === key
                      ? 'bg-amber-500 text-[#0B1F4B] border-amber-500 shadow-sm'
                      : 'bg-slate-50 dark:bg-[#071326] text-slate-700 dark:text-slate-300 border-slate-200 dark:border-slate-800 hover:border-amber-500/50'
                  }`}
                >
                  <span>{key === 'USDT_TRC20' ? 'USDT' : key}</span>
                  <span className="text-[9px] opacity-80 font-normal">
                    {item ? item.network : 'Network'}
                  </span>
                </button>
              );
            })}
          </div>

          {/* Wallet Address Box with Copy */}
          <div className="space-y-1.5">
            <div className="flex items-center justify-between text-[11px]">
              <span className="font-bold text-slate-400 uppercase tracking-wider">Send to Address:</span>
              <span className="text-amber-500 font-semibold">Min: $500.00</span>
            </div>
            <div className="p-3 rounded-2xl bg-slate-50 dark:bg-[#071326] border border-slate-200 dark:border-slate-700 flex items-center justify-between">
              {loadingWallets ? (
                <Loader2 className="w-4 h-4 animate-spin text-amber-500" />
              ) : (
                <span className="text-xs font-mono text-slate-700 dark:text-slate-300 truncate select-all mr-2">
                  {currentCoinInfo.address}
                </span>
              )}
              <button
                type="button"
                onClick={handleCopyAddress}
                disabled={loadingWallets}
                className="px-3 py-1.5 rounded-xl bg-amber-500/10 hover:bg-amber-500/20 text-amber-500 transition flex items-center space-x-1 text-xs font-bold flex-shrink-0 disabled:opacity-50"
              >
                {copied ? <Check className="w-3.5 h-3.5 text-emerald-500" /> : <Copy className="w-3.5 h-3.5" />}
                <span>{copied ? 'Copied' : 'Copy'}</span>
              </button>
            </div>
            <p className="text-[10px] text-amber-400/90 flex items-center gap-1 pt-0.5">
              <AlertCircle className="w-3 h-3 flex-shrink-0" />
              <span>Ensure network matches ({currentCoinInfo.network}).</span>
            </p>
          </div>

          {/* Form */}
          <form onSubmit={handleCryptoDepositSubmit} className="space-y-3 pt-1">
            <div>
              <label className="block text-[10px] font-bold uppercase text-slate-400 mb-1">Deposit Amount ($ USD Equivalent)</label>
              <div className="relative">
                <span className="absolute left-3.5 top-3 text-xs font-bold text-slate-400">$</span>
                <input
                  type="number"
                  min="500"
                  step="any"
                  value={cryptoAmount}
                  onChange={(e) => setCryptoAmount(e.target.value)}
                  placeholder="500.00"
                  className="w-full pl-8 pr-4 py-2.5 text-xs rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-[#071326] focus:outline-none focus:border-amber-500 font-bold"
                  required
                />
              </div>
              <p className="text-[10px] text-slate-400 mt-1">Minimum deposit requirement is $500.00.</p>
            </div>
            <button
              type="submit"
              disabled={depositing || loadingWallets}
              className="w-full py-3 rounded-xl bg-amber-500 text-[#0B1F4B] font-sans font-bold text-xs shadow-md hover:bg-amber-400 transition flex items-center justify-center space-x-2 disabled:opacity-50"
            >
              {depositing ? <Loader2 className="w-4 h-4 animate-spin" /> : <span>Confirm Deposit</span>}
            </button>
          </form>
        </div>

        {/* Manual Bank Wire / Account Manager Box */}
        <div className="p-6 rounded-xl bg-white dark:bg-[#0B1F4B] border border-slate-200 dark:border-slate-800 shadow-sm flex flex-col justify-between space-y-4">
          <div className="flex items-center space-x-3">
            <div className="p-2.5 rounded-xl bg-blue-500/10 text-blue-500">
              <MessageSquare className="w-6 h-6" />
            </div>
            <div>
              <h3 className="text-sm font-bold">Manual Bank Wire / Account Manager</h3>
              <p className="text-xs text-slate-400">Direct fiat wire transfers or concierge OTC desk</p>
            </div>
          </div>

          <p className="text-xs text-slate-500 dark:text-slate-300 leading-relaxed">
            Prefer a direct bank wire transfer or specialized settlement? Connect directly with your assigned private wealth account manager for custom escrow wire instructions and manual wallet crediting.
          </p>

          <a
            href="/chat-manager"
            className="w-full py-3.5 rounded-xl bg-slate-100 dark:bg-white/10 hover:bg-blue-500 hover:text-white text-xs font-bold transition flex items-center justify-center space-x-2"
          >
            <MessageSquare className="w-4 h-4" />
            <span>Contact Account Manager</span>
          </a>
        </div>

      </div>

    </div>
  );
}