import React, { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useAuthStore } from '../store/useAuthStore';
import { motion, AnimatePresence } from 'framer-motion';
import { ArrowRight, Lock, Mail, User, Loader2, AlertCircle, Building2, ShieldCheck, Globe, TrendingUp, X, CheckCircle2 } from 'lucide-react';
import { toast } from 'react-toastify';

const showcaseSlides = [
  {
    icon: Building2,
    badge: "Global Asset Access",
    title: "Institutional Real Estate at Your Fingertips",
    description: "Participate in high-velocity commercial and residential opportunities across prime international economic corridors."
  },
  {
    icon: ShieldCheck,
    badge: "Transparent Terms",
    description: "Access complete project disclosures, audit statements, and structured distribution schedules directly in your portal.",
    title: "Real-Asset Backed Security"
  },
  {
    icon: TrendingUp,
    badge: "Structured Returns",
    title: "Consistent Multi-Currency Yields",
    description: "Track your international portfolio growth, quarterly payout distributions, and long-term equity appreciation."
  }
];

// Custom toast notification styling helper
const showCustomToast = (title, message) => {
  toast(
    <div className="flex items-start space-x-3 py-1">
      <div className="p-2 rounded-xl bg-amber-500/10 text-[#D9A52E] flex-shrink-0 mt-0.5">
        <CheckCircle2 className="w-5 h-5" />
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

export default function AuthPage() {
  const location = useLocation();
  const [isLogin, setIsLogin] = useState(!location.pathname.includes('register'));

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [fullName, setFullName] = useState('');
  
  const [error, setError] = useState(null);
  const [loading, setLoading] = useState(false);
  const [slideIndex, setSlideIndex] = useState(0);
  
  const { signIn, signUp } = useAuthStore();
  const navigate = useNavigate();

  // Auto-dismiss error message after 4 seconds
  useEffect(() => {
    if (error) {
      const timer = setTimeout(() => {
        setError(null);
      }, 4000);
      return () => clearTimeout(timer);
    }
  }, [error]);

  // Rotate right-side animated showcase slides on desktop
  useEffect(() => {
    const timer = setInterval(() => {
      setSlideIndex((prev) => (prev + 1) % showcaseSlides.length);
    }, 6000);
    return () => clearInterval(timer);
  }, []);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError(null);
    setLoading(true);

    try {
      if (isLogin) {
        const { error } = await signIn(email, password);
        if (error) throw error;
        showCustomToast("Welcome Back!", "Successfully logged into your investor dashboard.");
      } else {
        const { error } = await signUp(email, password, { full_name: fullName });
        if (error) throw error;
        showCustomToast("Account Created!", "Your BiggoHomes account has been successfully registered.");
      }
      navigate('/dashboard');
    } catch (err) {
      setError(err.message || 'Authentication failed. Please check your details.');
    } finally {
      setLoading(false);
    }
  };

  const currentShowcase = showcaseSlides[slideIndex];
  const Icon = currentShowcase.icon;

  return (
    <main className="min-h-[88vh] flex items-center justify-center bg-slate-50 dark:bg-[#071326] px-4 py-12 font-sans transition-colors duration-300">
      <div className="max-w-5xl w-full bg-white dark:bg-[#0D1B32] border border-slate-200 dark:border-slate-800 rounded-3xl shadow-2xl overflow-hidden grid lg:grid-cols-12">
        
        {/* Left Column: Form & Animated Tabs */}
        <div className="lg:col-span-7 p-8 sm:p-12 flex flex-col justify-center">
          
          <div className="mb-8">
            <h2 className="text-2xl sm:text-3xl font-bold text-[#0B1F4B] dark:text-white">
              {isLogin ? 'Welcome Back' : 'Get Started'}
            </h2>
            <p className="text-sm text-slate-500 dark:text-slate-400 mt-2">
              {isLogin ? 'Log in to manage your global real estate portfolio' : 'Create an investor account to start exploring opportunities'}
            </p>
          </div>

          {/* Animated Error Alert Box (Fades In & Fades Out Automatically) */}
          <AnimatePresence>
            {error && (
              <motion.div 
                initial={{ opacity: 0, y: -15, height: 0 }} 
                animate={{ opacity: 1, y: 0, height: 'auto' }} 
                exit={{ opacity: 0, y: -15, height: 0 }}
                transition={{ duration: 0.3, ease: 'easeInOut' }}
                className="mb-6 overflow-hidden"
              >
                <div className="p-4 rounded-xl bg-red-500/10 border border-red-500/20 flex items-center justify-between text-red-500 text-sm">
                  <div className="flex items-center space-x-3">
                    <AlertCircle className="w-5 h-5 flex-shrink-0" />
                    <span>{error}</span>
                  </div>
                  <button 
                    type="button" 
                    onClick={() => setError(null)}
                    className="text-red-400 hover:text-red-600 transition"
                  >
                    <X className="w-4 h-4" />
                  </button>
                </div>
              </motion.div>
            )}
          </AnimatePresence>

          {/* Animated Tabs Header */}
          <div className="relative flex bg-slate-100 dark:bg-[#10213B] p-1.5 rounded-2xl mb-8">
            <button
              type="button"
              onClick={() => { setIsLogin(true); setError(null); }}
              className={`relative flex-1 py-2.5 text-sm font-semibold rounded-xl transition-colors z-10 ${
                isLogin ? 'text-[#0B1F4B] dark:text-white' : 'text-slate-500 hover:text-slate-900 dark:hover:text-white'
              }`}
            >
              Log In
            </button>
            <button
              type="button"
              onClick={() => { setIsLogin(false); setError(null); }}
              className={`relative flex-1 py-2.5 text-sm font-semibold rounded-xl transition-colors z-10 ${
                !isLogin ? 'text-[#0B1F4B] dark:text-white' : 'text-slate-500 hover:text-slate-900 dark:hover:text-white'
              }`}
            >
              Register
            </button>

            {/* Sliding Tab Background Indicator */}
            <motion.div
              className="absolute top-1.5 bottom-1.5 w-[calc(50%-6px)] bg-white dark:bg-[#0B1F4B] rounded-xl shadow-md z-0"
              animate={{ left: isLogin ? '6px' : 'calc(50% + 3px)' }}
              transition={{ type: 'spring', stiffness: 300, damping: 30 }}
            />
          </div>

          {/* Animated Form Fields */}
          <AnimatePresence mode="wait">
            <motion.form
              key={isLogin ? 'login' : 'register'}
              initial={{ opacity: 0, x: isLogin ? -15 : 15 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: isLogin ? 15 : -15 }}
              transition={{ duration: 0.25, ease: 'easeInOut' }}
              onSubmit={handleSubmit}
              className="space-y-5"
            >
              {!isLogin && (
                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider text-slate-600 dark:text-slate-300 mb-2">Full Name</label>
                  <div className="relative">
                    <span className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none text-slate-400">
                      <User className="w-5 h-5" />
                    </span>
                    <input
                      type="text"
                      required
                      value={fullName}
                      onChange={(e) => setFullName(e.target.value)}
                      placeholder="John Doe"
                      className="w-full pl-11 pr-4 py-3 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-[#10213B] text-slate-900 dark:text-white text-sm focus:outline-none focus:border-[#D9A52E]"
                    />
                  </div>
                </div>
              )}

              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-slate-600 dark:text-slate-300 mb-2">Email Address</label>
                <div className="relative">
                  <span className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none text-slate-400">
                    <Mail className="w-5 h-5" />
                  </span>
                  <input
                    type="email"
                    required
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="investor@example.com"
                    className="w-full pl-11 pr-4 py-3 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-[#10213B] text-slate-900 dark:text-white text-sm focus:outline-none focus:border-[#D9A52E]"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-slate-600 dark:text-slate-300 mb-2">Password</label>
                <div className="relative">
                  <span className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none text-slate-400">
                    <Lock className="w-5 h-5" />
                  </span>
                  <input
                    type="password"
                    required
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="••••••••"
                    className="w-full pl-11 pr-4 py-3 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-[#10213B] text-slate-900 dark:text-white text-sm focus:outline-none focus:border-[#D9A52E]"
                  />
                </div>
              </div>

              <button
                type="submit"
                disabled={loading}
                className="w-full flex items-center justify-center gap-2 py-3.5 px-4 rounded-xl bg-[#0B1F4B] dark:bg-[#D9A52E] text-white dark:text-[#0B1F4B] font-bold text-sm shadow-lg hover:opacity-90 transition disabled:opacity-50 mt-2"
              >
                {loading ? (
                  <Loader2 className="w-5 h-5 animate-spin" />
                ) : (
                  <>
                    {isLogin ? 'Log In to Dashboard' : 'Complete Registration'} 
                    <ArrowRight className="w-4 h-4" />
                  </>
                )}
              </button>
            </motion.form>
          </AnimatePresence>

          <div className="text-center text-sm text-slate-500 dark:text-slate-400 mt-8">
            {isLogin ? (
              <p>
                Don't have an account?{' '}
                <button type="button" onClick={() => setIsLogin(false)} className="font-bold text-[#B78319] dark:text-[#E5B94F] hover:underline">
                  Register here
                </button>
              </p>
            ) : (
              <p>
                Already have an account?{' '}
                <button type="button" onClick={() => setIsLogin(true)} className="font-bold text-[#B78319] dark:text-[#E5B94F] hover:underline">
                  Log in here
                </button>
              </p>
            )}
          </div>

        </div>

        {/* Right Column: Animated Desktop Showcase Section */}
        <div className="hidden lg:flex lg:col-span-5 relative bg-[#0B1F4B] p-10 flex-col justify-between overflow-hidden text-white border-l border-white/10">
          
          <div className="absolute -top-20 -right-20 w-72 h-72 bg-[#D9A52E]/20 rounded-full blur-3xl pointer-events-none" />
          <div className="absolute -bottom-20 -left-20 w-72 h-72 bg-blue-400/10 rounded-full blur-3xl pointer-events-none" />

          <div className="relative z-10 flex items-center space-x-2 text-xs font-bold uppercase tracking-widest text-[#E5B94F]">
            <Globe className="w-4 h-4 text-[#D9A52E]" />
            <span>BiggoHomes Global</span>
          </div>

          <div className="relative z-10 my-auto py-12">
            <AnimatePresence mode="wait">
              <motion.div
                key={slideIndex}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -20 }}
                transition={{ duration: 0.5, ease: "easeInOut" }}
                className="space-y-6"
              >
                <div className="inline-flex p-3 rounded-2xl bg-white/10 border border-white/10 text-[#E5B94F]">
                  <Icon className="w-7 h-7" />
                </div>
                
                <span className="block text-xs font-bold uppercase tracking-wider text-[#E5B94F]">
                  {currentShowcase.badge}
                </span>

                <h3 className="text-2xl font-bold text-white leading-snug">
                  {currentShowcase.title}
                </h3>

                <p className="text-sm leading-relaxed text-slate-300 font-normal">
                  {currentShowcase.description}
                </p>
              </motion.div>
            </AnimatePresence>
          </div>

          <div className="relative z-10 flex items-center space-x-2">
            {showcaseSlides.map((_, idx) => (
              <button
                key={idx}
                type="button"
                onClick={() => setSlideIndex(idx)}
                className={`h-1.5 rounded-full transition-all duration-300 ${
                  slideIndex === idx ? "w-7 bg-[#D9A52E]" : "w-2 bg-white/20"
                }`}
                aria-label={`Go to showcase slide ${idx + 1}`}
              />
            ))}
          </div>

        </div>

      </div>
    </main>
  );
}