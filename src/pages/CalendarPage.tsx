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
import {
  formatDateKey,
  getTodayDateKey,
  parseDateKey,
  getCalendarWeek,
  getWeekDays,
  getMonthCalendarDays,
  isEventOnDate,
  isSameDay,
} from '../utils/dateUtils';
import { TaskSidebar } from './calendar/TaskSidebar';
import { CalendarHeader, CalendarViewMode } from './calendar/CalendarHeader';

const HOUR_HEIGHT = 96; // pixels per hour
const HOURS = Array.from({ length: 24 }, (_, i) => i);

export const CalendarPage: React.FC = () => {
  const {
    events,
    tasks,
    selectedCategory,
    openEventModal,
    moveEventDate,
    convertTaskToEvent,
  } = useApp();

  const [currentDate, setCurrentDate] = useState(new Date());
  const [viewMode, setViewMode] = useState<CalendarViewMode>(() => {
    return window.innerWidth < 768 ? 'day' : 'week';
  });
  const [showTaskSidebar, setShowTaskSidebar] = useState(false);

  useEffect(() => {
    const handleResize = () => {
      if (window.innerWidth < 768 && viewMode !== 'day') {
        setViewMode('day');
      }
    };
    // Force day on initial load
    handleResize();
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, [viewMode]);

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
  const [dragOverMinute, setDragOverMinute] = useState<number>(0);

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
  const todayStr = getTodayDateKey();

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
    const newD = new Date(currentDate.getFullYear(), currentDate.getMonth(), currentDate.getDate());
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
    return getWeekDays(currentDate, todayStr);
  }, [currentDate, todayStr]);

  // Month view calculations
  const year = currentDate.getFullYear();
  const month = currentDate.getMonth();

  const calendarDays = useMemo(() => {
    return getMonthCalendarDays(year, month, todayStr);
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

  // Pre-calculate week event layouts with robust recurring & single date matching
  const weekEventLayouts = useMemo(() => {
    const map = new Map<string, ReturnType<typeof getEventLayout>>();
    for (const wd of weekDays) {
      const dayEvts = filteredEvents.filter((e) =>
        isEventOnDate(e.date, e.recurrence, wd.dateString)
      );
      map.set(wd.dateString, getEventLayout(dayEvts));
    }
    return map;
  }, [filteredEvents, weekDays]);

  // Pre-calculate day view event layouts
  const dayViewDateString = formatDateKey(currentDate);
  const dayEventLayouts = useMemo(() => {
    const dayEvts = filteredEvents.filter((e) =>
      isEventOnDate(e.date, e.recurrence, dayViewDateString)
    );
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
    setDragOverMinute(0);
  };

  const handleDragOver = (
    e: React.DragEvent,
    dateString: string,
    hour?: number,
    minute?: number
  ) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = 'move';

    if (dragOverDay !== dateString) {
      setDragOverDay(dateString);
    }
    const targetMin = minute ?? 0;
    if (
      hour !== undefined &&
      (dragOverHour !== hour || dragOverMinute !== targetMin)
    ) {
      setDragOverHour(hour);
      setDragOverMinute(targetMin);
    }
  };

  const handleDragLeave = (e: React.DragEvent) => {
    if (!e.currentTarget.contains(e.relatedTarget as Node)) {
      setDragOverDay(null);
      setDragOverHour(null);
      setDragOverMinute(0);
    }
  };

  const handleDrop = async (
    e: React.DragEvent,
    targetDate: string,
    hour?: number,
    minute: number = 0
  ) => {
    e.preventDefault();
    setDragOverDay(null);
    setDragOverHour(null);
    setDragOverMinute(0);

    if (!draggedItem) return;

    const formattedTime =
      hour !== undefined
        ? `${String(hour).padStart(2, '0')}:${String(minute).padStart(2, '0')}`
        : draggedItem.type === 'event' && draggedItem.data?.time
        ? draggedItem.data.time
        : '10:00';

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
      const weekday = currentDate.toLocaleDateString('de-DE', { weekday: 'long' });
      const day = String(currentDate.getDate()).padStart(2, '0');
      const month = String(currentDate.getMonth() + 1).padStart(2, '0');
      return `${weekday}, ${day}.${month}.${currentDate.getFullYear()}`;
    }
    if (viewMode === 'week' && weekStart && weekEnd) {
      const sDay = String(weekStart.getDate()).padStart(2, '0');
      const sMonth = String(weekStart.getMonth() + 1).padStart(2, '0');
      const eDay = String(weekEnd.getDate()).padStart(2, '0');
      const eMonth = String(weekEnd.getMonth() + 1).padStart(2, '0');
      return `KW ${currentKW} · ${sDay}.${sMonth}. – ${eDay}.${eMonth}.${weekEnd.getFullYear()}`;
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
    <div className="flex-1 flex flex-col h-full overflow-hidden bg-[#f8faf8] text-[#171c19]">
      <CalendarHeader
        getHeaderTitle={getHeaderTitle}
        currentDate={currentDate}
        setCurrentDate={setCurrentDate}
        navigateDate={navigateDate}
        getPrevNextTooltip={getPrevNextTooltip}
        viewMode={viewMode}
        setViewMode={setViewMode}
        showTaskSidebar={showTaskSidebar}
        setShowTaskSidebar={setShowTaskSidebar}
        openEventModal={openEventModal}
        todayStr={todayStr}
      />

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
                        day: '2-digit',
                        month: '2-digit',
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
                className="flex-1 overflow-y-auto overflow-x-hidden relative bg-white no-scrollbar"
              >
                <div
                  className="grid grid-cols-[72px_1fr] divide-x divide-[#e8eee9] relative"
                  style={{ height: `${24 * HOUR_HEIGHT}px` }}
                >
                  {/* Left Column: Hourly Time Labels */}
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
                  </div>

                  {/* Day Column */}
                  <div
                    onDragOver={(e) => handleDragOver(e, dayViewDateString)}
                    onDragLeave={handleDragLeave}
                    onDrop={(e) => handleDrop(e, dayViewDateString)}
                    className="relative transition-colors bg-white"
                  >
                    {HOURS.map((hour) => {
                      const hour00 = `${String(hour).padStart(2, '0')}:00`;
                      const hour30 = `${String(hour).padStart(2, '0')}:30`;
                      const is00Hovered =
                        dragOverDay === dayViewDateString &&
                        dragOverHour === hour &&
                        dragOverMinute === 0;
                      const is30Hovered =
                        dragOverDay === dayViewDateString &&
                        dragOverHour === hour &&
                        dragOverMinute === 30;

                      return (
                        <div
                          key={hour}
                          className="border-b border-[#edf2ee] relative flex flex-col"
                          style={{ height: `${HOUR_HEIGHT}px` }}
                        >
                          {/* Top 30 min (:00) */}
                          <div
                            onClick={() => {
                              openEventModal(undefined, dayViewDateString, hour00);
                            }}
                            onDragOver={(e) => {
                              e.stopPropagation();
                              handleDragOver(e, dayViewDateString, hour, 0);
                            }}
                            onDrop={(e) => {
                              e.stopPropagation();
                              handleDrop(e, dayViewDateString, hour, 0);
                            }}
                            className={`h-1/2 relative transition-colors cursor-pointer group/slot ${
                              is00Hovered
                                ? 'bg-[#edf5f0]'
                                : 'hover:bg-[#f6faf7]/80'
                            }`}
                            title={`Klicken, um Termin um ${hour00} Uhr zu erstellen`}
                          >
                            <div className="absolute left-3 top-1 opacity-0 group-hover/slot:opacity-80 transition-opacity pointer-events-none flex items-center gap-1.5 text-xs text-[#174e36] font-semibold">
                              <Plus className="w-3.5 h-3.5" />
                              <span>{hour00} eintragen</span>
                            </div>
                          </div>

                          {/* 30-minute separator */}
                          <div className="absolute top-1/2 left-0 right-0 border-b border-[#f1f5f2] pointer-events-none" />

                          {/* Bottom 30 min (:30) */}
                          <div
                            onClick={() => {
                              openEventModal(undefined, dayViewDateString, hour30);
                            }}
                            onDragOver={(e) => {
                              e.stopPropagation();
                              handleDragOver(e, dayViewDateString, hour, 30);
                            }}
                            onDrop={(e) => {
                              e.stopPropagation();
                              handleDrop(e, dayViewDateString, hour, 30);
                            }}
                            className={`h-1/2 relative transition-colors cursor-pointer group/slot ${
                              is30Hovered
                                ? 'bg-[#edf5f0]'
                                : 'hover:bg-[#f6faf7]/80'
                            }`}
                            title={`Klicken, um Termin um ${hour30} Uhr zu erstellen`}
                          >
                            <div className="absolute left-3 top-1 opacity-0 group-hover/slot:opacity-80 transition-opacity pointer-events-none flex items-center gap-1.5 text-xs text-[#174e36] font-semibold">
                              <Plus className="w-3.5 h-3.5" />
                              <span>{hour30} eintragen</span>
                            </div>
                          </div>
                        </div>
                      );
                    })}

                    {/* Drag Over Indicator Box (Clean preview without dashed/striped border) */}
                    {dragOverDay === dayViewDateString && dragOverHour !== null && (
                      <div
                        className="absolute left-2 right-2 rounded-xl bg-[#174e36]/15 border border-[#174e36]/25 z-20 pointer-events-none flex items-center gap-2 px-3 text-xs font-semibold text-[#174e36] transition-all duration-75 shadow-xs"
                        style={{
                          top: `${(dragOverHour + (dragOverMinute === 30 ? 0.5 : 0)) * HOUR_HEIGHT + 2}px`,
                          height: `${Math.max(26, ((draggedItem?.data?.durationMinutes || 60) / 60) * HOUR_HEIGHT - 4)}px`,
                        }}
                      >
                        <Clock className="w-3.5 h-3.5 shrink-0 text-[#174e36]" />
                        <span className="truncate">
                          {String(dragOverHour).padStart(2, '0')}:{String(dragOverMinute).padStart(2, '0')} –{' '}
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
                        <div className="w-2.5 h-2.5 -ml-1 rounded-full bg-[#174e36] ring-2 ring-[#174e36]/25 shadow-xs animate-pulse" />
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
                                <span className="text-xs font-extrabold text-[#171c19] shrink-0">
                                  {evt.time} ({evt.durationMinutes || 60} Min)
                                </span>
                                {evt.recurrence !== 'none' && (
                                  <Repeat className={`w-3 h-3 opacity-75 shrink-0 ${conf.textDark}`} />
                                )}
                              </div>
                              <h4 className={`text-xs font-bold leading-snug truncate mt-0.5 ${conf.textDark}`}>
                                {evt.title}
                              </h4>
                            </div>

                            {height >= 48 && evt.description && (
                              <p className={`text-[11px] font-medium opacity-85 truncate mt-0.5 ${conf.textDark}`}>
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
              {/* Sticky Top Header with 7 Week Days */}
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
                className="flex-1 overflow-y-auto overflow-x-hidden relative bg-white no-scrollbar"
              >
                <div
                  className="grid grid-cols-[72px_repeat(7,1fr)] divide-x divide-[#e8eee9] relative"
                  style={{ height: `${24 * HOUR_HEIGHT}px` }}
                >
                  {/* Left Column: Hourly Time Labels */}
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
                          const hour00 = `${String(hour).padStart(2, '0')}:00`;
                          const hour30 = `${String(hour).padStart(2, '0')}:30`;
                          const is00Hovered =
                            dragOverDay === wd.dateString &&
                            dragOverHour === hour &&
                            dragOverMinute === 0;
                          const is30Hovered =
                            dragOverDay === wd.dateString &&
                            dragOverHour === hour &&
                            dragOverMinute === 30;

                          return (
                            <div
                              key={hour}
                              className="border-b border-[#edf2ee] relative flex flex-col"
                              style={{ height: `${HOUR_HEIGHT}px` }}
                            >
                              {/* Top 30 min (:00) */}
                              <div
                                onClick={() => {
                                  openEventModal(undefined, wd.dateString, hour00);
                                }}
                                onDragOver={(e) => {
                                  e.stopPropagation();
                                  handleDragOver(e, wd.dateString, hour, 0);
                                }}
                                onDrop={(e) => {
                                  e.stopPropagation();
                                  handleDrop(e, wd.dateString, hour, 0);
                                }}
                                className={`h-1/2 relative transition-colors cursor-pointer group/slot ${
                                  is00Hovered
                                    ? 'bg-[#edf5f0]'
                                    : 'hover:bg-[#f6faf7]/80'
                                }`}
                                title={`Klicken, um Termin für ${wd.dayLabel}, ${hour00} Uhr einzutragen`}
                              >
                                <div className="absolute left-1.5 top-0.5 opacity-0 group-hover/slot:opacity-75 transition-opacity pointer-events-none flex items-center gap-1 text-[10px] text-[#174e36] font-semibold">
                                  <Plus className="w-2.5 h-2.5" />
                                  <span>{hour00}</span>
                                </div>
                              </div>

                              {/* 30-minute separator */}
                              <div className="absolute top-1/2 left-0 right-0 border-b border-[#f1f5f2] pointer-events-none" />

                              {/* Bottom 30 min (:30) */}
                              <div
                                onClick={() => {
                                  openEventModal(undefined, wd.dateString, hour30);
                                }}
                                onDragOver={(e) => {
                                  e.stopPropagation();
                                  handleDragOver(e, wd.dateString, hour, 30);
                                }}
                                onDrop={(e) => {
                                  e.stopPropagation();
                                  handleDrop(e, wd.dateString, hour, 30);
                                }}
                                className={`h-1/2 relative transition-colors cursor-pointer group/slot ${
                                  is30Hovered
                                    ? 'bg-[#edf5f0]'
                                    : 'hover:bg-[#f6faf7]/80'
                                }`}
                                title={`Klicken, um Termin für ${wd.dayLabel}, ${hour30} Uhr einzutragen`}
                              >
                                <div className="absolute left-1.5 top-0.5 opacity-0 group-hover/slot:opacity-75 transition-opacity pointer-events-none flex items-center gap-1 text-[10px] text-[#174e36] font-semibold">
                                  <Plus className="w-2.5 h-2.5" />
                                  <span>{hour30}</span>
                                </div>
                              </div>
                            </div>
                          );
                        })}

                        {/* Smooth Drop Indicator Ghost (Clean preview without dashed/striped border) */}
                        {isOverDay && dragOverHour !== null && (
                          <div
                            className="absolute left-1 right-1 rounded-xl bg-[#174e36]/15 border border-[#174e36]/25 z-20 pointer-events-none flex items-center gap-1 px-2 text-[10px] font-semibold text-[#174e36] transition-all duration-75 shadow-xs"
                            style={{
                              top: `${(dragOverHour + (dragOverMinute === 30 ? 0.5 : 0)) * HOUR_HEIGHT + 2}px`,
                              height: `${Math.max(26, ((draggedItem?.data?.durationMinutes || 60) / 60) * HOUR_HEIGHT - 4)}px`,
                            }}
                          >
                            <Clock className="w-3 h-3 shrink-0 text-[#174e36]" />
                            <span className="truncate">
                              {String(dragOverHour).padStart(2, '0')}:{String(dragOverMinute).padStart(2, '0')} –{' '}
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
                            <div className="w-2.5 h-2.5 -ml-1 rounded-full bg-[#174e36] ring-2 ring-[#174e36]/25 shadow-xs animate-pulse" />
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
                                    <span className="text-[11px] font-extrabold text-[#171c19] shrink-0">
                                      {evt.time}
                                    </span>
                                    {evt.recurrence !== 'none' && (
                                      <Repeat className={`w-2.5 h-2.5 opacity-75 shrink-0 ${conf.textDark}`} />
                                    )}
                                  </div>
                                  <h4 className={`text-xs font-bold leading-snug truncate mt-0.5 ${conf.textDark}`}>
                                    {evt.title}
                                  </h4>
                                </div>

                                {height >= 48 && evt.description && (
                                  <p className={`text-[10px] font-medium opacity-85 truncate mt-0.5 ${conf.textDark}`}>
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
              <div className="grid grid-cols-7 flex-1 divide-x divide-y divide-[#e8eee9] overflow-y-auto no-scrollbar">
                {calendarDays.map((dayItem, idx) => {
                  const dayEvents = filteredEvents.filter((e) =>
                    isEventOnDate(e.date, e.recurrence, dayItem.dateString)
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
                                <span className="text-[10px] shrink-0 font-extrabold text-[#171c19]">
                                  {evt.time}
                                </span>
                                <span className={`truncate font-semibold ${conf.textDark}`}>{evt.title}</span>
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

        {/* Right Drawer: Drag & Drop Tasks Sidebar */}
        {showTaskSidebar && (
          <TaskSidebar
            unscheduledTasks={unscheduledTasks}
            draggedItem={draggedItem}
            handleDragStartTask={handleDragStartTask}
            handleDragEnd={handleDragEnd}
            onClose={() => setShowTaskSidebar(false)}
          />
        )}
      </div>
    </div>
  );
};
