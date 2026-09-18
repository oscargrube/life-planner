import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { Idea, Task, CalendarEvent, Category } from '../types';
import {
  subscribeToIdeas,
  subscribeToTasks,
  subscribeToEvents,
  addIdeaToFirestore,
  updateIdeaInFirestore,
  deleteIdeaFromFirestore,
  addTaskToFirestore,
  updateTaskInFirestore,
  deleteTaskFromFirestore,
  addEventToFirestore,
  updateEventInFirestore,
  deleteEventFromFirestore,
} from '../firebase/service';
import { useAuth } from './AuthContext';

interface DataContextType {
  ideas: Idea[];
  tasks: Task[];
  events: CalendarEvent[];
  addIdea: (data: { title: string; description?: string; category: Category }) => Promise<void>;
  updateIdea: (id: string, updates: Partial<Idea>) => Promise<void>;
  deleteIdea: (id: string) => Promise<void>;
  addTask: (data: {
    title: string;
    description?: string;
    category: Category;
    recurrence: Task['recurrence'];
    dueDate?: string;
    sourceIdeaId?: string;
    sourceIdeaTitle?: string;
  }) => Promise<void>;
  updateTask: (id: string, updates: Partial<Task>) => Promise<void>;
  deleteTask: (id: string) => Promise<void>;
  toggleTaskCompleted: (id: string) => Promise<void>;
  addEvent: (data: {
    title: string;
    description?: string;
    date: string;
    time: string;
    durationMinutes?: number;
    category: Category;
    recurrence: CalendarEvent['recurrence'];
    sourceTaskId?: string;
    sourceIdeaId?: string;
  }) => Promise<void>;
  updateEvent: (id: string, updates: Partial<CalendarEvent>) => Promise<void>;
  deleteEvent: (id: string) => Promise<void>;
  moveEventDate: (eventId: string, targetDate: string, targetTime?: string) => Promise<void>;
  convertTaskToEvent: (task: Task, targetDate: string, targetTime?: string) => Promise<void>;
}

const DataContext = createContext<DataContextType | undefined>(undefined);

