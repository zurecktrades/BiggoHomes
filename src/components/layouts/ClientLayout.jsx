import React, { useState } from 'react';
import { Outlet } from 'react-router-dom';
import { useAuthStore } from '../../store/useAuthStore';
import Sidebar from '../SideBar';
import { Menu } from 'lucide-react';
import AccountManagerChat from '../clients/AccountManagerChat';

export default function ClientLayout() {
  const { profile } = useAuthStore();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  // Extract first name and generate stylish initials
  const fullName = profile?.full_name || 'Investor';
  const firstName = fullName.split(' ')[0];
  const initials = fullName
    .split(' ')
    .map(n => n[0])
    .join('')
    .toUpperCase()
    .slice(0, 2);

  return (
    <div className="h-screen w-screen overflow-hidden flex bg-slate-100 dark:bg-[#050B14] font-sans text-slate-900 dark:text-slate-100">
      
      {/* Sidebar Component */}
      <Sidebar mobileOpen={mobileMenuOpen} setMobileOpen={setMobileMenuOpen} />

      {/* Main Content Area Wrapper */}
      <div className="flex-1 flex flex-col lg:pl-64 h-full overflow-hidden">
        
        {/* Top bar with First Name Greeting & Stylish Initials Badge */}
        <header className="sticky top-0 z-30 bg-white dark:bg-[#0B1F4B] border-b border-slate-200 dark:border-slate-800 px-6 py-3.5 flex items-center justify-between shadow-sm flex-shrink-0">
          <div className="flex items-center space-x-4">
            <button
              onClick={() => setMobileMenuOpen(true)}
              className="lg:hidden p-2 rounded-lg bg-slate-100 dark:bg-white/5 text-slate-700 dark:text-white"
            >
              <Menu className="w-5 h-5" />
            </button>
            <div>
              <h1 className="text-base sm:text-lg font-bold tracking-tight">
                Welcome back, <span className="text-amber-500">{firstName}</span>! 👋
              </h1>
              <p className="text-[11px] text-slate-500 dark:text-slate-400 hidden sm:block">
                Here is your investment portfolio overview.
              </p>
            </div>
          </div>

          {/* Stylish Initials Avatar Badge */}
          <div className="flex items-center space-x-3">
            <div 
              className="w-10 h-10 rounded-xl bg-gradient-to-tr from-[#0B1F4B] via-slate-800 to-[#D9A52E] text-white font-extrabold flex items-center justify-center text-sm shadow-md tracking-wider border border-amber-500/30"
              title={fullName}
            >
              {initials}
            </div>
          </div>
        </header>

        {/* Scrollable Page Content Area */}
        <main className="flex-1 overflow-y-auto p-2">
          <Outlet />
        </main>
        <AccountManagerChat />
      </div>

    </div>
  );
}



// import React, { useState } from 'react';
// import { Outlet } from 'react-router-dom';
// import { useAuthStore } from '../../store/useAuthStore';
// import Sidebar from '../SideBar';
// import { Menu } from 'lucide-react';

// export default function ClientLayout() {
//   const { profile } = useAuthStore();
//   const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

//   return (
//     <div className="h-screen w-screen overflow-hidden flex bg-slate-100 dark:bg-[#050B14] font-sans text-slate-900 dark:text-slate-100">
      
//       {/* Reusable Sidebar Component (Handles investor links, role check, and mobile drawer) */}
//       <Sidebar mobileOpen={mobileMenuOpen} setMobileOpen={setMobileMenuOpen} />

//       {/* Main Content Area Wrapper (Handles independent scrolling) */}
//       <div className="flex-1 flex flex-col lg:pl-64 h-full overflow-hidden">
        
//         {/* Top bar for mobile menu toggle and user info */}
//         <header className="sticky top-0 z-30 bg-white dark:bg-[#0B1F4B] border-b border-slate-200 dark:border-slate-800 px-6 py-4 flex items-center justify-between shadow-sm flex-shrink-0">
//           <div className="flex items-center space-x-4">
//             <button
//               onClick={() => setMobileMenuOpen(true)}
//               className="lg:hidden p-2 rounded-lg bg-slate-100 dark:bg-white/5 text-slate-700 dark:text-white"
//             >
//               <Menu className="w-5 h-5" />
//             </button>
//             <h1 className="text-lg font-bold">Investor Dashboard</h1>
//           </div>
//           <div className="flex items-center space-x-3">
//             <span className="text-xs font-semibold px-3 py-1 bg-amber-500/10 text-amber-500 rounded-full border border-amber-500/20">
//               {profile?.full_name || 'Verified Investor'}
//             </span>
//           </div>
//         </header>

//         {/* Scrollable Page Content Area */}
//         <main className="flex-1 overflow-y-auto p-6 lg:p-10">
//           <Outlet />
//         </main>
//       </div>

//     </div>
//   );
// }