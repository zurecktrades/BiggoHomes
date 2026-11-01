import React, { useState, useEffect } from 'react';
import { supabase } from '../../lib/supabaseClient';
import { useAuthStore } from '../../store/useAuthStore';
import { motion } from 'framer-motion';
import { 
  ArrowUpRight, Loader2, Bitcoin, Landmark, 
  Clock, AlertCircle, ShieldAlert, CheckCircle2 
} from 'lucide-react';
import { toast } from 'react-toastify';

export default function WithdrawalPage() {
  const { user, profile, fetchProfile } = useAuthStore();
  
  const [withdrawalMode, setWithdrawalMode] = useState('crypto');
  const [amount, setAmount] = useState('');
  
  // Crypto specific fields
  const [cryptoCoin, setCryptoCoin] = useState('USDT_TRC20');
  const [walletAddress, setWalletAddress] = useState('');

  // Bank transfer specific fields
  const [bankName, setBankName] = useState('');
  const [accountNumber, setAccountNumber] = useState('');
  const [accountName, setAccountName] = useState('');

  const [withdrawing, setWithdrawing] = useState(false);
  const [lastWithdrawalDate, setLastWithdrawalDate] = useState(null);
  const [cooldownRemainingDays, setCooldownRemainingDays] = useState(0);
  const [checkingCooldown, setCheckingCooldown] = useState(true);

  useEffect(() => {
    if (user?.id) {
      checkWithdrawalCooldown();
    }
  }, [user]);

  // Check if user has made a withdrawal in the last 14 days
  const checkWithdrawalCooldown = async () => {
    setCheckingCooldown(true);
    try {
      const { data, error } = await supabase
        .from('transactions')
        .select('created_at')
        .eq('user_id', user.id)
        .eq('type', 'withdrawal')
        .order('created_at', { ascending: false })
        .limit(1);

      if (error) throw error;

      if (data && data.length > 0) {
        const lastDate = new Date(data[0].created_at);
        setLastWithdrawalDate(lastDate);

        const now = new Date();
        const diffTime = Math.abs(now - lastDate);
        const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
        const cooldownDays = 14;

        if (diffDays < cooldownDays) {
          setCooldownRemainingDays(cooldownDays - diffDays);
        } else {
          setCooldownRemainingDays(0);
        }
      }
    } catch (err) {
      console.error('Error checking withdrawal:', err);
    } finally {
      setCheckingCooldown(false);
    }
  };

  const handleWithdrawalSubmit = async (e) => {
    e.preventDefault();

    if (!user || !user.id) {
      toast.error('Authentication session not loaded.');
      return;
    }

    const withdrawAmount = parseFloat(amount);
    const availableBalance = profile?.account_balance || 0;

    // Validation checks
    if (!withdrawAmount || isNaN(withdrawAmount)) {
      toast.error('Please enter a valid withdrawal amount.');
      return;
    }

    if (withdrawAmount < 1000) {
      toast.error('Minimum withdrawal amount is $1,000.00.');
      return;
    }

    if (withdrawAmount > availableBalance) {
      toast.error('Insufficient balance!');
      return;
    }

    if (cooldownRemainingDays > 0) {
      toast.error(`Withdrawal locked. You must wait ${cooldownRemainingDays} more day(s) before your next payout.`);
      return;
    }

    if (withdrawalMode === 'crypto' && !walletAddress.trim()) {
      toast.error('Please enter your receiving wallet address.');
      return;
    }

    if (withdrawalMode === 'bank' && (!bankName.trim() || !accountNumber.trim() || !accountName.trim())) {
      toast.error('Please fill in all bank transfer details.');
      return;
    }

    setWithdrawing(true);
    try {
      // 1. Generate unique transaction reference ID
      const randomSuffix = Math.random().toString(36).substring(2, 7).toUpperCase();
      const uniqueReferenceId = `WDR-${withdrawalMode.toUpperCase()}-${Date.now()}-${randomSuffix}`;

      // 2. Build payment method description & details
      const paymentMethodVal = withdrawalMode === 'crypto' ? cryptoCoin : 'Local Bank Transfer';
      const descriptionText = withdrawalMode === 'crypto'
        ? `Crypto Withdrawal via ${cryptoCoin} (${walletAddress.substring(0, 6)}...)`
        : `Bank Transfer to ${bankName} (${accountNumber})`;

      // 3. Insert withdrawal transaction with status 'pending'
      const { error: txError } = await supabase
        .from('transactions')
        .insert({
          user_id: user.id,
          type: 'withdrawal',
          amount: withdrawAmount,
          status: 'pending', // Requires admin approval
          description: descriptionText,
          payment_method: paymentMethodVal,
          reference: uniqueReferenceId,
          reference_id: uniqueReferenceId
        });

      if (txError) throw txError;

      toast.success(`Payout request of $${withdrawAmount.toLocaleString()} submitted successfully!`);
      
      // Reset form
      setAmount('');
      setWalletAddress('');
      setBankName('');
      setAccountNumber('');
      setAccountName('');
      
      // Refresh profile and cooldown status
      if (fetchProfile) fetchProfile();
      checkWithdrawalCooldown();
    } catch (err) {
      console.error(err);
      toast.error('Failed to submit withdrawal request.');
    } finally {
      setWithdrawing(false);
    }
  };

  return (
    <div className="space-y-6 font-sans pb-12 p-6">
      
      {/* Page Header */}
      <div>
        <h2 className="text-2xl font-bold tracking-tight text-slate-900 dark:text-white">Request Payout</h2>
      </div>

      {/* Balance & Cooldown Summary Card */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
        <div className="p-6 rounded-xl bg-gradient-to-br from-[#0B1F4B] to-[#102a63] text-white border border-amber-500/20 shadow-xl relative overflow-hidden">
          <p className="text-[11px] font-bold uppercase tracking-wider text-slate-300">Available Account Balance</p>
          <h3 className="text-3xl font-sans font-bold text-amber-400 mt-2">
            ${(profile?.account_balance || 0).toLocaleString(undefined, { minimumFractionDigits: 2 })}
          </h3>
          <p className="text-[10px] text-slate-300 mt-3 flex items-center gap-1">
            <ArrowUpRight className="w-3.5 h-3.5 text-amber-400" /> Minimum withdrawal limit: $1,000.00
          </p>
        </div>

        <div className="p-6 rounded-xl bg-white dark:bg-[#0B1F4B] border border-slate-200 dark:border-slate-800 shadow-sm flex flex-col justify-between">
          <div>
            <p className="text-[10px] font-bold uppercase tracking-wider text-slate-400">Payout Notice</p>
            {checkingCooldown ? (
              <div className="flex items-center space-x-2 mt-2">
                <Loader2 className="w-4 h-4 animate-spin text-amber-500" />
                <span className="text-xs text-slate-400">Checking eligibility...</span>
              </div>
            ) : cooldownRemainingDays > 0 ? (
              <div className="mt-2 space-y-1">
                <div className="flex items-center space-x-1.5 text-amber-500 text-xs font-bold">
                  <ShieldAlert className="w-4 h-4" />
                  <span>Next Payout ({cooldownRemainingDays} days left)</span>
                </div>
                <p className="text-[11px] text-slate-400">
                  Platform policy permits 1 withdrawal request every 14 days.
                </p>
              </div>
            ) : (
              <div className="mt-2 space-y-1">
                <div className="flex items-center space-x-1.5 text-emerald-500 text-xs font-bold">
                  <CheckCircle2 className="w-4 h-4" />
                  <span>Eligible for Withdrawal</span>
                </div>
                <p className="text-[11px] text-slate-400">
                  You can submit a new payout request today.
                </p>
              </div>
            )}
          </div>
          <div className="text-[10px] text-slate-400 pt-3 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between">
            <span>Processing Schedule:</span>
            <span className="font-bold text-slate-700 dark:text-slate-300">2-3 Business Working Days</span>
          </div>
        </div>
      </div>

      {/* Withdrawal Form Card */}
      <motion.div 
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        className="bg-white dark:bg-[#0B1F4B] border border-slate-200 dark:border-slate-800 rounded-xl p-6 shadow-sm space-y-6"
      >
        <div className="border-b border-slate-200 dark:border-slate-800 pb-4">
          <h3 className="text-base font-bold text-slate-900 dark:text-white">Withdrawal Configuration</h3>
          <p className="text-xs text-slate-500">Select payout method and enter destination details.</p>
        </div>

        {/* Mode Selector Tabs */}
        <div className="grid grid-cols-2 gap-3">
          <button
            type="button"
            onClick={() => setWithdrawalMode('crypto')}
            className={`p-3.5 rounded-2xl border text-xs font-bold transition flex items-center justify-center space-x-2 ${
              withdrawalMode === 'crypto'
                ? 'bg-amber-500 text-[#0B1F4B] border-amber-500 shadow-sm'
                : 'bg-slate-50 dark:bg-[#071326] text-slate-700 dark:text-slate-300 border-slate-200 dark:border-slate-800 hover:border-amber-500/50'
            }`}
          >
            <Bitcoin className="w-4 h-4" />
            <span>Crypto Wallet</span>
          </button>

          <button
            type="button"
            onClick={() => setWithdrawalMode('bank')}
            className={`p-3.5 rounded-2xl border text-xs font-bold transition flex items-center justify-center space-x-2 ${
              withdrawalMode === 'bank'
                ? 'bg-amber-500 text-[#0B1F4B] border-amber-500 shadow-sm'
                : 'bg-slate-50 dark:bg-[#071326] text-slate-700 dark:text-slate-300 border-slate-200 dark:border-slate-800 hover:border-amber-500/50'
            }`}
          >
            <Landmark className="w-4 h-4" />
            <span>Local Bank Transfer</span>
          </button>
        </div>

        <form onSubmit={handleWithdrawalSubmit} className="space-y-4">
          
          {/* Amount Field */}
          <div className="space-y-1.5">
            <label className="text-xs font-bold text-slate-700 dark:text-slate-300">Withdrawal Amount ($ USD)</label>
            <div className="relative">
              <span className="absolute left-3.5 top-3 text-xs font-bold text-slate-400">$</span>
              <input
                type="number"
                min="1000"
                step="any"
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
                placeholder="1000.00"
                className="w-full pl-8 pr-4 py-3 text-xs rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-[#071326] text-slate-900 dark:text-white focus:outline-none focus:border-amber-500 font-bold"
                required
              />
            </div>
            <p className="text-[10px] text-slate-400">Minimum withdrawal requirement is $1,000.00.</p>
          </div>

          {/* Conditional Mode Inputs */}
          {withdrawalMode === 'crypto' ? (
            <div className="space-y-4 pt-2">
              <div className="space-y-1.5">
                <label className="text-xs font-bold text-slate-700 dark:text-slate-300">Select Cryptocurrency Network</label>
                <select
                  value={cryptoCoin}
                  onChange={(e) => setCryptoCoin(e.target.value)}
                  className="w-full px-4 py-3 text-xs rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-[#071326] text-slate-900 dark:text-white focus:outline-none focus:border-amber-500 font-bold"
                >
                  <option value="USDT_TRC20">USDT (TRC-20 Network)</option>
                  <option value="BTC">Bitcoin (BTC Network)</option>
                  <option value="ETH">Ethereum (ERC-20 Network)</option>
                </select>
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-bold text-slate-700 dark:text-slate-300">Receiving Wallet Address</label>
                <input
                  type="text"
                  value={walletAddress}
                  onChange={(e) => setWalletAddress(e.target.value)}
                  placeholder="Paste your crypto wallet address here..."
                  className="w-full px-4 py-3 text-xs font-mono rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-[#071326] text-slate-900 dark:text-white focus:outline-none focus:border-amber-500"
                  required
                />
              </div>
            </div>
          ) : (
            <div className="space-y-4 pt-2">
              <div className="space-y-1.5">
                <label className="text-xs font-bold text-slate-700 dark:text-slate-300">Bank Name</label>
                <input
                  type="text"
                  value={bankName}
                  onChange={(e) => setBankName(e.target.value)}
                  placeholder="e.g., JPMorgan Private Bank, Bank of New York Mellon"
                  className="w-full px-4 py-3 text-xs rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-[#071326] text-slate-900 dark:text-white focus:outline-none focus:border-amber-500 font-medium"
                  required
                />
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-slate-700 dark:text-slate-300">Account Number / IBAN</label>
                  <input
                    type="text"
                    value={accountNumber}
                    onChange={(e) => setAccountNumber(e.target.value)}
                    placeholder="Enter account number"
                    className="w-full px-4 py-3 text-xs rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-[#071326] text-slate-900 dark:text-white focus:outline-none focus:border-amber-500 font-mono"
                    required
                  />
                </div>

                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-slate-700 dark:text-slate-300">Account Holder Name</label>
                  <input
                    type="text"
                    value={accountName}
                    onChange={(e) => setAccountName(e.target.value)}
                    placeholder="Full name on bank account"
                    className="w-full px-4 py-3 text-xs rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-[#071326] text-slate-900 dark:text-white focus:outline-none focus:border-amber-500 font-medium"
                    required
                  />
                </div>
              </div>
            </div>
          )}

          <div className="p-4 rounded-2xl bg-amber-500/10 border border-amber-500/20 flex items-start space-x-3 mt-4">
            <AlertCircle className="w-5 h-5 text-amber-500 flex-shrink-0 mt-0.5" />
            <p className="text-[11px] text-amber-600 dark:text-amber-400 leading-relaxed">
              Withdrawal requests are processed manually by our finance department within <strong>2-3 business working days</strong>. Once approved, funds will be disbursed and recorded in your transaction history ledger with a `completed` status.
            </p>
          </div>

          <div className="pt-3 flex justify-end">
            <button
              type="submit"
              disabled={withdrawing || cooldownRemainingDays > 0 || checkingCooldown}
              className="px-6 py-3.5 rounded-xl bg-amber-500 hover:bg-amber-400 text-[#0B1F4B] font-sans font-extrabold text-xs shadow-md transition flex items-center space-x-2 disabled:opacity-50"
            >
              {withdrawing ? <Loader2 className="w-4 h-4 animate-spin" /> : <ArrowUpRight className="w-4 h-4" />}
              <span>{cooldownRemainingDays > 0 ? `Payout Locked (${cooldownRemainingDays}d)` : 'Submit Withdrawal Request'}</span>
            </button>
          </div>

        </form>
      </motion.div>

    </div>
  );
}