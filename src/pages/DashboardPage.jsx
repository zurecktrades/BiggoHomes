import React, { useState, useEffect } from 'react';
import { useAuthStore } from '../store/useAuthStore';
import { supabase } from '../lib/supabaseClient';
import { 
  DollarSign, TrendingUp, Building2, ArrowUpRight, 
  Wallet, ArrowRight, ArrowDownRight, Loader2, PieChart as PieIcon
} from 'lucide-react';
import { 
  AreaChart, Area, XAxis, YAxis, Tooltip, 
  ResponsiveContainer, PieChart, Pie, Cell 
} from 'recharts';
import { Link, useNavigate } from 'react-router-dom';

export default function DashboardPage() {
  const { profile } = useAuthStore();
  const useNavigateInstance = useNavigate();

  const [loadingMetrics, setLoadingMetrics] = useState(true);
  const [totalPortfolioValue, setTotalPortfolioValue] = useState(0);
  const [activeUnitsCount, setActiveUnitsCount] = useState(0);
  const [assetsCount, setAssetsCount] = useState(0);
  const [netProfit, setNetProfit] = useState(0);
  const [profitTrendData, setProfitTrendData] = useState([]);
  const [assetAllocationData, setAssetAllocationData] = useState([]);

  useEffect(() => {
    if (profile?.id) {
      fetchDashboardMetrics();
    }
  }, [profile]);

  const fetchDashboardMetrics = async () => {
    setLoadingMetrics(true);
    try {
      // 1. Fetch active user investments
      const { data: investments, error: invError } = await supabase
        .from('investments')
        .select('*, properties(*)')
        .eq('user_id', profile.id)
        .eq('status', 'active')
        .gt('amount', 0);

      if (invError) {
        console.warn('Investments table query note:', invError.message);
      }

      let totalPrincipal = 0;
      let portfolioVal = 0;
      let unitsCount = 0;
      let totalEarnedProfit = 0;
      const uniqueAssets = new Set();
      const todayStr = new Date().toISOString().split('T')[0];

      const dailyAggregates = {};

      if (investments && investments.length > 0) {
        investments.forEach((inv) => {
          const principal = Number(inv.amount || 0);
          totalPrincipal += principal;
          unitsCount += Number(inv.tokens_purchased || 0);
          if (inv.property_id) uniqueAssets.add(inv.property_id);

          const schedule = inv.profit_schedule || [];
          const pastRecords = schedule.filter(item => item.date <= todayStr);
          
          pastRecords.forEach(record => {
            if (!dailyAggregates[record.date]) {
              dailyAggregates[record.date] = { date: record.date, profitEarned: 0, portfolioValue: 0 };
            }
            dailyAggregates[record.date].profitEarned += Number(record.profitEarned || 0);
            dailyAggregates[record.date].portfolioValue += Number(record.portfolioValue || 0);
          });

          const latestRecord = pastRecords[pastRecords.length - 1] || schedule[0] || { profitEarned: 0 };
          const earned = Number(latestRecord.profitEarned || 0);

          totalEarnedProfit += earned;
          portfolioVal += (principal + earned);
        });
      }

      setTotalPortfolioValue(portfolioVal);
      setActiveUnitsCount(unitsCount);
      setAssetsCount(uniqueAssets.size);
      setNetProfit(totalEarnedProfit);

      const sortedTrendData = Object.values(dailyAggregates).sort((a, b) => new Date(a.date) - new Date(b.date));
      setProfitTrendData(sortedTrendData);

      // 2. Comprehensive Financial Breakdown Pie Chart Data
      // (Invested Principal, Earned Profits, and Wallet Cash at Hand)
      const walletCash = Number(profile?.account_balance || 0);
      
      setAssetAllocationData([
        { name: 'Invested Capital', value: totalPrincipal, color: '#0B1F4B' },
        { name: 'Accrued Yields', value: totalEarnedProfit, color: '#10B981' },
        { name: 'Cash at Hand', value: walletCash, color: '#D9A52E' },
      ].filter(item => item.value > 0));

    } catch (err) {
      console.error('Failed to load dashboard metrics:', err);
    } finally {
      setLoadingMetrics(false);
    }
  };

  return (
    <div className="space-y-8 pb-12 font-sans max-w-8xl p-4 mx-auto">
      
      {/* Top Banner / Welcome Card */}
      <div className="relative overflow-hidden rounded-xl bg-gradient-to-r from-[#0B1F4B] via-[#102a63] to-[#0B1F4B] p-6 sm:p-8 text-white shadow-xl border border-amber-500/20">
        <div className="absolute -right-10 -bottom-10 w-64 h-64 bg-amber-500/10 rounded-full blur-3xl pointer-events-none" />
        <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div>
            <h2 className="text-xl sm:text-2xl font-bold tracking-tight">Welcome back, {profile?.full_name || 'Investor'}!</h2>
            <p className="text-slate-300 text-xs sm:text-sm mt-1 max-w-xl">
              Monitor your fractional real estate equity, review automated daily profit yields, and manage your wallet capital.
            </p>
          </div>
          <div className="flex flex-wrap items-center gap-3">
            <button 
              onClick={() => useNavigateInstance('/wallet')}
              className="inline-flex items-center space-x-2 bg-amber-500 hover:bg-amber-400 text-[#0B1F4B] font-sans font-bold px-5 py-3 rounded-md text-xs shadow-lg transition"
            >
              <ArrowDownRight className="w-4 h-4" />
              <span>Deposit Funds</span>
            </button>
            <Link 
              to="/properties-listing" 
              className="inline-flex items-center space-x-2 bg-white/10 hover:bg-white/20 text-white font-bold px-5 py-3 rounded-md text-xs backdrop-blur-md transition border border-white/10"
            >
              <Building2 className="w-4 h-4 text-amber-400" />
              <span>Explore Deals</span>
            </Link>
          </div>
        </div>
      </div>

      {/* KPI Metric Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
         
         {/* Available Wallet Cash */}
        <Link to="/wallet" className="bg-white dark:bg-[#0B1F4B] p-6 rounded-xl border border-slate-200 dark:border-slate-800 shadow-sm hover:border-amber-500/50 transition group">
          <div className="flex items-center justify-between">
            <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400">Wallet Balance</span>
            <div className="p-2.5 rounded-xl bg-emerald-500/10 text-emerald-500 group-hover:scale-110 transition">
              <Wallet className="w-5 h-5" />
            </div>
          </div>
          <div className="mt-4 flex items-baseline justify-between">
            <h3 className="text-2xl sm:text-3xl font-sans font-bold">${(profile?.account_balance || 0).toLocaleString(undefined, { minimumFractionDigits: 2 })}</h3>
            <span className="text-[10px] font-bold text-amber-500 group-hover:translate-x-1 transition flex items-center">
              Manage <ArrowRight className="w-3.5 h-3.5 ml-1" />
            </span>
          </div>
          <p className="text-[11px] text-slate-400 mt-2">Cash at hand</p>
        </Link>
        
        {/* Total Portfolio Value */}
        <div className="bg-white dark:bg-[#0B1F4B] p-6 rounded-xl border border-slate-200 dark:border-slate-800 shadow-sm">
          <div className="flex items-center justify-between">
            <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400">Total Portfolio Value</span>
            <div className="p-2.5 rounded-xl bg-amber-500/10 text-amber-500">
              <DollarSign className="w-5 h-5" />
            </div>
          </div>
          <div className="mt-4 flex items-baseline justify-between">
            <h3 className="text-2xl sm:text-3xl font-sans font-bold">
              {loadingMetrics ? <Loader2 className="w-6 h-6 animate-spin text-amber-500" /> : `$${totalPortfolioValue.toLocaleString(undefined, { minimumFractionDigits: 2 })}`}
            </h3>
            <span className="inline-flex items-center text-[11px] font-bold text-emerald-500 bg-emerald-500/10 px-2 py-0.5 rounded-md">
              <ArrowUpRight className="w-3.5 h-3.5 mr-0.5" /> Live
            </span>
          </div>
          <p className="text-[11px] text-slate-400 mt-2">Principal + Accrued Yields</p>
        </div>

        {/* Account Net Profit */}
        <div className="bg-white dark:bg-[#0B1F4B] p-6 rounded-xl border border-slate-200 dark:border-slate-800 shadow-sm">
          <div className="flex items-center justify-between">
            <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400">Account Net Profit</span>
            <div className="p-2.5 rounded-xl bg-emerald-500/10 text-emerald-500">
              <TrendingUp className="w-5 h-5" />
            </div>
          </div>
          <div className="mt-4 flex items-baseline justify-between">
            <h3 className="text-2xl sm:text-3xl font-sans font-bold text-emerald-500">
              {loadingMetrics ? <Loader2 className="w-6 h-6 animate-spin text-emerald-500" /> : `+$${netProfit.toLocaleString(undefined, { minimumFractionDigits: 2 })}`}
            </h3>
            <span className="inline-flex items-center text-[11px] font-bold text-emerald-500 bg-emerald-500/10 px-2 py-0.5 rounded-md">
              <ArrowUpRight className="w-3.5 h-3.5 mr-0.5" /> Yields
            </span>
          </div>
          <p className="text-[11px] text-slate-400 mt-2">Accumulated daily profits</p>
        </div>

        {/* Active Property Units */}
        <div className="bg-white dark:bg-[#0B1F4B] p-6 rounded-xl border border-slate-200 dark:border-slate-800 shadow-sm">
          <div className="flex items-center justify-between">
            <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400">Active Property Units</span>
            <div className="p-2.5 rounded-xl bg-purple-500/10 text-purple-500">
              <Building2 className="w-5 h-5" />
            </div>
          </div>
          <div className="mt-4 flex items-baseline justify-between">
            <h3 className="text-2xl sm:text-3xl font-sans font-bold">
              {loadingMetrics ? <Loader2 className="w-6 h-6 animate-spin text-purple-500" /> : `${activeUnitsCount}`}
            </h3>
            <span className="text-xs font-semibold text-slate-400">Across {assetsCount} Asset(s)</span>
          </div>
          <p className="text-[11px] text-slate-400 mt-2">Holdings</p>
        </div>

      </div>

      {/* Charts Section: Profit Trend & Financial Breakdown Pie Chart */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* Profit Trend Chart */}
        <div className="lg:col-span-2 bg-white dark:bg-[#0B1F4B] p-6 rounded-xl border border-slate-200 dark:border-slate-800 shadow-sm flex flex-col">
          <div className="flex items-center justify-between mb-6">
            <div>
              <h3 className="text-base font-bold text-slate-900 dark:text-white">Account Profit Trends</h3>
              <p className="text-xs text-slate-400">Daily accrued yield growth curve</p>
            </div>
            <span className="text-xs font-bold px-3 py-1 bg-emerald-500/10 text-emerald-500 rounded-xl">
              Live Analytics
            </span>
          </div>

          <div className="h-72 w-full flex-1">
            {profitTrendData.length === 0 ? (
              <div className="flex items-center justify-center h-full text-xs text-slate-400">
                No active profit schedules available yet.
              </div>
            ) : (
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={profitTrendData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                  <defs>
                    <linearGradient id="colorProfit" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#10b981" stopOpacity={0.4}/>
                      <stop offset="95%" stopColor="#10b981" stopOpacity={0.0}/>
                    </linearGradient>
                  </defs>
                  <XAxis dataKey="date" stroke="#94a3b8" fontSize={11} tickLine={false} axisLine={false} />
                  <YAxis stroke="#94a3b8" fontSize={11} tickLine={false} axisLine={false} tickFormatter={(v) => `$${v}`} />
                  <Tooltip 
                    contentStyle={{ backgroundColor: '#0B1F4B', borderColor: '#334155', borderRadius: '16px', color: '#fff', fontSize: '12px' }}
                    formatter={(val, name) => [`$${val}`, name === 'profitEarned' ? 'Profit Earned' : 'Portfolio Value']}
                  />
                  <Area type="monotone" dataKey="profitEarned" stroke="#10b981" strokeWidth={3} fillOpacity={1} fill="url(#colorProfit)" name="profitEarned" />
                </AreaChart>
              </ResponsiveContainer>
            )}
          </div>
        </div>

        {/* Financial Breakdown Pie Chart (Invested Capital, Profits, and Cash at Hand) */}
        <div className="bg-white dark:bg-[#0B1F4B] p-6 rounded-xl border border-slate-200 dark:border-slate-800 shadow-sm flex flex-col">
          <div className="flex items-center justify-between mb-1">
            <h3 className="text-base font-bold text-slate-900 dark:text-white">Assest Allocation</h3>
            <PieIcon className="w-4 h-4 text-amber-500" />
          </div>
          <p className="text-xs text-slate-400 mb-4">Invested, Yields & Cash at Hand</p>

          <div className="h-48 w-full flex items-center justify-center">
            {assetAllocationData.length === 0 ? (
              <p className="text-xs text-slate-400 text-center">No financial data recorded yet.</p>
            ) : (
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={assetAllocationData}
                    cx="50%"
                    cy="50%"
                    innerRadius={55}
                    outerRadius={75}
                    paddingAngle={6}
                    dataKey="value"
                  >
                    {assetAllocationData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.color} />
                    ))}
                  </Pie>
                  <Tooltip 
                    contentStyle={{ backgroundColor: '#0B1F4B', borderColor: '#334155', borderRadius: '12px', color: '#fff', fontSize: '12px' }}
                    formatter={(val) => [`$${val.toLocaleString()}`, 'Amount']}
                  />
                </PieChart>
              </ResponsiveContainer>
            )}
          </div>

          <div className="space-y-2.5 mt-4">
            {assetAllocationData.map((item) => (
              <div key={item.name} className="flex items-center justify-between text-xs">
                <div className="flex items-center space-x-2 truncate">
                  <span className="w-3 h-3 rounded-full flex-shrink-0" style={{ backgroundColor: item.color }} />
                  <span className="text-slate-600 dark:text-slate-300 truncate">{item.name}</span>
                </div>
                <span className="font-bold">${item.value.toLocaleString()}</span>
              </div>
            ))}
          </div>
        </div>

      </div>

    </div>
  );
}