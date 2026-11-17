import React, { useState, useMemo } from 'react';
import { CheckSquare, GripVertical, X } from 'lucide-react';
import { Task, Category, CATEGORIES_CONFIG } from '../../types';

interface TaskSidebarProps {
  unscheduledTasks: Task[];
  draggedItem: { id: string; type: 'event' | 'task'; data?: any } | null;
  handleDragStartTask: (e: React.DragEvent, taskItem: Task) => void;
  handleDragEnd: () => void;
  onClose: () => void;
}

export const TaskSidebar: React.FC<TaskSidebarProps> = ({
  unscheduledTasks,
  draggedItem,
  handleDragStartTask,
  handleDragEnd,
  onClose,
}) => {
  const [selectedCategory, setSelectedCategory] = useState<Category | 'all'>('all');
  const categories = Object.keys(CATEGORIES_CONFIG) as Category[];

  const filteredTasks = useMemo(() => {
    if (selectedCategory === 'all') return unscheduledTasks;
    return unscheduledTasks.filter((t) => t.category === selectedCategory);
  }, [unscheduledTasks, selectedCategory]);

  return (
    <>
      <div className="fixed inset-0 bg-[#171c19]/30 backdrop-blur-sm z-40 md:hidden transition-opacity" onClick={onClose} />
      <aside
        id="calendar-tasks-drawer"
        className="fixed md:static inset-y-0 right-0 z-50 w-72 md:w-64 bg-white border-l border-[#e2e8e3] flex flex-col shrink-0 shadow-2xl md:shadow-xs transition-transform transform translate-x-0"
      >
        <div className="p-3.5 border-b border-[#e2e8e3] flex items-center justify-between bg-white">
          <div className="flex items-center gap-2">
            <div className="w-7 h-7 rounded-lg bg-[#edf5f0] text-[#174e36] flex items-center justify-center border border-[#cfe0d5]">
              <CheckSquare className="w-3.5 h-3.5 text-[#174e36]" />
            </div>
            <h3 className="text-xs font-bold text-[#171c19]">
              Aufgaben einplanen
            </h3>
          </div>
          <div className="flex items-center gap-2">
            <span className="text-[11px] font-semibold px-2 py-0.5 rounded-full bg-[#f4f7f5] text-[#52645a] border border-[#d8e2db]">
              {filteredTasks.length}
            </span>
            <button onClick={onClose} className="md:hidden p-1 text-[#52645a] hover:bg-[#f4f7f5] rounded-md">
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Scrollable Category Filter Bar */}
        <div
          onWheel={(e) => {
            if (e.deltaY !== 0) {
              e.currentTarget.scrollLeft += e.deltaY;
            }
          }}
          className="flex items-center gap-1.5 px-2.5 py-2 border-b border-[#e2e8e3] bg-[#fafcfa] overflow-x-auto no-scrollbar shrink-0"
        >
          <button
            type="button"
            onClick={() => setSelectedCategory('all')}
            className={`px-2.5 py-1 rounded-full text-[11px] font-semibold border transition-all shrink-0 cursor-pointer ${
              selectedCategory === 'all'
                ? 'bg-[#174e36] text-white border-[#174e36] shadow-xs'
                : 'bg-white text-[#52645a] border-[#d8e2db] hover:bg-[#f4f7f5] hover:text-[#171c19]'
            }`}
          >
            Alle
          </button>
          {categories.map((cat) => {
            const conf = CATEGORIES_CONFIG[cat];
            const isSelected = selectedCategory === cat;
            return (
              <button
                key={cat}
                type="button"
                onClick={() => setSelectedCategory(cat)}
                className={`px-2.5 py-1 rounded-full text-[11px] font-semibold border transition-all shrink-0 flex items-center gap-1 cursor-pointer ${
                  isSelected
                    ? 'border-[#174e36] bg-[#edf5f0] text-[#143d2b] ring-1 ring-[#174e36] shadow-xs'
                    : 'bg-white text-[#52645a] border-[#d8e2db] hover:bg-[#f4f7f5] hover:text-[#171c19]'
                }`}
              >
                <span
                  className="w-2 h-2 rounded-full shrink-0"
                  style={{ backgroundColor: conf.color }}
                />
                <span>{conf.label}</span>
              </button>
            );
          })}
        </div>

      {/* Task list for dragging into calendar */}
      <div className="flex-1 overflow-y-auto no-scrollbar p-2.5 space-y-2 bg-[#f8faf8]">
        {filteredTasks.length === 0 ? (
          <div className="text-center py-10 text-[#6b7d72] text-xs">
            {selectedCategory === 'all'
              ? 'Keine offenen Aufgaben.'
              : `Keine offenen Aufgaben in „${selectedCategory}“.`}
          </div>
        ) : (
          filteredTasks.map((task) => {
            const conf =
              CATEGORIES_CONFIG[task.category] || CATEGORIES_CONFIG['Arbeit'];
            const isBeingDragged = draggedItem?.id === task.id;

            return (
              <div
                key={task.id}
                draggable
                onDragStart={(e) => handleDragStartTask(e, task)}
                onDragEnd={handleDragEnd}
                className={`p-2.5 bg-white hover:bg-[#f6faf7] rounded-xl border border-[#e2e8e3] shadow-xs cursor-grab active:cursor-grabbing hover:border-[#174e36] hover:shadow-md transition-all group select-none ${
                  isBeingDragged ? 'opacity-40 scale-95 ring-2 ring-[#174e36]' : ''
                }`}
              >
                <div className="flex items-center justify-between mb-1">
                  <span
                    className={`text-[9px] font-semibold px-1.5 py-0.5 rounded-full ${conf.badgeClass}`}
                  >
                    {task.category}
                  </span>
                  <GripVertical className="w-3 h-3 text-[#8e9f94] group-hover:text-[#174e36]" />
                </div>
                <h4 className="text-xs font-semibold text-[#171c19] leading-snug">
                  {task.title}
                </h4>
                {task.description && (
                  <p className="text-[10px] text-[#52645a] line-clamp-2 mt-0.5">
                    {task.description}
                  </p>
                )}
              </div>
            );
          })
        )}
      </div>
    </aside>
    </>
  );
};
