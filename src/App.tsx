import React from 'react';
import { AppProvider, useApp } from './context/AppContext';
import { Sidebar } from './components/Sidebar';
import { CalendarView } from './components/CalendarView';
import { IdeasView } from './components/IdeasView';
import { TasksView } from './components/TasksView';
import { ConvertIdeaModal } from './components/ConvertIdeaModal';
import { EventModal } from './components/EventModal';
import { TaskModal } from './components/TaskModal';
import { IdeaModal } from './components/IdeaModal';

const AppContent: React.FC = () => {
  const { currentView } = useApp();

  return (
    <div className="flex h-screen w-screen overflow-hidden bg-[#f8faf8] text-[#171c19] antialiased selection:bg-[#174e36] selection:text-white">
      {/* Left Sidebar Menu */}
      <Sidebar />

      {/* Main View Area */}
      <main className="flex-1 flex flex-col h-full overflow-hidden bg-[#f8faf8]">
        {currentView === 'calendar' && <CalendarView />}
        {currentView === 'ideas' && <IdeasView />}
        {currentView === 'tasks' && <TasksView />}
      </main>

      {/* Global Modals */}
      <ConvertIdeaModal />
      <EventModal />
      <TaskModal />
      <IdeaModal />
    </div>
  );
};

export default function App() {
  return (
    <AppProvider>
      <AppContent />
    </AppProvider>
  );
}
