import React, { useState, useEffect } from 'react';
import { X, FolderKanban, Trash2 } from 'lucide-react';
import { Project, ProjectStatus, PROJECT_COLORS } from '../../types';
import { useApp } from '../../context/AppContext';

interface ProjectModalProps {
  isOpen: boolean;
  editingProject?: Project | null;
  onClose: () => void;
  onCreated?: (project: Project) => void;
}

export const ProjectModal: React.FC<ProjectModalProps> = ({
  isOpen,
  editingProject,
  onClose,
  onCreated,
}) => {
  const { user, addProject, updateProject, deleteProject } = useApp();

  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [color, setColor] = useState(PROJECT_COLORS[0]);
  const [status, setStatus] = useState<ProjectStatus>('active');
  const [targetDate, setTargetDate] = useState('');
  const [shareAvailability, setShareAvailability] = useState(true);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (!isOpen) return;
    if (editingProject) {
      setTitle(editingProject.title);
      setDescription(editingProject.description || '');
      setColor(editingProject.color || PROJECT_COLORS[0]);
      setStatus(editingProject.status || 'active');
      setTargetDate(editingProject.targetDate || '');
      setShareAvailability(
        user ? Boolean(editingProject.availabilitySharedBy?.[user.uid]) : true
      );
    } else {
      setTitle('');
      setDescription('');
      setColor(PROJECT_COLORS[0]);
      setStatus('active');
      setTargetDate('');
      setShareAvailability(true);
    }
  }, [isOpen, editingProject, user]);

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim() || saving) return;
    setSaving(true);
    try {
      if (editingProject) {
        const nextAvail = { ...(editingProject.availabilitySharedBy || {}) };
        if (user) nextAvail[user.uid] = shareAvailability;
        await updateProject(editingProject.id, {
          title: title.trim(),
          description: description.trim(),
          color,
          status,
          targetDate: targetDate || undefined,
          availabilitySharedBy: nextAvail,
        });
      } else {
        const created = await addProject({
          title,
          description,
          color,
          targetDate: targetDate || undefined,
          shareAvailability,
        });
        onCreated?.(created);
      }
      onClose();
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async () => {
    if (!editingProject) return;
    await deleteProject(editingProject.id);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-[#171c19]/40 backdrop-blur-xs p-4">
      <div
        className="bg-white rounded-2xl max-w-md w-full shadow-2xl border border-[#e2e8e3] text-[#171c19] overflow-hidden"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="p-5 bg-[#fafcfa] border-b border-[#e2e8e3] flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div
              className="w-9 h-9 rounded-xl flex items-center justify-center text-white shadow-xs"
              style={{ backgroundColor: color }}
            >
              <FolderKanban className="w-4.5 h-4.5" />
            </div>
            <div>
              <h2 className="text-base font-bold text-[#171c19]">
                {editingProject ? 'Projekt bearbeiten' : 'Neues Projekt erstellen'}
              </h2>
              <p className="text-xs text-[#52645a]">
                Sammle Ideen, Aufgaben & Termine an einem Ort
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-1.5 text-[#52645a] hover:text-[#171c19] hover:bg-[#f3f7f4] rounded-lg cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-5 space-y-4">
          <div>
            <label className="block text-xs font-semibold text-[#37443d] mb-1.5">
              Projektname *
            </label>
            <input
              type="text"
              required
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="z. B. Sommerurlaub 2027, Bachelorarbeit, App-Launch"
              className="w-full px-3.5 py-2 rounded-xl border border-[#d8e2db] bg-white text-sm outline-none focus:border-[#174e36]"
              autoFocus
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-[#37443d] mb-1.5">
              Projektfarbe
            </label>
            <div className="flex items-center gap-2 flex-wrap">
              {PROJECT_COLORS.map((c) => (
                <button
                  key={c}
                  type="button"
                  onClick={() => setColor(c)}
                  className={`w-7 h-7 rounded-full transition-all cursor-pointer ${
                    color === c ? 'ring-2 ring-offset-2 ring-[#171c19] scale-110' : 'hover:scale-105'
                  }`}
                  style={{ backgroundColor: c }}
                />
              ))}
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-semibold text-[#37443d] mb-1.5">
                Status
              </label>
              <select
                value={status}
                onChange={(e) => setStatus(e.target.value as ProjectStatus)}
                className="w-full px-3 py-2 rounded-xl border border-[#d8e2db] bg-white text-xs font-medium outline-none cursor-pointer"
              >
                <option value="planning">Planung</option>
                <option value="active">Aktiv</option>
                <option value="completed">Abgeschlossen</option>
                <option value="archived">Archiviert</option>
              </select>
            </div>
            <div>
              <label className="block text-xs font-semibold text-[#37443d] mb-1.5">
                Zieldatum (optional)
              </label>
              <input
                type="date"
                value={targetDate}
                onChange={(e) => setTargetDate(e.target.value)}
                className="w-full px-3 py-2 rounded-xl border border-[#d8e2db] bg-white text-xs outline-none"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-[#37443d] mb-1.5">
              Beschreibung & Ziel
            </label>
            <textarea
              rows={2}
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Worum geht es in diesem Projekt?"
              className="w-full px-3.5 py-2 rounded-xl border border-[#d8e2db] bg-white text-sm outline-none resize-none focus:border-[#174e36]"
            />
          </div>

          {user && (
            <label className="flex items-start gap-2.5 p-3 rounded-xl bg-[#f8faf8] border border-[#e2e8e3] cursor-pointer">
              <input
                type="checkbox"
                checked={shareAvailability}
                onChange={(e) => setShareAvailability(e.target.checked)}
                className="mt-0.5 w-4 h-4 rounded accent-[#174e36] cursor-pointer"
              />
              <div>
                <span className="text-xs font-semibold text-[#171c19] block">
                  Freie Zeiten mit Projektmitgliedern teilen
                </span>
                <span className="text-[11px] text-[#52645a]">
                  Mitglieder sehen nur, ob du frei oder belegt bist – keine Termindetails.
                </span>
              </div>
            </label>
          )}

          <div className="pt-2 flex items-center justify-between border-t border-[#e8eee9]">
            {editingProject && editingProject.ownerId === (user?.uid || 'guest') ? (
              <button
                type="button"
                onClick={handleDelete}
                className="flex items-center gap-1.5 text-xs text-rose-600 hover:bg-rose-50 py-2 px-3 rounded-lg cursor-pointer"
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
                onClick={onClose}
                className="px-4 py-2 text-xs font-semibold text-[#52645a] hover:bg-[#f3f7f4] rounded-xl cursor-pointer"
              >
                Abbrechen
              </button>
              <button
                type="submit"
                disabled={saving}
                className="px-5 py-2 bg-[#174e36] hover:bg-[#12402c] text-white text-xs font-semibold rounded-xl shadow-xs cursor-pointer"
              >
                {saving ? 'Speichere...' : editingProject ? 'Speichern' : 'Projekt anlegen'}
              </button>
            </div>
          </div>
        </form>
      </div>
    </div>
  );
};
