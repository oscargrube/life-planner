import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { User as FirebaseUser } from 'firebase/auth';
import {
  Idea,
  Task,
  CalendarEvent,
  ViewScreen,
  Category,
} from '../types';
import {
  subscribeToAuth,
  signInWithGoogle,
  logOut,
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
import { INITIAL_IDEAS, INITIAL_TASKS, INITIAL_EVENTS } from '../data/initialData';

interface AppContextType {
  user: FirebaseUser | null;
  isAuthReady: boolean;
  isFirebaseActive: boolean;
  currentView: ViewScreen;
  setCurrentView: (view: ViewScreen) => void;
  selectedCategory: Category | 'all';
  setSelectedCategory: (cat: Category | 'all') => void;

  // Data
  ideas: Idea[];
  tasks: Task[];
  events: CalendarEvent[];

  // Modals & Forms
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

  // Actions
  loginWithGoogle: () => Promise<void>;
  logout: () => Promise<void>;
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

const AppContext = createContext<AppContextType | undefined>(undefined);

export const AppProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<FirebaseUser | null>(null);
  const [isAuthReady, setIsAuthReady] = useState<boolean>(false);
  const [isFirebaseActive, setIsFirebaseActive] = useState<boolean>(false);

  const [currentView, setCurrentView] = useState<ViewScreen>('calendar');
  const [selectedCategory, setSelectedCategory] = useState<Category | 'all'>('all');

  // Local fallback storage states
  const [ideas, setIdeas] = useState<Idea[]>(() => {
    const saved = localStorage.getItem('lp_ideas');
    return saved ? JSON.parse(saved) : INITIAL_IDEAS;
  });

  const [tasks, setTasks] = useState<Task[]>(() => {
    const saved = localStorage.getItem('lp_tasks');
    return saved ? JSON.parse(saved) : INITIAL_TASKS;
  });

  const [events, setEvents] = useState<CalendarEvent[]>(() => {
    const saved = localStorage.getItem('lp_events');
    return saved ? JSON.parse(saved) : INITIAL_EVENTS;
  });

  // Modals state
  const [selectedIdeaForConversion, setSelectedIdeaForConversion] = useState<Idea | null>(null);
  const [isEventModalOpen, setIsEventModalOpen] = useState(false);
  const [editingEvent, setEditingEvent] = useState<CalendarEvent | null>(null);
  const [presetEventDate, setPresetEventDate] = useState<string | null>(null);
  const [presetEventTime, setPresetEventTime] = useState<string | null>(null);

  const [isTaskModalOpen, setIsTaskModalOpen] = useState(false);
  const [editingTask, setEditingTask] = useState<Task | null>(null);

  const [isIdeaModalOpen, setIsIdeaModalOpen] = useState(false);
  const [editingIdea, setEditingIdea] = useState<Idea | null>(null);

  // Sync to local storage for guest offline mode
  useEffect(() => {
    if (!user) {
      localStorage.setItem('lp_ideas', JSON.stringify(ideas));
    }
  }, [ideas, user]);

  useEffect(() => {
    if (!user) {
      localStorage.setItem('lp_tasks', JSON.stringify(tasks));
    }
  }, [tasks, user]);

  useEffect(() => {
    if (!user) {
      localStorage.setItem('lp_events', JSON.stringify(events));
    }
  }, [events, user]);

  // Listen to Firebase Auth
  useEffect(() => {
    const unsubscribe = subscribeToAuth((currentUser) => {
      setUser(currentUser);
      setIsAuthReady(true);
      if (currentUser) {
        setIsFirebaseActive(true);
      }
    });
    return () => unsubscribe();
  }, []);

  // Sync with Firestore when user is signed in
  useEffect(() => {
    if (!user) return;

    let unsubIdeas: (() => void) | undefined;
    let unsubTasks: (() => void) | undefined;
    let unsubEvents: (() => void) | undefined;

    try {
      unsubIdeas = subscribeToIdeas(user.uid, (firestoreIdeas) => {
        if (firestoreIdeas.length > 0) {
          setIdeas(firestoreIdeas);
        } else {
          // If Firestore is empty for this user, migrate current local ideas or sample ideas
          const toSeed = ideas.length > 0 ? ideas : INITIAL_IDEAS;
          toSeed.forEach((idea, idx) => {
            const uniqueId = `idea-${Date.now()}-${idx}-${Math.random().toString(36).slice(2, 6)}`;
            addIdeaToFirestore({ ...idea, id: uniqueId, userId: user.uid });
          });
        }
      });

      unsubTasks = subscribeToTasks(user.uid, (firestoreTasks) => {
        if (firestoreTasks.length > 0) {
          setTasks(firestoreTasks);
        } else {
          const toSeed = tasks.length > 0 ? tasks : INITIAL_TASKS;
          toSeed.forEach((task, idx) => {
            const uniqueId = `task-${Date.now()}-${idx}-${Math.random().toString(36).slice(2, 6)}`;
            addTaskToFirestore({ ...task, id: uniqueId, userId: user.uid });
          });
        }
      });

      unsubEvents = subscribeToEvents(user.uid, (firestoreEvents) => {
        if (firestoreEvents.length > 0) {
          setEvents(firestoreEvents);
        } else {
          const toSeed = events.length > 0 ? events : INITIAL_EVENTS;
          toSeed.forEach((evt, idx) => {
            const uniqueId = `event-${Date.now()}-${idx}-${Math.random().toString(36).slice(2, 6)}`;
            addEventToFirestore({ ...evt, id: uniqueId, userId: user.uid });
          });
        }
      });
    } catch (err) {
      console.warn('Firestore subscription notice:', err);
    }

    return () => {
      if (unsubIdeas) unsubIdeas();
      if (unsubTasks) unsubTasks();
      if (unsubEvents) unsubEvents();
    };
  }, [user]);

  // Auth actions
  const loginWithGoogle = async () => {
    try {
      await signInWithGoogle();
    } catch (error) {
      console.error('Login failed:', error);
    }
  };

  const logout = async () => {
    try {
      await logOut();
      setUser(null);
      const savedIdeas = localStorage.getItem('lp_ideas');
      setIdeas(savedIdeas ? JSON.parse(savedIdeas) : INITIAL_IDEAS);
      const savedTasks = localStorage.getItem('lp_tasks');
      setTasks(savedTasks ? JSON.parse(savedTasks) : INITIAL_TASKS);
      const savedEvents = localStorage.getItem('lp_events');
      setEvents(savedEvents ? JSON.parse(savedEvents) : INITIAL_EVENTS);
    } catch (error) {
      console.error('Logout failed:', error);
    }
  };

  // Idea actions
  const addIdea = useCallback(async (data: { title: string; description?: string; category: Category }) => {
    const uniqueId = `idea-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`;
    const newIdea: Idea = {
      id: uniqueId,
      userId: user?.uid || 'guest',
      title: data.title.trim(),
      description: data.description?.trim() || '',
      category: data.category,
      status: 'new',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    setIdeas((prev) => [newIdea, ...prev]);

    if (user) {
      try {
        await addIdeaToFirestore(newIdea);
      } catch (e) {
        console.error('Error saving idea to Firestore:', e);
      }
    }
  }, [user]);

  const updateIdea = useCallback(async (id: string, updates: Partial<Idea>) => {
    const updatedWithTime = { ...updates, updatedAt: new Date().toISOString() };
    setIdeas((prev) => prev.map((item) => (item.id === id ? { ...item, ...updatedWithTime } : item)));

    if (user) {
      try {
        await updateIdeaInFirestore(id, updatedWithTime);
      } catch (e) {
        console.error('Error updating idea in Firestore:', e);
      }
    }
  }, [user]);

  const deleteIdea = useCallback(async (id: string) => {
    setIdeas((prev) => prev.filter((item) => item.id !== id));
    if (user) {
      try {
        await deleteIdeaFromFirestore(id);
      } catch (e) {
        console.error('Error deleting idea from Firestore:', e);
      }
    }
  }, [user]);

  // Task actions
  const addTask = useCallback(async (data: {
    title: string;
    description?: string;
    category: Category;
    recurrence: Task['recurrence'];
    dueDate?: string;
    sourceIdeaId?: string;
    sourceIdeaTitle?: string;
  }) => {
    const uniqueId = `task-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`;
    const newTask: Task = {
      id: uniqueId,
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
      // Mark idea as converted or evolving
      updateIdea(data.sourceIdeaId, {
        status: 'converted',
        convertedTo: { type: 'task', targetId: newTask.id },
      });
    }

    if (user) {
      try {
        await addTaskToFirestore(newTask);
      } catch (e) {
        console.error('Error saving task to Firestore:', e);
      }
    }
  }, [user, updateIdea]);

  const updateTask = useCallback(async (id: string, updates: Partial<Task>) => {
    const updatedWithTime = { ...updates, updatedAt: new Date().toISOString() };
    setTasks((prev) => prev.map((item) => (item.id === id ? { ...item, ...updatedWithTime } : item)));

    if (user) {
      try {
        await updateTaskInFirestore(id, updatedWithTime);
      } catch (e) {
        console.error('Error updating task in Firestore:', e);
      }
    }
  }, [user]);

  const deleteTask = useCallback(async (id: string) => {
    setTasks((prev) => prev.filter((item) => item.id !== id));
    if (user) {
      try {
        await deleteTaskFromFirestore(id);
      } catch (e) {
        console.error('Error deleting task from Firestore:', e);
      }
    }
  }, [user]);

  const toggleTaskCompleted = useCallback(async (id: string) => {
    const task = tasks.find((t) => t.id === id);
    if (!task) return;
    const newCompleted = !task.completed;
    await updateTask(id, { completed: newCompleted });
  }, [tasks, updateTask]);

  // Calendar Event actions
  const addEvent = useCallback(async (data: {
    title: string;
    description?: string;
    date: string;
    time: string;
    durationMinutes?: number;
    category: Category;
    recurrence: CalendarEvent['recurrence'];
    sourceTaskId?: string;
    sourceIdeaId?: string;
  }) => {
    const uniqueId = `event-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`;
    const newEvent: CalendarEvent = {
      id: uniqueId,
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
      updateIdea(data.sourceIdeaId, {
        status: 'converted',
        convertedTo: { type: 'event', targetId: newEvent.id },
      });
    }

    if (user) {
      try {
        await addEventToFirestore(newEvent);
      } catch (e) {
        console.error('Error saving event to Firestore:', e);
      }
    }
  }, [user, updateIdea]);

  const updateEvent = useCallback(async (id: string, updates: Partial<CalendarEvent>) => {
    const updatedWithTime = { ...updates, updatedAt: new Date().toISOString() };
    setEvents((prev) => prev.map((item) => (item.id === id ? { ...item, ...updatedWithTime } : item)));

    if (user) {
      try {
        await updateEventInFirestore(id, updatedWithTime);
      } catch (e) {
        console.error('Error updating event in Firestore:', e);
      }
    }
  }, [user]);

  const deleteEvent = useCallback(async (id: string) => {
    setEvents((prev) => prev.filter((item) => item.id !== id));
    if (user) {
      try {
        await deleteEventFromFirestore(id);
      } catch (e) {
        console.error('Error deleting event from Firestore:', e);
      }
    }
  }, [user]);

  // Drag and Drop: move event to new date / time
  const moveEventDate = useCallback(async (eventId: string, targetDate: string, targetTime?: string) => {
    const updates: Partial<CalendarEvent> = { date: targetDate };
    if (targetTime) {
      updates.time = targetTime;
    }
    await updateEvent(eventId, updates);
  }, [updateEvent]);

  // Drag and Drop: convert unscheduled task to calendar event on specific day
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
    // Also update task dueDate
    await updateTask(task.id, { dueDate: targetDate });
  }, [addEvent, updateTask]);

  // Modal openers
  const openConvertIdeaModal = (idea: Idea) => {
    setSelectedIdeaForConversion(idea);
  };
  const closeConvertIdeaModal = () => {
    setSelectedIdeaForConversion(null);
  };

  const openEventModal = (event?: CalendarEvent, datePreset?: string, timePreset?: string) => {
    setEditingEvent(event || null);
    setPresetEventDate(datePreset || null);
    setPresetEventTime(timePreset || null);
    setIsEventModalOpen(true);
  };
  const closeEventModal = () => {
    setEditingEvent(null);
    setPresetEventDate(null);
    setPresetEventTime(null);
    setIsEventModalOpen(false);
  };

  const openTaskModal = (task?: Task) => {
    setEditingTask(task || null);
    setIsTaskModalOpen(true);
  };
  const closeTaskModal = () => {
    setEditingTask(null);
    setIsTaskModalOpen(false);
  };

  const openIdeaModal = (idea?: Idea) => {
    setEditingIdea(idea || null);
    setIsIdeaModalOpen(true);
  };
  const closeIdeaModal = () => {
    setEditingIdea(null);
    setIsIdeaModalOpen(false);
  };

  return (
    <AppContext.Provider
      value={{
        user,
        isAuthReady,
        isFirebaseActive,
        currentView,
        setCurrentView,
        selectedCategory,
        setSelectedCategory,

        ideas,
        tasks,
        events,

        selectedIdeaForConversion,
        openConvertIdeaModal,
        closeConvertIdeaModal,

        isEventModalOpen,
        editingEvent,
        presetEventDate,
        presetEventTime,
        openEventModal,
        closeEventModal,

        isTaskModalOpen,
        editingTask,
        openTaskModal,
        closeTaskModal,

        isIdeaModalOpen,
        editingIdea,
        openIdeaModal,
        closeIdeaModal,

        loginWithGoogle,
        logout,
        addIdea,
        updateIdea,
        deleteIdea,
        addTask,
        updateTask,
        deleteTask,
        toggleTaskCompleted,
        addEvent,
        updateEvent,
        deleteEvent,
        moveEventDate,
        convertTaskToEvent,
      }}
    >
      {children}
    </AppContext.Provider>
  );
};

export const useApp = () => {
  const context = useContext(AppContext);
  if (!context) {
    throw new Error('useApp must be used within an AppProvider');
  }
  return context;
};
