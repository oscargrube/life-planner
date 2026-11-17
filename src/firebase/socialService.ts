import {
  collection,
  query,
  where,
  onSnapshot,
  doc,
  getDoc,
  getDocs,
  setDoc,
  updateDoc,
  deleteDoc,
  arrayUnion,
  arrayRemove,
  limit,
  Unsubscribe,
} from 'firebase/firestore';
import { db } from './config';
import { cleanData, normalizeUsername } from './service';
import { handleFirestoreError, OperationType } from './errors';
import {
  UserProfile,
  UserAvailability,
  BusySlot,
  Friendship,
  FriendGroup,
  Project,
  ProjectInvite,
  EventRequest,
  ChatRoom,
  ChatMessage,
  Category,
  Recurrence,
  CalendarEvent,
} from '../types';

// ==========================================
// User Profiles & Search
// ==========================================

export function subscribeToUserProfile(
  uid: string,
  onData: (profile: UserProfile | null) => void
): Unsubscribe {
  const ref = doc(db, 'users', uid);
  return onSnapshot(
    ref,
    (snap) => {
      if (snap.exists()) {
        onData({ uid: snap.id, ...(snap.data() as Omit<UserProfile, 'uid'>) });
      } else {
        onData(null);
      }
    },
    (error) => handleFirestoreError(error, OperationType.GET, `users/${uid}`)
  );
}

export async function fetchUserProfilesByIds(uids: string[]): Promise<Record<string, UserProfile>> {
  const uniqueIds = Array.from(new Set(uids.filter(Boolean)));
  const result: Record<string, UserProfile> = {};
  if (uniqueIds.length === 0) return result;

  // Fetch missing docs in parallel (works reliably without `in` 10-item chunk limits or index issues)
  await Promise.all(
    uniqueIds.map(async (uid) => {
      try {
        const snap = await getDoc(doc(db, 'users', uid));
        if (snap.exists()) {
          result[uid] = { uid: snap.id, ...(snap.data() as Omit<UserProfile, 'uid'>) };
        }
      } catch (err) {
        console.warn(`Could not fetch profile for ${uid}:`, err);
      }
    })
  );

  return result;
}

export async function searchUsers(rawQuery: string, excludeUid?: string): Promise<UserProfile[]> {
  const qText = rawQuery.trim();
  if (!qText) return [];

  const resultsMap = new Map<string, UserProfile>();
  const cleanName = normalizeUsername(qText);

  // 1. Exact username lookup via `usernames`
  if (cleanName.length >= 2) {
    try {
      const prefixQ = query(
        collection(db, 'users'),
        where('username', '>=', cleanName),
        where('username', '<=', `${cleanName}\uf8ff`),
        limit(10)
      );
      const snap = await getDocs(prefixQ);
      snap.forEach((docSnap) => {
        const profile = { uid: docSnap.id, ...(docSnap.data() as Omit<UserProfile, 'uid'>) };
        if (profile.uid !== excludeUid) resultsMap.set(profile.uid, profile);
      });
    } catch (err) {
      console.warn('Username prefix search warning:', err);
    }
  }

  // 2. Exact email lookup if query contains '@' and looks like email
  if (qText.includes('@') && !qText.startsWith('@')) {
    try {
      const emailQ = query(
        collection(db, 'users'),
        where('email', '==', qText.toLowerCase()),
        limit(5)
      );
      const snap = await getDocs(emailQ);
      snap.forEach((docSnap) => {
        const profile = { uid: docSnap.id, ...(docSnap.data() as Omit<UserProfile, 'uid'>) };
        if (profile.uid !== excludeUid) resultsMap.set(profile.uid, profile);
      });
    } catch (err) {
      console.warn('Email search warning:', err);
    }
  }

  return Array.from(resultsMap.values());
}

// ==========================================
// Privacy-Safe Availability (Free/Busy Slots)
// ==========================================

