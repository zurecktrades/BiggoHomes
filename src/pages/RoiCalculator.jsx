import React, { useState, useMemo } from 'react';
import { 
  Calculator, DollarSign, Percent, Building2, 
  Calendar, Layers, ArrowUpRight, TrendingUp, RefreshCw 
} from 'lucide-react';
import { 
  AreaChart, Area, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid 
} from 'recharts';

export default function RoiCalculatorPage() {
  // Input Form States
  const [unitPrice, setUnitPrice] = useState(500); // Price per fraction/unit ($)
  const [unitsCount, setUnitsCount] = useState(2); // Number of units purchased
  const [roiPercentage, setRoiPercentage] = useState(18.5); // Expected annual ROI (%)
  const [payoutFrequency, setPayoutFrequency] = useState('annual'); // 'monthly' | 'quarterly' | 'bi-annual' | 'annual'
  const [durationYears, setDurationYears] = useState(1); // Duration term in years

  // Dynamic Calculation Engine
  const calculations = useMemo(() => {
    const price = Math.max(0, parseFloat(unitPrice) || 0);
    const units = Math.max(0, parseInt(unitsCount) || 0);
    const roiRate = Math.max(0, parseFloat(roiPercentage) || 0) / 100;
    const years = Math.max(0.1, parseFloat(durationYears) || 1);

    const totalInvested = price * units;
    const totalExpectedProfit = totalInvested * roiRate * years;
    const totalMaturityValue = totalInvested + totalExpectedProfit;

    // Frequencies per year
    const frequencyMap = {
      monthly: 12,
      quarterly: 4,
      'bi-annual': 2,
      annual: 1
    };

    const periodsPerYear = frequencyMap[payoutFrequency] || 1;
    const totalPeriods = Math.round(periodsPerYear * years);
    const payoutPerPeriod = totalPeriods > 0 ? totalExpectedProfit / totalPeriods : 0;

    // Build chart projection curve points
    const chartCurve = [];
    const stepCount = Math.min(Math.max(totalPeriods, 6), 24);
    for (let i = 0; i <= stepCount; i++) {
      const progressRatio = i / stepCount;
      const accruedProfit = Number((totalExpectedProfit * progressRatio).toFixed(2));
      chartCurve.push({
        period: i === 0 ? 'Start' : `P${i}`,
        profit: accruedProfit,
        portfolioValue: Number((totalInvested + accruedProfit).toFixed(2))
      });
    }

    return {
      totalInvested,
      totalExpectedProfit,
      totalMaturityValue,
      totalPeriods,
      payoutPerPeriod,
      chartCurve
    };
  }, [unitPrice, unitsCount, roiPercentage, payoutFrequency, durationYears]);

  const handleReset = () => {
    setUnitPrice(500);
    setUnitsCount(2);
    setRoiPercentage(18.5);
    setPayoutFrequency('annual');
    setDurationYears(1);
  };

  return (
    <div className="font-sans text-slate-900 dark:text-white space-y-8 pb-16 max-w-7xl mx-auto p-4">
      
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="inline-flex items-center space-x-2 px-3 py-1 rounded-full bg-amber-500/10 border border-amber-500/30 text-amber-500 text-xs font-bold uppercase tracking-wider mb-2">
            <Calculator className="w-3.5 h-3.5" />
            <span>Yield Estimator</span>
          </div>
          <h1 className="text-2xl sm:text-4xl font-extrabold tracking-tight">Real Estate ROI Calculator</h1>
          <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400 mt-1">
            Simulate fractional property returns, payout frequencies, and capital growth in real-time.
          </p>
        </div>

        <button
          onClick={handleReset}
          className="inline-flex items-center space-x-2 px-4 py-2.5 rounded-xl bg-slate-100 dark:bg-[#0B1F4B] hover:bg-slate-200 dark:hover:bg-[#102a63] text-slate-700 dark:text-slate-200 text-xs font-bold border border-slate-200 dark:border-slate-800 transition flex-shrink-0 w-fit"
        >
          <RefreshCw className="w-3.5 h-3.5" />
          <span>Reset Defaults</span>
        </button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
        
        {/* Left Inputs Controls Panel */}
        <div className="lg:col-span-5 bg-white dark:bg-[#0B1F4B] border border-slate-200 dark:border-slate-800 rounded-3xl p-6 sm:p-8 shadow-xl space-y-6">
          <h3 className="text-base font-bold text-slate-900 dark:text-white border-b border-slate-100 dark:border-slate-800 pb-3 flex items-center justify-between">
            <span>Investment Parameters</span>
            <Building2 className="w-4 h-4 text-amber-500" />
          </h3>

          {/* Unit Price Input */}
          <div className="space-y-1.5">
            <label className="block text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">
              Capital Invested Per Unit ($)
            </label>
            <div className="relative">
              <span className="absolute left-3.5 top-3 text-xs font-bold text-slate-400">$</span>
              <input
                type="number"
                min="1"
                value={unitPrice}
                onChange={(e) => setUnitPrice(e.target.value)}
                placeholder="500"
                className="w-full pl-8 pr-4 py-3 text-xs font-bold rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-[#071326] focus:outline-none focus:border-amber-500 text-slate-900 dark:text-white"
              />
            </div>
          </div>

          {/* Units Count Input */}
          <div className="space-y-1.5">
            <label className="block text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">
              Units Purchased
            </label>
            <div className="relative">
              <span className="absolute left-3.5 top-3 text-xs font-bold text-slate-400">
                <Layers className="w-4 h-4 text-slate-400" />
              </span>
              <input
                type="number"
                min="1"
                value={unitsCount}
                onChange={(e) => setUnitsCount(e.target.value)}
                placeholder="1"
                className="w-full pl-10 pr-4 py-3 text-xs font-bold rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-[#071326] focus:outline-none focus:border-amber-500 text-slate-900 dark:text-white"
              />
            </div>
          </div>

          {/* ROI Percentage Input */}
          <div className="space-y-1.5">
            <label className="block text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">
              Expected ROI Percentage (%)
            </label>
            <div className="relative">
              <input
                type="number"
                step="0.1"
                min="0"
                value={roiPercentage}
                onChange={(e) => setRoiPercentage(e.target.value)}
                placeholder="18.5"
                className="w-full pl-4 pr-9 py-3 text-xs font-bold rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-[#071326] focus:outline-none focus:border-amber-500 text-slate-900 dark:text-white"
              />
              <span className="absolute right-3.5 top-3 text-xs font-bold text-amber-500">%</span>
            </div>
          </div>

          {/* Payout Frequency Select */}
          <div className="space-y-1.5">
            <label className="block text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">
              Payout Frequency
            </label>
            <div className="relative">
              <select
                value={payoutFrequency}
                onChange={(e) => setPayoutFrequency(e.target.value)}
                className="w-full px-4 py-3 text-xs font-bold rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-[#071326] focus:outline-none focus:border-amber-500 text-slate-900 dark:text-white appearance-none cursor-pointer"
              >
                <option value="monthly">Monthly (12 Payouts / Year)</option>
                <option value="quarterly">Quarterly (4 Payouts / Year)</option>
                <option value="bi-annual">Bi-Annual (2 Payouts / Year)</option>
                <option value="annual">Annual (1 Payout / Year)</option>
              </select>
              <Calendar className="w-4 h-4 text-slate-400 absolute right-3.5 top-3.5 pointer-events-none" />
            </div>
          </div>

          {/* Duration Term (Years) */}
          <div className="space-y-1.5">
            <div className="flex justify-between items-center text-xs">
              <label className="font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">
                Investment Term
              </label>
              <span className="font-bold text-amber-500">{durationYears} Year(s)</span>
            </div>
            <input
              type="range"
              min="0.5"
              max="5"
              step="0.5"
              value={durationYears}
              onChange={(e) => setDurationYears(parseFloat(e.target.value))}
              className="w-full accent-amber-500 cursor-pointer"
            />
            <div className="flex justify-between text-[10px] text-slate-400">
              <span>6 Months</span>
              <span>3 Years</span>
              <span>5 Years</span>
            </div>
          </div>

        </div>

        {/* Right Output Results & Graph Display */}
        <div className="lg:col-span-7 space-y-6">
          
          {/* Output Metric Cards */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            
            <div className="p-5 rounded-2xl bg-white dark:bg-[#0B1F4B] border border-slate-200 dark:border-slate-800 shadow-sm space-y-2">
              <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400">Total Invested</span>
              <h3 className="text-xl sm:text-2xl font-bold text-slate-900 dark:text-white">
                ${calculations.totalInvested.toLocaleString(undefined, { minimumFractionDigits: 2 })}
              </h3>
              <p className="text-[10px] text-slate-400">{unitsCount} unit(s) @ ${unitPrice}/unit</p>
            </div>

            <div className="p-5 rounded-2xl bg-white dark:bg-[#0B1F4B] border border-slate-200 dark:border-slate-800 shadow-sm space-y-2">
              <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400">Estimated Total Profit</span>
              <h3 className="text-xl sm:text-2xl font-bold text-emerald-500">
                +${calculations.totalExpectedProfit.toLocaleString(undefined, { minimumFractionDigits: 2 })}
              </h3>
              <p className="text-[10px] text-emerald-500 font-semibold flex items-center">
                <ArrowUpRight className="w-3 h-3 mr-0.5" /> {roiPercentage}% ROI
              </p>
            </div>

            <div className="p-5 rounded-2xl bg-white dark:bg-[#0B1F4B] border border-slate-200 dark:border-slate-800 shadow-sm space-y-2">
              <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400">Per Payout Yield</span>
              <h3 className="text-xl sm:text-2xl font-bold text-amber-500">
                ${calculations.payoutPerPeriod.toLocaleString(undefined, { minimumFractionDigits: 2 })}
              </h3>
              <p className="text-[10px] text-slate-400 capitalize">{payoutFrequency} payout ({calculations.totalPeriods} total)</p>
            </div>

          </div>

          {/* Maturity Highlights Card */}
          <div className="p-6 rounded-3xl bg-gradient-to-r from-[#0B1F4B] via-[#102a63] to-[#0B1F4B] text-white border border-amber-500/20 shadow-xl flex flex-col sm:flex-row items-center justify-between gap-4 relative overflow-hidden">
            <div className="absolute -right-10 -bottom-10 w-48 h-48 bg-amber-500/10 rounded-full blur-3xl pointer-events-none" />
            <div>
              <span className="text-[10px] font-bold uppercase tracking-widest text-slate-300">Total Portfolio Value at Maturity</span>
              <h2 className="text-3xl sm:text-4xl font-extrabold text-amber-400 mt-1">
                ${calculations.totalMaturityValue.toLocaleString(undefined, { minimumFractionDigits: 2 })}
              </h2>
            </div>
            <div className="text-right sm:border-l sm:border-white/10 sm:pl-6">
              <span className="text-[10px] font-bold uppercase tracking-widest text-slate-300">Term Duration</span>
              <p className="text-lg font-bold text-white">{durationYears} Year(s)</p>
            </div>
          </div>

          {/* Recharts Yield Curve Graph */}
          <div className="bg-white dark:bg-[#0B1F4B] border border-slate-200 dark:border-slate-800 p-6 rounded-3xl space-y-4 shadow-sm">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-sm font-bold text-slate-900 dark:text-white">Projected Yield Growth Trajectory</h3>
                <p className="text-xs text-slate-400">Cumulative portfolio value over {calculations.totalPeriods} {payoutFrequency} periods</p>
              </div>
              <span className="text-xs font-bold px-3 py-1 bg-emerald-500/10 text-emerald-500 rounded-xl">
                Dynamic Curve
              </span>
            </div>

            <div className="h-64 w-full">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={calculations.chartCurve} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                  <defs>
                    <linearGradient id="roiGradient" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#10b981" stopOpacity={0.4}/>
                      <stop offset="95%" stopColor="#10b981" stopOpacity={0.0}/>
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" opacity={0.1} />
                  <XAxis dataKey="period" stroke="#64748B" fontSize={11} />
                  <YAxis stroke="#64748B" fontSize={11} tickFormatter={(v) => `$${v}`} />
                  <Tooltip 
                    contentStyle={{ backgroundColor: '#071326', borderColor: '#1E293B', borderRadius: '16px', color: '#fff', fontSize: '12px' }}
                    formatter={(val, name) => [`$${val.toLocaleString()}`, name === 'portfolioValue' ? 'Portfolio Value' : 'Profit Earned']}
                  />
                  <Area type="monotone" dataKey="portfolioValue" stroke="#D9A52E" strokeWidth={3} fill="#D9A52E" fillOpacity={0.1} name="portfolioValue" />
                  <Area type="monotone" dataKey="profit" stroke="#10b981" strokeWidth={2} fill="url(#roiGradient)" name="profit" />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          </div>

        </div>

      </div>

    </div>
  );
}