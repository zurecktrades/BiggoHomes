import React, { useState, useEffect } from 'react';
import { supabase } from '../../lib/supabaseClient';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  DollarSign, ArrowUpRight, ArrowDownLeft, PlusCircle, Calendar, 
  Clock, Search, Loader2, CheckCircle2, AlertCircle, User, ShieldCheck, X, Building2 
} from 'lucide-react';
import { toast } from 'react-toastify';

const showCustomToast = (title, message, type = 'success') => {
  toast(
    <div className="flex items-start space-x-3 py-1">
      <div className={`p-2 rounded-xl flex-shrink-0 mt-0.5 ${
        type === 'success' ? 'bg-amber-500/10 text-amber-500' : 'bg-red-500/10 text-red-500'
      }`}>
        {type === 'success' ? <CheckCircle2 className="w-5 h-5" /> : <AlertCircle className="w-5 h-5" />}
      </div>
      <div>
        <h4 className="text-sm font-bold text-slate-900 dark:text-white">{title}</h4>
        <p className="text-xs text-slate-500 dark:text-slate-300 mt-0.5">{message}</p>
      </div>
    </div>,
    {
      position: "top-right",
      autoClose: 3500,
      hideProgressBar: true,
      closeButton: false,
      className: "bg-white dark:bg-[#0B1F4B] border border-slate-200 dark:border-slate-700 shadow-2xl rounded-2xl p-4 font-sans",
    }
  );
};

