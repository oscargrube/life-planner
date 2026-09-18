import React, { useRef } from 'react';
import { ChevronLeft, ChevronRight, Plus, CheckSquare, Calendar as CalendarIcon, Menu } from 'lucide-react';
import { useUI } from '../../context/UIContext';
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
  const dateInputRef = useRef<HTMLInputElement>(null);
  const { setMobileSidebarOpen } = useUI();

  const handleDateSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.value) {
      setCurrentDate(parseDateKey(e.target.value));
    }
  };

  return (
    <header className="px-4 sm:px-6 py-2.5 bg-white border-b border-[#e2e8e3] flex md:grid md:grid-cols-[1fr_auto_1fr] items-center justify-between gap-3 shrink-0 shadow-xs">
      {/* Left: Navigation controls (Always visible, left aligned) */}
      <div className="flex items-center gap-1.5 shrink-0">
        <button
          onClick={() => setMobileSidebarOpen(true)}
          className="md:hidden p-1.5 -ml-1.5 mr-0.5 text-[#52645a] hover:bg-[#f4f7f5] rounded-lg transition-colors"
        >
          <Menu className="w-6 h-6" />
        </button>

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

      {/* Center: View Mode Switcher (Hidden on Mobile) */}
      <div className="hidden md:flex items-center justify-center">
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
      </div>

      {/* Right side: New Event + Toggle Tasks (Hidden on mobile) + Mobile Date Picker */}
      <div className="flex items-center justify-end gap-2">
        {/* Desktop Buttons */}
        <div className="hidden md:flex items-center gap-2">
          <button
            id="btn-new-calendar-event"
            onClick={() => {
              const defaultDate = viewMode === 'day' ? formatDateKey(currentDate) : todayStr;
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

        {/* Mobile Date Picker Button */}
        <div className="relative md:hidden">
          <button
            onClick={() => dateInputRef.current?.showPicker?.()}
            className="p-2 border border-[#d8e2db] rounded-xl text-[#174e36] bg-[#edf5f0] shadow-xs cursor-pointer"
            title="Datum auswählen"
          >
            <CalendarIcon className="w-4 h-4" />
          </button>
          <input
            ref={dateInputRef}
            type="date"
            value={formatDateKey(currentDate)}
            onChange={handleDateSelect}
            className="absolute top-0 left-0 w-0 h-0 opacity-0 pointer-events-none"
          />
        </div>
      </div>
    </header>
  );
};
