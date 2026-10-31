import React from 'react';
import { useAuthStore } from '../store/useAuthStore';
import { 
  DollarSign, 
  TrendingUp, 
  Building2, 
  ArrowUpRight, 
  Wallet, 
  ShieldCheck, 
  Clock,
  ArrowRight
} from 'lucide-react';
import { 
  AreaChart, 
  Area, 
  XAxis, 
  YAxis, 
  Tooltip, 
  ResponsiveContainer, 
  PieChart, 
  Pie, 
  Cell 
} from 'recharts';
import { Link } from 'react-router-dom';

// Mock data for Portfolio Growth Chart
const portfolioPerformanceData = [
  { month: 'Nov', value: 12500 },
  { month: 'Dec', value: 14200 },
  { month: 'Jan', value: 18900 },
  { month: 'Feb', value: 21400 },
  { month: 'Mar', value: 26800 },
  { month: 'Apr', value: 34500 },
];

// Mock data for Asset Allocation Pie Chart
const assetAllocationData = [
  { name: 'Residential Real Estate', value: 55, color: '#D9A52E' },
  { name: 'Commercial Spaces', value: 30, color: '#0B1F4B' },
  { name: 'Mixed-Use Developments', value: 15, color: '#3b82f6' },
];

// Mock recent investments
const recentInvestments = [
  { id: 1, property: 'Lekki Phase 1 Luxury Villa', shares: '25 Units', amount: '$12,500', date: 'Oct 14, 2026', status: 'Active' },
  { id: 2, property: 'Eko Atlantic Heights', shares: '10 Units', amount: '$8,400', date: 'Sep 28, 2026', status: 'Active' },
  { id: 3, property: 'Abuja Diplomatic Enclave', shares: '15 Units', amount: '$13,600', date: 'Sep 05, 2026', status: 'Active' },
];

