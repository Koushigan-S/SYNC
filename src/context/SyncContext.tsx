"use client";

import React, { createContext, useContext, useState, useEffect, useCallback } from "react";
import confetti from "canvas-confetti";
import {
  UserProfile,
  Group,
  GroupMember,
  Task,
  TaskParticipant,
  ActivityFeedItem,
  Challenge,
  NotificationItem,
  MemberAnalytics,
  TaskVisibility,
  TaskPriority,
  TaskRepeat,
  ChallengeMetric,
} from "@/types";
import {
  INITIAL_USERS,
  INITIAL_GROUP,
  INITIAL_GROUP_MEMBERS,
  INITIAL_TASKS,
  INITIAL_PARTICIPANTS,
  INITIAL_ACTIVITIES,
  INITIAL_CHALLENGES,
  INITIAL_NOTIFICATIONS,
  MEMBERS_ANALYTICS,
} from "@/lib/demo-data";
import {
  XP_REWARDS,
  calculateLevel,
  CURRENT_USER_ID,
  DEMO_INVITE_CODE,
} from "@/lib/constants";

interface ToastMessage {
  id: string;
  title: string;
  description?: string;
  type?: "default" | "success" | "xp" | "error";
  xp?: number;
}

interface SyncContextType {
  currentUser: UserProfile;
  allUsers: Record<string, UserProfile>;
  currentGroup: Group;
  members: GroupMember[];
  tasks: Task[];
  participants: TaskParticipant[];
  activities: ActivityFeedItem[];
  challenges: Challenge[];
  notifications: NotificationItem[];
  analytics: Record<string, MemberAnalytics>;
  isDemoMode: boolean;
  toasts: ToastMessage[];

  // Actions
  toggleTaskCompletion: (taskId: string) => void;
  createTask: (data: {
    title: string;
    notes?: string;
    scheduledDate: string;
    scheduledTime?: string;
    deadline?: string;
    repeat: TaskRepeat;
    visibility: TaskVisibility;
    assignedParticipantIds: string[];
    priority: TaskPriority;
    challengeId?: string;
  }) => void;
  deleteTask: (taskId: string) => void;
  createChallenge: (data: {
    title: string;
    description: string;
    startDate: string;
    endDate: string;
    metric: ChallengeMetric;
    targetValue: number;
    participantIds: string[];
  }) => void;
  joinGroupWithCode: (code: string) => { success: boolean; message: string };
  createGroup: (name: string, description?: string, imageUrl?: string) => void;
  updateProfile: (updates: Partial<UserProfile>) => void;
  markNotificationRead: (id: string) => void;
  markAllNotificationsRead: () => void;
  switchUser: (userId: string) => void;
  toggleDemoMode: () => void;
  simulateCodingActivity: (type: "leetcode_easy" | "leetcode_med" | "leetcode_hard" | "github_push") => void;
  dismissToast: (id: string) => void;
  addToast: (toast: Omit<ToastMessage, "id">) => void;
}

const SyncContext = createContext<SyncContextType | null>(null);

const STORAGE_KEY = "sync_progress_state_v1";

