import React, { useState, useEffect } from 'react';
import { supabase } from '../lib/supabaseClient';
import { motion } from 'framer-motion';
import { 
  Users, ShieldCheck, ArrowDownRight, ArrowUpRight, 
  Building2, DollarSign, Clock, CheckCircle2, XCircle, 
  Loader2, RefreshCw, AlertCircle, FileText 
} from 'lucide-react';
import { toast } from 'react-toastify';
import { Link } from 'react-router-dom';

export default function AdminDashboardPage() {
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState({
    totalUsers: 0,
    pendingKyc: 0,
    pendingDeposits: 0,
    pendingWithdrawals: 0,
    totalVolume: 0
  });

  const [pendingKycUsers, setPendingKycUsers] = useState([]);
  const [pendingTransactions, setPendingTransactions] = useState([]);
  const [processingId, setProcessingId] = useState(null);

  useEffect(() => {
    fetchAdminData();
  }, []);

  const fetchAdminData = async () => {
    setLoading(true);
    try {
      // 1. Fetch Profiles Stats & Pending KYC
      const { data: profiles, error: profErr } = await supabase
        .from('profiles')
        .select('*');

      if (profErr) throw profErr;

      const totalUsers = profiles?.length || 0;
      const pendingKycList = profiles?.filter(p => p.kyc_status === 'pending') || [];

      // 2. Fetch Transactions Stats & Pending Deposits/Withdrawals (selecting only full_name from profiles)
      const { data: txs, error: txErr } = await supabase
        .from('transactions')
        .select('*, profiles(full_name)')
        .order('created_at', { ascending: false });

      if (txErr) throw txErr;

      const pendingTxs = txs?.filter(t => t.status === 'pending') || [];
      const totalVolume = txs?.filter(t => t.status === 'completed' || t.status === 'approved')
        .reduce((acc, t) => acc + Math.abs(t.amount), 0) || 0;

      setStats({
        totalUsers,
        pendingKyc: pendingKycList.length,
        pendingDeposits: pendingTxs.filter(t => t.type === 'deposit').length,
        pendingWithdrawals: pendingTxs.filter(t => t.type === 'withdrawal').length,
        totalVolume
      });

      setPendingKycUsers(pendingKycList);
      setPendingTransactions(pendingTxs);
    } catch (err) {
      console.error(err);
      toast.error('Failed to load admin analytics.');
    } finally {
      setLoading(false);
    }
  };

  // Handle KYC Verification Action (Approve or Reject)
  const handleKycAction = async (userId, status) => {
    setProcessingId(userId);
    try {
      const { error } = await supabase
        .from('profiles')
        .update({ kyc_status: status })
        .eq('id', userId);

      if (error) throw error;

      toast.success(`User KYC status updated to ${status}.`);
      fetchAdminData();
    } catch (err) {
      console.error(err);
      toast.error('Failed to update KYC status.');
    } finally {
      setProcessingId(null);
    }
  };

  // Handle Transaction Action (Approve Deposit/Withdrawal & Update User Balance)
  const handleTransactionAction = async (tx, action) => {
    setProcessingId(tx.id);
    try {
      const newStatus = action === 'approve' ? 'completed' : 'rejected';

      // 1. Update transaction status
      const { error: txUpdateErr } = await supabase
        .from('transactions')
        .update({ status: newStatus })
        .eq('id', tx.id);

      if (txUpdateErr) throw txUpdateErr;

      // 2. If approved, modify user's account balance & totals accordingly
      if (action === 'approve') {
        // Fetch current profile balance
        const { data: profData, error: profFetchErr } = await supabase
          .from('profiles')
          .select('account_balance, total_deposited, total_withdrawn')
          .eq('id', tx.user_id)
          .single();

        if (!profFetchErr && profData) {
          let newBalance = profData.account_balance || 0;
          let newTotalDeposited = profData.total_deposited || 0;
          let newTotalWithdrawn = profData.total_withdrawn || 0;

          if (tx.type === 'deposit') {
            newBalance += tx.amount;
            newTotalDeposited += tx.amount;
          } else if (tx.type === 'withdrawal') {
            newBalance -= tx.amount;
            newTotalWithdrawn += tx.amount;
          }

          const { error: profUpdateErr } = await supabase
            .from('profiles')
            .update({
              account_balance: newBalance,
              total_deposited: newTotalDeposited,
              total_withdrawn: newTotalWithdrawn
            })
            .eq('id', tx.user_id);

          if (profUpdateErr) throw profUpdateErr;
        }
      }

      toast.success(`Transaction ${newStatus} successfully!`);
      fetchAdminData();
    } catch (err) {
      console.error(err);
      toast.error('Failed to process transaction.');
    } finally {
      setProcessingId(null);
    }
  };

  return (
    <div className="space-y-8 font-sans pb-12 max-w-7xl mx-auto">
      
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-2xl font-bold tracking-tight text-slate-900 dark:text-white">Admin Control Dashboard</h2>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
            Monitor global platform volume, verify pending KYC investor documents, and approve funding requests.
          </p>
        </div>

        <button
          onClick={fetchAdminData}
          disabled={loading}
          className="inline-flex items-center space-x-2 px-4 py-2.5 rounded-xl bg-slate-100 dark:bg-[#0B1F4B] hover:bg-slate-200 dark:hover:bg-[#102a63] text-slate-700 dark:text-slate-200 text-xs font-bold border border-slate-200 dark:border-slate-800 transition flex-shrink-0"
        >
          <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} />
          <span>Refresh Data</span>
        </button>
      </div>

      {/* KPI Metric Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
        
        <div className="p-6 rounded-3xl bg-white dark:bg-[#0B1F4B] border border-slate-200 dark:border-slate-800 shadow-sm">
          <div className="flex items-center justify-between">
            <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400">Total Registered Users</span>
            <div className="p-2.5 rounded-xl bg-blue-500/10 text-blue-500">
              <Users className="w-5 h-5" />
            </div>
          </div>
          <h3 className="text-2xl font-bold text-slate-900 dark:text-white mt-4">
            {loading ? <Loader2 className="w-5 h-5 animate-spin" /> : stats.totalUsers}
          </h3>
          <p className="text-[11px] text-slate-400 mt-2">Active platform investors</p>
        </div>

        <div className="p-6 rounded-3xl bg-white dark:bg-[#0B1F4B] border border-slate-200 dark:border-slate-800 shadow-sm">
          <div className="flex items-center justify-between">
            <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400">Pending KYC Requests</span>
            <div className="p-2.5 rounded-xl bg-amber-500/10 text-amber-500">
              <ShieldCheck className="w-5 h-5" />
            </div>
          </div>
          <h3 className="text-2xl font-bold text-amber-500 mt-4">
            {loading ? <Loader2 className="w-5 h-5 animate-spin" /> : stats.pendingKyc}
          </h3>
          <p className="text-[11px] text-slate-400 mt-2">Requires compliance review</p>
        </div>

        <div className="p-6 rounded-3xl bg-white dark:bg-[#0B1F4B] border border-slate-200 dark:border-slate-800 shadow-sm">
          <div className="flex items-center justify-between">
            <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400">Pending Funding / Payouts</span>
            <div className="p-2.5 rounded-xl bg-purple-500/10 text-purple-500">
              <Clock className="w-5 h-5" />
            </div>
          </div>
          <h3 className="text-2xl font-bold text-purple-500 mt-4">
            {loading ? <Loader2 className="w-5 h-5 animate-spin" /> : (stats.pendingDeposits + stats.pendingWithdrawals)}
          </h3>
          <p className="text-[11px] text-slate-400 mt-2">{stats.pendingDeposits} deposits, {stats.pendingWithdrawals} withdrawals</p>
        </div>

        <div className="p-6 rounded-3xl bg-white dark:bg-[#0B1F4B] border border-slate-200 dark:border-slate-800 shadow-sm">
          <div className="flex items-center justify-between">
            <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400">Total Cleared Volume</span>
            <div className="p-2.5 rounded-xl bg-emerald-500/10 text-emerald-500">
              <DollarSign className="w-5 h-5" />
            </div>
          </div>
          <h3 className="text-2xl font-bold text-emerald-500 mt-4">
            {loading ? <Loader2 className="w-5 h-5 animate-spin" /> : `$${stats.totalVolume.toLocaleString(undefined, { minimumFractionDigits: 2 })}`}
          </h3>
          <p className="text-[11px] text-slate-400 mt-2">Platform-wide transaction sum</p>
        </div>

      </div>

      {/* SECTION 1: PENDING KYC VERIFICATIONS */}
      <div className="bg-white dark:bg-[#0B1F4B] border border-slate-200 dark:border-slate-800 rounded-3xl shadow-sm overflow-hidden p-6 space-y-4">
        <div className="flex items-center justify-between border-b border-slate-200 dark:border-slate-800 pb-4">
          <div>
            <h3 className="text-base font-bold text-slate-900 dark:text-white">Pending KYC Submissions</h3>
            <p className="text-xs text-slate-500">Review investor passport and selfie documents before granting approval.</p>
          </div>
          <span className="px-3 py-1 rounded-full bg-amber-500/10 text-amber-500 font-bold text-xs">
            {pendingKycUsers.length} Pending
          </span>
        </div>

        {loading ? (
          <div className="flex justify-center py-12"><Loader2 className="w-6 h-6 animate-spin text-amber-500" /></div>
        ) : pendingKycUsers.length === 0 ? (
          <div className="text-center py-12 text-slate-400 text-xs">No pending KYC verification requests at this time.</div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead>
                <tr className="bg-slate-50 dark:bg-white/5 text-[10px] font-bold uppercase tracking-wider text-slate-400 border-b border-slate-200 dark:border-slate-800">
                  <th className="py-3 px-4">Investor Name</th>
                  <th className="py-3 px-4">Submitted Date</th>
                  <th className="py-3 px-4">Documents (Front, Back, Selfie)</th>
                  <th className="py-3 px-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                {pendingKycUsers.map((user) => {
                  // Parse JSON document URLs if available
                  let docs = { front: '#', back: '#', selfie: '#' };
                  try {
                    if (user.kyc_document_url) docs = JSON.parse(user.kyc_document_url);
                  } catch (e) {
                    docs.front = user.kyc_document_url; // fallback if single string
                  }

                  return (
                    <tr key={user.id} className="hover:bg-slate-50 dark:hover:bg-white/5">
                      <td className="py-4 px-4 font-bold text-slate-900 dark:text-white">
                        {user.full_name || 'Unnamed Investor'}
                        <div className="text-[10px] font-normal text-slate-400">{user.email}</div>
                      </td>
                      <td className="py-4 px-4 text-slate-500">
                        {user.kyc_submitted_at ? new Date(user.kyc_submitted_at).toLocaleDateString() : 'N/A'}
                      </td>
                      <td className="py-4 px-4">
                        <div className="flex items-center space-x-2">
                          {docs.front && <a href={docs.front} target="_blank" rel="noreferrer" className="px-2.5 py-1 rounded-lg bg-amber-500/10 text-amber-500 font-bold hover:underline">Front</a>}
                          {docs.back && <a href={docs.back} target="_blank" rel="noreferrer" className="px-2.5 py-1 rounded-lg bg-amber-500/10 text-amber-500 font-bold hover:underline">Back</a>}
                          {docs.selfie && <a href={docs.selfie} target="_blank" rel="noreferrer" className="px-2.5 py-1 rounded-lg bg-amber-500/10 text-amber-500 font-bold hover:underline">Selfie</a>}
                        </div>
                      </td>
                      <td className="py-4 px-4 text-right space-x-2">
                        <button
                          onClick={() => handleKycAction(user.id, 'verified')}
                          disabled={processingId === user.id}
                          className="px-3 py-1.5 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-white font-bold transition inline-flex items-center space-x-1"
                        >
                          {processingId === user.id ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <CheckCircle2 className="w-3.5 h-3.5" />}
                          <span>Approve</span>
                        </button>
                        <button
                          onClick={() => handleKycAction(user.id, 'rejected')}
                          disabled={processingId === user.id}
                          className="px-3 py-1.5 rounded-xl bg-red-500 hover:bg-red-400 text-white font-bold transition inline-flex items-center space-x-1"
                        >
                          <XCircle className="w-3.5 h-3.5" />
                          <span>Reject</span>
                        </button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* SECTION 2: PENDING DEPOSITS & WITHDRAWALS */}
      <div className="bg-white dark:bg-[#0B1F4B] border border-slate-200 dark:border-slate-800 rounded-3xl shadow-sm overflow-hidden p-6 space-y-4">
        <div className="flex items-center justify-between border-b border-slate-200 dark:border-slate-800 pb-4">
          <div>
            <h3 className="text-base font-bold text-slate-900 dark:text-white">Pending Financial Transactions</h3>
            <p className="text-xs text-slate-500">Approve crypto deposits or payouts to automatically update investor wallet balances.</p>
          </div>
          <span className="px-3 py-1 rounded-full bg-purple-500/10 text-purple-500 font-bold text-xs">
            {pendingTransactions.length} Pending
          </span>
        </div>

        {loading ? (
          <div className="flex justify-center py-12"><Loader2 className="w-6 h-6 animate-spin text-amber-500" /></div>
        ) : pendingTransactions.length === 0 ? (
          <div className="text-center py-12 text-slate-400 text-xs">No pending transaction approvals required.</div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead>
                <tr className="bg-slate-50 dark:bg-white/5 text-[10px] font-bold uppercase tracking-wider text-slate-400 border-b border-slate-200 dark:border-slate-800">
                  <th className="py-3 px-4">Type</th>
                  <th className="py-3 px-4">Investor</th>
                  <th className="py-3 px-4">Reference ID</th>
                  <th className="py-3 px-4">Description</th>
                  <th className="py-3 px-4">Amount</th>
                  <th className="py-3 px-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                {pendingTransactions.map((tx) => (
                  <tr key={tx.id} className="hover:bg-slate-50 dark:hover:bg-white/5">
                    <td className="py-4 px-4 font-bold capitalize flex items-center space-x-2">
                      <div className={`p-1.5 rounded-lg ${tx.type === 'deposit' ? 'bg-emerald-500/10 text-emerald-500' : 'bg-blue-500/10 text-blue-500'}`}>
                        {tx.type === 'deposit' ? <ArrowDownRight className="w-3.5 h-3.5" /> : <ArrowUpRight className="w-3.5 h-3.5" />}
                      </div>
                      <span>{tx.type}</span>
                    </td>
                    <td className="py-4 px-4 font-bold text-slate-900 dark:text-white">
                      {tx.profiles?.full_name || 'Unknown User'}
                    </td>
                    <td className="py-4 px-4 font-mono text-amber-500">{tx.reference_id || 'N/A'}</td>
                    <td className="py-4 px-4 text-slate-500 max-w-xs truncate">{tx.description}</td>
                    <td className="py-4 px-4 font-bold text-slate-900 dark:text-white">${Math.abs(tx.amount).toLocaleString(undefined, { minimumFractionDigits: 2 })}</td>
                    <td className="py-4 px-4 text-right space-x-2">
                      <button
                        onClick={() => handleTransactionAction(tx, 'approve')}
                        disabled={processingId === tx.id}
                        className="px-3 py-1.5 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-white font-bold transition inline-flex items-center space-x-1"
                      >
                        {processingId === tx.id ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <CheckCircle2 className="w-3.5 h-3.5" />}
                        <span>Approve</span>
                      </button>
                      <button
                        onClick={() => handleTransactionAction(tx, 'reject')}
                        disabled={processingId === tx.id}
                        className="px-3 py-1.5 rounded-xl bg-red-500 hover:bg-red-400 text-white font-bold transition inline-flex items-center space-x-1"
                      >
                        <XCircle className="w-3.5 h-3.5" />
                        <span>Reject</span>
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

    </div>
  );
}