import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Building2, ShieldCheck, TrendingUp, Globe, 
  Award, Lock, ArrowRight, CheckCircle2, ChevronRight, ChevronLeft, Wallet 
} from 'lucide-react';
import { Link } from 'react-router-dom';

const statsSlides = [
  [
    { value: "4,800+", label: "Trusted Investors" },
    { value: "18.5%", label: "Avg. Annualized Returns" },
    { value: "$24M+", label: "Invested in Real Estate" },
    { value: "45+", label: "Projects Completed" },
  ],
  [
    { value: "120+", label: "Active Property Deals" },
    { value: "99.4%", label: "Investor Satisfaction" },
    { value: "$50M+", label: "Total Asset Value" },
    { value: "15+", label: "Prime Urban Locations" },
  ],
];

const coreValues = [
  {
    icon: Building2,
    title: 'Institutional Grade Assets',
    description: 'We curate premium commercial, residential, and mixed-use properties in prime high-growth economic corridors.'
  },
  {
    icon: ShieldCheck,
    title: 'Bank-Grade Transparency',
    description: 'Every share is deeded and backed by verifiable asset contracts. View complete property audit trails directly in your portal.'
  },
  {
    icon: TrendingUp,
    title: 'Daily Accrued Yields',
    description: 'Our proprietary Yield Shield schedule tracks and credits daily profit accruals straight to your investment portfolio.'
  },
  {
    icon: Lock,
    title: 'Principal Liquidity Protection',
    description: 'Flexible share liquidation controls ensuring investors retain full ownership of their underlying capital.'
  }
];

