import {
  signInWithPopup,
  signOut,
  onAuthStateChanged,
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  sendPasswordResetEmail,
  updateProfile,
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
  writeBatch,
  Unsubscribe,
} from 'firebase/firestore';
import { auth, db, googleProvider } from './config';
import { handleFirestoreError, OperationType } from './errors';
import { Idea, Task, CalendarEvent } from '../types';

// ==========================================
// Authentication Services
// ==========================================

export async function signInWithGoogle(): Promise<FirebaseUser> {
  try {
    const result = await signInWithPopup(auth, googleProvider);
    return result.user;
  } catch (error) {
    console.error('Google Sign-In Error:', error);
    throw error;
  }
}

export async function signUpWithEmail(email: string, pass: string, displayName?: string): Promise<FirebaseUser> {
  try {
    const result = await createUserWithEmailAndPassword(auth, email, pass);
    if (displayName && result.user) {
      await updateProfile(result.user, { displayName });
    }
    return result.user;
  } catch (error) {
    console.error('Email Sign-Up Error:', error);
    throw error;
  }
}

export async function signInWithEmail(email: string, pass: string): Promise<FirebaseUser> {
  try {
    const result = await signInWithEmailAndPassword(auth, email, pass);
    return result.user;
  } catch (error) {
    console.error('Email Sign-In Error:', error);
    throw error;
  }
}

export async function resetPassword(email: string): Promise<void> {
  try {
    await sendPasswordResetEmail(auth, email);
  } catch (error) {
    console.error('Password Reset Error:', error);
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

// ==========================================
// Helper: Clean undefined values from Firestore payloads
// ==========================================

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

// ==========================================
// Ideas CRUD & Subscription
// ==========================================

export function subscribeToIdeas(
  userId: string,
  onData: (ideas: Idea[]) => void,
  onError?: (err: unknown) => void
): Unsubscribe {
  const collectionPath = 'ideas';
  console.log(`[Firestore] Subscribing to "${collectionPath}" for user "${userId}"`);
  const q = query(collection(db, collectionPath), where('userId', '==', userId));

  return onSnapshot(
    q,
    (snapshot) => {
      const ideas: Idea[] = [];
      snapshot.forEach((docSnap) => {
        ideas.push({ id: docSnap.id, ...(docSnap.data() as Omit<Idea, 'id'>) });
      });
      ideas.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
      console.log(`[Firestore] Received ${ideas.length} ideas for user "${userId}"`);
      onData(ideas);
    },
    (error) => {
      console.error(`[Firestore Error] Failed to fetch "${collectionPath}":`, error);
      if (onError) onError(error);
      handleFirestoreError(error, OperationType.GET, collectionPath);
    }
  );
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

// ==========================================
// Tasks CRUD & Subscription
// ==========================================

export function subscribeToTasks(
  userId: string,
  onData: (tasks: Task[]) => void,
  onError?: (err: unknown) => void
): Unsubscribe {
  const collectionPath = 'tasks';
  console.log(`[Firestore] Subscribing to "${collectionPath}" for user "${userId}"`);
  const q = query(collection(db, collectionPath), where('userId', '==', userId));

  return onSnapshot(
    q,
    (snapshot) => {
      const tasks: Task[] = [];
      snapshot.forEach((docSnap) => {
        tasks.push({ id: docSnap.id, ...(docSnap.data() as Omit<Task, 'id'>) });
      });
      tasks.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
      console.log(`[Firestore] Received ${tasks.length} tasks for user "${userId}"`);
      onData(tasks);
    },
    (error) => {
      console.error(`[Firestore Error] Failed to fetch "${collectionPath}":`, error);
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

// ==========================================
// Events CRUD & Subscription
// ==========================================

export function subscribeToEvents(
  userId: string,
  onData: (events: CalendarEvent[]) => void,
  onError?: (err: unknown) => void
): Unsubscribe {
  const collectionPath = 'events';
  console.log(`[Firestore] Subscribing to "${collectionPath}" for user "${userId}"`);
  const q = query(collection(db, collectionPath), where('userId', '==', userId));

  return onSnapshot(
    q,
    (snapshot) => {
      const events: CalendarEvent[] = [];
      snapshot.forEach((docSnap) => {
        events.push({ id: docSnap.id, ...(docSnap.data() as Omit<CalendarEvent, 'id'>) });
      });
      events.sort((a, b) => `${a.date} ${a.time}`.localeCompare(`${b.date} ${b.time}`));
      console.log(`[Firestore] Received ${events.length} events for user "${userId}"`);
      onData(events);
    },
    (error) => {
      console.error(`[Firestore Error] Failed to fetch "${collectionPath}":`, error);
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

// ==========================================
// Migration: Transfer local guest data to newly signed-in user
// ==========================================

export async function migrateGuestDataToUser(
  userId: string,
  guestIdeas: Idea[],
  guestTasks: Task[],
  guestEvents: CalendarEvent[]
): Promise<void> {
  if (!userId) return;

  try {
    const batch = writeBatch(db);
    let operationCount = 0;

    for (const idea of guestIdeas) {
      if (idea.userId === 'guest' || !idea.userId) {
        const { id, ...data } = idea;
        batch.set(doc(db, 'ideas', id), cleanData({ ...data, userId }));
        operationCount++;
      }
    }

    for (const task of guestTasks) {
      if (task.userId === 'guest' || !task.userId) {
        const { id, ...data } = task;
        batch.set(doc(db, 'tasks', id), cleanData({ ...data, userId }));
        operationCount++;
      }
    }

    for (const event of guestEvents) {
      if (event.userId === 'guest' || !event.userId) {
        const { id, ...data } = event;
        batch.set(doc(db, 'events', id), cleanData({ ...data, userId }));
        operationCount++;
      }
    }

    if (operationCount > 0) {
      await batch.commit();
      console.log(`Successfully migrated ${operationCount} guest items to user ${userId}`);
    }
  } catch (err) {
    console.warn('Guest data migration notice:', err);
  }
}
