import React, { useState, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Users,
  MessageSquare,
  Bell,
  FolderKanban,
  UserPlus,
  CalendarPlus,
  Check,
  X,
  Eye,
  EyeOff,
  Plus,
  Send,
  Clock,
  Menu,
  LogIn,
  ArrowLeft,
  Trash2,
  LogOut,
  Sparkles,
} from 'lucide-react';
import { useApp } from '../context/AppContext';
import { ChatRoom, FriendGroup, PROJECT_COLORS } from '../types';
import { UserSearchInput } from '../components/social/UserSearchInput';
import { ChatPanel } from '../components/social/ChatPanel';

type SocialTab = 'overview' | 'friends' | 'groups' | 'chats';

export const SocialHubPage: React.FC = () => {
  const navigate = useNavigate();
  const {
    user,
    userProfile,
    openAuthModal,
    setMobileSidebarOpen,
    friends,
    incomingFriendRequests,
    outgoingFriendRequests,
    friendGroups,
    incomingGroupInvites,
    projects,
    incomingProjectInvites,
    eventRequests,
    incomingEventRequests,
    chatRooms,
    pendingRequestsCount,
    getProfile,
    getUserLabel,
    requestFriend,
    answerFriendRequest,
    setFriendAvailabilitySharing,
    unfriend,
    addFriendGroup,
    inviteFriendToGroup,
    answerGroupInvite,
    setGroupAvailabilitySharing,
    exitFriendGroup,
    removeFriendGroup,
    answerProjectInvite,
    answerEventRequest,
    cancelEventRequest,
    openDirectChat,
    openProjectOrGroupChat,
    openEventRequestModal,
  } = useApp();

  const [activeTab, setActiveTab] = useState<SocialTab>('overview');
  const [selectedChatId, setSelectedChatId] = useState<string | null>(null);

  // Friend request sharing preference
  const [shareOnFriendSend, setShareOnFriendSend] = useState(true);
  const [shareOnAcceptMap, setShareOnAcceptMap] = useState<Record<string, boolean>>({});
  const [feedback, setFeedback] = useState<{ type: 'ok' | 'err'; msg: string } | null>(null);

  // Create Friend Group modal/inline state
  const [showCreateGroup, setShowCreateGroup] = useState(false);
  const [groupName, setGroupName] = useState('');
  const [groupDesc, setGroupDesc] = useState('');
  const [groupColor, setGroupColor] = useState(PROJECT_COLORS[1]);
  const [groupInvitees, setGroupInvitees] = useState<string[]>([]);
  const [groupShareAvail, setGroupShareAvail] = useState(true);
  const [creatingGroup, setCreatingGroup] = useState(false);

  const selectedChatRoom = useMemo(
    () => chatRooms.find((r) => r.id === selectedChatId) || null,
    [chatRooms, selectedChatId]
  );

  const myAcceptedGroups = useMemo(() => {
    if (!user) return [];
    return friendGroups.filter((g) => g.memberIds.includes(user.uid));
  }, [user, friendGroups]);

  const showToast = (type: 'ok' | 'err', msg: string) => {
    setFeedback({ type, msg });
    setTimeout(() => setFeedback(null), 3500);
  };

  const getShareDefault = (id: string) =>
    shareOnAcceptMap[id] !== undefined ? shareOnAcceptMap[id] : true;

  const setSharePref = (id: string, val: boolean) =>
    setShareOnAcceptMap((prev) => ({ ...prev, [id]: val }));

  const handleStartDirectChat = async (friendUid: string) => {
    const room = await openDirectChat(friendUid);
    setSelectedChatId(room.id);
    setActiveTab('chats');
  };

  const handleOpenGroupChat = async (group: FriendGroup) => {
    const room = await openProjectOrGroupChat({
      id: `grp_${group.id}`,
      type: 'group',
      title: group.name,
      participantIds: group.memberIds,
      friendGroupId: group.id,
    });
    setSelectedChatId(room.id);
    setActiveTab('chats');
  };

  const handleOpenProjectChat = async (projectId: string) => {
    const proj = projects.find((p) => p.id === projectId);
    if (!proj) return;
    const room = await openProjectOrGroupChat({
      id: `proj_${proj.id}`,
      type: 'project',
      title: proj.title,
      participantIds: proj.memberIds,
      projectId: proj.id,
    });
    setSelectedChatId(room.id);
    setActiveTab('chats');
  };

  const handleCreateGroup = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!groupName.trim() || creatingGroup) return;
    setCreatingGroup(true);
    try {
      await addFriendGroup({
        name: groupName,
        description: groupDesc,
        color: groupColor,
        inviteeIds: groupInvitees,
        shareAvailability: groupShareAvail,
      });
      setGroupName('');
      setGroupDesc('');
      setGroupInvitees([]);
      setShowCreateGroup(false);
      showToast('ok', 'Freundesgruppe erstellt & Einladungen gesendet!');
    } catch (err: any) {
      showToast('err', err?.message || 'Gruppe konnte nicht erstellt werden.');
    } finally {
      setCreatingGroup(false);
    }
  };

  const getChatDisplayTitle = (room: ChatRoom) => {
    if (room.type === 'dm') {
      const other = room.participantIds.find((id) => id !== user?.uid);
      return getUserLabel(other);
    }
    return room.title || 'Chat';
  };

  // Guest Gate
  if (!user) {
    return (
      <div className="flex-1 flex flex-col h-full bg-[#f8faf8] text-[#171c19]">
        <header className="p-4 sm:p-6 bg-white border-b border-[#e2e8e3] flex items-center gap-3">
          <button
            onClick={() => setMobileSidebarOpen(true)}
            className="md:hidden p-1.5 -ml-1.5 text-[#52645a] hover:bg-[#f4f7f5] rounded-lg cursor-pointer"
          >
            <Menu className="w-6 h-6" />
          </button>
          <div className="w-9 h-9 rounded-xl bg-[#edf5f0] border border-[#cfe0d5] text-[#174e36] flex items-center justify-center">
            <Users className="w-5 h-5" />
          </div>
          <h2 className="text-xl font-bold">Social Hub</h2>
        </header>

        <div className="flex-1 flex items-center justify-center p-6">
          <div className="max-w-md w-full bg-white rounded-2xl border border-[#e2e8e3] p-8 text-center shadow-xs space-y-4">
            <div className="w-12 h-12 rounded-2xl bg-[#edf5f0] border border-[#cfe0d5] text-[#174e36] flex items-center justify-center mx-auto">
              <Sparkles className="w-6 h-6" />
            </div>
            <h3 className="text-lg font-bold text-[#171c19]">
              Verbinde dich mit Freunden & Teams
            </h3>
            <p className="text-xs text-[#52645a] leading-relaxed">
              Melde dich an und lege deinen @username fest, um Freunde hinzuzufügen, Freundesgruppen zu gründen, freie Zeiten im Kalender abzugleichen und gemeinsam an Projekten zu arbeiten.
            </p>
            <button
              onClick={openAuthModal}
              className="inline-flex items-center gap-2 px-5 py-2.5 bg-[#174e36] hover:bg-[#12402c] text-white rounded-xl text-xs font-semibold shadow-xs cursor-pointer"
            >
              <LogIn className="w-4 h-4 text-[#86e3b5]" />
              <span>Jetzt anmelden / registrieren</span>
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="flex-1 flex flex-col h-full overflow-hidden bg-[#f8faf8] text-[#171c19]">
      {/* Header */}
      <header className="bg-white border-b border-[#e2e8e3] px-4 sm:px-6 pt-4 pb-0 shrink-0 shadow-xs">
        <div className="flex flex-wrap items-center justify-between gap-3 pb-3">
          <div className="flex items-center gap-2.5">
            <button
              onClick={() => setMobileSidebarOpen(true)}
              className="md:hidden p-1.5 -ml-1.5 text-[#52645a] hover:bg-[#f4f7f5] rounded-lg cursor-pointer"
            >
              <Menu className="w-6 h-6" />
            </button>
            <div className="w-9 h-9 rounded-xl bg-[#edf5f0] border border-[#cfe0d5] text-[#174e36] flex items-center justify-center shadow-xs">
              <Users className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-xl font-bold text-[#171c19] tracking-tight">Social Hub</h2>
                {userProfile?.username && (
                  <span className="text-[11px] font-semibold px-2 py-0.5 rounded-full bg-[#edf5f0] text-[#174e36] border border-[#cfe0d5]">
                    @{userProfile.username}
                  </span>
                )}
              </div>
              <p className="text-xs text-[#52645a] hidden sm:block">
                Freunde, Gruppen, Projekte, Chats & Terminanfragen an einem Ort
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={() => openEventRequestModal()}
            className="flex items-center gap-1.5 px-3.5 py-2 bg-[#174e36] hover:bg-[#12402c] text-white rounded-xl text-xs font-semibold shadow-xs cursor-pointer"
          >
            <CalendarPlus className="w-4 h-4" />
            <span>Terminanfrage</span>
          </button>
        </div>

        {/* Navigation Tabs */}
        <div className="flex items-center gap-1 overflow-x-auto no-scrollbar">
          {(
            [
              {
                id: 'overview',
                label: 'Übersicht & Anfragen',
                icon: Bell,
                badge: pendingRequestsCount,
              },
              {
                id: 'friends',
                label: `Freunde (${friends.length})`,
                icon: UserPlus,
                badge: 0,
              },
              {
                id: 'groups',
                label: `Freundesgruppen (${myAcceptedGroups.length})`,
                icon: Users,
                badge: incomingGroupInvites.length,
              },
              {
                id: 'chats',
                label: `Chats (${chatRooms.length})`,
                icon: MessageSquare,
                badge: 0,
              },
            ] as const
          ).map((t) => {
            const Icon = t.icon;
            const active = activeTab === t.id;
            return (
              <button
                key={t.id}
                onClick={() => setActiveTab(t.id)}
                className={`flex items-center gap-1.5 px-3.5 py-2.5 text-xs font-semibold border-b-2 transition-all whitespace-nowrap cursor-pointer ${
                  active
                    ? 'border-[#174e36] text-[#174e36]'
                    : 'border-transparent text-[#52645a] hover:text-[#171c19]'
                }`}
              >
                <Icon className="w-3.5 h-3.5" />
                <span>{t.label}</span>
                {t.badge > 0 && (
                  <span className="px-1.5 py-0.2 rounded-full bg-rose-500 text-white text-[10px] font-bold">
                    {t.badge}
                  </span>
                )}
              </button>
            );
          })}
        </div>
      </header>

      {/* Main Content */}
      <div className="flex-1 overflow-y-auto p-4 sm:p-6 space-y-5">
        {feedback && (
          <div
            className={`p-3 rounded-xl text-xs font-semibold border ${
              feedback.type === 'ok'
                ? 'bg-emerald-50 border-emerald-200 text-emerald-800'
                : 'bg-rose-50 border-rose-200 text-rose-700'
            }`}
          >
            {feedback.msg}
          </div>
        )}

        {/* ==================== TAB 1: OVERVIEW & REQUESTS ==================== */}
        {activeTab === 'overview' && (
          <div className="space-y-6 pb-8">
            {/* Summary Cards */}
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
              <button
                onClick={() => setActiveTab('friends')}
                className="bg-white p-4 rounded-2xl border border-[#e2e8e3] hover:border-[#174e36] text-left transition-all shadow-xs cursor-pointer"
              >
                <span className="text-[11px] font-semibold text-[#52645a]">Freunde</span>
                <p className="text-2xl font-bold text-[#171c19] mt-1">{friends.length}</p>
              </button>
              <button
                onClick={() => setActiveTab('groups')}
                className="bg-white p-4 rounded-2xl border border-[#e2e8e3] hover:border-[#174e36] text-left transition-all shadow-xs cursor-pointer"
              >
                <span className="text-[11px] font-semibold text-[#52645a]">Freundesgruppen</span>
                <p className="text-2xl font-bold text-[#171c19] mt-1">{myAcceptedGroups.length}</p>
              </button>
              <button
                onClick={() => navigate('/projects')}
                className="bg-white p-4 rounded-2xl border border-[#e2e8e3] hover:border-[#174e36] text-left transition-all shadow-xs cursor-pointer"
              >
                <span className="text-[11px] font-semibold text-[#52645a]">Projekte</span>
                <p className="text-2xl font-bold text-[#171c19] mt-1">{projects.length}</p>
              </button>
              <button
                onClick={() => setActiveTab('chats')}
                className="bg-white p-4 rounded-2xl border border-[#e2e8e3] hover:border-[#174e36] text-left transition-all shadow-xs cursor-pointer"
              >
                <span className="text-[11px] font-semibold text-[#52645a]">Aktive Chats</span>
                <p className="text-2xl font-bold text-[#171c19] mt-1">{chatRooms.length}</p>
              </button>
            </div>

            {/* Incoming Requests Section */}
            <div className="space-y-4">
              <h3 className="text-sm font-bold text-[#171c19] flex items-center gap-2">
                <Bell className="w-4 h-4 text-[#174e36]" />
                <span>Offene Anfragen & Einladungen ({pendingRequestsCount})</span>
              </h3>

              {pendingRequestsCount === 0 ? (
                <div className="bg-white rounded-2xl border border-[#e2e8e3] p-6 text-center text-xs text-[#52645a]">
                  Keine offenen Anfragen – du bist auf dem neuesten Stand!
                </div>
              ) : (
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-3">
                  {/* Friend Requests */}
                  {incomingFriendRequests.map((req) => {
                    const prof = getProfile(req.requesterId);
                    const shareVal = getShareDefault(req.id);
                    return (
                      <div
                        key={req.id}
                        className="bg-white rounded-2xl border border-[#e2e8e3] p-4 space-y-3 shadow-xs"
                      >
                        <div className="flex items-start justify-between gap-2">
                          <div>
                            <span className="text-[10px] font-bold uppercase tracking-wider text-sky-700 bg-sky-50 px-2 py-0.5 rounded-full">
                              Freundschaftsanfrage
                            </span>
                            <h4 className="text-sm font-bold text-[#171c19] mt-1.5">
                              {getUserLabel(req.requesterId)}
                            </h4>
                            {prof?.username && (
                              <p className="text-xs text-[#52645a]">@{prof.username}</p>
                            )}
                          </div>
                        </div>

                        <label className="flex items-center gap-2 text-xs text-[#37443d] bg-[#f8faf8] p-2.5 rounded-xl border border-[#eef3ef] cursor-pointer">
                          <input
                            type="checkbox"
                            checked={shareVal}
                            onChange={(e) => setSharePref(req.id, e.target.checked)}
                            className="w-3.5 h-3.5 accent-[#174e36] cursor-pointer"
                          />
                          <span>Freie Zeiten im Kalender teilen</span>
                        </label>

                        <div className="flex items-center gap-2">
                          <button
                            onClick={() => answerFriendRequest(req.id, true, shareVal)}
                            className="flex-1 flex items-center justify-center gap-1 py-2 bg-[#174e36] hover:bg-[#12402c] text-white rounded-xl text-xs font-semibold cursor-pointer"
                          >
                            <Check className="w-3.5 h-3.5" /> Annehmen
                          </button>
                          <button
                            onClick={() => answerFriendRequest(req.id, false, false)}
                            className="px-4 py-2 bg-[#f4f7f5] hover:bg-rose-50 hover:text-rose-600 text-[#52645a] rounded-xl text-xs font-semibold cursor-pointer"
                          >
                            Ablehnen
                          </button>
                        </div>
                      </div>
                    );
                  })}

                  {/* Project Invites */}
                  {incomingProjectInvites.map((inv) => {
                    const shareVal = getShareDefault(inv.id);
                    return (
                      <div
                        key={inv.id}
                        className="bg-white rounded-2xl border border-[#e2e8e3] p-4 space-y-3 shadow-xs"
                      >
                        <div className="flex items-start justify-between gap-2">
                          <div>
                            <span className="text-[10px] font-bold uppercase tracking-wider text-indigo-700 bg-indigo-50 px-2 py-0.5 rounded-full">
                              Projekt-Einladung
                            </span>
                            <h4 className="text-sm font-bold text-[#171c19] mt-1.5 flex items-center gap-2">
                              <span
                                className="w-2.5 h-2.5 rounded-full shrink-0"
                                style={{ backgroundColor: inv.projectColor }}
                              />
                              {inv.projectTitle}
                            </h4>
                            <p className="text-xs text-[#52645a]">
                              Eingeladen von {getUserLabel(inv.inviterId)}
                            </p>
                          </div>
                        </div>

                        <label className="flex items-center gap-2 text-xs text-[#37443d] bg-[#f8faf8] p-2.5 rounded-xl border border-[#eef3ef] cursor-pointer">
                          <input
                            type="checkbox"
                            checked={shareVal}
                            onChange={(e) => setSharePref(inv.id, e.target.checked)}
                            className="w-3.5 h-3.5 accent-[#174e36] cursor-pointer"
                          />
                          <span>Meine freien Zeiten mit dem Projektteam teilen</span>
                        </label>

                        <div className="flex items-center gap-2">
                          <button
                            onClick={() => answerProjectInvite(inv, true, shareVal)}
                            className="flex-1 flex items-center justify-center gap-1 py-2 bg-[#174e36] hover:bg-[#12402c] text-white rounded-xl text-xs font-semibold cursor-pointer"
                          >
                            <Check className="w-3.5 h-3.5" /> Beitreten
                          </button>
                          <button
                            onClick={() => answerProjectInvite(inv, false, false)}
                            className="px-4 py-2 bg-[#f4f7f5] hover:bg-rose-50 hover:text-rose-600 text-[#52645a] rounded-xl text-xs font-semibold cursor-pointer"
                          >
                            Ablehnen
                          </button>
                        </div>
                      </div>
                    );
                  })}

                  {/* Friend Group Invites */}
                  {incomingGroupInvites.map((grp) => {
                    const shareVal = getShareDefault(grp.id);
                    return (
                      <div
                        key={grp.id}
                        className="bg-white rounded-2xl border border-[#e2e8e3] p-4 space-y-3 shadow-xs"
                      >
                        <div>
                          <span className="text-[10px] font-bold uppercase tracking-wider text-amber-800 bg-amber-50 px-2 py-0.5 rounded-full">
                            Freundesgruppen-Einladung
                          </span>
                          <h4 className="text-sm font-bold text-[#171c19] mt-1.5 flex items-center gap-2">
                            <span
                              className="w-2.5 h-2.5 rounded-full shrink-0"
                              style={{ backgroundColor: grp.color }}
                            />
                            {grp.name}
                          </h4>
                          <p className="text-xs text-[#52645a]">
                            Erstellt von {getUserLabel(grp.createdBy)} · {grp.memberIds.length} Mitglieder
                          </p>
                        </div>

                        <label className="flex items-center gap-2 text-xs text-[#37443d] bg-[#f8faf8] p-2.5 rounded-xl border border-[#eef3ef] cursor-pointer">
                          <input
                            type="checkbox"
                            checked={shareVal}
                            onChange={(e) => setSharePref(grp.id, e.target.checked)}
                            className="w-3.5 h-3.5 accent-[#174e36] cursor-pointer"
                          />
                          <span>Freie Zeiten mit der Gruppe teilen</span>
                        </label>

                        <div className="flex items-center gap-2">
                          <button
                            onClick={() => answerGroupInvite(grp.id, true, shareVal)}
                            className="flex-1 flex items-center justify-center gap-1 py-2 bg-[#174e36] hover:bg-[#12402c] text-white rounded-xl text-xs font-semibold cursor-pointer"
                          >
                            <Check className="w-3.5 h-3.5" /> Beitreten
                          </button>
                          <button
                            onClick={() => answerGroupInvite(grp.id, false, false)}
                            className="px-4 py-2 bg-[#f4f7f5] hover:bg-rose-50 hover:text-rose-600 text-[#52645a] rounded-xl text-xs font-semibold cursor-pointer"
                          >
                            Ablehnen
                          </button>
                        </div>
                      </div>
                    );
                  })}

                  {/* Incoming Event Requests */}
                  {incomingEventRequests.map((req) => (
                    <div
                      key={req.id}
                      className="bg-white rounded-2xl border border-[#e2e8e3] p-4 space-y-3 shadow-xs"
                    >
                      <div>
                        <span className="text-[10px] font-bold uppercase tracking-wider text-emerald-800 bg-emerald-50 px-2 py-0.5 rounded-full">
                          Terminanfrage
                        </span>
                        <h4 className="text-sm font-bold text-[#171c19] mt-1.5">{req.title}</h4>
                        <p className="text-xs text-[#174e36] font-semibold flex items-center gap-1.5 mt-0.5">
                          <Clock className="w-3.5 h-3.5" />
                          <span>
                            {req.date} um {req.time} ({req.durationMinutes} Min.)
                          </span>
                        </p>
                        <p className="text-[11px] text-[#52645a] mt-0.5">
                          Vorgeschlagen von {getUserLabel(req.creatorId)}
                        </p>
                      </div>

                      <div className="flex items-center gap-2">
                        <button
                          onClick={() => answerEventRequest(req, true)}
                          className="flex-1 flex items-center justify-center gap-1 py-2 bg-[#174e36] hover:bg-[#12402c] text-white rounded-xl text-xs font-semibold cursor-pointer"
                        >
                          <Check className="w-3.5 h-3.5" /> Zusagen & in Kalender
                        </button>
                        <button
                          onClick={() => answerEventRequest(req, false)}
                          className="px-4 py-2 bg-[#f4f7f5] hover:bg-rose-50 hover:text-rose-600 text-[#52645a] rounded-xl text-xs font-semibold cursor-pointer"
                        >
                          Absagen
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Sent Event Requests Status */}
            {eventRequests.length > 0 && (
              <div className="space-y-3">
                <h3 className="text-sm font-bold text-[#171c19]">
                  Alle Terminanfragen ({eventRequests.length})
                </h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                  {eventRequests.map((req) => {
                    const myResp = req.responses?.[user.uid];
                    const isCreator = req.creatorId === user.uid;
                    return (
                      <div
                        key={req.id}
                        className="bg-white rounded-2xl border border-[#e2e8e3] p-4 flex flex-col justify-between gap-2.5 shadow-xs"
                      >
                        <div className="flex items-start justify-between gap-2">
                          <div>
                            <h4 className="text-xs font-bold text-[#171c19]">{req.title}</h4>
                            <p className="text-[11px] text-[#52645a]">
                              {req.date} · {req.time} ({req.durationMinutes} Min.) · Von{' '}
                              {getUserLabel(req.creatorId)}
                            </p>
                          </div>
                          {isCreator ? (
                            <button
                              onClick={() => cancelEventRequest(req.id)}
                              className="p-1 text-[#6b7d72] hover:text-rose-600 rounded-lg cursor-pointer"
                              title="Anfrage löschen"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          ) : (
                            <span
                              className={`text-[10px] font-semibold px-2 py-0.5 rounded-full ${
                                myResp === 'accepted'
                                  ? 'bg-emerald-50 text-emerald-700'
                                  : myResp === 'declined'
                                  ? 'bg-rose-50 text-rose-700'
                                  : 'bg-amber-50 text-amber-800'
                              }`}
                            >
                              {myResp === 'accepted'
                                ? 'Zugesagt'
                                : myResp === 'declined'
                                ? 'Abgesagt'
                                : 'Offen'}
                            </span>
                          )}
                        </div>

                        <div className="flex flex-wrap gap-1.5">
                          {req.inviteeIds.map((uid) => {
                            const st = req.responses?.[uid] || 'pending';
                            return (
                              <span
                                key={uid}
                                className={`text-[10px] font-medium px-2 py-0.5 rounded-full border ${
                                  st === 'accepted'
                                    ? 'bg-emerald-50 text-emerald-700 border-emerald-200'
                                    : st === 'declined'
                                    ? 'bg-rose-50 text-rose-700 border-rose-200'
                                    : 'bg-[#f8faf8] text-[#52645a] border-[#e2e8e3]'
                                }`}
                              >
                                {getUserLabel(uid)}:{' '}
                                {st === 'accepted' ? '✓' : st === 'declined' ? '✕' : '?'}
                              </span>
                            );
                          })}
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}

            {/* Quick Projects & Chats */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
              <div className="bg-white rounded-2xl border border-[#e2e8e3] p-4 space-y-3 shadow-xs">
                <div className="flex items-center justify-between">
                  <h3 className="text-sm font-bold text-[#171c19] flex items-center gap-2">
                    <FolderKanban className="w-4 h-4 text-[#174e36]" />
                    <span>Aktive Projekte</span>
                  </h3>
                  <button
                    onClick={() => navigate('/projects')}
                    className="text-xs font-semibold text-[#174e36] hover:underline cursor-pointer"
                  >
                    Alle öffnen &rarr;
                  </button>
                </div>
                {projects.length === 0 ? (
                  <p className="text-xs text-[#6b7d72]">Noch keine Projekte.</p>
                ) : (
                  <div className="space-y-2">
                    {projects.slice(0, 4).map((p) => (
                      <div
                        key={p.id}
                        className="p-2.5 rounded-xl bg-[#fafcfa] border border-[#eef3ef] flex items-center justify-between gap-2"
                      >
                        <button
                          onClick={() => navigate(`/projects/${p.id}`)}
                          className="flex items-center gap-2 min-w-0 text-left cursor-pointer"
                        >
                          <span
                            className="w-2.5 h-2.5 rounded-full shrink-0"
                            style={{ backgroundColor: p.color }}
                          />
                          <span className="text-xs font-semibold text-[#171c19] truncate hover:text-[#174e36]">
                            {p.title}
                          </span>
                        </button>
                        <button
                          onClick={() => handleOpenProjectChat(p.id)}
                          className="p-1.5 text-[#52645a] hover:text-[#174e36] hover:bg-[#edf5f0] rounded-lg cursor-pointer"
                          title="Projekt-Chat"
                        >
                          <MessageSquare className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              <div className="bg-white rounded-2xl border border-[#e2e8e3] p-4 space-y-3 shadow-xs">
                <div className="flex items-center justify-between">
                  <h3 className="text-sm font-bold text-[#171c19] flex items-center gap-2">
                    <MessageSquare className="w-4 h-4 text-[#174e36]" />
                    <span>Letzte Chats</span>
                  </h3>
                  <button
                    onClick={() => setActiveTab('chats')}
                    className="text-xs font-semibold text-[#174e36] hover:underline cursor-pointer"
                  >
                    Alle Chats &rarr;
                  </button>
                </div>
                {chatRooms.length === 0 ? (
                  <p className="text-xs text-[#6b7d72]">Noch keine Unterhaltungen gestartet.</p>
                ) : (
                  <div className="space-y-2">
                    {chatRooms.slice(0, 4).map((room) => (
                      <button
                        key={room.id}
                        onClick={() => {
                          setSelectedChatId(room.id);
                          setActiveTab('chats');
                        }}
                        className="w-full p-2.5 rounded-xl bg-[#fafcfa] hover:bg-[#edf5f0] border border-[#eef3ef] flex items-center justify-between gap-2 text-left cursor-pointer transition-colors"
                      >
                        <div className="min-w-0">
                          <p className="text-xs font-semibold text-[#171c19] truncate">
                            {getChatDisplayTitle(room)}
                          </p>
                          <p className="text-[11px] text-[#52645a] truncate">
                            {room.lastMessage || 'Unterhaltung öffnen'}
                          </p>
                        </div>
                        <span className="text-[10px] font-semibold px-2 py-0.5 rounded-full bg-white border border-[#e2e8e3] text-[#52645a] shrink-0">
                          {room.type === 'project'
                            ? 'Projekt'
                            : room.type === 'group'
                            ? 'Gruppe'
                            : '1:1'}
                        </span>
                      </button>
                    ))}
                  </div>
                )}
              </div>
            </div>
          </div>
        )}

        {/* ==================== TAB 2: FRIENDS ==================== */}
        {activeTab === 'friends' && (
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-5 pb-8">
            {/* Search & Add Friend */}
            <div className="lg:col-span-5 bg-white rounded-2xl border border-[#e2e8e3] p-5 space-y-4 h-fit shadow-xs">
              <div>
                <h3 className="text-sm font-bold text-[#171c19] flex items-center gap-2">
                  <UserPlus className="w-4 h-4 text-[#174e36]" />
                  <span>Freunde finden</span>
                </h3>
                <p className="text-xs text-[#52645a] mt-0.5">
                  Suche nach @username oder E-Mail-Adresse.
                </p>
              </div>

              <label className="flex items-start gap-2.5 p-3 rounded-xl bg-[#f8faf8] border border-[#e2e8e3] cursor-pointer">
                <input
                  type="checkbox"
                  checked={shareOnFriendSend}
                  onChange={(e) => setShareOnFriendSend(e.target.checked)}
                  className="mt-0.5 w-4 h-4 accent-[#174e36] cursor-pointer"
                />
                <div>
                  <span className="text-xs font-semibold text-[#171c19] block">
                    Meine freien Zeiten direkt teilen
                  </span>
                  <span className="text-[11px] text-[#52645a]">
                    Nur Frei/Belegt – keine privaten Termindetails.
                  </span>
                </div>
              </label>

              <UserSearchInput
                excludeUids={friends.map((f) => f.friendUid)}
                actionLabel="Anfragen"
                onSelectUser={async (p) => {
                  try {
                    await requestFriend(p.uid, shareOnFriendSend);
                    showToast('ok', `Freundschaftsanfrage an @${p.username} gesendet!`);
                  } catch (err: any) {
                    showToast('err', err?.message || 'Anfrage fehlgeschlagen.');
                  }
                }}
              />

              {outgoingFriendRequests.length > 0 && (
                <div className="pt-3 border-t border-[#f0f4f1] space-y-2">
                  <span className="text-[10px] font-bold uppercase tracking-wider text-[#6b7d72]">
                    Gesendete Anfragen
                  </span>
                  {outgoingFriendRequests.map((req) => (
                    <div
                      key={req.id}
                      className="flex items-center justify-between p-2 rounded-xl bg-[#fafcfa] border border-[#eef3ef] text-xs"
                    >
                      <span className="font-medium text-[#171c19]">
                        {getUserLabel(req.recipientId)}
                      </span>
                      <span className="text-[10px] font-semibold text-amber-700 bg-amber-50 px-2 py-0.5 rounded-full">
                        Ausstehend
                      </span>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Friends List */}
            <div className="lg:col-span-7 space-y-3">
              <h3 className="text-sm font-bold text-[#171c19]">
                Meine Freunde ({friends.length})
              </h3>
              {friends.length === 0 ? (
                <div className="bg-white rounded-2xl border border-[#e2e8e3] p-8 text-center text-xs text-[#52645a]">
                  Du hast noch keine Freunde verknüpft. Suche links nach einem @username!
                </div>
              ) : (
                friends.map((f) => (
                  <div
                    key={f.friendship.id}
                    className="bg-white rounded-2xl border border-[#e2e8e3] p-4 flex flex-wrap items-center justify-between gap-3 shadow-xs"
                  >
                    <div className="flex items-center gap-3 min-w-0">
                      <div className="w-10 h-10 rounded-full bg-[#edf5f0] border border-[#cfe0d5] text-[#174e36] flex items-center justify-center text-sm font-bold shrink-0">
                        {getUserLabel(f.friendUid).charAt(0).toUpperCase()}
                      </div>
                      <div className="min-w-0">
                        <h4 className="text-sm font-bold text-[#171c19] truncate">
                          {getUserLabel(f.friendUid)}
                        </h4>
                        <div className="flex items-center gap-2 flex-wrap">
                          {f.profile?.username && (
                            <span className="text-[11px] text-[#52645a]">
                              @{f.profile.username}
                            </span>
                          )}
                          <span
                            className={`text-[10px] font-semibold px-2 py-0.5 rounded-full ${
                              f.theyShareAvailability
                                ? 'bg-emerald-50 text-emerald-700'
                                : 'bg-slate-100 text-slate-600'
                            }`}
                          >
                            {f.theyShareAvailability
                              ? 'Freie Zeiten sichtbar'
                              : 'Kalender privat'}
                          </span>
                        </div>
                      </div>
                    </div>

                    <div className="flex items-center gap-1.5 flex-wrap">
                      <button
                        type="button"
                        onClick={() =>
                          setFriendAvailabilitySharing(f.friendship.id, !f.iShareAvailability)
                        }
                        className={`flex items-center gap-1 px-2.5 py-1.5 rounded-xl text-[11px] font-semibold border cursor-pointer ${
                          f.iShareAvailability
                            ? 'bg-[#edf5f0] text-[#174e36] border-[#cfe0d5]'
                            : 'bg-white text-[#52645a] border-[#d8e2db]'
                        }`}
                        title="Einstellen, ob diese Person deine freien Zeiten sehen darf"
                      >
                        {f.iShareAvailability ? (
                          <Eye className="w-3.5 h-3.5" />
                        ) : (
                          <EyeOff className="w-3.5 h-3.5" />
                        )}
                        <span>{f.iShareAvailability ? 'Teile Zeiten' : 'Privat'}</span>
                      </button>

                      <button
                        type="button"
                        onClick={() =>
                          openEventRequestModal({ inviteeIds: [f.friendUid] })
                        }
                        className="p-2 text-[#174e36] bg-[#edf5f0] hover:bg-[#174e36] hover:text-white rounded-xl transition-colors cursor-pointer"
                        title="Terminanfrage senden"
                      >
                        <CalendarPlus className="w-4 h-4" />
                      </button>

                      <button
                        type="button"
                        onClick={() => handleStartDirectChat(f.friendUid)}
                        className="p-2 text-[#174e36] bg-[#f4f7f5] hover:bg-[#174e36] hover:text-white rounded-xl transition-colors cursor-pointer"
                        title="Chat öffnen"
                      >
                        <MessageSquare className="w-4 h-4" />
                      </button>

                      <button
                        type="button"
                        onClick={() => unfriend(f.friendship.id)}
                        className="p-2 text-[#6b7d72] hover:text-rose-600 hover:bg-rose-50 rounded-xl transition-colors cursor-pointer"
                        title="Freund entfernen"
                      >
                        <X className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        )}

        {/* ==================== TAB 3: FRIEND GROUPS ==================== */}
        {activeTab === 'groups' && (
          <div className="space-y-5 pb-8">
            <div className="flex flex-wrap items-center justify-between gap-3">
              <div>
                <h3 className="text-sm font-bold text-[#171c19]">Freundesgruppen</h3>
                <p className="text-xs text-[#52645a]">
                  Unabhängig von Projekten – ideal für gemeinsame Aktivitäten, Chats & Terminplanung.
                </p>
              </div>
              <button
                type="button"
                onClick={() => setShowCreateGroup(!showCreateGroup)}
                className="flex items-center gap-1.5 px-3.5 py-2 bg-[#174e36] hover:bg-[#12402c] text-white rounded-xl text-xs font-semibold cursor-pointer shadow-xs"
              >
                <Plus className="w-4 h-4" />
                <span>Neue Gruppe</span>
              </button>
            </div>

            {showCreateGroup && (
              <form
                onSubmit={handleCreateGroup}
                className="bg-white rounded-2xl border border-[#e2e8e3] p-5 space-y-4 shadow-xs"
              >
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs font-semibold text-[#37443d] mb-1">
                      Gruppenname *
                    </label>
                    <input
                      type="text"
                      required
                      value={groupName}
                      onChange={(e) => setGroupName(e.target.value)}
                      placeholder="z. B. Freitag-Runde, Sportgruppe, WG"
                      className="w-full px-3 py-2 rounded-xl border border-[#d8e2db] text-xs outline-none focus:border-[#174e36]"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-[#37443d] mb-1">
                      Farbe
                    </label>
                    <div className="flex items-center gap-2 pt-1">
                      {PROJECT_COLORS.map((c) => (
                        <button
                          key={c}
                          type="button"
                          onClick={() => setGroupColor(c)}
                          className={`w-6 h-6 rounded-full cursor-pointer ${
                            groupColor === c ? 'ring-2 ring-offset-2 ring-[#171c19]' : ''
                          }`}
                          style={{ backgroundColor: c }}
                        />
                      ))}
                    </div>
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-[#37443d] mb-1">
                    Beschreibung (optional)
                  </label>
                  <input
                    type="text"
                    value={groupDesc}
                    onChange={(e) => setGroupDesc(e.target.value)}
                    placeholder="Wofür ist diese Gruppe?"
                    className="w-full px-3 py-2 rounded-xl border border-[#d8e2db] text-xs outline-none focus:border-[#174e36]"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-[#37443d] mb-1.5">
                    Freunde einladen
                  </label>
                  {friends.length === 0 ? (
                    <p className="text-xs text-[#6b7d72]">
                      Füge zuerst Freunde hinzu, um sie einzuladen.
                    </p>
                  ) : (
                    <div className="flex flex-wrap gap-1.5">
                      {friends.map((f) => {
                        const active = groupInvitees.includes(f.friendUid);
                        return (
                          <button
                            key={f.friendUid}
                            type="button"
                            onClick={() =>
                              setGroupInvitees((prev) =>
                                prev.includes(f.friendUid)
                                  ? prev.filter((id) => id !== f.friendUid)
                                  : [...prev, f.friendUid]
                              )
                            }
                            className={`px-3 py-1.5 rounded-xl text-xs font-semibold border cursor-pointer ${
                              active
                                ? 'bg-[#174e36] text-white border-[#174e36]'
                                : 'bg-[#fafcfa] text-[#37443d] border-[#d8e2db]'
                            }`}
                          >
                            {getUserLabel(f.friendUid)}
                          </button>
                        );
                      })}
                    </div>
                  )}
                </div>

                <label className="flex items-center gap-2 text-xs text-[#37443d] cursor-pointer">
                  <input
                    type="checkbox"
                    checked={groupShareAvail}
                    onChange={(e) => setGroupShareAvail(e.target.checked)}
                    className="w-4 h-4 accent-[#174e36] cursor-pointer"
                  />
                  <span>Meine freien Zeiten mit der Gruppe teilen</span>
                </label>

                <div className="flex justify-end gap-2">
                  <button
                    type="button"
                    onClick={() => setShowCreateGroup(false)}
                    className="px-4 py-2 text-xs font-semibold text-[#52645a] hover:bg-[#f3f7f4] rounded-xl cursor-pointer"
                  >
                    Abbrechen
                  </button>
                  <button
                    type="submit"
                    disabled={creatingGroup}
                    className="px-5 py-2 bg-[#174e36] hover:bg-[#12402c] text-white text-xs font-semibold rounded-xl cursor-pointer"
                  >
                    {creatingGroup ? 'Erstelle...' : 'Gruppe erstellen'}
                  </button>
                </div>
              </form>
            )}

            {myAcceptedGroups.length === 0 ? (
              <div className="bg-white rounded-2xl border border-[#e2e8e3] p-10 text-center">
                <Users className="w-8 h-8 text-[#9bb0a3] mx-auto mb-2" />
                <h4 className="text-sm font-semibold text-[#171c19]">Noch keine Freundesgruppen</h4>
                <p className="text-xs text-[#52645a] mt-0.5">
                  Gründe eine Gruppe, um gemeinsame Treffen zu besprechen und freie Zeiten zu vergleichen.
                </p>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {myAcceptedGroups.map((grp) => {
                  const iShare = Boolean(grp.availabilitySharedBy?.[user.uid]);
                  const invitableFriends = friends.filter(
                    (f) =>
                      !grp.memberIds.includes(f.friendUid) &&
                      !grp.pendingMemberIds.includes(f.friendUid)
                  );
                  return (
                    <div
                      key={grp.id}
                      className="bg-white rounded-2xl border border-[#e2e8e3] overflow-hidden shadow-xs flex flex-col justify-between"
                    >
                      <div className="h-1.5 w-full" style={{ backgroundColor: grp.color }} />
                      <div className="p-4 space-y-3">
                        <div className="flex items-start justify-between gap-2">
                          <div>
                            <h4 className="text-base font-bold text-[#171c19]">{grp.name}</h4>
                            {grp.description && (
                              <p className="text-xs text-[#52645a]">{grp.description}</p>
                            )}
                          </div>

                          <button
                            type="button"
                            onClick={() => setGroupAvailabilitySharing(grp.id, !iShare)}
                            className={`flex items-center gap-1 px-2.5 py-1 rounded-xl text-[10px] font-semibold border cursor-pointer shrink-0 ${
                              iShare
                                ? 'bg-[#edf5f0] text-[#174e36] border-[#cfe0d5]'
                                : 'bg-white text-[#52645a] border-[#d8e2db]'
                            }`}
                          >
                            {iShare ? <Eye className="w-3 h-3" /> : <EyeOff className="w-3 h-3" />}
                            <span>{iShare ? 'Zeiten geteilt' : 'Privat'}</span>
                          </button>
                        </div>

                        <div className="flex flex-wrap gap-1.5">
                          {grp.memberIds.map((uid) => (
                            <span
                              key={uid}
                              className="text-[10px] font-semibold px-2 py-0.5 rounded-full bg-[#f4f7f5] text-[#171c19] border border-[#e2e8e3]"
                            >
                              {getUserLabel(uid)}
                              {grp.availabilitySharedBy?.[uid] ? ' · 🟢' : ''}
                            </span>
                          ))}
                          {grp.pendingMemberIds.map((uid) => (
                            <span
                              key={uid}
                              className="text-[10px] font-medium px-2 py-0.5 rounded-full bg-amber-50 text-amber-800 border border-amber-200"
                            >
                              {getUserLabel(uid)} (eingeladen)
                            </span>
                          ))}
                        </div>

                        {invitableFriends.length > 0 && (
                          <div className="flex items-center gap-1.5 flex-wrap pt-1">
                            <span className="text-[10px] text-[#6b7d72]">Einladen:</span>
                            {invitableFriends.map((f) => (
                              <button
                                key={f.friendUid}
                                type="button"
                                onClick={() => inviteFriendToGroup(grp.id, f.friendUid)}
                                className="text-[10px] font-semibold px-2 py-0.5 rounded-lg bg-[#fafcfa] hover:bg-[#edf5f0] border border-[#d8e2db] cursor-pointer"
                              >
                                + {getUserLabel(f.friendUid)}
                              </button>
                            ))}
                          </div>
                        )}

                        <div className="pt-2 border-t border-[#f0f4f1] flex items-center justify-between gap-2">
                          <div className="flex items-center gap-2">
                            <button
                              type="button"
                              onClick={() => handleOpenGroupChat(grp)}
                              className="flex items-center gap-1.5 px-3 py-1.5 bg-[#f4f7f5] hover:bg-[#edf5f0] text-[#171c19] rounded-xl text-xs font-semibold cursor-pointer"
                            >
                              <MessageSquare className="w-3.5 h-3.5 text-[#174e36]" />
                              <span>Chat</span>
                            </button>
                            <button
                              type="button"
                              onClick={() => openEventRequestModal({ friendGroupId: grp.id })}
                              className="flex items-center gap-1.5 px-3 py-1.5 bg-[#174e36] hover:bg-[#12402c] text-white rounded-xl text-xs font-semibold cursor-pointer"
                            >
                              <CalendarPlus className="w-3.5 h-3.5" />
                              <span>Termin finden</span>
                            </button>
                          </div>

                          {grp.createdBy === user.uid ? (
                            <button
                              type="button"
                              onClick={() => removeFriendGroup(grp.id)}
                              className="p-1.5 text-[#6b7d72] hover:text-rose-600 rounded-lg cursor-pointer"
                              title="Gruppe löschen"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          ) : (
                            <button
                              type="button"
                              onClick={() => exitFriendGroup(grp.id)}
                              className="p-1.5 text-[#6b7d72] hover:text-rose-600 rounded-lg cursor-pointer"
                              title="Gruppe verlassen"
                            >
                              <LogOut className="w-3.5 h-3.5" />
                            </button>
                          )}
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        )}

        {/* ==================== TAB 4: UNIFIED CHATS ==================== */}
        {activeTab === 'chats' && (
          <div className="grid grid-cols-1 md:grid-cols-12 gap-4 h-[calc(100vh-220px)] min-h-[460px]">
            {/* Chat list */}
            <div
              className={`md:col-span-4 bg-white rounded-2xl border border-[#e2e8e3] overflow-hidden flex flex-col shadow-xs ${
                selectedChatRoom ? 'hidden md:flex' : 'flex'
              }`}
            >
              <div className="p-3.5 border-b border-[#e2e8e3] bg-[#fafcfa]">
                <h3 className="text-xs font-bold text-[#171c19] uppercase tracking-wider">
                  Unterhaltungen ({chatRooms.length})
                </h3>
              </div>

              <div className="flex-1 overflow-y-auto divide-y divide-[#f0f4f1]">
                {chatRooms.length === 0 ? (
                  <div className="p-6 text-center text-xs text-[#6b7d72]">
                    Starte einen Chat über einen Freund, eine Freundesgruppe oder ein Projekt.
                  </div>
                ) : (
                  chatRooms.map((room) => {
                    const isSelected = selectedChatRoom?.id === room.id;
                    return (
                      <button
                        key={room.id}
                        onClick={() => setSelectedChatId(room.id)}
                        className={`w-full p-3.5 text-left transition-colors cursor-pointer flex items-start justify-between gap-2 ${
                          isSelected ? 'bg-[#edf5f0]' : 'hover:bg-[#fafcfa]'
                        }`}
                      >
                        <div className="min-w-0">
                          <p className="text-xs font-bold text-[#171c19] truncate">
                            {getChatDisplayTitle(room)}
                          </p>
                          <p className="text-[11px] text-[#52645a] truncate mt-0.5">
                            {room.lastMessage || 'Noch keine Nachrichten'}
                          </p>
                        </div>
                        <span className="text-[10px] font-semibold px-2 py-0.5 rounded-full bg-white border border-[#e2e8e3] text-[#52645a] shrink-0">
                          {room.type === 'project'
                            ? 'Projekt'
                            : room.type === 'group'
                            ? 'Gruppe'
                            : 'DM'}
                        </span>
                      </button>
                    );
                  })
                )}
              </div>
            </div>

            {/* Active Chat Panel */}
            <div
              className={`md:col-span-8 h-full flex flex-col ${
                selectedChatRoom ? 'flex' : 'hidden md:flex'
              }`}
            >
              {selectedChatRoom ? (
                <div className="flex-1 flex flex-col h-full gap-2">
                  <button
                    type="button"
                    onClick={() => setSelectedChatId(null)}
                    className="md:hidden self-start flex items-center gap-1 text-xs font-semibold text-[#174e36] px-2 py-1"
                  >
                    <ArrowLeft className="w-3.5 h-3.5" /> Zurück zu allen Chats
                  </button>
                  <div className="flex-1 min-h-0">
                    <ChatPanel
                      room={selectedChatRoom}
                      onProposeEvent={() => {
                        if (selectedChatRoom.projectId) {
                          openEventRequestModal({ projectId: selectedChatRoom.projectId });
                        } else if (selectedChatRoom.friendGroupId) {
                          openEventRequestModal({ friendGroupId: selectedChatRoom.friendGroupId });
                        } else {
                          const other = selectedChatRoom.participantIds.filter(
                            (id) => id !== user.uid
                          );
                          openEventRequestModal({ inviteeIds: other });
                        }
                      }}
                    />
                  </div>
                </div>
              ) : (
                <div className="h-full bg-white rounded-2xl border border-[#e2e8e3] flex flex-col items-center justify-center p-8 text-center shadow-xs">
                  <Send className="w-8 h-8 text-[#9bb0a3] mb-2" />
                  <h4 className="text-sm font-bold text-[#171c19]">Wähle einen Chat aus</h4>
                  <p className="text-xs text-[#52645a] mt-1">
                    Hier siehst du alle Direktnachrichten, Freundesgruppen und Projekt-Chats.
                  </p>
                </div>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