export default function AboutUsPage() {
  // Stats Carousel State
  const [currentSlide, setCurrentSlide] = useState(0);

  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentSlide((prev) => (prev + 1) % statsSlides.length);
    }, 5000);
    return () => clearInterval(timer);
  }, []);

  const nextSlide = () => {
    setCurrentSlide((prev) => (prev + 1) % statsSlides.length);
  };

  const prevSlide = () => {
    setCurrentSlide((prev) => (prev - 1 + statsSlides.length) % statsSlides.length);
  };

  return (
    <div className="font-sans text-slate-900 dark:text-white space-y-16 sm:space-y-24 pb-20 max-w-7xl mx-auto px-4">
      
      {/* Hero Section */}
      <div className="relative pt-8 sm:pt-16 pb-8 text-center space-y-6 max-w-4xl mx-auto">
        <div className="inline-flex items-center space-x-2 px-3 py-1.5 rounded-full bg-amber-500/10 border border-amber-500/30 text-amber-500 text-xs font-bold uppercase tracking-widest">
          <Globe className="w-3.5 h-3.5" />
          <span>Democratizing Real Estate Ownership</span>
        </div>

        <h1 className="text-3xl sm:text-5xl lg:text-6xl font-extrabold tracking-tight leading-tight">
          Building the Future of Fractional <span className="text-transparent bg-clip-text bg-gradient-to-r from-amber-500 to-[#D9A52E]">Real Estate Wealth</span>
        </h1>

        <p className="text-sm sm:text-base text-slate-600 dark:text-slate-300 leading-relaxed max-w-2xl mx-auto">
          BiggoHomes bridges the gap between institutional-grade property developments and global retail investors through fractional ownership, automated yield distribution, and modern fintech transparency.
        </p>
      </div>

      {/* Synchronized Carousel Stats Banner */}
      <div className="relative border border-[#E5E9F0] bg-white dark:bg-[#0B1F4B] dark:border-slate-800 rounded-3xl p-6 sm:p-8 shadow">
        <div className="absolute left-2 right-2 top-1/2 -translate-y-1/2 flex justify-between z-20 pointer-events-none">
          <button
            onClick={prevSlide}
            className="pointer-events-auto p-2 rounded-full bg-slate-100 dark:bg-[#10213B] shadow-md border border-[#E5E9F0] dark:border-[#263A56] text-[#0B1F4B] dark:text-white hover:bg-slate-200 transition"
            aria-label="Previous Stats"
          >
            <ChevronLeft className="w-5 h-5" />
          </button>
          <button
            onClick={nextSlide}
            className="pointer-events-auto p-2 rounded-full bg-slate-100 dark:bg-[#10213B] shadow-md border border-[#E5E9F0] dark:border-[#263A56] text-[#0B1F4B] dark:text-white hover:bg-slate-200 transition"
            aria-label="Next Stats"
          >
            <ChevronRight className="w-5 h-5" />
          </button>
        </div>

        <div className="overflow-hidden px-8 sm:px-12">
          <AnimatePresence mode="wait">
            <motion.div
              key={currentSlide}
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              transition={{ duration: 0.4, ease: "easeInOut" }}
              className="grid grid-cols-2 gap-6 text-center md:grid-cols-4"
            >
              {statsSlides[currentSlide].map((stat, idx) => (
                <div key={idx} className="rounded-2xl px-2 space-y-1">
                  <p className="text-2xl sm:text-4xl font-extrabold text-amber-500 tracking-tight">
                    {stat.value}
                  </p>
                  <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-300 font-semibold">
                    {stat.label}
                  </p>
                </div>
              ))}
            </motion.div>
          </AnimatePresence>
        </div>

        <div className="flex justify-center space-x-2 mt-6">
          {statsSlides.map((_, idx) => (
            <button
              key={idx}
              onClick={() => setCurrentSlide(idx)}
              className={`h-2 rounded-full transition-all duration-300 ${
                currentSlide === idx ? "w-6 bg-[#D9A52E]" : "w-2 bg-slate-300 dark:bg-slate-700"
              }`}
              aria-label={`Go to slide ${idx + 1}`}
            />
          ))}
        </div>
      </div>

      {/* Mission & Vision Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 items-center">
        <div className="space-y-6">
          <span className="text-xs font-bold uppercase tracking-wider text-amber-500">Our Mission</span>
          <h2 className="text-2xl sm:text-4xl font-bold tracking-tight">
            Unlocking institutional property returns for investors everywhere.
          </h2>
          <p className="text-xs sm:text-sm text-slate-600 dark:text-slate-300 leading-relaxed">
            Traditionally, high-yield commercial real estate and prime residential developments were reserved strictly for ultra-high-net-worth individuals and institutional funds. 
          </p>
          <p className="text-xs sm:text-sm text-slate-600 dark:text-slate-300 leading-relaxed">
            BiggoHomes changes this dynamic. By fractionalizing property equity into digital shares, we enable investors to buy fractions of prime real estate with minimal capital, while earning daily automated rental yield accruals directly stored in our secure database.
          </p>

          <div className="space-y-3 pt-2">
            {[
              'Direct share fractionalization starting from low minimum entry limits',
              'Real-time daily yield tracking powered by verified database schedules',
              'Principal protection mechanisms with share liquidation options',
              'Comprehensive investor concierge support and wealth management'
            ].map((item, idx) => (
              <div key={idx} className="flex items-center space-x-3 text-xs sm:text-sm font-semibold">
                <CheckCircle2 className="w-4 h-4 text-emerald-500 flex-shrink-0" />
                <span>{item}</span>
              </div>
            ))}
          </div>
        </div>

        <div className="relative bg-gradient-to-br from-[#0B1F4B] to-[#071326] p-8 sm:p-12 rounded-3xl text-white border border-amber-500/20 shadow-2xl space-y-6 overflow-hidden">
          <div className="absolute top-0 right-0 w-64 h-64 bg-amber-500/10 rounded-full blur-3xl pointer-events-none" />
          
          <div className="w-12 h-12 rounded-2xl bg-amber-500/20 text-amber-400 flex items-center justify-center font-bold">
            <Award className="w-6 h-6" />
          </div>

          <h3 className="text-xl sm:text-2xl font-bold">The BiggoHomes Advantage</h3>
          <p className="text-xs sm:text-sm text-slate-300 leading-relaxed">
            We operate at the intersection of physical real estate appraisal and high-velocity financial technology. Every asset listed on BiggoHomes undergoes rigorous legal due diligence, title verification, and market yield projections before hitting our private or public sales desks.
          </p>

          <div className="pt-4 border-t border-white/10 flex justify-between items-center text-xs font-bold text-amber-400">
            <span>Verified Real-Asset Backing</span>
            <ChevronRight className="w-4 h-4" />
          </div>
        </div>
      </div>

      {/* Core Pillars / Value Cards */}
      <div className="space-y-8">
        <div className="text-center max-w-2xl mx-auto space-y-2">
          <h2 className="text-2xl sm:text-3xl font-bold tracking-tight">Why Choose BiggoHomes?</h2>
          <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400">
            Engineered for security, growth, and seamless portfolio liquidity.
          </p>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
          {coreValues.map((value, idx) => {
            const Icon = value.icon;
            return (
              <div 
                key={idx} 
                className="bg-white dark:bg-[#0B1F4B] border border-slate-200 dark:border-slate-800 rounded-3xl p-6 shadow-sm hover:border-amber-500/50 transition space-y-4"
              >
                <div className="p-3 rounded-2xl bg-amber-500/10 text-amber-500 w-fit">
                  <Icon className="w-6 h-6" />
                </div>
                <h3 className="text-sm font-bold text-slate-900 dark:text-white">{value.title}</h3>
                <p className="text-xs text-slate-500 dark:text-slate-300 leading-relaxed">{value.description}</p>
              </div>
            );
          })}
        </div>
      </div>

      {/* Call To Action */}
      <div className="relative overflow-hidden rounded-3xl bg-gradient-to-r from-[#0B1F4B] via-[#102a63] to-[#0B1F4B] p-8 sm:p-12 text-center text-white border border-amber-500/30 shadow-2xl space-y-6">
        <div className="absolute -left-10 -bottom-10 w-64 h-64 bg-amber-500/10 rounded-full blur-3xl pointer-events-none" />
        
        <h2 className="text-2xl sm:text-4xl font-extrabold max-w-2xl mx-auto">
          Start Building Your Fractional Real Estate Portfolio Today
        </h2>

        <p className="text-xs sm:text-sm text-slate-300 max-w-xl mx-auto">
          Join thousands of investors earning daily yield returns from prime property holdings worldwide.
        </p>

        <div className="pt-2">
          <Link
            to="/auth"
            className="inline-flex items-center space-x-2 px-8 py-4 rounded-2xl bg-amber-500 hover:bg-amber-400 text-[#0B1F4B] font-extrabold text-xs sm:text-sm shadow-xl transition"
          >
            <span>Create Free Investor Account</span>
            <ArrowRight className="w-4 h-4" />
          </Link>
        </div>
      </div>

    </div>
  );
}