import React, { createContext, useContext, useState } from 'react';
import { Idea, Task, CalendarEvent, Category } from '../types';

interface UIContextType {
  selectedCategory: Category | 'all';
  setSelectedCategory: (cat: Category | 'all') => void;

  isAuthModalOpen: boolean;
  openAuthModal: () => void;
  closeAuthModal: () => void;

  selectedIdeaForConversion: Idea | null;
  openConvertIdeaModal: (idea: Idea) => void;
  closeConvertIdeaModal: () => void;

  isEventModalOpen: boolean;
  editingEvent: CalendarEvent | null;
  presetEventDate: string | null;
  presetEventTime: string | null;
  openEventModal: (event?: CalendarEvent, datePreset?: string, timePreset?: string) => void;
  closeEventModal: () => void;

  isTaskModalOpen: boolean;
  editingTask: Task | null;
  openTaskModal: (task?: Task) => void;
  closeTaskModal: () => void;

  isIdeaModalOpen: boolean;
  editingIdea: Idea | null;
  openIdeaModal: (idea?: Idea) => void;
  closeIdeaModal: () => void;

  isMobileSidebarOpen: boolean;
  setMobileSidebarOpen: (isOpen: boolean) => void;
}

const UIContext = createContext<UIContextType | undefined>(undefined);

export const UIProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [selectedCategory, setSelectedCategory] = useState<Category | 'all'>('all');
  
  const [isAuthModalOpen, setIsAuthModalOpen] = useState(false);
  const [selectedIdeaForConversion, setSelectedIdeaForConversion] = useState<Idea | null>(null);
  
  const [isEventModalOpen, setIsEventModalOpen] = useState(false);
  const [editingEvent, setEditingEvent] = useState<CalendarEvent | null>(null);
  const [presetEventDate, setPresetEventDate] = useState<string | null>(null);
  const [presetEventTime, setPresetEventTime] = useState<string | null>(null);

  const [isTaskModalOpen, setIsTaskModalOpen] = useState(false);
  const [editingTask, setEditingTask] = useState<Task | null>(null);

  const [isIdeaModalOpen, setIsIdeaModalOpen] = useState(false);
  const [editingIdea, setEditingIdea] = useState<Idea | null>(null);

  const [isMobileSidebarOpen, setMobileSidebarOpen] = useState(false);

  return (
    <UIContext.Provider
      value={{
        selectedCategory,
        setSelectedCategory,
        isAuthModalOpen,
        openAuthModal: () => setIsAuthModalOpen(true),
        closeAuthModal: () => setIsAuthModalOpen(false),
        selectedIdeaForConversion,
        openConvertIdeaModal: (idea) => setSelectedIdeaForConversion(idea),
        closeConvertIdeaModal: () => setSelectedIdeaForConversion(null),
        isEventModalOpen,
        editingEvent,
        presetEventDate,
        presetEventTime,
        openEventModal: (event, date, time) => {
          setEditingEvent(event || null);
          setPresetEventDate(date || null);
          setPresetEventTime(time || null);
          setIsEventModalOpen(true);
        },
        closeEventModal: () => {
          setEditingEvent(null);
          setPresetEventDate(null);
          setPresetEventTime(null);
          setIsEventModalOpen(false);
        },
        isTaskModalOpen,
        editingTask,
        openTaskModal: (task) => {
          setEditingTask(task || null);
          setIsTaskModalOpen(true);
        },
        closeTaskModal: () => {
          setEditingTask(null);
          setIsTaskModalOpen(false);
        },
        isIdeaModalOpen,
        editingIdea,
        openIdeaModal: (idea) => {
          setEditingIdea(idea || null);
          setIsIdeaModalOpen(true);
        },
        closeIdeaModal: () => {
          setEditingIdea(null);
          setIsIdeaModalOpen(false);
        },
        isMobileSidebarOpen,
        setMobileSidebarOpen,
      }}
    >
      {children}
    </UIContext.Provider>
  );
};

export const useUI = () => {
  const ctx = useContext(UIContext);
  if (!ctx) throw new Error('useUI must be used within UIProvider');
  return ctx;
};
