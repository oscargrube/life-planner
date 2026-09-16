import React, { useState } from 'react';
import {
  Lightbulb,
  Plus,
  Sparkles,
  ArrowRight,
  ArrowUpDown,
  Search,
  CheckCircle2,
  Trash2,
  Edit2,
} from 'lucide-react';
import { useApp } from '../context/AppContext';
import { Category, CATEGORIES_CONFIG } from '../types';

export const IdeasView: React.FC = () => {
  const {
    ideas,
    selectedCategory,
    setSelectedCategory,
    openIdeaModal,
    deleteIdea,
    openConvertIdeaModal,
    addIdea,
  } = useApp();

  const [quickTitle, setQuickTitle] = useState('');
  const [quickCategory, setQuickCategory] = useState<Category>('Persönlich');
  const [searchQuery, setSearchQuery] = useState('');
  const [sortBy, setSortBy] = useState<'newest' | 'oldest' | 'category' | 'title'>('newest');

  const categories = Object.keys(CATEGORIES_CONFIG) as Category[];

  const handleQuickAdd = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!quickTitle.trim()) return;
    await addIdea({
      title: quickTitle.trim(),
      category: quickCategory,
    });
    setQuickTitle('');
  };

  // Filter ideas
  const filteredIdeas = ideas.filter((idea) => {
    const matchesCategory =
      selectedCategory === 'all' || idea.category === selectedCategory;
    const matchesSearch =
      searchQuery.trim() === '' ||
      idea.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (idea.description && idea.description.toLowerCase().includes(searchQuery.toLowerCase()));
    return matchesCategory && matchesSearch;
  });

  // Sort ideas
  const sortedIdeas = [...filteredIdeas].sort((a, b) => {
    if (sortBy === 'newest') {
      return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
    } else if (sortBy === 'oldest') {
      return new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime();
    } else if (sortBy === 'category') {
      return a.category.localeCompare(b.category);
    } else {
      return a.title.localeCompare(b.title);
    }
  });

  return (
    <div className="flex-1 flex flex-col h-screen overflow-hidden bg-[#f8faf8] text-[#171c19]">
      {/* Header */}
      <header className="p-6 bg-white border-b border-[#e2e8e3] flex flex-wrap items-center justify-between gap-4 shrink-0 shadow-xs">
        <div>
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-xl bg-[#edf5f0] border border-[#cfe0d5] text-[#174e36] flex items-center justify-center font-bold shadow-xs">
              <Lightbulb className="w-5 h-5 text-[#174e36]" />
            </div>
            <h2 className="text-xl font-bold text-[#171c19] tracking-tight">
              Ideen-Inkubator
            </h2>
          </div>
          <p className="text-xs text-[#52645a] mt-1">
            Sammle freie Gedanken und entwickle sie schrittweise zu Aufgaben oder Kalenderterminen
          </p>
        </div>

        <button
          id="add-new-idea-btn"
          onClick={() => openIdeaModal()}
          className="flex items-center gap-1.5 px-4 py-2.5 bg-[#174e36] hover:bg-[#12402c] active:scale-[0.98] text-white rounded-xl text-xs font-semibold shadow-xs transition-all cursor-pointer"
        >
          <Plus className="w-4 h-4" />
          <span>Ausführliche Idee erfassen</span>
        </button>
      </header>

      {/* Main Content Area */}
      <div className="flex-1 overflow-y-auto p-6 space-y-6">
        {/* Quick Capture Bar */}
        <div className="bg-white p-4 rounded-2xl border border-[#e2e8e3] shadow-xs">
          <form onSubmit={handleQuickAdd} className="flex flex-col sm:flex-row items-center gap-3">
            <div className="relative flex-1 w-full">
              <Lightbulb className="w-4 h-4 text-[#174e36] absolute left-3.5 top-3.5" />
              <input
                type="text"
                value={quickTitle}
                onChange={(e) => setQuickTitle(e.target.value)}
                placeholder="Neue Idee im Kopf? Tippe sie schnell hier ein (z. B. Neues Sachbuch lesen)..."
                className="w-full pl-10 pr-4 py-2.5 bg-[#f8faf8] hover:bg-white focus:bg-white border border-[#d8e2db] focus:border-[#174e36] rounded-xl text-sm text-[#171c19] placeholder-[#7d8e84] outline-none transition-all"
              />
            </div>

            <div className="flex items-center gap-2 w-full sm:w-auto">
              <select
                value={quickCategory}
                onChange={(e) => setQuickCategory(e.target.value as Category)}
                className="px-3 py-2.5 bg-[#f8faf8] border border-[#d8e2db] rounded-xl text-xs font-medium text-[#171c19] outline-none cursor-pointer"
              >
                {categories.map((c) => (
                  <option key={c} value={c} className="bg-white text-[#171c19]">
                    {c}
                  </option>
                ))}
              </select>

              <button
                type="submit"
                disabled={!quickTitle.trim()}
                className="px-4 py-2.5 bg-[#174e36] hover:bg-[#12402c] disabled:opacity-40 text-white rounded-xl text-xs font-bold transition-all shadow-xs shrink-0 cursor-pointer"
              >
                Festhalten
              </button>
            </div>
          </form>
        </div>

        {/* Filter & Sort Controls */}
        <div className="flex flex-wrap items-center justify-between gap-3">
          {/* Category Pills */}
          <div className="flex items-center gap-1.5 overflow-x-auto py-1 max-w-2xl">
            <button
              onClick={() => setSelectedCategory('all')}
              className={`px-3.5 py-1.5 rounded-xl text-xs font-semibold whitespace-nowrap transition-all cursor-pointer ${
                selectedCategory === 'all'
                  ? 'bg-[#174e36] text-white shadow-xs'
                  : 'bg-white text-[#52645a] border border-[#d8e2db] hover:bg-[#f3f7f4] hover:text-[#171c19]'
              }`}
            >
              Alle ({ideas.length})
            </button>
            {categories.map((cat) => {
              const count = ideas.filter((i) => i.category === cat).length;
              const isSelected = selectedCategory === cat;
              return (
                <button
                  key={cat}
                  onClick={() => setSelectedCategory(isSelected ? 'all' : cat)}
                  className={`px-3 py-1.5 rounded-xl text-xs font-semibold whitespace-nowrap transition-all flex items-center gap-1.5 cursor-pointer ${
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
                  <span className="text-[10px] opacity-75">({count})</span>
                </button>
              );
            })}
          </div>

          {/* Search and Sort */}
          <div className="flex items-center gap-2 w-full sm:w-auto">
            <div className="relative flex-1 sm:w-48">
              <Search className="w-3.5 h-3.5 text-[#7d8e84] absolute left-3 top-2.5" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Ideen durchsuchen..."
                className="w-full pl-8 pr-3 py-1.5 bg-white border border-[#d8e2db] focus:border-[#174e36] rounded-xl text-xs text-[#171c19] placeholder-[#7d8e84] outline-none"
              />
            </div>

            <div className="flex items-center gap-1 bg-white border border-[#d8e2db] rounded-xl px-2 py-1">
              <ArrowUpDown className="w-3.5 h-3.5 text-[#7d8e84]" />
              <select
                value={sortBy}
                onChange={(e) => setSortBy(e.target.value as any)}
                className="text-xs bg-transparent text-[#52645a] outline-none font-medium cursor-pointer"
              >
                <option value="newest">Neueste zuerst</option>
                <option value="oldest">Älteste zuerst</option>
                <option value="category">Nach Kategorie</option>
                <option value="title">Alphabetisch</option>
              </select>
            </div>
          </div>
        </div>

        {/* Ideas Grid */}
        {sortedIdeas.length === 0 ? (
          <div className="bg-white rounded-2xl border border-[#e2e8e3] p-12 text-center shadow-xs">
            <div className="w-12 h-12 rounded-2xl bg-[#edf5f0] border border-[#cfe0d5] text-[#174e36] flex items-center justify-center mx-auto mb-3">
              <Lightbulb className="w-6 h-6" />
            </div>
            <h3 className="text-base font-semibold text-[#171c19]">Keine Ideen gefunden</h3>
            <p className="text-xs text-[#52645a] max-w-sm mx-auto mt-1">
              {searchQuery
                ? 'Passe deine Suchbegriffe an oder setze den Kategoriefilter zurück.'
                : 'Nutze die Schnellerfassung oben, um deinen ersten Gedanken festzuhalten!'}
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {sortedIdeas.map((idea) => {
              const conf = CATEGORIES_CONFIG[idea.category] || CATEGORIES_CONFIG['Persönlich'];
              const isConverted = idea.status === 'converted';

              return (
                <div
                  key={idea.id}
                  className="bg-white rounded-2xl border border-[#e2e8e3] hover:border-[#174e36] p-5 flex flex-col justify-between hover:shadow-md transition-all group"
                >
                  <div>
                    {/* Category & Status */}
                    <div className="flex items-center justify-between gap-2 mb-3">
                      <span
                        className={`text-[11px] font-semibold px-2.5 py-0.5 rounded-full border ${conf.bgLight}`}
                      >
                        {idea.category}
                      </span>

                      {isConverted ? (
                        <span className="flex items-center gap-1 text-[11px] text-[#174e36] bg-[#edf5f0] border border-[#cfe0d5] px-2 py-0.5 rounded-full font-medium">
                          <CheckCircle2 className="w-3 h-3" />
                          <span>Weiterentwickelt</span>
                        </span>
                      ) : (
                        <span className="text-[10px] text-[#6b7d72] font-medium">
                          {new Date(idea.createdAt).toLocaleDateString('de-DE')}
                        </span>
                      )}
                    </div>

                    {/* Title */}
                    <h3 className="text-base font-bold text-[#171c19] leading-snug group-hover:text-[#174e36] transition-colors">
                      {idea.title}
                    </h3>

                    {/* Description */}
                    {idea.description ? (
                      <p className="text-xs text-[#52645a] mt-2 line-clamp-4 whitespace-pre-line leading-relaxed">
                        {idea.description}
                      </p>
                    ) : (
                      <p className="text-xs text-[#7d8e84] italic mt-2">
                        Noch keine Details hinterlegt
                      </p>
                    )}
                  </div>

                  {/* Actions & Evolution CTA */}
                  <div className="mt-5 pt-3 border-t border-[#e8eee9] flex items-center justify-between gap-2">
                    <div className="flex items-center gap-1">
                      <button
                        onClick={() => openIdeaModal(idea)}
                        className="p-1.5 text-[#6b7d72] hover:text-[#171c19] hover:bg-[#f3f7f4] rounded-lg transition-colors cursor-pointer"
                        title="Idee bearbeiten"
                      >
                        <Edit2 className="w-3.5 h-3.5" />
                      </button>
                      <button
                        onClick={() => deleteIdea(idea.id)}
                        className="p-1.5 text-[#6b7d72] hover:text-rose-600 hover:bg-rose-50 rounded-lg transition-colors cursor-pointer"
                        title="Idee löschen"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>

                    <button
                      onClick={() => openConvertIdeaModal(idea)}
                      className="flex items-center gap-1.5 px-3 py-1.5 bg-[#174e36] hover:bg-[#12402c] active:scale-[0.98] text-white rounded-xl text-xs font-semibold shadow-xs transition-all cursor-pointer"
                    >
                      <Sparkles className="w-3.5 h-3.5 text-emerald-300" />
                      <span>Weiterentwickeln</span>
                      <ArrowRight className="w-3 h-3" />
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
