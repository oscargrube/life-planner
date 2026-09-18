/**
 * Rock-solid timezone-safe date utilities for the Life Planner calendar.
 * All formatting and calculations operate on local date components (year, month, date)
 * to avoid any UTC timezone drift (e.g. UTC+1 / UTC+2 in Europe causing 1-day shifts).
 */

export interface WeekDayInfo {
  dateString: string; // YYYY-MM-DD
  dateObj: Date;
  isToday: boolean;
  dayLabel: string;
  dayNum: number;
}

export interface MonthDayInfo {
  dateString: string; // YYYY-MM-DD
  dayNumber: number;
  isCurrentMonth: boolean;
  isToday: boolean;
}

/**
 * Formats a Date object into a local 'YYYY-MM-DD' key without UTC timezone drift.
 */
export function formatDateKey(date: Date): string {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

/**
 * Returns today's date formatted as 'YYYY-MM-DD'.
 */
export function getTodayDateKey(): string {
  return formatDateKey(new Date());
}

/**
 * Safely parses a 'YYYY-MM-DD' string into a local Date object.
 */
export function parseDateKey(dateStr: string): Date {
  const [year, month, day] = dateStr.split('-').map(Number);
  return new Date(year, (month || 1) - 1, day || 1);
}

/**
 * Calculates calendar week (KW / Kalenderwoche) according to ISO-8601 (Monday as first day of week).
 */
export function getCalendarWeek(date: Date): number {
  const target = new Date(date.getFullYear(), date.getMonth(), date.getDate());
  const dayNr = (target.getDay() + 6) % 7;
  target.setDate(target.getDate() - dayNr + 3);
  const firstThursday = target.valueOf();
  target.setMonth(0, 1);
  if (target.getDay() !== 4) {
    target.setMonth(0, 1 + ((4 - target.getDay() + 7) % 7));
  }
  return 1 + Math.ceil((firstThursday - target.valueOf()) / 604800000);
}

/**
 * Generates the 7 days for the week view (Monday to Sunday) for any given reference date.
 */
export function getWeekDays(referenceDate: Date, todayDateKey: string = getTodayDateKey()): WeekDayInfo[] {
  const curr = new Date(referenceDate.getFullYear(), referenceDate.getMonth(), referenceDate.getDate());
  const dayOfWeek = curr.getDay();
  const distanceToMonday = (dayOfWeek + 6) % 7; // Monday = 0, Sunday = 6
  
  const monday = new Date(curr);
  monday.setDate(curr.getDate() - distanceToMonday);

  const labels = ['Mo', 'Di', 'Mi', 'Do', 'Fr', 'Sa', 'So'];
  const week: WeekDayInfo[] = [];

  for (let i = 0; i < 7; i++) {
    const dayDate = new Date(monday.getFullYear(), monday.getMonth(), monday.getDate() + i);
    const dateString = formatDateKey(dayDate);
    week.push({
      dateString,
      dateObj: dayDate,
      isToday: dateString === todayDateKey,
      dayLabel: labels[i],
      dayNum: dayDate.getDate(),
    });
  }

  return week;
}

/**
 * Generates the 42 cells (6 weeks grid) for a full month calendar view.
 */
export function getMonthCalendarDays(year: number, month: number, todayDateKey: string = getTodayDateKey()): MonthDayInfo[] {
  const firstDayOfMonth = new Date(year, month, 1);
  const lastDayOfMonth = new Date(year, month + 1, 0);

  let startingDayOfWeek = firstDayOfMonth.getDay() - 1;
  if (startingDayOfWeek === -1) startingDayOfWeek = 6;

  const daysInMonth = lastDayOfMonth.getDate();
  const daysInPrevMonth = new Date(year, month, 0).getDate();

  const days: MonthDayInfo[] = [];

  // Previous month trailing days
  for (let i = startingDayOfWeek - 1; i >= 0; i--) {
    const prevDate = new Date(year, month - 1, daysInPrevMonth - i);
    const dateString = formatDateKey(prevDate);
    days.push({
      dateString,
      dayNumber: prevDate.getDate(),
      isCurrentMonth: false,
      isToday: dateString === todayDateKey,
    });
  }

  // Current month days
  for (let d = 1; d <= daysInMonth; d++) {
    const curDate = new Date(year, month, d);
    const dateString = formatDateKey(curDate);
    days.push({
      dateString,
      dayNumber: d,
      isCurrentMonth: true,
      isToday: dateString === todayDateKey,
    });
  }

  // Next month leading days (fill up to 42 cells total for uniform grid)
  const remainingDays = 42 - days.length;
  for (let d = 1; d <= remainingDays; d++) {
    const nextDate = new Date(year, month + 1, d);
    const dateString = formatDateKey(nextDate);
    days.push({
      dateString,
      dayNumber: d,
      isCurrentMonth: false,
      isToday: dateString === todayDateKey,
    });
  }

  return days;
}

/**
 * Checks if a given event (which may be single or recurring) should appear on targetDateKey (YYYY-MM-DD).
 */
export function isEventOnDate(
  eventDateKey: string,
  recurrence: 'none' | 'daily' | 'weekly' | 'monthly' | undefined,
  targetDateKey: string
): boolean {
  if (!eventDateKey || !targetDateKey) return false;

  // Single non-recurring event: exact match
  if (!recurrence || recurrence === 'none') {
    return eventDateKey === targetDateKey;
  }

  // Recurring events do not appear before their initial scheduled start date
  if (targetDateKey < eventDateKey) {
    return false;
  }

  if (recurrence === 'daily') {
    return true;
  }

  if (recurrence === 'weekly') {
    const eventDate = parseDateKey(eventDateKey);
    const targetDate = parseDateKey(targetDateKey);
    return eventDate.getDay() === targetDate.getDay();
  }

  if (recurrence === 'monthly') {
    const eventDate = parseDateKey(eventDateKey);
    const targetDate = parseDateKey(targetDateKey);
    return eventDate.getDate() === targetDate.getDate();
  }

  return false;
}

/**
 * Checks if two Date objects represent the exact same calendar day.
 */
export function isSameDay(d1: Date, d2: Date): boolean {
  return (
    d1.getFullYear() === d2.getFullYear() &&
    d1.getMonth() === d2.getMonth() &&
    d1.getDate() === d2.getDate()
  );
}
