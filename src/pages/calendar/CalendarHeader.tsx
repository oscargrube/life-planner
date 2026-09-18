import React from 'react';
import { ChevronLeft, ChevronRight, Calendar as CalendarIcon, Plus, CheckSquare } from 'lucide-react';
import { formatDateKey, parseDateKey, isSameDay } from '../../utils/dateUtils';

export type CalendarViewMode = 'day' | 'week' | 'month';

interface CalendarHeaderProps {
  getHeaderTitle: () => string;
  currentDate: Date;
  setCurrentDate: (date: Date) => void;
  navigateDate: (direction: 'prev' | 'next') => void;
  getPrevNextTooltip: (dir: 'prev' | 'next') => string;
  viewMode: CalendarViewMode;
  setViewMode: (mode: CalendarViewMode) => void;
  showTaskSidebar: boolean;
  setShowTaskSidebar: (show: boolean) => void;
  openEventModal: (event?: any, date?: string, time?: string) => void;
  todayStr: string;
}

export const CalendarHeader: React.FC<CalendarHeaderProps> = ({
  getHeaderTitle,
  currentDate,
  setCurrentDate,
  navigateDate,
  getPrevNextTooltip,
  viewMode,
  setViewMode,
  showTaskSidebar,
  setShowTaskSidebar,
  openEventModal,
  todayStr,
}) => {
  return (
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
                value={formatDateKey(currentDate)}
                onChange={(e) => {
                  if (e.target.value) {
                    setCurrentDate(parseDateKey(e.target.value));
                  }
                }}
                className="sr-only"
              />
            </label>
          </div>
        </div>

        {/* Navigation Controls: Today + Previous / Next */}
        <div className="flex items-center gap-1.5">
          <button
            onClick={() => setCurrentDate(new Date())}
            className={`px-3 py-1.5 rounded-xl text-xs font-semibold border transition-all cursor-pointer shadow-xs active:scale-95 ${
              isSameDay(currentDate, new Date())
                ? 'bg-[#edf5f0] text-[#174e36] border-[#cfe0d5] font-bold'
                : 'bg-white text-[#52645a] border-[#d8e2db] hover:bg-[#f4f7f5] hover:text-[#171c19]'
            }`}
            title="Zum heutigen Tag springen"
          >
            Heute
          </button>

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
                ? formatDateKey(currentDate)
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
  );
};