export default function AdminTransactionsPage() {
  const [investors, setInvestors] = useState([]);
  const [properties, setProperties] = useState([]);
  const [transactions, setTransactions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');

  // Form State for Manual Transaction Logging
  const [selectedInvestorId, setSelectedInvestorId] = useState('');
  const [txType, setTxType] = useState('deposit'); // deposit | withdrawal | investment
  
  // Investment-specific fields
  const [selectedPropertyId, setSelectedPropertyId] = useState('');
  const [tokenCount, setTokenCount] = useState(1);

  const [amount, setAmount] = useState('');
  const [reference, setReference] = useState('');
  const [status, setStatus] = useState('completed');
  
  // Backdate Date & Time State
  const [customDateTime, setCustomDateTime] = useState(
    new Date().toISOString().slice(0, 16)
  );

  useEffect(() => {
    fetchData();
  }, []);

  // Whenever property selection or token count changes (and type is investment), auto-compute amount
  useEffect(() => {
    if (txType === 'investment' && selectedPropertyId) {
      const prop = properties.find(p => p.id === selectedPropertyId);
      if (prop) {
        const tokenPrice = prop.total_tokens > 0 ? Number(prop.target_amount) / Number(prop.total_tokens) : 0;
        const computedTotal = tokenPrice * Number(tokenCount || 1);
        setAmount(computedTotal.toFixed(2));
      }
    }
  }, [selectedPropertyId, tokenCount, txType, properties]);

  const fetchData = async () => {
    setLoading(true);
    try {
      // 1. Fetch only investors (excluding admin)
      const { data: invData, error: invError } = await supabase
        .from('profiles')
        .select('*')
        .eq('role', 'investor')
        .order('full_name', { ascending: true });

      if (invError) throw invError;
      setInvestors(invData || []);

      // 2. Fetch properties for investment assignment
      const { data: propData, error: propError } = await supabase
        .from('properties')
        .select('*')
        .order('title', { ascending: true });

      if (propError) throw propError;
      setProperties(propData || []);

      // 3. Fetch recent transactions
      const { data: txData, error: txError } = await supabase
        .from('transactions')
        .select(`*, profiles(full_name, email)`)
        .order('created_at', { ascending: false })
        .limit(50);

      if (txError) throw txError;
      setTransactions(txData || []);
    } catch (err) {
      console.error(err);
      showCustomToast("Error", "Failed to load transaction records.", "error");
    } finally {
      setLoading(false);
    }
  };

  // Helper to generate profit schedule jsonb for investments
  const generateProfitSchedule = (principal, totalMaxProfit, durationDays) => {
    const schedule = [];
    const dailyBase = totalMaxProfit / durationDays;
    let cumulativeProfit = 0;
    const purchaseDate = new Date(customDateTime);

    for (let day = 1; day <= durationDays; day++) {
      const variance = day === durationDays ? 1 : 0.85 + Math.random() * 0.3;
      const dailyProfit = day === durationDays 
        ? Number((totalMaxProfit - cumulativeProfit).toFixed(2)) 
        : Number((dailyBase * variance).toFixed(2));
      
      cumulativeProfit = Number((cumulativeProfit + dailyProfit).toFixed(2));

      const scheduleDate = new Date(purchaseDate);
      scheduleDate.setDate(purchaseDate.getDate() + (day - 1));

      schedule.push({
        day: day,
        date: scheduleDate.toISOString().split('T')[0],
        profitEarned: cumulativeProfit,
        portfolioValue: Number((principal + cumulativeProfit).toFixed(2))
      });
    }
    return schedule;
  };

  // Handle Manual Transaction Submission & Wallet Balance Adjustment
  const handleLogTransaction = async (e) => {
    e.preventDefault();
    if (!selectedInvestorId || !amount || parseFloat(amount) <= 0) {
      showCustomToast("Validation Error", "Please select an investor and enter a valid amount.", "error");
      return;
    }

    if (txType === 'investment' && !selectedPropertyId) {
      showCustomToast("Validation Error", "Please select a property for the investment allocation.", "error");
      return;
    }

    setSubmitting(true);
    try {
      const parsedAmount = parseFloat(amount);
      const targetInvestor = investors.find(i => i.id === selectedInvestorId);
      const targetProperty = properties.find(p => p.id === selectedPropertyId);

      const timestamp = customDateTime ? new Date(customDateTime).toISOString() : new Date().toISOString();

      // 1. If type is investment, also record into investments table and update property tokens
      if (txType === 'investment' && targetProperty) {
        const countToBuy = parseInt(tokenCount) || 1;
        const durationDays = targetProperty.payout_frequency === 'annual' ? 365 : targetProperty.payout_frequency === 'bi-annual' ? 180 : 90;
        const estimatedReturn = Number(parsedAmount * (Number(targetProperty.roi_percentage) / 100)).toFixed(2);
        const profitScheduleJson = generateProfitSchedule(parsedAmount, parseFloat(estimatedReturn), durationDays);

        // Insert into investments table
        const { error: investInsertError } = await supabase.from('investments').insert({
          user_id: selectedInvestorId,
          property_id: selectedPropertyId,
          amount: parsedAmount,
          tokens_purchased: countToBuy,
          payout_frequency: targetProperty.payout_frequency || 'quarterly',
          expected_roi_amount: parseFloat(estimatedReturn),
          status: status === 'completed' ? 'active' : 'pending',
          profit_schedule: profitScheduleJson,
          created_at: timestamp
        });

        if (investInsertError) throw investInsertError;

        // Update available tokens and funded amount on property
        const currentAvailable = Number(targetProperty.available_tokens ?? targetProperty.total_tokens);
        const newAvailableTokens = Math.max(0, currentAvailable - countToBuy);
        const newFundedAmount = Number(targetProperty.funded_amount || 0) + parsedAmount;

        await supabase
          .from('properties')
          .update({
            available_tokens: newAvailableTokens,
            funded_amount: newFundedAmount,
            status: newAvailableTokens === 0 ? 'fully_funded' : targetProperty.status
          })
          .eq('id', selectedPropertyId);
      }

      // 2. Insert into transactions table
      const transactionPayload = {
        user_id: selectedInvestorId,
        type: txType,
        amount: parsedAmount,
        status: status,
        reference: reference || `${txType.toUpperCase()}-${Date.now().toString().slice(-6)}`,
        reference_id: reference || `${txType.toUpperCase()}-${Date.now().toString().slice(-6)}`,
        description: txType === 'investment' ? `Allocated to ${targetProperty?.title || 'Property'}` : `Direct Bank ${txType}`, 
        created_at: timestamp
      };

      const { error: txInsertError } = await supabase
        .from('transactions')
        .insert(transactionPayload);

      if (txInsertError) throw txInsertError;

      // 3. Automatically adjust investor's account balance if completed
      if (status === 'completed' && targetInvestor) {
        const currentBalance = targetInvestor.account_balance || 0;
        const currentDeposited = targetInvestor.total_deposited || 0;

        let newBalance = currentBalance;
        let newDeposited = currentDeposited;

        if (txType === 'deposit') {
          newBalance += parsedAmount;
          newDeposited += parsedAmount;
        } else if (txType === 'withdrawal') {
          newBalance -= parsedAmount;
        } else if (txType === 'investment') {
          // Deduct from balance if investing from wallet balance directly
          newBalance -= parsedAmount;
        }

        const { error: profileUpdateError } = await supabase
          .from('profiles')
          .update({ 
            account_balance: newBalance,
            total_deposited: newDeposited
          })
          .eq('id', selectedInvestorId);

        if (profileUpdateError) throw profileUpdateError;
      }

      showCustomToast("Success", `Manual ${txType} of $${parsedAmount.toLocaleString()} logged for ${targetInvestor?.full_name || 'Investor'}.`);
      
      // Reset form
      setAmount('');
      setReference('');
      setSelectedInvestorId('');
      setSelectedPropertyId('');
      setTokenCount(1);
      setCustomDateTime(new Date().toISOString().slice(0, 16));
      
      // Refresh list
      fetchData();
    } catch (err) {
      console.error(err);
      showCustomToast("Logging Failed", err.message || "Could not log transaction.", "error");
    } finally {
      setSubmitting(false);
    }
  };

  const filteredTransactions = transactions.filter(tx => 
    (tx.profiles?.full_name?.toLowerCase() || '').includes(searchQuery.toLowerCase()) ||
    (tx.reference?.toLowerCase() || '').includes(searchQuery.toLowerCase()) ||
    (tx.type?.toLowerCase() || '').includes(searchQuery.toLowerCase())
  );

  return (
    <div className="space-y-8 font-sans pb-12 max-w-7xl mx-auto">
      
      {/* Header */}
      <div>
        <h2 className="text-2xl font-bold tracking-tight text-slate-900 dark:text-white">Transaction Management/Funding</h2>
        <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
          Manually log deposits, withdrawals, or direct property investments for investors with backdating support.
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        
        {/* LEFT COLUMN: Log Transaction Form */}
        <div className="lg:col-span-5 bg-white dark:bg-[#0B1F4B] border border-slate-200 dark:border-slate-800 p-6 rounded-3xl shadow-lg h-fit space-y-5">
          <div className="flex items-center space-x-2 border-b border-slate-100 dark:border-slate-800 pb-4">
            <PlusCircle className="w-5 h-5 text-amber-500" />
            <h3 className="text-sm font-bold text-slate-900 dark:text-white">Manual Transaction</h3>
          </div>

          <form onSubmit={handleLogTransaction} className="space-y-4">
            
            {/* Select Investor */}
            <div>
              <label className="block text-[10px] font-bold text-slate-400 uppercase mb-1">Select Investor *</label>
              <select
                value={selectedInvestorId}
                onChange={(e) => setSelectedInvestorId(e.target.value)}
                required
                className="w-full px-3.5 py-2.5 text-xs rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-[#10213B] text-slate-900 dark:text-white focus:outline-none focus:border-amber-500"
              >
                <option value="">-- Choose Investor --</option>
                {investors.map((inv) => (
                  <option key={inv.id} value={inv.id}>
                    {inv.full_name} (${(inv.account_balance || 0).toLocaleString()})
                  </option>
                ))}
              </select>
            </div>

            {/* Transaction Type & Status */}
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-[10px] font-bold text-slate-400 uppercase mb-1">Type *</label>
                <select
                  value={txType}
                  onChange={(e) => setTxType(e.target.value)}
                  className="w-full px-3.5 py-2.5 text-xs rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-[#10213B] text-slate-900 dark:text-white focus:outline-none focus:border-amber-500 uppercase font-semibold"
                >
                  <option value="deposit">Deposit (Credit)</option>
                  <option value="withdrawal">Withdrawal (Debit)</option>
                  <option value="investment">Investment Allocation</option>
                </select>
              </div>

              <div>
                <label className="block text-[10px] font-bold text-slate-400 uppercase mb-1">Status</label>
                <select
                  value={status}
                  onChange={(e) => setStatus(e.target.value)}
                  className="w-full px-3.5 py-2.5 text-xs rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-[#10213B] text-slate-900 dark:text-white focus:outline-none focus:border-amber-500 uppercase font-semibold"
                >
                  <option value="completed">Completed</option>
                  <option value="pending">Pending</option>
                  <option value="failed">Failed</option>
                </select>
              </div>
            </div>

            {/* CONDITIONAL PROPERTY & TOKEN SELECTORS IF INVESTMENT TYPE */}
            {txType === 'investment' && (
              <div className="p-4 rounded-2xl bg-slate-50 dark:bg-[#071326] border border-slate-200 dark:border-slate-700 space-y-3">
                <div className="flex items-center space-x-2 text-xs font-bold text-amber-500">
                  <Building2 className="w-4 h-4" />
                  <span>Property Investment Configuration</span>
                </div>

                <div>
                  <label className="block text-[10px] font-bold text-slate-400 uppercase mb-1">Select Property *</label>
                  <select
                    value={selectedPropertyId}
                    onChange={(e) => setSelectedPropertyId(e.target.value)}
                    required={txType === 'investment'}
                    className="w-full px-3.5 py-2.5 text-xs rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-[#10213B] text-slate-900 dark:text-white focus:outline-none focus:border-amber-500"
                  >
                    <option value="">-- Choose Property Asset --</option>
                    {properties.map((prop) => (
                      <option key={prop.id} value={prop.id}>
                        {prop.title} ({prop.location}) - ROI: {prop.roi_percentage}%
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-[10px] font-bold text-slate-400 uppercase mb-1">Number of Tokens to Buy *</label>
                  <input
                    type="number"
                    min="1"
                    value={tokenCount}
                    onChange={(e) => setTokenCount(Math.max(1, parseInt(e.target.value) || 1))}
                    required={txType === 'investment'}
                    className="w-full px-3.5 py-2.5 text-xs rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-[#10213B] text-slate-900 dark:text-white focus:outline-none focus:border-amber-500 font-bold"
                  />
                </div>
              </div>
            )}

            {/* Amount & Reference */}
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-[10px] font-bold text-slate-400 uppercase mb-1">
                  Amount ($) {txType === 'investment' && '(Auto-computed)'} *
                </label>
                <input
                  type="number"
                  step="0.01"
                  value={amount}
                  onChange={(e) => setAmount(e.target.value)}
                  placeholder="5000.00"
                  required
                  readOnly={txType === 'investment'}
                  className={`w-full px-3.5 py-2.5 text-xs rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-[#10213B] text-slate-900 dark:text-white focus:outline-none focus:border-amber-500 font-bold ${
                    txType === 'investment' ? 'opacity-80 cursor-not-allowed' : ''
                  }`}
                />
              </div>

              <div>
                <label className="block text-[10px] font-bold text-slate-400 uppercase mb-1">Reference Code</label>
                <input
                  type="text"
                  value={reference}
                  onChange={(e) => setReference(e.target.value)}
                  placeholder="e.g. BANK-WIRE-9921"
                  className="w-full px-3.5 py-2.5 text-xs rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-[#10213B] text-slate-900 dark:text-white focus:outline-none focus:border-amber-500"
                />
              </div>
            </div>

            {/* Backdate Calendar & Time Picker */}
            <div>
              <label className="block text-[10px] font-bold text-slate-400 uppercase mb-1">
                Transaction Date & Time (Backdate Support)
              </label>
              <div className="relative">
                <input
                  type="datetime-local"
                  value={customDateTime}
                  onChange={(e) => setCustomDateTime(e.target.value)}
                  className="w-full px-3.5 py-2.5 text-xs rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-[#10213B] text-slate-900 dark:text-white focus:outline-none focus:border-amber-500"
                />
              </div>
              <p className="text-[10px] text-slate-400 mt-1">
                Select past date/time if recording historical allocations or bank transfers.
              </p>
            </div>

            <button
              type="submit"
              disabled={submitting}
              className="w-full py-3.5 rounded-xl bg-amber-500 hover:bg-amber-400 text-[#0B1F4B] font-bold text-xs shadow-md transition flex items-center justify-center space-x-2 disabled:opacity-50 mt-2"
            >
              {submitting ? <Loader2 className="w-4 h-4 animate-spin" /> : <span>Log Transaction</span>}
            </button>
          </form>
        </div>

        {/* RIGHT COLUMN: Recent Transactions Log & Filter */}
        <div className="lg:col-span-7 space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <h3 className="text-sm font-bold text-slate-500 uppercase tracking-wider">Recent Transactions Log</h3>
            
            {/* Search filter */}
            <div className="relative w-full sm:w-60">
              <Search className="absolute left-3 top-2.5 w-3.5 h-3.5 text-slate-400" />
              <input
                type="text"
                placeholder="Search history..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-9 pr-3 py-2 text-xs rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-[#0B1F4B] text-slate-900 dark:text-white focus:outline-none focus:border-amber-500"
              />
            </div>
          </div>

          <div className="bg-white dark:bg-[#0B1F4B] border border-slate-200 dark:border-slate-800 rounded-3xl shadow-sm overflow-hidden">
            {loading ? (
              <div className="flex justify-center py-20"><Loader2 className="w-8 h-8 animate-spin text-amber-500" /></div>
            ) : filteredTransactions.length === 0 ? (
              <div className="text-center py-16 text-slate-400 text-xs">No transactions logged yet.</div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs">
                  <thead>
                    <tr className="bg-slate-50 dark:bg-white/5 text-[10px] font-bold uppercase tracking-wider text-slate-400 border-b border-slate-200 dark:border-slate-800">
                      <th className="py-3 px-4">Investor</th>
                      <th className="py-3 px-3">Type</th>
                      <th className="py-3 px-3">Amount</th>
                      <th className="py-3 px-3">Status</th>
                      <th className="py-3 px-4 text-right">Timestamp</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                    {filteredTransactions.map((tx) => (
                      <tr key={tx.id} className="hover:bg-slate-50 dark:hover:bg-white/5 transition">
                        <td className="py-3.5 px-4 font-bold text-slate-900 dark:text-white">
                          <div>{tx.profiles?.full_name || 'Unknown User'}</div>
                          <div className="text-[10px] font-normal text-slate-400">{tx.reference || tx.description || 'Manual Entry'}</div>
                        </td>
                        <td className="py-3.5 px-3">
                          <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold uppercase ${
                            tx.type === 'deposit' ? 'bg-emerald-500/10 text-emerald-500' :
                            tx.type === 'withdrawal' ? 'bg-red-500/10 text-red-500' : 'bg-blue-500/10 text-blue-500'
                          }`}>
                            {tx.type}
                          </span>
                        </td>
                        <td className={`py-3.5 px-3 font-extrabold ${tx.type === 'deposit' ? 'text-emerald-500' : 'text-slate-900 dark:text-white'}`}>
                          {tx.type === 'withdrawal' || tx.type === 'investment' ? '-' : '+'}${Number(tx.amount || 0).toLocaleString(undefined, { minimumFractionDigits: 2 })}
                        </td>
                        <td className="py-3.5 px-3">
                          <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold uppercase ${
                            tx.status === 'completed' ? 'bg-emerald-500/10 text-emerald-500' :
                            tx.status === 'pending' ? 'bg-amber-500/10 text-amber-500' : 'bg-red-500/10 text-red-500'
                          }`}>
                            {tx.status}
                          </span>
                        </td>
                        <td className="py-3.5 px-4 text-right text-[11px] text-slate-500">
                          {new Date(tx.created_at).toLocaleString()}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </div>

      </div>

    </div>
  );
}