export function SyncProvider({ children }: { children: React.ReactNode }) {
  const [isDemoMode, setIsDemoMode] = useState<boolean>(true);
  const [currentUserId, setCurrentUserId] = useState<string>(CURRENT_USER_ID);
  const [users, setUsers] = useState<Record<string, UserProfile>>(INITIAL_USERS);
  const [group, setGroup] = useState<Group>(INITIAL_GROUP);
  const [members, setMembers] = useState<GroupMember[]>(INITIAL_GROUP_MEMBERS);
  const [tasks, setTasks] = useState<Task[]>(INITIAL_TASKS);
  const [participants, setParticipants] = useState<TaskParticipant[]>(INITIAL_PARTICIPANTS);
  const [activities, setActivities] = useState<ActivityFeedItem[]>(INITIAL_ACTIVITIES);
  const [challenges, setChallenges] = useState<Challenge[]>(INITIAL_CHALLENGES);
  const [notifications, setNotifications] = useState<NotificationItem[]>(INITIAL_NOTIFICATIONS);
  const [analytics, setAnalytics] = useState<Record<string, MemberAnalytics>>(MEMBERS_ANALYTICS);
  const [toasts, setToasts] = useState<ToastMessage[]>([]);

  // Load from local storage if available for persistence during session
  useEffect(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY);
      if (saved) {
        const parsed = JSON.parse(saved);
        if (parsed.tasks) setTasks(parsed.tasks);
        if (parsed.participants) setParticipants(parsed.participants);
        if (parsed.users) setUsers(parsed.users);
        if (parsed.activities) setActivities(parsed.activities);
        if (parsed.challenges) setChallenges(parsed.challenges);
      }
    } catch {
      // Use defaults if parse fails
    }
  }, []);

  // Save to local storage on changes
  useEffect(() => {
    try {
      localStorage.setItem(
        STORAGE_KEY,
        JSON.stringify({ tasks, participants, users, activities, challenges })
      );
    } catch {
      // Ignore storage quota
    }
  }, [tasks, participants, users, activities, challenges]);

  const addToast = useCallback((toast: Omit<ToastMessage, "id">) => {
    const id = "toast-" + Math.random().toString(36).substring(2, 9);
    setToasts((prev) => [...prev, { ...toast, id }]);
    setTimeout(() => {
      setToasts((prev) => prev.filter((t) => t.id !== id));
    }, 4500);
  }, []);

  const dismissToast = useCallback((id: string) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  }, []);

  const currentUser = users[currentUserId] || INITIAL_USERS["user-nova"];

  // Award XP helper
  const awardXP = useCallback(
    (userId: string, amount: number, reason: string) => {
      setUsers((prev) => {
        const user = prev[userId];
        if (!user) return prev;
        const newTotal = user.totalXP + amount;
        const newLevel = calculateLevel(newTotal);

        return {
          ...prev,
          [userId]: {
            ...user,
            totalXP: newTotal,
            level: newLevel,
          },
        };
      });

      // Also update member list snapshot
      setMembers((prev) =>
        prev.map((m) => {
          if (m.userId === userId) {
            const newXP = m.userSnapshot.totalXP + amount;
            return {
              ...m,
              userSnapshot: {
                ...m.userSnapshot,
                totalXP: newXP,
                level: calculateLevel(newXP),
                weeklyXP: (m.userSnapshot.weeklyXP || 0) + amount,
              },
            };
          }
          return m;
        })
      );
    },
    []
  );

  // Toggle Task Completion for Current User
  const toggleTaskCompletion = useCallback(
    (taskId: string) => {
      const task = tasks.find((t) => t.id === taskId);
      if (!task) return;

      const existingParticipant = participants.find(
        (p) => p.taskId === taskId && p.userId === currentUserId
      );

      const willBeComplete = existingParticipant ? !existingParticipant.completed : true;

      setParticipants((prev) => {
        const index = prev.findIndex(
          (p) => p.taskId === taskId && p.userId === currentUserId
        );
        if (index >= 0) {
          const updated = [...prev];
          updated[index] = {
            ...updated[index],
            completed: willBeComplete,
            completedAt: willBeComplete ? new Date().toISOString() : null,
          };
          return updated;
        } else {
          return [
            ...prev,
            {
              userId: currentUserId,
              taskId,
              groupId: group.id,
              completed: willBeComplete,
              completedAt: willBeComplete ? new Date().toISOString() : null,
            },
          ];
        }
      });

      if (willBeComplete) {
        // Base task XP
        let earnedXP = XP_REWARDS.COMPLETE_TASK;
        let isEarly = false;

        // Check early deadline bonus
        if (task.deadline) {
          const deadlineDate = new Date(task.deadline).getTime();
          if (Date.now() < deadlineDate) {
            earnedXP += XP_REWARDS.EARLY_DEADLINE_BONUS;
            isEarly = true;
          }
        }

        awardXP(currentUserId, earnedXP, `Completed task: ${task.title}`);

        // Add activity
        const newActivity: ActivityFeedItem = {
          id: "act-" + Date.now(),
          groupId: group.id,
          userId: currentUserId,
          userName: currentUser.displayName,
          userPhotoURL: currentUser.photoURL,
          type: "task_completed",
          description: `completed ${task.title}${isEarly ? " (Before deadline bonus!)" : ""}`,
          xpAwarded: earnedXP,
          timestamp: "Just now",
        };
        setActivities((prev) => [newActivity, ...prev]);

        addToast({
          title: "Task Completed",
          description: `${task.title} (+${earnedXP} XP)`,
          type: "xp",
          xp: earnedXP,
        });

        // Check if all assigned participants are now complete
        const assignedIds = task.assignedParticipantIds;
        // Determine state after this update
        setTimeout(() => {
          setParticipants((currentParts) => {
            const taskParts = currentParts.filter(
              (p) => p.taskId === taskId && assignedIds.includes(p.userId)
            );
            const allComplete =
              taskParts.length === assignedIds.length &&
              taskParts.every((p) => p.completed);

            if (allComplete && assignedIds.length > 1 && !task.isSquadComplete) {
              // Trigger Squad Bonus!
              setTasks((allT) =>
                allT.map((t) =>
                  t.id === taskId ? { ...t, isSquadComplete: true } : t
                )
              );

              // Award squad bonus (+30 XP) to all participants
              assignedIds.forEach((uid) => {
                awardXP(uid, XP_REWARDS.SQUAD_TASK_BONUS, `Squad Complete bonus: ${task.title}`);
              });

              // Add squad activity
              const squadActivity: ActivityFeedItem = {
                id: "squad-act-" + Date.now(),
                groupId: group.id,
                userId: currentUserId,
                userName: group.name,
                userPhotoURL: group.imageUrl || currentUser.photoURL,
                type: "squad_task_completed",
                description: `Squad complete: "${task.title}" · All ${assignedIds.length} members finished!`,
                xpAwarded: XP_REWARDS.SQUAD_TASK_BONUS,
                timestamp: "Just now",
              };
              setActivities((actPrev) => [squadActivity, ...actPrev]);

              // Trigger celebratory confetti
              try {
                confetti({
                  particleCount: 90,
                  spread: 60,
                  origin: { y: 0.7 },
                  colors: ["#ffffff", "#a1a1aa", "#4ade80"],
                });
              } catch {
                // Ignore if canvas not supported
              }

              addToast({
                title: "Squad Bonus Unlocked! 🎉",
                description: `Everyone finished "${task.title}". +${XP_REWARDS.SQUAD_TASK_BONUS} XP awarded to all members!`,
                type: "success",
                xp: XP_REWARDS.SQUAD_TASK_BONUS,
              });
            }

            return currentParts;
          });
        }, 100);
      }
    },
    [tasks, participants, currentUserId, currentUser, group, awardXP, addToast]
  );

  // Create Task
  const createTask = useCallback(
    (data: {
      title: string;
      notes?: string;
      scheduledDate: string;
      scheduledTime?: string;
      deadline?: string;
      repeat: TaskRepeat;
      visibility: TaskVisibility;
      assignedParticipantIds: string[];
      priority: TaskPriority;
      challengeId?: string;
    }) => {
      const newTaskId = "task-" + Date.now();
      const newTask: Task = {
        id: newTaskId,
        groupId: group.id,
        creatorId: currentUserId,
        creatorName: currentUser.displayName,
        title: data.title,
        notes: data.notes,
        scheduledDate: data.scheduledDate,
        scheduledTime: data.scheduledTime,
        deadline: data.deadline,
        repeat: data.repeat,
        visibility: data.visibility,
        assignedParticipantIds:
          data.visibility === "only_me"
            ? [currentUserId]
            : data.assignedParticipantIds.length > 0
            ? data.assignedParticipantIds
            : [currentUserId],
        xpReward: XP_REWARDS.COMPLETE_TASK,
        priority: data.priority,
        challengeId: data.challengeId,
        isSquadComplete: false,
        createdAt: new Date().toISOString(),
      };

      setTasks((prev) => [newTask, ...prev]);

      // Create empty participant records
      const newParticipants: TaskParticipant[] = newTask.assignedParticipantIds.map(
        (uid) => ({
          userId: uid,
          taskId: newTaskId,
          groupId: group.id,
          completed: false,
          completedAt: null,
        })
      );

      setParticipants((prev) => [...prev, ...newParticipants]);

      addToast({
        title: "Task Scheduled",
        description: `"${newTask.title}" added for ${newTask.scheduledDate}.`,
        type: "default",
      });
    },
    [currentUserId, currentUser, group.id, addToast]
  );

  // Delete Task
  const deleteTask = useCallback(
    (taskId: string) => {
      setTasks((prev) => prev.filter((t) => t.id !== taskId));
      setParticipants((prev) => prev.filter((p) => p.taskId !== taskId));
      addToast({
        title: "Task Removed",
        type: "default",
      });
    },
    [addToast]
  );

  // Create Challenge
  const createChallenge = useCallback(
    (data: {
      title: string;
      description: string;
      startDate: string;
      endDate: string;
      metric: ChallengeMetric;
      targetValue: number;
      participantIds: string[];
    }) => {
      const newId = "chal-" + Date.now();
      const initProgress: Record<string, number> = {};
      data.participantIds.forEach((uid) => {
        initProgress[uid] = 0;
      });

      const newChallenge: Challenge = {
        id: newId,
        groupId: group.id,
        title: data.title,
        description: data.description,
        startDate: data.startDate,
        endDate: data.endDate,
        metric: data.metric,
        targetValue: data.targetValue,
        xpReward: XP_REWARDS.CHALLENGE_COMPLETE,
        participantIds: data.participantIds,
        status: "active",
        winnerId: null,
        currentProgress: initProgress,
        createdAt: new Date().toISOString(),
      };

      setChallenges((prev) => [newChallenge, ...prev]);

      const activity: ActivityFeedItem = {
        id: "chal-act-" + Date.now(),
        groupId: group.id,
        userId: currentUserId,
        userName: currentUser.displayName,
        userPhotoURL: currentUser.photoURL,
        type: "challenge_completed",
        description: `started new squad challenge: "${data.title}" · Target: ${data.targetValue}`,
        xpAwarded: 0,
        timestamp: "Just now",
      };
      setActivities((prev) => [activity, ...prev]);

      addToast({
        title: "Challenge Created",
        description: `${data.title} with 100 XP prize pool.`,
        type: "success",
      });
    },
    [group.id, currentUserId, currentUser, addToast]
  );

  // Join Group with Code
  const joinGroupWithCode = useCallback(
    (code: string) => {
      const cleanCode = code.trim().toUpperCase();
      if (cleanCode === DEMO_INVITE_CODE || cleanCode === "SYNC-FOUNDERS-2026") {
        return { success: true, message: "Joined Founders Squad successfully!" };
      }
      return { success: false, message: "Invalid invite code. Try SYNC-FOUNDERS-2026." };
    },
    []
  );

  // Create Group
  const createGroup = useCallback(
    (name: string, description?: string, imageUrl?: string) => {
      const newGroupId = "group-" + Date.now();
      const invite = "SYNC-" + Math.random().toString(36).substring(2, 7).toUpperCase();
      const newGroup: Group = {
        id: newGroupId,
        name,
        description,
        imageUrl: imageUrl || "https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?w=400&auto=format&fit=crop&q=80",
        ownerId: currentUserId,
        inviteCode: invite,
        memberCount: 1,
        createdAt: new Date().toISOString(),
      };

      setGroup(newGroup);
      addToast({
        title: "Squad Created",
        description: `Created "${name}". Invite code: ${invite}`,
        type: "success",
      });
    },
    [currentUserId, addToast]
  );

  // Update Profile
  const updateProfile = useCallback(
    (updates: Partial<UserProfile>) => {
      setUsers((prev) => ({
        ...prev,
        [currentUserId]: {
          ...prev[currentUserId],
          ...updates,
        },
      }));
      addToast({
        title: "Profile Updated",
        type: "default",
      });
    },
    [currentUserId, addToast]
  );

  // Notifications
  const markNotificationRead = useCallback((id: string) => {
    setNotifications((prev) =>
      prev.map((n) => (n.id === id ? { ...n, read: true } : n))
    );
  }, []);

  const markAllNotificationsRead = useCallback(() => {
    setNotifications((prev) => prev.map((n) => ({ ...n, read: true })));
    addToast({
      title: "All Notifications Cleared",
      type: "default",
    });
  }, [addToast]);

  // Switch Active User (for reviewer perspective switching)
  const switchUser = useCallback(
    (userId: string) => {
      if (users[userId]) {
        setCurrentUserId(userId);
        addToast({
          title: `Switched View: ${users[userId].displayName}`,
          description: `You are now viewing as ${users[userId].displayName}.`,
          type: "default",
        });
      }
    },
    [users, addToast]
  );

  const toggleDemoMode = useCallback(() => {
    setIsDemoMode((prev) => !prev);
  }, []);

  // Simulate Coding Activity (LeetCode / GitHub)
  const simulateCodingActivity = useCallback(
    (type: "leetcode_easy" | "leetcode_med" | "leetcode_hard" | "github_push") => {
      let xpEarned = 0;
      let desc = "";

      if (type === "leetcode_easy") {
        xpEarned = XP_REWARDS.LEETCODE_EASY;
        desc = "solved a LeetCode problem (Easy)";
      } else if (type === "leetcode_med") {
        xpEarned = XP_REWARDS.LEETCODE_MEDIUM;
        desc = "solved a LeetCode problem (Medium)";
      } else if (type === "leetcode_hard") {
        xpEarned = XP_REWARDS.LEETCODE_HARD;
        desc = "solved a LeetCode problem (Hard)";
      } else if (type === "github_push") {
        xpEarned = XP_REWARDS.GITHUB_CONTRIBUTION * 3;
        desc = "pushed 3 commits to repository";
      }

      awardXP(currentUserId, xpEarned, desc);

      const activity: ActivityFeedItem = {
        id: "act-code-" + Date.now(),
        groupId: group.id,
        userId: currentUserId,
        userName: currentUser.displayName,
        userPhotoURL: currentUser.photoURL,
        type: type === "github_push" ? "github_push" : "leetcode_solved",
        description: desc,
        xpAwarded: xpEarned,
        timestamp: "Just now",
      };

      setActivities((prev) => [activity, ...prev]);

      addToast({
        title: "Coding Progress Synced",
        description: `${desc} · +${xpEarned} XP`,
        type: "xp",
        xp: xpEarned,
      });
    },
    [currentUserId, currentUser, group.id, awardXP, addToast]
  );

  return (
    <SyncContext.Provider
      value={{
        currentUser,
        allUsers: users,
        currentGroup: group,
        members,
        tasks,
        participants,
        activities,
        challenges,
        notifications,
        analytics,
        isDemoMode,
        toasts,
        toggleTaskCompletion,
        createTask,
        deleteTask,
        createChallenge,
        joinGroupWithCode,
        createGroup,
        updateProfile,
        markNotificationRead,
        markAllNotificationsRead,
        switchUser,
        toggleDemoMode,
        simulateCodingActivity,
        dismissToast,
        addToast,
      }}
    >
      {children}
    </SyncContext.Provider>
  );
}

export function useSync() {
  const context = useContext(SyncContext);
  if (!context) {
    throw new Error("useSync must be used within a SyncProvider");
  }
  return context;
}