export async function syncUserAvailability(uid: string, events: CalendarEvent[]): Promise<void> {
  if (!uid) return;
  const busySlots: BusySlot[] = events.map((evt) => ({
    eventId: evt.id,
    date: evt.date,
    time: evt.time,
    durationMinutes: evt.durationMinutes || 60,
    recurrence: evt.recurrence || 'none',
  }));

  const payload: UserAvailability = {
    uid,
    busySlots,
    updatedAt: new Date().toISOString(),
  };

  try {
    await setDoc(doc(db, 'availability', uid), cleanData(payload));
  } catch (err) {
    handleFirestoreError(err, OperationType.WRITE, `availability/${uid}`);
  }
}

export function subscribeToUsersAvailability(
  uids: string[],
  onData: (availMap: Record<string, BusySlot[]>) => void
): Unsubscribe {
  const uniqueIds = Array.from(new Set(uids.filter(Boolean)));
  if (uniqueIds.length === 0) {
    onData({});
    return () => {};
  }

  const currentMap: Record<string, BusySlot[]> = {};
  const unsubs = uniqueIds.map((uid) => {
    return onSnapshot(
      doc(db, 'availability', uid),
      (snap) => {
        if (snap.exists()) {
          const data = snap.data() as UserAvailability;
          currentMap[uid] = data.busySlots || [];
        } else {
          currentMap[uid] = [];
        }
        onData({ ...currentMap });
      },
      (err) => {
        console.warn(`Availability subscription warning for ${uid}:`, err);
      }
    );
  });

  return () => {
    unsubs.forEach((u) => u());
  };
}

// ==========================================
// Friendships
// ==========================================

export function getFriendshipId(uidA: string, uidB: string): string {
  return [uidA, uidB].sort().join('_');
}

export function subscribeToFriendships(
  uid: string,
  onData: (friendships: Friendship[]) => void
): Unsubscribe {
  const q = query(collection(db, 'friendships'), where('users', 'array-contains', uid));
  return onSnapshot(
    q,
    (snap) => {
      const list: Friendship[] = [];
      snap.forEach((d) => {
        list.push({ id: d.id, ...(d.data() as Omit<Friendship, 'id'>) });
      });
      list.sort((a, b) => new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime());
      onData(list);
    },
    (err) => handleFirestoreError(err, OperationType.GET, 'friendships')
  );
}

export async function sendFriendRequest(
  requesterId: string,
  recipientId: string,
  shareAvailability: boolean
): Promise<void> {
  if (requesterId === recipientId) throw new Error('Du kannst dich nicht selbst hinzufügen.');
  const id = getFriendshipId(requesterId, recipientId);
  const existing = await getDoc(doc(db, 'friendships', id));
  const now = new Date().toISOString();

  if (existing.exists()) {
    const data = existing.data() as Friendship;
    if (data.status === 'accepted') {
      throw new Error('Ihr seid bereits befreundet.');
    }
    if (data.status === 'pending') {
      throw new Error('Es existiert bereits eine offene Anfrage.');
    }
  }

  const users = [requesterId, recipientId].sort() as [string, string];
  const friendship: Friendship = {
    id,
    users,
    requesterId,
    recipientId,
    status: 'pending',
    shareAvailabilityByUser: {
      [requesterId]: shareAvailability,
      [recipientId]: false,
    },
    createdAt: now,
    updatedAt: now,
  };

  await setDoc(doc(db, 'friendships', id), cleanData(friendship));
}

export async function respondToFriendRequest(
  friendshipId: string,
  responderId: string,
  accept: boolean,
  shareAvailability: boolean
): Promise<void> {
  const now = new Date().toISOString();
  if (!accept) {
    await updateDoc(doc(db, 'friendships', friendshipId), {
      status: 'declined',
      updatedAt: now,
    });
    return;
  }

  await updateDoc(doc(db, 'friendships', friendshipId), {
    status: 'accepted',
    [`shareAvailabilityByUser.${responderId}`]: shareAvailability,
    updatedAt: now,
  });
}

