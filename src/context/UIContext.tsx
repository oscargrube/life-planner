import React, { createContext, useContext, useState } from 'react';
import { Idea, Task, CalendarEvent, Category } from '../types';

export interface EventRequestPreset {
  projectId?: string;
  friendGroupId?: string;
  inviteeIds?: string[];
  date?: string;
  time?: string;
  title?: string;
}

interface UIContextType {
  selectedCategory: Category | 'all';
  setSelectedCategory: (cat: Category | 'all') => void;

  selectedProjectFilter: string | 'all' | 'private';
  setSelectedProjectFilter: (proj: string | 'all' | 'private') => void;

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
  presetEventProjectId: string | null;
  openEventModal: (
    event?: CalendarEvent,
    datePreset?: string,
    timePreset?: string,
    projectIdPreset?: string
  ) => void;
  closeEventModal: () => void;

  isEventRequestModalOpen: boolean;
  eventRequestPreset: EventRequestPreset | null;
  openEventRequestModal: (preset?: EventRequestPreset) => void;
  closeEventRequestModal: () => void;

  isTaskModalOpen: boolean;
  editingTask: Task | null;
  presetTaskProjectId: string | null;
  openTaskModal: (task?: Task, projectIdPreset?: string) => void;
  closeTaskModal: () => void;

  isIdeaModalOpen: boolean;
  editingIdea: Idea | null;
  presetIdeaProjectId: string | null;
  openIdeaModal: (idea?: Idea, projectIdPreset?: string) => void;
  closeIdeaModal: () => void;

  isMobileSidebarOpen: boolean;
  setMobileSidebarOpen: (isOpen: boolean) => void;
}

const UIContext = createContext<UIContextType | undefined>(undefined);

export const UIProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [selectedCategory, setSelectedCategory] = useState<Category | 'all'>('all');
  const [selectedProjectFilter, setSelectedProjectFilter] = useState<string | 'all' | 'private'>('all');

  const [isAuthModalOpen, setIsAuthModalOpen] = useState(false);
  const [selectedIdeaForConversion, setSelectedIdeaForConversion] = useState<Idea | null>(null);

  const [isEventModalOpen, setIsEventModalOpen] = useState(false);
  const [editingEvent, setEditingEvent] = useState<CalendarEvent | null>(null);
  const [presetEventDate, setPresetEventDate] = useState<string | null>(null);
  const [presetEventTime, setPresetEventTime] = useState<string | null>(null);
  const [presetEventProjectId, setPresetEventProjectId] = useState<string | null>(null);

  const [isEventRequestModalOpen, setIsEventRequestModalOpen] = useState(false);
  const [eventRequestPreset, setEventRequestPreset] = useState<EventRequestPreset | null>(null);

  const [isTaskModalOpen, setIsTaskModalOpen] = useState(false);
  const [editingTask, setEditingTask] = useState<Task | null>(null);
  const [presetTaskProjectId, setPresetTaskProjectId] = useState<string | null>(null);

  const [isIdeaModalOpen, setIsIdeaModalOpen] = useState(false);
  const [editingIdea, setEditingIdea] = useState<Idea | null>(null);
  const [presetIdeaProjectId, setPresetIdeaProjectId] = useState<string | null>(null);

  const [isMobileSidebarOpen, setMobileSidebarOpen] = useState(false);

  return (
    <UIContext.Provider
      value={{
        selectedCategory,
        setSelectedCategory,
        selectedProjectFilter,
        setSelectedProjectFilter,
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
        presetEventProjectId,
        openEventModal: (event, date, time, projectId) => {
          setEditingEvent(event || null);
          setPresetEventDate(date || null);
          setPresetEventTime(time || null);
          setPresetEventProjectId(projectId || null);
          setIsEventModalOpen(true);
        },
        closeEventModal: () => {
          setEditingEvent(null);
          setPresetEventDate(null);
          setPresetEventTime(null);
          setPresetEventProjectId(null);
          setIsEventModalOpen(false);
        },
        isEventRequestModalOpen,
        eventRequestPreset,
        openEventRequestModal: (preset) => {
          setEventRequestPreset(preset || null);
          setIsEventRequestModalOpen(true);
        },
        closeEventRequestModal: () => {
          setEventRequestPreset(null);
          setIsEventRequestModalOpen(false);
        },
        isTaskModalOpen,
        editingTask,
        presetTaskProjectId,
        openTaskModal: (task, projectId) => {
          setEditingTask(task || null);
          setPresetTaskProjectId(projectId || null);
          setIsTaskModalOpen(true);
        },
        closeTaskModal: () => {
          setEditingTask(null);
          setPresetTaskProjectId(null);
          setIsTaskModalOpen(false);
        },
        isIdeaModalOpen,
        editingIdea,
        presetIdeaProjectId,
        openIdeaModal: (idea, projectId) => {
          setEditingIdea(idea || null);
          setPresetIdeaProjectId(projectId || null);
          setIsIdeaModalOpen(true);
        },
        closeIdeaModal: () => {
          setEditingIdea(null);
          setPresetIdeaProjectId(null);
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