export default function DashboardPage() {
  const { profile } = useAuthStore();

  return (
    <div className="space-y-8 pb-12">
      
      {/* Top Banner / Welcome Card */}
      <div className="relative overflow-hidden rounded-md bg-gradient-to-r from-[#0B1F4B] via-[#102a63] to-[#0B1F4B] p-6 text-white shadow-xl border border-amber-500/20">
        <div className="absolute -right-10 -bottom-10 w-64 h-64 bg-amber-500/10 rounded-full blur-3xl pointer-events-none" />
        <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <h2 className="text-2xl sm:text-3xl font-sans font-semibold tracking-tight">
              Portfolio Valuation Overview
            </h2>
            <p className="text-slate-300 text-sm mt-1 max-w-xl">
              Track your fractional property shares, automated monthly rental yields, and overall net equity performance across the BiggoHomes ecosystem.
            </p>
          </div>
          <div className="flex items-center gap-3">
            <Link 
              to="/properties" 
              className="inline-flex items-center justify-center space-x-2 bg-[#D9A52E] hover:bg-[#c29227] text-[#0B1F4B] font-semibold px-5 py-3 rounded-xl text-sm shadow-lg transition"
            >
              <Building2 className="w-4 h-4" />
              <span>Explore New Deals</span>
            </Link>
          </div>
        </div>
      </div>

      {/* KPI Metric Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
        
        {/* Card 1 */}
        <div className="bg-white dark:bg-[#0B1F4B]/60 p-6 rounded-md border border-slate-200 dark:border-slate-800 shadow-sm">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold uppercase tracking-wider text-slate-500 dark:text-slate-400">Total Portfolio Value</span>
            <div className="p-2.5 rounded-xl bg-amber-500/10 text-amber-500">
              <DollarSign className="w-5 h-5" />
            </div>
          </div>
          <div className="mt-4 flex items-baseline justify-between">
            <h3 className="text-2xl sm:text-3xl font-sans font-semibold text-slate-900 dark:text-white">$34,500</h3>
            <span className="inline-flex items-center text-xs font-semibold text-emerald-500 bg-emerald-500/10 px-2 py-1 rounded-md">
              <ArrowUpRight className="w-3.5 h-3.5 mr-0.5" /> +14.2%
            </span>
          </div>
          <p className="text-xs text-slate-500 mt-2">Updated 5 minutes ago</p>
        </div>

        {/* Card 2 */}
        <div className="bg-white dark:bg-[#0B1F4B]/60 p-6 rounded-md border border-slate-200 dark:border-slate-800 shadow-sm">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold uppercase tracking-wider text-slate-500 dark:text-slate-400">Active Rental Yield</span>
            <div className="p-2.5 rounded-xl bg-blue-500/10 text-blue-500">
              <TrendingUp className="w-5 h-5" />
            </div>
          </div>
          <div className="mt-4 flex items-baseline justify-between">
            <h3 className="text-2xl sm:text-3xl font-sans font-semibold text-slate-900 dark:text-white">12.8%</h3>
            <span className="inline-flex items-center text-xs font-semibold text-emerald-500 bg-emerald-500/10 px-2 py-1 rounded-md">
              <ArrowUpRight className="w-3.5 h-3.5 mr-0.5" /> +2.1%
            </span>
          </div>
          <p className="text-xs text-slate-500 mt-2">Annualized return rate</p>
        </div>

        {/* Card 3 */}
        <div className="bg-white dark:bg-[#0B1F4B]/60 p-6 rounded-md border border-slate-200 dark:border-slate-800 shadow-sm">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold uppercase tracking-wider text-slate-500 dark:text-slate-400">Active Property Units</span>
            <div className="p-2.5 rounded-xl bg-purple-500/10 text-purple-500">
              <Building2 className="w-5 h-5" />
            </div>
          </div>
          <div className="mt-4 flex items-baseline justify-between">
            <h3 className="text-2xl sm:text-3xl font-sans font-semibold text-slate-900 dark:text-white">50 Units</h3>
            <span className="text-xs font-semibold text-slate-400">Across 3 Assets</span>
          </div>
          <p className="text-xs text-slate-500 mt-2">Fully deeded fractions</p>
        </div>

        {/* Card 4 */}
        <div className="bg-white dark:bg-[#0B1F4B]/60 p-6 rounded-md border border-slate-200 dark:border-slate-800 shadow-sm">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold uppercase tracking-wider text-slate-500 dark:text-slate-400">Available Wallet Cash</span>
            <div className="p-2.5 rounded-xl bg-emerald-500/10 text-emerald-500">
              <Wallet className="w-5 h-5" />
            </div>
          </div>
          <div className="mt-4 flex items-baseline justify-between">
            <h3 className="text-2xl sm:text-3xl font-sans font-semibold text-slate-900 dark:text-white">$4,250</h3>
            <span className="text-xs font-semibold text-emerald-500">Ready to invest</span>
          </div>
          <p className="text-xs text-slate-500 mt-2">Instant payout eligible</p>
        </div>

      </div>

      {/* Charts Section */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* Main Growth Area Chart */}
        <div className="lg:col-span-2 bg-white dark:bg-[#0B1F4B]/60 p-6 rounded-md border border-slate-200 dark:border-slate-800 shadow-sm flex flex-col">
          <div className="flex items-center justify-between mb-6">
            <div>
              <h3 className="text-base font-semibold text-slate-900 dark:text-white">Portfolio Growth Trajectory</h3>
              <p className="text-xs text-slate-500">Net equity appreciation over the last 6 months</p>
            </div>
            <span className="text-xs font-semibold px-3 py-1 bg-amber-500/10 text-amber-500 rounded-lg">
              USD ($)
            </span>
          </div>

          <div className="h-72 w-full flex-1">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={portfolioPerformanceData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                <defs>
                  <linearGradient id="colorValue" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#D9A52E" stopOpacity={0.4}/>
                    <stop offset="95%" stopColor="#D9A52E" stopOpacity={0.0}/>
                  </linearGradient>
                </defs>
                <XAxis dataKey="month" stroke="#94a3b8" fontSize={12} tickLine={false} axisLine={false} />
                <YAxis stroke="#94a3b8" fontSize={12} tickLine={false} axisLine={false} tickFormatter={(v) => `$${v}`} />
                <Tooltip 
                  contentStyle={{ backgroundColor: '#0B1F4B', borderColor: '#334155', borderRadius: '12px', color: '#fff', fontSize: '12px' }}
                  formatter={(val) => [`$${val}`, 'Portfolio Value']}
                />
                <Area type="monotone" dataKey="value" stroke="#D9A52E" strokeWidth={3} fillOpacity={1} fill="url(#colorValue)" />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Asset Allocation Donut / Pie Chart */}
        <div className="bg-white dark:bg-[#0B1F4B]/60 p-6 rounded-md border border-slate-200 dark:border-slate-800 shadow-sm flex flex-col">
          <h3 className="text-base font-semibold text-slate-900 dark:text-white mb-1">Asset Allocation</h3>
          <p className="text-xs text-slate-500 mb-4">Diversification by property class</p>

          <div className="h-52 w-full flex items-center justify-center">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={assetAllocationData}
                  cx="50%"
                  cy="50%"
                  innerRadius={60}
                  outerRadius={80}
                  paddingAngle={6}
                  dataKey="value"
                >
                  {assetAllocationData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.color} />
                  ))}
                </Pie>
                <Tooltip 
                  contentStyle={{ backgroundColor: '#0B1F4B', borderColor: '#334155', borderRadius: '12px', color: '#fff', fontSize: '12px' }}
                  formatter={(val) => [`${val}%`, 'Allocation']}
                />
              </PieChart>
            </ResponsiveContainer>
          </div>

          <div className="space-y-2 mt-4">
            {assetAllocationData.map((item) => (
              <div key={item.name} className="flex items-center justify-between text-xs font-semibold">
                <div className="flex items-center space-x-2">
                  <span className="w-3 h-3 rounded-full" style={{ backgroundColor: item.color }} />
                  <span className="text-slate-700 dark:text-slate-300">{item.name}</span>
                </div>
                <span className="text-slate-900 dark:text-white font-semibold">{item.value}%</span>
              </div>
            ))}
          </div>
        </div>

      </div>

      {/* Recent Investments Table */}
      <div className="bg-white dark:bg-[#0B1F4B]/60 rounded-md border border-slate-200 dark:border-slate-800 shadow-sm overflow-hidden">
        <div className="p-6 border-b border-slate-200 dark:border-slate-800 flex items-center justify-between">
          <div>
            <h3 className="text-base font-semibold text-slate-900 dark:text-white">Recent Property Investments</h3>
            <p className="text-xs text-slate-500">Your latest fractional real estate acquisitions</p>
          </div>
          <Link 
            to="/portfolio" 
            className="text-xs font-semibold text-amber-500 hover:text-amber-400 flex items-center space-x-1 transition"
          >
            <span>View Full Portfolio</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </Link>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse text-sm">
            <thead>
              <tr className="bg-slate-50 dark:bg-white/5 text-[11px] font-semibold uppercase tracking-wider text-slate-500 dark:text-slate-400 border-b border-slate-200 dark:border-slate-800">
                <th className="py-3 px-6">Property Asset</th>
                <th className="py-3 px-6">Shares / Units</th>
                <th className="py-3 px-6">Invested Capital</th>
                <th className="py-3 px-6">Date Acquired</th>
                <th className="py-3 px-6">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-200 dark:divide-slate-800 text-xs sm:text-sm">
              {recentInvestments.map((inv) => (
                <tr key={inv.id} className="hover:bg-slate-50 dark:hover:bg-white/5 transition">
                  <td className="py-4 px-6 font-semibold text-slate-900 dark:text-white flex items-center space-x-3">
                    <div className="w-9 h-9 rounded-xl bg-amber-500/10 text-amber-500 flex items-center justify-center flex-shrink-0">
                      <Building2 className="w-4 h-4" />
                    </div>
                    <span>{inv.property}</span>
                  </td>
                  <td className="py-4 px-6 text-slate-600 dark:text-slate-300">{inv.shares}</td>
                  <td className="py-4 px-6 font-semibold text-slate-900 dark:text-white">{inv.amount}</td>
                  <td className="py-4 px-6 text-slate-500 dark:text-slate-400 flex items-center space-x-1.5 pt-5">
                    <Clock className="w-3.5 h-3.5 text-slate-400" />
                    <span>{inv.date}</span>
                  </td>
                  <td className="py-4 px-6">
                    <span className="px-2.5 py-1 rounded-full text-[10px] font-sans font-semibold uppercase bg-emerald-500/10 text-emerald-500 border border-emerald-500/20">
                      {inv.status}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

    </div>
  );
}