export async function toggleFriendAvailability(
  friendshipId: string,
  uid: string,
  share: boolean
): Promise<void> {
  await updateDoc(doc(db, 'friendships', friendshipId), {
    [`shareAvailabilityByUser.${uid}`]: share,
    updatedAt: new Date().toISOString(),
  });
}

export async function removeFriendship(friendshipId: string): Promise<void> {
  await deleteDoc(doc(db, 'friendships', friendshipId));
}

// ==========================================
// Friend Groups (Independent of Projects)
// ==========================================

export function subscribeToFriendGroups(
  uid: string,
  onData: (groups: FriendGroup[]) => void
): Unsubscribe {
  const qMembers = query(collection(db, 'friendGroups'), where('memberIds', 'array-contains', uid));
  const qPending = query(collection(db, 'friendGroups'), where('pendingMemberIds', 'array-contains', uid));

  let memberGroups: FriendGroup[] = [];
  let pendingGroups: FriendGroup[] = [];

  const emit = () => {
    const map = new Map<string, FriendGroup>();
    for (const g of [...memberGroups, ...pendingGroups]) {
      map.set(g.id, g);
    }
    const merged = Array.from(map.values()).sort(
      (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
    );
    onData(merged);
  };

  const unsub1 = onSnapshot(
    qMembers,
    (snap) => {
      memberGroups = snap.docs.map((d) => ({ id: d.id, ...(d.data() as Omit<FriendGroup, 'id'>) }));
      emit();
    },
    (err) => handleFirestoreError(err, OperationType.GET, 'friendGroups')
  );

  const unsub2 = onSnapshot(
    qPending,
    (snap) => {
      pendingGroups = snap.docs.map((d) => ({ id: d.id, ...(d.data() as Omit<FriendGroup, 'id'>) }));
      emit();
    },
    (err) => handleFirestoreError(err, OperationType.GET, 'friendGroups')
  );

  return () => {
    unsub1();
    unsub2();
  };
}

export async function createFriendGroup(data: {
  name: string;
  description?: string;
  color: string;
  createdBy: string;
  inviteeIds: string[];
  creatorShareAvailability: boolean;
}): Promise<FriendGroup> {
  const now = new Date().toISOString();
  const id = `grp-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`;
  const group: FriendGroup = {
    id,
    name: data.name.trim(),
    description: data.description?.trim() || '',
    color: data.color,
    createdBy: data.createdBy,
    memberIds: [data.createdBy],
    pendingMemberIds: data.inviteeIds.filter((u) => u !== data.createdBy),
    availabilitySharedBy: {
      [data.createdBy]: data.creatorShareAvailability,
    },
    createdAt: now,
    updatedAt: now,
  };

  await setDoc(doc(db, 'friendGroups', id), cleanData(group));
  await ensureGroupOrProjectChatRoom({
    type: 'group',
    id: `grp_${id}`,
    title: group.name,
    participantIds: [data.createdBy],
    friendGroupId: id,
  });

  return group;
}

export async function inviteToFriendGroup(groupId: string, uid: string): Promise<void> {
  await updateDoc(doc(db, 'friendGroups', groupId), {
    pendingMemberIds: arrayUnion(uid),
    updatedAt: new Date().toISOString(),
  });
}

export async function respondToFriendGroupInvite(
  groupId: string,
  uid: string,
  accept: boolean,
  shareAvailability: boolean
): Promise<void> {
  const now = new Date().toISOString();
  if (!accept) {
    await updateDoc(doc(db, 'friendGroups', groupId), {
      pendingMemberIds: arrayRemove(uid),
      updatedAt: now,
    });
    return;
  }

  await updateDoc(doc(db, 'friendGroups', groupId), {
    pendingMemberIds: arrayRemove(uid),
    memberIds: arrayUnion(uid),
    [`availabilitySharedBy.${uid}`]: shareAvailability,
    updatedAt: now,
  });

  // Add user to group chat
  const chatRef = doc(db, 'chats', `grp_${groupId}`);
  const chatSnap = await getDoc(chatRef);
  if (chatSnap.exists()) {
    await updateDoc(chatRef, {
      participantIds: arrayUnion(uid),
      updatedAt: now,
    });
  }
}

export async function toggleGroupAvailability(
  groupId: string,
  uid: string,
  share: boolean
): Promise<void> {
  await updateDoc(doc(db, 'friendGroups', groupId), {
    [`availabilitySharedBy.${uid}`]: share,
    updatedAt: new Date().toISOString(),
  });
}

export async function leaveFriendGroup(groupId: string, uid: string): Promise<void> {
  const now = new Date().toISOString();
  await updateDoc(doc(db, 'friendGroups', groupId), {
    memberIds: arrayRemove(uid),
    updatedAt: now,
  });
  const chatRef = doc(db, 'chats', `grp_${groupId}`);
  const chatSnap = await getDoc(chatRef);
  if (chatSnap.exists()) {
    await updateDoc(chatRef, {
      participantIds: arrayRemove(uid),
      updatedAt: now,
    });
  }
}

export async function deleteFriendGroup(groupId: string): Promise<void> {
  await deleteDoc(doc(db, 'friendGroups', groupId));
}

// ==========================================
// Projects & Project Invites
// ==========================================

export function subscribeToProjects(
  uid: string,
  onData: (projects: Project[]) => void
): Unsubscribe {
  const q = query(collection(db, 'projects'), where('memberIds', 'array-contains', uid));
  return onSnapshot(
    q,
    (snap) => {
      const list: Project[] = snap.docs.map((d) => ({
        id: d.id,
        ...(d.data() as Omit<Project, 'id'>),
      }));
      list.sort((a, b) => new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime());
      onData(list);
    },
    (err) => handleFirestoreError(err, OperationType.GET, 'projects')
  );
}

export async function createProjectInFirestore(project: Project): Promise<void> {
  const { id, ...data } = project;
  await setDoc(doc(db, 'projects', id), cleanData(data));
  await ensureGroupOrProjectChatRoom({
    type: 'project',
    id: `proj_${id}`,
    title: project.title,
    participantIds: project.memberIds,
    projectId: id,
  });
}

export async function updateProjectInFirestore(
  id: string,
  updates: Partial<Project>
): Promise<void> {
  await updateDoc(doc(db, 'projects', id), cleanData(updates));
  if (updates.title) {
    const chatRef = doc(db, 'chats', `proj_${id}`);
    const snap = await getDoc(chatRef);
    if (snap.exists()) {
      await updateDoc(chatRef, { title: updates.title, updatedAt: new Date().toISOString() });
    }
  }
}

export async function deleteProjectInFirestore(id: string): Promise<void> {
  await deleteDoc(doc(db, 'projects', id));
}

export async function toggleProjectAvailability(
  projectId: string,
  uid: string,
  share: boolean
): Promise<void> {
  await updateDoc(doc(db, 'projects', projectId), {
    [`availabilitySharedBy.${uid}`]: share,
    updatedAt: new Date().toISOString(),
  });
}

export async function leaveProjectInFirestore(projectId: string, uid: string): Promise<void> {
  const now = new Date().toISOString();
  await updateDoc(doc(db, 'projects', projectId), {
    memberIds: arrayRemove(uid),
    updatedAt: now,
  });
  const chatRef = doc(db, 'chats', `proj_${projectId}`);
  const snap = await getDoc(chatRef);
  if (snap.exists()) {
    await updateDoc(chatRef, {
      participantIds: arrayRemove(uid),
      updatedAt: now,
    });
  }
}

export function subscribeToProjectInvites(
  uid: string,
  onData: (invites: ProjectInvite[]) => void
): Unsubscribe {
  const qInvitee = query(collection(db, 'projectInvites'), where('inviteeId', '==', uid));
  const qInviter = query(collection(db, 'projectInvites'), where('inviterId', '==', uid));

  let asInvitee: ProjectInvite[] = [];
  let asInviter: ProjectInvite[] = [];

  const emit = () => {
    const map = new Map<string, ProjectInvite>();
    for (const inv of [...asInvitee, ...asInviter]) {
      map.set(inv.id, inv);
    }
    const merged = Array.from(map.values()).sort(
      (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
    );
    onData(merged);
  };

  const unsub1 = onSnapshot(
    qInvitee,
    (snap) => {
      asInvitee = snap.docs.map((d) => ({ id: d.id, ...(d.data() as Omit<ProjectInvite, 'id'>) }));
      emit();
    },
    (err) => handleFirestoreError(err, OperationType.GET, 'projectInvites')
  );

  const unsub2 = onSnapshot(
    qInviter,
    (snap) => {
      asInviter = snap.docs.map((d) => ({ id: d.id, ...(d.data() as Omit<ProjectInvite, 'id'>) }));
      emit();
    },
    (err) => handleFirestoreError(err, OperationType.GET, 'projectInvites')
  );

  return () => {
    unsub1();
    unsub2();
  };
}

export async function sendProjectInvite(data: {
  project: Project;
  inviterId: string;
  inviteeId: string;
}): Promise<void> {
  if (data.project.memberIds.includes(data.inviteeId)) {
    throw new Error('Diese Person ist bereits Projektmitglied.');
  }
  const id = `pinv_${data.project.id}_${data.inviteeId}`;
  const existing = await getDoc(doc(db, 'projectInvites', id));
  if (existing.exists() && (existing.data() as ProjectInvite).status === 'pending') {
    throw new Error('Für diese Person existiert bereits eine offene Einladung.');
  }

  const now = new Date().toISOString();
  const invite: ProjectInvite = {
    id,
    projectId: data.project.id,
    projectTitle: data.project.title,
    projectColor: data.project.color,
    inviterId: data.inviterId,
    inviteeId: data.inviteeId,
    status: 'pending',
    createdAt: now,
    updatedAt: now,
  };

  await setDoc(doc(db, 'projectInvites', id), cleanData(invite));
}

export async function respondToProjectInvite(
  invite: ProjectInvite,
  accept: boolean,
  shareAvailability: boolean
): Promise<void> {
  const now = new Date().toISOString();
  if (!accept) {
    await updateDoc(doc(db, 'projectInvites', invite.id), {
      status: 'declined',
      updatedAt: now,
    });
    return;
  }

  await updateDoc(doc(db, 'projectInvites', invite.id), {
    status: 'accepted',
    updatedAt: now,
  });

  await updateDoc(doc(db, 'projects', invite.projectId), {
    memberIds: arrayUnion(invite.inviteeId),
    [`availabilitySharedBy.${invite.inviteeId}`]: shareAvailability,
    updatedAt: now,
  });

  const chatRef = doc(db, 'chats', `proj_${invite.projectId}`);
  const chatSnap = await getDoc(chatRef);
  if (chatSnap.exists()) {
    await updateDoc(chatRef, {
      participantIds: arrayUnion(invite.inviteeId),
      updatedAt: now,
    });
  }
}

// ==========================================
// Event Requests (Terminanfragen)
// ==========================================

export function subscribeToEventRequests(
  uid: string,
  onData: (requests: EventRequest[]) => void
): Unsubscribe {
  const qInvitee = query(collection(db, 'eventRequests'), where('inviteeIds', 'array-contains', uid));
  const qCreator = query(collection(db, 'eventRequests'), where('creatorId', '==', uid));

  let asInvitee: EventRequest[] = [];
  let asCreator: EventRequest[] = [];

  const emit = () => {
    const map = new Map<string, EventRequest>();
    for (const r of [...asInvitee, ...asCreator]) {
      map.set(r.id, r);
    }
    const merged = Array.from(map.values()).sort(
      (a, b) => `${a.date} ${a.time}`.localeCompare(`${b.date} ${b.time}`)
    );
    onData(merged);
  };

  const unsub1 = onSnapshot(
    qInvitee,
    (snap) => {
      asInvitee = snap.docs.map((d) => ({ id: d.id, ...(d.data() as Omit<EventRequest, 'id'>) }));
      emit();
    },
    (err) => handleFirestoreError(err, OperationType.GET, 'eventRequests')
  );

  const unsub2 = onSnapshot(
    qCreator,
    (snap) => {
      asCreator = snap.docs.map((d) => ({ id: d.id, ...(d.data() as Omit<EventRequest, 'id'>) }));
      emit();
    },
    (err) => handleFirestoreError(err, OperationType.GET, 'eventRequests')
  );

  return () => {
    unsub1();
    unsub2();
  };
}

export async function createEventRequest(data: {
  title: string;
  description?: string;
  date: string;
  time: string;
  durationMinutes: number;
  category: Category;
  recurrence: Recurrence;
  creatorId: string;
  creatorName?: string;
  projectId?: string;
  friendGroupId?: string;
  inviteeIds: string[];
}): Promise<EventRequest> {
  const now = new Date().toISOString();
  const cleanInvitees = Array.from(new Set(data.inviteeIds.filter((id) => id && id !== data.creatorId)));
  const requestId = `ereq-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`;
  const eventId = `event-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`;

  const responses: Record<string, 'pending' | 'accepted' | 'declined'> = {
    [data.creatorId]: 'accepted',
  };
  for (const invId of cleanInvitees) {
    responses[invId] = 'pending';
  }

  // Create the shared CalendarEvent immediately for the creator (participantIds starts with [creatorId])
  const sharedEvent: CalendarEvent = {
    id: eventId,
    userId: data.creatorId,
    title: data.title.trim(),
    description: data.description?.trim() || '',
    date: data.date,
    time: data.time,
    durationMinutes: data.durationMinutes || 60,
    category: data.category,
    recurrence: data.recurrence || 'none',
    projectId: data.projectId,
    friendGroupId: data.friendGroupId,
    participantIds: [data.creatorId],
    isShared: true,
    eventRequestId: requestId,
    createdByName: data.creatorName,
    createdAt: now,
    updatedAt: now,
  };

  await setDoc(doc(db, 'events', eventId), cleanData(sharedEvent));

  const req: EventRequest = {
    id: requestId,
    title: data.title.trim(),
    description: data.description?.trim() || '',
    date: data.date,
    time: data.time,
    durationMinutes: data.durationMinutes || 60,
    category: data.category,
    recurrence: data.recurrence || 'none',
    creatorId: data.creatorId,
    projectId: data.projectId,
    friendGroupId: data.friendGroupId,
    inviteeIds: cleanInvitees,
    responses,
    createdEventId: eventId,
    createdAt: now,
    updatedAt: now,
  };

  await setDoc(doc(db, 'eventRequests', requestId), cleanData(req));
  return req;
}

export async function respondToEventRequest(
  request: EventRequest,
  uid: string,
  accept: boolean
): Promise<void> {
  const now = new Date().toISOString();
  await updateDoc(doc(db, 'eventRequests', request.id), {
    [`responses.${uid}`]: accept ? 'accepted' : 'declined',
    updatedAt: now,
  });

  if (request.createdEventId) {
    const eventRef = doc(db, 'events', request.createdEventId);
    const snap = await getDoc(eventRef);
    if (snap.exists()) {
      await updateDoc(eventRef, {
        participantIds: accept ? arrayUnion(uid) : arrayRemove(uid),
        updatedAt: now,
      });
    }
  }
}

export async function deleteEventRequest(requestId: string): Promise<void> {
  await deleteDoc(doc(db, 'eventRequests', requestId));
}

// ==========================================
// Real-Time Chats (1:1 DM, Group, Project)
// ==========================================

export function getDirectChatId(uidA: string, uidB: string): string {
  return `dm_${[uidA, uidB].sort().join('_')}`;
}

export async function ensureDirectChatRoom(uidA: string, uidB: string): Promise<ChatRoom> {
  const id = getDirectChatId(uidA, uidB);
  const ref = doc(db, 'chats', id);
  const snap = await getDoc(ref);
  if (snap.exists()) {
    return { id: snap.id, ...(snap.data() as Omit<ChatRoom, 'id'>) };
  }
  const now = new Date().toISOString();
  const room: ChatRoom = {
    id,
    type: 'dm',
    participantIds: [uidA, uidB].sort(),
    createdAt: now,
    updatedAt: now,
  };
  await setDoc(ref, cleanData(room));
  return room;
}

export async function ensureGroupOrProjectChatRoom(params: {
  id: string;
  type: 'project' | 'group';
  title: string;
  participantIds: string[];
  projectId?: string;
  friendGroupId?: string;
}): Promise<ChatRoom> {
  const ref = doc(db, 'chats', params.id);
  const snap = await getDoc(ref);
  const now = new Date().toISOString();
  if (snap.exists()) {
    const existing = { id: snap.id, ...(snap.data() as Omit<ChatRoom, 'id'>) };
    // Ensure participants are synced
    await updateDoc(ref, {
      title: params.title,
      participantIds: Array.from(new Set([...(existing.participantIds || []), ...params.participantIds])),
      updatedAt: now,
    }).catch(() => {});
    return existing;
  }

  const room: ChatRoom = {
    id: params.id,
    type: params.type,
    title: params.title,
    participantIds: Array.from(new Set(params.participantIds)),
    projectId: params.projectId,
    friendGroupId: params.friendGroupId,
    createdAt: now,
    updatedAt: now,
  };
  await setDoc(ref, cleanData(room));
  return room;
}

export function subscribeToChatRooms(
  uid: string,
  onData: (rooms: ChatRoom[]) => void
): Unsubscribe {
  const q = query(collection(db, 'chats'), where('participantIds', 'array-contains', uid));
  return onSnapshot(
    q,
    (snap) => {
      const rooms: ChatRoom[] = snap.docs.map((d) => ({
        id: d.id,
        ...(d.data() as Omit<ChatRoom, 'id'>),
      }));
      rooms.sort((a, b) => {
        const ta = new Date(a.lastMessageAt || a.updatedAt).getTime();
        const tb = new Date(b.lastMessageAt || b.updatedAt).getTime();
        return tb - ta;
      });
      onData(rooms);
    },
    (err) => handleFirestoreError(err, OperationType.GET, 'chats')
  );
}

export function subscribeToChatMessages(
  chatId: string,
  onData: (messages: ChatMessage[]) => void
): Unsubscribe {
  const q = query(collection(db, 'chats', chatId, 'messages'));
  return onSnapshot(
    q,
    (snap) => {
      const msgs: ChatMessage[] = snap.docs.map((d) => ({
        id: d.id,
        ...(d.data() as Omit<ChatMessage, 'id'>),
      }));
      msgs.sort((a, b) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime());
      onData(msgs);
    },
    (err) => handleFirestoreError(err, OperationType.GET, `chats/${chatId}/messages`)
  );
}

export async function sendChatMessage(params: {
  chatId: string;
  senderId: string;
  senderName: string;
  text: string;
  attachmentType?: 'event_request' | 'task' | 'idea';
  attachmentData?: Record<string, any>;
}): Promise<void> {
  const trimmed = params.text.trim();
  if (!trimmed && !params.attachmentType) return;

  const now = new Date().toISOString();
  const msgId = `msg-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`;
  const msg: ChatMessage = {
    id: msgId,
    chatId: params.chatId,
    senderId: params.senderId,
    senderName: params.senderName,
    text: trimmed,
    attachmentType: params.attachmentType,
    attachmentData: params.attachmentData,
    createdAt: now,
  };

  await setDoc(doc(db, 'chats', params.chatId, 'messages', msgId), cleanData(msg));
  await updateDoc(doc(db, 'chats', params.chatId), {
    lastMessage: trimmed || 'Anhang gesendet',
    lastMessageAt: now,
    lastMessageSenderId: params.senderId,
    updatedAt: now,
  }).catch(() => {});
}
