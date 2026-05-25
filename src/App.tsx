import React, { useEffect, useState } from 'react';
import { AppProvider, useApp } from './context/AppContext';
import { LandingPage } from './pages/LandingPage';
import { LoginPage, StudentRegisterPage, OrgRegisterPage } from './pages/AuthPages';
import { StudentDashboard } from './pages/StudentDashboard';
import { OrgDashboard } from './pages/OrgDashboard';
import { SuperAdminDashboard } from './pages/SuperAdminDashboard';
import { LogOut, Store, Layers } from 'lucide-react';
import { SessionManager } from './config/api';

type PageRoute = 'landing' | 'login' | 'register' | 'register-org' | 'student-dashboard' | 'org-dashboard' | 'admin-dashboard';

const MainAppContent: React.FC = () => {
  const { currentUser, logout } = useApp();
  const [currentPage, setCurrentPage] = useState<PageRoute>(() => {
    const savedUser = SessionManager.getUser();
    if (!savedUser) return 'landing';
    if (savedUser.role === 'student') return 'student-dashboard';
    if (savedUser.role === 'organization_admin') return 'org-dashboard';
    if (savedUser.role === 'super_admin') return 'admin-dashboard';
    return 'landing';
  });

  // Auto-redirect when currentUser changes (e.g. from shortcut login toolbar)
  useEffect(() => {
    if (currentUser) {
      if (currentUser.role === 'student') {
        setCurrentPage('student-dashboard');
      } else if (currentUser.role === 'organization_admin') {
        setCurrentPage('org-dashboard');
      } else if (currentUser.role === 'super_admin') {
        setCurrentPage('admin-dashboard');
      }
    } else {
      // If logged out and on a dashboard, go back to landing
      if (['student-dashboard', 'org-dashboard', 'admin-dashboard'].includes(currentPage)) {
        setCurrentPage('landing');
      }
    }
  }, [currentPage, currentUser]);

  // Handle manual navigation guards
  const navigateTo = (page: PageRoute) => {
    if (['student-dashboard', 'org-dashboard', 'admin-dashboard'].includes(page) && !currentUser) {
      setCurrentPage('login');
      return;
    }
    setCurrentPage(page);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleLogout = () => {
    logout();
    navigateTo('landing');
  };

  return (
    <div className="flex flex-col min-h-screen text-slate-800 bg-slate-50 font-sans selection:bg-blue-500 selection:text-white">
      {/* Global Navigation Header */}
      <nav className="bg-white border-b border-slate-200 sticky top-0 z-40 shadow-md">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between h-16">
            
            {/* Logo */}
            <div className="flex items-center">
              <button
                onClick={() => navigateTo('landing')}
                className="flex items-center gap-2 text-left focus:outline-none group"
              >
                <div className="w-9 h-9 rounded-lg bg-blue-600 flex items-center justify-center text-white font-black text-base shadow-md group-hover:scale-105 transition-transform duration-200">
                  QP
                </div>
                <div>
                  <span className="font-extrabold text-slate-900 tracking-tight text-sm sm:text-base block">Campus QuickPass</span>
                  <span className="text-[10px] text-slate-400 font-semibold tracking-wider uppercase block -mt-0.5">SaaS Pickup Platform</span>
                </div>
              </button>
            </div>

            {/* Navigation options */}
            <div className="flex items-center gap-3 flex-wrap justify-end">
              {currentUser ? (
                <>
                  {/* Logged in buttons */}
                  <div className="hidden sm:flex items-center gap-1.5 mr-2">
                    <span className="w-2 h-2 rounded-full bg-emerald-500"></span>
                    <span className="text-xs font-semibold text-slate-600">
                      Signed in as <strong className="text-slate-800 font-bold">{currentUser.name}</strong>
                    </span>
                    <span className="text-[10px] bg-slate-100 text-slate-500 border border-slate-200 px-2 py-0.5 rounded font-bold capitalize">
                      {currentUser.role.replace('_', ' ')}
                    </span>
                  </div>

                  <button
                    onClick={handleLogout}
                    className="bg-slate-100 hover:bg-slate-200 text-slate-700 font-semibold px-3 py-1.5 rounded-lg text-xs flex items-center gap-1 transition-all border border-slate-200 shadow-sm"
                  >
                    <LogOut className="w-3.5 h-3.5" />
                    <span className="hidden sm:inline">Logout</span>
                  </button>
                </>
              ) : (
                <>
                  {/* Logged out buttons */}
                  <button
                    onClick={() => navigateTo('login')}
                    className="text-slate-600 hover:text-slate-900 font-semibold text-xs px-3 py-1.5 rounded-lg transition-all"
                  >
                    Sign In
                  </button>

                  <button
                    onClick={() => navigateTo('register')}
                    className="bg-blue-600 hover:bg-blue-700 text-white font-semibold px-4 py-1.5 rounded-lg text-xs shadow transition-all"
                  >
                    Student Register
                  </button>

                  <button
                    onClick={() => navigateTo('register-org')}
                    className="bg-slate-900 hover:bg-slate-800 text-white font-semibold px-3.5 py-1.5 rounded-lg text-xs shadow hidden sm:flex items-center gap-1 transition-all"
                  >
                    <Store className="w-3.5 h-3.5" />
                    <span>Vendor Onboarding</span>
                  </button>
                </>
              )}
            </div>

          </div>
        </div>
      </nav>

      {/* Main Pages Router */}
      <main className="flex-1">
        {currentPage === 'landing' && (
          <LandingPage
            onNavigate={navigateTo}
            onExplore={() => {
              if (currentUser) {
                navigateTo('student-dashboard');
              } else {
                navigateTo('login');
              }
            }}
          />
        )}
        {currentPage === 'login' && (
          <LoginPage
            onSuccess={() => navigateTo('student-dashboard')}
            onNavigate={navigateTo}
          />
        )}
        {currentPage === 'register' && (
          <StudentRegisterPage
            onSuccess={() => navigateTo('student-dashboard')}
            onNavigate={navigateTo}
          />
        )}
        {currentPage === 'register-org' && (
          <OrgRegisterPage
            onSuccess={() => navigateTo('login')}
            onNavigate={navigateTo}
          />
        )}
        {currentPage === 'student-dashboard' && <StudentDashboard />}
        {currentPage === 'org-dashboard' && <OrgDashboard />}
        {currentPage === 'admin-dashboard' && <SuperAdminDashboard />}
      </main>

      {/* Global Footer */}
      <footer className="bg-white border-t border-slate-200 py-6 text-center text-xs text-slate-400">
        <div className="max-w-7xl mx-auto px-4 space-y-2">
          <p>© {new Date().getFullYear()} Campus QuickPass SaaS platform. Fulfilling modern campus queue guidelines.</p>
          <p className="flex items-center justify-center gap-1.5 font-medium">
            <Layers className="w-3.5 h-3.5 text-slate-400" />
            <span>MERN Stack Prototype • Powered by React Context API, Local MongoDB Collections & Razorpay Verification</span>
          </p>
        </div>
      </footer>
    </div>
  );
};

export default function App() {
  return (
    <AppProvider>
      <MainAppContent />
    </AppProvider>
  );
}
