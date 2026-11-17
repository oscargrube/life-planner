import React, { useState, useEffect } from 'react';
import { X, Calendar as CalendarIcon, Trash2, Users } from 'lucide-react';
import { useApp } from '../../context/AppContext';
import { Category, Recurrence, CATEGORIES_CONFIG } from '../../types';
import { getTodayDateKey } from '../../utils/dateUtils';

const timeToMinutes = (t: string): number => {
  const [h, m] = (t || '00:00').split(':').map(Number);
  return (h || 0) * 60 + (m || 0);
};

const minutesToTime = (totalMins: number): string => {
  const clamped = Math.max(0, Math.min(23 * 60 + 59, totalMins));
  const h = Math.floor(clamped / 60);
  const m = clamped % 60;
  return `${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')}`;
};

const formatDurationHint = (mins: number): string => {
  if (mins <= 0) return '';
  const h = Math.floor(mins / 60);
  const m = mins % 60;
  if (h > 0 && m > 0) return `${h} Std. ${m} Min.`;
  if (h > 0) return `${h} Std.`;
  return `${m} Min.`;
};

export const EventModal: React.FC = () => {
  const {
    isEventModalOpen,
    editingEvent,
    presetEventDate,
    presetEventTime,
    presetEventProjectId,
    closeEventModal,
    addEvent,
    updateEvent,
    deleteEvent,
    projects,
    getUserLabel,
  } = useApp();

  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [date, setDate] = useState('');
  const [time, setTime] = useState('10:00');
  const [endTime, setEndTime] = useState('11:00');
  const [durationMinutes, setDurationMinutes] = useState(60);
  const [category, setCategory] = useState<Category>('Arbeit');
  const [recurrence, setRecurrence] = useState<Recurrence>('none');
  const [projectId, setProjectId] = useState('');

  useEffect(() => {
    if (editingEvent) {
      const start = editingEvent.time || '10:00';
      const dur = editingEvent.durationMinutes || 60;
      setTitle(editingEvent.title);
      setDescription(editingEvent.description || '');
      setDate(editingEvent.date);
      setTime(start);
      setDurationMinutes(dur);
      setEndTime(minutesToTime(timeToMinutes(start) + dur));
      setCategory(editingEvent.category);
      setRecurrence(editingEvent.recurrence);
      setProjectId(editingEvent.projectId || presetEventProjectId || '');
    } else {
      const start = presetEventTime || '10:00';
      setTitle('');
      setDescription('');
      setDate(presetEventDate || getTodayDateKey());
      setTime(start);
      setDurationMinutes(60);
      setEndTime(minutesToTime(timeToMinutes(start) + 60));
      setCategory(presetEventProjectId ? 'Projekt' : 'Arbeit');
      setRecurrence('none');
      setProjectId(presetEventProjectId || '');
    }
  }, [editingEvent, presetEventDate, presetEventTime, presetEventProjectId, isEventModalOpen]);

  if (!isEventModalOpen) return null;

  const isExistingEvent = Boolean(editingEvent && editingEvent.id);

  const handleStartTimeChange = (newStart: string) => {
    const prevDur = Math.max(15, durationMinutes || 60);
    setTime(newStart);
    if (newStart) {
      const newEnd = minutesToTime(timeToMinutes(newStart) + prevDur);
      setEndTime(newEnd);
      setDurationMinutes(Math.max(15, timeToMinutes(newEnd) - timeToMinutes(newStart)));
    }
  };

  const handleEndTimeChange = (newEnd: string) => {
    setEndTime(newEnd);
    if (time && newEnd) {
      const diff = timeToMinutes(newEnd) - timeToMinutes(time);
      if (diff > 0) {
        setDurationMinutes(diff);
      }
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim() || !date || !time) return;

    const startM = timeToMinutes(time);
    const endM = timeToMinutes(endTime);
    const finalDuration = endM > startM ? endM - startM : Math.max(15, durationMinutes);

    if (isExistingEvent && editingEvent) {
      await updateEvent(editingEvent.id, {
        title,
        description,
        date,
        time,
        durationMinutes: finalDuration,
        category,
        recurrence,
        projectId: projectId || undefined,
      });
    } else {
      await addEvent({
        title,
        description,
        date,
        time,
        durationMinutes: finalDuration,
        category,
        recurrence,
        projectId: projectId || undefined,
        sourceTaskId: editingEvent?.sourceTaskId,
        sourceIdeaId: editingEvent?.sourceIdeaId,
      });
    }
    closeEventModal();
  };

  const handleDelete = async () => {
    if (isExistingEvent && editingEvent) {
      await deleteEvent(editingEvent.id);
      closeEventModal();
    }
  };

  const categories = Object.keys(CATEGORIES_CONFIG) as Category[];
  const computedDiff = timeToMinutes(endTime) - timeToMinutes(time);
  const durationHint = computedDiff > 0 ? formatDurationHint(computedDiff) : '';

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-[#171c19]/40 backdrop-blur-xs p-0 sm:p-4">
      <div
        id="event-modal"
        className="bg-white rounded-t-2xl sm:rounded-2xl max-w-md w-full max-h-[92dvh] sm:max-h-[90vh] flex flex-col shadow-2xl border border-[#e2e8e3] text-[#171c19] overflow-hidden"
      >
        <div className="p-4 sm:p-5 bg-[#fafcfa] border-b border-[#e2e8e3] flex items-center justify-between shrink-0">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-[#edf5f0] text-[#174e36] border border-[#cfe0d5] flex items-center justify-center shadow-xs">
              <CalendarIcon className="w-4.5 h-4.5" />
            </div>
            <div>
              <h2 className="text-base font-bold text-[#171c19] leading-tight">
                {isExistingEvent ? 'Termin bearbeiten' : 'Neuen Termin eintragen'}
              </h2>
              <p className="text-xs text-[#52645a]">Im Kalender zeitlich verankern</p>
            </div>
          </div>
          <button
            type="button"
            onClick={closeEventModal}
            className="p-1.5 text-[#52645a] hover:text-[#171c19] hover:bg-[#f3f7f4] rounded-xl transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="flex-1 flex flex-col min-h-0">
          <div className="flex-1 overflow-y-auto no-scrollbar p-4 sm:p-5 space-y-3.5">
            {editingEvent?.isShared && editingEvent.participantIds && (
              <div className="p-3 bg-[#edf5f0] border border-[#cfe0d5] rounded-xl space-y-1">
                <div className="flex items-center gap-1.5 text-xs font-bold text-[#174e36]">
                  <Users className="w-3.5 h-3.5" />
                  <span>Gemeinsamer Termin</span>
                </div>
                <p className="text-[11px] text-[#37443d]">
                  Teilnehmer: {editingEvent.participantIds.map((id) => getUserLabel(id)).join(', ')}
                </p>
              </div>
            )}

            <div>
              <label className="block text-xs font-semibold text-[#37443d] mb-1.5">
                Titel des Termins *
              </label>
              <input
                type="text"
                required
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="z. B. Team-Meeting oder Laufrunde"
                className="w-full px-3.5 py-2 rounded-xl border border-[#d8e2db] bg-white text-[#171c19] placeholder-[#7d8e84] focus:border-[#174e36] focus:ring-1 focus:ring-[#174e36]/30 text-sm outline-none transition-all"
              />
            </div>

            {projects.length > 0 && (
              <div>
                <label className="block text-xs font-semibold text-[#37443d] mb-1.5">
                  Projekt zuordnen (optional)
                </label>
                <select
                  value={projectId}
                  onChange={(e) => setProjectId(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl border border-[#d8e2db] bg-white text-[#171c19] focus:border-[#174e36] text-xs font-medium outline-none cursor-pointer"
                >
                  <option value="">Privat (kein Projekt)</option>
                  {projects.map((p) => (
                    <option key={p.id} value={p.id}>
                      {p.title}
                    </option>
                  ))}
                </select>
              </div>
            )}

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-semibold text-[#37443d] mb-1.5">
                  Datum *
                </label>
                <input
                  type="date"
                  required
                  value={date}
                  onChange={(e) => setDate(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl border border-[#d8e2db] bg-white text-[#171c19] focus:border-[#174e36] text-sm outline-none"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-[#37443d] mb-1.5">
                  Wiederholung
                </label>
                <select
                  value={recurrence}
                  onChange={(e) => setRecurrence(e.target.value as Recurrence)}
                  className="w-full px-3 py-2 rounded-xl border border-[#d8e2db] bg-white text-[#171c19] focus:border-[#174e36] text-sm outline-none cursor-pointer"
                >
                  <option value="none">Keine</option>
                  <option value="daily">Täglich</option>
                  <option value="weekly">Wöchentlich</option>
                  <option value="monthly">Monatlich</option>
                </select>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-semibold text-[#37443d] mb-1.5">
                  Von *
                </label>
                <input
                  type="time"
                  required
                  value={time}
                  onChange={(e) => handleStartTimeChange(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl border border-[#d8e2db] bg-white text-[#171c19] focus:border-[#174e36] text-sm outline-none"
                />
              </div>

              <div>
                <label className="flex items-center justify-between text-xs font-semibold text-[#37443d] mb-1.5">
                  <span>Bis *</span>
                  {durationHint && (
                    <span className="text-[11px] font-medium text-[#52645a]">
                      {durationHint}
                    </span>
                  )}
                </label>
                <input
                  type="time"
                  required
                  value={endTime}
                  min={time}
                  onChange={(e) => handleEndTimeChange(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl border border-[#d8e2db] bg-white text-[#171c19] focus:border-[#174e36] text-sm outline-none"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold text-[#37443d] mb-1.5">
                Kategorie *
              </label>
              <div
                onWheel={(e) => {
                  if (e.deltaY !== 0) {
                    e.currentTarget.scrollLeft += e.deltaY;
                  }
                }}
                className="flex items-center gap-1.5 overflow-x-auto no-scrollbar py-0.5"
              >
                {categories.map((cat) => {
                  const conf = CATEGORIES_CONFIG[cat];
                  const isSelected = category === cat;
                  return (
                    <button
                      key={cat}
                      type="button"
                      onClick={() => setCategory(cat)}
                      className={`py-1.5 px-3 rounded-xl text-xs font-medium border transition-all flex items-center gap-1.5 shrink-0 cursor-pointer ${
                        isSelected
                          ? 'border-[#174e36] bg-[#edf5f0] text-[#143d2b] ring-1 ring-[#174e36] shadow-xs font-semibold'
                          : 'border-[#d8e2db] text-[#52645a] hover:text-[#171c19] bg-white hover:bg-[#f3f7f4]'
                      }`}
                    >
                      <span
                        className="w-2 h-2 rounded-full shrink-0"
                        style={{ backgroundColor: conf.color }}
                      />
                      <span>{conf.label}</span>
                    </button>
                  );
                })}
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold text-[#37443d] mb-1.5">
                Notizen
              </label>
              <textarea
                rows={2}
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="Zusätzliche Informationen..."
                className="w-full px-3.5 py-2 rounded-xl border border-[#d8e2db] bg-white text-[#171c19] placeholder-[#7d8e84] focus:border-[#174e36] text-sm outline-none resize-none transition-all"
              />
            </div>
          </div>

          <div className="px-4 sm:px-5 py-3.5 flex items-center justify-between border-t border-[#e8eee9] bg-[#fafcfa] shrink-0">
            {isExistingEvent ? (
              <button
                type="button"
                onClick={handleDelete}
                className="flex items-center gap-1.5 text-xs text-rose-600 hover:text-rose-700 hover:bg-rose-50 py-2 px-3 rounded-xl transition-colors cursor-pointer"
              >
                <Trash2 className="w-3.5 h-3.5" />
                <span>Löschen</span>
              </button>
            ) : (
              <div />
            )}

            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={closeEventModal}
                className="px-4 py-2 text-xs font-semibold text-[#52645a] hover:text-[#171c19] hover:bg-[#f3f7f4] rounded-xl transition-colors cursor-pointer"
              >
                Abbrechen
              </button>
              <button
                type="submit"
                className="px-5 py-2 bg-[#174e36] hover:bg-[#12402c] active:scale-[0.98] text-white text-xs font-semibold rounded-xl shadow-xs transition-all cursor-pointer"
              >
                {isExistingEvent ? 'Speichern' : 'Termin anlegen'}
              </button>
            </div>
          </div>
        </form>
      </div>
    </div>
  );
};
