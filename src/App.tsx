import React from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AppProvider } from './context/AppContext';
import { Sidebar } from './components/layout/Sidebar';
import { CalendarPage } from './pages/CalendarPage';
import { IdeasPage } from './pages/IdeasPage';
import { TasksPage } from './pages/TasksPage';
import { ConvertIdeaModal } from './components/modals/ConvertIdeaModal';
import { EventModal } from './components/modals/EventModal';
import { TaskModal } from './components/modals/TaskModal';
import { IdeaModal } from './components/modals/IdeaModal';
import { AuthModal } from './components/modals/AuthModal';

import { useLocation } from 'react-router-dom';
import { Menu, Sparkles } from 'lucide-react';
import { useUI } from './context/UIContext';

const AppContent: React.FC = () => {
  const { setMobileSidebarOpen } = useUI();
  const location = useLocation();

  const getPageTitle = () => {
    if (location.pathname.startsWith('/ideas')) return 'Ideenbereich';
    if (location.pathname.startsWith('/tasks')) return 'Aufgaben';
    return 'Kalender';
  };

  const isCalendar = location.pathname.startsWith('/calendar');

  return (
    <div className="flex h-[100dvh] w-screen overflow-hidden bg-[#f8faf8] text-[#171c19] antialiased selection:bg-[#174e36] selection:text-white flex-col md:flex-row">
      {/* Mobile Top Bar (Hidden on Calendar as it has its own merged header) */}
      {!isCalendar && (
        <header className="md:hidden flex items-center justify-between px-4 py-3 bg-white border-b border-[#e2e8e3] shrink-0 z-20 shadow-xs">
          <div className="flex items-center gap-2.5">
          <button
            onClick={() => setMobileSidebarOpen(true)}
            className="p-1.5 -ml-1.5 text-[#52645a] hover:bg-[#f4f7f5] rounded-lg transition-colors"
          >
            <Menu className="w-6 h-6" />
          </button>
          <div className="flex items-center gap-2">
            <div className="w-7 h-7 rounded-lg bg-gradient-to-br from-[#174e36] to-[#0f3424] text-white flex items-center justify-center shadow-xs">
              <Sparkles className="w-3.5 h-3.5 text-[#86e3b5]" />
            </div>
            <h1 className="font-bold text-base text-[#171c19] tracking-tight">
              {getPageTitle()}
            </h1>
          </div>
          </div>
        </header>
      )}

      {/* Left Sidebar Menu */}
      <Sidebar />

      {/* Main View Area */}
      <main className="flex-1 flex flex-col h-full overflow-hidden bg-[#f8faf8] relative z-0">
        <Routes>
          <Route path="/" element={<Navigate to="/calendar" replace />} />
          <Route path="/calendar" element={<CalendarPage />} />
          <Route path="/ideas" element={<IdeasPage />} />
          <Route path="/tasks" element={<TasksPage />} />
        </Routes>
      </main>

      {/* Global Modals */}
      <AuthModal />
      <ConvertIdeaModal />
      <EventModal />
      <TaskModal />
      <IdeaModal />
    </div>
  );
};

export default function App() {
  return (
    <BrowserRouter>
      <AppProvider>
        <AppContent />
      </AppProvider>
    </BrowserRouter>
  );
}
