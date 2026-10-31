import React from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { useAuthStore } from '../store/useAuthStore';
import { 
  LayoutDashboard, 
  Building, 
  Users, 
  FileText, 
  Wallet, 
  PieChart, 
  Settings, 
  LogOut, 
  X,
  Globe,
  Sun,
  Moon
} from 'lucide-react';
import logo from '../../public/logo_transparent.png';
import logoDark from '../../public/logoDark.png';

export default function Sidebar({ mobileOpen, setMobileOpen }) {
  const { profile, signOut, theme, toggleTheme } = useAuthStore();
  const location = useLocation();
  const navigate = useNavigate();

  // Determine user role (defaults to 'investor' if not loaded or set)
  const role = profile?.role || 'investor';

  // Navigation items for Standard Investors
  const investorLinks = [
    { name: 'Dashboard', path: '/dashboard', icon: LayoutDashboard },
    { name: 'Explore Properties', path: '/properties', icon: Building },
    { name: 'My Portfolio', path: '/portfolio', icon: PieChart },
    { name: 'Transactions', path: '/transactions', icon: Wallet },
    { name: 'Settings', path: '/settings', icon: Settings },
  ];

  // Navigation items for Administrators
  const adminLinks = [
    { name: 'Admin Dashboard', path: '/admin', icon: LayoutDashboard },
    { name: 'Manage Properties', path: '/admin/properties', icon: Building },
    { name: 'Investors', path: '/admin/investors', icon: Users },
    { name: 'Audit Reports', path: '/admin/reports', icon: FileText },
    { name: 'Settings', path: '/admin/settings', icon: Settings },
  ];

  // Switch links based on role
  const navItems = role === 'admin' ? adminLinks : investorLinks;

  const handleLogout = async () => {
    await signOut();
    navigate('/login');
  };

  return (
    <>
      {/* Mobile Backdrop Overlay */}
      {mobileOpen && (
        <div 
          className="fixed inset-0 z-40 bg-black/50 backdrop-blur-sm lg:hidden"
          onClick={() => setMobileOpen(false)}
        />
      )}

      {/* Sidebar Container */}
      <aside className={`
        fixed inset-y-0 left-0 z-50 w-64 bg-white dark:bg-[#0B1F4B] border-r border-slate-200 dark:border-slate-800 text-slate-900 dark:text-white flex flex-col transition-transform duration-300 ease-in-out
        lg:translate-x-0 ${mobileOpen ? 'translate-x-0' : '-translate-x-full'}
      `}>
        {/* Brand Header with Dual Logos & Theme Switcher */}
        <div className="p-5 flex items-center justify-between border-b border-slate-200 dark:border-white/10 flex-shrink-0">
          <Link to="/" className="flex items-center space-x-2.5 overflow-hidden">
            <img 
              src={theme === 'dark' ? logoDark : logo} 
              alt="BiggoHomes Logo" 
              className="h-8 md:h-12 object-contain" 
            />
          </Link>

          <div className="flex items-center space-x-1">
            {/* Theme Toggle Button */}
            <button
              onClick={toggleTheme}
              className="p-2 text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-white/10 rounded-lg transition"
              aria-label="Toggle Theme"
              title="Toggle Theme"
            >
              {theme === 'light' ? (
                <Moon className="w-4 h-4 text-slate-700" />
              ) : (
                <Sun className="w-4 h-4 text-amber-400" />
              )}
            </button>

            {/* Close button for mobile drawer */}
            <button 
              onClick={() => setMobileOpen(false)} 
              className="lg:hidden text-slate-400 hover:text-white p-1 rounded-lg"
              aria-label="Close Sidebar"
            >
              <X className="w-6 h-6" />
            </button>
          </div>
        </div>

        {/* Dynamic Navigation Links */}
        <nav className="flex-1 px-4 py-6 space-y-1.5 overflow-y-auto">
          <p className="px-4 text-[10px] font-bold uppercase tracking-wider text-slate-400 dark:text-slate-400 mb-2">
            {role === 'admin' ? 'Admin Portal' : 'Investor Portal'}
          </p>
          {navItems.map((item) => {
            const Icon = item.icon;
            const isActive = location.pathname === item.path;
            return (
              <Link
                key={item.name}
                to={item.path}
                onClick={() => setMobileOpen(false)}
                className={`flex items-center space-x-3 px-4 py-3 rounded-xl text-sm font-semibold transition ${
                  isActive 
                    ? 'bg-[#D9A52E] text-[#0B1F4B] shadow-lg shadow-[#D9A52E]/10' 
                    : 'text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-white/5 hover:text-slate-900 dark:hover:text-white'
                }`}
              >
                <Icon className="w-5 h-5" />
                <span>{item.name}</span>
              </Link>
            );
          })}
        </nav>

        {/* Footer Actions */}
        <div className="p-4 border-t pb-12 border-slate-200 dark:border-white/10 space-y-2 flex-shrink-0">
          <button
            onClick={handleLogout}
            className="w-full flex items-center space-x-3 px-4 py-2.5 rounded-xl text-sm font-semibold text-red-500 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-500/10 transition"
          >
            <LogOut className="w-4 h-4" />
            <span>Sign Out</span>
          </button>
        </div>
      </aside>
    </>
  );
}