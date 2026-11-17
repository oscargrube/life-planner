import React, { useState, useEffect, useMemo } from 'react';
import {
  X,
  CalendarPlus,
  Users,
  FolderKanban,
  Clock,
  Lock,
  CheckCircle2,
  AlertCircle,
} from 'lucide-react';
import { useApp } from '../../context/AppContext';
import { Category, Recurrence, CATEGORIES_CONFIG, BusySlot } from '../../types';
import { getTodayDateKey, isEventOnDate } from '../../utils/dateUtils';

type TargetMode = 'friends' | 'group' | 'project';

const timeToMinutes = (t: string): number => {
  const [h, m] = (t || '00:00').split(':').map(Number);
  return (h || 0) * 60 + (m || 0);
};

const minutesToTime = (totalMins: number): string => {
  const clamped = Math.max(0, Math.min(23 * 60 + 59, totalMins));
  const h = Math.floor(clamped / 60);
  const m = clamped % 60;
  return `${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')}`;
};

// 30-minute slots from 07:00 to 21:30
const TIMELINE_SLOTS = Array.from({ length: 30 }, (_, i) => 7 * 60 + i * 30);

function isSlotBusy(slots: BusySlot[], date: string, startMin: number, durMin: number): boolean {
  const endMin = startMin + durMin;
  return slots.some((s) => {
    if (!isEventOnDate(s.date, s.recurrence, date)) return false;
    const sStart = timeToMinutes(s.time);
    const sEnd = sStart + (s.durationMinutes || 60);
    return startMin < sEnd && endMin > sStart;
  });
}

