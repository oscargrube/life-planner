export type Category = 
  | 'Sport' 
  | 'Arbeit' 
  | 'Studium' 
  | 'Finanzen' 
  | 'Persönlich' 
  | 'Gesundheit' 
  | 'Kreativ' 
  | 'Projekt';

export type Recurrence = 'none' | 'daily' | 'weekly' | 'monthly';

export type IdeaStatus = 'new' | 'evolving' | 'converted' | 'archived';

export type TaskStatus = 'backlog' | 'todo' | 'in_progress' | 'done';
export type TaskPriority = 'low' | 'medium' | 'high';
export type ProjectStatus = 'planning' | 'active' | 'completed' | 'archived';

export interface Idea {
  id: string;
  userId: string;
  title: string;
  description?: string;
  category: Category;
  status: IdeaStatus;
  projectId?: string;
  authorId?: string;
  authorName?: string;
  convertedTo?: {
    type: 'task' | 'event';
    targetId: string;
  };
  createdAt: string;
  updatedAt: string;
}

export interface Task {
  id: string;
  userId: string;
  title: string;
  description?: string;
  category: Category;
  recurrence: Recurrence;
  completed: boolean;
  dueDate?: string; // YYYY-MM-DD
  projectId?: string;
  assigneeId?: string;
  kanbanStatus?: TaskStatus;
  priority?: TaskPriority;
  sourceIdeaId?: string;
  sourceIdeaTitle?: string;
  createdAt: string;
  updatedAt: string;
}

export interface CalendarEvent {
  id: string;
  userId: string;
  title: string;
  description?: string;
  date: string; // YYYY-MM-DD
  time: string; // HH:mm
  durationMinutes: number; // e.g. 60
  category: Category;
  recurrence: Recurrence;
  projectId?: string;
  friendGroupId?: string;
  participantIds?: string[];
  isShared?: boolean;
  eventRequestId?: string;
  createdByName?: string;
  sourceTaskId?: string;
  sourceIdeaId?: string;
  createdAt: string;
  updatedAt: string;
}

export type ViewScreen = 'calendar' | 'ideas' | 'tasks' | 'projects' | 'social';

// ==========================================
// Social, Availability, Projects & Chats
// ==========================================

export interface UserProfile {
  uid: string;
  username: string; // normalized lowercase handle without @
  displayName: string;
  email?: string;
  photoURL?: string;
  createdAt: string;
  updatedAt: string;
}

export interface BusySlot {
  eventId: string;
  date: string; // YYYY-MM-DD
  time: string; // HH:mm
  durationMinutes: number;
  recurrence: Recurrence;
}

export interface UserAvailability {
  uid: string;
  busySlots: BusySlot[];
  updatedAt: string;
}

export interface Friendship {
  id: string;
  users: [string, string]; // sorted [uid1, uid2]
  requesterId: string;
  recipientId: string;
  status: 'pending' | 'accepted' | 'declined';
  shareAvailabilityByUser: Record<string, boolean>;
  createdAt: string;
  updatedAt: string;
}

export interface FriendGroup {
  id: string;
  name: string;
  description?: string;
  color: string;
  createdBy: string;
  memberIds: string[];
  pendingMemberIds: string[];
  availabilitySharedBy: Record<string, boolean>;
  createdAt: string;
  updatedAt: string;
}

export interface Project {
  id: string;
  title: string;
  description?: string;
  color: string;
  ownerId: string;
  memberIds: string[];
  availabilitySharedBy: Record<string, boolean>;
  status: ProjectStatus;
  targetDate?: string; // YYYY-MM-DD
  createdAt: string;
  updatedAt: string;
}

export interface ProjectInvite {
  id: string;
  projectId: string;
  projectTitle: string;
  projectColor: string;
  inviterId: string;
  inviteeId: string;
  status: 'pending' | 'accepted' | 'declined';
  createdAt: string;
  updatedAt: string;
}

export type EventRequestResponse = 'pending' | 'accepted' | 'declined';

export interface EventRequest {
  id: string;
  title: string;
  description?: string;
  date: string; // YYYY-MM-DD
  time: string; // HH:mm
  durationMinutes: number;
  category: Category;
  recurrence: Recurrence;
  creatorId: string;
  projectId?: string;
  friendGroupId?: string;
  inviteeIds: string[];
  responses: Record<string, EventRequestResponse>;
  createdEventId?: string;
  createdAt: string;
  updatedAt: string;
}

export type ChatRoomType = 'dm' | 'project' | 'group';

export interface ChatRoom {
  id: string;
  type: ChatRoomType;
  title?: string;
  participantIds: string[];
  projectId?: string;
  friendGroupId?: string;
  lastMessage?: string;
  lastMessageAt?: string;
  lastMessageSenderId?: string;
  createdAt: string;
  updatedAt: string;
}

export interface ChatMessage {
  id: string;
  chatId: string;
  senderId: string;
  senderName: string;
  text: string;
  attachmentType?: 'event_request' | 'task' | 'idea';
  attachmentData?: Record<string, any>;
  createdAt: string;
}

