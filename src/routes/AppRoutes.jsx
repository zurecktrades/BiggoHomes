import React, { useEffect } from 'react';
import { Routes, Route } from 'react-router-dom';
import { useAuthStore } from '../store/useAuthStore';

// Components & Layouts
import Navbar from '../components/Navbar';
import Footer from '../components/Footer';
import ProtectedRoute from '../components/ProtectedRoute';
import ClientLayout from '../components/layouts/ClientLayout';
import AdminLayout from '../components/layouts/AdminLayout';

// Pages
import LandingPage from '../pages/LandingPages';
import LoginPage from '../pages/LoginPage';
import DashboardPage from '../pages/DashboardPage';
import AdminDashboardPage from '../pages/AdminDashboardPage';
import PropertiesPage from '../pages/PropertiesPage';

//Admin Pages
import Chat from '../pages/admin/Chat'

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
      <Routes>
        {/* --- PUBLIC ROUTES (With Navbar & Footer) --- */}
        <Route path="/" element={<><Navbar /><main className="flex-1"><LandingPage /></main><Footer /></>} />
        <Route path="/properties" element={<><Navbar /><main className="flex-1"><PropertiesPage /></main><Footer /></>} />
        <Route path="/auth" element={<><Navbar /><main className="flex-1"><LoginPage /></main><Footer /></>} />
        <Route path="/login" element={<><Navbar /><main className="flex-1"><LoginPage /></main><Footer /></>} />
        <Route path="/register" element={<><Navbar /><main className="flex-1"><LoginPage /></main><Footer /></>} />

        {/* --- INVESTOR / CLIENT PORTAL (Protected + ClientLayout with Sidebar) --- */}
        <Route element={<ProtectedRoute />}>
          <Route element={<ClientLayout />}>
            <Route path="/dashboard" element={<DashboardPage />} />
            {/* You can add portfolio, transactions, settings here later */}
          </Route>
        </Route>

        {/* --- ADMIN PORTAL (Protected + AdminLayout with Sidebar) --- */}
        <Route element={<ProtectedRoute requireAdmin={true} />}>
          <Route element={<AdminLayout />}>
            <Route path="/admin" element={<AdminDashboardPage />} />
            <Route path='/admin/chat' element={<Chat />} />
            {/* Add other admin sub-routes here later */}
          </Route>
        </Route>
      </Routes>
    </div>
  );
}