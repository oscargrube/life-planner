import {
  signInWithPopup,
  signOut,
  onAuthStateChanged,
  User as FirebaseUser,
} from 'firebase/auth';
import {
  collection,
  query,
  where,
  onSnapshot,
  doc,
  setDoc,
  updateDoc,
  deleteDoc,
  Unsubscribe,
} from 'firebase/firestore';
import { auth, db, googleProvider } from './config';
import { handleFirestoreError, OperationType } from './errors';
import { Idea, Task, CalendarEvent } from '../types';

// Auth services
export async function signInWithGoogle(): Promise<FirebaseUser> {
  try {
    const result = await signInWithPopup(auth, googleProvider);
    return result.user;
  } catch (error) {
    console.error('Google Sign-In Error:', error);
    throw error;
  }
}

export async function logOut(): Promise<void> {
  try {
    await signOut(auth);
  } catch (error) {
    console.error('Logout error:', error);
    throw error;
  }
}

export function subscribeToAuth(callback: (user: FirebaseUser | null) => void): Unsubscribe {
  return onAuthStateChanged(auth, callback);
}

// Firestore Ideas CRUD
export function subscribeToIdeas(
  userId: string,
  onData: (ideas: Idea[]) => void,
  onError?: (err: unknown) => void
): Unsubscribe {
  const collectionPath = 'ideas';
  const q = query(collection(db, collectionPath), where('userId', '==', userId));
  
  return onSnapshot(
    q,
    (snapshot) => {
      const ideas: Idea[] = [];
      snapshot.forEach((docSnap) => {
        ideas.push({ id: docSnap.id, ...(docSnap.data() as Omit<Idea, 'id'>) });
      });
      // Sort newest first
      ideas.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
      onData(ideas);
    },
    (error) => {
      if (onError) onError(error);
      handleFirestoreError(error, OperationType.GET, collectionPath);
    }
  );
}

// Helper to strip undefined values as Firestore throws if any field is undefined
function cleanData<T extends Record<string, any>>(obj: T): Record<string, any> {
  const result: Record<string, any> = {};
  for (const [key, value] of Object.entries(obj)) {
    if (value !== undefined) {
      if (value !== null && typeof value === 'object' && !Array.isArray(value)) {
        result[key] = cleanData(value);
      } else {
        result[key] = value;
      }
    }
  }
  return result;
}

export async function addIdeaToFirestore(idea: Idea): Promise<void> {
  const path = `ideas/${idea.id}`;
  try {
    const { id, ...data } = idea;
    await setDoc(doc(db, 'ideas', id), cleanData(data));
  } catch (error) {
    handleFirestoreError(error, OperationType.CREATE, path);
  }
}

export async function updateIdeaInFirestore(id: string, updates: Partial<Idea>): Promise<void> {
  const path = `ideas/${id}`;
  try {
    await updateDoc(doc(db, 'ideas', id), cleanData(updates));
  } catch (error) {
    handleFirestoreError(error, OperationType.UPDATE, path);
  }
}

export async function deleteIdeaFromFirestore(id: string): Promise<void> {
  const path = `ideas/${id}`;
  try {
    await deleteDoc(doc(db, 'ideas', id));
  } catch (error) {
    handleFirestoreError(error, OperationType.DELETE, path);
  }
}

// Firestore Tasks CRUD
export function subscribeToTasks(
  userId: string,
  onData: (tasks: Task[]) => void,
  onError?: (err: unknown) => void
): Unsubscribe {
  const collectionPath = 'tasks';
  const q = query(collection(db, collectionPath), where('userId', '==', userId));
  
  return onSnapshot(
    q,
    (snapshot) => {
      const tasks: Task[] = [];
      snapshot.forEach((docSnap) => {
        tasks.push({ id: docSnap.id, ...(docSnap.data() as Omit<Task, 'id'>) });
      });
      tasks.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
      onData(tasks);
    },
    (error) => {
      if (onError) onError(error);
      handleFirestoreError(error, OperationType.GET, collectionPath);
    }
  );
}

export async function addTaskToFirestore(task: Task): Promise<void> {
  const path = `tasks/${task.id}`;
  try {
    const { id, ...data } = task;
    await setDoc(doc(db, 'tasks', id), cleanData(data));
  } catch (error) {
    handleFirestoreError(error, OperationType.CREATE, path);
  }
}

export async function updateTaskInFirestore(id: string, updates: Partial<Task>): Promise<void> {
  const path = `tasks/${id}`;
  try {
    await updateDoc(doc(db, 'tasks', id), cleanData(updates));
  } catch (error) {
    handleFirestoreError(error, OperationType.UPDATE, path);
  }
}

export async function deleteTaskFromFirestore(id: string): Promise<void> {
  const path = `tasks/${id}`;
  try {
    await deleteDoc(doc(db, 'tasks', id));
  } catch (error) {
    handleFirestoreError(error, OperationType.DELETE, path);
  }
}

// Firestore Events CRUD
export function subscribeToEvents(
  userId: string,
  onData: (events: CalendarEvent[]) => void,
  onError?: (err: unknown) => void
): Unsubscribe {
  const collectionPath = 'events';
  const q = query(collection(db, collectionPath), where('userId', '==', userId));
  
  return onSnapshot(
    q,
    (snapshot) => {
      const events: CalendarEvent[] = [];
      snapshot.forEach((docSnap) => {
        events.push({ id: docSnap.id, ...(docSnap.data() as Omit<CalendarEvent, 'id'>) });
      });
      // Sort by date and time
      events.sort((a, b) => `${a.date} ${a.time}`.localeCompare(`${b.date} ${b.time}`));
      onData(events);
    },
    (error) => {
      if (onError) onError(error);
      handleFirestoreError(error, OperationType.GET, collectionPath);
    }
  );
}

export async function addEventToFirestore(event: CalendarEvent): Promise<void> {
  const path = `events/${event.id}`;
  try {
    const { id, ...data } = event;
    await setDoc(doc(db, 'events', id), cleanData(data));
  } catch (error) {
    handleFirestoreError(error, OperationType.CREATE, path);
  }
}

export async function updateEventInFirestore(id: string, updates: Partial<CalendarEvent>): Promise<void> {
  const path = `events/${id}`;
  try {
    await updateDoc(doc(db, 'events', id), cleanData(updates));
  } catch (error) {
    handleFirestoreError(error, OperationType.UPDATE, path);
  }
}

export async function deleteEventFromFirestore(id: string): Promise<void> {
  const path = `events/${id}`;
  try {
    await deleteDoc(doc(db, 'events', id));
  } catch (error) {
    handleFirestoreError(error, OperationType.DELETE, path);
  }
}
