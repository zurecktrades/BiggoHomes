import React from 'react';
import { Outlet } from 'react-router-dom';
import { useAuthStore } from '../../store/useAuthStore';
import Sidebar from '../SideBar';

export default function DashboardLayout() {
  const { user, profile } = useAuthStore();

  return (
    <div className="min-h-screen flex bg-slate-50 dark:bg-[#071326] text-slate-900 dark:text-slate-100 font-sans transition-colors duration-300 w-full">
      
      {/* Sidebar Navigation */}
      <Sidebar role={profile?.role} />

      {/* Main Content Area */}
      <div className="flex-1 flex flex-col min-w-0 overflow-hidden">
        {/* Nested child routes will render right here */}
        <main className="flex-1 overflow-y-auto p-4 sm:p-6 lg:p-8">
          <Outlet />
        </main>
      </div>

    </div>
  );
}