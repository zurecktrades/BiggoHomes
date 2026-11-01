import React, { useState, useEffect } from 'react';
import { supabase } from '../../lib/supabaseClient';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Users, Shield, ShieldAlert, Trash2, Ban, CheckCircle, 
  Search, Loader2, AlertTriangle, X, Mail, Phone, DollarSign, Calendar 
} from 'lucide-react';
import { toast } from 'react-toastify';

export default function AdminUsersPage() {
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');

  // Modal State
  const [selectedUser, setSelectedUser] = useState(null);
  const [modalType, setModalType] = useState(null); // 'ban' | 'delete' | 'details'
  const [actionLoading, setActionLoading] = useState(false);

  useEffect(() => {
    fetchUsers();
  }, []);

  const fetchUsers = async () => {
    setLoading(true);
    try {
      // Fetch ONLY accounts where role is explicitly 'client' (excluding admins)
      const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .eq('role', 'investor')
        .order('created_at', { ascending: false });

      if (error) throw error;
      setUsers(data || []);
    } catch (err) {
      console.error(err);
      toast.error('Failed to load investors.');
    } finally {
      setLoading(false);
    }
  };

  // Handle Ban / Suspend Status Toggle
  const handleToggleBan = async () => {
    if (!selectedUser) return;
    setActionLoading(true);

    const newStatus = selectedUser.status === 'banned' ? 'active' : 'banned';

    try {
      const { error } = await supabase
        .from('profiles')
        .update({ status: newStatus })
        .eq('id', selectedUser.id);

      if (error) throw error;

      toast.success(`User account has been ${newStatus === 'banned' ? 'suspended/banned' : 'reactivated'}.`);
      setUsers(users.map(u => u.id === selectedUser.id ? { ...u, status: newStatus } : u));
      closeModal();
    } catch (err) {
      console.error(err);
      toast.error('Failed to update account status.');
    } finally {
      setActionLoading(false);
    }
  };

  // Handle Complete Data Deletion from Database
  const handleDeleteUser = async () => {
    if (!selectedUser) return;
    setActionLoading(true);

    try {
      // Due to ON DELETE CASCADE on foreign keys, deleting from profiles or auth will clear records
      const { error } = await supabase
        .from('profiles')
        .delete()
        .eq('id', selectedUser.id);

      if (error) throw error;

      toast.success('Investor account and database records permanently deleted.');
      setUsers(users.filter(u => u.id !== selectedUser.id));
      closeModal();
    } catch (err) {
      console.error(err);
      toast.error('Failed to delete user data from database.');
    } finally {
      setActionLoading(false);
    }
  };

  const openModal = (user, type) => {
    setSelectedUser(user);
    setModalType(type);
  };

  const closeModal = () => {
    setSelectedUser(null);
    setModalType(null);
  };

  const filteredUsers = users.filter(u => 
    (u.full_name?.toLowerCase() || '').includes(searchQuery.toLowerCase()) ||
    (u.role?.toLowerCase() || '').includes(searchQuery.toLowerCase()) ||
    (u.kyc_status?.toLowerCase() || '').includes(searchQuery.toLowerCase())
  );

  return (
    <div className="space-y-6 font-sans pb-12 p-4 max-w-8xl mx-auto">
      
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-2xl font-bold tracking-tight text-slate-900 dark:text-white">Investor Management</h2>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
            Manage registered platform investors, inspect balances, suspend accounts, or purge database records.
          </p>
        </div>

        {/* Search Bar */}
        <div className="relative w-full sm:w-72">
          <Search className="absolute left-3.5 top-3 w-4 h-4 text-slate-400" />
          <input
            type="text"
            placeholder="Search investors..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-10 pr-4 py-2.5 text-xs rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-[#0B1F4B] text-slate-900 dark:text-white focus:outline-none focus:border-amber-500"
          />
        </div>
      </div>

      {/* Users Table */}
      <div className="bg-white dark:bg-[#0B1F4B] border border-slate-200 dark:border-slate-800 rounded-3xl shadow-sm overflow-hidden">
        {loading ? (
          <div className="flex justify-center py-20"><Loader2 className="w-8 h-8 animate-spin text-amber-500" /></div>
        ) : filteredUsers.length === 0 ? (
          <div className="text-center py-20 text-slate-400 text-xs">No investors found matching your search.</div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead>
                <tr className="bg-slate-50 dark:bg-white/5 text-[10px] font-bold uppercase tracking-wider text-slate-400 border-b border-slate-200 dark:border-slate-800">
                  <th className="py-3.5 px-6">Investor Name</th>
                  <th className="py-3.5 px-4">Role & Status</th>
                  <th className="py-3.5 px-4">KYC State</th>
                  <th className="py-3.5 px-4">Wallet Balance</th>
                  <th className="py-3.5 px-4">Joined Date</th>
                  <th className="py-3.5 px-6 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                {filteredUsers.map((u) => (
                  <tr key={u.id} className="hover:bg-slate-50 dark:hover:bg-white/5 transition">
                    <td className="py-4 px-6 font-bold text-slate-900 dark:text-white">
                      <div className="flex items-center space-x-3">
                        <div className="w-8 h-8 rounded-full bg-amber-500/10 text-amber-500 flex items-center justify-center font-bold text-xs uppercase">
                          {(u.full_name || 'U')[0]}
                        </div>
                        <div>
                          <div>{u.full_name || 'Unnamed Investor'}</div>
                          <div className="text-[10px] font-normal text-slate-400">{u.phone || 'No phone added'}</div>
                        </div>
                      </div>
                    </td>
                    <td className="py-4 px-4">
                      <div className="flex items-center space-x-1.5">
                        <span className={`px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase ${
                          u.role === 'admin' ? 'bg-purple-500/10 text-purple-500 border border-purple-500/20' : 'bg-blue-500/10 text-blue-500 border border-blue-500/20'
                        }`}>
                          {u.role || 'client'}
                        </span>
                        <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold uppercase ${
                          u.status === 'banned' ? 'bg-red-500/10 text-red-500' : 'bg-emerald-500/10 text-emerald-500'
                        }`}>
                          {u.status || 'active'}
                        </span>
                      </div>
                    </td>
                    <td className="py-4 px-4">
                      <span className={`px-2.5 py-1 rounded-full text-[10px] font-bold uppercase ${
                        u.kyc_status === 'verified' ? 'bg-emerald-500/10 text-emerald-500' :
                        u.kyc_status === 'pending' ? 'bg-amber-500/10 text-amber-500' : 'bg-slate-500/10 text-slate-400'
                      }`}>
                        {u.kyc_status || 'unverified'}
                      </span>
                    </td>
                    <td className="py-4 px-4 font-bold text-slate-900 dark:text-white">
                      ${(u.account_balance || 0).toLocaleString(undefined, { minimumFractionDigits: 2 })}
                    </td>
                    <td className="py-4 px-4 text-slate-500">
                      {new Date(u.created_at).toLocaleDateString()}
                    </td>
                    <td className="py-4 px-6 text-right space-x-2">
                      <button
                        onClick={() => openModal(u, 'details')}
                        className="px-3 py-1.5 rounded-xl bg-slate-100 dark:bg-white/10 hover:bg-slate-200 text-slate-700 dark:text-slate-200 font-bold transition"
                      >
                        Details
                      </button>
                      <button
                        onClick={() => openModal(u, 'ban')}
                        className={`px-3 py-1.5 rounded-xl font-bold transition ${
                          u.status === 'banned' ? 'bg-emerald-500/10 text-emerald-500 hover:bg-emerald-500/20' : 'bg-amber-500/10 text-amber-500 hover:bg-amber-500/20'
                        }`}
                      >
                        {u.status === 'banned' ? 'Unban' : 'Ban'}
                      </button>
                      <button
                        onClick={() => openModal(u, 'delete')}
                        className="px-3 py-1.5 rounded-xl bg-red-500/10 hover:bg-red-500/20 text-red-500 font-bold transition"
                      >
                        Delete
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* CONFIRMATION & DETAILS MODALS */}
      <AnimatePresence>
        {modalType && selectedUser && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="bg-white dark:bg-[#0B1F4B] border border-slate-200 dark:border-slate-800 rounded-3xl p-6 max-w-md w-full shadow-2xl space-y-5"
            >
              
              {/* MODAL 1: BAN / SUSPEND CONFIRMATION */}
              {modalType === 'ban' && (
                <>
                  <div className="flex items-center space-x-3 text-amber-500">
                    <div className="p-3 rounded-2xl bg-amber-500/10">
                      <Ban className="w-6 h-6" />
                    </div>
                    <div>
                      <h3 className="text-base font-bold text-slate-900 dark:text-white">
                        {selectedUser.status === 'banned' ? 'Reactivate Investor Account?' : 'Suspend Investor Account?'}
                      </h3>
                      <p className="text-xs text-slate-400">User: {selectedUser.full_name || 'Investor'}</p>
                    </div>
                  </div>
                  <p className="text-xs text-slate-500 dark:text-slate-300 leading-relaxed">
                    {selectedUser.status === 'banned' 
                      ? 'Reactivating this user will restore their access to the BiggoHomes client portal and investment dashboard.'
                      : 'Suspending this user will restrict their ability to log in, deposit funds, or trade fractional assets.'}
                  </p>
                  <div className="flex justify-end space-x-3 pt-2">
                    <button
                      onClick={closeModal}
                      disabled={actionLoading}
                      className="px-4 py-2.5 rounded-xl bg-slate-100 dark:bg-white/10 text-slate-700 dark:text-slate-300 text-xs font-bold transition"
                    >
                      Cancel
                    </button>
                    <button
                      onClick={handleToggleBan}
                      disabled={actionLoading}
                      className="px-5 py-2.5 rounded-xl bg-amber-500 hover:bg-amber-400 text-[#0B1F4B] text-xs font-bold transition flex items-center space-x-2"
                    >
                      {actionLoading && <Loader2 className="w-3.5 h-3.5 animate-spin" />}
                      <span>Confirm {selectedUser.status === 'banned' ? 'Reactivation' : 'Suspension'}</span>
                    </button>
                  </div>
                </>
              )}

              {/* MODAL 2: PERMANENT DATABASE DELETION */}
              {modalType === 'delete' && (
                <>
                  <div className="flex items-center space-x-3 text-red-500">
                    <div className="p-3 rounded-2xl bg-red-500/10">
                      <AlertTriangle className="w-6 h-6" />
                    </div>
                    <div>
                      <h3 className="text-base font-bold text-slate-900 dark:text-white">Delete Investor Permanently?</h3>
                      <p className="text-xs text-slate-400">User: {selectedUser.full_name || 'Investor'}</p>
                    </div>
                  </div>
                  <p className="text-xs text-slate-500 dark:text-slate-300 leading-relaxed">
                    This action is <strong>irreversible</strong>. It will completely purge this investor's profile data, transaction history, KYC documents, and active property investments from the database.
                  </p>
                  <div className="flex justify-end space-x-3 pt-2">
                    <button
                      onClick={closeModal}
                      disabled={actionLoading}
                      className="px-4 py-2.5 rounded-xl bg-slate-100 dark:bg-white/10 text-slate-700 dark:text-slate-300 text-xs font-bold transition"
                    >
                      Cancel
                    </button>
                    <button
                      onClick={handleDeleteUser}
                      disabled={actionLoading}
                      className="px-5 py-2.5 rounded-xl bg-red-500 hover:bg-red-400 text-white text-xs font-bold transition flex items-center space-x-2"
                    >
                      {actionLoading && <Loader2 className="w-3.5 h-3.5 animate-spin" />}
                      <span>Permanently Delete</span>
                    </button>
                  </div>
                </>
              )}

              {/* MODAL 3: DETAILED VIEW */}
              {modalType === 'details' && (
                <>
                  <div className="flex items-center justify-between border-b border-slate-200 dark:border-slate-800 pb-3">
                    <h3 className="text-base font-bold text-slate-900 dark:text-white">Investor Profile Details</h3>
                    <button onClick={closeModal} className="p-1 rounded-lg text-slate-400 hover:text-white">
                      <X className="w-5 h-5" />
                    </button>
                  </div>

                  <div className="space-y-3 text-xs">
                    <div className="p-3 rounded-2xl bg-slate-50 dark:bg-[#071326] space-y-2">
                      <div className="flex justify-between"><span className="text-slate-400">Full Name:</span> <span className="font-bold text-slate-900 dark:text-white">{selectedUser.full_name || 'N/A'}</span></div>
                      <div className="flex justify-between"><span className="text-slate-400">Phone Number:</span> <span className="font-bold text-slate-900 dark:text-white">{selectedUser.phone || 'N/A'}</span></div>
                      <div className="flex justify-between"><span className="text-slate-400">Role:</span> <span className="font-bold uppercase text-amber-500">{selectedUser.role || 'client'}</span></div>
                      <div className="flex justify-between"><span className="text-slate-400">KYC Status:</span> <span className="font-bold uppercase text-emerald-500">{selectedUser.kyc_status || 'unverified'}</span></div>
                    </div>

                    <div className="grid grid-cols-2 gap-3">
                      <div className="p-3 rounded-2xl bg-emerald-500/10 border border-emerald-500/20">
                        <span className="text-[10px] text-emerald-600 font-bold uppercase">Account Balance</span>
                        <div className="text-base font-bold text-emerald-500 mt-1">${(selectedUser.account_balance || 0).toLocaleString(undefined, { minimumFractionDigits: 2 })}</div>
                      </div>
                      <div className="p-3 rounded-2xl bg-amber-500/10 border border-amber-500/20">
                        <span className="text-[10px] text-amber-600 font-bold uppercase">Total Deposited</span>
                        <div className="text-base font-bold text-amber-500 mt-1">${(selectedUser.total_deposited || 0).toLocaleString(undefined, { minimumFractionDigits: 2 })}</div>
                      </div>
                    </div>
                  </div>

                  <div className="flex justify-end pt-2">
                    <button
                      onClick={closeModal}
                      className="px-5 py-2 rounded-xl bg-slate-100 dark:bg-white/10 text-slate-700 dark:text-slate-300 text-xs font-bold transition"
                    >
                      Close
                    </button>
                  </div>
                </>
              )}

            </motion.div>
          </div>
        )}
      </AnimatePresence>

    </div>
  );
}