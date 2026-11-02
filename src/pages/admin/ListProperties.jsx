import React, { useState, useEffect } from 'react';
import { supabase } from '../../lib/supabaseClient';
import { Building2, Plus, Upload, Loader2, MapPin, CheckCircle2, AlertCircle, Edit3, Trash2, X, AlertTriangle } from 'lucide-react';
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

export default function ListProperties() {
  const [properties, setProperties] = useState([]);
  const [loading, setLoading] = useState(false);
  const [uploading, setUploading] = useState(false);

  const [editingId, setEditingId] = useState(null);
  const [deleteModalOpen, setDeleteModalOpen] = useState(false);
  const [propertyToDelete, setPropertyToDelete] = useState(null);
  const [deleteLoading, setDeleteLoading] = useState(false);

  // Form State
  const [title, setTitle] = useState('');
  const [location, setLocation] = useState('');
  const [description, setDescription] = useState('');
  const [targetAmount, setTargetAmount] = useState('');
  const [minInvestment, setMinInvestment] = useState('');
  const [roiPercentage, setRoiPercentage] = useState('');
  const [payoutFrequency, setPayoutFrequency] = useState('quarterly');
  const [status, setStatus] = useState('active');
  const [totalTokens, setTotalTokens] = useState('1000');
  const [privateSalesCount, setPrivateSalesCount] = useState('0');
  const [privateTokensSold, setPrivateTokensSold] = useState('0'); // <--- NEW: Private Tokens Sold State
  const [imageUrl, setImageUrl] = useState('');

  useEffect(() => {
    fetchProperties();
  }, []);

  const fetchProperties = async () => {
    const { data } = await supabase
      .from('properties')
      .select('*')
      .order('created_at', { ascending: false });

    if (data) setProperties(data);
  };

  const handleImageUpload = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setUploading(true);
    try {
      const fileExt = file.name.split('.').pop();
      const fileName = `prop-${Date.now()}.${fileExt}`;

      const { error: uploadError } = await supabase.storage
        .from('property-images')
        .upload(fileName, file, { upsert: true });

      if (uploadError) throw uploadError;

      const { data: publicUrlData } = supabase.storage
        .from('property-images')
        .getPublicUrl(fileName);

      setImageUrl(publicUrlData.publicUrl);
      showCustomToast("Image Uploaded", "Property photo successfully stored.");
    } catch (err) {
      console.error('Upload failed:', err.message);
      showCustomToast("Upload Error", err.message, "error");
    } finally {
      setUploading(false);
    }
  };

  const resetForm = () => {
    setTitle('');
    setLocation('');
    setDescription('');
    setTargetAmount('');
    setMinInvestment('');
    setRoiPercentage('');
    setPayoutFrequency('quarterly');
    setStatus('active');
    setTotalTokens('1000');
    setPrivateSalesCount('0');
    setPrivateTokensSold('0');
    setImageUrl('');
    setEditingId(null);
  };

  const handleStartEdit = (prop) => {
    setEditingId(prop.id);
    setTitle(prop.title || '');
    setLocation(prop.location || '');
    setDescription(prop.description || '');
    setTargetAmount(prop.target_amount || '');
    setMinInvestment(prop.min_investment || '');
    setRoiPercentage(prop.roi_percentage || '');
    setPayoutFrequency(prop.payout_frequency || 'quarterly');
    setStatus(prop.status || 'active');
    setTotalTokens(prop.total_tokens || '1000');
    setPrivateSalesCount(prop.private_sales_investors_count || '0');
    setPrivateTokensSold(prop.private_tokens_sold || '0');
    setImageUrl(prop.images?.[0] || '');
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleSubmitProperty = async (e) => {
    e.preventDefault();
    if (!title || !location || !targetAmount || !minInvestment || !roiPercentage || !totalTokens) {
      showCustomToast("Validation Error", "Please fill in all required fields.", "error");
      return;
    }

    setLoading(true);

    try {
      const tokensTotal = parseInt(totalTokens) || 1000;
      const pTokensSold = parseInt(privateTokensSold) || 0;
      
      // Compute publicly available tokens after subtracting private sales
      const calculatedAvailable = Math.max(0, tokensTotal - pTokensSold);

      const propertyData = {
        title,
        location,
        description,
        target_amount: parseFloat(targetAmount),
        min_investment: parseFloat(minInvestment),
        roi_percentage: parseFloat(roiPercentage),
        payout_frequency: payoutFrequency,
        status: status,
        total_tokens: tokensTotal,
        available_tokens: calculatedAvailable, // Sets public remaining tokens cleanly
        private_sales_investors_count: parseInt(privateSalesCount) || 0,
        private_tokens_sold: pTokensSold,
        images: imageUrl ? [imageUrl] : [],
      };

      if (editingId) {
        const { error } = await supabase
          .from('properties')
          .update(propertyData)
          .eq('id', editingId);

        if (error) throw error;
        showCustomToast("Property Updated", `"${title}" updated. Available tokens set to ${calculatedAvailable}.`);
      } else {
        const { error } = await supabase.from('properties').insert(propertyData);

        if (error) throw error;
        showCustomToast("Property Listed", `"${title}" is active. ${calculatedAvailable} tokens public.`);
      }

      resetForm();
      fetchProperties();
    } catch (err) {
      console.error('Failed to save property:', err.message);
      showCustomToast("Error", err.message, "error");
    } finally {
      setLoading(false);
    }
  };

  const confirmDelete = async () => {
    if (!propertyToDelete) return;
    setDeleteLoading(true);

    try {
      const { error } = await supabase
        .from('properties')
        .delete()
        .eq('id', propertyToDelete.id);

      if (error) throw error;

      showCustomToast("Property Deleted", `"${propertyToDelete.title}" deleted.`);
      setDeleteModalOpen(false);
      setPropertyToDelete(null);
      fetchProperties();
    } catch (err) {
      console.error('Delete failed:', err.message);
      showCustomToast("Deletion Error", err.message, "error");
    } finally {
      setDeleteLoading(false);
    }
  };

  return (
    <div className="space-y-10 font-sans p-4 max-w-8xl mx-auto">
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        
        {/* Form */}
        <div className="lg:col-span-5 bg-white dark:bg-[#0B1F4B] border border-slate-200 dark:border-slate-800 p-6 rounded-xl shadow-lg h-fit space-y-6">
          <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-4">
            <div className="flex items-center space-x-2">
              <Plus className={`w-5 h-5 ${editingId ? 'text-blue-500' : 'text-amber-500'}`} />
              <h3 className="text-sm font-bold text-slate-900 dark:text-white">
                {editingId ? 'Edit Property Deal' : 'List New Property Deal'}
              </h3>
            </div>
            {editingId && (
              <button onClick={resetForm} className="text-[10px] uppercase font-bold text-slate-400 hover:text-red-500 transition">
                Cancel Edit
              </button>
            )}
          </div>

          <form onSubmit={handleSubmitProperty} className="space-y-4">
            <div>
              <label className="block text-[10px] font-bold text-slate-400 uppercase mb-1">Property Title *</label>
              <input
                type="text"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="e.g. KiloHome Luxury Villa"
                className="w-full px-3.5 py-2.5 text-xs rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-[#10213B] text-slate-900 dark:text-white focus:outline-none focus:border-amber-500"
              />
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-[10px] font-bold text-slate-400 uppercase mb-1">Location *</label>
                <input
                  type="text"
                  value={location}
                  onChange={(e) => setLocation(e.target.value)}
                  placeholder="e.g. Umuahia, Nigeria"
                  className="w-full px-3.5 py-2.5 text-xs rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-[#10213B] text-slate-900 dark:text-white focus:outline-none focus:border-amber-500"
                />
              </div>
              <div>
                <label className="block text-[10px] font-bold text-slate-400 uppercase mb-1">Status</label>
                <select
                  value={status}
                  onChange={(e) => setStatus(e.target.value)}
                  className="w-full px-3.5 py-2.5 text-xs rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-[#10213B] text-slate-900 dark:text-white focus:outline-none focus:border-amber-500"
                >
                  <option value="active">Active</option>
                  <option value="upcoming">Upcoming</option>
                  <option value="fully_funded">Fully Funded</option>
                  <option value="completed">Completed</option>
                </select>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-[10px] font-bold text-slate-400 uppercase mb-1">Target Amount ($) *</label>
                <input
                  type="number"
                  value={targetAmount}
                  onChange={(e) => setTargetAmount(e.target.value)}
                  placeholder="500000"
                  className="w-full px-3.5 py-2.5 text-xs rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-[#10213B] text-slate-900 dark:text-white focus:outline-none focus:border-amber-500"
                />
              </div>
              <div>
                <label className="block text-[10px] font-bold text-slate-400 uppercase mb-1">Min Investment ($) *</label>
                <input
                  type="number"
                  value={minInvestment}
                  onChange={(e) => setMinInvestment(e.target.value)}
                  placeholder="1000"
                  className="w-full px-3.5 py-2.5 text-xs rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-[#10213B] text-slate-900 dark:text-white focus:outline-none focus:border-amber-500"
                />
              </div>
            </div>

            <div className="grid grid-cols-3 gap-2">
              <div>
                <label className="block text-[10px] font-bold text-slate-400 uppercase mb-1">ROI (%) *</label>
                <input
                  type="number"
                  step="0.1"
                  value={roiPercentage}
                  onChange={(e) => setRoiPercentage(e.target.value)}
                  placeholder="30"
                  className="w-full px-3 py-2.5 text-xs rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-[#10213B] text-slate-900 dark:text-white focus:outline-none focus:border-amber-500"
                />
              </div>
              <div>
                <label className="block text-[10px] font-bold text-slate-400 uppercase mb-1">Total Tokens *</label>
                <input
                  type="number"
                  value={totalTokens}
                  onChange={(e) => setTotalTokens(e.target.value)}
                  placeholder="1000"
                  className="w-full px-3 py-2.5 text-xs rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-[#10213B] text-slate-900 dark:text-white focus:outline-none focus:border-amber-500"
                />
              </div>
              <div>
                <label className="block text-[10px] font-bold text-slate-400 uppercase mb-1">Payout</label>
                <select
                  value={payoutFrequency}
                  onChange={(e) => setPayoutFrequency(e.target.value)}
                  className="w-full px-3 py-2.5 text-xs rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-[#10213B] text-slate-900 dark:text-white focus:outline-none focus:border-amber-500"
                >
                  <option value="quarterly">Quarterly</option>
                  <option value="bi-annual">Bi-annual</option>
                  <option value="annual">Annual</option>
                </select>
              </div>
            </div>

            {/* PRIVATE SALES INPUT SECTION */}
            <div className="grid grid-cols-2 gap-3 p-3 rounded-2xl bg-slate-50 dark:bg-[#071326] border border-slate-100 dark:border-slate-800">
              <div>
                <label className="block text-[10px] font-bold text-slate-400 uppercase mb-1">Private Sales Investors</label>
                <input
                  type="number"
                  value={privateSalesCount}
                  onChange={(e) => setPrivateSalesCount(e.target.value)}
                  placeholder="e.g. 40"
                  className="w-full px-3 py-2 text-xs rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-[#10213B] text-slate-900 dark:text-white focus:outline-none focus:border-amber-500"
                />
              </div>
              <div>
                <label className="block text-[10px] font-bold text-slate-400 uppercase mb-1">Private Tokens Sold</label>
                <input
                  type="number"
                  value={privateTokensSold}
                  onChange={(e) => setPrivateTokensSold(e.target.value)}
                  placeholder="e.g. 250"
                  className="w-full px-3 py-2 text-xs rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-[#10213B] text-slate-900 dark:text-white focus:outline-none focus:border-amber-500"
                />
              </div>
            </div>

            <div>
              <label className="block text-[10px] font-bold text-slate-400 uppercase mb-1">Description</label>
              <textarea
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="Brief details about the property investment..."
                rows="2"
                className="w-full px-3.5 py-2 text-xs rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-[#10213B] text-slate-900 dark:text-white focus:outline-none focus:border-amber-500 resize-none"
              />
            </div>

            <div>
              <label className="block text-[10px] font-bold text-slate-400 uppercase mb-1">Property Image</label>
              <label className="flex items-center justify-center space-x-2 w-full px-4 py-3 rounded-xl border border-dashed border-slate-300 dark:border-slate-700 bg-slate-50 dark:bg-[#10213B] cursor-pointer hover:border-amber-500 transition">
                {uploading ? (
                  <Loader2 className="w-4 h-4 animate-spin text-amber-500" />
                ) : (
                  <>
                    <Upload className="w-4 h-4 text-amber-500" />
                    <span className="text-xs text-slate-400">{imageUrl ? 'Photo Uploaded / Selected' : 'Upload Property Photo'}</span>
                  </>
                )}
                <input type="file" accept="image/*" onChange={handleImageUpload} disabled={uploading} className="hidden" />
              </label>
            </div>

            <button
              type="submit"
              disabled={loading || uploading}
              className={`w-full py-3.5 rounded-xl font-sans font-bold text-xs shadow-md transition flex items-center justify-center space-x-2 disabled:opacity-50 mt-2 ${
                editingId ? 'bg-blue-600 hover:bg-blue-500 text-white' : 'bg-amber-500 hover:bg-amber-400 text-[#0B1F4B]'
              }`}
            >
              {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <span>{editingId ? 'Save Changes' : 'Publish Property Deal'}</span>}
            </button>
          </form>
        </div>

        {/* Existing Property Inventory */}
        <div className="lg:col-span-7 space-y-4">
          <h3 className="text-sm font-bold text-slate-500 uppercase tracking-wider">Active Listings ({properties.length})</h3>
          {properties.map((prop) => (
            <div key={prop.id} className="p-4 bg-white dark:bg-[#0B1F4B] border border-slate-200 dark:border-slate-800 rounded-2xl flex items-center justify-between gap-4 shadow-sm">
              <div className="flex items-center space-x-3 truncate">
                <div className="w-14 h-14 rounded-xl bg-slate-800 overflow-hidden flex-shrink-0">
                  <img src={prop.images?.[0] || 'https://via.placeholder.com/150'} alt={prop.title} className="w-full h-full object-cover" />
                </div>
                <div className="truncate">
                  <h4 className="text-xs font-bold truncate text-slate-900 dark:text-white">{prop.title}</h4>
                  <p className="text-[11px] text-slate-400 flex items-center gap-1 mt-0.5">
                    <MapPin className="w-3 h-3 text-amber-500" /> {prop.location}
                  </p>
                  <span className="inline-block px-2 py-0.5 mt-1 rounded-full text-[9px] font-bold uppercase bg-slate-100 dark:bg-white/5 text-slate-400">
                    Public Left: {prop.available_tokens} / {prop.total_tokens}
                  </span>
                </div>
              </div>
              <div className="flex items-center space-x-2">
                <button onClick={() => handleStartEdit(prop)} className="p-2 rounded-xl bg-slate-100 dark:bg-white/10 hover:text-blue-500 text-slate-500 transition">
                  <Edit3 className="w-4 h-4" />
                </button>
                <button onClick={() => { setPropertyToDelete(prop); setDeleteModalOpen(true); }} className="p-2 rounded-xl bg-slate-100 dark:bg-white/10 hover:text-red-500 text-slate-500 transition">
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
            </div>
          ))}
        </div>

      </div>
    </div>
  );
}