import React, { useState, useMemo } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import {
  FolderKanban,
  Plus,
  ArrowLeft,
  LayoutGrid,
  List as ListIcon,
  Lightbulb,
  Calendar as CalendarIcon,
  MessageSquare,
  Users,
  Sparkles,
  CheckCircle2,
  Clock,
  Settings2,
  UserPlus,
  CalendarPlus,
  ChevronRight,
  ChevronLeft,
  Eye,
  EyeOff,
  LogOut,
  Menu,
  Trash2,
} from 'lucide-react';
import { useApp } from '../context/AppContext';
import {
  Project,
  Task,
  TaskStatus,
  TaskPriority,
  TASK_STATUS_CONFIG,
  TASK_PRIORITY_CONFIG,
  CATEGORIES_CONFIG,
} from '../types';
import { ProjectModal } from '../components/modals/ProjectModal';
import { UserSearchInput } from '../components/social/UserSearchInput';
import { ChatPanel } from '../components/social/ChatPanel';
import { getTodayDateKey } from '../utils/dateUtils';

type ProjectTab = 'board' | 'list' | 'ideas' | 'events' | 'team';

const KANBAN_COLUMNS: TaskStatus[] = ['backlog', 'todo', 'in_progress', 'done'];

const PROJECT_STATUS_LABELS: Record<Project['status'], { label: string; badgeClass: string }> = {
  planning: { label: 'Planung', badgeClass: 'bg-sky-50 text-sky-800 border-sky-200' },
  active: { label: 'Aktiv', badgeClass: 'bg-emerald-50 text-emerald-800 border-emerald-200' },
  completed: { label: 'Fertig', badgeClass: 'bg-indigo-50 text-indigo-800 border-indigo-200' },
  archived: { label: 'Archiviert', badgeClass: 'bg-slate-100 text-slate-600 border-slate-200' },
};

