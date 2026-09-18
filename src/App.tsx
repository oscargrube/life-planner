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

const AppContent: React.FC = () => {
  return (
    <div className="flex h-screen w-screen overflow-hidden bg-[#f8faf8] text-[#171c19] antialiased selection:bg-[#174e36] selection:text-white">
      {/* Left Sidebar Menu */}
      <Sidebar />

      {/* Main View Area */}
      <main className="flex-1 flex flex-col h-full overflow-hidden bg-[#f8faf8]">
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
