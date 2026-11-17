import React from 'react';
import {
  Lightbulb,
  Plus,
  Sparkles,
  ArrowRight,
  CheckCircle2,
  Trash2,
  Edit2,
  Menu,
} from 'lucide-react';
import { useApp } from '../context/AppContext';
import { useUI } from '../context/UIContext';
import { Category, CATEGORIES_CONFIG } from '../types';

export const IdeasPage: React.FC = () => {
  const { setMobileSidebarOpen } = useUI();
  const {
    ideas,
    selectedCategory,
    setSelectedCategory,
    openIdeaModal,
    deleteIdea,
    openConvertIdeaModal,
    addIdea,
  } = useApp();

  const categories = Object.keys(CATEGORIES_CONFIG) as Category[];

  // Filter ideas
  const filteredIdeas = ideas.filter((idea) => {
    return selectedCategory === 'all' || idea.category === selectedCategory;
  });

  // Sort ideas (always newest first now since sort dropdown is gone)
  const sortedIdeas = [...filteredIdeas].sort((a, b) => {
    return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
  });

  return (
    <div className="flex-1 flex flex-col h-full overflow-hidden bg-[#f8faf8] text-[#171c19]">
      {/* Header */}
      <header className="p-4 sm:p-6 bg-white border-b border-[#e2e8e3] flex flex-wrap items-center justify-between gap-4 shrink-0 shadow-xs">
        <div>
          <div className="flex items-center gap-2.5">
            <button
              onClick={() => setMobileSidebarOpen(true)}
              className="md:hidden p-1.5 -ml-1.5 text-[#52645a] hover:bg-[#f4f7f5] rounded-lg transition-colors"
            >
              <Menu className="w-6 h-6" />
            </button>
            <div className="hidden sm:flex w-9 h-9 rounded-xl bg-[#edf5f0] border border-[#cfe0d5] text-[#174e36] items-center justify-center font-bold shadow-xs">
              <Lightbulb className="w-5 h-5 text-[#174e36]" />
            </div>
            <h2 className="text-xl font-bold text-[#171c19] tracking-tight">
              Ideen
            </h2>
          </div>
        </div>

        <button
          id="add-new-idea-btn"
          onClick={() => openIdeaModal()}
          className="flex items-center gap-1.5 px-3 sm:px-4 py-2 sm:py-2.5 bg-[#174e36] hover:bg-[#12402c] active:scale-[0.98] text-white rounded-xl text-xs font-semibold shadow-xs transition-all cursor-pointer"
        >
          <Plus className="w-4 h-4" />
          <span className="hidden sm:inline">Neue Idee</span>
          <span className="sm:hidden">Neu</span>
        </button>
      </header>

      {/* Main Content Area */}
      <div className="flex-1 overflow-y-auto p-4 sm:p-6 space-y-6">

        {/* Category Pills */}
        <div className="flex flex-nowrap items-center gap-2 w-full overflow-x-auto pb-1 [&::-webkit-scrollbar]:hidden [-ms-overflow-style:none] [scrollbar-width:none]">
          <button
            onClick={() => setSelectedCategory('all')}
            className={`px-3.5 py-1.5 rounded-xl text-xs font-semibold transition-all cursor-pointer ${
              selectedCategory === 'all'
                ? 'bg-[#174e36] text-white shadow-xs'
                : 'bg-white text-[#52645a] border border-[#d8e2db] hover:bg-[#f3f7f4] hover:text-[#171c19]'
            }`}
          >
            Alle
          </button>
          {categories.map((cat) => {
            const isSelected = selectedCategory === cat;
            return (
              <button
                key={cat}
                onClick={() => setSelectedCategory(isSelected ? 'all' : cat)}
                className={`px-3 py-1.5 rounded-xl text-xs font-semibold transition-all flex items-center gap-1.5 cursor-pointer ${
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

        {/* Ideas Grid */}
        {sortedIdeas.length === 0 ? (
          <div className="bg-white rounded-2xl border border-[#e2e8e3] p-12 text-center shadow-xs">
            <div className="w-12 h-12 rounded-2xl bg-[#edf5f0] border border-[#cfe0d5] text-[#174e36] flex items-center justify-center mx-auto mb-3">
              <Lightbulb className="w-6 h-6" />
            </div>
            <h3 className="text-base font-semibold text-[#171c19]">Keine Ideen gefunden</h3>
            <p className="text-xs text-[#52645a] max-w-sm mx-auto mt-1">
              Klicke oben auf "Neue Idee", um deinen ersten Gedanken festzuhalten!
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 md:gap-4 lg:gap-5 pb-8">
            {sortedIdeas.map((idea) => {
              const conf = CATEGORIES_CONFIG[idea.category] || CATEGORIES_CONFIG['Persönlich'];
              const isConverted = idea.status === 'converted';

              return (
                <div
                  key={idea.id}
                  onClick={() => openIdeaModal(idea)}
                  className="bg-white rounded-2xl border border-[#e2e8e3] hover:border-[#174e36] p-5 flex flex-col hover:shadow-md transition-all group cursor-pointer"
                >
                  {/* Category & Status / Actions */}
                  <div className="flex items-center justify-between gap-2 mb-3">
                    <span
                      className={`text-[11px] font-semibold px-2.5 py-0.5 rounded-full border ${conf.bgLight}`}
                    >
                      {idea.category}
                    </span>

                    {isConverted ? (
                      <span className="flex items-center gap-1 text-[11px] text-[#174e36] bg-[#edf5f0] border border-[#cfe0d5] px-2 py-0.5 rounded-full font-medium" title="Weiterentwickelt">
                        <CheckCircle2 className="w-3 h-3" />
                      </span>
                    ) : (
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          openConvertIdeaModal(idea);
                        }}
                        className="p-1.5 text-[#174e36] bg-[#f4f7f5] hover:bg-[#174e36] hover:text-white rounded-lg transition-colors shadow-xs"
                        title="Idee weiterentwickeln"
                      >
                        <Sparkles className="w-3.5 h-3.5" />
                      </button>
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
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
};