export const ProjectsPage: React.FC = () => {
  const { projectId } = useParams<{ projectId?: string }>();
  const navigate = useNavigate();

  const {
    user,
    projects,
    projectInvites,
    friends,
    tasks,
    ideas,
    events,
    chatRooms,
    getProfile,
    getUserLabel,
    addTask,
    updateTask,
    deleteTask,
    openTaskModal,
    openIdeaModal,
    openConvertIdeaModal,
    openEventModal,
    openEventRequestModal,
    setProjectAvailabilitySharing,
    inviteUserToProject,
    exitProject,
    openProjectOrGroupChat,
    setMobileSidebarOpen,
    openAuthModal,
  } = useApp();

  const [isProjectModalOpen, setProjectModalOpen] = useState(false);
  const [editingProject, setEditingProject] = useState<Project | null>(null);
  const [statusFilter, setStatusFilter] = useState<'all' | Project['status']>('all');

  const [activeTab, setActiveTab] = useState<ProjectTab>('board');
  const [draggedTaskId, setDraggedTaskId] = useState<string | null>(null);
  const [dragOverCol, setDragOverCol] = useState<TaskStatus | null>(null);
  const [quickTaskTitleByCol, setQuickTaskTitleByCol] = useState<Record<string, string>>({});
  const [inviteMessage, setInviteMessage] = useState<string | null>(null);
  const [inviteError, setInviteError] = useState<string | null>(null);

  const selectedProject = useMemo(
    () => (projectId ? projects.find((p) => p.id === projectId) : undefined),
    [projectId, projects]
  );

  // Scoped data for selected project
  const projectTasks = useMemo(() => {
    if (!selectedProject) return [];
    return tasks.filter((t) => t.projectId === selectedProject.id);
  }, [tasks, selectedProject]);

  const projectIdeas = useMemo(() => {
    if (!selectedProject) return [];
    return ideas.filter((i) => i.projectId === selectedProject.id);
  }, [ideas, selectedProject]);

  const projectEvents = useMemo(() => {
    if (!selectedProject) return [];
    return events
      .filter((e) => e.projectId === selectedProject.id)
      .sort((a, b) => `${a.date} ${a.time}`.localeCompare(`${b.date} ${b.time}`));
  }, [events, selectedProject]);

  const projectChatRoom = useMemo(() => {
    if (!selectedProject) return undefined;
    return (
      chatRooms.find((c) => c.id === `proj_${selectedProject.id}`) || {
        id: `proj_${selectedProject.id}`,
        type: 'project' as const,
        title: selectedProject.title,
        participantIds: selectedProject.memberIds,
        projectId: selectedProject.id,
        createdAt: selectedProject.createdAt,
        updatedAt: selectedProject.updatedAt,
      }
    );
  }, [chatRooms, selectedProject]);

  const pendingInvitesForProject = useMemo(() => {
    if (!selectedProject) return [];
    return projectInvites.filter(
      (inv) => inv.projectId === selectedProject.id && inv.status === 'pending'
    );
  }, [projectInvites, selectedProject]);

  const getTaskStatus = (t: Task): TaskStatus => {
    if (t.kanbanStatus) return t.kanbanStatus;
    return t.completed ? 'done' : 'todo';
  };

  const handleQuickAddTask = async (status: TaskStatus) => {
    if (!selectedProject) return;
    const title = (quickTaskTitleByCol[status] || '').trim();
    if (!title) return;
    setQuickTaskTitleByCol((prev) => ({ ...prev, [status]: '' }));
    await addTask({
      title,
      category: 'Projekt',
      recurrence: 'none',
      projectId: selectedProject.id,
      kanbanStatus: status,
      priority: 'medium',
    });
  };

  const handleInviteUid = async (uid: string) => {
    if (!selectedProject) return;
    setInviteError(null);
    setInviteMessage(null);
    try {
      await inviteUserToProject(selectedProject, uid);
      setInviteMessage(`Einladung an ${getUserLabel(uid)} wurde gesendet!`);
      setTimeout(() => setInviteMessage(null), 3500);
    } catch (err: any) {
      setInviteError(err?.message || 'Einladung fehlgeschlagen.');
    }
  };

  const handleOpenTeamTab = async () => {
    setActiveTab('team');
    if (selectedProject && user) {
      await openProjectOrGroupChat({
        id: `proj_${selectedProject.id}`,
        type: 'project',
        title: selectedProject.title,
        participantIds: selectedProject.memberIds,
        projectId: selectedProject.id,
      }).catch(() => {});
    }
  };

  // ==========================================================
  // VIEW 1: PROJECT OVERVIEW GRID
  // ==========================================================
  if (!selectedProject) {
    const filteredProjects = projects.filter(
      (p) => statusFilter === 'all' || p.status === statusFilter
    );

    return (
      <div className="flex-1 flex flex-col h-full overflow-hidden bg-[#f8faf8] text-[#171c19]">
        <header className="p-4 sm:p-6 bg-white border-b border-[#e2e8e3] flex flex-wrap items-center justify-between gap-4 shrink-0 shadow-xs">
          <div className="flex items-center gap-2.5">
            <button
              onClick={() => setMobileSidebarOpen(true)}
              className="md:hidden p-1.5 -ml-1.5 text-[#52645a] hover:bg-[#f4f7f5] rounded-lg cursor-pointer"
            >
              <Menu className="w-6 h-6" />
            </button>
            <div className="w-9 h-9 rounded-xl bg-[#edf5f0] border border-[#cfe0d5] text-[#174e36] flex items-center justify-center shadow-xs">
              <FolderKanban className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-xl font-bold text-[#171c19] tracking-tight">Projekte</h2>
              <p className="text-xs text-[#52645a] hidden sm:block">
                Ideen, Aufgaben, Termine & Team-Planung gebündelt
              </p>
            </div>
          </div>

          <button
            onClick={() => {
              setEditingProject(null);
              setProjectModalOpen(true);
            }}
            className="flex items-center gap-1.5 px-4 py-2.5 bg-[#174e36] hover:bg-[#12402c] active:scale-[0.98] text-white rounded-xl text-xs font-semibold shadow-xs transition-all cursor-pointer"
          >
            <Plus className="w-4 h-4" />
            <span>Neues Projekt</span>
          </button>
        </header>

        <div className="flex-1 overflow-y-auto p-4 sm:p-6 space-y-5">
          {/* Status Filter */}
          <div className="flex items-center gap-1.5 overflow-x-auto pb-1">
            {(
              [
                { id: 'all', label: `Alle (${projects.length})` },
                { id: 'active', label: 'Aktiv' },
                { id: 'planning', label: 'Planung' },
                { id: 'completed', label: 'Fertig' },
              ] as const
            ).map((f) => (
              <button
                key={f.id}
                onClick={() => setStatusFilter(f.id)}
                className={`px-3.5 py-1.5 rounded-xl text-xs font-semibold transition-all cursor-pointer whitespace-nowrap ${
                  statusFilter === f.id
                    ? 'bg-[#174e36] text-white shadow-xs'
                    : 'bg-white text-[#52645a] border border-[#d8e2db] hover:bg-[#f3f7f4]'
                }`}
              >
                {f.label}
              </button>
            ))}
          </div>

          {filteredProjects.length === 0 ? (
            <div className="bg-white rounded-2xl border border-[#e2e8e3] p-12 text-center shadow-xs">
              <div className="w-12 h-12 rounded-2xl bg-[#edf5f0] border border-[#cfe0d5] text-[#174e36] flex items-center justify-center mx-auto mb-3">
                <FolderKanban className="w-6 h-6" />
              </div>
              <h3 className="text-base font-semibold text-[#171c19]">Noch keine Projekte</h3>
              <p className="text-xs text-[#52645a] max-w-md mx-auto mt-1 mb-4">
                Starte ein eigenes Projekt oder lade Freunde und Kollegen ein, um gemeinsam Ideen, Kanban-Aufgaben und Termine zu koordinieren.
              </p>
              <button
                onClick={() => {
                  setEditingProject(null);
                  setProjectModalOpen(true);
                }}
                className="inline-flex items-center gap-1.5 px-4 py-2 bg-[#174e36] hover:bg-[#12402c] text-white rounded-xl text-xs font-semibold cursor-pointer"
              >
                <Plus className="w-4 h-4" />
                <span>Erstes Projekt anlegen</span>
              </button>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 pb-8">
              {filteredProjects.map((proj) => {
                const pTasks = tasks.filter((t) => t.projectId === proj.id);
                const doneCount = pTasks.filter((t) => t.completed || t.kanbanStatus === 'done').length;
                const progress = pTasks.length > 0 ? Math.round((doneCount / pTasks.length) * 100) : 0;
                const pIdeasCount = ideas.filter((i) => i.projectId === proj.id).length;
                const pEventsCount = events.filter((e) => e.projectId === proj.id).length;
                const statusInfo = PROJECT_STATUS_LABELS[proj.status] || PROJECT_STATUS_LABELS.active;
                const isTeam = proj.memberIds.length > 1;

                return (
                  <div
                    key={proj.id}
                    onClick={() => navigate(`/projects/${proj.id}`)}
                    className="bg-white rounded-2xl border border-[#e2e8e3] hover:border-[#174e36] overflow-hidden shadow-xs hover:shadow-md transition-all cursor-pointer group flex flex-col"
                  >
                    <div className="h-1.5 w-full" style={{ backgroundColor: proj.color }} />
                    <div className="p-5 flex-1 flex flex-col justify-between space-y-4">
                      <div>
                        <div className="flex items-center justify-between gap-2 mb-2.5">
                          <span
                            className={`text-[10px] font-semibold px-2 py-0.5 rounded-full border ${statusInfo.badgeClass}`}
                          >
                            {statusInfo.label}
                          </span>
                          <span className="text-[11px] font-medium text-[#52645a] flex items-center gap-1">
                            <Users className="w-3.5 h-3.5" />
                            {isTeam ? `${proj.memberIds.length} Mitglieder` : 'Privat'}
                          </span>
                        </div>

                        <h3 className="text-base font-bold text-[#171c19] group-hover:text-[#174e36] transition-colors">
                          {proj.title}
                        </h3>
                        {proj.description && (
                          <p className="text-xs text-[#52645a] mt-1 line-clamp-2">
                            {proj.description}
                          </p>
                        )}
                      </div>

                      <div className="space-y-3">
                        {/* Progress */}
                        <div>
                          <div className="flex items-center justify-between text-[11px] mb-1">
                            <span className="font-medium text-[#52645a]">Fortschritt</span>
                            <span className="font-bold text-[#171c19]">
                              {doneCount}/{pTasks.length} Aufgaben ({progress}%)
                            </span>
                          </div>
                          <div className="w-full h-1.5 bg-[#eef3ef] rounded-full overflow-hidden">
                            <div
                              className="h-full rounded-full transition-all"
                              style={{
                                width: `${progress}%`,
                                backgroundColor: proj.color,
                              }}
                            />
                          </div>
                        </div>

                        {/* Meta Footer */}
                        <div className="pt-2 border-t border-[#f0f4f1] flex items-center justify-between text-[11px] text-[#52645a]">
                          <div className="flex items-center gap-3">
                            <span className="flex items-center gap-1">
                              <Lightbulb className="w-3.5 h-3.5 text-amber-500" />
                              {pIdeasCount}
                            </span>
                            <span className="flex items-center gap-1">
                              <CalendarIcon className="w-3.5 h-3.5 text-[#174e36]" />
                              {pEventsCount}
                            </span>
                          </div>

                          {/* Avatars */}
                          <div className="flex -space-x-1.5">
                            {proj.memberIds.slice(0, 4).map((uid) => {
                              const label = getUserLabel(uid);
                              return (
                                <div
                                  key={uid}
                                  title={label}
                                  className="w-6 h-6 rounded-full bg-[#edf5f0] border-2 border-white text-[#174e36] flex items-center justify-center text-[10px] font-bold"
                                >
                                  {label.charAt(0).toUpperCase()}
                                </div>
                              );
                            })}
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        <ProjectModal
          isOpen={isProjectModalOpen}
          editingProject={editingProject}
          onClose={() => setProjectModalOpen(false)}
          onCreated={(p) => navigate(`/projects/${p.id}`)}
        />
      </div>
    );
  }

  // ==========================================================
  // VIEW 2: PROJECT WORKSPACE (MONDAY / KANBAN INSPIRED)
  // ==========================================================
  const doneCount = projectTasks.filter((t) => getTaskStatus(t) === 'done').length;
  const progressPct =
    projectTasks.length > 0 ? Math.round((doneCount / projectTasks.length) * 100) : 0;
  const iShareAvailability = user ? Boolean(selectedProject.availabilitySharedBy?.[user.uid]) : false;

  return (
    <div className="flex-1 flex flex-col h-full overflow-hidden bg-[#f8faf8] text-[#171c19]">
      {/* Project Header */}
      <header className="bg-white border-b border-[#e2e8e3] px-4 sm:px-6 pt-3 pb-0 shrink-0 shadow-xs">
        <div className="flex flex-wrap items-center justify-between gap-3 pb-3">
          <div className="flex items-center gap-2.5 min-w-0">
            <button
              onClick={() => setMobileSidebarOpen(true)}
              className="md:hidden p-1.5 -ml-1.5 text-[#52645a] hover:bg-[#f4f7f5] rounded-lg cursor-pointer"
            >
              <Menu className="w-5 h-5" />
            </button>
            <button
              onClick={() => navigate('/projects')}
              className="p-1.5 text-[#52645a] hover:text-[#171c19] hover:bg-[#f3f7f4] rounded-xl transition-colors cursor-pointer"
              title="Alle Projekte"
            >
              <ArrowLeft className="w-4 h-4" />
            </button>

            <div
              className="w-8 h-8 rounded-xl flex items-center justify-center text-white shrink-0 shadow-xs"
              style={{ backgroundColor: selectedProject.color }}
            >
              <FolderKanban className="w-4 h-4" />
            </div>

            <div className="min-w-0">
              <div className="flex items-center gap-2">
                <h2 className="text-base sm:text-lg font-bold text-[#171c19] truncate">
                  {selectedProject.title}
                </h2>
                <span className="hidden sm:inline-flex text-[11px] font-bold px-2 py-0.5 rounded-full bg-[#edf5f0] text-[#174e36]">
                  {progressPct}%
                </span>
              </div>
              {selectedProject.description && (
                <p className="text-[11px] text-[#52645a] truncate max-w-md">
                  {selectedProject.description}
                </p>
              )}
            </div>
          </div>

          {/* Right Quick Actions */}
          <div className="flex items-center gap-2 flex-wrap">
            {user && (
              <button
                type="button"
                onClick={() => setProjectAvailabilitySharing(selectedProject.id, !iShareAvailability)}
                className={`flex items-center gap-1.5 px-2.5 py-1.5 rounded-xl text-[11px] font-semibold border transition-all cursor-pointer ${
                  iShareAvailability
                    ? 'bg-[#edf5f0] text-[#174e36] border-[#cfe0d5]'
                    : 'bg-white text-[#52645a] border-[#d8e2db] hover:bg-[#f4f7f5]'
                }`}
                title="Freie Kalenderzeiten mit Projektteam teilen"
              >
                {iShareAvailability ? <Eye className="w-3.5 h-3.5" /> : <EyeOff className="w-3.5 h-3.5" />}
                <span className="hidden lg:inline">
                  {iShareAvailability ? 'Freie Zeiten geteilt' : 'Kalender privat'}
                </span>
              </button>
            )}

            <button
              type="button"
              onClick={handleOpenTeamTab}
              className="flex items-center gap-1.5 px-2.5 py-1.5 bg-white hover:bg-[#f3f7f4] border border-[#d8e2db] rounded-xl text-xs font-semibold text-[#171c19] cursor-pointer"
            >
              <UserPlus className="w-3.5 h-3.5 text-[#174e36]" />
              <span className="hidden sm:inline">Team ({selectedProject.memberIds.length})</span>
            </button>

            <button
              type="button"
              onClick={() => {
                setEditingProject(selectedProject);
                setProjectModalOpen(true);
              }}
              className="p-2 text-[#52645a] hover:text-[#171c19] hover:bg-[#f3f7f4] border border-[#d8e2db] rounded-xl cursor-pointer"
              title="Projekteinstellungen"
            >
              <Settings2 className="w-4 h-4" />
            </button>

            <button
              type="button"
              onClick={() => openTaskModal(undefined, selectedProject.id)}
              className="flex items-center gap-1.5 px-3 py-1.5 bg-[#174e36] hover:bg-[#12402c] text-white rounded-xl text-xs font-semibold shadow-xs cursor-pointer"
            >
              <Plus className="w-4 h-4" />
              <span>Aufgabe</span>
            </button>
          </div>
        </div>

        {/* Navigation Tabs */}
        <div className="flex items-center gap-1 overflow-x-auto no-scrollbar">
          {(
            [
              { id: 'board', label: 'Board', icon: LayoutGrid },
              { id: 'list', label: 'Liste', icon: ListIcon },
              { id: 'ideas', label: `Ideen (${projectIdeas.length})`, icon: Lightbulb },
              { id: 'events', label: `Termine (${projectEvents.length})`, icon: CalendarIcon },
              { id: 'team', label: 'Team & Chat', icon: MessageSquare },
            ] as const
          ).map((tab) => {
            const Icon = tab.icon;
            const active = activeTab === tab.id;
            return (
              <button
                key={tab.id}
                onClick={() => (tab.id === 'team' ? handleOpenTeamTab() : setActiveTab(tab.id))}
                className={`flex items-center gap-1.5 px-3.5 py-2.5 text-xs font-semibold border-b-2 transition-all whitespace-nowrap cursor-pointer ${
                  active
                    ? 'border-[#174e36] text-[#174e36]'
                    : 'border-transparent text-[#52645a] hover:text-[#171c19]'
                }`}
              >
                <Icon className="w-3.5 h-3.5" />
                <span>{tab.label}</span>
              </button>
            );
          })}
        </div>
      </header>

      {/* Tab Content */}
      <div className="flex-1 overflow-y-auto p-4 sm:p-6">
        {/* ---------------- BOARD (KANBAN) ---------------- */}
        {activeTab === 'board' && (
          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-4 items-start pb-8">
            {KANBAN_COLUMNS.map((colStatus, colIdx) => {
              const colConf = TASK_STATUS_CONFIG[colStatus];
              const colTasks = projectTasks.filter((t) => getTaskStatus(t) === colStatus);
              const isDropTarget = dragOverCol === colStatus;

              return (
                <div
                  key={colStatus}
                  onDragOver={(e) => {
                    e.preventDefault();
                    setDragOverCol(colStatus);
                  }}
                  onDragLeave={() => setDragOverCol(null)}
                  onDrop={async (e) => {
                    e.preventDefault();
                    setDragOverCol(null);
                    const tId = draggedTaskId || e.dataTransfer.getData('text/plain');
                    setDraggedTaskId(null);
                    if (tId) {
                      await updateTask(tId, { kanbanStatus: colStatus });
                    }
                  }}
                  className={`bg-[#f2f6f3] rounded-2xl border p-3 flex flex-col gap-2.5 min-h-[260px] transition-all ${
                    isDropTarget ? 'border-[#174e36] ring-2 ring-[#174e36]/20 bg-[#edf5f0]' : 'border-[#e2e8e3]'
                  }`}
                >
                  {/* Column Header */}
                  <div className="flex items-center justify-between px-1 py-0.5">
                    <div className="flex items-center gap-2">
                      <span className={`w-2.5 h-2.5 rounded-full ${colConf.dotClass}`} />
                      <h3 className="text-xs font-bold text-[#171c19]">{colConf.label}</h3>
                    </div>
                    <span className="text-[11px] font-bold px-2 py-0.5 rounded-full bg-white text-[#52645a] border border-[#e2e8e3]">
                      {colTasks.length}
                    </span>
                  </div>

                  {/* Cards */}
                  <div className="space-y-2">
                    {colTasks.map((task) => {
                      const prio = task.priority || 'medium';
                      const prioConf = TASK_PRIORITY_CONFIG[prio];
                      const prevCol = colIdx > 0 ? KANBAN_COLUMNS[colIdx - 1] : null;
                      const nextCol =
                        colIdx < KANBAN_COLUMNS.length - 1 ? KANBAN_COLUMNS[colIdx + 1] : null;

                      return (
                        <div
                          key={task.id}
                          draggable
                          onDragStart={(e) => {
                            setDraggedTaskId(task.id);
                            e.dataTransfer.setData('text/plain', task.id);
                          }}
                          onDragEnd={() => {
                            setDraggedTaskId(null);
                            setDragOverCol(null);
                          }}
                          onClick={() => openTaskModal(task, selectedProject.id)}
                          className="bg-white rounded-xl border border-[#e2e8e3] hover:border-[#174e36] p-3 shadow-xs hover:shadow-md transition-all cursor-pointer space-y-2"
                        >
                          <div className="flex items-center justify-between gap-1.5">
                            <span
                              className={`text-[10px] font-semibold px-2 py-0.5 rounded-md border ${prioConf.bgClass}`}
                            >
                              {prioConf.label}
                            </span>

                            {/* Quick column arrows */}
                            <div
                              className="flex items-center gap-0.5"
                              onClick={(e) => e.stopPropagation()}
                            >
                              {prevCol && (
                                <button
                                  type="button"
                                  onClick={() => updateTask(task.id, { kanbanStatus: prevCol })}
                                  className="p-1 text-[#6b7d72] hover:text-[#174e36] hover:bg-[#edf5f0] rounded-md cursor-pointer"
                                  title={`Nach "${TASK_STATUS_CONFIG[prevCol].label}" verschieben`}
                                >
                                  <ChevronLeft className="w-3.5 h-3.5" />
                                </button>
                              )}
                              {nextCol && (
                                <button
                                  type="button"
                                  onClick={() => updateTask(task.id, { kanbanStatus: nextCol })}
                                  className="p-1 text-[#6b7d72] hover:text-[#174e36] hover:bg-[#edf5f0] rounded-md cursor-pointer"
                                  title={`Nach "${TASK_STATUS_CONFIG[nextCol].label}" verschieben`}
                                >
                                  <ChevronRight className="w-3.5 h-3.5" />
                                </button>
                              )}
                            </div>
                          </div>

                          <h4
                            className={`text-xs font-bold leading-snug ${
                              colStatus === 'done'
                                ? 'line-through text-[#8c9b92]'
                                : 'text-[#171c19]'
                            }`}
                          >
                            {task.title}
                          </h4>

                          {task.description && (
                            <p className="text-[11px] text-[#52645a] line-clamp-2">
                              {task.description}
                            </p>
                          )}

                          <div className="pt-1.5 border-t border-[#f0f4f1] flex items-center justify-between gap-2">
                            <div className="flex items-center gap-1.5 min-w-0">
                              {task.assigneeId ? (
                                <span
                                  className="inline-flex items-center gap-1 text-[10px] font-semibold px-2 py-0.5 rounded-full bg-[#edf5f0] text-[#174e36] truncate max-w-[120px]"
                                  title={`Zugewiesen an ${getUserLabel(task.assigneeId)}`}
                                >
                                  {getUserLabel(task.assigneeId)}
                                </span>
                              ) : (
                                <span className="text-[10px] text-[#8c9b92]">Nicht zugewiesen</span>
                              )}
                            </div>

                            <div className="flex items-center gap-1.5 shrink-0">
                              {task.dueDate && (
                                <span className="text-[10px] font-medium text-[#52645a]">
                                  {task.dueDate}
                                </span>
                              )}
                              {!task.completed && (
                                <button
                                  type="button"
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    openEventModal(
                                      {
                                        id: '',
                                        userId: '',
                                        title: task.title,
                                        description: task.description,
                                        date: task.dueDate || getTodayDateKey(),
                                        time: '10:00',
                                        durationMinutes: 60,
                                        category: task.category,
                                        recurrence: task.recurrence,
                                        projectId: selectedProject.id,
                                        sourceTaskId: task.id,
                                        createdAt: '',
                                        updatedAt: '',
                                      },
                                      task.dueDate || getTodayDateKey(),
                                      '10:00',
                                      selectedProject.id
                                    );
                                  }}
                                  className="p-1 text-[#52645a] hover:text-[#174e36] hover:bg-[#edf5f0] rounded-md cursor-pointer"
                                  title="Als Termin im Kalender einplanen"
                                >
                                  <CalendarIcon className="w-3.5 h-3.5" />
                                </button>
                              )}
                            </div>
                          </div>
                        </div>
                      );
                    })}
                  </div>

                  {/* Quick Add inside column */}
                  <div className="pt-1 flex items-center gap-1.5">
                    <input
                      type="text"
                      value={quickTaskTitleByCol[colStatus] || ''}
                      onChange={(e) =>
                        setQuickTaskTitleByCol((prev) => ({
                          ...prev,
                          [colStatus]: e.target.value,
                        }))
                      }
                      onKeyDown={(e) => {
                        if (e.key === 'Enter') {
                          e.preventDefault();
                          handleQuickAddTask(colStatus);
                        }
                      }}
                      placeholder="+ Aufgabe hinzufügen..."
                      className="flex-1 px-2.5 py-1.5 text-xs bg-white/80 focus:bg-white border border-[#d8e2db] focus:border-[#174e36] rounded-xl outline-none"
                    />
                  </div>
                </div>
              );
            })}
          </div>
        )}

        {/* ---------------- LISTE (MONDAY-STYLE) ---------------- */}
        {activeTab === 'list' && (
          <div className="space-y-5 pb-8">
            {(['in_progress', 'todo', 'backlog', 'done'] as TaskStatus[]).map((groupStatus) => {
              const conf = TASK_STATUS_CONFIG[groupStatus];
              const groupTasks = projectTasks.filter((t) => getTaskStatus(t) === groupStatus);

              return (
                <div
                  key={groupStatus}
                  className="bg-white rounded-2xl border border-[#e2e8e3] overflow-hidden shadow-xs"
                  style={{ borderLeftWidth: '4px', borderLeftColor: conf.color }}
                >
                  <div className="px-4 py-3 bg-[#fafcfa] border-b border-[#e8eee9] flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <span
                        className="text-xs font-bold"
                        style={{ color: conf.color }}
                      >
                        {conf.label}
                      </span>
                      <span className="text-[11px] font-semibold px-2 py-0.5 rounded-full bg-white border border-[#e2e8e3] text-[#52645a]">
                        {groupTasks.length}
                      </span>
                    </div>
                  </div>

                  {groupTasks.length > 0 && (
                    <div className="overflow-x-auto">
                      <table className="w-full text-left border-collapse min-w-[640px]">
                        <thead>
                          <tr className="border-b border-[#f0f4f1] text-[10px] uppercase tracking-wider text-[#6b7d72]">
                            <th className="py-2 px-4 font-semibold">Aufgabe</th>
                            <th className="py-2 px-3 font-semibold w-36">Status</th>
                            <th className="py-2 px-3 font-semibold w-28">Priorität</th>
                            <th className="py-2 px-3 font-semibold w-40">Zuständig</th>
                            <th className="py-2 px-3 font-semibold w-32">Fälligkeit</th>
                            <th className="py-2 px-3 font-semibold w-20 text-right">Aktion</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-[#f0f4f1]">
                          {groupTasks.map((task) => {
                            const prio = task.priority || 'medium';
                            return (
                              <tr
                                key={task.id}
                                className="hover:bg-[#fafcfa] transition-colors text-xs"
                              >
                                <td
                                  onClick={() => openTaskModal(task, selectedProject.id)}
                                  className="py-2.5 px-4 font-semibold text-[#171c19] cursor-pointer hover:text-[#174e36]"
                                >
                                  <span className={groupStatus === 'done' ? 'line-through text-[#8c9b92]' : ''}>
                                    {task.title}
                                  </span>
                                </td>
                                <td className="py-2 px-3">
                                  <select
                                    value={groupStatus}
                                    onChange={(e) =>
                                      updateTask(task.id, {
                                        kanbanStatus: e.target.value as TaskStatus,
                                      })
                                    }
                                    className={`w-full px-2 py-1 rounded-lg text-[11px] font-semibold border cursor-pointer outline-none ${conf.bgClass}`}
                                  >
                                    {KANBAN_COLUMNS.map((st) => (
                                      <option key={st} value={st}>
                                        {TASK_STATUS_CONFIG[st].label}
                                      </option>
                                    ))}
                                  </select>
                                </td>
                                <td className="py-2 px-3">
                                  <select
                                    value={prio}
                                    onChange={(e) =>
                                      updateTask(task.id, {
                                        priority: e.target.value as TaskPriority,
                                      })
                                    }
                                    className={`w-full px-2 py-1 rounded-lg text-[11px] font-semibold border cursor-pointer outline-none ${TASK_PRIORITY_CONFIG[prio].bgClass}`}
                                  >
                                    <option value="low">Niedrig</option>
                                    <option value="medium">Mittel</option>
                                    <option value="high">Hoch</option>
                                  </select>
                                </td>
                                <td className="py-2 px-3">
                                  <select
                                    value={task.assigneeId || ''}
                                    onChange={(e) =>
                                      updateTask(task.id, {
                                        assigneeId: e.target.value || undefined,
                                      })
                                    }
                                    className="w-full px-2 py-1 rounded-lg text-[11px] font-medium border border-[#d8e2db] bg-white text-[#171c19] cursor-pointer outline-none"
                                  >
                                    <option value="">Nicht zugewiesen</option>
                                    {selectedProject.memberIds.map((uid) => (
                                      <option key={uid} value={uid}>
                                        {getUserLabel(uid)}
                                      </option>
                                    ))}
                                  </select>
                                </td>
                                <td className="py-2 px-3">
                                  <input
                                    type="date"
                                    value={task.dueDate || ''}
                                    onChange={(e) =>
                                      updateTask(task.id, {
                                        dueDate: e.target.value || undefined,
                                      })
                                    }
                                    className="w-full px-2 py-1 rounded-lg text-[11px] border border-[#d8e2db] bg-white outline-none"
                                  />
                                </td>
                                <td className="py-2 px-3 text-right">
                                  <button
                                    type="button"
                                    onClick={() => deleteTask(task.id)}
                                    className="p-1 text-[#6b7d72] hover:text-rose-600 hover:bg-rose-50 rounded-lg cursor-pointer"
                                    title="Löschen"
                                  >
                                    <Trash2 className="w-3.5 h-3.5" />
                                  </button>
                                </td>
                              </tr>
                            );
                          })}
                        </tbody>
                      </table>
                    </div>
                  )}

                  {/* Quick Add row */}
                  <div className="px-4 py-2 bg-[#fafcfa] border-t border-[#f0f4f1] flex items-center gap-2">
                    <input
                      type="text"
                      value={quickTaskTitleByCol[`list_${groupStatus}`] || ''}
                      onChange={(e) =>
                        setQuickTaskTitleByCol((prev) => ({
                          ...prev,
                          [`list_${groupStatus}`]: e.target.value,
                        }))
                      }
                      onKeyDown={async (e) => {
                        if (e.key === 'Enter') {
                          e.preventDefault();
                          const t = (quickTaskTitleByCol[`list_${groupStatus}`] || '').trim();
                          if (!t) return;
                          setQuickTaskTitleByCol((prev) => ({
                            ...prev,
                            [`list_${groupStatus}`]: '',
                          }));
                          await addTask({
                            title: t,
                            category: 'Projekt',
                            recurrence: 'none',
                            projectId: selectedProject.id,
                            kanbanStatus: groupStatus,
                            priority: 'medium',
                          });
                        }
                      }}
                      placeholder={`+ Neue Aufgabe in "${conf.label}" hinzufügen...`}
                      className="flex-1 text-xs py-1 px-2 bg-transparent outline-none text-[#171c19] placeholder-[#7d8e84]"
                    />
                  </div>
                </div>
              );
            })}
          </div>
        )}

        {/* ---------------- IDEEN ---------------- */}
        {activeTab === 'ideas' && (
          <div className="space-y-4 pb-8">
            <div className="flex items-center justify-between">
              <p className="text-xs text-[#52645a]">
                Sammle Projektideen und wandle sie direkt in Aufgaben oder Termine um.
              </p>
              <button
                onClick={() => openIdeaModal(undefined, selectedProject.id)}
                className="flex items-center gap-1.5 px-3.5 py-2 bg-[#174e36] hover:bg-[#12402c] text-white rounded-xl text-xs font-semibold cursor-pointer shadow-xs"
              >
                <Plus className="w-4 h-4" />
                <span>Projekt-Idee</span>
              </button>
            </div>

            {projectIdeas.length === 0 ? (
              <div className="bg-white rounded-2xl border border-[#e2e8e3] p-10 text-center">
                <Lightbulb className="w-8 h-8 text-[#9bb0a3] mx-auto mb-2" />
                <h4 className="text-sm font-semibold text-[#171c19]">Noch keine Projekt-Ideen</h4>
                <p className="text-xs text-[#52645a] mt-0.5">
                  Halte erste Konzepte, Inspirationen oder Brainstorming-Notizen fest.
                </p>
              </div>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                {projectIdeas.map((idea) => {
                  const conf = CATEGORIES_CONFIG[idea.category] || CATEGORIES_CONFIG['Projekt'];
                  const isConverted = idea.status === 'converted';
                  return (
                    <div
                      key={idea.id}
                      onClick={() => openIdeaModal(idea, selectedProject.id)}
                      className="bg-white rounded-2xl border border-[#e2e8e3] hover:border-[#174e36] p-4 cursor-pointer transition-all hover:shadow-md flex flex-col justify-between gap-3"
                    >
                      <div>
                        <div className="flex items-center justify-between gap-2 mb-2">
                          <span
                            className={`text-[10px] font-semibold px-2 py-0.5 rounded-full border ${conf.bgLight}`}
                          >
                            {idea.category}
                          </span>
                          {isConverted ? (
                            <span className="text-[10px] font-semibold text-[#174e36] bg-[#edf5f0] px-2 py-0.5 rounded-full flex items-center gap-1">
                              <CheckCircle2 className="w-3 h-3" /> Umgewandelt
                            </span>
                          ) : (
                            <button
                              type="button"
                              onClick={(e) => {
                                e.stopPropagation();
                                openConvertIdeaModal(idea);
                              }}
                              className="p-1.5 text-[#174e36] bg-[#f4f7f5] hover:bg-[#174e36] hover:text-white rounded-lg transition-colors cursor-pointer"
                              title="In Aufgabe oder Termin umwandeln"
                            >
                              <Sparkles className="w-3.5 h-3.5" />
                            </button>
                          )}
                        </div>
                        <h4 className="text-sm font-bold text-[#171c19]">{idea.title}</h4>
                        {idea.description && (
                          <p className="text-xs text-[#52645a] mt-1 line-clamp-3">
                            {idea.description}
                          </p>
                        )}
                      </div>

                      {idea.authorName && (
                        <span className="text-[10px] text-[#7d8e84]">
                          Von {idea.authorName}
                        </span>
                      )}
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        )}

        {/* ---------------- TERMINE ---------------- */}
        {activeTab === 'events' && (
          <div className="space-y-4 pb-8">
            <div className="flex flex-wrap items-center justify-between gap-2">
              <p className="text-xs text-[#52645a]">
                Alle Termine dieses Projekts erscheinen automatisch auch in deinem Kalender.
              </p>
              <div className="flex items-center gap-2">
                {selectedProject.memberIds.length > 1 && user && (
                  <button
                    type="button"
                    onClick={() => openEventRequestModal({ projectId: selectedProject.id })}
                    className="flex items-center gap-1.5 px-3.5 py-2 bg-[#edf5f0] hover:bg-[#174e36] text-[#174e36] hover:text-white border border-[#cfe0d5] rounded-xl text-xs font-semibold transition-all cursor-pointer"
                  >
                    <CalendarPlus className="w-4 h-4" />
                    <span>Gemeinsamen Termin finden</span>
                  </button>
                )}
                <button
                  type="button"
                  onClick={() =>
                    openEventModal(undefined, getTodayDateKey(), '10:00', selectedProject.id)
                  }
                  className="flex items-center gap-1.5 px-3.5 py-2 bg-[#174e36] hover:bg-[#12402c] text-white rounded-xl text-xs font-semibold cursor-pointer shadow-xs"
                >
                  <Plus className="w-4 h-4" />
                  <span>Projekt-Termin</span>
                </button>
              </div>
            </div>

            {projectEvents.length === 0 ? (
              <div className="bg-white rounded-2xl border border-[#e2e8e3] p-10 text-center">
                <CalendarIcon className="w-8 h-8 text-[#9bb0a3] mx-auto mb-2" />
                <h4 className="text-sm font-semibold text-[#171c19]">Noch keine Projekt-Termine</h4>
                <p className="text-xs text-[#52645a] mt-0.5">
                  Plane Meilensteine, Meetings oder Arbeitssessions für dieses Projekt.
                </p>
              </div>
            ) : (
              <div className="space-y-2.5">
                {projectEvents.map((evt) => (
                  <div
                    key={evt.id}
                    onClick={() => openEventModal(evt)}
                    className="bg-white rounded-2xl border border-[#e2e8e3] hover:border-[#174e36] p-4 flex items-center justify-between gap-4 cursor-pointer transition-all shadow-xs"
                  >
                    <div className="flex items-center gap-3 min-w-0">
                      <div
                        className="w-2 h-10 rounded-full shrink-0"
                        style={{ backgroundColor: selectedProject.color }}
                      />
                      <div className="min-w-0">
                        <div className="flex items-center gap-2 text-[11px] font-bold text-[#174e36]">
                          <Clock className="w-3.5 h-3.5" />
                          <span>
                            {evt.date} · {evt.time} ({evt.durationMinutes} Min.)
                          </span>
                          {evt.isShared && (
                            <span className="px-2 py-0.5 rounded-full bg-[#edf5f0] text-[#143d2b] text-[10px]">
                              Gemeinsam
                            </span>
                          )}
                        </div>
                        <h4 className="text-sm font-bold text-[#171c19] truncate mt-0.5">
                          {evt.title}
                        </h4>
                        {evt.description && (
                          <p className="text-xs text-[#52645a] truncate">{evt.description}</p>
                        )}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* ---------------- TEAM & CHAT ---------------- */}
        {activeTab === 'team' && (
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-5 h-[calc(100vh-220px)] min-h-[480px]">
            {/* Left: Team Management */}
            <div className="lg:col-span-5 bg-white rounded-2xl border border-[#e2e8e3] p-4 flex flex-col gap-4 overflow-y-auto shadow-xs">
              <div>
                <h3 className="text-sm font-bold text-[#171c19] flex items-center gap-2">
                  <Users className="w-4 h-4 text-[#174e36]" />
                  <span>Projektteam ({selectedProject.memberIds.length})</span>
                </h3>
                <p className="text-[11px] text-[#52645a] mt-0.5">
                  Lade Freunde oder auch externe Nutzer direkt per @username nur für dieses Projekt ein.
                </p>
              </div>

              {!user ? (
                <div className="p-4 bg-[#f8faf8] rounded-xl border border-[#e2e8e3] text-center space-y-2">
                  <p className="text-xs text-[#52645a]">
                    Melde dich an, um andere Nutzer einzuladen und den Projekt-Chat zu nutzen.
                  </p>
                  <button
                    onClick={openAuthModal}
                    className="px-4 py-2 bg-[#174e36] text-white rounded-xl text-xs font-semibold cursor-pointer"
                  >
                    Anmelden / Registrieren
                  </button>
                </div>
              ) : (
                <>
                  {inviteMessage && (
                    <div className="p-2.5 bg-emerald-50 border border-emerald-200 text-emerald-800 rounded-xl text-xs font-medium">
                      {inviteMessage}
                    </div>
                  )}
                  {inviteError && (
                    <div className="p-2.5 bg-rose-50 border border-rose-200 text-rose-700 rounded-xl text-xs font-medium">
                      {inviteError}
                    </div>
                  )}

                  {/* Quick-invite from friends */}
                  {friends.length > 0 && (
                    <div className="space-y-1.5">
                      <span className="text-[11px] font-bold uppercase tracking-wider text-[#6b7d72]">
                        Freunde schnell einladen
                      </span>
                      <div className="flex flex-wrap gap-1.5">
                        {friends
                          .filter((f) => !selectedProject.memberIds.includes(f.friendUid))
                          .map((f) => (
                            <button
                              key={f.friendUid}
                              type="button"
                              onClick={() => handleInviteUid(f.friendUid)}
                              className="flex items-center gap-1 px-2.5 py-1 bg-[#f4f7f5] hover:bg-[#edf5f0] border border-[#d8e2db] hover:border-[#174e36] rounded-xl text-[11px] font-semibold text-[#171c19] cursor-pointer"
                            >
                              <Plus className="w-3 h-3 text-[#174e36]" />
                              <span>{f.profile?.displayName || `@${f.profile?.username}`}</span>
                            </button>
                          ))}
                      </div>
                    </div>
                  )}

                  {/* Search any user by @username */}
                  <div className="space-y-1.5">
                    <span className="text-[11px] font-bold uppercase tracking-wider text-[#6b7d72]">
                      Nutzer für Projekt anfragen
                    </span>
                    <UserSearchInput
                      placeholder="Nach @username oder E-Mail suchen..."
                      excludeUids={selectedProject.memberIds}
                      actionLabel="Einladen"
                      onSelectUser={(p) => handleInviteUid(p.uid)}
                    />
                  </div>
                </>
              )}

              {/* Members list */}
              <div className="space-y-2 pt-2 border-t border-[#f0f4f1]">
                <span className="text-[11px] font-bold uppercase tracking-wider text-[#6b7d72]">
                  Mitglieder
                </span>
                {selectedProject.memberIds.map((uid) => {
                  const prof = getProfile(uid);
                  const shares = Boolean(selectedProject.availabilitySharedBy?.[uid]);
                  const isOwner = uid === selectedProject.ownerId;
                  return (
                    <div
                      key={uid}
                      className="flex items-center justify-between gap-2 p-2 rounded-xl bg-[#fafcfa] border border-[#eef3ef]"
                    >
                      <div className="min-w-0">
                        <p className="text-xs font-semibold text-[#171c19] truncate">
                          {getUserLabel(uid)} {isOwner && <span className="text-[10px] text-[#174e36]">(Owner)</span>}
                        </p>
                        {prof?.username && (
                          <p className="text-[10px] text-[#52645a]">@{prof.username}</p>
                        )}
                      </div>
                      <span
                        className={`text-[10px] font-semibold px-2 py-0.5 rounded-full ${
                          shares
                            ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                            : 'bg-slate-100 text-slate-600'
                        }`}
                      >
                        {shares ? 'Freie Zeiten sichtbar' : 'Kalender privat'}
                      </span>
                    </div>
                  );
                })}

                {pendingInvitesForProject.length > 0 && (
                  <div className="pt-2 space-y-1.5">
                    <span className="text-[10px] font-bold uppercase tracking-wider text-[#6b7d72]">
                      Ausstehende Einladungen
                    </span>
                    {pendingInvitesForProject.map((inv) => (
                      <div
                        key={inv.id}
                        className="flex items-center justify-between p-2 rounded-xl bg-amber-50/60 border border-amber-200 text-xs"
                      >
                        <span className="font-medium text-[#171c19]">
                          {getUserLabel(inv.inviteeId)}
                        </span>
                        <span className="text-[10px] font-semibold text-amber-800">Angefragt</span>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {/* Leave project button for non-owners */}
              {user && selectedProject.ownerId !== user.uid && (
                <button
                  type="button"
                  onClick={async () => {
                    await exitProject(selectedProject.id);
                    navigate('/projects');
                  }}
                  className="mt-auto flex items-center justify-center gap-1.5 py-2 text-xs font-semibold text-rose-600 hover:bg-rose-50 rounded-xl border border-rose-200 cursor-pointer"
                >
                  <LogOut className="w-3.5 h-3.5" />
                  <span>Projekt verlassen</span>
                </button>
              )}
            </div>

            {/* Right: Project Chat */}
            <div className="lg:col-span-7 h-full min-h-[360px]">
              {user && projectChatRoom ? (
                <ChatPanel
                  room={projectChatRoom}
                  onProposeEvent={() =>
                    openEventRequestModal({ projectId: selectedProject.id })
                  }
                />
              ) : (
                <div className="h-full bg-white rounded-2xl border border-[#e2e8e3] flex items-center justify-center p-6 text-center text-xs text-[#52645a]">
                  Melde dich an, um den Echtzeit-Projektchat zu verwenden.
                </div>
              )}
            </div>
          </div>
        )}
      </div>

      <ProjectModal
        isOpen={isProjectModalOpen}
        editingProject={editingProject}
        onClose={() => setProjectModalOpen(false)}
      />
    </div>
  );
};
