import React, { useState, useEffect } from 'react';
import { X, Lightbulb, Trash2 } from 'lucide-react';
import { useApp } from '../../context/AppContext';
import { Category, CATEGORIES_CONFIG } from '../../types';

export const IdeaModal: React.FC = () => {
  const {
    isIdeaModalOpen,
    editingIdea,
    closeIdeaModal,
    addIdea,
    updateIdea,
    deleteIdea,
  } = useApp();

  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [category, setCategory] = useState<Category>('Persönlich');

  useEffect(() => {
    if (editingIdea) {
      setTitle(editingIdea.title);
      setDescription(editingIdea.description || '');
      setCategory(editingIdea.category);
    } else {
      setTitle('');
      setDescription('');
      setCategory('Persönlich');
    }
  }, [editingIdea, isIdeaModalOpen]);

  if (!isIdeaModalOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim()) return;

    if (editingIdea) {
      await updateIdea(editingIdea.id, {
        title,
        description,
        category,
      });
    } else {
      await addIdea({
        title,
        description,
        category,
      });
    }
    closeIdeaModal();
  };

  const handleDelete = async () => {
    if (editingIdea) {
      await deleteIdea(editingIdea.id);
      closeIdeaModal();
    }
  };

  const categories = Object.keys(CATEGORIES_CONFIG) as Category[];

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-[#171c19]/40 backdrop-blur-xs p-4 overflow-y-auto">
      <div
        id="idea-modal"
        className="bg-white rounded-t-2xl sm:rounded-2xl max-w-md w-full max-h-[90vh] sm:max-h-full shadow-2xl border border-[#e2e8e3] text-[#171c19] overflow-hidden"
      >
        <div className="p-5 bg-[#fafcfa] border-b border-[#e2e8e3] flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-[#edf5f0] text-[#174e36] border border-[#cfe0d5] flex items-center justify-center shadow-xs">
              <Lightbulb className="w-4 h-4" />
            </div>
            <h2 className="text-base font-semibold text-[#171c19]">
              {editingIdea ? 'Idee bearbeiten' : 'Neue Idee sammeln'}
            </h2>
          </div>
          <button
            onClick={closeIdeaModal}
            className="p-1.5 text-[#52645a] hover:text-[#171c19] hover:bg-[#f3f7f4] rounded-lg transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          <div>
            <label className="block text-xs font-semibold text-[#37443d] mb-1.5">
              Ideen-Titel *
            </label>
            <input
              type="text"
              required
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="Was schwirrt dir durch den Kopf?"
              className="w-full px-3.5 py-2.5 rounded-xl border border-[#d8e2db] bg-white text-[#171c19] placeholder-[#7d8e84] focus:border-[#174e36] focus:ring-1 focus:ring-[#174e36]/30 text-sm outline-none transition-all"
              autoFocus
            />
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
              Beschreibung & Gedanken (optional)
            </label>
            <textarea
              rows={4}
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Halte hier erste Details, Links, Inspirationen oder Bedingungen fest..."
              className="w-full px-3.5 py-2 rounded-xl border border-[#d8e2db] bg-white text-[#171c19] placeholder-[#7d8e84] focus:border-[#174e36] text-sm outline-none resize-none"
            />
          </div>

          <div className="pt-3 flex items-center justify-between border-t border-[#e8eee9]">
            {editingIdea ? (
              <button
                type="button"
                onClick={handleDelete}
                className="flex items-center gap-1.5 text-xs text-rose-600 hover:text-rose-700 hover:bg-rose-50 py-2 px-3 rounded-lg transition-colors cursor-pointer"
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
                onClick={closeIdeaModal}
                className="px-4 py-2 text-xs font-semibold text-[#52645a] hover:text-[#171c19] hover:bg-[#f3f7f4] rounded-xl transition-colors cursor-pointer"
              >
                Abbrechen
              </button>
              <button
                type="submit"
                className="px-5 py-2.5 bg-[#174e36] hover:bg-[#12402c] active:scale-[0.98] text-white text-xs font-semibold rounded-xl shadow-xs transition-all cursor-pointer"
              >
                {editingIdea ? 'Speichern' : 'Idee festhalten'}
              </button>
            </div>
          </div>
        </form>
      </div>
    </div>
  );
};