export const DataProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { user } = useAuth();
  
  const [ideas, setIdeas] = useState<Idea[]>([]);
  const [tasks, setTasks] = useState<Task[]>([]);
  const [events, setEvents] = useState<CalendarEvent[]>([]);

  // Clear data on logout
  useEffect(() => {
    if (!user) {
      setIdeas([]);
      setTasks([]);
      setEvents([]);
    }
  }, [user]);

  useEffect(() => {
    if (!user) return;

    let unsubIdeas: (() => void) | undefined;
    let unsubTasks: (() => void) | undefined;
    let unsubEvents: (() => void) | undefined;

    try {
      unsubIdeas = subscribeToIdeas(user.uid, setIdeas);
      unsubTasks = subscribeToTasks(user.uid, setTasks);
      unsubEvents = subscribeToEvents(user.uid, setEvents);
    } catch (err) {
      console.warn('Firestore subscription notice:', err);
    }

    return () => {
      if (unsubIdeas) unsubIdeas();
      if (unsubTasks) unsubTasks();
      if (unsubEvents) unsubEvents();
    };
  }, [user]);

  // Actions
  const addIdea = useCallback(async (data: { title: string; description?: string; category: Category }) => {
    const newIdea: Idea = {
      id: `idea-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
      userId: user?.uid || 'guest',
      title: data.title.trim(),
      description: data.description?.trim() || '',
      category: data.category,
      status: 'new',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };
    setIdeas((prev) => [newIdea, ...prev]);
    if (user) await addIdeaToFirestore(newIdea).catch(console.error);
  }, [user]);

  const updateIdea = useCallback(async (id: string, updates: Partial<Idea>) => {
    const updatedWithTime = { ...updates, updatedAt: new Date().toISOString() };
    setIdeas((prev) => prev.map((item) => (item.id === id ? { ...item, ...updatedWithTime } : item)));
    if (user) await updateIdeaInFirestore(id, updatedWithTime).catch(console.error);
  }, [user]);

  const deleteIdea = useCallback(async (id: string) => {
    setIdeas((prev) => prev.filter((item) => item.id !== id));
    if (user) await deleteIdeaFromFirestore(id).catch(console.error);
  }, [user]);

  const addTask = useCallback(async (data: any) => {
    const newTask: Task = {
      id: `task-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
      userId: user?.uid || 'guest',
      title: data.title.trim(),
      description: data.description?.trim() || '',
      category: data.category,
      recurrence: data.recurrence || 'none',
      completed: false,
      dueDate: data.dueDate,
      sourceIdeaId: data.sourceIdeaId,
      sourceIdeaTitle: data.sourceIdeaTitle,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };
    setTasks((prev) => [newTask, ...prev]);
    if (data.sourceIdeaId) {
      updateIdea(data.sourceIdeaId, { status: 'converted', convertedTo: { type: 'task', targetId: newTask.id } });
    }
    if (user) await addTaskToFirestore(newTask).catch(console.error);
  }, [user, updateIdea]);

  const updateTask = useCallback(async (id: string, updates: Partial<Task>) => {
    const updatedWithTime = { ...updates, updatedAt: new Date().toISOString() };
    setTasks((prev) => prev.map((item) => (item.id === id ? { ...item, ...updatedWithTime } : item)));
    if (user) await updateTaskInFirestore(id, updatedWithTime).catch(console.error);
  }, [user]);

  const deleteTask = useCallback(async (id: string) => {
    setTasks((prev) => prev.filter((item) => item.id !== id));
    if (user) await deleteTaskFromFirestore(id).catch(console.error);
  }, [user]);

  const toggleTaskCompleted = useCallback(async (id: string) => {
    const task = tasks.find((t) => t.id === id);
    if (!task) return;
    await updateTask(id, { completed: !task.completed });
  }, [tasks, updateTask]);

  const addEvent = useCallback(async (data: any) => {
    const newEvent: CalendarEvent = {
      id: `event-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
      userId: user?.uid || 'guest',
      title: data.title.trim(),
      description: data.description?.trim() || '',
      date: data.date,
      time: data.time || '10:00',
      durationMinutes: data.durationMinutes || 60,
      category: data.category,
      recurrence: data.recurrence || 'none',
      sourceTaskId: data.sourceTaskId,
      sourceIdeaId: data.sourceIdeaId,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };
    setEvents((prev) => [newEvent, ...prev]);
    if (data.sourceIdeaId) {
      updateIdea(data.sourceIdeaId, { status: 'converted', convertedTo: { type: 'event', targetId: newEvent.id } });
    }
    if (user) await addEventToFirestore(newEvent).catch(console.error);
  }, [user, updateIdea]);

  const updateEvent = useCallback(async (id: string, updates: Partial<CalendarEvent>) => {
    const updatedWithTime = { ...updates, updatedAt: new Date().toISOString() };
    setEvents((prev) => prev.map((item) => (item.id === id ? { ...item, ...updatedWithTime } : item)));
    if (user) await updateEventInFirestore(id, updatedWithTime).catch(console.error);
  }, [user]);

  const deleteEvent = useCallback(async (id: string) => {
    setEvents((prev) => prev.filter((item) => item.id !== id));
    if (user) await deleteEventFromFirestore(id).catch(console.error);
  }, [user]);

  const moveEventDate = useCallback(async (eventId: string, targetDate: string, targetTime?: string) => {
    const updates: Partial<CalendarEvent> = { date: targetDate };
    if (targetTime) updates.time = targetTime;
    await updateEvent(eventId, updates);
  }, [updateEvent]);

  const convertTaskToEvent = useCallback(async (task: Task, targetDate: string, targetTime?: string) => {
    await addEvent({
      title: task.title,
      description: task.description,
      date: targetDate,
      time: targetTime || '10:00',
      durationMinutes: 60,
      category: task.category,
      recurrence: task.recurrence,
      sourceTaskId: task.id,
      sourceIdeaId: task.sourceIdeaId,
    });
    await updateTask(task.id, { dueDate: targetDate });
  }, [addEvent, updateTask]);

  return (
    <DataContext.Provider value={{ ideas, tasks, events, addIdea, updateIdea, deleteIdea, addTask, updateTask, deleteTask, toggleTaskCompleted, addEvent, updateEvent, deleteEvent, moveEventDate, convertTaskToEvent }}>
      {children}
    </DataContext.Provider>
  );
};

export const useData = () => {
  const ctx = useContext(DataContext);
  if (!ctx) throw new Error('useData must be used within DataProvider');
  return ctx;
};
