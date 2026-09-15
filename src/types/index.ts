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

export interface Idea {
  id: string;
  userId: string;
  title: string;
  description?: string;
  category: Category;
  status: IdeaStatus;
  convertedTo?: {
    type: 'task' | 'event' | 'wish';
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
  sourceTaskId?: string;
  sourceIdeaId?: string;
  createdAt: string;
  updatedAt: string;
}

export interface WishItem {
  id: string;
  userId: string;
  title: string;
  description?: string;
  category: Category;
  estimatedCost?: number;
  savedAmount?: number;
  targetDate?: string;
  sourceIdeaId?: string;
  createdAt: string;
  updatedAt: string;
}

export type ViewScreen = 'calendar' | 'ideas' | 'tasks';

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
    textDark: 'text-emerald-900',
    border: 'border-emerald-300',
    accent: 'bg-emerald-600',
  },
  Arbeit: {
    label: 'Arbeit',
    color: '#0284c7',
    badgeClass: 'bg-sky-50 text-sky-800 border border-sky-200 shadow-xs',
    bgLight: 'bg-sky-50/90 text-sky-950 border-sky-200/80',
    textDark: 'text-sky-900',
    border: 'border-sky-300',
    accent: 'bg-sky-600',
  },
  Studium: {
    label: 'Studium',
    color: '#7c3aed',
    badgeClass: 'bg-purple-50 text-purple-800 border border-purple-200 shadow-xs',
    bgLight: 'bg-purple-50/90 text-purple-950 border-purple-200/80',
    textDark: 'text-purple-900',
    border: 'border-purple-300',
    accent: 'bg-purple-600',
  },
  Finanzen: {
    label: 'Finanzen',
    color: '#d97706',
    badgeClass: 'bg-amber-50 text-amber-800 border border-amber-200 shadow-xs',
    bgLight: 'bg-amber-50/90 text-amber-950 border-amber-200/80',
    textDark: 'text-amber-900',
    border: 'border-amber-300',
    accent: 'bg-amber-600',
  },
  Persönlich: {
    label: 'Persönlich',
    color: '#e11d48',
    badgeClass: 'bg-rose-50 text-rose-800 border border-rose-200 shadow-xs',
    bgLight: 'bg-rose-50/90 text-rose-950 border-rose-200/80',
    textDark: 'text-rose-900',
    border: 'border-rose-300',
    accent: 'bg-rose-600',
  },
  Gesundheit: {
    label: 'Gesundheit',
    color: '#0d9488',
    badgeClass: 'bg-teal-50 text-teal-800 border border-teal-200 shadow-xs',
    bgLight: 'bg-teal-50/90 text-teal-950 border-teal-200/80',
    textDark: 'text-teal-900',
    border: 'border-teal-300',
    accent: 'bg-teal-600',
  },
  Kreativ: {
    label: 'Kreativ',
    color: '#ea580c',
    badgeClass: 'bg-orange-50 text-orange-800 border border-orange-200 shadow-xs',
    bgLight: 'bg-orange-50/90 text-orange-950 border-orange-200/80',
    textDark: 'text-orange-900',
    border: 'border-orange-300',
    accent: 'bg-orange-600',
  },
  Projekt: {
    label: 'Projekt',
    color: '#4f46e5',
    badgeClass: 'bg-indigo-50 text-indigo-800 border border-indigo-200 shadow-xs',
    bgLight: 'bg-indigo-50/90 text-indigo-950 border-indigo-200/80',
    textDark: 'text-indigo-900',
    border: 'border-indigo-300',
    accent: 'bg-indigo-600',
  },
};
