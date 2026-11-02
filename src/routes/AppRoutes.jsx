import React, { useEffect } from 'react';
import { Routes, Route } from 'react-router-dom';
import { useAuthStore } from '../store/useAuthStore';

// Components & Layouts
import Navbar from '../components/Navbar';
import Footer from '../components/Footer';
import ProtectedRoute from '../components/ProtectedRoute';
import ClientLayout from '../components/layouts/ClientLayout';
import AdminLayout from '../components/layouts/AdminLayout';

// Public Pages
import LandingPage from '../pages/LandingPages';
import LoginPage from '../pages/LoginPage';
import AboutUsPage from '../pages/About';
import CalculatorPage from '../pages/RoiCalculator';

// Client Pages
import InvestorDashboard from '../pages/DashboardPage';
import Properties from '../pages/client/Properties';
import PropertyDetailsPage from '../pages/client/PropertyDetailsPage';
import WalletPage from '../pages/client/WalletPage';
import AccountManagerPage from '../pages/client/ChatManager';
import TransactionsPage from '../pages/client/TransactionHistory';
import InvestorSettings from '../pages/client/Settings';
import WithdrawPage from '../pages/client/Withdraw';
import Myproperties from '../pages/client/MyProperties';

// Admin Pages
import AdminDashboardPage from '../pages/AdminDashboardPage';
import Chat from '../pages/admin/Chat';
import ListProperties from '../pages/admin/ListProperties';
import Investors from '../pages/admin/Investors';
import AdminTransactionsPage from '../pages/admin/AdminTransaction';
import ScrollToTop from '../components/ScrollToTop';
import AdminWalletSettingsPage from '../pages/admin/AdminWalletSettingsPage';

export default function AppRoutes() {
  const { initAuth, theme } = useAuthStore();

  useEffect(() => {
    initAuth();
  }, [initAuth]);

  useEffect(() => {
    const root = document.documentElement;
    if (theme === 'dark') {
      root.classList.add('dark');
    } else {
      root.classList.remove('dark');
    }
  }, [theme]);

  return (
    <div className="min-h-screen flex flex-col bg-white dark:bg-[#071326] text-[#172338] dark:text-slate-100 transition-colors duration-300 font-sans">
      <ScrollToTop />
      <Routes>
        {/* --- PUBLIC ROUTES (With Navbar & Footer) --- */}
        <Route path="/" element={<><Navbar /><main className="flex-1"><LandingPage /></main><Footer /></>} />
        <Route path="/about" element={<><Navbar /><main className="flex-1"><AboutUsPage /></main><Footer /></>} />
        <Route path="/auth" element={<><Navbar /><main className="flex-1"><LoginPage /></main><Footer /></>} />
        <Route path="/login" element={<><Navbar /><main className="flex-1"><LoginPage /></main><Footer /></>} />
        <Route path="/register" element={<><Navbar /><main className="flex-1"><LoginPage /></main><Footer /></>} />
        <Route path="/calculator" element={<><Navbar /><main className="flex-1"><CalculatorPage /></main><Footer /></>} />

        {/* --- INVESTOR / CLIENT PORTAL (Protected + ClientLayout with Sidebar) --- */}
        <Route element={<ProtectedRoute />}>
          <Route element={<ClientLayout />}>
            <Route path="/dashboard" element={<InvestorDashboard />} />
            <Route path="/properties-listing" element={<Properties />} />
            <Route path="/properties/:id" element={<PropertyDetailsPage />} />
            <Route path="/wallet" element={<WalletPage />} />
            <Route path="/my-properties" element={<Myproperties />} />
            <Route path="/withdraw" element={<WithdrawPage />} />
            <Route path="/transactions" element={<TransactionsPage />} />
            <Route path="/chat-manager" element={<AccountManagerPage />} />
            <Route path="/settings" element={<InvestorSettings />} />
          </Route>
        </Route>

        {/* --- ADMIN PORTAL (Protected + AdminLayout with Sidebar) --- */}
        <Route element={<ProtectedRoute requireAdmin={true} />}>
          <Route element={<AdminLayout />}>
            <Route path="/admin" element={<AdminDashboardPage />} />
            <Route path="/admin/chat" element={<Chat />} />
            <Route path="/admin/listing" element={<ListProperties />} />
            <Route path="/admin/investors" element={<Investors />} />
            <Route path="/admin/transactions" element={<AdminTransactionsPage />} />
            <Route path="/admin/wallet" element={<AdminWalletSettingsPage />} />
          </Route>
        </Route>
      </Routes>
    </div>
  );
}