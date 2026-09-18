import React from 'react';
import {
  Calendar as CalendarIcon,
  Lightbulb,
  CheckSquare,
  LogOut,
  LogIn,
  Sparkles,
  CloudCheck,
  CloudOff,
} from 'lucide-react';
import { useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { useUI } from '../../context/UIContext';
import { ViewScreen } from '../../types';

export const Sidebar: React.FC = () => {
  const { user, logout } = useAuth();
  const { isMobileSidebarOpen, setMobileSidebarOpen, openAuthModal, openIdeaModal } = useUI();
  const location = useLocation();
  const navigate = useNavigate();

  const navItems: { id: ViewScreen; path: string; label: string; icon: React.ComponentType<{ className?: string }> }[] = [
    {
      id: 'calendar',
      path: '/calendar',
      label: 'Kalender',
      icon: CalendarIcon,
    },
    {
      id: 'ideas',
      path: '/ideas',
      label: 'Ideenbereich',
      icon: Lightbulb,
    },
    {
      id: 'tasks',
      path: '/tasks',
      label: 'Aufgaben',
      icon: CheckSquare,
    },
  ];

  return (
    <>
      {/* Mobile Backdrop */}
      {isMobileSidebarOpen && (
        <div
          className="fixed inset-0 bg-[#171c19]/30 backdrop-blur-sm z-30 md:hidden transition-opacity"
          onClick={() => setMobileSidebarOpen(false)}
        />
      )}

      <aside
        id="main-sidebar"
        className={`w-64 bg-white text-[#171c19] flex flex-col shrink-0 border-r border-[#e3ebe5] select-none h-[100dvh] fixed md:sticky top-0 left-0 z-40 transition-transform duration-300 shadow-xl md:shadow-xs md:translate-x-0 ${
          isMobileSidebarOpen ? 'translate-x-0' : '-translate-x-full'
        }`}
      >
        {/* Brand Header */}
        <div className="p-5 border-b border-[#e3ebe5] flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-gradient-to-br from-[#174e36] to-[#0f3424] border border-[#174e36] flex items-center justify-center shadow-xs text-white">
              <Sparkles className="w-5 h-5 text-[#86e3b5]" />
            </div>
            <div>
              <h1 className="font-bold text-base text-[#171c19] tracking-tight leading-tight hidden md:block">
                Lebensplanung
              </h1>
              <p className="text-xs text-[#52645a] font-medium hidden md:block">Ideen & Zeitstruktur</p>
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
              const isActive = item.path === '/'
                ? location.pathname === '/'
                : location.pathname.startsWith(item.path);
              return (
                <button
                  key={item.id}
                  id={`nav-link-${item.id}`}
                  onClick={() => {
                    navigate(item.path);
                    setMobileSidebarOpen(false);
                  }}
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
              id="sidebar-auth-modal-btn"
              onClick={openAuthModal}
              className="w-full flex items-center justify-center gap-2 py-2 px-3 bg-[#174e36] hover:bg-[#12402c] text-white rounded-xl text-xs font-semibold shadow-xs transition-all active:scale-[0.98] cursor-pointer"
            >
              <LogIn className="w-4 h-4 text-[#86e3b5]" />
              <span>Anmelden / Registrieren</span>
            </button>
          </div>
        )}
      </div>
    </aside>
    </>
  );
};
