import React, { useState } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { useAuthStore } from '../store/useAuthStore';
import { LogOut, LayoutDashboard, Sun, Moon, Menu, X } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import logo from '../../public/logo_transparent.png';
import logoDark from '../../public/logoDark.png';

export default function Navbar() {
  const { user, profile, theme, toggleTheme, signOut } = useAuthStore();
  const [isOpen, setIsOpen] = useState(false);
  const navigate = useNavigate();
  const location = useLocation();

  // Hide the global Navbar on authenticated dashboard and admin routes
  const isAuthRoute = 
    location.pathname.startsWith('/dashboard') || 
    location.pathname.startsWith('/admin') || 
    location.pathname.startsWith('/portfolio') || 
    location.pathname.startsWith('/transactions') ||
    location.pathname.startsWith('/settings');

  if (isAuthRoute) {
    return null;
  }

  const handleLogout = async () => {
    setIsOpen(false);
    await signOut();
    navigate('/login');
  };

  const closeMenu = () => setIsOpen(false);

  return (
    <header className="sticky top-0 z-50 bg-white dark:bg-[#071326] border-b border-slate-200 dark:border-slate-800 shadow-sm font-sans transition-colors duration-200">
      <div className="max-w-7xl mx-auto py-3 px-4 sm:px-6 lg:px-8 flex justify-between items-center relative z-20">
        {/* Brand Logo - Dynamically switches based on theme */}
        <Link to="/" onClick={closeMenu} className="p-0">
          <img 
            src={theme === 'dark' ? logoDark : logo} 
            alt="BiggoHomes Logo" 
            className="h-10 sm:h-12 object-contain" 
          />
        </Link>

        {/* Desktop Navigation Links */}
        <nav className="hidden md:flex space-x-8 text-sm font-semibold text-slate-700 dark:text-slate-300">
          <Link to="/properties" className="hover:text-amber-500 transition">Properties</Link>
          <Link to="/invest" className="hover:text-amber-500 transition">Invest</Link>
          <Link to="/calculator" className="hover:text-amber-500 transition">ROI Calculator</Link>
          <Link to="/about" className="hover:text-amber-500 transition">About Us</Link>
        </nav>

        {/* Desktop Right Actions */}
        <div className="hidden md:flex items-center space-x-4">
          <button
            onClick={toggleTheme}
            className="p-2.5 text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg transition"
            aria-label="Toggle Theme"
          >
            {theme === 'light' ? (
              <Moon className="w-5 h-5 text-slate-700" />
            ) : (
              <Sun className="w-5 h-5 text-amber-400" />
            )}
          </button>

          {user ? (
            <div className="flex items-center space-x-3">
              <Link
                to={profile?.role === 'admin' ? "/admin" : "/dashboard"}
                className="flex items-center space-x-2 bg-[#0B1E3D] text-white px-4 py-2.5 rounded-lg text-sm font-semibold hover:bg-slate-800 transition"
              >
                <LayoutDashboard className="w-4 h-4 text-amber-400" />
                <span>Dashboard</span>
              </Link>
              <button
                onClick={handleLogout}
                className="p-2.5 text-slate-500 hover:text-red-500 rounded-lg transition"
                title="Sign Out"
              >
                <LogOut className="w-5 h-5" />
              </button>
            </div>
          ) : (
            <div className="flex items-center space-x-3">
              <Link
                to="/login"
                className="text-slate-700 dark:text-slate-300 hover:text-[#0B1E3D] dark:hover:text-white px-4 py-2 text-sm font-semibold transition"
              >
                Log In
              </Link>
              <Link
                to="/register"
                className="bg-amber-500 hover:bg-amber-400 text-[#0B1E3D] font-bold px-5 py-2.5 rounded-lg text-sm shadow-md transition"
              >
                Get Started
              </Link>
            </div>
          )}
        </div>

        {/* Mobile Controls (Theme Switcher + Hamburger Toggle) */}
        <div className="flex items-center space-x-2 md:hidden">
          <button
            onClick={toggleTheme}
            className="p-2 text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg transition"
            aria-label="Toggle Theme"
          >
            {theme === 'light' ? (
              <Moon className="w-5 h-5 text-slate-700" />
            ) : (
              <Sun className="w-5 h-5 text-amber-400" />
            )}
          </button>

          <button
            onClick={() => setIsOpen(!isOpen)}
            className="p-2 text-slate-700 dark:text-slate-200 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 transition focus:outline-none"
            aria-label="Toggle Menu"
          >
            {isOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
          </button>
        </div>
      </div>

      {/* Mobile Absolute Overlay Menu */}
      <AnimatePresence>
        {isOpen && (
          <>
            {/* Backdrop Overlay */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={closeMenu}
              className="fixed inset-0 top-[65px] bg-black/40 backdrop-blur-xs z-30 md:hidden"
            />

            {/* Floating Absolute Menu Container */}
            <motion.div
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              transition={{ duration: 0.2, ease: 'easeOut' }}
              className="absolute top-full left-0 right-0 z-40 bg-white/95 dark:bg-[#071326]/95 backdrop-blur-md border-b border-slate-200 dark:border-slate-800 shadow-2xl px-6 py-6 md:hidden"
            >
              <nav className="flex flex-col space-y-4 font-semibold text-sm text-slate-700 dark:text-slate-300">
                <Link to="/properties" onClick={closeMenu} className="hover:text-amber-500 transition py-1">
                  Properties
                </Link>
                <Link to="/invest" onClick={closeMenu} className="hover:text-amber-500 transition py-1">
                  Invest
                </Link>
                <Link to="/calculator" onClick={closeMenu} className="hover:text-amber-500 transition py-1">
                  ROI Calculator
                </Link>
                <Link to="/about" onClick={closeMenu} className="hover:text-amber-500 transition py-1">
                  About Us
                </Link>
              </nav>

              <div className="pt-5 mt-5 border-t border-slate-100 dark:border-slate-800">
                {user ? (
                  <div className="flex flex-col space-y-3">
                    <Link
                      to={profile?.role === 'admin' ? "/admin" : "/dashboard"}
                      onClick={closeMenu}
                      className="flex items-center justify-center space-x-2 bg-[#0B1E3D] text-white px-4 py-3 rounded-xl text-sm font-semibold hover:bg-slate-800 transition shadow-md"
                    >
                      <LayoutDashboard className="w-4 h-4 text-amber-400" />
                      <span>Dashboard</span>
                    </Link>
                    <button
                      onClick={handleLogout}
                      className="flex items-center justify-center space-x-2 w-full text-slate-500 hover:text-red-500 py-2 rounded-xl text-sm font-semibold transition"
                    >
                      <LogOut className="w-4 h-4" />
                      <span>Sign Out</span>
                    </button>
                  </div>
                ) : (
                  <div className="flex flex-col space-y-3">
                    <Link
                      to="/login"
                      onClick={closeMenu}
                      className="text-center text-slate-700 dark:text-slate-300 hover:text-[#0B1E3D] border border-slate-200 dark:border-slate-700 py-3 rounded-xl text-sm font-semibold transition"
                    >
                      Log In
                    </Link>
                    <Link
                      to="/register"
                      onClick={closeMenu}
                      className="text-center bg-amber-500 hover:bg-amber-400 text-[#0B1E3D] font-bold py-3 rounded-xl text-sm shadow-md transition"
                    >
                      Get Started
                    </Link>
                  </div>
                )}
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </header>
  );
}