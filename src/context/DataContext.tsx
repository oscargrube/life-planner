import React, { createContext, useContext, useState, useEffect, useCallback, useMemo } from 'react';
import {
  Idea,
  Task,
  CalendarEvent,
  Category,
  TaskStatus,
  TaskPriority,
} from '../types';
import {
  subscribeToIdeas,
  subscribeToTasks,
  subscribeToEvents,
  subscribeToSharedEvents,
  subscribeByProjectIds,
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
import { syncUserAvailability } from '../firebase/socialService';
import { useAuth } from './AuthContext';
import { useSocial } from './SocialContext';

interface DataContextType {
  ideas: Idea[];
  tasks: Task[];
  events: CalendarEvent[];
  addIdea: (data: {
    title: string;
    description?: string;
    category: Category;
    projectId?: string;
  }) => Promise<void>;
  updateIdea: (id: string, updates: Partial<Idea>) => Promise<void>;
  deleteIdea: (id: string) => Promise<void>;
  addTask: (data: {
    title: string;
    description?: string;
    category: Category;
    recurrence: Task['recurrence'];
    dueDate?: string;
    projectId?: string;
    assigneeId?: string;
    kanbanStatus?: TaskStatus;
    priority?: TaskPriority;
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
    projectId?: string;
    friendGroupId?: string;
    participantIds?: string[];
    isShared?: boolean;
    sourceTaskId?: string;
    sourceIdeaId?: string;
  }) => Promise<void>;
  updateEvent: (id: string, updates: Partial<CalendarEvent>) => Promise<void>;
  deleteEvent: (id: string) => Promise<void>;
  moveEventDate: (eventId: string, targetDate: string, targetTime?: string) => Promise<void>;
  convertTaskToEvent: (task: Task, targetDate: string, targetTime?: string) => Promise<void>;
}

const DataContext = createContext<DataContextType | undefined>(undefined);

function mergeById<T extends { id: string }>(...lists: T[][]): T[] {
  const map = new Map<string, T>();
  for (const list of lists) {
    for (const item of list) {
      map.set(item.id, item);
    }
  }
  return Array.from(map.values());
}

export const DataProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { user, userProfile } = useAuth();
  const { projects } = useSocial();

  const [personalIdeas, setPersonalIdeas] = useState<Idea[]>([]);
  const [projectIdeas, setProjectIdeas] = useState<Idea[]>([]);
  const [personalTasks, setPersonalTasks] = useState<Task[]>([]);
  const [projectTasks, setProjectTasks] = useState<Task[]>([]);
  const [personalEvents, setPersonalEvents] = useState<CalendarEvent[]>([]);
  const [sharedEvents, setSharedEvents] = useState<CalendarEvent[]>([]);
  const [projectEvents, setProjectEvents] = useState<CalendarEvent[]>([]);

  // Local guest fallback states when !user
  const [guestIdeas, setGuestIdeas] = useState<Idea[]>([]);
  const [guestTasks, setGuestTasks] = useState<Task[]>([]);
  const [guestEvents, setGuestEvents] = useState<CalendarEvent[]>([]);

  // Clear data on logout
  useEffect(() => {
    if (!user) {
      setPersonalIdeas([]);
      setProjectIdeas([]);
      setPersonalTasks([]);
      setProjectTasks([]);
      setPersonalEvents([]);
      setSharedEvents([]);
      setProjectEvents([]);
    }
  }, [user]);

  // Subscribe to user's personal items + shared events
  useEffect(() => {
    if (!user) return;

    const uIdeas = subscribeToIdeas(user.uid, setPersonalIdeas);
    const uTasks = subscribeToTasks(user.uid, setPersonalTasks);
    const uEvents = subscribeToEvents(user.uid, setPersonalEvents);
    const uShared = subscribeToSharedEvents(user.uid, setSharedEvents);

    return () => {
      uIdeas();
      uTasks();
      uEvents();
      uShared();
    };
  }, [user]);

  // Subscribe to items belonging to any project the user is a member of
  const projectIdsKey = useMemo(
    () => projects.map((p) => p.id).sort().join(','),
    [projects]
  );

  useEffect(() => {
    if (!user) return;
    const ids = projectIdsKey ? projectIdsKey.split(',') : [];
    if (ids.length === 0) {
      setProjectIdeas([]);
      setProjectTasks([]);
      setProjectEvents([]);
      return;
    }

    const uPIdeas = subscribeByProjectIds<Idea>('ideas', ids, setProjectIdeas);
    const uPTasks = subscribeByProjectIds<Task>('tasks', ids, setProjectTasks);
    const uPEvents = subscribeByProjectIds<CalendarEvent>('events', ids, setProjectEvents);

    return () => {
      uPIdeas();
      uPTasks();
      uPEvents();
    };
  }, [user, projectIdsKey]);

  const ideas = useMemo(() => {
    if (!user) return guestIdeas;
    return mergeById<Idea>(personalIdeas, projectIdeas).sort(
      (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
    );
  }, [user, guestIdeas, personalIdeas, projectIdeas]);

  const tasks = useMemo(() => {
    if (!user) return guestTasks;
    return mergeById<Task>(personalTasks, projectTasks).sort(
      (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
    );
  }, [user, guestTasks, personalTasks, projectTasks]);

  const events = useMemo(() => {
    if (!user) return guestEvents;
    return mergeById<CalendarEvent>(personalEvents, sharedEvents, projectEvents).sort((a, b) =>
      `${a.date} ${a.time}`.localeCompare(`${b.date} ${b.time}`)
    );
  }, [user, guestEvents, personalEvents, sharedEvents, projectEvents]);

  // Keep privacy-safe availability (busy slots without event titles) in sync
  useEffect(() => {
    if (!user) return;
    const timer = setTimeout(() => {
      syncUserAvailability(user.uid, events).catch(console.warn);
    }, 500);
    return () => clearTimeout(timer);
  }, [user, events]);

  // Actions
  const addIdea = useCallback(
    async (data: { title: string; description?: string; category: Category; projectId?: string }) => {
      const now = new Date().toISOString();
      const newIdea: Idea = {
        id: `idea-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
        userId: user?.uid || 'guest',
        title: data.title.trim(),
        description: data.description?.trim() || '',
        category: data.category,
        status: 'new',
        projectId: data.projectId || undefined,
        authorId: user?.uid || 'guest',
        authorName: userProfile?.displayName || user?.displayName || undefined,
        createdAt: now,
        updatedAt: now,
      };
      if (!user) {
        setGuestIdeas((prev) => [newIdea, ...prev]);
      } else {
        setPersonalIdeas((prev) => [newIdea, ...prev]);
        await addIdeaToFirestore(newIdea).catch(console.error);
      }
    },
    [user, userProfile]
  );

  const updateIdea = useCallback(
    async (id: string, updates: Partial<Idea>) => {
      const updatedWithTime = { ...updates, updatedAt: new Date().toISOString() };
      if (!user) {
        setGuestIdeas((prev) =>
          prev.map((item) => (item.id === id ? { ...item, ...updatedWithTime } : item))
        );
      } else {
        setPersonalIdeas((prev) =>
          prev.map((item) => (item.id === id ? { ...item, ...updatedWithTime } : item))
        );
        setProjectIdeas((prev) =>
          prev.map((item) => (item.id === id ? { ...item, ...updatedWithTime } : item))
        );
        await updateIdeaInFirestore(id, updatedWithTime).catch(console.error);
      }
    },
    [user]
  );

  const deleteIdea = useCallback(
    async (id: string) => {
      if (!user) {
        setGuestIdeas((prev) => prev.filter((item) => item.id !== id));
      } else {
        setPersonalIdeas((prev) => prev.filter((item) => item.id !== id));
        setProjectIdeas((prev) => prev.filter((item) => item.id !== id));
        await deleteIdeaFromFirestore(id).catch(console.error);
      }
    },
    [user]
  );

  const addTask = useCallback(
    async (data: {
      title: string;
      description?: string;
      category: Category;
      recurrence: Task['recurrence'];
      dueDate?: string;
      projectId?: string;
      assigneeId?: string;
      kanbanStatus?: TaskStatus;
      priority?: TaskPriority;
      sourceIdeaId?: string;
      sourceIdeaTitle?: string;
    }) => {
      const now = new Date().toISOString();
      const status: TaskStatus = data.kanbanStatus || 'todo';
      const newTask: Task = {
        id: `task-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
        userId: user?.uid || 'guest',
        title: data.title.trim(),
        description: data.description?.trim() || '',
        category: data.category,
        recurrence: data.recurrence || 'none',
        completed: status === 'done',
        dueDate: data.dueDate,
        projectId: data.projectId || undefined,
        assigneeId: data.assigneeId || undefined,
        kanbanStatus: status,
        priority: data.priority || 'medium',
        sourceIdeaId: data.sourceIdeaId,
        sourceIdeaTitle: data.sourceIdeaTitle,
        createdAt: now,
        updatedAt: now,
      };
      if (data.sourceIdeaId) {
        updateIdea(data.sourceIdeaId, {
          status: 'converted',
          convertedTo: { type: 'task', targetId: newTask.id },
        });
      }
      if (!user) {
        setGuestTasks((prev) => [newTask, ...prev]);
      } else {
        setPersonalTasks((prev) => [newTask, ...prev]);
        await addTaskToFirestore(newTask).catch(console.error);
      }
    },
    [user, updateIdea]
  );

  const updateTask = useCallback(
    async (id: string, updates: Partial<Task>) => {
      const syncedUpdates: Partial<Task> = { ...updates };
      if (updates.kanbanStatus !== undefined && updates.completed === undefined) {
        syncedUpdates.completed = updates.kanbanStatus === 'done';
      } else if (updates.completed !== undefined && updates.kanbanStatus === undefined) {
        syncedUpdates.kanbanStatus = updates.completed ? 'done' : 'todo';
      }

      const updatedWithTime = { ...syncedUpdates, updatedAt: new Date().toISOString() };
      if (!user) {
        setGuestTasks((prev) =>
          prev.map((item) => (item.id === id ? { ...item, ...updatedWithTime } : item))
        );
      } else {
        setPersonalTasks((prev) =>
          prev.map((item) => (item.id === id ? { ...item, ...updatedWithTime } : item))
        );
        setProjectTasks((prev) =>
          prev.map((item) => (item.id === id ? { ...item, ...updatedWithTime } : item))
        );
        await updateTaskInFirestore(id, updatedWithTime).catch(console.error);
      }
    },
    [user]
  );

  const deleteTask = useCallback(
    async (id: string) => {
      if (!user) {
        setGuestTasks((prev) => prev.filter((item) => item.id !== id));
      } else {
        setPersonalTasks((prev) => prev.filter((item) => item.id !== id));
        setProjectTasks((prev) => prev.filter((item) => item.id !== id));
        await deleteTaskFromFirestore(id).catch(console.error);
      }
    },
    [user]
  );

  const toggleTaskCompleted = useCallback(
    async (id: string) => {
      const task = tasks.find((t) => t.id === id);
      if (!task) return;
      const nextCompleted = !task.completed;
      await updateTask(id, {
        completed: nextCompleted,
        kanbanStatus: nextCompleted ? 'done' : 'todo',
      });
    },
    [tasks, updateTask]
  );

  const addEvent = useCallback(
    async (data: {
      title: string;
      description?: string;
      date: string;
      time: string;
      durationMinutes?: number;
      category: Category;
      recurrence: CalendarEvent['recurrence'];
      projectId?: string;
      friendGroupId?: string;
      participantIds?: string[];
      isShared?: boolean;
      sourceTaskId?: string;
      sourceIdeaId?: string;
    }) => {
      const now = new Date().toISOString();
      const proj = data.projectId ? projects.find((p) => p.id === data.projectId) : undefined;
      const defaultParticipants =
        data.participantIds && data.participantIds.length > 0
          ? data.participantIds
          : proj && proj.memberIds.length > 1
          ? proj.memberIds
          : undefined;

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
        projectId: data.projectId || undefined,
        friendGroupId: data.friendGroupId || undefined,
        participantIds: defaultParticipants,
        isShared:
          data.isShared ??
          Boolean((defaultParticipants && defaultParticipants.length > 1) || data.friendGroupId),
        createdByName: userProfile?.displayName || user?.displayName || undefined,
        sourceTaskId: data.sourceTaskId,
        sourceIdeaId: data.sourceIdeaId,
        createdAt: now,
        updatedAt: now,
      };
      if (data.sourceIdeaId) {
        updateIdea(data.sourceIdeaId, {
          status: 'converted',
          convertedTo: { type: 'event', targetId: newEvent.id },
        });
      }
      if (!user) {
        setGuestEvents((prev) => [newEvent, ...prev]);
      } else {
        setPersonalEvents((prev) => [newEvent, ...prev]);
        await addEventToFirestore(newEvent).catch(console.error);
      }
    },
    [user, userProfile, projects, updateIdea]
  );

  const updateEvent = useCallback(
    async (id: string, updates: Partial<CalendarEvent>) => {
      const updatedWithTime = { ...updates, updatedAt: new Date().toISOString() };
      if (!user) {
        setGuestEvents((prev) =>
          prev.map((item) => (item.id === id ? { ...item, ...updatedWithTime } : item))
        );
      } else {
        setPersonalEvents((prev) =>
          prev.map((item) => (item.id === id ? { ...item, ...updatedWithTime } : item))
        );
        setSharedEvents((prev) =>
          prev.map((item) => (item.id === id ? { ...item, ...updatedWithTime } : item))
        );
        setProjectEvents((prev) =>
          prev.map((item) => (item.id === id ? { ...item, ...updatedWithTime } : item))
        );
        await updateEventInFirestore(id, updatedWithTime).catch(console.error);
      }
    },
    [user]
  );

  const deleteEvent = useCallback(
    async (id: string) => {
      if (!user) {
        setGuestEvents((prev) => prev.filter((item) => item.id !== id));
      } else {
        setPersonalEvents((prev) => prev.filter((item) => item.id !== id));
        setSharedEvents((prev) => prev.filter((item) => item.id !== id));
        setProjectEvents((prev) => prev.filter((item) => item.id !== id));
        await deleteEventFromFirestore(id).catch(console.error);
      }
    },
    [user]
  );

  const moveEventDate = useCallback(
    async (eventId: string, targetDate: string, targetTime?: string) => {
      const updates: Partial<CalendarEvent> = { date: targetDate };
      if (targetTime) updates.time = targetTime;
      await updateEvent(eventId, updates);
    },
    [updateEvent]
  );

  const convertTaskToEvent = useCallback(
    async (task: Task, targetDate: string, targetTime?: string) => {
      await addEvent({
        title: task.title,
        description: task.description,
        date: targetDate,
        time: targetTime || '10:00',
        durationMinutes: 60,
        category: task.category,
        recurrence: task.recurrence,
        projectId: task.projectId,
        sourceTaskId: task.id,
        sourceIdeaId: task.sourceIdeaId,
      });
      await updateTask(task.id, { dueDate: targetDate });
    },
    [addEvent, updateTask]
  );

  return (
    <DataContext.Provider
      value={{
        ideas,
        tasks,
        events,
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
    </DataContext.Provider>
  );
};

export const useData = () => {
  const ctx = useContext(DataContext);
  if (!ctx) throw new Error('useData must be used within DataProvider');
  return ctx;
};
