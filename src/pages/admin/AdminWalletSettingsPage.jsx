import React, { useState, useEffect } from 'react';
import { supabase } from '../../lib/supabaseClient';
import { 
  Wallet, Save, Loader2, Plus, Coins, Network, Copy, CheckCircle2, AlertCircle 
} from 'lucide-react';
import { toast } from 'react-toastify';

const showCustomToast = (title, message, type = 'success') => {
  toast(
    <div className="flex items-start space-x-3 py-1">
      <div className={`p-2 rounded-xl flex-shrink-0 mt-0.5 ${
        type === 'success' ? 'bg-amber-500/10 text-[#D9A52E]' : 'bg-red-500/10 text-red-500'
      }`}>
        {type === 'success' ? <CheckCircle2 className="w-5 h-5" /> : <AlertCircle className="w-5 h-5" />}
      </div>
      <div>
        <h4 className="text-sm font-bold text-[#0B1F4B] dark:text-white">{title}</h4>
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

export default function AdminWalletSettingsPage() {
  const [wallets, setWallets] = useState([]);
  const [loading, setLoading] = useState(true);
  const [savingId, setSavingId] = useState(null);

  // Form state for adding/editing
  const [coinKey, setCoinKey] = useState('');
  const [coinName, setCoinName] = useState('');
  const [network, setNetwork] = useState('');
  const [address, setAddress] = useState('');
  const [isAddingNew, setIsAddingNew] = useState(false);

  useEffect(() => {
    fetchWalletAddresses();
  }, []);

  const fetchWalletAddresses = async () => {
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from('wallet_addresses')
        .select('*')
        .order('coin_name', { ascending: true });

      if (error) throw error;
      setWallets(data || []);
    } catch (err) {
      console.error(err);
      showCustomToast("Error", "Failed to fetch wallet addresses.", "error");
    } finally {
      setLoading(false);
    }
  };

  // Handle updating an existing wallet address inline
  const handleUpdateAddress = async (id, updatedAddress) => {
    setSavingId(id);
    try {
      const { error } = await supabase
        .from('wallet_addresses')
        .update({ 
          address: updatedAddress,
          updated_at: new Date().toISOString()
        })
        .eq('id', id);

      if (error) throw error;
      showCustomToast("Updated", "Wallet deposit address saved successfully.");
      fetchWalletAddresses();
    } catch (err) {
      console.error(err);
      showCustomToast("Update Failed", err.message, "error");
    } finally {
      setSavingId(null);
    }
  };

  // Handle adding a new coin network address
  const handleAddNewWallet = async (e) => {
    e.preventDefault();
    if (!coinKey || !coinName || !network || !address) {
      showCustomToast("Missing Fields", "Please fill in all required fields.", "error");
      return;
    }

    setSavingId('new');
    try {
      const { error } = await supabase
        .from('wallet_addresses')
        .insert({
          coin_key: coinKey.toLowerCase().trim(),
          coin_name: coinName.trim(),
          network: network.trim(),
          address: address.trim()
        });

      if (error) throw error;

      showCustomToast("Success", "New coin deposit address added successfully.");
      setCoinKey('');
      setCoinName('');
      setNetwork('');
      setAddress('');
      setIsAddingNew(false);
      fetchWalletAddresses();
    } catch (err) {
      console.error(err);
      showCustomToast("Add Failed", err.message || "Unique coin key constraint violation or database error.", "error");
    } finally {
      setSavingId(null);
    }
  };

  const handleCopy = (text) => {
    navigator.clipboard.writeText(text);
    showCustomToast("Copied", "Address copied to clipboard.");
  };

  return (
    <div className="space-y-6 sm:space-y-8 font-sans pb-16 max-w-5xl mx-auto p-4">
      
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl sm:text-2xl font-bold tracking-tight text-slate-900 dark:text-white">Deposit Wallet Management</h2>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
            Configure cryptocurrency wallet addresses displayed to investors when funding their accounts.
          </p>
        </div>

        <button
          onClick={() => setIsAddingNew(!isAddingNew)}
          className="inline-flex items-center justify-center space-x-2 px-4 py-2.5 rounded-xl bg-amber-500 hover:bg-amber-400 text-[#0B1F4B] text-xs font-bold shadow-lg transition flex-shrink-0"
        >
          <Plus className="w-4 h-4" />
          <span>{isAddingNew ? 'Cancel' : 'Add New Coin/Network'}</span>
        </button>
      </div>

      {/* Add New Wallet Form Modal / Card */}
      {isAddingNew && (
        <form onSubmit={handleAddNewWallet} className="bg-white dark:bg-[#0B1F4B] border border-amber-500/40 rounded-2xl sm:rounded-3xl p-6 shadow-xl space-y-4">
          <h3 className="text-sm font-bold text-slate-900 dark:text-white flex items-center gap-2">
            <Coins className="w-4 h-4 text-amber-500" /> Add New Deposit Coin & Network
          </h3>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div>
              <label className="block text-[10px] font-bold uppercase tracking-wider text-slate-400 mb-1">Coin Key (unique)</label>
              <input
                type="text"
                required
                placeholder="e.g. usdt_trc20"
                value={coinKey}
                onChange={(e) => setCoinKey(e.target.value)}
                className="w-full px-3 py-2 text-xs rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-[#10213B] focus:outline-none focus:border-amber-500"
              />
            </div>
            <div>
              <label className="block text-[10px] font-bold uppercase tracking-wider text-slate-400 mb-1">Coin Name</label>
              <input
                type="text"
                required
                placeholder="e.g. Tether USD"
                value={coinName}
                onChange={(e) => setCoinName(e.target.value)}
                className="w-full px-3 py-2 text-xs rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-[#10213B] focus:outline-none focus:border-amber-500"
              />
            </div>
            <div>
              <label className="block text-[10px] font-bold uppercase tracking-wider text-slate-400 mb-1">Network</label>
              <input
                type="text"
                required
                placeholder="e.g. TRC20"
                value={network}
                onChange={(e) => setNetwork(e.target.value)}
                className="w-full px-3 py-2 text-xs rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-[#10213B] focus:outline-none focus:border-amber-500"
              />
            </div>
          </div>

          <div>
            <label className="block text-[10px] font-bold uppercase tracking-wider text-slate-400 mb-1">Deposit Wallet Address</label>
            <input
              type="text"
              required
              placeholder="Paste wallet public address here..."
              value={address}
              onChange={(e) => setAddress(e.target.value)}
              className="w-full px-3 py-2 text-xs rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-[#10213B] font-mono focus:outline-none focus:border-amber-500"
            />
          </div>

          <div className="flex justify-end pt-2">
            <button
              type="submit"
              disabled={savingId === 'new'}
              className="px-6 py-2.5 rounded-xl bg-amber-500 text-[#0B1F4B] text-xs font-bold shadow hover:bg-amber-400 transition flex items-center space-x-2"
            >
              {savingId === 'new' ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
              <span>Save Wallet</span>
            </button>
          </div>
        </form>
      )}

      {/* Wallets List */}
      {loading ? (
        <div className="flex justify-center py-20"><Loader2 className="w-8 h-8 animate-spin text-amber-500" /></div>
      ) : wallets.length === 0 ? (
        <div className="bg-white dark:bg-[#0B1F4B] rounded-2xl p-12 text-center text-xs text-slate-400 border border-slate-200 dark:border-slate-800">
          No wallet addresses configured yet. Click "Add New Coin/Network" above to get started.
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-4">
          {wallets.map((wallet) => (
            <WalletCard 
              key={wallet.id} 
              wallet={wallet} 
              onSave={handleUpdateAddress} 
              saving={savingId === wallet.id}
              onCopy={handleCopy}
            />
          ))}
        </div>
      )}

    </div>
  );
}

// Sub-component for individual wallet card item to manage local address input state
function WalletCard({ wallet, onSave, saving, onCopy }) {
  const [addressInput, setAddressInput] = useState(wallet.address);
  const [isChanged, setIsChanged] = useState(false);

  useEffect(() => {
    setAddressInput(wallet.address);
    setIsChanged(false);
  }, [wallet.address]);

  return (
    <div className="bg-white dark:bg-[#0B1F4B] border border-slate-200 dark:border-slate-800 rounded-2xl sm:rounded-3xl p-5 sm:p-6 shadow-sm space-y-4">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-slate-100 dark:border-slate-800 pb-3">
        <div className="flex items-center space-x-3">
          <div className="w-10 h-10 rounded-xl bg-amber-500/10 text-amber-500 flex items-center justify-center font-bold text-sm">
            <Wallet className="w-5 h-5" />
          </div>
          <div>
            <h4 className="text-sm font-bold text-slate-900 dark:text-white flex items-center gap-2">
              {wallet.coin_name} <span className="text-[10px] px-2 py-0.5 rounded-full bg-slate-100 dark:bg-white/10 font-mono uppercase text-amber-500">{wallet.coin_key}</span>
            </h4>
            <p className="text-[11px] text-slate-400 flex items-center gap-1 mt-0.5">
              <Network className="w-3 h-3 text-emerald-500" /> Network: <span className="font-bold text-slate-600 dark:text-slate-300">{wallet.network}</span>
            </p>
          </div>
        </div>

        <span className="text-[10px] text-slate-400">
          Last updated: {wallet.updated_at ? new Date(wallet.updated_at).toLocaleString() : 'N/A'}
        </span>
      </div>

      <div className="space-y-2">
        <label className="block text-[10px] font-bold uppercase tracking-wider text-slate-400">Deposit Address</label>
        <div className="flex items-center gap-2">
          <input
            type="text"
            value={addressInput}
            onChange={(e) => {
              setAddressInput(e.target.value);
              setIsChanged(e.target.value !== wallet.address);
            }}
            className="flex-1 px-3.5 py-2.5 text-xs rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-[#10213B] font-mono focus:outline-none focus:border-amber-500 text-slate-900 dark:text-white"
          />
          <button
            type="button"
            onClick={() => onCopy(wallet.address)}
            className="p-2.5 rounded-xl bg-slate-100 dark:bg-white/10 hover:bg-slate-200 dark:hover:bg-white/20 text-slate-600 dark:text-slate-300 transition"
            title="Copy address"
          >
            <Copy className="w-4 h-4" />
          </button>
          
          {isChanged && (
            <button
              type="button"
              disabled={saving}
              onClick={() => onSave(wallet.id, addressInput)}
              className="px-4 py-2.5 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-white font-bold text-xs shadow transition flex items-center space-x-1.5 flex-shrink-0"
            >
              {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
              <span>Update</span>
            </button>
          )}
        </div>
      </div>
    </div>
  );
}