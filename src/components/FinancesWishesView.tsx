import React, { useState } from 'react';
import {
  PiggyBank,
  Plus,
  Sparkles,
  Target,
  ArrowRight,
  TrendingUp,
  CheckCircle2,
  Calendar as CalendarIcon,
} from 'lucide-react';
import { useApp } from '../context/AppContext';

export const FinancesWishesView: React.FC = () => {
  const { ideas, tasks, events, openIdeaModal, openEventModal, openConvertIdeaModal, setCurrentView } = useApp();

  const [wishTitle, setWishTitle] = useState('');
  const [wishBudget, setWishBudget] = useState('');

  // Financial and wish related ideas
  const financeIdeas = ideas.filter(
    (i) => i.category === 'Finanzen' || i.description?.toLowerCase().includes('spar') || i.description?.toLowerCase().includes('budget')
  );

  const financeTasks = tasks.filter((t) => t.category === 'Finanzen');
  const financeEvents = events.filter((e) => e.category === 'Finanzen');

  const handleAddWish = (e: React.FormEvent) => {
    e.preventDefault();
    if (!wishTitle.trim()) return;
    openIdeaModal({
      id: '',
      userId: '',
      title: wishTitle.trim(),
      description: wishBudget ? `Geschätztes Budget: ${wishBudget} €` : '',
      category: 'Finanzen',
      status: 'new',
      createdAt: '',
      updatedAt: '',
    });
    setWishTitle('');
    setWishBudget('');
  };

  return (
    <div className="flex-1 flex flex-col h-screen overflow-hidden bg-stone-100">
      {/* Header */}
      <header className="p-6 bg-white border-b border-stone-200 flex flex-wrap items-center justify-between gap-4 shrink-0 shadow-xs">
        <div>
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-xl bg-purple-100 text-purple-800 flex items-center justify-center font-bold">
              <PiggyBank className="w-4 h-4 text-purple-600" />
            </div>
            <h2 className="text-xl font-bold text-stone-900 tracking-tight">
              Finanzen & Lebenswünsche
            </h2>
          </div>
          <p className="text-xs text-stone-500 mt-1">
            Wünsche und finanzielle Leitplanken aus deinen Ideen ableiten
          </p>
        </div>

        <button
          onClick={() => {
            openIdeaModal({
              id: '',
              userId: '',
              title: '',
              description: '',
              category: 'Finanzen',
              status: 'new',
              createdAt: '',
              updatedAt: '',
            });
          }}
          className="flex items-center gap-1.5 px-4 py-2.5 bg-stone-900 hover:bg-stone-800 text-white rounded-xl text-xs font-semibold shadow-xs transition-all active:scale-[0.98]"
        >
          <Plus className="w-4 h-4" />
          <span>Finanz-Idee / Wunsch anlegen</span>
        </button>
      </header>

      {/* Main Content Area */}
      <div className="flex-1 overflow-y-auto p-6 space-y-6">
        {/* Quick Add Wish Card */}
        <div className="bg-white p-5 rounded-2xl border border-stone-200 shadow-xs">
          <div className="flex items-center gap-2 mb-3">
            <Sparkles className="w-4 h-4 text-purple-600" />
            <h3 className="text-sm font-bold text-stone-900">
              Neuen Wunsch oder Sparziel erfassen
            </h3>
          </div>
          <form onSubmit={handleAddWish} className="flex flex-col sm:flex-row items-center gap-3">
            <input
              type="text"
              value={wishTitle}
              onChange={(e) => setWishTitle(e.target.value)}
              placeholder="z. B. Japan-Reise im Herbst oder Notgroschen aufstocken..."
              className="flex-1 w-full px-4 py-2.5 bg-stone-50 border border-stone-200 rounded-xl text-xs sm:text-sm text-stone-900 outline-none focus:border-stone-900"
            />
            <input
              type="number"
              value={wishBudget}
              onChange={(e) => setWishBudget(e.target.value)}
              placeholder="Budget (€)"
              className="w-full sm:w-32 px-3 py-2.5 bg-stone-50 border border-stone-200 rounded-xl text-xs sm:text-sm text-stone-900 outline-none focus:border-stone-900"
            />
            <button
              type="submit"
              disabled={!wishTitle.trim()}
              className="w-full sm:w-auto px-5 py-2.5 bg-purple-600 hover:bg-purple-500 disabled:opacity-50 text-white rounded-xl text-xs font-bold transition-all shadow-xs shrink-0"
            >
              Festhalten
            </button>
          </form>
        </div>

        {/* Ideas evolved into financial plans */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Wishes & Ideas */}
          <div className="bg-white rounded-2xl border border-stone-200 p-5 shadow-xs">
            <h3 className="text-sm font-bold text-stone-900 mb-3 flex items-center gap-2">
              <Target className="w-4 h-4 text-amber-500" />
              <span>Gesammelte Wünsche & Finanz-Ideen ({financeIdeas.length})</span>
            </h3>

            {financeIdeas.length === 0 ? (
              <p className="text-xs text-stone-400 py-8 text-center">
                Noch keine Ideen in der Kategorie Finanzen gesammelt.
              </p>
            ) : (
              <div className="space-y-3">
                {financeIdeas.map((item) => (
                  <div
                    key={item.id}
                    className="p-3.5 bg-stone-50 rounded-xl border border-stone-200/80 flex items-center justify-between gap-3"
                  >
                    <div>
                      <h4 className="text-xs font-bold text-stone-900">{item.title}</h4>
                      {item.description && (
                        <p className="text-[11px] text-stone-600 mt-0.5 line-clamp-2">
                          {item.description}
                        </p>
                      )}
                    </div>
                    <button
                      onClick={() => openConvertIdeaModal(item)}
                      className="px-3 py-1.5 bg-white border border-stone-200 hover:border-stone-400 rounded-lg text-xs font-semibold text-stone-800 shrink-0 flex items-center gap-1 shadow-xs transition-colors"
                    >
                      <Sparkles className="w-3 h-3 text-amber-500" />
                      <span>Weiterentwickeln</span>
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Active financial tasks & review appointments */}
          <div className="space-y-6">
            {/* Tasks */}
            <div className="bg-white rounded-2xl border border-stone-200 p-5 shadow-xs">
              <h3 className="text-sm font-bold text-stone-900 mb-3 flex items-center gap-2">
                <TrendingUp className="w-4 h-4 text-emerald-600" />
                <span>Konkrete Finanz-Aufgaben ({financeTasks.length})</span>
              </h3>
              {financeTasks.length === 0 ? (
                <p className="text-xs text-stone-400 py-4 text-center">
                  Keine offenen Finanzaufgaben.
                </p>
              ) : (
                <div className="space-y-2">
                  {financeTasks.map((t) => (
                    <div
                      key={t.id}
                      className="p-3 bg-emerald-50/50 rounded-xl border border-emerald-100 flex items-center justify-between text-xs"
                    >
                      <span className={t.completed ? 'line-through text-stone-400' : 'font-semibold text-stone-900'}>
                        {t.title}
                      </span>
                      {t.dueDate && (
                        <span className="text-[10px] font-semibold text-stone-500">
                          {t.dueDate}
                        </span>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Calendar Financial Reviews */}
            <div className="bg-white rounded-2xl border border-stone-200 p-5 shadow-xs">
              <h3 className="text-sm font-bold text-stone-900 mb-3 flex items-center gap-2">
                <CalendarIcon className="w-4 h-4 text-blue-600" />
                <span>Geplante Finanz-Reviews im Kalender</span>
              </h3>
              {financeEvents.length === 0 ? (
                <div className="text-center py-4">
                  <p className="text-xs text-stone-400">
                    Noch keine monatlichen Finanz-Checks eingeplant.
                  </p>
                  <button
                    onClick={() =>
                      openEventModal({
                        id: '',
                        userId: '',
                        title: 'Monatlicher Finanz-Check & Budget',
                        date: new Date().toISOString().split('T')[0],
                        time: '11:00',
                        durationMinutes: 45,
                        category: 'Finanzen',
                        recurrence: 'monthly',
                        createdAt: '',
                        updatedAt: '',
                      })
                    }
                    className="mt-2 text-xs font-semibold text-blue-600 hover:underline"
                  >
                    + Monatlichen Budget-Check einplanen
                  </button>
                </div>
              ) : (
                <div className="space-y-2">
                  {financeEvents.map((e) => (
                    <div
                      key={e.id}
                      className="p-3 bg-amber-50/40 rounded-xl border border-amber-200/60 flex items-center justify-between text-xs"
                    >
                      <div className="flex items-center gap-2">
                        <span className="font-bold text-amber-900">{e.time}</span>
                        <span className="font-medium text-stone-900">{e.title}</span>
                      </div>
                      <span className="text-[11px] text-stone-500 font-medium">{e.date}</span>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
