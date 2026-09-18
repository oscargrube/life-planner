import React, { useState } from 'react';
import {
  CheckSquare,
  Plus,
  Repeat,
  Calendar as CalendarIcon,
  Search,
  Trash2,
  Edit2,
  Sparkles,
} from 'lucide-react';
import { useApp } from '../context/AppContext';
import { Recurrence, CATEGORIES_CONFIG, Category } from '../types';
import { getTodayDateKey } from '../utils/dateUtils';

export const TasksPage: React.FC = () => {
  const {
    tasks,
    selectedCategory,
    setSelectedCategory,
    openTaskModal,
    deleteTask,
    toggleTaskCompleted,
    openEventModal,
  } = useApp();

  const [statusFilter, setStatusFilter] = useState<'all' | 'open' | 'completed'>('open');
  const [recurrenceFilter, setRecurrenceFilter] = useState<Recurrence | 'all'>('all');
  const [searchQuery, setSearchQuery] = useState('');

  const categories = Object.keys(CATEGORIES_CONFIG) as Category[];

  // Filter tasks
  const filteredTasks = tasks.filter((task) => {
    const matchesCategory =
      selectedCategory === 'all' || task.category === selectedCategory;
    const matchesStatus =
      statusFilter === 'all' ||
      (statusFilter === 'open' && !task.completed) ||
      (statusFilter === 'completed' && task.completed);
    const matchesRecurrence =
      recurrenceFilter === 'all' || task.recurrence === recurrenceFilter;
    const matchesSearch =
      searchQuery.trim() === '' ||
      task.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (task.description && task.description.toLowerCase().includes(searchQuery.toLowerCase()));

    return matchesCategory && matchesStatus && matchesRecurrence && matchesSearch;
  });

  return (
    <div className="flex-1 flex flex-col h-full overflow-hidden bg-[#f8faf8] text-[#171c19]">
      {/* Header */}
      <header className="p-6 bg-white border-b border-[#e2e8e3] flex flex-wrap items-center justify-between gap-4 shrink-0 shadow-xs">
        <div>
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-xl bg-[#edf5f0] border border-[#cfe0d5] text-[#174e36] flex items-center justify-center font-bold shadow-xs">
              <CheckSquare className="w-5 h-5 text-[#174e36]" />
            </div>
            <h2 className="text-xl font-bold text-[#171c19] tracking-tight">
              Aufgaben-Management
            </h2>
          </div>
          <p className="text-xs text-[#52645a] mt-1">
            Konkrete Todos, wiederkehrende Gewohnheiten und Fälligkeiten
          </p>
        </div>

        <button
          id="add-new-task-btn"
          onClick={() => openTaskModal()}
          className="flex items-center gap-1.5 px-4 py-2.5 bg-[#174e36] hover:bg-[#12402c] active:scale-[0.98] text-white rounded-xl text-xs font-semibold shadow-xs transition-all cursor-pointer"
        >
          <Plus className="w-4 h-4" />
          <span>Neue Aufgabe</span>
        </button>
      </header>

      {/* Main Content Area */}
      <div className="flex-1 overflow-y-auto p-6 space-y-6">
        {/* Filter Controls Bar */}
        <div className="bg-white p-4 rounded-2xl border border-[#e2e8e3] shadow-xs space-y-3">
          <div className="flex flex-wrap items-center justify-between gap-3">
            {/* Status Segment */}
            <div className="flex items-center bg-[#f4f7f5] p-1 rounded-xl border border-[#d8e2db]">
              <button
                onClick={() => setStatusFilter('open')}
                className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all cursor-pointer ${
                  statusFilter === 'open'
                    ? 'bg-[#174e36] text-white shadow-xs font-semibold'
                    : 'text-[#52645a] hover:text-[#171c19]'
                }`}
              >
                Offen ({tasks.filter((t) => !t.completed).length})
              </button>
              <button
                onClick={() => setStatusFilter('completed')}
                className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all cursor-pointer ${
                  statusFilter === 'completed'
                    ? 'bg-[#174e36] text-white shadow-xs font-semibold'
                    : 'text-[#52645a] hover:text-[#171c19]'
                }`}
              >
                Erledigt ({tasks.filter((t) => t.completed).length})
              </button>
              <button
                onClick={() => setStatusFilter('all')}
                className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all cursor-pointer ${
                  statusFilter === 'all'
                    ? 'bg-[#174e36] text-white shadow-xs font-semibold'
                    : 'text-[#52645a] hover:text-[#171c19]'
                }`}
              >
                Alle ({tasks.length})
              </button>
            </div>

            {/* Recurrence Filter */}
            <div className="flex items-center gap-2">
              <div className="flex items-center gap-1 text-xs text-[#52645a]">
                <Repeat className="w-3.5 h-3.5 text-[#174e36]" />
                <span>Wiederholung:</span>
              </div>
              <select
                value={recurrenceFilter}
                onChange={(e) => setRecurrenceFilter(e.target.value as any)}
                className="px-2.5 py-1.5 bg-white border border-[#d8e2db] rounded-xl text-xs text-[#171c19] outline-none cursor-pointer"
              >
                <option value="all">Alle Arten</option>
                <option value="none">Einmalig</option>
                <option value="daily">Täglich</option>
                <option value="weekly">Wöchentlich</option>
                <option value="monthly">Monatlich</option>
              </select>
            </div>

            {/* Search */}
            <div className="relative w-full sm:w-60">
              <Search className="w-3.5 h-3.5 text-[#7d8e84] absolute left-3 top-2.5" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Aufgaben suchen..."
                className="w-full pl-8 pr-3 py-1.5 bg-white border border-[#d8e2db] focus:border-[#174e36] rounded-xl text-xs text-[#171c19] placeholder-[#7d8e84] outline-none"
              />
            </div>
          </div>

          {/* Category Filter Pills */}
          <div className="flex items-center gap-1.5 overflow-x-auto pt-1">
            <button
              onClick={() => setSelectedCategory('all')}
              className={`px-3 py-1 rounded-lg text-xs font-semibold whitespace-nowrap transition-all cursor-pointer ${
                selectedCategory === 'all'
                  ? 'bg-[#174e36] text-white shadow-xs'
                  : 'bg-white text-[#52645a] border border-[#d8e2db] hover:bg-[#f3f7f4] hover:text-[#171c19]'
              }`}
            >
              Alle Bereiche
            </button>
            {categories.map((cat) => {
              const isSelected = selectedCategory === cat;
              return (
                <button
                  key={cat}
                  onClick={() => setSelectedCategory(isSelected ? 'all' : cat)}
                  className={`px-3 py-1 rounded-lg text-xs font-semibold whitespace-nowrap transition-all flex items-center gap-1.5 cursor-pointer ${
                    isSelected
                      ? 'bg-[#174e36] text-white shadow-xs'
                      : 'bg-white text-[#52645a] border border-[#d8e2db] hover:bg-[#f3f7f4] hover:text-[#171c19]'
                  }`}
                >
                  <span
                    className="w-2 h-2 rounded-full shrink-0"
                    style={{ backgroundColor: CATEGORIES_CONFIG[cat].color }}
                  />
                  <span>{cat}</span>
                </button>
              );
            })}
          </div>
        </div>

        {/* Tasks List */}
        {filteredTasks.length === 0 ? (
          <div className="bg-white rounded-2xl border border-[#e2e8e3] p-12 text-center shadow-xs">
            <CheckSquare className="w-10 h-10 text-[#9bb0a3] mx-auto mb-2" />
            <h3 className="text-sm font-semibold text-[#171c19]">Keine Aufgaben gefunden</h3>
            <p className="text-xs text-[#52645a] mt-0.5">
              Alle Filterkriterien prüfen oder neue Aufgabe oben erstellen.
            </p>
          </div>
        ) : (
          <div className="space-y-3">
            {filteredTasks.map((task) => {
              const conf = CATEGORIES_CONFIG[task.category] || CATEGORIES_CONFIG['Arbeit'];
              return (
                <div
                  key={task.id}
                  className={`p-4 bg-white rounded-2xl border border-[#e2e8e3] flex items-start justify-between gap-4 transition-all hover:border-[#174e36] shadow-xs hover:shadow-md ${
                    task.completed ? 'opacity-65 bg-[#fcfdfc]' : ''
                  }`}
                >
                  <div className="flex items-start gap-3.5 min-w-0 flex-1">
                    <input
                      type="checkbox"
                      checked={task.completed}
                      onChange={() => toggleTaskCompleted(task.id)}
                      className="mt-1 w-4 h-4 rounded text-[#174e36] bg-white border-[#b7c7be] focus:ring-[#174e36] cursor-pointer shrink-0 accent-[#174e36]"
                    />

                    <div className="min-w-0 flex-1">
                      <div className="flex flex-wrap items-center gap-2 mb-1">
                        <span
                          className={`text-[10px] font-semibold px-2 py-0.5 rounded-md border ${conf.bgLight}`}
                        >
                          {task.category}
                        </span>

                        {task.recurrence !== 'none' && (
                          <span className="flex items-center gap-1 text-[10px] font-semibold text-[#143d2b] bg-[#edf5f0] border border-[#cfe0d5] px-2 py-0.5 rounded-md">
                            <Repeat className="w-2.5 h-2.5 text-[#174e36]" />
                            <span>
                              {task.recurrence === 'daily'
                                ? 'Täglich'
                                : task.recurrence === 'weekly'
                                ? 'Wöchentlich'
                                : 'Monatlich'}
                            </span>
                          </span>
                        )}

                        {task.dueDate && (
                          <span className="text-[10px] font-semibold text-[#143d2b] bg-[#edf5f0] border border-[#cfe0d5] px-2 py-0.5 rounded-md">
                            Fällig: {task.dueDate}
                          </span>
                        )}

                        {task.sourceIdeaTitle && (
                          <span className="flex items-center gap-1 text-[10px] text-[#143d2b] bg-[#edf5f0] border border-[#cfe0d5] px-2 py-0.5 rounded-md truncate max-w-xs">
                            <Sparkles className="w-2.5 h-2.5 text-[#174e36] shrink-0" />
                            <span className="truncate">Aus Idee: {task.sourceIdeaTitle}</span>
                          </span>
                        )}
                      </div>

                      <h3
                        className={`text-sm font-semibold leading-snug ${
                          task.completed ? 'line-through text-[#94a3b8]' : 'text-[#171c19]'
                        }`}
                      >
                        {task.title}
                      </h3>

                      {task.description && (
                        <p className="text-xs text-[#52645a] mt-1 whitespace-pre-line leading-relaxed">
                          {task.description}
                        </p>
                      )}
                    </div>
                  </div>

                  <div className="flex items-center gap-1.5 shrink-0">
                    {/* Convert / Schedule in Calendar */}
                    {!task.completed && (
                      <button
                        onClick={() =>
                          openEventModal({
                            id: '',
                            userId: '',
                            title: task.title,
                            description: task.description,
                            date: task.dueDate || getTodayDateKey(),
                            time: '10:00',
                            durationMinutes: 60,
                            category: task.category,
                            recurrence: task.recurrence,
                            sourceTaskId: task.id,
                            createdAt: '',
                            updatedAt: '',
                          })
                        }
                        className="p-1.5 text-[#52645a] hover:text-[#174e36] hover:bg-[#edf5f0] rounded-lg transition-colors cursor-pointer"
                        title="Als Kalendertermin einplanen"
                      >
                        <CalendarIcon className="w-4 h-4" />
                      </button>
                    )}

                    <button
                      onClick={() => openTaskModal(task)}
                      className="p-1.5 text-[#52645a] hover:text-[#171c19] hover:bg-[#f3f7f4] rounded-lg transition-colors cursor-pointer"
                      title="Aufgabe bearbeiten"
                    >
                      <Edit2 className="w-4 h-4" />
                    </button>

                    <button
                      onClick={() => deleteTask(task.id)}
                      className="p-1.5 text-[#52645a] hover:text-rose-600 hover:bg-rose-50 rounded-lg transition-colors cursor-pointer"
                      title="Aufgabe löschen"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
};
