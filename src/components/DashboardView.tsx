import React, { useState } from 'react';
import {
  Calendar as CalendarIcon,
  CheckSquare,
  Lightbulb,
  Sparkles,
  ArrowRight,
  Clock,
  Repeat,
  Plus,
  TrendingUp,
  Target,
} from 'lucide-react';
import { useApp } from '../context/AppContext';
import { CATEGORIES_CONFIG, Category } from '../types';

export const DashboardView: React.FC = () => {
  const {
    user,
    ideas,
    tasks,
    events,
    setCurrentView,
    toggleTaskCompleted,
    openConvertIdeaModal,
    openEventModal,
    openIdeaModal,
    addIdea,
  } = useApp();

  const [quickTitle, setQuickTitle] = useState('');
  const [quickCategory, setQuickCategory] = useState<Category>('Persönlich');

  const todayStr = new Date().toISOString().split('T')[0];
  const todayEvents = events
    .filter((e) => e.date === todayStr)
    .sort((a, b) => a.time.localeCompare(b.time));

  const upcomingTasks = tasks
    .filter((t) => !t.completed)
    .slice(0, 5);

  const unconvertedIdeas = ideas
    .filter((i) => i.status !== 'converted')
    .slice(0, 3);

  const handleQuickAdd = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!quickTitle.trim()) return;
    await addIdea({
      title: quickTitle.trim(),
      category: quickCategory,
    });
    setQuickTitle('');
  };

  const categories = Object.keys(CATEGORIES_CONFIG) as Category[];

  // Life sphere counts
  const categoryStats = categories.map((cat) => {
    const ideaCount = ideas.filter((i) => i.category === cat).length;
    const taskCount = tasks.filter((t) => t.category === cat).length;
    const eventCount = events.filter((e) => e.category === cat).length;
    return {
      category: cat,
      total: ideaCount + taskCount + eventCount,
      config: CATEGORIES_CONFIG[cat],
    };
  }).filter((item) => item.total > 0);

  return (
    <div className="flex-1 flex flex-col h-screen overflow-hidden bg-stone-100">
      {/* Header */}
      <header className="p-6 bg-white border-b border-stone-200 flex flex-wrap items-center justify-between gap-4 shrink-0 shadow-xs">
        <div>
          <h2 className="text-xl font-bold text-stone-900 tracking-tight">
            Willkommen zurück{user?.displayName ? `, ${user.displayName.split(' ')[0]}` : ''}!
          </h2>
          <p className="text-xs text-stone-500 mt-1">
            {new Date().toLocaleDateString('de-DE', {
              weekday: 'long',
              day: 'numeric',
              month: 'long',
              year: 'numeric',
            })}{' '}
            — Dein persönlicher Lebensplanungs-Überblick
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={() => setCurrentView('calendar')}
            className="flex items-center gap-1.5 px-3.5 py-2 bg-stone-100 hover:bg-stone-200/80 text-stone-800 rounded-xl text-xs font-semibold transition-colors"
          >
            <CalendarIcon className="w-4 h-4 text-stone-600" />
            <span>Zum Kalender</span>
          </button>
          <button
            onClick={() => openIdeaModal()}
            className="flex items-center gap-1.5 px-3.5 py-2 bg-amber-500 hover:bg-amber-400 text-stone-950 rounded-xl text-xs font-bold transition-all shadow-xs"
          >
            <Sparkles className="w-4 h-4" />
            <span>Neue Idee notieren</span>
          </button>
        </div>
      </header>

      {/* Main Dashboard Scrollable View */}
      <div className="flex-1 overflow-y-auto p-6 space-y-6">
        {/* Metric Cards Row */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <div
            onClick={() => setCurrentView('ideas')}
            className="bg-white p-5 rounded-2xl border border-stone-200 hover:border-amber-400 cursor-pointer shadow-xs transition-all hover:shadow-md group"
          >
            <div className="flex items-center justify-between mb-3">
              <span className="text-xs font-semibold text-stone-500">Gesammelte Ideen</span>
              <div className="w-8 h-8 rounded-xl bg-amber-100 text-amber-800 flex items-center justify-center">
                <Lightbulb className="w-4 h-4 text-amber-600" />
              </div>
            </div>
            <div className="text-2xl font-black text-stone-900">{ideas.length}</div>
            <div className="text-[11px] text-stone-500 mt-1 flex items-center gap-1">
              <span>{ideas.filter((i) => i.status !== 'converted').length} noch zu entwickeln</span>
              <ArrowRight className="w-3 h-3 text-stone-400 group-hover:translate-x-1 transition-transform" />
            </div>
          </div>

          <div
            onClick={() => setCurrentView('calendar')}
            className="bg-white p-5 rounded-2xl border border-stone-200 hover:border-blue-400 cursor-pointer shadow-xs transition-all hover:shadow-md group"
          >
            <div className="flex items-center justify-between mb-3">
              <span className="text-xs font-semibold text-stone-500">Heutige Termine</span>
              <div className="w-8 h-8 rounded-xl bg-blue-100 text-blue-800 flex items-center justify-center">
                <CalendarIcon className="w-4 h-4 text-blue-600" />
              </div>
            </div>
            <div className="text-2xl font-black text-stone-900">{todayEvents.length}</div>
            <div className="text-[11px] text-stone-500 mt-1 flex items-center gap-1">
              <span>{events.length} im gesamten Kalender</span>
              <ArrowRight className="w-3 h-3 text-stone-400 group-hover:translate-x-1 transition-transform" />
            </div>
          </div>

          <div
            onClick={() => setCurrentView('tasks')}
            className="bg-white p-5 rounded-2xl border border-stone-200 hover:border-emerald-400 cursor-pointer shadow-xs transition-all hover:shadow-md group"
          >
            <div className="flex items-center justify-between mb-3">
              <span className="text-xs font-semibold text-stone-500">Offene Aufgaben</span>
              <div className="w-8 h-8 rounded-xl bg-emerald-100 text-emerald-800 flex items-center justify-center">
                <CheckSquare className="w-4 h-4 text-emerald-600" />
              </div>
            </div>
            <div className="text-2xl font-black text-stone-900">
              {tasks.filter((t) => !t.completed).length}
            </div>
            <div className="text-[11px] text-stone-500 mt-1 flex items-center gap-1">
              <span>{tasks.filter((t) => t.completed).length} erledigt</span>
              <ArrowRight className="w-3 h-3 text-stone-400 group-hover:translate-x-1 transition-transform" />
            </div>
          </div>

          <div
            onClick={() => setCurrentView('finances')}
            className="bg-white p-5 rounded-2xl border border-stone-200 hover:border-purple-400 cursor-pointer shadow-xs transition-all hover:shadow-md group"
          >
            <div className="flex items-center justify-between mb-3">
              <span className="text-xs font-semibold text-stone-500">Finanzen & Wünsche</span>
              <div className="w-8 h-8 rounded-xl bg-purple-100 text-purple-800 flex items-center justify-center">
                <Target className="w-4 h-4 text-purple-600" />
              </div>
            </div>
            <div className="text-2xl font-black text-stone-900">
              {ideas.filter((i) => i.category === 'Finanzen').length}
            </div>
            <div className="text-[11px] text-stone-500 mt-1 flex items-center gap-1">
              <span>Finanzielle Meilensteine</span>
              <ArrowRight className="w-3 h-3 text-stone-400 group-hover:translate-x-1 transition-transform" />
            </div>
          </div>
        </div>

        {/* Quick Idea Scratchpad */}
        <div className="bg-gradient-to-r from-amber-500/10 via-orange-500/10 to-amber-500/5 p-5 rounded-2xl border border-amber-200/80 shadow-xs">
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center gap-2">
              <Sparkles className="w-4 h-4 text-amber-600" />
              <h3 className="text-sm font-bold text-stone-900">
                Spontane Idee? Halte sie direkt fest:
              </h3>
            </div>
            <span className="text-[11px] text-stone-500">
              Ideen bilden das Fundament aller Aufgaben & Termine
            </span>
          </div>

          <form onSubmit={handleQuickAdd} className="flex flex-col sm:flex-row items-center gap-3">
            <input
              type="text"
              value={quickTitle}
              onChange={(e) => setQuickTitle(e.target.value)}
              placeholder="z. B. 10km Trainingslauf am Wochenende planen..."
              className="flex-1 w-full px-4 py-2.5 bg-white border border-stone-300 focus:border-stone-900 rounded-xl text-sm text-stone-900 outline-none"
            />
            <div className="flex items-center gap-2 w-full sm:w-auto">
              <select
                value={quickCategory}
                onChange={(e) => setQuickCategory(e.target.value as Category)}
                className="px-3 py-2.5 bg-white border border-stone-300 rounded-xl text-xs font-semibold text-stone-700 outline-none"
              >
                {categories.map((c) => (
                  <option key={c} value={c}>
                    {c}
                  </option>
                ))}
              </select>
              <button
                type="submit"
                disabled={!quickTitle.trim()}
                className="px-5 py-2.5 bg-stone-900 hover:bg-stone-800 disabled:opacity-50 text-white rounded-xl text-xs font-bold transition-all shadow-xs shrink-0"
              >
                Sammeln
              </button>
            </div>
          </form>
        </div>

        {/* Two-Column Layout: Today's Schedule & Pending Tasks */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Today's Schedule */}
          <div className="bg-white rounded-2xl border border-stone-200 p-5 shadow-xs flex flex-col">
            <div className="flex items-center justify-between pb-3 border-b border-stone-100 mb-4">
              <div className="flex items-center gap-2">
                <CalendarIcon className="w-4 h-4 text-blue-600" />
                <h3 className="text-sm font-bold text-stone-900">
                  Heutiger Zeitplan ({todayEvents.length})
                </h3>
              </div>
              <button
                onClick={() => openEventModal(undefined, todayStr)}
                className="text-xs font-semibold text-blue-600 hover:text-blue-800 flex items-center gap-1"
              >
                <Plus className="w-3.5 h-3.5" />
                <span>Termin hinzufügen</span>
              </button>
            </div>

            {todayEvents.length === 0 ? (
              <div className="py-10 text-center text-stone-400 my-auto">
                <p className="text-xs font-medium">Heute sind noch keine Termine eingetragen.</p>
                <p className="text-[11px] text-stone-500 mt-0.5">
                  Nutze den Kalender, um Zeitblöcke einzuteilen.
                </p>
              </div>
            ) : (
              <div className="space-y-2.5 overflow-y-auto max-h-[300px]">
                {todayEvents.map((evt) => {
                  const conf = CATEGORIES_CONFIG[evt.category] || CATEGORIES_CONFIG['Arbeit'];
                  return (
                    <div
                      key={evt.id}
                      onClick={() => openEventModal(evt)}
                      className={`p-3 rounded-xl border flex items-center justify-between cursor-pointer hover:shadow-xs transition-all ${conf.bgLight}`}
                    >
                      <div className="flex items-center gap-3">
                        <div className="text-xs font-bold px-2 py-1 bg-white/80 rounded-md text-[#174e36]">
                          {evt.time}
                        </div>
                        <div>
                          <h4 className="text-xs font-semibold text-stone-900">{evt.title}</h4>
                          <div className="flex items-center gap-2 text-[10px] text-stone-500 mt-0.5">
                            <span>{evt.durationMinutes} Min</span>
                            <span>•</span>
                            <span>{evt.category}</span>
                            {evt.recurrence !== 'none' && (
                              <>
                                <span>•</span>
                                <span className="flex items-center gap-0.5">
                                  <Repeat className="w-2.5 h-2.5" />
                                  {evt.recurrence}
                                </span>
                              </>
                            )}
                          </div>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>

          {/* Pending Tasks */}
          <div className="bg-white rounded-2xl border border-stone-200 p-5 shadow-xs flex flex-col">
            <div className="flex items-center justify-between pb-3 border-b border-stone-100 mb-4">
              <div className="flex items-center gap-2">
                <CheckSquare className="w-4 h-4 text-emerald-600" />
                <h3 className="text-sm font-bold text-stone-900">
                  Wichtige Aufgaben ({upcomingTasks.length})
                </h3>
              </div>
              <button
                onClick={() => setCurrentView('tasks')}
                className="text-xs font-semibold text-emerald-700 hover:text-emerald-900 flex items-center gap-1"
              >
                <span>Alle ansehen</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </button>
            </div>

            {upcomingTasks.length === 0 ? (
              <div className="py-10 text-center text-stone-400 my-auto">
                <p className="text-xs font-medium">Alle anstehenden Aufgaben erledigt!</p>
              </div>
            ) : (
              <div className="space-y-2.5 overflow-y-auto max-h-[300px]">
                {upcomingTasks.map((task) => {
                  const conf = CATEGORIES_CONFIG[task.category] || CATEGORIES_CONFIG['Arbeit'];
                  return (
                    <div
                      key={task.id}
                      className="p-3 bg-stone-50 hover:bg-stone-100/70 rounded-xl border border-stone-200 flex items-center justify-between transition-colors"
                    >
                      <div className="flex items-center gap-3 min-w-0">
                        <input
                          type="checkbox"
                          checked={task.completed}
                          onChange={() => toggleTaskCompleted(task.id)}
                          className="w-4 h-4 rounded text-emerald-600 focus:ring-emerald-500 border-stone-300 cursor-pointer shrink-0"
                        />
                        <div className="min-w-0">
                          <h4 className="text-xs font-semibold text-stone-900 truncate">
                            {task.title}
                          </h4>
                          <div className="flex items-center gap-2 text-[10px] text-stone-500 mt-0.5">
                            <span
                              className={`px-1.5 py-0.5 rounded font-medium ${conf.bgLight}`}
                            >
                              {task.category}
                            </span>
                            {task.dueDate && (
                              <span className="font-semibold">Fällig: {task.dueDate}</span>
                            )}
                            {task.recurrence !== 'none' && (
                              <span className="flex items-center gap-0.5">
                                <Repeat className="w-2.5 h-2.5" />
                                {task.recurrence}
                              </span>
                            )}
                          </div>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </div>

        {/* Evolution Spotlight: Unconverted Ideas */}
        <div className="bg-white rounded-2xl border border-stone-200 p-5 shadow-xs">
          <div className="flex items-center justify-between pb-3 border-b border-stone-100 mb-4">
            <div>
              <h3 className="text-sm font-bold text-stone-900 flex items-center gap-2">
                <Sparkles className="w-4 h-4 text-amber-500" />
                <span>Ideen zur Weiterentwicklung bereit</span>
              </h3>
              <p className="text-xs text-stone-500">
                Verwandle deine gesammelten Gedanken jetzt in verbindliche Aufgaben oder Termine
              </p>
            </div>
            <button
              onClick={() => setCurrentView('ideas')}
              className="text-xs font-semibold text-amber-700 hover:text-amber-900 flex items-center gap-1"
            >
              <span>Alle Ideen</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {unconvertedIdeas.map((idea) => {
              const conf = CATEGORIES_CONFIG[idea.category] || CATEGORIES_CONFIG['Persönlich'];
              return (
                <div
                  key={idea.id}
                  className="p-4 rounded-xl border border-stone-200 hover:border-amber-300 bg-stone-50/50 flex flex-col justify-between hover:shadow-xs transition-all"
                >
                  <div>
                    <span
                      className={`text-[10px] font-semibold px-2 py-0.5 rounded-full border inline-block mb-2 ${conf.bgLight}`}
                    >
                      {idea.category}
                    </span>
                    <h4 className="text-xs font-bold text-stone-900 leading-snug">{idea.title}</h4>
                    {idea.description && (
                      <p className="text-[11px] text-stone-600 mt-1 line-clamp-2">
                        {idea.description}
                      </p>
                    )}
                  </div>
                  <button
                    onClick={() => openConvertIdeaModal(idea)}
                    className="mt-3 w-full py-1.5 px-2 bg-stone-900 hover:bg-stone-800 text-white rounded-lg text-xs font-semibold flex items-center justify-center gap-1.5 transition-colors"
                  >
                    <span>Weiterentwickeln</span>
                    <ArrowRight className="w-3 h-3" />
                  </button>
                </div>
              );
            })}
          </div>
        </div>

        {/* Life Spheres Overview */}
        {categoryStats.length > 0 && (
          <div className="bg-white rounded-2xl border border-stone-200 p-5 shadow-xs">
            <h3 className="text-sm font-bold text-stone-900 mb-3 flex items-center gap-2">
              <TrendingUp className="w-4 h-4 text-stone-600" />
              <span>Verteilung nach Lebensbereichen</span>
            </h3>
            <div className="grid grid-cols-2 sm:grid-cols-4 md:grid-cols-6 gap-3">
              {categoryStats.map((item) => (
                <div
                  key={item.category}
                  className="p-3 bg-stone-50 rounded-xl border border-stone-200 text-center"
                >
                  <div
                    className="w-3 h-3 rounded-full mx-auto mb-1.5"
                    style={{ backgroundColor: item.config.color }}
                  />
                  <div className="text-xs font-bold text-stone-900">{item.category}</div>
                  <div className="text-[11px] text-stone-500 font-semibold mt-0.5">
                    {item.total} Einträge
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