export const EventRequestModal: React.FC = () => {
  const {
    user,
    isEventRequestModalOpen,
    eventRequestPreset,
    closeEventRequestModal,
    friends,
    friendGroups,
    projects,
    availabilityByUser,
    canSeeAvailability,
    getUserLabel,
    sendEventRequest,
  } = useApp();

  const [targetMode, setTargetMode] = useState<TargetMode>('friends');
  const [selectedProjectId, setSelectedProjectId] = useState('');
  const [selectedGroupId, setSelectedGroupId] = useState('');
  const [selectedFriendIds, setSelectedFriendIds] = useState<string[]>([]);

  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [date, setDate] = useState(getTodayDateKey());
  const [time, setTime] = useState('15:00');
  const [durationMinutes, setDurationMinutes] = useState(60);
  const [category, setCategory] = useState<Category>('Persönlich');
  const [recurrence, setRecurrence] = useState<Recurrence>('none');

  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!isEventRequestModalOpen) return;
    setError(null);
    setTitle(eventRequestPreset?.title || '');
    setDescription('');
    setDate(eventRequestPreset?.date || getTodayDateKey());
    setTime(eventRequestPreset?.time || '15:00');
    setDurationMinutes(60);
    setRecurrence('none');

    if (eventRequestPreset?.projectId) {
      setTargetMode('project');
      setSelectedProjectId(eventRequestPreset.projectId);
      setCategory('Projekt');
    } else if (eventRequestPreset?.friendGroupId) {
      setTargetMode('group');
      setSelectedGroupId(eventRequestPreset.friendGroupId);
      setCategory('Persönlich');
    } else {
      setTargetMode('friends');
      setSelectedFriendIds(eventRequestPreset?.inviteeIds || []);
      setCategory('Persönlich');
    }
  }, [isEventRequestModalOpen, eventRequestPreset]);

  const inviteeIds = useMemo(() => {
    if (!user) return [];
    if (targetMode === 'project') {
      const proj = projects.find((p) => p.id === selectedProjectId);
      return proj ? proj.memberIds.filter((id) => id !== user.uid) : [];
    }
    if (targetMode === 'group') {
      const grp = friendGroups.find((g) => g.id === selectedGroupId);
      return grp ? grp.memberIds.filter((id) => id !== user.uid) : [];
    }
    return selectedFriendIds;
  }, [user, targetMode, selectedProjectId, selectedGroupId, selectedFriendIds, projects, friendGroups]);

  const allCheckParticipants = useMemo(() => {
    if (!user) return [];
    return [user.uid, ...inviteeIds];
  }, [user, inviteeIds]);

  const scope = useMemo(() => {
    if (targetMode === 'project' && selectedProjectId) return { projectId: selectedProjectId };
    if (targetMode === 'group' && selectedGroupId) return { friendGroupId: selectedGroupId };
    return undefined;
  }, [targetMode, selectedProjectId, selectedGroupId]);

  if (!isEventRequestModalOpen) return null;

  const toggleFriend = (uid: string) => {
    setSelectedFriendIds((prev) =>
      prev.includes(uid) ? prev.filter((id) => id !== uid) : [...prev, uid]
    );
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    if (!user) {
      setError('Bitte melde dich an, um Terminanfragen zu senden.');
      return;
    }
    if (!title.trim()) {
      setError('Bitte gib einen Titel ein.');
      return;
    }
    if (inviteeIds.length === 0) {
      setError('Bitte wähle mindestens eine Person, Gruppe oder ein Projekt mit Mitgliedern aus.');
      return;
    }

    setSubmitting(true);
    try {
      await sendEventRequest({
        title,
        description,
        date,
        time,
        durationMinutes,
        category,
        recurrence,
        projectId: targetMode === 'project' ? selectedProjectId : undefined,
        friendGroupId: targetMode === 'group' ? selectedGroupId : undefined,
        inviteeIds,
      });
      closeEventRequestModal();
    } catch (err: any) {
      setError(err?.message || 'Terminanfrage konnte nicht gesendet werden.');
    } finally {
      setSubmitting(false);
    }
  };

  const categories = Object.keys(CATEGORIES_CONFIG) as Category[];
  const selectedStartMin = timeToMinutes(time);
  const selectedEndMin = selectedStartMin + durationMinutes;

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-[#171c19]/40 backdrop-blur-xs p-0 sm:p-4">
      <div
        className="bg-white rounded-t-2xl sm:rounded-2xl max-w-2xl w-full max-h-[92dvh] flex flex-col shadow-2xl border border-[#e2e8e3] text-[#171c19] overflow-hidden"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="p-4 sm:p-5 bg-[#fafcfa] border-b border-[#e2e8e3] flex items-center justify-between shrink-0">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-[#edf5f0] text-[#174e36] border border-[#cfe0d5] flex items-center justify-center shadow-xs">
              <CalendarPlus className="w-4.5 h-4.5" />
            </div>
            <div>
              <h2 className="text-base font-bold text-[#171c19]">
                Terminfinder & Terminanfrage
              </h2>
              <p className="text-xs text-[#52645a]">
                Freie Zeiten vergleichen und gemeinsamen Termin vorschlagen
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={closeEventRequestModal}
            className="p-1.5 text-[#52645a] hover:text-[#171c19] hover:bg-[#f3f7f4] rounded-xl cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="flex-1 flex flex-col min-h-0">
          <div className="flex-1 overflow-y-auto p-4 sm:p-5 space-y-4">
            {error && (
              <div className="p-3 bg-rose-50 border border-rose-200 text-rose-700 rounded-xl text-xs flex items-start gap-2">
                <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
                <span>{error}</span>
              </div>
            )}

            {/* Target Mode Tabs */}
            <div>
              <label className="block text-xs font-semibold text-[#37443d] mb-1.5">
                Wen möchtest du einladen?
              </label>
              <div className="grid grid-cols-3 gap-2 bg-[#f4f7f5] p-1 rounded-xl border border-[#d8e2db]">
                <button
                  type="button"
                  onClick={() => setTargetMode('friends')}
                  className={`py-1.5 px-2 rounded-lg text-xs font-semibold transition-all cursor-pointer flex items-center justify-center gap-1.5 ${
                    targetMode === 'friends'
                      ? 'bg-[#174e36] text-white shadow-xs'
                      : 'text-[#52645a] hover:text-[#171c19]'
                  }`}
                >
                  <Users className="w-3.5 h-3.5" />
                  <span>Freunde</span>
                </button>
                <button
                  type="button"
                  onClick={() => setTargetMode('group')}
                  className={`py-1.5 px-2 rounded-lg text-xs font-semibold transition-all cursor-pointer flex items-center justify-center gap-1.5 ${
                    targetMode === 'group'
                      ? 'bg-[#174e36] text-white shadow-xs'
                      : 'text-[#52645a] hover:text-[#171c19]'
                  }`}
                >
                  <Users className="w-3.5 h-3.5" />
                  <span>Gruppe</span>
                </button>
                <button
                  type="button"
                  onClick={() => setTargetMode('project')}
                  className={`py-1.5 px-2 rounded-lg text-xs font-semibold transition-all cursor-pointer flex items-center justify-center gap-1.5 ${
                    targetMode === 'project'
                      ? 'bg-[#174e36] text-white shadow-xs'
                      : 'text-[#52645a] hover:text-[#171c19]'
                  }`}
                >
                  <FolderKanban className="w-3.5 h-3.5" />
                  <span>Projekt</span>
                </button>
              </div>
            </div>

            {/* Recipient Picker */}
            {targetMode === 'friends' && (
              <div className="bg-[#fafcfa] border border-[#e2e8e3] rounded-xl p-3">
                {friends.length === 0 ? (
                  <p className="text-xs text-[#6b7d72]">
                    Du hast noch keine Freunde hinzugefügt. Füge Freunde im Social Hub hinzu oder wähle ein Projekt.
                  </p>
                ) : (
                  <div className="flex flex-wrap gap-1.5">
                    {friends.map((f) => {
                      const active = selectedFriendIds.includes(f.friendUid);
                      return (
                        <button
                          key={f.friendUid}
                          type="button"
                          onClick={() => toggleFriend(f.friendUid)}
                          className={`px-3 py-1.5 rounded-xl text-xs font-semibold border transition-all flex items-center gap-1.5 cursor-pointer ${
                            active
                              ? 'bg-[#174e36] text-white border-[#174e36] shadow-xs'
                              : 'bg-white text-[#37443d] border-[#d8e2db] hover:bg-[#edf5f0]'
                          }`}
                        >
                          <span>{f.profile?.displayName || `@${f.profile?.username || 'User'}`}</span>
                          {f.theyShareAvailability ? (
                            <span
                              className={`w-1.5 h-1.5 rounded-full ${
                                active ? 'bg-[#86e3b5]' : 'bg-emerald-500'
                              }`}
                              title="Teilt freie Zeiten"
                            />
                          ) : (
                            <Lock className="w-3 h-3 opacity-60" />
                          )}
                        </button>
                      );
                    })}
                  </div>
                )}
              </div>
            )}

            {targetMode === 'group' && (
              <div>
                <select
                  value={selectedGroupId}
                  onChange={(e) => setSelectedGroupId(e.target.value)}
                  className="w-full px-3.5 py-2 rounded-xl border border-[#d8e2db] bg-white text-xs font-medium text-[#171c19] outline-none cursor-pointer"
                >
                  <option value="">Freundesgruppe wählen...</option>
                  {friendGroups.map((g) => (
                    <option key={g.id} value={g.id}>
                      {g.name} ({g.memberIds.length} Mitglieder)
                    </option>
                  ))}
                </select>
              </div>
            )}

            {targetMode === 'project' && (
              <div>
                <select
                  value={selectedProjectId}
                  onChange={(e) => setSelectedProjectId(e.target.value)}
                  className="w-full px-3.5 py-2 rounded-xl border border-[#d8e2db] bg-white text-xs font-medium text-[#171c19] outline-none cursor-pointer"
                >
                  <option value="">Projekt wählen...</option>
                  {projects
                    .filter((p) => p.memberIds.length > 1)
                    .map((p) => (
                      <option key={p.id} value={p.id}>
                        {p.title} ({p.memberIds.length} Mitglieder)
                      </option>
                    ))}
                </select>
              </div>
            )}

            {/* Title */}
            <div>
              <label className="block text-xs font-semibold text-[#37443d] mb-1.5">
                Titel des Termins *
              </label>
              <input
                type="text"
                required
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="z. B. Projekt-Sync, Kinoabend oder Lernsession"
                className="w-full px-3.5 py-2 rounded-xl border border-[#d8e2db] bg-white text-[#171c19] text-sm outline-none focus:border-[#174e36]"
              />
            </div>

            {/* Date, Start Time, Duration */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <div>
                <label className="block text-xs font-semibold text-[#37443d] mb-1.5">
                  Datum *
                </label>
                <input
                  type="date"
                  required
                  value={date}
                  onChange={(e) => setDate(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl border border-[#d8e2db] bg-white text-sm outline-none focus:border-[#174e36]"
                />
              </div>
              <div>
                <label className="block text-xs font-semibold text-[#37443d] mb-1.5">
                  Startzeit *
                </label>
                <input
                  type="time"
                  required
                  value={time}
                  onChange={(e) => setTime(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl border border-[#d8e2db] bg-white text-sm outline-none focus:border-[#174e36]"
                />
              </div>
              <div>
                <label className="block text-xs font-semibold text-[#37443d] mb-1.5">
                  Dauer
                </label>
                <select
                  value={durationMinutes}
                  onChange={(e) => setDurationMinutes(Number(e.target.value))}
                  className="w-full px-3 py-2 rounded-xl border border-[#d8e2db] bg-white text-sm outline-none cursor-pointer focus:border-[#174e36]"
                >
                  <option value={30}>30 Min.</option>
                  <option value={45}>45 Min.</option>
                  <option value={60}>1 Std.</option>
                  <option value={90}>1,5 Std.</option>
                  <option value={120}>2 Std.</option>
                  <option value={180}>3 Std.</option>
                </select>
              </div>
            </div>

            {/* Visual Availability Finder */}
            <div className="bg-[#f8faf8] border border-[#e2e8e3] rounded-2xl p-3.5 space-y-2.5">
              <div className="flex flex-wrap items-center justify-between gap-2">
                <div className="flex items-center gap-1.5">
                  <Clock className="w-4 h-4 text-[#174e36]" />
                  <span className="text-xs font-bold text-[#171c19]">
                    Freie Zeiten am {date}
                  </span>
                </div>
                <div className="flex items-center gap-3 text-[10px] text-[#52645a]">
                  <span className="flex items-center gap-1">
                    <span className="w-2.5 h-2.5 rounded-xs bg-emerald-400 inline-block" /> Frei
                  </span>
                  <span className="flex items-center gap-1">
                    <span className="w-2.5 h-2.5 rounded-xs bg-rose-300 inline-block" /> Belegt
                  </span>
                  <span className="flex items-center gap-1">
                    <span className="w-2.5 h-2.5 rounded-xs bg-[#174e36] inline-block" /> Gewählt
                  </span>
                </div>
              </div>

              <p className="text-[11px] text-[#52645a]">
                Klicke auf ein grünes Zeitfenster, um die Startzeit automatisch zu übernehmen.
              </p>

              {/* Hour labels */}
              <div className="overflow-x-auto pb-1">
                <div className="min-w-[540px] space-y-2">
                  <div className="flex items-center">
                    <div className="w-28 shrink-0 text-[10px] font-semibold text-[#52645a]">
                      Alle (Kombiniert)
                    </div>
                    <div
                      className="flex-1 grid gap-0.5"
                      style={{ gridTemplateColumns: 'repeat(30, minmax(0, 1fr))' }}
                    >
                      {TIMELINE_SLOTS.map((slotMin) => {
                        const visibleUsers = allCheckParticipants.filter((uid) =>
                          canSeeAvailability(uid, scope)
                        );
                        const anyBusy = visibleUsers.some((uid) =>
                          isSlotBusy(availabilityByUser[uid] || [], date, slotMin, 30)
                        );
                        const isPicked =
                          slotMin >= selectedStartMin && slotMin < selectedEndMin;
                        const slotLabel = minutesToTime(slotMin);

                        return (
                          <button
                            key={slotMin}
                            type="button"
                            onClick={() => setTime(slotLabel)}
                            title={`${slotLabel} – ${anyBusy ? 'Mind. eine Person belegt' : 'Alle frei'}`}
                            className={`h-6 rounded-[3px] transition-all cursor-pointer ${
                              isPicked
                                ? 'bg-[#174e36] ring-1 ring-[#0f3424]'
                                : anyBusy
                                ? 'bg-rose-200 hover:bg-rose-300'
                                : 'bg-emerald-300 hover:bg-emerald-500'
                            }`}
                          />
                        );
                      })}
                    </div>
                  </div>

                  {/* Time markers */}
                  <div className="flex items-center">
                    <div className="w-28 shrink-0" />
                    <div className="flex-1 flex justify-between text-[9px] text-[#6b7d72] font-medium px-0.5">
                      <span>07:00</span>
                      <span>10:00</span>
                      <span>13:00</span>
                      <span>16:00</span>
                      <span>19:00</span>
                      <span>22:00</span>
                    </div>
                  </div>

                  {/* Per-participant rows */}
                  <div className="space-y-1 pt-1 border-t border-[#e2e8e3]">
                    {allCheckParticipants.map((uid) => {
                      const canView = canSeeAvailability(uid, scope);
                      const slots = availabilityByUser[uid] || [];
                      return (
                        <div key={uid} className="flex items-center">
                          <div className="w-28 shrink-0 pr-2 flex items-center gap-1 truncate">
                            <span className="text-[11px] font-medium text-[#171c19] truncate">
                              {uid === user?.uid ? 'Ich' : getUserLabel(uid)}
                            </span>
                          </div>
                          {canView ? (
                            <div
                      className="flex-1 grid gap-0.5"
                      style={{ gridTemplateColumns: 'repeat(30, minmax(0, 1fr))' }}
                    >
                              {TIMELINE_SLOTS.map((slotMin) => {
                                const busy = isSlotBusy(slots, date, slotMin, 30);
                                return (
                                  <div
                                    key={slotMin}
                                    title={`${minutesToTime(slotMin)}: ${busy ? 'Belegt' : 'Frei'}`}
                                    className={`h-3.5 rounded-[2px] ${
                                      busy ? 'bg-rose-300' : 'bg-emerald-200'
                                    }`}
                                  />
                                );
                              })}
                            </div>
                          ) : (
                            <div className="flex-1 flex items-center gap-1.5 text-[10px] text-[#6b7d72] bg-white border border-dashed border-[#d8e2db] rounded-md px-2 py-0.5">
                              <Lock className="w-3 h-3 shrink-0" />
                              <span>Freie Zeiten nicht geteilt</span>
                            </div>
                          )}
                        </div>
                      );
                    })}
                  </div>
                </div>
              </div>
            </div>

            {/* Category & Recurrence */}
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-semibold text-[#37443d] mb-1.5">
                  Kategorie
                </label>
                <select
                  value={category}
                  onChange={(e) => setCategory(e.target.value as Category)}
                  className="w-full px-3 py-2 rounded-xl border border-[#d8e2db] bg-white text-xs font-medium outline-none cursor-pointer"
                >
                  {categories.map((c) => (
                    <option key={c} value={c}>
                      {c}
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-xs font-semibold text-[#37443d] mb-1.5">
                  Wiederholung
                </label>
                <select
                  value={recurrence}
                  onChange={(e) => setRecurrence(e.target.value as Recurrence)}
                  className="w-full px-3 py-2 rounded-xl border border-[#d8e2db] bg-white text-xs font-medium outline-none cursor-pointer"
                >
                  <option value="none">Einmalig</option>
                  <option value="daily">Täglich</option>
                  <option value="weekly">Wöchentlich</option>
                  <option value="monthly">Monatlich</option>
                </select>
              </div>
            </div>

            {/* Notes */}
            <div>
              <label className="block text-xs font-semibold text-[#37443d] mb-1.5">
                Nachricht / Details (optional)
              </label>
              <textarea
                rows={2}
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="Treffpunkt, Agenda oder kurze Info..."
                className="w-full px-3.5 py-2 rounded-xl border border-[#d8e2db] bg-white text-sm outline-none resize-none focus:border-[#174e36]"
              />
            </div>
          </div>

          <div className="px-4 sm:px-5 py-3.5 flex items-center justify-between border-t border-[#e8eee9] bg-[#fafcfa] shrink-0">
            <span className="text-[11px] text-[#52645a] flex items-center gap-1">
              <CheckCircle2 className="w-3.5 h-3.5 text-[#174e36]" />
              {inviteeIds.length} {inviteeIds.length === 1 ? 'Person' : 'Personen'} eingeladen
            </span>

            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={closeEventRequestModal}
                className="px-4 py-2 text-xs font-semibold text-[#52645a] hover:text-[#171c19] hover:bg-[#f3f7f4] rounded-xl cursor-pointer"
              >
                Abbrechen
              </button>
              <button
                type="submit"
                disabled={submitting}
                className="px-5 py-2 bg-[#174e36] hover:bg-[#12402c] disabled:opacity-50 text-white text-xs font-semibold rounded-xl shadow-xs cursor-pointer"
              >
                {submitting ? 'Sende...' : 'Terminanfrage senden'}
              </button>
            </div>
          </div>
        </form>
      </div>
    </div>
  );
};
