import React, { useState, useEffect } from 'react';
import { X, CheckSquare, Trash2 } from 'lucide-react';
import { useApp } from '../../context/AppContext';
import {
  Category,
  Recurrence,
  CATEGORIES_CONFIG,
  TaskStatus,
  TaskPriority,
} from '../../types';

export const TaskModal: React.FC = () => {
  const {
    isTaskModalOpen,
    editingTask,
    presetTaskProjectId,
    closeTaskModal,
    addTask,
    updateTask,
    deleteTask,
    projects,
    getUserLabel,
  } = useApp();

  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [category, setCategory] = useState<Category>('Arbeit');
  const [recurrence, setRecurrence] = useState<Recurrence>('none');
  const [dueDate, setDueDate] = useState('');
  const [projectId, setProjectId] = useState('');
  const [assigneeId, setAssigneeId] = useState('');
  const [kanbanStatus, setKanbanStatus] = useState<TaskStatus>('todo');
  const [priority, setPriority] = useState<TaskPriority>('medium');

  useEffect(() => {
    if (editingTask) {
      setTitle(editingTask.title);
      setDescription(editingTask.description || '');
      setCategory(editingTask.category);
      setRecurrence(editingTask.recurrence);
      setDueDate(editingTask.dueDate || '');
      setProjectId(editingTask.projectId || '');
      setAssigneeId(editingTask.assigneeId || '');
      setKanbanStatus(
        editingTask.kanbanStatus || (editingTask.completed ? 'done' : 'todo')
      );
      setPriority(editingTask.priority || 'medium');
    } else {
      setTitle('');
      setDescription('');
      setCategory(presetTaskProjectId ? 'Projekt' : 'Arbeit');
      setRecurrence('none');
      setDueDate('');
      setProjectId(presetTaskProjectId || '');
      setAssigneeId('');
      setKanbanStatus('todo');
      setPriority('medium');
    }
  }, [editingTask, presetTaskProjectId, isTaskModalOpen]);

  if (!isTaskModalOpen) return null;

  const selectedProject = projects.find((p) => p.id === projectId);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim()) return;

    if (editingTask) {
      await updateTask(editingTask.id, {
        title,
        description,
        category,
        recurrence,
        dueDate: dueDate || undefined,
        projectId: projectId || undefined,
        assigneeId: projectId ? assigneeId || undefined : undefined,
        kanbanStatus,
        priority,
      });
    } else {
      await addTask({
        title,
        description,
        category,
        recurrence,
        dueDate: dueDate || undefined,
        projectId: projectId || undefined,
        assigneeId: projectId ? assigneeId || undefined : undefined,
        kanbanStatus,
        priority,
      });
    }
    closeTaskModal();
  };

  const handleDelete = async () => {
    if (editingTask) {
      await deleteTask(editingTask.id);
      closeTaskModal();
    }
  };

  const categories = Object.keys(CATEGORIES_CONFIG) as Category[];

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-[#171c19]/40 backdrop-blur-xs p-4 overflow-y-auto">
      <div
        id="task-modal"
        className="bg-white rounded-t-2xl sm:rounded-2xl max-w-md w-full max-h-[90vh] flex flex-col shadow-2xl border border-[#e2e8e3] text-[#171c19] overflow-hidden"
      >
        <div className="p-5 bg-[#fafcfa] border-b border-[#e2e8e3] flex items-center justify-between shrink-0">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-[#edf5f0] text-[#174e36] border border-[#cfe0d5] flex items-center justify-center shadow-xs">
              <CheckSquare className="w-4 h-4" />
            </div>
            <h2 className="text-base font-semibold text-[#171c19]">
              {editingTask ? 'Aufgabe bearbeiten' : 'Neue Aufgabe erstellen'}
            </h2>
          </div>
          <button
            onClick={closeTaskModal}
            className="p-1.5 text-[#52645a] hover:text-[#171c19] hover:bg-[#f3f7f4] rounded-lg transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-4 overflow-y-auto">
          <div>
            <label className="block text-xs font-semibold text-[#37443d] mb-1.5">
              Titel der Aufgabe *
            </label>
            <input
              type="text"
              required
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="z. B. Steuererklärung einreichen"
              className="w-full px-3.5 py-2.5 rounded-xl border border-[#d8e2db] bg-white text-[#171c19] placeholder-[#7d8e84] focus:border-[#174e36] focus:ring-1 focus:ring-[#174e36]/30 text-sm outline-none transition-all"
            />
          </div>

          {/* Optional Project & Assignee */}
          {projects.length > 0 && (
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-semibold text-[#37443d] mb-1.5">
                  Projekt (optional)
                </label>
                <select
                  value={projectId}
                  onChange={(e) => {
                    setProjectId(e.target.value);
                    if (!e.target.value) setAssigneeId('');
                  }}
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

              <div>
                <label className="block text-xs font-semibold text-[#37443d] mb-1.5">
                  Priorität
                </label>
                <select
                  value={priority}
                  onChange={(e) => setPriority(e.target.value as TaskPriority)}
                  className="w-full px-3 py-2 rounded-xl border border-[#d8e2db] bg-white text-[#171c19] focus:border-[#174e36] text-xs font-medium outline-none cursor-pointer"
                >
                  <option value="low">Niedrig</option>
                  <option value="medium">Mittel</option>
                  <option value="high">Hoch</option>
                </select>
              </div>
            </div>
          )}

          {selectedProject && (
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-semibold text-[#37443d] mb-1.5">
                  Board-Status
                </label>
                <select
                  value={kanbanStatus}
                  onChange={(e) => setKanbanStatus(e.target.value as TaskStatus)}
                  className="w-full px-3 py-2 rounded-xl border border-[#d8e2db] bg-white text-[#171c19] focus:border-[#174e36] text-xs font-medium outline-none cursor-pointer"
                >
                  <option value="backlog">Backlog</option>
                  <option value="todo">Zu erledigen</option>
                  <option value="in_progress">In Arbeit</option>
                  <option value="done">Erledigt</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-semibold text-[#37443d] mb-1.5">
                  Zuständig
                </label>
                <select
                  value={assigneeId}
                  onChange={(e) => setAssigneeId(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl border border-[#d8e2db] bg-white text-[#171c19] focus:border-[#174e36] text-xs font-medium outline-none cursor-pointer"
                >
                  <option value="">Nicht zugewiesen</option>
                  {selectedProject.memberIds.map((uid) => (
                    <option key={uid} value={uid}>
                      {getUserLabel(uid)}
                    </option>
                  ))}
                </select>
              </div>
            </div>
          )}

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
                Wiederkehrend?
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

          <div>
            <label className="block text-xs font-semibold text-[#37443d] mb-1.5">
              Bezeichnung / Details
            </label>
            <textarea
              rows={3}
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Was genau ist zu tun? Gibt es Bedingungen oder Links?"
              className="w-full px-3.5 py-2 rounded-xl border border-[#d8e2db] bg-white text-[#171c19] placeholder-[#7d8e84] focus:border-[#174e36] text-sm outline-none resize-none"
            />
          </div>

          <div className="pt-3 flex items-center justify-between border-t border-[#e8eee9]">
            {editingTask ? (
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
                onClick={closeTaskModal}
                className="px-4 py-2 text-xs font-semibold text-[#52645a] hover:text-[#171c19] hover:bg-[#f3f7f4] rounded-xl transition-colors cursor-pointer"
              >
                Abbrechen
              </button>
              <button
                type="submit"
                className="px-5 py-2.5 bg-[#174e36] hover:bg-[#12402c] active:scale-[0.98] text-white text-xs font-semibold rounded-xl shadow-xs transition-all cursor-pointer"
              >
                {editingTask ? 'Speichern' : 'Aufgabe erstellen'}
              </button>
            </div>
          </div>
        </form>
      </div>
    </div>
  );
};
