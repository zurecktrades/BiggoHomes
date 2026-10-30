import React from 'react';
import { motion, useReducedMotion } from 'framer-motion';
import { Globe } from 'lucide-react';

const regions = [
  { name: "Mayfair & Canary Wharf", hub: "London, UK", growth: "+19.4% Annual Yield", top: "15%", left: "38%" },
  { name: "Downtown & Palm Jumeirah", hub: "Dubai, UAE", growth: "+21.8% Annual Yield", top: "45%", left: "62%" },
  { name: "Austin & Manhattan Corridor", hub: "United States", growth: "+17.5% Annual Yield", top: "70%", left: "28%" },
];

export default function InvestmentCorridorsSection() {
  const shouldReduceMotion = useReducedMotion();

  return (
    <section className="relative overflow-hidden bg-white dark:bg-[#071326] py-24 px-4 sm:px-6 lg:px-8 border-b border-slate-200 dark:border-slate-800 font-sans">
      <div className="max-w-7xl mx-auto grid lg:grid-cols-12 gap-12 items-center">
        
        {/* Left Column: Animated Text & Description */}
        <motion.div 
          className="lg:col-span-6 space-y-6"
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, amount: 0.2 }}
          transition={{ duration: 0.8, ease: [0.22, 1, 0.36, 1] }}
        >
          <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-[#D9A52E]/10 border border-[#D9A52E]/30 text-[#B78319] dark:text-[#F2D58A] text-xs font-bold uppercase tracking-widest">
            <Globe className="w-4 h-4 text-[#D9A52E]" />
            <span>Global Investment Corridors</span>
          </div>

          <h2 className="text-3xl sm:text-5xl font-bold tracking-tight text-[#0B1F4B] dark:text-white leading-[1.15]">
            Why Should You Invest in Prime Global Corridors?
          </h2>

          <p className="text-slate-600 dark:text-slate-300 text-base sm:text-lg leading-relaxed font-normal">
            We target high-velocity urban and commercial corridors worldwide. Driven by demographic expansion, infrastructure development, and rapid urbanization, these regions consistently deliver superior risk-adjusted capital appreciation and structured cash flow.
          </p>

          <div className="pt-4 grid grid-cols-2 gap-6">
            <div className="p-5 rounded-2xl bg-[#F5F7FA] dark:bg-[#0D1B32] border border-slate-200 dark:border-slate-800">
              <p className="text-2xl sm:text-3xl font-bold text-[#0B1F4B] dark:text-white">13+</p>
              <p className="text-xs sm:text-sm font-semibold text-slate-500 dark:text-slate-400 mt-1">Global Economic Hubs</p>
            </div>
            <div className="p-5 rounded-2xl bg-[#F5F7FA] dark:bg-[#0D1B32] border border-slate-200 dark:border-slate-800">
              <p className="text-2xl sm:text-3xl font-bold text-emerald-600 dark:text-emerald-400">34%</p>
              <p className="text-xs sm:text-sm font-semibold text-slate-500 dark:text-slate-400 mt-1">Projected Corridor Growth</p>
            </div>
          </div>
        </motion.div>

        {/* Right Column: Interactive Map Graphic with Floating Animated Cards */}
        <motion.div 
          className="lg:col-span-6 relative h-[450px] sm:h-[520px] bg-[#0B1F4B] rounded-3xl p-6 sm:p-10 shadow-2xl overflow-hidden flex items-center justify-center border border-slate-800"
          initial={{ opacity: 0, scale: 0.95 }}
          whileInView={{ opacity: 1, scale: 1 }}
          viewport={{ once: true, amount: 0.2 }}
          transition={{ duration: 0.8, delay: 0.2, ease: [0.22, 1, 0.36, 1] }}
        >
          <div className="absolute inset-0 opacity-10 bg-[radial-gradient(#D9A52E_1px,transparent_1px)] [background-size:24px_24px]"></div>
          <div className="absolute -top-20 -right-20 w-80 h-80 bg-[#D9A52E]/20 rounded-full blur-3xl pointer-events-none"></div>

          <div className="relative w-full h-full flex items-center justify-center">
            <svg className="w-full h-full text-slate-800/80 drop-shadow-2xl" viewBox="0 0 400 300" fill="currentColor" xmlns="http://www.w3.org/2000/svg">
              <path d="M120,40 Q180,20 240,60 T320,140 T280,240 T160,260 T80,180 Z" className="text-[#07152F] fill-current stroke-[#193866] stroke-2" />
              <path d="M180,80 Q220,70 260,110 T240,190 T140,170 Z" className="text-[#091B3A] fill-current stroke-[#263A56] stroke-1" />
            </svg>

            {regions.map((region, index) => (
              <motion.div
                key={index}
                className="absolute z-20 bg-white/95 dark:bg-[#10213B]/95 backdrop-blur-md px-4 py-3 rounded-2xl shadow-xl border border-slate-200 dark:border-slate-700 max-w-[220px]"
                style={{ top: region.top, left: region.left }}
                initial={{ opacity: 0, y: 20, scale: 0.9 }}
                whileInView={{ opacity: 1, y: 0, scale: 1 }}
                viewport={{ once: true }}
                transition={{ duration: 0.6, delay: 0.3 + index * 0.2, ease: "easeOut" }}
                whileHover={{ scale: 1.05 }}
              >
                <div className="flex items-center space-x-2">
                  <div className="w-2.5 h-2.5 rounded-full bg-[#D9A52E] animate-pulse"></div>
                  <span className="text-[10px] font-bold uppercase tracking-wider text-[#B78319] dark:text-[#E5B94F]">{region.hub}</span>
                </div>
                <p className="text-xs font-bold text-[#0B1F4B] dark:text-white mt-1">{region.name}</p>
                <p className="text-[11px] font-semibold text-emerald-600 dark:text-emerald-400 mt-0.5">{region.growth}</p>
              </motion.div>
            ))}
          </div>
        </motion.div>

      </div>
    </section>
  );
}