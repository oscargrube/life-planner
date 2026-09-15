import React from 'react';
import {
  Calendar as CalendarIcon,
  Lightbulb,
  CheckSquare,
  LogOut,
  Sparkles,
  CloudCheck,
  CloudOff,
} from 'lucide-react';
import { useApp } from '../context/AppContext';
import { ViewScreen } from '../types';

export const Sidebar: React.FC = () => {
  const {
    currentView,
    setCurrentView,
    user,
    loginWithGoogle,
    logout,
    openIdeaModal,
  } = useApp();

  const navItems: { id: ViewScreen; label: string; icon: React.ComponentType<{ className?: string }> }[] = [
    {
      id: 'calendar',
      label: 'Kalender',
      icon: CalendarIcon,
    },
    {
      id: 'ideas',
      label: 'Ideenbereich',
      icon: Lightbulb,
    },
    {
      id: 'tasks',
      label: 'Aufgaben',
      icon: CheckSquare,
    },
  ];

  return (
    <aside
      id="main-sidebar"
      className="w-64 bg-white text-[#171c19] flex flex-col shrink-0 border-r border-[#e3ebe5] select-none h-screen sticky top-0 transition-colors shadow-xs"
    >
      {/* Brand Header */}
      <div className="p-5 border-b border-[#e3ebe5] flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-2xl bg-gradient-to-br from-[#174e36] to-[#0f3424] border border-[#174e36] flex items-center justify-center shadow-xs text-white">
            <Sparkles className="w-5 h-5 text-[#86e3b5]" />
          </div>
          <div>
            <h1 className="font-bold text-base text-[#171c19] tracking-tight leading-tight">
              Lebensplanung
            </h1>
            <p className="text-xs text-[#52645a] font-medium">Ideen & Zeitstruktur</p>
          </div>
        </div>
      </div>

      {/* Quick Action Bar - Only + Idee as requested */}
      <div className="p-3.5 border-b border-[#e3ebe5]">
        <button
          id="sidebar-quick-idea-btn"
          onClick={() => openIdeaModal()}
          className="w-full flex items-center justify-center gap-2 py-2.5 px-3 bg-[#174e36] hover:bg-[#12402c] active:scale-[0.98] text-white border border-[#143d2b] rounded-xl text-xs font-semibold shadow-xs transition-all cursor-pointer"
        >
          <Lightbulb className="w-4 h-4 text-[#86e3b5]" />
          <span>+ Idee</span>
        </button>
      </div>

      {/* Main Navigation without numbers */}
      <div className="flex-1 overflow-y-auto px-3 py-4 space-y-4">
        <div>
          <span className="px-3 text-[11px] font-bold uppercase tracking-wider text-[#6b7d72]">
            Hauptmenü
          </span>
          <nav className="mt-2 space-y-1">
            {navItems.map((item) => {
              const Icon = item.icon;
              const isActive = currentView === item.id;
              return (
                <button
                  key={item.id}
                  id={`nav-link-${item.id}`}
                  onClick={() => setCurrentView(item.id)}
                  className={`w-full flex items-center justify-between px-3.5 py-2.5 rounded-xl text-sm font-medium transition-all cursor-pointer ${
                    isActive
                      ? 'bg-[#edf5f0] text-[#143d2b] shadow-xs border border-[#cfe0d5] font-semibold'
                      : 'text-[#38463e] hover:text-[#171c19] hover:bg-[#f3f7f4]'
                  }`}
                >
                  <div className="flex items-center gap-3">
                    <Icon className={`w-4 h-4 ${isActive ? 'text-[#174e36]' : 'text-[#6b7d72]'}`} />
                    <span>{item.label}</span>
                  </div>
                </button>
              );
            })}
          </nav>
        </div>
      </div>

      {/* Footer: User Account & Sync Status */}
      <div className="p-3 border-t border-[#e3ebe5] bg-[#fafcfa]">
        {user ? (
          <div className="space-y-2">
            <div className="flex items-center justify-between px-2 py-1">
              <div className="flex items-center gap-2 overflow-hidden">
                {user.photoURL ? (
                  <img
                    src={user.photoURL}
                    alt={user.displayName || 'User'}
                    className="w-7 h-7 rounded-full object-cover border border-[#c4d6cb] shadow-xs"
                  />
                ) : (
                  <div className="w-7 h-7 rounded-full bg-[#174e36] text-white flex items-center justify-center text-xs font-semibold">
                    {user.displayName ? user.displayName.charAt(0).toUpperCase() : 'U'}
                  </div>
                )}
                <div className="truncate">
                  <p className="text-xs font-semibold text-[#171c19] truncate">
                    {user.displayName || user.email?.split('@')[0]}
                  </p>
                  <div className="flex items-center gap-1 text-[10px] text-[#174e36] font-medium">
                    <CloudCheck className="w-3 h-3 text-[#174e36]" />
                    <span>Firestore Sync aktiv</span>
                  </div>
                </div>
              </div>
            </div>
            <button
              id="sidebar-logout-btn"
              onClick={logout}
              className="w-full flex items-center justify-center gap-1.5 py-1.5 text-xs text-[#52645a] hover:text-rose-600 hover:bg-rose-50 rounded-lg transition-colors cursor-pointer"
            >
              <LogOut className="w-3.5 h-3.5" />
              <span>Abmelden</span>
            </button>
          </div>
        ) : (
          <div className="space-y-2">
            <div className="flex items-center gap-1.5 px-2 text-[11px] text-[#52645a]">
              <CloudOff className="w-3.5 h-3.5 text-amber-600" />
              <span>Gastmodus (Lokal gespeichert)</span>
            </div>
            <button
              id="sidebar-google-login-btn"
              onClick={loginWithGoogle}
              className="w-full flex items-center justify-center gap-2 py-2 px-3 bg-white hover:bg-[#f3f7f4] text-[#171c19] border border-[#d2ded6] rounded-xl text-xs font-semibold shadow-xs transition-all active:scale-[0.98] cursor-pointer"
            >
              <svg className="w-4 h-4" viewBox="0 0 24 24">
                <path
                  fill="#4285F4"
                  d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                />
                <path
                  fill="#34A853"
                  d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                />
                <path
                  fill="#FBBC05"
                  d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z"
                />
                <path
                  fill="#EA4335"
                  d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z"
                />
              </svg>
              <span>Mit Google anmelden</span>
            </button>
          </div>
        )}
      </div>
    </aside>
  );
};
