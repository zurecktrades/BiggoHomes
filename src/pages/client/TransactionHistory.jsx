import React, { useState, useEffect } from 'react';
import { supabase } from '../../lib/supabaseClient';
import { useAuthStore } from '../../store/useAuthStore';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  ArrowDownRight, ArrowUpRight, ArrowRightLeft, 
  Loader2, Search, Filter, RefreshCw, CheckCircle2, Clock
} from 'lucide-react';
import { toast } from 'react-toastify';

export default function TransactionHistoryPage() {
  const { user } = useAuthStore();
  const [activeTab, setActiveTab] = useState('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [transactions, setTransactions] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (user) {
      fetchTransactions();
    }
  }, [user]);

  const fetchTransactions = async () => {
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from('transactions')
        .select('*')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false });

      if (error) throw error;
      if (data) setTransactions(data);
    } catch (err) {
      console.error(err);
      toast.error("Failed to load transaction history.");
    } finally {
      setLoading(false);
    }
  };

  // Filter transactions based on active category tab & search query
  const filteredTransactions = transactions.filter((tx) => {
    const matchesTab =
      activeTab === 'all'
        ? true
        : activeTab === 'deposits'
        ? tx.type === 'deposit'
        : activeTab === 'withdrawals'
        ? tx.type === 'withdrawal'
        : activeTab === 'investments'
        ? tx.type === 'investment' || tx.type === 'payout'
        : true;

    const matchesSearch =
      (tx.description && tx.description.toLowerCase().includes(searchQuery.toLowerCase())) ||
      (tx.reference_id && tx.reference_id.toLowerCase().includes(searchQuery.toLowerCase())) ||
      (tx.payment_method && tx.payment_method.toLowerCase().includes(searchQuery.toLowerCase()));

    return matchesTab && matchesSearch;
  });

  return (
    <div className="space-y-6 font-sans pb-12 max-w-7xl mx-auto">
      
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-2xl font-bold tracking-tight text-slate-900 dark:text-white">Transaction History</h2>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
            Complete real-time ledger of your deposits, payouts, withdrawals, and allocations.
          </p>
        </div>

        <button
          onClick={fetchTransactions}
          disabled={loading}
          className="inline-flex items-center space-x-2 px-4 py-2.5 rounded-xl bg-slate-100 dark:bg-[#0B1F4B] hover:bg-slate-200 dark:hover:bg-[#102a63] text-slate-700 dark:text-slate-200 text-xs font-bold border border-slate-200 dark:border-slate-800 transition flex-shrink-0"
        >
          <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} />
          <span>Refresh Ledger</span>
        </button>
      </div>

      {/* Main Ledger Card */}
      <div className="bg-white dark:bg-[#0B1F4B] border border-slate-200 dark:border-slate-800 rounded-3xl shadow-sm overflow-hidden space-y-4">
        
        {/* Controls Bar: Search & Filter Tabs */}
        <div className="p-6 border-b border-slate-200 dark:border-slate-800 flex flex-col md:flex-row md:items-center justify-between gap-4">
          
          {/* Category Tabs */}
          <div className="flex items-center space-x-1 bg-slate-100 dark:bg-[#071326] p-1 rounded-2xl border border-slate-200 dark:border-slate-800">
            {['all', 'deposits', 'withdrawals', 'investments'].map((tab) => (
              <button
                key={tab}
                onClick={() => setActiveTab(tab)}
                className={`relative px-4 py-2 text-xs font-bold rounded-xl capitalize transition ${
                  activeTab === tab
                    ? 'text-[#0B1F4B] dark:text-amber-400'
                    : 'text-slate-500 hover:text-slate-900 dark:hover:text-white'
                }`}
              >
                {activeTab === tab && (
                  <motion.div
                    layoutId="activeHistoryTab"
                    className="absolute inset-0 bg-white dark:bg-[#0B1F4B] border border-slate-200 dark:border-amber-500/40 rounded-xl shadow-sm"
                    transition={{ type: "spring", stiffness: 400, damping: 30 }}
                  />
                )}
                <span className="relative z-10">{tab}</span>
              </button>
            ))}
          </div>

          {/* Search Input */}
          <div className="relative w-full md:w-72">
            <Search className="w-4 h-4 absolute left-3.5 top-3 text-slate-400" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search reference ID, coin..."
              className="w-full pl-9 pr-4 py-2 text-xs rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-[#071326] text-slate-900 dark:text-white focus:outline-none focus:border-amber-500 font-medium"
            />
          </div>

        </div>

        {/* Transactions Table */}
        <div className="overflow-x-auto min-h-[350px]">
          {loading ? (
            <div className="flex items-center justify-center py-24">
              <Loader2 className="w-7 h-7 animate-spin text-amber-500" />
            </div>
          ) : filteredTransactions.length === 0 ? (
            <div className="text-center py-24 space-y-3">
              <Filter className="w-10 h-10 mx-auto text-slate-300 dark:text-slate-700" />
              <p className="text-xs font-bold text-slate-500 dark:text-slate-400">No transaction records found</p>
              <p className="text-[11px] text-slate-400">Try switching tabs or adjusting your search filter.</p>
            </div>
          ) : (
            <table className="w-full text-left border-collapse text-sm">
              <thead>
                <tr className="bg-slate-50 dark:bg-white/5 text-[10px] font-bold uppercase tracking-wider text-slate-400 border-b border-slate-200 dark:border-slate-800">
                  <th className="py-3.5 px-6">Transaction Type</th>
                  <th className="py-3.5 px-6">Reference ID</th>
                  <th className="py-3.5 px-6">Description</th>
                  <th className="py-3.5 px-6">Amount</th>
                  <th className="py-3.5 px-6">Status</th>
                  <th className="py-3.5 px-6">Date & Time</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-800 text-xs">
                <AnimatePresence mode="popLayout">
                  {filteredTransactions.map((tx) => (
                    <motion.tr
                      key={tx.id}
                      initial={{ opacity: 0, y: 6 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, y: -6 }}
                      transition={{ duration: 0.15 }}
                      className="hover:bg-slate-50 dark:hover:bg-white/5 transition"
                    >
                      {/* Type Icon & Label */}
                      <td className="py-4 px-6 font-bold flex items-center space-x-3">
                        <div className={`p-2.5 rounded-xl flex-shrink-0 ${
                          tx.type === 'deposit' ? 'bg-emerald-500/10 text-emerald-500' :
                          tx.type === 'withdrawal' ? 'bg-blue-500/10 text-blue-500' :
                          'bg-amber-500/10 text-amber-500'
                        }`}>
                          {tx.type === 'deposit' ? <ArrowDownRight className="w-4 h-4" /> :
                           tx.type === 'withdrawal' ? <ArrowUpRight className="w-4 h-4" /> :
                           <ArrowRightLeft className="w-4 h-4" />}
                        </div>
                        <span className="capitalize font-bold text-slate-900 dark:text-white">{tx.type}</span>
                      </td>

                      {/* Reference ID */}
                      <td className="py-4 px-6 font-mono text-[11px] text-slate-500 dark:text-slate-400">
                        <span className="px-2.5 py-1 rounded-md bg-slate-100 dark:bg-slate-800 font-sans font-bold text-[10px] text-amber-500">
                          {tx.reference_id || 'N/A'}
                        </span>
                      </td>

                      {/* Description */}
                      <td className="py-4 px-6 text-slate-600 dark:text-slate-300 max-w-xs truncate">
                        {tx.description || `${tx.type} transaction`}
                      </td>

                      {/* Amount */}
                      <td className={`py-4 px-6 font-sans font-bold text-sm ${
                        tx.type === 'deposit' || tx.type === 'payout' ? 'text-emerald-500' : 'text-slate-900 dark:text-white'
                      }`}>
                        {tx.type === 'deposit' || tx.type === 'payout' ? '+' : '-'}${Math.abs(tx.amount).toLocaleString(undefined, { minimumFractionDigits: 2 })}
                      </td>

                      {/* Status Badge */}
                      <td className="py-4 px-6">
                        <span className={`inline-flex items-center space-x-1 px-2.5 py-1 rounded-full text-[10px] font-bold uppercase border ${
                          tx.status === 'pending'
                            ? 'bg-amber-500/10 text-amber-500 border-amber-500/20'
                            : tx.status === 'rejected'
                            ? 'bg-red-500/10 text-red-500 border-red-500/20'
                            : 'bg-emerald-500/10 text-emerald-500 border-emerald-500/20'
                        }`}>
                          {tx.status === 'pending' ? <Clock className="w-3 h-3" /> : <CheckCircle2 className="w-3 h-3" />}
                          <span>{tx.status || 'completed'}</span>
                        </span>
                      </td>

                      {/* Date */}
                      <td className="py-4 px-6 text-slate-400 text-[11px]">
                        {new Date(tx.created_at).toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' })}{' '}
                        <span className="opacity-70">
                          {new Date(tx.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                        </span>
                      </td>
                    </motion.tr>
                  ))}
                </AnimatePresence>
              </tbody>
            </table>
          )}
        </div>

      </div>

    </div>
  );
}