export const PROJECT_COLORS = [
  '#174e36',
  '#0284c7',
  '#7c3aed',
  '#d97706',
  '#e11d48',
  '#0d9488',
  '#ea580c',
  '#4f46e5',
];

export const TASK_STATUS_CONFIG: Record<
  TaskStatus,
  { label: string; color: string; bgClass: string; dotClass: string }
> = {
  backlog: {
    label: 'Backlog',
    color: '#64748b',
    bgClass: 'bg-slate-100 text-slate-700 border-slate-200',
    dotClass: 'bg-slate-400',
  },
  todo: {
    label: 'Zu erledigen',
    color: '#0284c7',
    bgClass: 'bg-sky-50 text-sky-800 border-sky-200',
    dotClass: 'bg-sky-500',
  },
  in_progress: {
    label: 'In Arbeit',
    color: '#d97706',
    bgClass: 'bg-amber-50 text-amber-800 border-amber-200',
    dotClass: 'bg-amber-500',
  },
  done: {
    label: 'Erledigt',
    color: '#059669',
    bgClass: 'bg-emerald-50 text-emerald-800 border-emerald-200',
    dotClass: 'bg-emerald-500',
  },
};

export const TASK_PRIORITY_CONFIG: Record<
  TaskPriority,
  { label: string; bgClass: string }
> = {
  low: {
    label: 'Niedrig',
    bgClass: 'bg-slate-50 text-slate-600 border-slate-200',
  },
  medium: {
    label: 'Mittel',
    bgClass: 'bg-amber-50 text-amber-700 border-amber-200',
  },
  high: {
    label: 'Hoch',
    bgClass: 'bg-rose-50 text-rose-700 border-rose-200',
  },
};

export interface CategoryConfig {
  label: Category;
  color: string;
  badgeClass: string;
  bgLight: string;
  textDark: string;
  border: string;
  accent: string;
}

export const CATEGORIES_CONFIG: Record<Category, CategoryConfig> = {
  Sport: {
    label: 'Sport',
    color: '#059669',
    badgeClass: 'bg-emerald-50 text-emerald-800 border border-emerald-200 shadow-xs',
    bgLight: 'bg-emerald-50/90 text-emerald-950 border-emerald-200/80',
    textDark: 'text-emerald-950',
    border: 'border-emerald-300',
    accent: 'bg-emerald-600',
  },
  Arbeit: {
    label: 'Arbeit',
    color: '#0284c7',
    badgeClass: 'bg-sky-50 text-sky-800 border border-sky-200 shadow-xs',
    bgLight: 'bg-sky-50/90 text-sky-950 border-sky-200/80',
    textDark: 'text-sky-950',
    border: 'border-sky-300',
    accent: 'bg-sky-600',
  },
  Studium: {
    label: 'Studium',
    color: '#7c3aed',
    badgeClass: 'bg-purple-50 text-purple-800 border border-purple-200 shadow-xs',
    bgLight: 'bg-purple-50/90 text-purple-950 border-purple-200/80',
    textDark: 'text-purple-950',
    border: 'border-purple-300',
    accent: 'bg-purple-600',
  },
  Finanzen: {
    label: 'Finanzen',
    color: '#d97706',
    badgeClass: 'bg-amber-50 text-amber-800 border border-amber-200 shadow-xs',
    bgLight: 'bg-amber-50/90 text-amber-950 border-amber-200/80',
    textDark: 'text-amber-950',
    border: 'border-amber-300',
    accent: 'bg-amber-600',
  },
  Persönlich: {
    label: 'Persönlich',
    color: '#e11d48',
    badgeClass: 'bg-rose-50 text-rose-800 border border-rose-200 shadow-xs',
    bgLight: 'bg-rose-50/90 text-rose-950 border-rose-200/80',
    textDark: 'text-rose-950',
    border: 'border-rose-300',
    accent: 'bg-rose-600',
  },
  Gesundheit: {
    label: 'Gesundheit',
    color: '#0d9488',
    badgeClass: 'bg-teal-50 text-teal-800 border border-teal-200 shadow-xs',
    bgLight: 'bg-teal-50/90 text-teal-950 border-teal-200/80',
    textDark: 'text-teal-950',
    border: 'border-teal-300',
    accent: 'bg-teal-600',
  },
  Kreativ: {
    label: 'Kreativ',
    color: '#ea580c',
    badgeClass: 'bg-orange-50 text-orange-800 border border-orange-200 shadow-xs',
    bgLight: 'bg-orange-50/90 text-orange-950 border-orange-200/80',
    textDark: 'text-orange-950',
    border: 'border-orange-300',
    accent: 'bg-orange-600',
  },
  Projekt: {
    label: 'Projekt',
    color: '#4f46e5',
    badgeClass: 'bg-indigo-50 text-indigo-800 border border-indigo-200 shadow-xs',
    bgLight: 'bg-indigo-50/90 text-indigo-950 border-indigo-200/80',
    textDark: 'text-indigo-950',
    border: 'border-indigo-300',
    accent: 'bg-indigo-600',
  },
};
