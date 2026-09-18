import React, { useState, useEffect } from 'react';
import { X, ArrowRight, CheckSquare, Calendar as CalendarIcon, Sparkles } from 'lucide-react';
import { useApp } from '../../context/AppContext';
import { Category, Recurrence, CATEGORIES_CONFIG } from '../../types';
import { formatDateKey } from '../../utils/dateUtils';

export const ConvertIdeaModal: React.FC = () => {
  const {
    selectedIdeaForConversion,
    closeConvertIdeaModal,
    addTask,
    addEvent,
  } = useApp();

  const [targetType, setTargetType] = useState<'task' | 'event'>('task');
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [category, setCategory] = useState<Category>('Persönlich');
  const [recurrence, setRecurrence] = useState<Recurrence>('none');
  
  // Event specific
  const [date, setDate] = useState(() => {
    const tomorrow = new Date();
    tomorrow.setDate(tomorrow.getDate() + 1);
    return formatDateKey(tomorrow);
  });
  const [time, setTime] = useState('10:00');
  const [durationMinutes, setDurationMinutes] = useState(60);

  // Task specific
  const [dueDate, setDueDate] = useState('');

  useEffect(() => {
    if (selectedIdeaForConversion) {
      setTitle(selectedIdeaForConversion.title);
      setDescription(selectedIdeaForConversion.description || '');
      setCategory(selectedIdeaForConversion.category);
      setRecurrence('none');
    }
  }, [selectedIdeaForConversion]);

  if (!selectedIdeaForConversion) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim()) return;

    if (targetType === 'task') {
      await addTask({
        title,
        description,
        category,
        recurrence,
        dueDate: dueDate || undefined,
        sourceIdeaId: selectedIdeaForConversion.id,
        sourceIdeaTitle: selectedIdeaForConversion.title,
      });
    } else if (targetType === 'event') {
      await addEvent({
        title,
        description,
        date,
        time,
        durationMinutes,
        category,
        recurrence,
        sourceIdeaId: selectedIdeaForConversion.id,
      });
    }

    closeConvertIdeaModal();
  };

  const categories = Object.keys(CATEGORIES_CONFIG) as Category[];

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-xs p-4 overflow-y-auto">
      <div
        id="convert-idea-modal"
        className="bg-white rounded-2xl max-w-lg w-full shadow-2xl border border-[#e2e8e3] text-[#171c19] overflow-hidden"
      >
        {/* Header */}
        <div className="p-5 bg-[#fafcfa] border-b border-[#e2e8e3] flex items-start justify-between">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-xl bg-[#edf5f0] text-[#174e36] flex items-center justify-center font-bold border border-[#cfe0d5]">
              <Sparkles className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-base font-semibold text-[#171c19]">
                Idee weiterentwickeln
              </h2>
              <p className="text-xs text-[#52645a]">
                Mache aus einem Gedanken konkretes Handeln
              </p>
            </div>
          </div>
          <button
            onClick={closeConvertIdeaModal}
            className="p-1.5 text-[#52645a] hover:text-[#171c19] hover:bg-[#f3f7f4] rounded-lg transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-5">
          {/* Original Idea Callout */}
          <div className="p-3.5 bg-[#edf5f0] border border-[#cfe0d5] rounded-xl">
            <span className="text-[11px] font-semibold text-[#174e36] uppercase tracking-wider block mb-1">
              Ausgangs-Idee
            </span>
            <p className="text-sm font-semibold text-[#171c19]">
              "{selectedIdeaForConversion.title}"
            </p>
            {selectedIdeaForConversion.description && (
              <p className="text-xs text-[#52645a] mt-1 line-clamp-2">
                {selectedIdeaForConversion.description}
              </p>
            )}
          </div>

          {/* Evolution Choice: Task or Calendar Event */}
          <div>
            <label className="block text-xs font-semibold text-[#37443d] mb-2">
              Wohin möchtest du die Idee entwickeln?
            </label>
            <div className="grid grid-cols-2 gap-3">
              <button
                type="button"
                id="convert-target-task-btn"
                onClick={() => setTargetType('task')}
                className={`p-3.5 rounded-xl border text-left flex flex-col justify-between transition-all cursor-pointer ${
                  targetType === 'task'
                    ? 'border-[#0284c7] bg-sky-50 text-sky-900 ring-1 ring-sky-300 shadow-xs'
                    : 'border-[#e2e8e3] bg-white text-[#52645a] hover:bg-[#f8faf8]'
                }`}
              >
                <CheckSquare className="w-5 h-5 text-[#0284c7] mb-2" />
                <div>
                  <div className="text-xs font-semibold text-[#171c19]">Aufgabe</div>
                  <div className="text-[10px] text-[#52645a]">Konkreter To-Do Schritt</div>
                </div>
              </button>

              <button
                type="button"
                id="convert-target-event-btn"
                onClick={() => setTargetType('event')}
                className={`p-3.5 rounded-xl border text-left flex flex-col justify-between transition-all cursor-pointer ${
                  targetType === 'event'
                    ? 'border-[#174e36] bg-[#edf5f0] text-[#143d2b] ring-1 ring-[#174e36] shadow-xs'
                    : 'border-[#e2e8e3] bg-white text-[#52645a] hover:bg-[#f8faf8]'
                }`}
              >
                <CalendarIcon className="w-5 h-5 text-[#174e36] mb-2" />
                <div>
                  <div className="text-xs font-semibold text-[#171c19]">Termin</div>
                  <div className="text-[10px] text-[#52645a]">Fester Kalenderplatz</div>
                </div>
              </button>
            </div>
          </div>

          {/* Title Field */}
          <div>
            <label className="block text-xs font-semibold text-[#37443d] mb-1.5">
              {targetType === 'task' ? 'Titel der Aufgabe' : 'Titel des Termins'}
            </label>
            <input
              type="text"
              required
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="z. B. Trainingsplan erstellen"
              className="w-full px-3.5 py-2.5 rounded-xl border border-[#d8e2db] bg-white text-[#171c19] placeholder-[#7d8e84] focus:border-[#174e36] focus:ring-1 focus:ring-[#174e36]/30 text-sm outline-none transition-all"
            />
          </div>

          {/* Category & Recurrence */}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-semibold text-[#37443d] mb-1.5">
                Kategorie
              </label>
              <select
                value={category}
                onChange={(e) => setCategory(e.target.value as Category)}
                className="w-full px-3 py-2 rounded-xl border border-[#d8e2db] bg-white text-[#171c19] focus:border-[#174e36] text-sm outline-none cursor-pointer"
              >
                {categories.map((c) => (
                  <option key={c} value={c} className="bg-white text-[#171c19]">
                    {c}
                  </option>
                ))}
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
                <option value="none">Einmalig</option>
                <option value="daily">Täglich</option>
                <option value="weekly">Wöchentlich</option>
                <option value="monthly">Monatlich</option>
              </select>
            </div>
          </div>

          {/* Context Fields based on targetType */}
          {targetType === 'task' && (
            <div>
              <label className="block text-xs font-semibold text-[#37443d] mb-1.5">
                Fälligkeitsdatum (optional)
              </label>
              <input
                type="date"
                value={dueDate}
                onChange={(e) => setDueDate(e.target.value)}
                className="w-full px-3.5 py-2 rounded-xl border border-[#d8e2db] bg-white text-[#171c19] focus:border-[#174e36] text-sm outline-none"
              />
            </div>
          )}

          {targetType === 'event' && (
            <div className="grid grid-cols-3 gap-2.5">
              <div className="col-span-1">
                <label className="block text-xs font-semibold text-[#37443d] mb-1.5">
                  Datum
                </label>
                <input
                  type="date"
                  required
                  value={date}
                  onChange={(e) => setDate(e.target.value)}
                  className="w-full px-2.5 py-2 rounded-xl border border-[#d8e2db] bg-white text-[#171c19] focus:border-[#174e36] text-xs outline-none"
                />
              </div>
              <div>
                <label className="block text-xs font-semibold text-[#37443d] mb-1.5">
                  Uhrzeit
                </label>
                <input
                  type="time"
                  required
                  value={time}
                  onChange={(e) => setTime(e.target.value)}
                  className="w-full px-2.5 py-2 rounded-xl border border-[#d8e2db] bg-white text-[#171c19] focus:border-[#174e36] text-xs outline-none"
                />
              </div>
              <div>
                <label className="block text-xs font-semibold text-[#37443d] mb-1.5">
                  Dauer (Min.)
                </label>
                <select
                  value={durationMinutes}
                  onChange={(e) => setDurationMinutes(Number(e.target.value))}
                  className="w-full px-2.5 py-2 rounded-xl border border-[#d8e2db] bg-white text-[#171c19] focus:border-[#174e36] text-xs outline-none cursor-pointer"
                >
                  <option value={30}>30 Min</option>
                  <option value={45}>45 Min</option>
                  <option value={60}>1 Std</option>
                  <option value={90}>1,5 Std</option>
                  <option value={120}>2 Std</option>
                </select>
              </div>
            </div>
          )}

          {/* Description */}
          <div>
            <label className="block text-xs font-semibold text-[#37443d] mb-1.5">
              Konkrete Beschreibung / Notizen
            </label>
            <textarea
              rows={3}
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Schritte, Links oder Vorbereitung..."
              className="w-full px-3.5 py-2 rounded-xl border border-[#d8e2db] bg-white text-[#171c19] placeholder-[#7d8e84] focus:border-[#174e36] text-sm outline-none resize-none"
            />
          </div>

          {/* Actions */}
          <div className="pt-2 flex items-center justify-end gap-2.5">
            <button
              type="button"
              onClick={closeConvertIdeaModal}
              className="px-4 py-2.5 text-xs font-semibold text-[#52645a] hover:text-[#171c19] hover:bg-[#f3f7f4] rounded-xl transition-colors cursor-pointer"
            >
              Abbrechen
            </button>
            <button
              type="submit"
              className="flex items-center gap-1.5 px-5 py-2.5 bg-[#174e36] hover:bg-[#12402c] active:scale-[0.98] text-white text-xs font-semibold rounded-xl shadow-xs transition-all cursor-pointer"
            >
              <span>Jetzt weiterentwickeln</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
