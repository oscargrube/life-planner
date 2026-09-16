import React, { useState, useEffect, useRef, useMemo } from 'react';
import {
  ChevronLeft,
  ChevronRight,
  Calendar as CalendarIcon,
  Repeat,
  Clock,
  CheckSquare,
  GripVertical,
  Plus,
} from 'lucide-react';
import { useApp } from '../context/AppContext';
import { CalendarEvent, Task, CATEGORIES_CONFIG } from '../types';

type CalendarViewMode = 'day' | 'week' | 'month';

const HOUR_HEIGHT = 64; // pixels per hour
const HOURS = Array.from({ length: 24 }, (_, i) => i);

export const CalendarView: React.FC = () => {
  const {
    events,
    tasks,
    selectedCategory,
    openEventModal,
    moveEventDate,
    convertTaskToEvent,
  } = useApp();

  // Default to week view
  const [currentDate, setCurrentDate] = useState(new Date());
  const [viewMode, setViewMode] = useState<CalendarViewMode>('week');
  const [showTaskSidebar, setShowTaskSidebar] = useState(true);

  // Live current time state (updates every 30s)
  const [now, setNow] = useState(new Date());

  // Drag and drop state
  const [draggedItem, setDraggedItem] = useState<{
    type: 'event' | 'task';
    id: string;
    data?: any;
  } | null>(null);
  const [dragOverDay, setDragOverDay] = useState<string | null>(null);
  const [dragOverHour, setDragOverHour] = useState<number | null>(null);

  const timelineScrollRef = useRef<HTMLDivElement>(null);
  const dayTimelineScrollRef = useRef<HTMLDivElement>(null);

  // Update current time periodically
  useEffect(() => {
    const timer = setInterval(() => {
      setNow(new Date());
    }, 30000);
    return () => clearInterval(timer);
  }, []);

  // Filter events by selectedCategory
  const filteredEvents = useMemo(() => {
    return events.filter((e) => {
      if (selectedCategory === 'all') return true;
      return e.category === selectedCategory;
    });
  }, [events, selectedCategory]);

  // Filter unscheduled tasks
  const unscheduledTasks = useMemo(() => {
    return tasks.filter((t) => !t.completed);
  }, [tasks]);

  // Current time position calculation
  const currentMinutes = now.getHours() * 60 + now.getMinutes();
  const currentTimeTop = (currentMinutes / 60) * HOUR_HEIGHT;
  const currentTimeStr = now.toLocaleTimeString('de-DE', {
    hour: '2-digit',
    minute: '2-digit',
  });
  const todayStr = now.toISOString().split('T')[0];

  // Scroll to current time or morning on view mode switch or initial load
  useEffect(() => {
    const targetScroll = Math.max(0, currentTimeTop - 140);
    if (viewMode === 'week' && timelineScrollRef.current) {
      timelineScrollRef.current.scrollTo({
        top: targetScroll,
        behavior: 'smooth',
      });
    } else if (viewMode === 'day' && dayTimelineScrollRef.current) {
      dayTimelineScrollRef.current.scrollTo({
        top: targetScroll,
        behavior: 'smooth',
      });
    }
  }, [viewMode]);

  const navigateDate = (direction: 'prev' | 'next') => {
    const delta = direction === 'next' ? 1 : -1;
    const newD = new Date(currentDate);
    if (viewMode === 'month') {
      newD.setMonth(newD.getMonth() + delta);
    } else if (viewMode === 'week') {
      newD.setDate(newD.getDate() + delta * 7);
    } else {
      newD.setDate(newD.getDate() + delta);
    }
    setCurrentDate(newD);
  };

  // Week view calculations (European: Monday to Sunday)
  const weekDays = useMemo(() => {
    const curr = new Date(currentDate);
    const dayOfWeek = curr.getDay();
    const distanceToMonday = (dayOfWeek + 6) % 7; // Monday is 0, Sunday is 6
    const monday = new Date(curr);
    monday.setDate(curr.getDate() - distanceToMonday);

    const week: {
      dateString: string;
      dateObj: Date;
      isToday: boolean;
      dayLabel: string;
      dayNum: number;
    }[] = [];

    const labels = ['Mo', 'Di', 'Mi', 'Do', 'Fr', 'Sa', 'So'];

    for (let i = 0; i < 7; i++) {
      const d = new Date(monday);
      d.setDate(monday.getDate() + i);
      const str = d.toISOString().split('T')[0];
      week.push({
        dateString: str,
        dateObj: d,
        isToday: str === todayStr,
        dayLabel: labels[i],
        dayNum: d.getDate(),
      });
    }
    return week;
  }, [currentDate, todayStr]);

  // Calendar week (KW) calculation
  const getCalendarWeek = (date: Date): number => {
    const target = new Date(date.valueOf());
    const dayNr = (date.getDay() + 6) % 7;
    target.setDate(target.getDate() - dayNr + 3);
    const firstThursday = target.valueOf();
    target.setMonth(0, 1);
    if (target.getDay() !== 4) {
      target.setMonth(0, 1 + ((4 - target.getDay() + 7) % 7));
    }
    return 1 + Math.ceil((firstThursday - target.valueOf()) / 604800000);
  };

  // Month view calculations
  const year = currentDate.getFullYear();
  const month = currentDate.getMonth();

  const calendarDays = useMemo(() => {
    const firstDayOfMonth = new Date(year, month, 1);
    const lastDayOfMonth = new Date(year, month + 1, 0);

    let startingDayOfWeek = firstDayOfMonth.getDay() - 1;
    if (startingDayOfWeek === -1) startingDayOfWeek = 6;

    const daysInMonth = lastDayOfMonth.getDate();
    const daysInPrevMonth = new Date(year, month, 0).getDate();

    const days: {
      dateString: string;
      dayNumber: number;
      isCurrentMonth: boolean;
      isToday: boolean;
    }[] = [];

    for (let i = startingDayOfWeek - 1; i >= 0; i--) {
      const d = daysInPrevMonth - i;
      const prevMonthDate = new Date(year, month - 1, d);
      const dateStr = prevMonthDate.toISOString().split('T')[0];
      days.push({
        dateString: dateStr,
        dayNumber: d,
        isCurrentMonth: false,
        isToday: false,
      });
    }

    for (let d = 1; d <= daysInMonth; d++) {
      const curDate = new Date(year, month, d);
      const dateStr = curDate.toISOString().split('T')[0];
      days.push({
        dateString: dateStr,
        dayNumber: d,
        isCurrentMonth: true,
        isToday: dateStr === todayStr,
      });
    }

    const remainingDays = 42 - days.length;
    for (let d = 1; d <= remainingDays; d++) {
      const nextMonthDate = new Date(year, month + 1, d);
      const dateStr = nextMonthDate.toISOString().split('T')[0];
      days.push({
        dateString: dateStr,
        dayNumber: d,
        isCurrentMonth: false,
        isToday: false,
      });
    }

    return days;
  }, [year, month, todayStr]);

  // Overlapping event layout algorithm for week and day views
  const getEventLayout = (dayEvents: CalendarEvent[]) => {
    const parsed = dayEvents
      .map((e) => {
        const [h, m] = (e.time || '00:00').split(':').map(Number);
        const startMin = (h || 0) * 60 + (m || 0);
        const durationMin = Math.max(20, e.durationMinutes || 60);
        const endMin = startMin + durationMin;
        return { event: e, startMin, endMin, durationMin };
      })
      .sort((a, b) => a.startMin - b.startMin || b.durationMin - a.durationMin);

    const clusters: typeof parsed[] = [];
    let currentCluster: typeof parsed = [];
    let clusterEnd = -1;

    for (const item of parsed) {
      if (currentCluster.length === 0) {
        currentCluster.push(item);
        clusterEnd = item.endMin;
      } else if (item.startMin < clusterEnd) {
        currentCluster.push(item);
        clusterEnd = Math.max(clusterEnd, item.endMin);
      } else {
        clusters.push(currentCluster);
        currentCluster = [item];
        clusterEnd = item.endMin;
      }
    }
    if (currentCluster.length > 0) {
      clusters.push(currentCluster);
    }

    const layoutList: {
      event: CalendarEvent;
      top: number;
      height: number;
      leftPercent: number;
      widthPercent: number;
    }[] = [];

    for (const cluster of clusters) {
      const columns: typeof parsed[] = [];
      const itemCols: { id: string; col: number }[] = [];

      for (const item of cluster) {
        let placed = false;
        for (let c = 0; c < columns.length; c++) {
          const lastInCol = columns[c][columns[c].length - 1];
          if (lastInCol.endMin <= item.startMin) {
            columns[c].push(item);
            itemCols.push({ id: item.event.id, col: c });
            placed = true;
            break;
          }
        }
        if (!placed) {
          columns.push([item]);
          itemCols.push({ id: item.event.id, col: columns.length - 1 });
        }
      }

      const totalCols = Math.max(1, columns.length);
      for (const item of cluster) {
        const colAssignment = itemCols.find((x) => x.id === item.event.id)?.col || 0;
        const top = (item.startMin / 60) * HOUR_HEIGHT;
        const height = Math.max(26, (item.durationMin / 60) * HOUR_HEIGHT - 2);
        const widthPercent = 100 / totalCols;
        const leftPercent = colAssignment * widthPercent;

        layoutList.push({
          event: item.event,
          top,
          height,
          leftPercent,
          widthPercent,
        });
      }
    }

    return layoutList;
  };

  // Pre-calculate week event layouts to prevent re-calculations during drag moves
  const weekEventLayouts = useMemo(() => {
    const map = new Map<string, ReturnType<typeof getEventLayout>>();
    for (const wd of weekDays) {
      const dayEvts = filteredEvents.filter((e) => e.date === wd.dateString);
      map.set(wd.dateString, getEventLayout(dayEvts));
    }
    return map;
  }, [filteredEvents, weekDays]);

  // Pre-calculate day view event layouts
  const dayViewDateString = currentDate.toISOString().split('T')[0];
  const dayEventLayouts = useMemo(() => {
    const dayEvts = filteredEvents.filter((e) => e.date === dayViewDateString);
    return getEventLayout(dayEvts);
  }, [filteredEvents, dayViewDateString]);

  // Drag and drop handlers
  const handleDragStartEvent = (e: React.DragEvent, eventItem: CalendarEvent) => {
    setDraggedItem({ type: 'event', id: eventItem.id, data: eventItem });
    e.dataTransfer.setData('text/plain', JSON.stringify({ type: 'event', id: eventItem.id }));
    e.dataTransfer.effectAllowed = 'move';
  };

  const handleDragStartTask = (e: React.DragEvent, taskItem: Task) => {
    setDraggedItem({ type: 'task', id: taskItem.id, data: taskItem });
    e.dataTransfer.setData('text/plain', JSON.stringify({ type: 'task', id: taskItem.id }));
    e.dataTransfer.effectAllowed = 'copyMove';
  };

  const handleDragEnd = () => {
    setDraggedItem(null);
    setDragOverDay(null);
    setDragOverHour(null);
  };

  const handleDragOver = (e: React.DragEvent, dateString: string, hour?: number) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = 'move';

    if (dragOverDay !== dateString) {
      setDragOverDay(dateString);
    }
    if (hour !== undefined && dragOverHour !== hour) {
      setDragOverHour(hour);
    }
  };

  const handleDragLeave = (e: React.DragEvent) => {
    if (!e.currentTarget.contains(e.relatedTarget as Node)) {
      setDragOverDay(null);
      setDragOverHour(null);
    }
  };

  const handleDrop = async (e: React.DragEvent, targetDate: string, hour?: number) => {
    e.preventDefault();
    setDragOverDay(null);
    setDragOverHour(null);

    if (!draggedItem) return;

    const formattedTime = hour !== undefined ? `${String(hour).padStart(2, '0')}:00` : '10:00';

    if (draggedItem.type === 'event') {
      await moveEventDate(draggedItem.id, targetDate, formattedTime);
    } else if (draggedItem.type === 'task') {
      const task = draggedItem.data as Task;
      await convertTaskToEvent(task, targetDate, formattedTime);
    }

    setDraggedItem(null);
  };

  const monthNames = [
    'Januar', 'Februar', 'März', 'April', 'Mai', 'Juni',
    'Juli', 'August', 'September', 'Oktober', 'November', 'Dezember'
  ];

  const weekdayLabels = ['Mo', 'Di', 'Mi', 'Do', 'Fr', 'Sa', 'So'];

  const currentKW = getCalendarWeek(currentDate);
  const weekStart = weekDays[0]?.dateObj;
  const weekEnd = weekDays[6]?.dateObj;

  const getHeaderTitle = () => {
    if (viewMode === 'day') {
      return currentDate.toLocaleDateString('de-DE', {
        weekday: 'long',
        day: 'numeric',
        month: 'long',
        year: 'numeric',
      });
    }
    if (viewMode === 'week' && weekStart && weekEnd) {
      const startMonth = monthNames[weekStart.getMonth()];
      const endMonth = monthNames[weekEnd.getMonth()];
      return `KW ${currentKW} · ${weekStart.getDate()}. ${
        startMonth !== endMonth ? startMonth + ' ' : ''
      }– ${weekEnd.getDate()}. ${endMonth} ${weekEnd.getFullYear()}`;
    }
    return `${monthNames[currentDate.getMonth()]} ${currentDate.getFullYear()}`;
  };

  const getPrevNextTooltip = (dir: 'prev' | 'next') => {
    const dirWord = dir === 'prev' ? 'Vorheriger' : 'Nächster';
    const dirWordFem = dir === 'prev' ? 'Vorherige' : 'Nächste';
    if (viewMode === 'day') return `${dirWord} Tag`;
    if (viewMode === 'week') return `${dirWordFem} Woche`;
    return `${dirWord} Monat`;
  };

  return (
    <div className="flex-1 flex flex-col h-screen overflow-hidden bg-[#f8faf8] text-[#171c19]">
      {/* Top Calendar Toolbar - Clean & Responsive */}
      <header className="px-4 sm:px-6 py-3 bg-white border-b border-[#e2e8e3] flex flex-wrap items-center justify-between gap-3 shrink-0 shadow-xs">
        {/* Left: Navigation and Date Title */}
        <div className="flex flex-wrap items-center gap-3">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-xl bg-[#edf5f0] border border-[#cfe0d5] text-[#174e36] flex items-center justify-center shadow-xs">
              <CalendarIcon className="w-4.5 h-4.5 text-[#174e36]" />
            </div>
            <div className="flex items-center gap-2">
              <h2 className="text-base sm:text-lg font-bold text-[#171c19] tracking-tight leading-tight">
                {getHeaderTitle()}
              </h2>
              {/* Native mini date jump picker */}
              <label
                title="Zu einem bestimmten Datum springen"
                className="cursor-pointer text-[#6b7d72] hover:text-[#174e36] transition-colors p-1 rounded-lg hover:bg-[#edf5f0]"
              >
                <CalendarIcon className="w-4 h-4" />
                <input
                  type="date"
                  value={currentDate.toISOString().split('T')[0]}
                  onChange={(e) => {
                    if (e.target.value) {
                      const [y, m, d] = e.target.value.split('-').map(Number);
                      setCurrentDate(new Date(y, m - 1, d));
                    }
                  }}
                  className="sr-only"
                />
              </label>
            </div>
          </div>

          {/* Navigation Controls: Previous / Next (Heute button removed as requested) */}
          <div className="flex items-center bg-[#f4f7f5] border border-[#d8e2db] rounded-xl p-1 gap-0.5 shadow-xs">
            <button
              onClick={() => navigateDate('prev')}
              className="p-1.5 hover:bg-white rounded-lg text-[#52645a] hover:text-[#171c19] transition-all cursor-pointer hover:shadow-xs active:scale-95"
              title={getPrevNextTooltip('prev')}
              aria-label={getPrevNextTooltip('prev')}
            >
              <ChevronLeft className="w-4 h-4" />
            </button>

            <button
              onClick={() => navigateDate('next')}
              className="p-1.5 hover:bg-white rounded-lg text-[#52645a] hover:text-[#171c19] transition-all cursor-pointer hover:shadow-xs active:scale-95"
              title={getPrevNextTooltip('next')}
              aria-label={getPrevNextTooltip('next')}
            >
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Center/Flexible: View Mode Switcher */}
        <div className="flex items-center bg-[#f4f7f5] border border-[#d8e2db] rounded-xl p-1 shadow-xs">
          <button
            id="calendar-view-mode-day"
            onClick={() => setViewMode('day')}
            className={`px-3.5 py-1.5 rounded-lg text-xs font-semibold transition-all cursor-pointer ${
              viewMode === 'day'
                ? 'bg-[#174e36] text-white shadow-xs font-semibold'
                : 'text-[#4c5c53] hover:text-[#171c19]'
            }`}
          >
            Tag
          </button>
          <button
            id="calendar-view-mode-week"
            onClick={() => setViewMode('week')}
            className={`px-3.5 py-1.5 rounded-lg text-xs font-semibold transition-all cursor-pointer ${
              viewMode === 'week'
                ? 'bg-[#174e36] text-white shadow-xs font-semibold'
                : 'text-[#4c5c53] hover:text-[#171c19]'
            }`}
          >
            Woche
          </button>
          <button
            id="calendar-view-mode-month"
            onClick={() => setViewMode('month')}
            className={`px-3.5 py-1.5 rounded-lg text-xs font-semibold transition-all cursor-pointer ${
              viewMode === 'month'
                ? 'bg-[#174e36] text-white shadow-xs font-semibold'
                : 'text-[#4c5c53] hover:text-[#171c19]'
            }`}
          >
            Monat
          </button>
        </div>

        {/* Right side: New Event Button + Toggle Tasks Sidebar */}
        <div className="flex items-center gap-2">
          <button
            id="btn-new-calendar-event"
            onClick={() => {
              const defaultDate =
                viewMode === 'day'
                  ? currentDate.toISOString().split('T')[0]
                  : todayStr;
              openEventModal(undefined, defaultDate, '10:00');
            }}
            className="flex items-center gap-1.5 px-3.5 py-2 bg-[#174e36] hover:bg-[#12402c] active:scale-[0.98] text-white rounded-xl text-xs font-semibold shadow-xs hover:shadow-md transition-all cursor-pointer"
            title="Neuen Kalendereintrag eintragen"
          >
            <Plus className="w-4 h-4 stroke-[2.5]" />
            <span>Termin eintragen</span>
          </button>

          <button
            onClick={() => setShowTaskSidebar(!showTaskSidebar)}
            className={`flex items-center gap-1.5 px-3 py-2 border rounded-xl text-xs font-semibold transition-colors shadow-xs cursor-pointer ${
              showTaskSidebar
                ? 'bg-[#edf5f0] text-[#143d2b] border-[#cfe0d5]'
                : 'bg-white text-[#52645a] border-[#d8e2db] hover:bg-[#f4f7f5] hover:text-[#171c19]'
            }`}
            title="Aufgabenleiste ein-/ausblenden"
          >
            <CheckSquare className="w-3.5 h-3.5 text-[#174e36]" />
            <span>Aufgaben</span>
          </button>
        </div>
      </header>

      {/* Main Calendar Body */}
      <div className="flex-1 flex overflow-hidden">
        {/* Calendar Area */}
        <div className="flex-1 flex flex-col overflow-hidden p-3 sm:p-4">
          {/* ===================== TAG (DAY) VIEW ===================== */}
          {viewMode === 'day' && (
            <div className="bg-white rounded-2xl border border-[#e2e8e3] shadow-xs flex-1 flex flex-col overflow-hidden">
              {/* Day Header */}
              <div className="px-6 py-3 border-b border-[#e2e8e3] bg-[#fafcfa] flex items-center justify-between shrink-0">
                <div className="flex items-center gap-3">
                  <div className="w-9 h-9 flex items-center justify-center rounded-xl bg-[#174e36] text-white font-extrabold text-base shadow-xs">
                    {currentDate.getDate()}
                  </div>
                  <div>
                    <h3 className="text-base font-bold text-[#171c19]">
                      {currentDate.toLocaleDateString('de-DE', {
                        weekday: 'long',
                        day: 'numeric',
                        month: 'long',
                        year: 'numeric',
                      })}
                    </h3>
                  </div>
                </div>

                <button
                  onClick={() => openEventModal(undefined, dayViewDateString, '10:00')}
                  className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-[#174e36] bg-[#edf5f0] hover:bg-[#dbeee1] border border-[#cfe0d5] rounded-xl transition-all cursor-pointer shadow-xs"
                >
                  <Plus className="w-3.5 h-3.5" />
                  <span>Termin eintragen</span>
                </button>
              </div>

              {/* Day Hourly Grid */}
              <div
                ref={dayTimelineScrollRef}
                className="flex-1 overflow-y-auto overflow-x-hidden relative bg-white"
              >
                <div
                  className="grid grid-cols-[72px_1fr] divide-x divide-[#e8eee9] relative"
                  style={{ height: `${24 * HOUR_HEIGHT}px` }}
                >
                  {/* Left Column: Hourly Time Labels (Larger & Non-Technical) */}
                  <div className="bg-[#fafcfa] select-none relative divide-y divide-[#e8eee9]">
                    {HOURS.map((hour) => (
                      <div
                        key={hour}
                        className="relative border-b border-[#e8eee9] flex items-start justify-end pr-2.5 pt-1"
                        style={{ height: `${HOUR_HEIGHT}px` }}
                      >
                        <span className="text-xs font-bold text-[#52645a]">
                          {String(hour).padStart(2, '0')}:00
                        </span>
                      </div>
                    ))}

                    {/* Current time badge */}
                    {dayViewDateString === todayStr && (
                      <div
                        className="absolute right-1 z-30 transform -translate-y-1/2 flex items-center gap-1 bg-[#174e36] border border-[#143d2b] text-white px-2 py-0.5 rounded-full text-xs font-bold shadow-xs"
                        style={{ top: `${currentTimeTop}px` }}
                      >
                        <span className="w-1.5 h-1.5 rounded-full bg-emerald-300 animate-ping" />
                        <span>{currentTimeStr}</span>
                      </div>
                    )}
                  </div>

                  {/* Day Column */}
                  <div
                    onDragOver={(e) => handleDragOver(e, dayViewDateString)}
                    onDragLeave={handleDragLeave}
                    onDrop={(e) => handleDrop(e, dayViewDateString)}
                    className="relative transition-colors bg-white"
                  >
                    {HOURS.map((hour) => {
                      const hourStr = `${String(hour).padStart(2, '0')}:00`;
                      const isHovered =
                        dragOverDay === dayViewDateString && dragOverHour === hour;

                      return (
                        <div
                          key={hour}
                          onClick={() => {
                            openEventModal(undefined, dayViewDateString, hourStr);
                          }}
                          onDragOver={(e) => {
                            e.stopPropagation();
                            handleDragOver(e, dayViewDateString, hour);
                          }}
                          onDrop={(e) => {
                            e.stopPropagation();
                            handleDrop(e, dayViewDateString, hour);
                          }}
                          className={`border-b border-[#edf2ee] relative transition-colors cursor-pointer group/slot ${
                            isHovered
                              ? 'bg-[#edf5f0]'
                              : 'hover:bg-[#f6faf7]/80'
                          }`}
                          style={{ height: `${HOUR_HEIGHT}px` }}
                          title={`Klicken, um Termin um ${hourStr} Uhr zu erstellen`}
                        >
                          <div className="absolute top-1/2 left-0 right-0 border-b border-[#f1f5f2] border-dashed pointer-events-none" />
                          <div className="absolute left-3 top-2 opacity-0 group-hover/slot:opacity-80 transition-opacity pointer-events-none flex items-center gap-1.5 text-xs text-[#174e36] font-semibold">
                            <Plus className="w-3.5 h-3.5" />
                            <span>{hourStr} eintragen</span>
                          </div>
                        </div>
                      );
                    })}

                    {/* Drag Over Indicator Box */}
                    {dragOverDay === dayViewDateString && dragOverHour !== null && (
                      <div
                        className="absolute left-2 right-2 rounded-xl border-2 border-dashed border-[#174e36] bg-[#174e36]/10 z-20 pointer-events-none flex items-center gap-2 px-3 text-xs font-semibold text-[#174e36] transition-all duration-75 shadow-xs"
                        style={{
                          top: `${dragOverHour * HOUR_HEIGHT + 2}px`,
                          height: `${HOUR_HEIGHT - 4}px`,
                        }}
                      >
                        <Clock className="w-3.5 h-3.5 shrink-0 text-[#174e36]" />
                        <span className="truncate">
                          {String(dragOverHour).padStart(2, '0')}:00 –{' '}
                          {draggedItem?.data?.title || 'Hier ablegen'}
                        </span>
                      </div>
                    )}

                    {/* Current Time Indicator Line */}
                    {dayViewDateString === todayStr && (
                      <div
                        className="absolute left-0 right-0 z-20 pointer-events-none flex items-center"
                        style={{ top: `${currentTimeTop}px` }}
                      >
                        <div className="w-3.5 h-3.5 -ml-1.5 rounded-full bg-[#174e36] ring-4 ring-[#174e36]/20 shadow-xs animate-pulse" />
                        <div className="h-[2px] w-full bg-[#174e36] shadow-xs" />
                      </div>
                    )}

                    {/* Positioned Events */}
                    {dayEventLayouts.map(
                      ({ event: evt, top, height, leftPercent, widthPercent }) => {
                        const conf =
                          CATEGORIES_CONFIG[evt.category] || CATEGORIES_CONFIG['Arbeit'];

                        return (
                          <div
                            key={evt.id}
                            draggable
                            onDragStart={(e) => handleDragStartEvent(e, evt)}
                            onDragEnd={handleDragEnd}
                            onClick={(e) => {
                              e.stopPropagation();
                              openEventModal(evt);
                            }}
                            style={{
                              top: `${top}px`,
                              height: `${height}px`,
                              left: `${leftPercent}%`,
                              width: `calc(${widthPercent}% - 6px)`,
                            }}
                            className={`absolute z-10 m-1 p-2 rounded-xl border shadow-xs hover:shadow-md cursor-grab active:cursor-grabbing transition-all hover:scale-[1.005] overflow-hidden flex flex-col justify-between ${conf.bgLight}`}
                            title="Klicken zum Bearbeiten, ziehen zum Verschieben"
                          >
                            <div className="min-w-0">
                              <div className="flex items-center justify-between gap-1">
                                <span className="text-xs font-bold text-[#174e36] opacity-90 shrink-0">
                                  {evt.time} ({evt.durationMinutes || 60} Min)
                                </span>
                                {evt.recurrence !== 'none' && (
                                  <Repeat className="w-3 h-3 opacity-75 shrink-0" />
                                )}
                              </div>
                              <h4 className="text-xs font-bold leading-snug truncate mt-0.5 text-[#171c19]">
                                {evt.title}
                              </h4>
                            </div>

                            {height >= 48 && evt.description && (
                              <p className="text-[11px] opacity-75 truncate mt-0.5">
                                {evt.description}
                              </p>
                            )}
                          </div>
                        );
                      }
                    )}
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* ===================== WOCHE (WEEK) VIEW ===================== */}
          {viewMode === 'week' && (
            <div className="bg-white rounded-2xl border border-[#e2e8e3] shadow-xs flex-1 flex flex-col overflow-hidden">
              {/* Sticky Top Header with 7 Week Days - Larger Dates, No Term Count, No Heute Tag */}
              <div className="grid grid-cols-[72px_repeat(7,1fr)] border-b border-[#e2e8e3] bg-[#fafcfa] shrink-0 divide-x divide-[#e2e8e3]">
                {/* Top-left corner */}
                <div className="py-3 px-2 flex flex-col items-center justify-center text-center">
                  <Clock className="w-4 h-4 text-[#6b7d72]" />
                  <span className="text-xs font-bold text-[#6b7d72] uppercase tracking-wider mt-0.5">
                    Zeit
                  </span>
                </div>

                {/* 7 Days Headers */}
                {weekDays.map((wd, i) => {
                  return (
                    <div
                      key={wd.dateString}
                      onClick={() => {
                        openEventModal(undefined, wd.dateString, '10:00');
                      }}
                      className={`py-2.5 px-2 flex flex-col items-center justify-center transition-colors cursor-pointer group/header ${
                        wd.isToday ? 'bg-[#edf5f0]/60' : 'hover:bg-[#f4f7f5]/80'
                      }`}
                      title={`Klicken, um Termin für ${wd.dayLabel}, ${wd.dateString} einzutragen`}
                    >
                      <span
                        className={`text-xs font-bold uppercase tracking-wider ${
                          wd.isToday
                            ? 'text-[#174e36]'
                            : i >= 5
                            ? 'text-[#64748b]'
                            : 'text-[#475569]'
                        }`}
                      >
                        {wd.dayLabel}
                      </span>

                      <div className="flex items-center gap-1 mt-1">
                        <span
                          className={`w-8 h-8 flex items-center justify-center rounded-xl text-base font-extrabold transition-transform ${
                            wd.isToday
                              ? 'bg-[#174e36] text-white shadow-xs scale-105'
                              : 'text-[#171c19] group-hover/header:text-[#174e36]'
                          }`}
                        >
                          {wd.dayNum}
                        </span>
                      </div>
                    </div>
                  );
                })}
              </div>

              {/* Scrollable Timeline Grid */}
              <div
                ref={timelineScrollRef}
                className="flex-1 overflow-y-auto overflow-x-hidden relative bg-white"
              >
                <div
                  className="grid grid-cols-[72px_repeat(7,1fr)] divide-x divide-[#e8eee9] relative"
                  style={{ height: `${24 * HOUR_HEIGHT}px` }}
                >
                  {/* Left Column: Hourly Time Labels (Larger & Non-Technical) */}
                  <div className="bg-[#fafcfa] select-none relative divide-y divide-[#e8eee9]">
                    {HOURS.map((hour) => (
                      <div
                        key={hour}
                        className="relative border-b border-[#e8eee9] flex items-start justify-end pr-2.5 pt-1"
                        style={{ height: `${HOUR_HEIGHT}px` }}
                      >
                        <span className="text-xs font-bold text-[#52645a]">
                          {String(hour).padStart(2, '0')}:00
                        </span>
                      </div>
                    ))}

                    {/* Left time badge for current time */}
                    <div
                      className="absolute right-1 z-30 transform -translate-y-1/2 flex items-center gap-1 bg-[#174e36] border border-[#143d2b] text-white px-1.5 py-0.5 rounded-full text-xs font-bold shadow-xs"
                      style={{ top: `${currentTimeTop}px` }}
                    >
                      <span className="w-1.5 h-1.5 rounded-full bg-emerald-300 animate-ping" />
                      <span>{currentTimeStr}</span>
                    </div>
                  </div>

                  {/* 7 Days Columns */}
                  {weekDays.map((wd) => {
                    const isOverDay = dragOverDay === wd.dateString;
                    const eventLayouts = weekEventLayouts.get(wd.dateString) || [];

                    return (
                      <div
                        key={wd.dateString}
                        onDragOver={(e) => handleDragOver(e, wd.dateString)}
                        onDragLeave={handleDragLeave}
                        onDrop={(e) => handleDrop(e, wd.dateString)}
                        className={`relative transition-colors ${
                          wd.isToday ? 'bg-[#f4f8f5]/40' : 'bg-white'
                        } ${isOverDay ? 'bg-[#edf5f0]/30' : ''}`}
                      >
                        {HOURS.map((hour) => {
                          const hourStr = `${String(hour).padStart(2, '0')}:00`;
                          const isHourHovered =
                            dragOverDay === wd.dateString && dragOverHour === hour;

                          return (
                            <div
                              key={hour}
                              onClick={() => {
                                openEventModal(undefined, wd.dateString, hourStr);
                              }}
                              onDragOver={(e) => {
                                e.stopPropagation();
                                handleDragOver(e, wd.dateString, hour);
                              }}
                              onDrop={(e) => {
                                e.stopPropagation();
                                handleDrop(e, wd.dateString, hour);
                              }}
                              className={`border-b border-[#edf2ee] relative transition-colors cursor-pointer group/slot ${
                                isHourHovered
                                  ? 'bg-[#edf5f0]'
                                  : 'hover:bg-[#f6faf7]/80'
                              }`}
                              style={{ height: `${HOUR_HEIGHT}px` }}
                              title={`Klicken, um Termin für ${wd.dayLabel}, ${hourStr} Uhr einzutragen`}
                            >
                              <div className="absolute top-1/2 left-0 right-0 border-b border-[#f1f5f2] border-dashed pointer-events-none" />
                              <div className="absolute left-1.5 top-1 opacity-0 group-hover/slot:opacity-75 transition-opacity pointer-events-none flex items-center gap-1 text-[10px] text-[#174e36] font-semibold">
                                <Plus className="w-2.5 h-2.5" />
                                <span>{hourStr}</span>
                              </div>
                            </div>
                          );
                        })}

                        {/* Smooth Drop Indicator Ghost */}
                        {isOverDay && dragOverHour !== null && (
                          <div
                            className="absolute left-1 right-1 rounded-xl border-2 border-dashed border-[#174e36] bg-[#174e36]/10 z-20 pointer-events-none flex items-center gap-1 px-2 text-[10px] font-semibold text-[#174e36] transition-all duration-75 shadow-xs"
                            style={{
                              top: `${dragOverHour * HOUR_HEIGHT + 2}px`,
                              height: `${HOUR_HEIGHT - 4}px`,
                            }}
                          >
                            <Clock className="w-3 h-3 shrink-0 text-[#174e36]" />
                            <span className="truncate">
                              {String(dragOverHour).padStart(2, '0')}:00 –{' '}
                              {draggedItem?.data?.title || 'Hier ablegen'}
                            </span>
                          </div>
                        )}

                        {/* LIVE CURRENT TIME INDICATOR LINE */}
                        {wd.isToday && (
                          <div
                            className="absolute left-0 right-0 z-20 pointer-events-none flex items-center"
                            style={{ top: `${currentTimeTop}px` }}
                          >
                            <div className="w-3.5 h-3.5 -ml-1.5 rounded-full bg-[#174e36] ring-4 ring-[#174e36]/20 shadow-xs animate-pulse" />
                            <div className="h-[2px] w-full bg-[#174e36] shadow-xs" />
                          </div>
                        )}

                        {/* Positioned Events */}
                        {eventLayouts.map(
                          ({ event: evt, top, height, leftPercent, widthPercent }) => {
                            const conf =
                              CATEGORIES_CONFIG[evt.category] || CATEGORIES_CONFIG['Arbeit'];

                            return (
                              <div
                                key={evt.id}
                                draggable
                                onDragStart={(e) => handleDragStartEvent(e, evt)}
                                onDragEnd={handleDragEnd}
                                onClick={(e) => {
                                  e.stopPropagation();
                                  openEventModal(evt);
                                }}
                                style={{
                                  top: `${top}px`,
                                  height: `${height}px`,
                                  left: `${leftPercent}%`,
                                  width: `calc(${widthPercent}% - 4px)`,
                                }}
                                className={`absolute z-10 m-0.5 p-1.5 rounded-xl border shadow-xs hover:shadow-md cursor-grab active:cursor-grabbing transition-all hover:scale-[1.01] overflow-hidden flex flex-col justify-between ${conf.bgLight}`}
                                title="Klicken zum Bearbeiten, ziehen zum Verschieben"
                              >
                                <div className="min-w-0">
                                  <div className="flex items-center justify-between gap-1">
                                    <span className="text-[11px] font-bold text-[#174e36] opacity-90 shrink-0">
                                      {evt.time}
                                    </span>
                                    {evt.recurrence !== 'none' && (
                                      <Repeat className="w-2.5 h-2.5 opacity-70 shrink-0" />
                                    )}
                                  </div>
                                  <h4 className="text-xs font-semibold leading-snug truncate mt-0.5">
                                    {evt.title}
                                  </h4>
                                </div>

                                {height >= 48 && evt.description && (
                                  <p className="text-[10px] opacity-75 truncate mt-0.5">
                                    {evt.description}
                                  </p>
                                )}
                              </div>
                            );
                          }
                        )}
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>
          )}

          {/* ===================== MONAT (MONTH) VIEW ===================== */}
          {viewMode === 'month' && (
            <div className="bg-white rounded-2xl border border-[#e2e8e3] shadow-xs flex-1 flex flex-col overflow-hidden min-h-[620px]">
              {/* Day of Week Headers */}
              <div className="grid grid-cols-7 border-b border-[#e2e8e3] bg-[#fafcfa] text-center py-3 text-xs font-bold text-[#475569] tracking-wider uppercase divide-x divide-[#e2e8e3]">
                {weekdayLabels.map((lbl, idx) => (
                  <div
                    key={idx}
                    className={idx >= 5 ? 'text-[#64748b]' : 'text-[#475569]'}
                  >
                    {lbl}
                  </div>
                ))}
              </div>

              {/* Month Grid Cells */}
              <div className="grid grid-cols-7 flex-1 divide-x divide-y divide-[#e8eee9] overflow-y-auto">
                {calendarDays.map((dayItem, idx) => {
                  const dayEvents = filteredEvents.filter(
                    (e) => e.date === dayItem.dateString
                  );
                  const isOver = dragOverDay === dayItem.dateString;

                  return (
                    <div
                      key={idx}
                      onClick={() => openEventModal(undefined, dayItem.dateString, '10:00')}
                      onDragOver={(e) => handleDragOver(e, dayItem.dateString)}
                      onDragLeave={handleDragLeave}
                      onDrop={(e) => handleDrop(e, dayItem.dateString)}
                      className={`min-h-[105px] p-2 flex flex-col transition-all cursor-pointer group ${
                        !dayItem.isCurrentMonth
                          ? 'bg-[#fafbfa] text-[#94a3b8]'
                          : 'bg-white hover:bg-[#f8faf8]'
                      } ${dayItem.isToday ? 'ring-1 ring-inset ring-[#174e36] bg-[#edf5f0]/50' : ''} ${
                        isOver ? 'bg-[#edf5f0] ring-2 ring-[#174e36] ring-inset' : ''
                      }`}
                      title={`Klicken, um Termin für ${dayItem.dateString} einzutragen`}
                    >
                      {/* Day Number Header */}
                      <div className="flex items-center justify-between mb-1">
                        <span
                          className={`text-xs font-bold w-6 h-6 flex items-center justify-center rounded-xl transition-colors ${
                            dayItem.isToday
                              ? 'bg-[#174e36] text-white shadow-xs'
                              : 'text-[#171c19] group-hover:text-[#174e36]'
                          }`}
                        >
                          {dayItem.dayNumber}
                        </span>

                        <span className="w-5 h-5 rounded-lg flex items-center justify-center text-[#174e36] opacity-0 group-hover:opacity-100 hover:bg-[#edf5f0] transition-opacity">
                          <Plus className="w-3.5 h-3.5" />
                        </span>
                      </div>

                      {/* Event Chips */}
                      <div className="space-y-1 overflow-y-auto flex-1 max-h-[85px]">
                        {dayEvents.map((evt) => {
                          const conf =
                            CATEGORIES_CONFIG[evt.category] || CATEGORIES_CONFIG['Arbeit'];
                          return (
                            <div
                              key={evt.id}
                              draggable
                              onDragStart={(e) => handleDragStartEvent(e, evt)}
                              onDragEnd={handleDragEnd}
                              onClick={(e) => {
                                e.stopPropagation();
                                openEventModal(evt);
                              }}
                              className={`px-2 py-1 rounded-lg text-[11px] font-medium border flex items-center justify-between gap-1 shadow-xs transition-all hover:scale-[0.99] cursor-grab active:cursor-grabbing truncate ${conf.bgLight}`}
                              title="Klicken zum Bearbeiten, ziehen zum Verschieben"
                            >
                              <div className="flex items-center gap-1.5 min-w-0 truncate">
                                <span className="text-[10px] opacity-90 shrink-0 font-bold text-[#174e36]">
                                  {evt.time}
                                </span>
                                <span className="truncate">{evt.title}</span>
                              </div>
                              {evt.recurrence !== 'none' && (
                                <Repeat className="w-2.5 h-2.5 opacity-60 shrink-0" />
                              )}
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}
        </div>

        {/* Right Drawer: Drag & Drop Tasks Sidebar (Narrower & Cleaner) */}
        {showTaskSidebar && (
          <aside
            id="calendar-tasks-drawer"
            className="w-64 bg-white border-l border-[#e2e8e3] flex flex-col shrink-0 shadow-xs"
          >
            <div className="p-3.5 border-b border-[#e2e8e3] flex items-center justify-between bg-white">
              <div className="flex items-center gap-2">
                <div className="w-7 h-7 rounded-lg bg-[#edf5f0] text-[#174e36] flex items-center justify-center border border-[#cfe0d5]">
                  <CheckSquare className="w-3.5 h-3.5 text-[#174e36]" />
                </div>
                <h3 className="text-xs font-bold text-[#171c19]">
                  Aufgaben einplanen
                </h3>
              </div>
              <span className="text-[11px] font-semibold px-2 py-0.5 rounded-full bg-[#f4f7f5] text-[#52645a] border border-[#d8e2db]">
                {unscheduledTasks.length}
              </span>
            </div>

            {/* Task list for dragging into calendar (Smaller cards, no due dates) */}
            <div className="flex-1 overflow-y-auto p-2.5 space-y-2 bg-[#f8faf8]">
              {unscheduledTasks.length === 0 ? (
                <div className="text-center py-10 text-[#6b7d72] text-xs">
                  Keine offenen Aufgaben.
                </div>
              ) : (
                unscheduledTasks.map((task) => {
                  const conf =
                    CATEGORIES_CONFIG[task.category] || CATEGORIES_CONFIG['Arbeit'];
                  const isBeingDragged = draggedItem?.id === task.id;

                  return (
                    <div
                      key={task.id}
                      draggable
                      onDragStart={(e) => handleDragStartTask(e, task)}
                      onDragEnd={handleDragEnd}
                      className={`p-2.5 bg-white hover:bg-[#f6faf7] rounded-xl border border-[#e2e8e3] shadow-xs cursor-grab active:cursor-grabbing hover:border-[#174e36] hover:shadow-md transition-all group select-none ${
                        isBeingDragged ? 'opacity-40 scale-95 ring-2 ring-[#174e36]' : ''
                      }`}
                    >
                      <div className="flex items-center justify-between mb-1">
                        <span
                          className={`text-[9px] font-semibold px-1.5 py-0.5 rounded-full ${conf.badgeClass}`}
                        >
                          {task.category}
                        </span>
                        <GripVertical className="w-3 h-3 text-[#8e9f94] group-hover:text-[#174e36]" />
                      </div>
                      <h4 className="text-xs font-semibold text-[#171c19] leading-snug">
                        {task.title}
                      </h4>
                      {task.description && (
                        <p className="text-[10px] text-[#52645a] line-clamp-2 mt-0.5">
                          {task.description}
                        </p>
                      )}
                    </div>
                  );
                })
              )}
            </div>
          </aside>
        )}
      </div>
    </div>
  );
};
