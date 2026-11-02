import React, { useState, useEffect } from 'react';
import { supabase } from '../../lib/supabaseClient';
import { useAuthStore } from '../../store/useAuthStore';
import { motion, AnimatePresence } from 'framer-motion';
import {
    AreaChart, Area, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid
} from 'recharts';
import {
    Building2, TrendingUp, AlertTriangle, Loader2, Percent
} from 'lucide-react';
import { toast } from 'react-toastify';

export default function MyPropertiesPage() {
    const { user, fetchProfile } = useAuthStore();
    const [investments, setInvestments] = useState([]);
    const [loading, setLoading] = useState(true);

    const [selectedPropId, setSelectedPropId] = useState(null);
    const [showSellModal, setShowSellModal] = useState(false);
    const [investmentToSell, setInvestmentToSell] = useState(null);
    const [selling, setSelling] = useState(false);

    useEffect(() => {
        if (user) {
            fetchUserInvestments();
        }
    }, [user]);

    const fetchUserInvestments = async () => {
        setLoading(true);
        try {
            // Strictly fetch only active investments where amount > 0
            const { data, error } = await supabase
                .from('investments')
                .select('*, properties(*)')
                .eq('user_id', user.id)
                .eq('status', 'active')
                .gt('amount', 0)
                .order('created_at', { ascending: false });

            if (error) throw error;

            const todayStr = new Date().toISOString().split('T')[0];

            const parsedInvestments = (data || []).map((inv) => {
                const schedule = inv.profit_schedule || [];

                // Filter JSONB schedule: Keep records from purchase date up to today
                const pastAndPresentRecords = schedule.filter(item => item.date <= todayStr);

                // Fall back to Day 1 schedule entry if pastAndPresentRecords is empty
                const latestRecord = pastAndPresentRecords[pastAndPresentRecords.length - 1] || schedule[0] || { profitEarned: 0 };

                const principal = Number(inv.amount || 0);
                const maxProfit = Number(inv.expected_roi_amount || 0);
                const currentProfit = Number(latestRecord.profitEarned || 0);

                return {
                    ...inv,
                    principal,
                    maxProfit,
                    currentProfit,
                    filteredSchedule: pastAndPresentRecords.length > 0 ? pastAndPresentRecords : [schedule[0]]
                };
            });

            setInvestments(parsedInvestments);
            if (parsedInvestments.length > 0) {
                setSelectedPropId(parsedInvestments[0].id);
            } else {
                setSelectedPropId(null);
            }
        } catch (err) {
            console.error(err);
            toast.error("Could not fetch active holdings.");
        } finally {
            setLoading(false);
        }
    };

    const activeInvestment = investments.find((i) => i.id === selectedPropId) || investments[0];
    const chartData = activeInvestment?.filteredSchedule || [];

    const totalInvested = investments.reduce((acc, inv) => acc + inv.principal, 0);
    const totalEarnedProfit = investments.reduce((acc, inv) => acc + inv.currentProfit, 0);
    const totalExpectedROI = investments.reduce((acc, inv) => acc + inv.maxProfit, 0);

    const handleSellShares = async () => {
        if (!investmentToSell) return;
        setSelling(true);

        try {
            // 1. Fetch current profile account balance
            const { data: userProfile, error: profErr } = await supabase
                .from('profiles')
                .select('account_balance')
                .eq('id', user.id)
                .single();

            if (profErr) throw profErr;

            const refundAmount = investmentToSell.principal;
            const tokensToReturn = Number(investmentToSell.tokens_purchased || 1);
            const propertyId = investmentToSell.property_id;

            // 2. Refund exact principal to user account balance
            const newBalance = (userProfile.account_balance || 0) + refundAmount;
            const { error: balErr } = await supabase
                .from('profiles')
                .update({ account_balance: newBalance })
                .eq('id', user.id);

            if (balErr) throw balErr;

            // 3. Reset investment values to 0 and set status to 'cancelled'
            const { error: invResetErr } = await supabase
                .from('investments')
                .update({ 
                    status: 'cancelled',
                    amount: 0,
                    expected_roi_amount: 0,
                    tokens_purchased: 0,
                    profit_schedule: []
                })
                .eq('id', investmentToSell.id);

            if (invResetErr) throw invResetErr;

            // 4. Return tokens back to the Property's public available_tokens pool
            if (propertyId) {
                const { data: propData } = await supabase
                    .from('properties')
                    .select('available_tokens, funded_amount, status')
                    .eq('id', propertyId)
                    .single();

                if (propData) {
                    const updatedAvailableTokens = Number(propData.available_tokens || 0) + tokensToReturn;
                    const updatedFundedAmount = Math.max(0, Number(propData.funded_amount || 0) - refundAmount);

                    await supabase
                        .from('properties')
                        .update({ 
                            available_tokens: updatedAvailableTokens,
                            funded_amount: updatedFundedAmount,
                            status: propData.status === 'fully_funded' ? 'active' : propData.status
                        })
                        .eq('id', propertyId);
                }
            }

            // 5. Log liquidation in user transactions ledger
            await supabase.from('transactions').insert({
                user_id: user.id,
                type: 'deposit',
                amount: refundAmount,
                description: `Liquidated ${tokensToReturn} share(s) in ${investmentToSell.properties?.title || 'Property'}. (Profits forfeited)`,
                reference_id: `LIQ-${Date.now().toString().slice(-6)}`
            });

            toast.success(`Principal of $${refundAmount.toLocaleString()} refunded. Profits forfeited and shares reset.`);
            
            setShowSellModal(false);
            setInvestmentToSell(null);
            
            if (fetchProfile) fetchProfile();
            fetchUserInvestments();
        } catch (err) {
            console.error(err);
            toast.error("Failed to process sale.");
        } finally {
            setSelling(false);
        }
    };

    return (
        <div className="space-y-8 font-sans pb-16 max-w-8xl p-4 mx-auto">
            <div>
                <h2 className="text-2xl font-bold tracking-tight text-slate-900 dark:text-white">My Property Portfolio</h2>
                <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
                    Yield trends derived from verified JSONB database profit schedules.
                </p>
            </div>

            {/* SELL MODAL */}
            <AnimatePresence>
                {showSellModal && investmentToSell && (
                    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-md">
                        <motion.div
                            initial={{ opacity: 0, scale: 0.95 }}
                            animate={{ opacity: 1, scale: 1 }}
                            exit={{ opacity: 0, scale: 0.95 }}
                            className="max-w-md w-full bg-white dark:bg-[#0D1B32] border border-slate-200 dark:border-slate-800 rounded-md p-8 shadow-2xl text-center relative overflow-hidden"
                        >
                            <div className="absolute top-0 left-0 right-0 h-2 bg-red-500" />
                            <div className="mx-auto w-16 h-16 rounded-md bg-red-500/10 text-red-500 flex items-center justify-center mb-6">
                                <AlertTriangle className="w-8 h-8" />
                            </div>
                            <h3 className="text-xl font-bold text-slate-900 dark:text-white mb-2">Confirm Share Liquidation</h3>
                            <p className="text-xs text-slate-500 dark:text-slate-300 mb-6">
                                Selling your shares will return your principal of <span className="text-emerald-500 font-bold">${investmentToSell.principal.toLocaleString()}</span>, but will completely forfeit your accumulated profit of <span className="text-red-500 font-bold">${investmentToSell.currentProfit.toFixed(2)}</span>.
                            </p>
                            <div className="flex space-x-3">
                                <button onClick={() => setShowSellModal(false)} className="flex-1 py-3 rounded-xl bg-slate-100 dark:bg-slate-800 text-xs font-bold">Cancel</button>
                                <button onClick={handleSellShares} disabled={selling} className="flex-1 py-3 rounded-xl bg-red-500 text-white text-xs font-bold">
                                    {selling ? <Loader2 className="w-4 h-4 animate-spin mx-auto" /> : 'Forfeit/Sell'}
                                </button>
                            </div>
                        </motion.div>
                    </div>
                )}
            </AnimatePresence>

            {/* Summary Cards */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
                <div className="p-6 rounded-md bg-white dark:bg-[#0B1F4B] border border-slate-200 dark:border-slate-800 space-y-2">
                    <div className="text-slate-400 text-xs font-bold uppercase">Total Invested</div>
                    <div className="text-2xl font-sans font-bold text-slate-900 dark:text-white">${totalInvested.toLocaleString()}</div>
                </div>
                <div className="p-6 rounded-md bg-white dark:bg-[#0B1F4B] border border-slate-200 dark:border-slate-800 space-y-2">
                    <div className="text-slate-400 text-xs font-bold uppercase">Accrued Yields (Earned)</div>
                    <div className="text-2xl font-sans font-bold text-emerald-500">+${totalEarnedProfit.toLocaleString()}</div>
                </div>
                <div className="p-6 rounded-md bg-white dark:bg-[#0B1F4B] border border-slate-200 dark:border-slate-800 space-y-2">
                    <div className="text-slate-400 text-xs font-bold uppercase">Target Max Returns</div>
                    <div className="text-2xl font-sans font-bold text-[#D9A52E]">+${totalExpectedROI.toLocaleString()}</div>
                </div>
            </div>

            {/* Recharts Chart & Listings */}
            {loading ? (
                <div className="flex justify-center py-20"><Loader2 className="w-8 h-8 animate-spin text-amber-500" /></div>
            ) : investments.length === 0 ? (
                <div className="text-center py-16 bg-white dark:bg-[#0B1F4B] rounded-md">No active investments found.</div>
            ) : (
                <div className="grid grid-cols-1 gap-8">

                    {/* Recharts Curve from JSONB Filtered Data */}
                    <div className=" bg-white dark:bg-[#0B1F4B] border border-slate-200 dark:border-slate-800 p-6 rounded-md space-y-6">
                        <h3 className="text-sm font-bold text-slate-900 dark:text-white">Filtered JSONB Yield Growth Trend</h3>
                        <div className="h-72 w-full">
                            <ResponsiveContainer width="100%" height="100%">
                                <AreaChart data={chartData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                                    <CartesianGrid strokeDasharray="3 3" opacity={0.1} />
                                    <XAxis dataKey="date" stroke="#64748B" fontSize={11} />
                                    <YAxis stroke="#64748B" fontSize={11} />
                                    <Tooltip contentStyle={{ backgroundColor: '#071326', borderColor: '#1E293B', borderRadius: '16px', color: '#fff', fontSize: '12px' }} />
                                    <Area type="monotone" dataKey="portfolioValue" stroke="#D9A52E" strokeWidth={3} fill="#D9A52E" fillOpacity={0.2} name="Portfolio ($)" />
                                    <Area type="monotone" dataKey="profitEarned" stroke="#10B981" strokeWidth={2} fill="#10B981" fillOpacity={0.2} name="Profit ($)" />
                                </AreaChart>
                            </ResponsiveContainer>
                        </div>
                    </div>

                    {/* Holdings */}
                    <div className="space-y-4">
                        <h3 className="text-xs font-bold text-slate-400 uppercase tracking-wider">Active Properties</h3>
                        {investments.map((inv) => (
                            <div
                                key={inv.id}
                                onClick={() => setSelectedPropId(inv.id)}
                                className={`p-5 rounded-md border transition cursor-pointer space-y-3 ${inv.id === activeInvestment?.id ? 'bg-amber-500/5 border-amber-500/40 dark:bg-[#071326]' : 'bg-white dark:bg-[#0B1F4B] border-slate-200 dark:border-slate-800'}`}
                            >
                                <div className="flex justify-between">
                                    <h4 className="text-sm font-bold text-slate-900 dark:text-white">{inv.properties?.title}</h4>
                                    <span className="text-xs font-bold text-emerald-500">+${inv.currentProfit.toFixed(2)}</span>
                                </div>
                            </div>
                        ))}
                    </div>

                </div>
            )}
        </div>
    );
}