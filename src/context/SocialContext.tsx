import React, { createContext, useContext, useState, useEffect, useMemo, useCallback } from 'react';
import {
  UserProfile,
  BusySlot,
  Friendship,
  FriendGroup,
  Project,
  ProjectInvite,
  EventRequest,
  ChatRoom,
  Category,
  Recurrence,
  ProjectStatus,
} from '../types';
import {
  fetchUserProfilesByIds,
  subscribeToUsersAvailability,
  subscribeToFriendships,
  sendFriendRequest,
  respondToFriendRequest,
  toggleFriendAvailability,
  removeFriendship,
  subscribeToFriendGroups,
  createFriendGroup,
  inviteToFriendGroup,
  respondToFriendGroupInvite,
  toggleGroupAvailability,
  leaveFriendGroup,
  deleteFriendGroup,
  subscribeToProjects,
  createProjectInFirestore,
  updateProjectInFirestore,
  deleteProjectInFirestore,
  toggleProjectAvailability,
  leaveProjectInFirestore,
  subscribeToProjectInvites,
  sendProjectInvite,
  respondToProjectInvite,
  subscribeToEventRequests,
  createEventRequest,
  respondToEventRequest,
  deleteEventRequest,
  subscribeToChatRooms,
  ensureDirectChatRoom,
  ensureGroupOrProjectChatRoom,
} from '../firebase/socialService';
import { useAuth } from './AuthContext';

export interface ResolvedFriend {
  friendship: Friendship;
  friendUid: string;
  profile?: UserProfile;
  iShareAvailability: boolean;
  theyShareAvailability: boolean;
}

interface SocialContextType {
  profilesCache: Record<string, UserProfile>;
  availabilityByUser: Record<string, BusySlot[]>;
  availabilityAllowedUids: string[];
  friendships: Friendship[];
  friends: ResolvedFriend[];
  incomingFriendRequests: Friendship[];
  outgoingFriendRequests: Friendship[];
  friendGroups: FriendGroup[];
  incomingGroupInvites: FriendGroup[];
  projects: Project[];
  projectInvites: ProjectInvite[];
  incomingProjectInvites: ProjectInvite[];
  eventRequests: EventRequest[];
  incomingEventRequests: EventRequest[];
  chatRooms: ChatRoom[];
  pendingRequestsCount: number;

  // Helpers
  getProfile: (uid?: string) => UserProfile | undefined;
  getUserLabel: (uid?: string) => string;
  canSeeAvailability: (uid: string, scope?: { projectId?: string; friendGroupId?: string }) => boolean;

  // Friend Actions
  requestFriend: (recipientId: string, shareAvailability: boolean) => Promise<void>;
  answerFriendRequest: (friendshipId: string, accept: boolean, shareAvailability: boolean) => Promise<void>;
  setFriendAvailabilitySharing: (friendshipId: string, share: boolean) => Promise<void>;
  unfriend: (friendshipId: string) => Promise<void>;

  // Friend Group Actions
  addFriendGroup: (data: {
    name: string;
    description?: string;
    color: string;
    inviteeIds: string[];
    shareAvailability: boolean;
  }) => Promise<FriendGroup>;
  inviteFriendToGroup: (groupId: string, uid: string) => Promise<void>;
  answerGroupInvite: (groupId: string, accept: boolean, shareAvailability: boolean) => Promise<void>;
  setGroupAvailabilitySharing: (groupId: string, share: boolean) => Promise<void>;
  exitFriendGroup: (groupId: string) => Promise<void>;
  removeFriendGroup: (groupId: string) => Promise<void>;

  // Project Actions
  addProject: (data: {
    title: string;
    description?: string;
    color: string;
    targetDate?: string;
    shareAvailability?: boolean;
  }) => Promise<Project>;
  updateProject: (id: string, updates: Partial<Project>) => Promise<void>;
  deleteProject: (id: string) => Promise<void>;
  setProjectAvailabilitySharing: (projectId: string, share: boolean) => Promise<void>;
  exitProject: (projectId: string) => Promise<void>;
  inviteUserToProject: (project: Project, inviteeId: string) => Promise<void>;
  answerProjectInvite: (invite: ProjectInvite, accept: boolean, shareAvailability: boolean) => Promise<void>;

