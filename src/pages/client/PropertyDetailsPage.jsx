import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { supabase } from '../../lib/supabaseClient';
import { useAuthStore } from '../../store/useAuthStore';
import { ArrowLeft, MapPin, Calculator, Loader2, CheckCircle2, Plus, Minus, Wallet, Users } from 'lucide-react';
import { toast } from 'react-toastify';

export default function PropertyDetailsPage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { user, profile, fetchProfile } = useAuthStore();

  const [property, setProperty] = useState(null);
  const [tokenCount, setTokenCount] = useState(1);
  const [totalInvestorsCount, setTotalInvestorsCount] = useState(0);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    fetchPropertyDetails();
  }, [id]);

  const fetchPropertyDetails = async () => {
    setLoading(true);
    const { data, error } = await supabase
      .from('properties')
      .select('*')
      .eq('id', id)
      .single();

    if (!error && data) {
      setProperty(data);

      // Calculate total unique online investors + private sales baseline
      const { data: investData } = await supabase
        .from('investments')
        .select('user_id')
        .eq('property_id', id);

      const uniqueOnlineInvestors = new Set(investData?.map(i => i.user_id) || []).size;
      const combinedInvestors = (data.private_sales_investors_count || 0) + uniqueOnlineInvestors;
      setTotalInvestorsCount(combinedInvestors);
    } else {
      toast.error('Failed to load property details.');
      navigate('/properties');
    }
    setLoading(false);
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <Loader2 className="w-8 h-8 animate-spin text-amber-500" />
      </div>
    );
  }

  if (!property) return null;

  const tokenPrice = property.total_tokens > 0 ? property.target_amount / property.total_tokens : 0;
  const totalInvestment = tokenCount * tokenPrice;
  const estimatedReturn = (totalInvestment * (property.roi_percentage / 100)).toFixed(2);
  const userBalance = profile?.account_balance || 0;

  const handleConfirmInvestment = async () => {
    if (!user) {
      toast.error('Please log in to complete an investment.');
      return;
    }

    if (tokenCount > property.available_tokens) {
      toast.error('Not enough fractions available for purchase.');
      return;
    }

    if (userBalance < totalInvestment) {
      toast.error(`Insufficient balance. You need $${totalInvestment.toLocaleString()} but have $${userBalance.toLocaleString()}.`);
      return;
    }

    setSubmitting(true);

    try {
      // 1. Insert into investments
      const { error: investError } = await supabase.from('investments').insert({
        user_id: user.id,
        property_id: property.id,
        tokens_purchased: tokenCount,
        total_amount: totalInvestment,
      });
      if (investError) throw investError;

      // 2. Log in transactions ledger
      await supabase.from('transactions').insert({
        user_id: user.id,
        type: 'investment',
        amount: totalInvestment,
        description: `Purchased ${tokenCount} fraction(s) in ${property.title}`,
        reference_id: `INV-${Date.now().toString().slice(-6)}`
      });

      // 3. Deduct wallet balance
      const updatedBalance = userBalance - totalInvestment;
      const { error: profileError } = await supabase
        .from('profiles')
        .update({ account_balance: updatedBalance })
        .eq('id', user.id);
      if (profileError) throw profileError;

      // 4. Update available tokens & funded amount
      const newAvailable = property.available_tokens - tokenCount;
      const newFundedAmount = (property.funded_amount || 0) + totalInvestment;

      const { error: propError } = await supabase
        .from('properties')
        .update({
          available_tokens: newAvailable,
          funded_amount: newFundedAmount,
          status: newAvailable === 0 ? 'fully_funded' : property.status,
        })
        .eq('id', property.id);
      if (propError) throw propError;

      toast.success("Investment confirmed successfully!");
      if (fetchProfile) fetchProfile();
      fetchPropertyDetails();
    } catch (err) {
      console.error(err);
      toast.error('Failed to complete transaction.');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="max-w-6xl mx-auto space-y-6 font-sans pb-12 p-4">
      <button onClick={() => navigate(-1)} className="flex items-center space-x-2 px-4 py-2 rounded-xl bg-slate-100 dark:bg-white/5 text-xs font-bold transition">
        <ArrowLeft className="w-4 h-4" />
        <span>Back to Marketplace</span>
      </button>

      <div className="bg-white dark:bg-[#0B1F4B] border border-slate-200 dark:border-slate-800 rounded-3xl shadow-xl overflow-hidden grid grid-cols-1 lg:grid-cols-12">
        <div className="lg:col-span-7 relative bg-slate-900 min-h-[300px] flex flex-col justify-between p-6">
          <img src={property.images?.[0]} alt={property.title} className="absolute inset-0 w-full h-full object-cover" />
          <div className="absolute inset-0 bg-gradient-to-t from-[#0B1F4B] via-black/40 to-transparent" />
          <div className="relative z-15 flex justify-between">
            <span className="px-3 py-1 rounded-full text-xs font-bold bg-amber-500 text-[#0B1F4B]">{property.roi_percentage}% ROI</span>
            <span className="px-3 py-1 rounded-full text-xs font-bold bg-slate-900/80 text-white flex items-center gap-1">
              <Users className="w-3.5 h-3.5 text-amber-400" /> {totalInvestorsCount} Investors
            </span>
          </div>
          <div className="relative z-10 text-white space-y-2">
            <h1 className="text-2xl font-bold">{property.title}</h1>
            <p className="text-xs flex items-center gap-1"><MapPin className="w-4 h-4 text-amber-400" /> {property.location}</p>
          </div>
        </div>

        <div className="lg:col-span-5 p-8 flex flex-col justify-between space-y-4">
          <div className="space-y-3">
            <div className="flex justify-between text-xs font-bold text-amber-500">
              <span>Fraction Price: ${tokenPrice.toFixed(2)}</span>
              <span>Available: {property.available_tokens} tokens</span>
            </div>
            <div className="flex items-center justify-between bg-slate-50 dark:bg-[#071326] p-3 rounded-2xl">
              <button onClick={() => setTokenCount(Math.max(1, tokenCount - 1))} className="p-2 bg-slate-200 dark:bg-white/10 rounded-xl"><Minus className="w-4 h-4" /></button>
              <span className="font-bold">{tokenCount}</span>
              <button onClick={() => setTokenCount(tokenCount + 1)} className="p-2 bg-slate-200 dark:bg-white/10 rounded-xl"><Plus className="w-4 h-4" /></button>
            </div>
            <div className="text-xs space-y-1 pt-2 border-t">
              <div className="flex justify-between"><span>Total Outlay:</span><span className="font-bold">${totalInvestment.toLocaleString()}</span></div>
              <div className="flex justify-between"><span>Est. Return:</span><span className="font-bold text-emerald-500">+${estimatedReturn}</span></div>
            </div>
          </div>
          <button onClick={handleConfirmInvestment} disabled={submitting} className="w-full py-4 rounded-2xl bg-amber-500 text-[#0B1F4B] font-bold text-sm shadow-xl hover:opacity-90 transition">
            {submitting ? <Loader2 className="w-5 h-5 animate-spin mx-auto" /> : 'Confirm Purchase'}
          </button>
        </div>
      </div>
    </div>
  );
}