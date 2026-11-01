import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { supabase } from '../../lib/supabaseClient';
import { useAuthStore } from '../../store/useAuthStore';
import { 
  ArrowLeft, MapPin, ShieldCheck, Calculator, Loader2, 
  CheckCircle2, Plus, Minus, Wallet, AlertCircle 
} from 'lucide-react';
import { toast } from 'react-toastify';

export default function PropertyDetailsPage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { user, profile, fetchProfile } = useAuthStore(); // Ensure profile fetching is available

  const [property, setProperty] = useState(null);
  const [tokenCount, setTokenCount] = useState(1);
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
    } else {
      toast.error('Failed to load property details.');
      navigate('/properties-listing');
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

  // Derived financial metrics
  const tokenPrice = property.total_tokens > 0 ? property.target_amount / property.total_tokens : 0;
  
  const fundedPercentage = property.target_amount > 0 && property.funded_amount !== undefined
    ? Math.round((property.funded_amount / property.target_amount) * 100)
    : Math.round(((property.total_tokens - property.available_tokens) / property.total_tokens) * 100);

  const totalInvestment = tokenCount * tokenPrice;
  const estimatedReturn = (totalInvestment * (property.roi_percentage / 100)).toFixed(2);
  const userBalance = profile?.account_balance || 0;

  const handleIncrement = () => {
    if (tokenCount < property.available_tokens) {
      setTokenCount((prev) => prev + 1);
    }
  };

  const handleDecrement = () => {
    if (tokenCount > 1) {
      setTokenCount((prev) => prev - 1);
    }
  };

  const handleConfirmInvestment = async () => {
    if (!user) {
      toast.error('Please log in to complete an investment.');
      return;
    }

    if (tokenCount > property.available_tokens) {
      toast.error('Not enough fractions available for purchase.');
      return;
    }

    // Balance check
    if (userBalance < totalInvestment) {
      toast.error(
        `Insufficient balance. You need $${totalInvestment.toLocaleString()} but have $${userBalance.toLocaleString()}.`
      );
      return;
    }

    setSubmitting(true);

    try {
      // 1. Insert transaction record into investments table
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
      });

      // 3. Deduct amount from user's account_balance
      const updatedBalance = userBalance - totalInvestment;
      const { error: profileError } = await supabase
        .from('profiles')
        .update({ account_balance: updatedBalance })
        .eq('id', user.id);

      if (profileError) throw profileError;

      // 4. Update property tokens and funded_amount
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

      toast.success(
        <div className="flex items-start space-x-3 py-1">
          <CheckCircle2 className="w-5 h-5 text-amber-500 flex-shrink-0 mt-0.5" />
          <div>
            <h4 className="text-xs font-bold text-[#0B1F4B] dark:text-white">Investment Confirmed!</h4>
            <p className="text-[11px] text-slate-500 dark:text-slate-300">
              Purchased {tokenCount} fraction(s) in {property.title}. Remaining balance: ${updatedBalance.toLocaleString()}.
            </p>
          </div>
        </div>
      );

      // Refresh store profile balance and current deal data
      if (fetchProfile) fetchProfile();
      fetchPropertyDetails();
    } catch (err) {
      console.error('Investment error:', err.message);
      toast.error('Failed to complete transaction.');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="max-w-6xl mx-auto space-y-6 font-sans pb-12 max-w-8xl p-4">
      
      {/* Top Navigation & User Wallet Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <button
          onClick={() => navigate(-1)}
          className="flex items-center space-x-2 px-4 py-2 rounded-xl bg-slate-100 dark:bg-white/5 hover:bg-amber-500 hover:text-[#0B1F4B] text-xs font-bold transition duration-200 w-fit"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>Go Back to Marketplace</span>
        </button>

        {/* User Balance Badge */}
        <div className="flex items-center space-x-2 px-4 py-2 rounded-xl bg-amber-500/10 border border-amber-500/20 text-amber-500 w-fit">
          <Wallet className="w-4 h-4" />
          <span className="text-xs font-bold">
            Available Wallet: ${userBalance.toLocaleString(undefined, { minimumFractionDigits: 2 })}
          </span>
        </div>
      </div>

      {/* Main Property Card */}
      <div className="bg-white dark:bg-[#0B1F4B] border border-slate-200 dark:border-slate-800 rounded-3xl shadow-xl overflow-hidden grid grid-cols-1 lg:grid-cols-12">
        
        {/* Left Column: Image Showcase */}
        <div className="lg:col-span-7 relative bg-slate-900 min-h-[280px] lg:min-h-[350px] flex flex-col justify-between p-6">
          <img
            src={property.images?.[0] || 'https://images.unsplash.com/photo-1600596542815-ffad4c1539a9?auto=format&fit=crop&w=1200&q=80'}
            alt={property.title}
            className="absolute inset-0 w-full h-full object-cover"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-[#0B1F4B] via-black/40 to-transparent opacity-90" />

          <div className="relative z-10 flex justify-between items-start">
            <span className="px-3.5 py-1.5 rounded-full text-[11px] font-bold uppercase tracking-wider bg-amber-500 text-[#0B1F4B] shadow-md">
              {property.roi_percentage}% Projected ROI
            </span>
          </div>

          <div className="relative z-10 text-white space-y-2">
            <h1 className="text-2xl sm:text-3xl font-sans font-bold tracking-tight">{property.title}</h1>
            <p className="text-xs text-slate-300 flex items-center gap-1.5">
              <MapPin className="w-4 h-4 text-amber-400 flex-shrink-0" />
              <span>{property.location}</span>
            </p>
            {property.description && (
              <p className="text-xs text-slate-300/80 pt-2 line-clamp-3">
                {property.description}
              </p>
            )}
          </div>
        </div>

        {/* Right Column: Calculations & Controls */}
        <div className="lg:col-span-5  flex flex-col gap-6 p-8 space-y-2">
          
          <div className="grid grid-cols-2 gap-3">
            <div className="p-4 rounded-2xl bg-slate-50 dark:bg-[#071326]/60 border border-slate-200 dark:border-slate-800">
              <p className="text-[10px] font-bold text-slate-400 uppercase">Target Amount</p>
              <p className="text-base sm:text-lg font-bold text-amber-500 mt-1">
                ${property.target_amount?.toLocaleString()}
              </p>
            </div>
            <div className="p-4 rounded-2xl bg-slate-50 dark:bg-[#071326]/60 border border-slate-200 dark:border-slate-800">
              <p className="text-[10px] font-bold text-slate-400 uppercase">Fraction Price</p>
              <p className="text-base sm:text-lg font-bold text-slate-900 dark:text-white mt-1">
                ${tokenPrice.toFixed(2)}
              </p>
            </div>
          </div>

          <div className="p-5 rounded-2xl bg-amber-500/10 border border-amber-500/20 space-y-4">
            <div className="flex items-center justify-between text-xs font-bold text-amber-500 border-b border-amber-500/20 pb-2">
              <span className="flex items-center space-x-2">
                <Calculator className="w-4 h-4" />
                <span>Select Investment Quantity</span>
              </span>
              <span className="text-[10px] text-slate-400">Min: ${property.min_investment}</span>
            </div>

            <div className="flex items-center justify-between">
              <span className="text-xs text-slate-400">Fractions to Buy:</span>
              
              <div className="flex items-center space-x-3 bg-white dark:bg-[#071326] border border-slate-200 dark:border-slate-700 p-1 rounded-2xl shadow-inner">
                <button
                  type="button"
                  onClick={handleDecrement}
                  disabled={tokenCount <= 1}
                  className="w-9 h-9 rounded-xl bg-slate-100 dark:bg-white/5 hover:bg-amber-500 hover:text-[#0B1F4B] flex items-center justify-center transition disabled:opacity-30 disabled:hover:bg-transparent"
                >
                  <Minus className="w-4 h-4" />
                </button>

                <span className="w-12 text-center text-sm font-sans font-bold text-slate-900 dark:text-white">
                  {tokenCount}
                </span>

                <button
                  type="button"
                  onClick={handleIncrement}
                  disabled={tokenCount >= property.available_tokens}
                  className="w-9 h-9 rounded-xl bg-slate-100 dark:bg-white/5 hover:bg-amber-500 hover:text-[#0B1F4B] flex items-center justify-center transition disabled:opacity-30 disabled:hover:bg-transparent"
                >
                  <Plus className="w-4 h-4" />
                </button>
              </div>
            </div>

            <div className="space-y-1.5 pt-2 border-t border-amber-500/20 text-xs">
              <div className="flex justify-between">
                <span className="text-slate-400">Total Outlay:</span>
                <span className="font-sans font-bold text-slate-900 dark:text-white">${totalInvestment.toLocaleString(undefined, { minimumFractionDigits: 2 })}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-400">Est. Return ({property.payout_frequency}):</span>
                <span className="font-sans font-bold text-emerald-500">+${estimatedReturn}</span>
              </div>
            </div>
          </div>

          <button
            onClick={handleConfirmInvestment}
            disabled={submitting || property.available_tokens === 0}
            className="w-full py-4 rounded-2xl bg-[#0B1F4B] dark:bg-[#D9A52E] text-white dark:text-[#0B1F4B] font-sans font-bold text-sm shadow-xl hover:opacity-90 transition flex items-center justify-center space-x-2 disabled:opacity-50"
          >
            {submitting ? (
              <Loader2 className="w-5 h-5 animate-spin" />
            ) : (
              <>
                <span>Confirm Purchase</span>
              </>
            )}
          </button>

        </div>

      </div>
    </div>
  );
}