  // Event Request Actions
  sendEventRequest: (data: {
    title: string;
    description?: string;
    date: string;
    time: string;
    durationMinutes: number;
    category: Category;
    recurrence: Recurrence;
    projectId?: string;
    friendGroupId?: string;
    inviteeIds: string[];
  }) => Promise<EventRequest>;
  answerEventRequest: (request: EventRequest, accept: boolean) => Promise<void>;
  cancelEventRequest: (requestId: string) => Promise<void>;

  // Chat Helpers
  openDirectChat: (otherUid: string) => Promise<ChatRoom>;
  openProjectOrGroupChat: (params: {
    id: string;
    type: 'project' | 'group';
    title: string;
    participantIds: string[];
    projectId?: string;
    friendGroupId?: string;
  }) => Promise<ChatRoom>;
}

const SocialContext = createContext<SocialContextType | undefined>(undefined);

export const SocialProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { user, userProfile } = useAuth();

  const [profilesCache, setProfilesCache] = useState<Record<string, UserProfile>>({});
  const [availabilityByUser, setAvailabilityByUser] = useState<Record<string, BusySlot[]>>({});
  const [friendships, setFriendships] = useState<Friendship[]>([]);
  const [friendGroups, setFriendGroups] = useState<FriendGroup[]>([]);
  const [projects, setProjects] = useState<Project[]>([]);
  const [projectInvites, setProjectInvites] = useState<ProjectInvite[]>([]);
  const [eventRequests, setEventRequests] = useState<EventRequest[]>([]);
  const [chatRooms, setChatRooms] = useState<ChatRoom[]>([]);

  // Put current user profile into cache
  useEffect(() => {
    if (userProfile) {
      setProfilesCache((prev) => ({ ...prev, [userProfile.uid]: userProfile }));
    }
  }, [userProfile]);

  // Reset social state on logout
  useEffect(() => {
    if (!user) {
      setFriendships([]);
      setFriendGroups([]);
      setProjects([]);
      setProjectInvites([]);
      setEventRequests([]);
      setChatRooms([]);
      setAvailabilityByUser({});
    }
  }, [user]);

  // Subscribe to all social collections for logged-in user
  useEffect(() => {
    if (!user) return;
    const u1 = subscribeToFriendships(user.uid, setFriendships);
    const u2 = subscribeToFriendGroups(user.uid, setFriendGroups);
    const u3 = subscribeToProjects(user.uid, setProjects);
    const u4 = subscribeToProjectInvites(user.uid, setProjectInvites);
    const u5 = subscribeToEventRequests(user.uid, setEventRequests);
    const u6 = subscribeToChatRooms(user.uid, setChatRooms);

    return () => {
      u1();
      u2();
      u3();
      u4();
      u5();
      u6();
    };
  }, [user]);

  // Gather all referenced UIDs and fetch missing profiles
  useEffect(() => {
    if (!user) return;
    const allUids = new Set<string>();
    friendships.forEach((f) => f.users.forEach((id) => allUids.add(id)));
    friendGroups.forEach((g) => {
      g.memberIds.forEach((id) => allUids.add(id));
      g.pendingMemberIds.forEach((id) => allUids.add(id));
    });
    projects.forEach((p) => p.memberIds.forEach((id) => allUids.add(id)));
    projectInvites.forEach((inv) => {
      allUids.add(inv.inviterId);
      allUids.add(inv.inviteeId);
    });
    eventRequests.forEach((r) => {
      allUids.add(r.creatorId);
      r.inviteeIds.forEach((id) => allUids.add(id));
    });
    chatRooms.forEach((c) => c.participantIds.forEach((id) => allUids.add(id)));

    const missing = Array.from(allUids).filter((id) => id && !profilesCache[id]);
    if (missing.length === 0) return;

    let cancelled = false;
    fetchUserProfilesByIds(missing).then((fetched) => {
      if (!cancelled && Object.keys(fetched).length > 0) {
        setProfilesCache((prev) => ({ ...prev, ...fetched }));
      }
    });

    return () => {
      cancelled = true;
    };
  }, [user, friendships, friendGroups, projects, projectInvites, eventRequests, chatRooms, profilesCache]);

  // Compute all UIDs whose calendar free/busy slots the current user is allowed to see
  const availabilityAllowedUids = useMemo(() => {
    if (!user) return [];
    const allowed = new Set<string>();
    allowed.add(user.uid); // always include self

    // 1. Friends who share availability
    friendships.forEach((f) => {
      if (f.status === 'accepted') {
        const other = f.users.find((id) => id !== user.uid);
        if (other && f.shareAvailabilityByUser?.[other]) {
          allowed.add(other);
        }
      }
    });

    // 2. Friend groups where members share availability
    friendGroups.forEach((g) => {
      if (g.memberIds.includes(user.uid)) {
        g.memberIds.forEach((m) => {
          if (g.availabilitySharedBy?.[m]) allowed.add(m);
        });
      }
    });

    // 3. Projects where members share availability
    projects.forEach((p) => {
      if (p.memberIds.includes(user.uid)) {
        p.memberIds.forEach((m) => {
          if (p.availabilitySharedBy?.[m]) allowed.add(m);
        });
      }
    });

    return Array.from(allowed).sort();
  }, [user, friendships, friendGroups, projects]);

  const availabilityKey = availabilityAllowedUids.join(',');
  useEffect(() => {
    if (!user || availabilityAllowedUids.length === 0) {
      setAvailabilityByUser({});
      return;
    }
    const unsub = subscribeToUsersAvailability(availabilityAllowedUids, setAvailabilityByUser);
    return () => unsub();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user, availabilityKey]);

  const canSeeAvailability = useCallback(
    (uid: string, scope?: { projectId?: string; friendGroupId?: string }) => {
      if (!user) return false;
      if (uid === user.uid) return true;

      if (scope?.projectId) {
        const proj = projects.find((p) => p.id === scope.projectId);
        if (proj && proj.memberIds.includes(user.uid) && proj.availabilitySharedBy?.[uid]) {
          return true;
        }
      }

      if (scope?.friendGroupId) {
        const grp = friendGroups.find((g) => g.id === scope.friendGroupId);
        if (grp && grp.memberIds.includes(user.uid) && grp.availabilitySharedBy?.[uid]) {
          return true;
        }
      }

      // Check accepted friendship
      const fs = friendships.find(
        (f) => f.status === 'accepted' && f.users.includes(user.uid) && f.users.includes(uid)
      );
      if (fs && fs.shareAvailabilityByUser?.[uid]) return true;

      // Also check any shared project / group if no strict scope was passed
      if (!scope?.projectId && !scope?.friendGroupId) {
        if (projects.some((p) => p.memberIds.includes(user.uid) && p.availabilitySharedBy?.[uid])) {
          return true;
        }
        if (friendGroups.some((g) => g.memberIds.includes(user.uid) && g.availabilitySharedBy?.[uid])) {
          return true;
        }
      }

      return false;
    },
    [user, friendships, projects, friendGroups]
  );

  // Derived lists
  const friends = useMemo<ResolvedFriend[]>(() => {
    if (!user) return [];
    return friendships
      .filter((f) => f.status === 'accepted')
      .map((f) => {
        const friendUid = f.users.find((id) => id !== user.uid) || '';
        return {
          friendship: f,
          friendUid,
          profile: profilesCache[friendUid],
          iShareAvailability: Boolean(f.shareAvailabilityByUser?.[user.uid]),
          theyShareAvailability: Boolean(f.shareAvailabilityByUser?.[friendUid]),
        };
      })
      .filter((item) => item.friendUid);
  }, [user, friendships, profilesCache]);

  const incomingFriendRequests = useMemo(() => {
    if (!user) return [];
    return friendships.filter((f) => f.status === 'pending' && f.recipientId === user.uid);
  }, [user, friendships]);

  const outgoingFriendRequests = useMemo(() => {
    if (!user) return [];
    return friendships.filter((f) => f.status === 'pending' && f.requesterId === user.uid);
  }, [user, friendships]);

  const incomingGroupInvites = useMemo(() => {
    if (!user) return [];
    return friendGroups.filter((g) => g.pendingMemberIds.includes(user.uid));
  }, [user, friendGroups]);

  const incomingProjectInvites = useMemo(() => {
    if (!user) return [];
    return projectInvites.filter((inv) => inv.status === 'pending' && inv.inviteeId === user.uid);
  }, [user, projectInvites]);

  const incomingEventRequests = useMemo(() => {
    if (!user) return [];
    return eventRequests.filter(
      (r) => r.inviteeIds.includes(user.uid) && r.responses?.[user.uid] === 'pending'
    );
  }, [user, eventRequests]);

  const pendingRequestsCount =
    incomingFriendRequests.length +
    incomingGroupInvites.length +
    incomingProjectInvites.length +
    incomingEventRequests.length;

  const getProfile = useCallback(
    (uid?: string) => {
      if (!uid) return undefined;
      return profilesCache[uid];
    },
    [profilesCache]
  );

  const getUserLabel = useCallback(
    (uid?: string) => {
      if (!uid) return 'Unbekannt';
      if (user && uid === user.uid) {
        return userProfile?.displayName || user.displayName || 'Ich';
      }
      const p = profilesCache[uid];
      if (!p) return 'Nutzer';
      return p.displayName || `@${p.username}`;
    },
    [user, userProfile, profilesCache]
  );

  // Actions
  const requestFriend = async (recipientId: string, shareAvailability: boolean) => {
    if (!user) throw new Error('Bitte melde dich zuerst an.');
    await sendFriendRequest(user.uid, recipientId, shareAvailability);
  };

  const answerFriendRequest = async (
    friendshipId: string,
    accept: boolean,
    shareAvailability: boolean
  ) => {
    if (!user) return;
    await respondToFriendRequest(friendshipId, user.uid, accept, shareAvailability);
  };

  const setFriendAvailabilitySharing = async (friendshipId: string, share: boolean) => {
    if (!user) return;
    await toggleFriendAvailability(friendshipId, user.uid, share);
  };

  const unfriend = async (friendshipId: string) => {
    await removeFriendship(friendshipId);
  };

  const addFriendGroup = async (data: {
    name: string;
    description?: string;
    color: string;
    inviteeIds: string[];
    shareAvailability: boolean;
  }) => {
    if (!user) throw new Error('Bitte melde dich zuerst an.');
    return createFriendGroup({
      name: data.name,
      description: data.description,
      color: data.color,
      createdBy: user.uid,
      inviteeIds: data.inviteeIds,
      creatorShareAvailability: data.shareAvailability,
    });
  };

  const inviteFriendToGroup = async (groupId: string, uid: string) => {
    await inviteToFriendGroup(groupId, uid);
  };

  const answerGroupInvite = async (
    groupId: string,
    accept: boolean,
    shareAvailability: boolean
  ) => {
    if (!user) return;
    await respondToFriendGroupInvite(groupId, user.uid, accept, shareAvailability);
  };

  const setGroupAvailabilitySharing = async (groupId: string, share: boolean) => {
    if (!user) return;
    await toggleGroupAvailability(groupId, user.uid, share);
  };

  const exitFriendGroup = async (groupId: string) => {
    if (!user) return;
    await leaveFriendGroup(groupId, user.uid);
  };

  const removeFriendGroup = async (groupId: string) => {
    await deleteFriendGroup(groupId);
  };

  const addProject = async (data: {
    title: string;
    description?: string;
    color: string;
    targetDate?: string;
    shareAvailability?: boolean;
  }): Promise<Project> => {
    const now = new Date().toISOString();
    const uid = user?.uid || 'guest';
    const newProject: Project = {
      id: `proj-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
      title: data.title.trim(),
      description: data.description?.trim() || '',
      color: data.color,
      ownerId: uid,
      memberIds: [uid],
      availabilitySharedBy: { [uid]: data.shareAvailability ?? true },
      status: 'active' as ProjectStatus,
      targetDate: data.targetDate || undefined,
      createdAt: now,
      updatedAt: now,
    };

    if (user) {
      await createProjectInFirestore(newProject);
    } else {
      setProjects((prev) => [newProject, ...prev]);
    }
    return newProject;
  };

  const updateProject = async (id: string, updates: Partial<Project>) => {
    const withTime = { ...updates, updatedAt: new Date().toISOString() };
    setProjects((prev) => prev.map((p) => (p.id === id ? { ...p, ...withTime } : p)));
    if (user) {
      await updateProjectInFirestore(id, withTime);
    }
  };

  const deleteProject = async (id: string) => {
    setProjects((prev) => prev.filter((p) => p.id !== id));
    if (user) {
      await deleteProjectInFirestore(id);
    }
  };

  const setProjectAvailabilitySharing = async (projectId: string, share: boolean) => {
    if (!user) return;
    await toggleProjectAvailability(projectId, user.uid, share);
  };

  const exitProject = async (projectId: string) => {
    if (!user) return;
    await leaveProjectInFirestore(projectId, user.uid);
  };

  const inviteUserToProject = async (project: Project, inviteeId: string) => {
    if (!user) throw new Error('Bitte melde dich zuerst an.');
    await sendProjectInvite({ project, inviterId: user.uid, inviteeId });
  };

  const answerProjectInvite = async (
    invite: ProjectInvite,
    accept: boolean,
    shareAvailability: boolean
  ) => {
    await respondToProjectInvite(invite, accept, shareAvailability);
  };

  const sendEventRequest = async (data: {
    title: string;
    description?: string;
    date: string;
    time: string;
    durationMinutes: number;
    category: Category;
    recurrence: Recurrence;
    projectId?: string;
    friendGroupId?: string;
    inviteeIds: string[];
  }) => {
    if (!user) throw new Error('Bitte melde dich zuerst an.');
    return createEventRequest({
      ...data,
      creatorId: user.uid,
      creatorName: userProfile?.displayName || user.displayName || 'Unbekannt',
    });
  };

  const answerEventRequest = async (request: EventRequest, accept: boolean) => {
    if (!user) return;
    await respondToEventRequest(request, user.uid, accept);
  };

  const cancelEventRequest = async (requestId: string) => {
    await deleteEventRequest(requestId);
  };

  const openDirectChat = async (otherUid: string) => {
    if (!user) throw new Error('Bitte melde dich zuerst an.');
    return ensureDirectChatRoom(user.uid, otherUid);
  };

  const openProjectOrGroupChat = async (params: {
    id: string;
    type: 'project' | 'group';
    title: string;
    participantIds: string[];
    projectId?: string;
    friendGroupId?: string;
  }) => {
    return ensureGroupOrProjectChatRoom(params);
  };

  return (
    <SocialContext.Provider
      value={{
        profilesCache,
        availabilityByUser,
        availabilityAllowedUids,
        friendships,
        friends,
        incomingFriendRequests,
        outgoingFriendRequests,
        friendGroups,
        incomingGroupInvites,
        projects,
        projectInvites,
        incomingProjectInvites,
        eventRequests,
        incomingEventRequests,
        chatRooms,
        pendingRequestsCount,
        getProfile,
        getUserLabel,
        canSeeAvailability,
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
        addProject,
        updateProject,
        deleteProject,
        setProjectAvailabilitySharing,
        exitProject,
        inviteUserToProject,
        answerProjectInvite,
        sendEventRequest,
        answerEventRequest,
        cancelEventRequest,
        openDirectChat,
        openProjectOrGroupChat,
      }}
    >
      {children}
    </SocialContext.Provider>
  );
};

export const useSocial = () => {
  const ctx = useContext(SocialContext);
  if (!ctx) throw new Error('useSocial must be used within SocialProvider');
  return ctx;
};
