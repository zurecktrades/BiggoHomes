import React from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuthStore } from '../store/useAuthStore';
import { LogOut, LayoutDashboard, Sun, Moon } from 'lucide-react';
import logo from '../../public/logo_transparent.png';

export default function Navbar() {
  const { user, profile, theme, toggleTheme, signOut } = useAuthStore();
  const navigate = useNavigate();

  const handleLogout = async () => {
    await signOut();
    navigate('/login');
  };

  return (
    <header className="sticky top-0 z-50 bg-white border-b border-slate-200 dark:border-slate-800 shadow-sm font-sans transition-colors duration-200">
      <div className="max-w-7xl mx-auto py-3 flex justify-between items-center">
        {/* Brand Logo */}
        <Link to="/" className="p-0">
          <img src={logo} alt="site logo" className="h-12" />
        </Link>

        {/* Navigation */}
        <nav className="hidden md:flex space-x-8 text-sm font-semibold text-slate-700 dark:text-slate-700">
          <Link to="/properties" className="hover:text-amber-500 transition">Properties</Link>
          <Link to="/calculator" className="hover:text-amber-500 transition">ROI Calculator</Link>
          <Link to="/about" className="hover:text-amber-500 transition">About Us</Link>
        </nav>

        {/* Right Actions */}
        <div className="flex items-center space-x-4">
          {/* Light / Dark Mode Toggle Button */}
          <button
            onClick={toggleTheme}
            className="p-2.5 text-slate-600  hover:bg-slate-200/40 rounded-lg transition"
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
                className="text-slate-700 dark:text-slate-700 hover:text-[#0B1E3D] dark:hover:text-white px-4 py-2 text-sm font-semibold transition"
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
      </div>
    </header>
  );
}