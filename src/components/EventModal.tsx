import React, { useState, useEffect } from 'react';
import { X, Calendar as CalendarIcon, Trash2 } from 'lucide-react';
import { useApp } from '../context/AppContext';
import { Category, Recurrence, CATEGORIES_CONFIG } from '../types';
import { getTodayDateKey } from '../utils/dateUtils';

export const EventModal: React.FC = () => {
  const {
    isEventModalOpen,
    editingEvent,
    presetEventDate,
    presetEventTime,
    closeEventModal,
    addEvent,
    updateEvent,
    deleteEvent,
  } = useApp();

  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [date, setDate] = useState('');
  const [time, setTime] = useState('10:00');
  const [durationMinutes, setDurationMinutes] = useState(60);
  const [category, setCategory] = useState<Category>('Arbeit');
  const [recurrence, setRecurrence] = useState<Recurrence>('none');

  useEffect(() => {
    if (editingEvent) {
      setTitle(editingEvent.title);
      setDescription(editingEvent.description || '');
      setDate(editingEvent.date);
      setTime(editingEvent.time);
      setDurationMinutes(editingEvent.durationMinutes || 60);
      setCategory(editingEvent.category);
      setRecurrence(editingEvent.recurrence);
    } else {
      setTitle('');
      setDescription('');
      setDate(presetEventDate || getTodayDateKey());
      setTime(presetEventTime || '10:00');
      setDurationMinutes(60);
      setCategory('Arbeit');
      setRecurrence('none');
    }
  }, [editingEvent, presetEventDate, presetEventTime, isEventModalOpen]);

  if (!isEventModalOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim() || !date || !time) return;

    if (editingEvent) {
      await updateEvent(editingEvent.id, {
        title,
        description,
        date,
        time,
        durationMinutes,
        category,
        recurrence,
      });
    } else {
      await addEvent({
        title,
        description,
        date,
        time,
        durationMinutes,
        category,
        recurrence,
      });
    }
    closeEventModal();
  };

  const handleDelete = async () => {
    if (editingEvent) {
      await deleteEvent(editingEvent.id);
      closeEventModal();
    }
  };

  const categories = Object.keys(CATEGORIES_CONFIG) as Category[];

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-xs p-4 overflow-y-auto">
      <div
        id="event-modal"
        className="bg-white rounded-2xl max-w-md w-full shadow-2xl border border-[#e2e8e3] text-[#171c19] overflow-hidden"
      >
        <div className="p-5 bg-[#fafcfa] border-b border-[#e2e8e3] flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-[#edf5f0] text-[#174e36] border border-[#cfe0d5] flex items-center justify-center shadow-xs">
              <CalendarIcon className="w-4.5 h-4.5" />
            </div>
            <div>
              <h2 className="text-base font-bold text-[#171c19] leading-tight">
                {editingEvent ? 'Termin bearbeiten' : 'Neuen Termin eintragen'}
              </h2>
              <p className="text-xs text-[#52645a]">Im Kalender zeitlich verankern</p>
            </div>
          </div>
          <button
            onClick={closeEventModal}
            className="p-1.5 text-[#52645a] hover:text-[#171c19] hover:bg-[#f3f7f4] rounded-xl transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-4">
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
              className="w-full px-3.5 py-2.5 rounded-xl border border-[#d8e2db] bg-white text-[#171c19] placeholder-[#7d8e84] focus:border-[#174e36] focus:ring-1 focus:ring-[#174e36]/30 text-sm outline-none transition-all"
            />
          </div>

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
                Uhrzeit *
              </label>
              <input
                type="time"
                required
                value={time}
                onChange={(e) => setTime(e.target.value)}
                className="w-full px-3 py-2 rounded-xl border border-[#d8e2db] bg-white text-[#171c19] focus:border-[#174e36] text-sm outline-none"
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-semibold text-[#37443d] mb-1.5">
                Dauer
              </label>
              <select
                value={durationMinutes}
                onChange={(e) => setDurationMinutes(Number(e.target.value))}
                className="w-full px-3 py-2 rounded-xl border border-[#d8e2db] bg-white text-[#171c19] focus:border-[#174e36] text-sm outline-none cursor-pointer"
              >
                <option value={15}>15 Min</option>
                <option value={30}>30 Min</option>
                <option value={45}>45 Min</option>
                <option value={60}>1 Stunde</option>
                <option value={90}>1,5 Stunden</option>
                <option value={120}>2 Stunden</option>
                <option value={180}>3 Stunden</option>
              </select>
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

          <div>
            <label className="block text-xs font-semibold text-[#37443d] mb-1.5">
              Kategorie *
            </label>
            <div className="grid grid-cols-4 gap-1.5">
              {categories.map((cat) => {
                const conf = CATEGORIES_CONFIG[cat];
                const isSelected = category === cat;
                return (
                  <button
                    key={cat}
                    type="button"
                    onClick={() => setCategory(cat)}
                    className={`py-2 px-1.5 rounded-xl text-xs font-medium border transition-all text-center flex items-center justify-center gap-1 cursor-pointer truncate ${
                      isSelected
                        ? 'border-[#174e36] bg-[#edf5f0] text-[#143d2b] ring-1 ring-[#174e36] shadow-xs font-semibold'
                        : 'border-[#d8e2db] text-[#52645a] hover:text-[#171c19] bg-white hover:bg-[#f3f7f4]'
                    }`}
                  >
                    <span
                      className="w-2 h-2 rounded-full shrink-0"
                      style={{ backgroundColor: conf.color }}
                    />
                    <span className="truncate">{conf.label}</span>
                  </button>
                );
              })}
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-[#37443d] mb-1.5">
              Notizen / Details (optional)
            </label>
            <textarea
              rows={2}
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Zusätzliche Informationen..."
              className="w-full px-3.5 py-2 rounded-xl border border-[#d8e2db] bg-white text-[#171c19] placeholder-[#7d8e84] focus:border-[#174e36] text-sm outline-none resize-none transition-all"
            />
          </div>

          <div className="pt-3 flex items-center justify-between border-t border-[#e8eee9]">
            {editingEvent ? (
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
                className="px-5 py-2.5 bg-[#174e36] hover:bg-[#12402c] active:scale-[0.98] text-white text-xs font-semibold rounded-xl shadow-xs transition-all cursor-pointer"
              >
                {editingEvent ? 'Speichern' : 'Termin anlegen'}
              </button>
            </div>
          </div>
        </form>
      </div>
    </div>
  );
};
