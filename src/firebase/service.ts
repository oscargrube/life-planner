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
  getDoc,
  setDoc,
  updateDoc,
  deleteDoc,
  writeBatch,
  Unsubscribe,
} from 'firebase/firestore';
import { auth, db, googleProvider } from './config';
import { handleFirestoreError, OperationType } from './errors';
import { Idea, Task, CalendarEvent, UserProfile } from '../types';

// ==========================================
// Username & Profile Helpers
// ==========================================

export function normalizeUsername(raw: string): string {
  return raw.trim().replace(/^@+/, '').toLowerCase();
}

export function isValidUsername(raw: string): boolean {
  const normalized = normalizeUsername(raw);
  return /^[a-z0-9_]{3,20}$/.test(normalized);
}

export async function isUsernameAvailable(rawUsername: string): Promise<boolean> {
  const username = normalizeUsername(rawUsername);
  if (!isValidUsername(username)) return false;
  const snap = await getDoc(doc(db, 'usernames', username));
  return !snap.exists();
}

export async function claimUsernameForUser(
  user: FirebaseUser,
  rawUsername: string,
  displayName?: string
): Promise<UserProfile> {
  const username = normalizeUsername(rawUsername);
  if (!isValidUsername(username)) {
    throw new Error('Benutzername muss 3–20 Zeichen lang sein (a-z, 0-9, _).');
  }

  const usernameRef = doc(db, 'usernames', username);
  const existing = await getDoc(usernameRef);
  if (existing.exists() && existing.data()?.uid !== user.uid) {
    throw new Error('Dieser Benutzername ist bereits vergeben.');
  }

  const now = new Date().toISOString();
  const finalDisplayName = (displayName || user.displayName || username).trim();

  if (finalDisplayName && user.displayName !== finalDisplayName) {
    await updateProfile(user, { displayName: finalDisplayName }).catch(() => {});
  }

  const profileRef = doc(db, 'users', user.uid);
  const prevProfileSnap = await getDoc(profileRef);
  const prevProfile = prevProfileSnap.exists() ? (prevProfileSnap.data() as UserProfile) : null;

  const profile: UserProfile = {
    uid: user.uid,
    username,
    displayName: finalDisplayName,
    email: user.email || prevProfile?.email || undefined,
    photoURL: user.photoURL || prevProfile?.photoURL || undefined,
    createdAt: prevProfile?.createdAt || now,
    updatedAt: now,
  };

  const batch = writeBatch(db);
  // Release old username if changed
  if (prevProfile?.username && prevProfile.username !== username) {
    batch.delete(doc(db, 'usernames', prevProfile.username));
  }
  batch.set(usernameRef, cleanData({ uid: user.uid, email: user.email || undefined, updatedAt: now }));
  batch.set(profileRef, cleanData(profile));
  await batch.commit();

  return profile;
}

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

export async function signUpWithEmail(
  email: string,
  pass: string,
  displayName?: string,
  username?: string
): Promise<FirebaseUser> {
  try {
    if (username) {
      const available = await isUsernameAvailable(username);
      if (!available) {
        throw new Error('Dieser Benutzername ist ungültig oder bereits vergeben.');
      }
    }

    const result = await createUserWithEmailAndPassword(auth, email, pass);
    if (displayName && result.user) {
      await updateProfile(result.user, { displayName });
    }
    if (username && result.user) {
      await claimUsernameForUser(result.user, username, displayName);
    }
    return result.user;
  } catch (error) {
    console.error('Email Sign-Up Error:', error);
    throw error;
  }
}

export async function signInWithEmail(identifier: string, pass: string): Promise<FirebaseUser> {
  try {
    const trimmed = identifier.trim();
    let emailToUse = trimmed;

    // If user typed a username (e.g. "oscar" or "@oscar") instead of an email
    if (trimmed.startsWith('@') || !trimmed.includes('@')) {
      const cleanName = normalizeUsername(trimmed);
      const unameSnap = await getDoc(doc(db, 'usernames', cleanName));
      if (!unameSnap.exists()) {
        throw new Error('Kein Konto mit diesem Benutzernamen gefunden.');
      }
      const uid = unameSnap.data()?.uid as string;
      let userEmail = unameSnap.data()?.email as string | undefined;
      if (!userEmail) {
        const userSnap = await getDoc(doc(db, 'users', uid));
        userEmail = userSnap.exists() ? (userSnap.data()?.email as string | undefined) : undefined;
      }
      if (!userEmail) {
        throw new Error('Für diesen Benutzernamen ist keine E-Mail-Login-Adresse hinterlegt (z. B. Google-Login nutzen).');
      }
      emailToUse = userEmail;
    }

    const result = await signInWithEmailAndPassword(auth, emailToUse, pass);
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

export function cleanData<T extends Record<string, any>>(obj: T): Record<string, any> {
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

export function subscribeToSharedEvents(
  userId: string,
  onData: (events: CalendarEvent[]) => void,
  onError?: (err: unknown) => void
): Unsubscribe {
  const collectionPath = 'events';
  const q = query(collection(db, collectionPath), where('participantIds', 'array-contains', userId));
  return onSnapshot(
    q,
    (snapshot) => {
      const events: CalendarEvent[] = [];
      snapshot.forEach((docSnap) => {
        events.push({ id: docSnap.id, ...(docSnap.data() as Omit<CalendarEvent, 'id'>) });
      });
      onData(events);
    },
    (error) => {
      if (onError) onError(error);
      handleFirestoreError(error, OperationType.GET, collectionPath);
    }
  );
}

/**
 * Helper to subscribe to a collection where `projectId` is in `projectIds` (chunked by 10 for Firestore `in` limits).
 */
export function subscribeByProjectIds<T extends { id: string }>(
  collectionName: string,
  projectIds: string[],
  onData: (items: T[]) => void
): Unsubscribe {
  if (projectIds.length === 0) {
    onData([]);
    return () => {};
  }

  const chunks: string[][] = [];
  for (let i = 0; i < projectIds.length; i += 10) {
    chunks.push(projectIds.slice(i, i + 10));
  }

  const chunkResults = new Map<number, T[]>();
  const emitMerged = () => {
    const merged: T[] = [];
    chunkResults.forEach((list) => merged.push(...list));
    onData(merged);
  };

  const unsubs = chunks.map((chunk, idx) => {
    const q = query(collection(db, collectionName), where('projectId', 'in', chunk));
    return onSnapshot(
      q,
      (snapshot) => {
        const items: T[] = [];
        snapshot.forEach((docSnap) => {
          items.push({ id: docSnap.id, ...(docSnap.data() as Omit<T, 'id'>) } as T);
        });
        chunkResults.set(idx, items);
        emitMerged();
      },
      (error) => {
        handleFirestoreError(error, OperationType.GET, collectionName);
      }
    );
  });

  return () => {
    unsubs.forEach((u) => u());
  };
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
