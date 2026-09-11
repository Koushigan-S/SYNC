"use client";

import React, {
  createContext,
  useContext,
  useState,
  useEffect,
  useCallback,
  useMemo,
} from "react";
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
import { XP_REWARDS, calculateLevel } from "@/lib/constants";
import { auth, db, handleFirestoreQuotaExceeded, isFirestoreQuotaExceeded } from "@/lib/firebase/config";
import {
  signInWithPopup,
  GoogleAuthProvider,
  signOut,
  onAuthStateChanged,
  User as FirebaseUser,
} from "firebase/auth";
import {
  collection,
  doc,
  onSnapshot,
  setDoc,
  getDoc,
  updateDoc,
  deleteDoc,
  addDoc,
  query,
  orderBy,
  limit,
  serverTimestamp,
  getDocs,
  where,
} from "firebase/firestore";
import { cleanFirestoreData } from "@/lib/firebase/utils";

interface ToastMessage {
  id: string;
  title: string;
  description?: string;
  type?: "default" | "success" | "xp" | "error";
  xp?: number;
}

export interface SyncContextType {
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
  authLoading: boolean;
  toasts: ToastMessage[];

  // Auth
  loginWithGoogle: () => Promise<void>;
  logout: () => Promise<void>;

  // Actions
  toggleTaskCompletion: (taskId: string) => Promise<void>;
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
  }) => Promise<void>;
  deleteTask: (taskId: string) => Promise<void>;
  createChallenge: (data: {
    title: string;
    description: string;
    startDate: string;
    endDate: string;
    metric: ChallengeMetric;
    targetValue: number;
    participantIds: string[];
  }) => Promise<void>;
  joinGroupWithCode: (code: string) => Promise<{ success: boolean; message: string }>;
  createGroup: (name: string, description?: string, imageUrl?: string) => Promise<void>;
  updateProfile: (updates: Partial<UserProfile>) => Promise<void>;
  markNotificationRead: (id: string) => Promise<void>;
  markAllNotificationsRead: () => Promise<void>;
  simulateCodingActivity: (
    type: "leetcode_easy" | "leetcode_med" | "leetcode_hard" | "github_push"
  ) => Promise<void>;
  dismissToast: (id: string) => void;
  addToast: (toast: Omit<ToastMessage, "id">) => void;
  awardXP: (userId: string, amount: number, reason: string) => Promise<void>;
}

const SyncContext = createContext<SyncContextType | null>(null);

const DEFAULT_GROUP_ID = "group-founders-squad";

const FALLBACK_USER: UserProfile = {
  id: "guest",
  displayName: "Guest User",
  username: "guest",
  email: "guest@sync.dev",
  photoURL: "https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150&auto=format&fit=crop&q=80",
  timezone: "UTC",
  totalXP: 0,
  level: 1,
  streak: { current: 0, longest: 0, lastActiveDate: new Date().toISOString().split("T")[0] },
  createdAt: new Date().toISOString(),
};

const FALLBACK_GROUP: Group = {
  id: DEFAULT_GROUP_ID,
  name: "Founders Squad",
  description: "Private engineering & progress sprint crew.",
  imageUrl: "https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?w=400&auto=format&fit=crop&q=80",
  ownerId: "system",
  inviteCode: "SYNC-FOUNDERS-2026",
  memberCount: 1,
  createdAt: new Date().toISOString(),
};

export function SyncProvider({ children }: { children: React.ReactNode }) {
  const [authLoading, setAuthLoading] = useState<boolean>(true);
  const [firebaseUser, setFirebaseUser] = useState<FirebaseUser | null>(null);
  const [currentUserProfile, setCurrentUserProfile] = useState<UserProfile | null>(null);

  const [currentGroupId, setCurrentGroupId] = useState<string>(DEFAULT_GROUP_ID);
  const [currentGroup, setCurrentGroup] = useState<Group>(FALLBACK_GROUP);

  const [allUsers, setAllUsers] = useState<Record<string, UserProfile>>({});
  const [members, setMembers] = useState<GroupMember[]>([]);
  const [tasks, setTasks] = useState<Task[]>([]);
  const [participants, setParticipants] = useState<TaskParticipant[]>([]);
  const [activities, setActivities] = useState<ActivityFeedItem[]>([]);
  const [challenges, setChallenges] = useState<Challenge[]>([]);
  const [notifications, setNotifications] = useState<NotificationItem[]>([]);
  const [toasts, setToasts] = useState<ToastMessage[]>([]);

  // Toast Helpers
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

  // Google Login
  const loginWithGoogle = useCallback(async () => {
    try {
      const provider = new GoogleAuthProvider();
      provider.setCustomParameters({ prompt: "select_account" });
      const cred = await signInWithPopup(auth, provider);
      const user = cred.user;

      // Check if user doc exists in Firestore
      const userDocRef = doc(db, "users", user.uid);
      const userSnap = await getDoc(userDocRef);

      if (!userSnap.exists()) {
        const newProfile: UserProfile = {
          id: user.uid,
          displayName: user.displayName || "Squad Member",
          username:
            (user.email?.split("@")[0] || "user")
              .toLowerCase()
              .replace(/[^a-z0-9_]/g, "") +
            "_" +
            Math.floor(100 + Math.random() * 900),
          email: user.email || "",
          photoURL:
            user.photoURL ||
            `https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150&auto=format&fit=crop&q=80`,
          timezone:
            Intl.DateTimeFormat().resolvedOptions().timeZone || "America/New_York",
          totalXP: 0,
          level: 1,
          streak: {
            current: 1,
            longest: 1,
            lastActiveDate: new Date().toISOString().split("T")[0],
          },
          createdAt: new Date().toISOString(),
        };

        await setDoc(userDocRef, newProfile);
      }

      addToast({
        title: `Welcome, ${user.displayName || "Member"}!`,
        description: "Signed in securely with Google.",
        type: "success",
      });
    } catch (error: unknown) {
      console.error("Google login failed:", error);
      throw error;
    }
  }, [addToast]);

  // Logout
  const logout = useCallback(async () => {
    try {
      await signOut(auth);
      setFirebaseUser(null);
      setCurrentUserProfile(null);
      addToast({
        title: "Signed out",
        description: "You have been logged out of SYNC.",
        type: "default",
      });
    } catch (err) {
      console.error("Logout failed:", err);
    }
  }, [addToast]);

  // Auth State Listener
  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (user) => {
      setFirebaseUser(user);
      if (!user) {
        setCurrentUserProfile(null);
        setAuthLoading(false);
        return;
      }

      try {
        const userDocRef = doc(db, "users", user.uid);
        const userSnap = await getDoc(userDocRef);

        if (!userSnap.exists()) {
          const profile: UserProfile = {
            id: user.uid,
            displayName: user.displayName || "Squad Member",
            username: (user.email?.split("@")[0] || "user")
              .toLowerCase()
              .replace(/[^a-z0-9_]/g, ""),
            email: user.email || "",
            photoURL:
              user.photoURL ||
              "https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150&auto=format&fit=crop&q=80",
            timezone:
              Intl.DateTimeFormat().resolvedOptions().timeZone || "America/New_York",
            totalXP: 0,
            level: 1,
            streak: {
              current: 1,
              longest: 1,
              lastActiveDate: new Date().toISOString().split("T")[0],
            },
            createdAt: new Date().toISOString(),
          };
          await setDoc(userDocRef, cleanFirestoreData(profile));
          setCurrentUserProfile(profile);
        } else {
          setCurrentUserProfile(userSnap.data() as UserProfile);
        }

        // Ensure default squad exists
        const groupRef = doc(db, "groups", DEFAULT_GROUP_ID);
        const groupSnap = await getDoc(groupRef);
        if (!groupSnap.exists()) {
          await setDoc(
            groupRef,
            cleanFirestoreData({
              id: DEFAULT_GROUP_ID,
              name: "Founders Squad",
              description: "Private engineering & progress sprint crew.",
              imageUrl:
                "https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?w=400&auto=format&fit=crop&q=80",
              ownerId: user.uid,
              inviteCode: "SYNC-FOUNDERS-2026",
              memberCount: 1,
              createdAt: new Date().toISOString(),
            })
          );
        }

        // Ensure user is added to group members
        const memberRef = doc(db, "groups", DEFAULT_GROUP_ID, "members", user.uid);
        const memberSnap = await getDoc(memberRef);
        if (!memberSnap.exists()) {
          await setDoc(
            memberRef,
            cleanFirestoreData({
              userId: user.uid,
              groupId: DEFAULT_GROUP_ID,
              role: "member",
              joinedAt: new Date().toISOString(),
              userSnapshot: {
                displayName: user.displayName || "Member",
                username: (user.email?.split("@")[0] || "user").toLowerCase(),
                photoURL:
                  user.photoURL ||
                  "https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150&auto=format&fit=crop&q=80",
                totalXP: 0,
                level: 1,
                streak: 1,
                tasksCompleted: 0,
                weeklyXP: 0,
                monthlyXP: 0,
              },
            })
          );
        }
      } catch (e: any) {
        if (e?.code === "resource-exhausted" || e?.message?.includes("Quota")) {
          handleFirestoreQuotaExceeded();
        } else {
          console.error("Error setting up user profile in Firestore:", e);
        }
      } finally {
        setAuthLoading(false);
      }
    });

    return () => unsubscribe();
  }, []);

  // Subscribe to current user's profile changes
  useEffect(() => {
    if (!firebaseUser) return;
    const userDocRef = doc(db, "users", firebaseUser.uid);
    const unsub = onSnapshot(
      userDocRef,
      (snap) => {
        if (snap.exists()) {
          setCurrentUserProfile(snap.data() as UserProfile);
        }
      },
      (err: any) => {
        if (err?.code === "resource-exhausted" || err?.message?.includes("Quota")) {
          handleFirestoreQuotaExceeded();
          console.warn("User profile sync paused (Firestore daily quota).");
        } else {
          console.error("Error fetching user profile:", err);
        }
      }
    );
    return () => unsub();
  }, [firebaseUser]);

  // Subscribe to all users (for friend directory and avatars)
  useEffect(() => {
    if (!firebaseUser) return;
    const usersColl = collection(db, "users");
    const unsub = onSnapshot(
      usersColl,
      (snap) => {
        const usersMap: Record<string, UserProfile> = {};
        snap.forEach((d) => {
          usersMap[d.id] = d.data() as UserProfile;
        });
        setAllUsers(usersMap);
      },
      (err: any) => {
        if (err?.code === "resource-exhausted" || err?.message?.includes("Quota")) {
          handleFirestoreQuotaExceeded();
          console.warn("Users directory sync paused (Firestore daily quota).");
        } else {
          console.error("Error fetching users:", err);
        }
      }
    );
    return () => unsub();
  }, [firebaseUser]);

  // Subscribe to active Group metadata
  useEffect(() => {
    if (!firebaseUser) return;
    const groupRef = doc(db, "groups", currentGroupId);
    const unsub = onSnapshot(
      groupRef,
      (snap) => {
        if (snap.exists()) {
          setCurrentGroup(snap.data() as Group);
        }
      },
      (err: any) => {
        if (err?.code === "resource-exhausted" || err?.message?.includes("Quota")) {
          handleFirestoreQuotaExceeded();
          console.warn("Group metadata sync paused (Firestore daily quota).");
        } else {
          console.error("Error fetching group:", err);
        }
      }
    );
    return () => unsub();
  }, [firebaseUser, currentGroupId]);

  // Subscribe to Group Members
  useEffect(() => {
    if (!firebaseUser) return;
    const membersColl = collection(db, "groups", currentGroupId, "members");
    const unsub = onSnapshot(
      membersColl,
      (snap) => {
        const mems: GroupMember[] = [];
        snap.forEach((d) => {
          mems.push(d.data() as GroupMember);
        });
        setMembers(mems);
      },
      (err: any) => {
        if (err?.code === "resource-exhausted" || err?.message?.includes("Quota")) {
          handleFirestoreQuotaExceeded();
          console.warn("Group members sync paused (Firestore daily quota).");
        } else {
          console.error("Error fetching members:", err);
        }
      }
    );
    return () => unsub();
  }, [firebaseUser, currentGroupId]);

  // Subscribe to Tasks & Participants
  useEffect(() => {
    if (!firebaseUser) return;
    const tasksColl = collection(db, "groups", currentGroupId, "tasks");
    const unsub = onSnapshot(
      tasksColl,
      (snap) => {
        const tList: Task[] = [];
        const pList: TaskParticipant[] = [];

        snap.forEach((d) => {
          const tData = { id: d.id, ...d.data() } as Task;
          tList.push(tData);

          // Extract participants embedded in task or default participant list
          if (Array.isArray(tData.assignedParticipantIds)) {
            tData.assignedParticipantIds.forEach((pid) => {
              const completed =
                (d.data()?.completedParticipantIds || []).includes(pid);
              pList.push({
                userId: pid,
                taskId: d.id,
                groupId: currentGroupId,
                completed,
                completedAt: completed ? new Date().toISOString() : null,
              });
            });
          }
        });

        setTasks(tList);
        setParticipants(pList);
      },
      (err: any) => {
        if (err?.code === "resource-exhausted" || err?.message?.includes("Quota")) {
          handleFirestoreQuotaExceeded();
          console.warn("Tasks sync paused (Firestore daily quota).");
        } else {
          console.error("Error fetching tasks:", err);
        }
      }
    );
    return () => unsub();
  }, [firebaseUser, currentGroupId]);

  // Subscribe to Activities Feed
  useEffect(() => {
    if (!firebaseUser) return;
    const actQuery = query(
      collection(db, "groups", currentGroupId, "activities"),
      orderBy("timestamp", "desc"),
      limit(50)
    );
    const unsub = onSnapshot(
      actQuery,
      (snap) => {
        const acts: ActivityFeedItem[] = [];
        snap.forEach((d) => {
          acts.push({ id: d.id, ...d.data() } as ActivityFeedItem);
        });
        setActivities(acts);
      },
      (err: any) => {
        if (err?.code === "resource-exhausted" || err?.message?.includes("Quota")) {
          handleFirestoreQuotaExceeded();
          console.warn("Activities sync paused (Firestore daily quota).");
          return;
        }
        // Fallback without order by if index isn't created yet
        const coll = collection(db, "groups", currentGroupId, "activities");
        onSnapshot(
          coll,
          (snap) => {
            const acts: ActivityFeedItem[] = [];
            snap.forEach((d) => {
              acts.push({ id: d.id, ...d.data() } as ActivityFeedItem);
            });
            setActivities(acts);
          },
          () => {}
        );
      }
    );
    return () => unsub();
  }, [firebaseUser, currentGroupId]);

  // Subscribe to Challenges
  useEffect(() => {
    if (!firebaseUser) return;
    const chalColl = collection(db, "groups", currentGroupId, "challenges");
    const unsub = onSnapshot(
      chalColl,
      (snap) => {
        const chals: Challenge[] = [];
        snap.forEach((d) => {
          chals.push({ id: d.id, ...d.data() } as Challenge);
        });
        setChallenges(chals);
      },
      (err: any) => {
        if (err?.code === "resource-exhausted" || err?.message?.includes("Quota")) {
          handleFirestoreQuotaExceeded();
          console.warn("Challenges sync paused (Firestore daily quota).");
        } else {
          console.error("Error fetching challenges:", err);
        }
      }
    );
    return () => unsub();
  }, [firebaseUser, currentGroupId]);

  // Subscribe to Notifications
  useEffect(() => {
    if (!firebaseUser) return;
    const notifColl = collection(db, "users", firebaseUser.uid, "notifications");
    const unsub = onSnapshot(
      notifColl,
      (snap) => {
        const notifs: NotificationItem[] = [];
        snap.forEach((d) => {
          notifs.push({ id: d.id, ...d.data() } as NotificationItem);
        });
        setNotifications(notifs);
      },
      (err: any) => {
        if (err?.code === "resource-exhausted" || err?.message?.includes("Quota")) {
          handleFirestoreQuotaExceeded();
          console.warn("Notifications sync paused (Firestore daily quota).");
        } else {
          console.error("Error fetching notifications:", err);
        }
      }
    );
    return () => unsub();
  }, [firebaseUser]);

  // Current active user object
  const currentUser = currentUserProfile || (firebaseUser ? {
    id: firebaseUser.uid,
    displayName: firebaseUser.displayName || "Squad Member",
    username: (firebaseUser.email?.split("@")[0] || "user").toLowerCase(),
    email: firebaseUser.email || "",
    photoURL: firebaseUser.photoURL || FALLBACK_USER.photoURL,
    timezone: "UTC",
    totalXP: 0,
    level: 1,
    streak: { current: 1, longest: 1, lastActiveDate: new Date().toISOString().split("T")[0] },
    createdAt: new Date().toISOString(),
  } : FALLBACK_USER);

  // Award XP Real-time helper
  const awardXP = useCallback(
    async (userId: string, amount: number, reason: string) => {
      try {
        const userRef = doc(db, "users", userId);
        const userSnap = await getDoc(userRef);
        if (!userSnap.exists()) return;

        const currentXP = userSnap.data()?.totalXP || 0;
        const newTotal = currentXP + amount;
        const newLevel = calculateLevel(newTotal);

        await updateDoc(userRef, {
          totalXP: newTotal,
          level: newLevel,
        });

        // Update member snapshot
        const memberRef = doc(db, "groups", currentGroupId, "members", userId);
        const memberSnap = await getDoc(memberRef);
        if (memberSnap.exists()) {
          const mData = memberSnap.data();
          await updateDoc(memberRef, {
            "userSnapshot.totalXP": newTotal,
            "userSnapshot.level": newLevel,
            "userSnapshot.weeklyXP": (mData.userSnapshot?.weeklyXP || 0) + amount,
          });
        }
      } catch (err) {
        console.error("Failed to award XP:", err);
      }
    },
    [currentGroupId]
  );

  // Toggle Task Completion
  const toggleTaskCompletion = useCallback(
    async (taskId: string) => {
      if (!firebaseUser) return;
      const task = tasks.find((t) => t.id === taskId);
      if (!task) return;

      try {
        const taskRef = doc(db, "groups", currentGroupId, "tasks", taskId);
        const taskSnap = await getDoc(taskRef);
        if (!taskSnap.exists()) return;

        const completedIds: string[] = taskSnap.data()?.completedParticipantIds || [];
        const isNowCompleted = !completedIds.includes(firebaseUser.uid);

        let updatedCompletedIds: string[];
        if (isNowCompleted) {
          updatedCompletedIds = [...completedIds, firebaseUser.uid];
        } else {
          updatedCompletedIds = completedIds.filter((id) => id !== firebaseUser.uid);
        }

        // Check if all assigned participants are complete
        const allCompleted =
          task.assignedParticipantIds.length > 0 &&
          task.assignedParticipantIds.every((id) =>
            updatedCompletedIds.includes(id)
          );

        await updateDoc(taskRef, {
          completedParticipantIds: updatedCompletedIds,
          isSquadComplete: allCompleted,
        });

        if (isNowCompleted) {
          try {
            confetti({
              particleCount: 70,
              spread: 60,
              origin: { y: 0.7 },
            });
          } catch (e) {
            // ignore
          }

          let earnedXP = XP_REWARDS.COMPLETE_TASK;
          if (task.deadline) {
            const deadlineDate = new Date(task.deadline).getTime();
            if (Date.now() < deadlineDate) {
              earnedXP += XP_REWARDS.EARLY_DEADLINE_BONUS;
            }
          }

          await awardXP(firebaseUser.uid, earnedXP, `Completed: ${task.title}`);

          // Log in activities feed
          await addDoc(collection(db, "groups", currentGroupId, "activities"), {
            groupId: currentGroupId,
            userId: firebaseUser.uid,
            userName: currentUser.displayName,
            userPhotoURL: currentUser.photoURL,
            type: "task_completed",
            description: `completed task: ${task.title}`,
            xpAwarded: earnedXP,
            timestamp: new Date().toISOString(),
          });

          addToast({
            title: "Task Completed! 🔥",
            description: `+${earnedXP} XP earned for finishing "${task.title}".`,
            type: "xp",
            xp: earnedXP,
          });

          if (allCompleted) {
            await addDoc(collection(db, "groups", currentGroupId, "activities"), {
              groupId: currentGroupId,
              userId: firebaseUser.uid,
              userName: currentGroup.name,
              userPhotoURL: currentGroup.imageUrl || "",
              type: "squad_task_completed",
              description: `Squad complete: "${task.title}" · All members finished!`,
              xpAwarded: XP_REWARDS.SQUAD_TASK_BONUS,
              timestamp: new Date().toISOString(),
            });

            addToast({
              title: "🎉 Squad Task Complete!",
              description: "All assigned squad members finished this task! +30 XP bonus!",
              type: "xp",
              xp: 30,
            });
          }
        }
      } catch (err) {
        console.error("Error toggling task completion:", err);
        addToast({
          title: "Error updating task",
          description: "Could not sync completion to Firestore.",
          type: "error",
        });
      }
    },
    [firebaseUser, tasks, currentGroupId, currentUser, currentGroup, awardXP, addToast]
  );

  // Create Task
  const createTask = useCallback(
    async (data: {
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
      if (!firebaseUser) return;
      try {
        const newTaskDoc = {
          groupId: currentGroupId,
          creatorId: firebaseUser.uid,
          creatorName: currentUser.displayName,
          title: data.title,
          notes: data.notes || "",
          scheduledDate: data.scheduledDate,
          scheduledTime: data.scheduledTime || "12:00",
          deadline: data.deadline || null,
          repeat: data.repeat,
          visibility: data.visibility,
          assignedParticipantIds:
            data.assignedParticipantIds.length > 0
              ? data.assignedParticipantIds
              : [firebaseUser.uid],
          completedParticipantIds: [],
          xpReward: XP_REWARDS.COMPLETE_TASK,
          priority: data.priority,
          challengeId: data.challengeId || null,
          isSquadComplete: false,
          createdAt: new Date().toISOString(),
        };

        await addDoc(collection(db, "groups", currentGroupId, "tasks"), newTaskDoc);

        addToast({
          title: "Task Created!",
          description: `Scheduled "${data.title}" for ${data.scheduledDate}.`,
          type: "success",
        });
      } catch (err) {
        console.error("Failed to create task:", err);
        addToast({
          title: "Error creating task",
          description: "Could not save task to Firestore.",
          type: "error",
        });
      }
    },
    [firebaseUser, currentGroupId, currentUser, addToast]
  );

  // Delete Task
  const deleteTask = useCallback(
    async (taskId: string) => {
      try {
        await deleteDoc(doc(db, "groups", currentGroupId, "tasks", taskId));
        addToast({
          title: "Task Deleted",
          description: "The task was removed from your schedule.",
          type: "default",
        });
      } catch (err) {
        console.error("Failed to delete task:", err);
      }
    },
    [currentGroupId, addToast]
  );

  // Create Challenge
  const createChallenge = useCallback(
    async (data: {
      title: string;
      description: string;
      startDate: string;
      endDate: string;
      metric: ChallengeMetric;
      targetValue: number;
      participantIds: string[];
    }) => {
      try {
        const newChallenge = {
          groupId: currentGroupId,
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
          currentProgress: {},
          createdAt: new Date().toISOString(),
        };

        await addDoc(
          collection(db, "groups", currentGroupId, "challenges"),
          newChallenge
        );

        addToast({
          title: "Challenge Created! 🏆",
          description: `"${data.title}" sprint has started.`,
          type: "success",
        });
      } catch (err) {
        console.error("Failed to create challenge:", err);
      }
    },
    [currentGroupId, addToast]
  );

  // Join Group with Code
  const joinGroupWithCode = useCallback(
    async (code: string) => {
      if (!firebaseUser) {
        return { success: false, message: "Must be logged in to join squad." };
      }
      try {
        const groupsRef = collection(db, "groups");
        const q = query(groupsRef, where("inviteCode", "==", code.trim()));
        const snap = await getDocs(q);

        if (snap.empty) {
          return { success: false, message: "Invalid squad invite code." };
        }

        const matchedGroup = snap.docs[0].data() as Group;
        const targetGroupId = snap.docs[0].id;

        // Add user as member
        await setDoc(doc(db, "groups", targetGroupId, "members", firebaseUser.uid), {
          userId: firebaseUser.uid,
          groupId: targetGroupId,
          role: "member",
          joinedAt: new Date().toISOString(),
          userSnapshot: {
            displayName: currentUser.displayName,
            username: currentUser.username,
            photoURL: currentUser.photoURL,
            totalXP: currentUser.totalXP,
            level: currentUser.level,
            streak: currentUser.streak.current,
            tasksCompleted: 0,
            weeklyXP: 0,
            monthlyXP: 0,
          },
        });

        setCurrentGroupId(targetGroupId);
        setCurrentGroup(matchedGroup);

        addToast({
          title: `Joined ${matchedGroup.name}!`,
          description: "Welcome to your new squad.",
          type: "success",
        });

        return { success: true, message: `Joined ${matchedGroup.name}` };
      } catch (err) {
        console.error("Join group error:", err);
        return { success: false, message: "Failed to join group." };
      }
    },
    [firebaseUser, currentUser, addToast]
  );

  // Create Group
  const createGroup = useCallback(
    async (name: string, description?: string, imageUrl?: string) => {
      if (!firebaseUser) return;
      try {
        const newGroupId = "group-" + Math.random().toString(36).substring(2, 9);
        const inviteCode =
          "SYNC-" + name.toUpperCase().replace(/\s+/g, "-").slice(0, 8) + "-2026";

        const newGroupData: Group = {
          id: newGroupId,
          name,
          description: description || "",
          imageUrl:
            imageUrl ||
            "https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?w=400&auto=format&fit=crop&q=80",
          ownerId: firebaseUser.uid,
          inviteCode,
          memberCount: 1,
          createdAt: new Date().toISOString(),
        };

        await setDoc(doc(db, "groups", newGroupId), newGroupData);

        await setDoc(doc(db, "groups", newGroupId, "members", firebaseUser.uid), {
          userId: firebaseUser.uid,
          groupId: newGroupId,
          role: "owner",
          joinedAt: new Date().toISOString(),
          userSnapshot: {
            displayName: currentUser.displayName,
            username: currentUser.username,
            photoURL: currentUser.photoURL,
            totalXP: currentUser.totalXP,
            level: currentUser.level,
            streak: currentUser.streak.current,
            tasksCompleted: 0,
            weeklyXP: 0,
            monthlyXP: 0,
          },
        });

        setCurrentGroupId(newGroupId);
        setCurrentGroup(newGroupData);

        addToast({
          title: "Squad Created!",
          description: `Created "${name}". Share code: ${inviteCode}`,
          type: "success",
        });
      } catch (err) {
        console.error("Create group error:", err);
      }
    },
    [firebaseUser, currentUser, addToast]
  );

  // Update Profile
  const updateProfile = useCallback(
    async (updates: Partial<UserProfile>) => {
      if (!firebaseUser) return;
      try {
        const cleanUpdates = cleanFirestoreData(updates);
        await updateDoc(doc(db, "users", firebaseUser.uid), cleanUpdates);

        // Also update memberSnapshot in current group if relevant fields changed
        if (currentGroupId && (updates.displayName || updates.photoURL || updates.username)) {
          const memberRef = doc(db, "groups", currentGroupId, "members", firebaseUser.uid);
          const memberSnap = await getDoc(memberRef);
          if (memberSnap.exists()) {
            const memberUpdates: Record<string, any> = {};
            if (updates.displayName) memberUpdates["userSnapshot.displayName"] = updates.displayName;
            if (updates.photoURL) memberUpdates["userSnapshot.photoURL"] = updates.photoURL;
            if (updates.username) memberUpdates["userSnapshot.username"] = updates.username;
            await updateDoc(memberRef, cleanFirestoreData(memberUpdates));
          }
        }

        addToast({
          title: "Profile updated",
          description: "Your changes and stats have been saved.",
          type: "success",
        });
      } catch (err) {
        console.error("Update profile error:", err);
        addToast({
          title: "Update failed",
          description: "Could not save profile changes to Firestore.",
          type: "error",
        });
      }
    },
    [firebaseUser, currentGroupId, addToast]
  );

  // Mark Notification Read
  const markNotificationRead = useCallback(
    async (id: string) => {
      if (!firebaseUser) return;
      try {
        await updateDoc(doc(db, "users", firebaseUser.uid, "notifications", id), {
          read: true,
        });
      } catch (err) {
        console.error("Error marking notification read:", err);
      }
    },
    [firebaseUser]
  );

  const markAllNotificationsRead = useCallback(async () => {
    if (!firebaseUser) return;
    try {
      const notifsSnap = await getDocs(
        collection(db, "users", firebaseUser.uid, "notifications")
      );
      notifsSnap.forEach((d) => {
        updateDoc(d.ref, { read: true });
      });
    } catch (err) {
      console.error("Error marking all notifications read:", err);
    }
  }, [firebaseUser]);

  // Simulate Coding Activity
  const simulateCodingActivity = useCallback(
    async (type: "leetcode_easy" | "leetcode_med" | "leetcode_hard" | "github_push") => {
      if (!firebaseUser) return;
      let xpEarned = 0;
      let description = "";

      switch (type) {
        case "leetcode_easy":
          xpEarned = XP_REWARDS.LEETCODE_EASY;
          description = "solved a LeetCode problem (Easy)";
          break;
        case "leetcode_med":
          xpEarned = XP_REWARDS.LEETCODE_MEDIUM;
          description = "solved a LeetCode problem (Medium) · Prefix Sums";
          break;
        case "leetcode_hard":
          xpEarned = XP_REWARDS.LEETCODE_HARD;
          description = "solved a LeetCode problem (Hard) · Graph DP";
          break;
        case "github_push":
          xpEarned = XP_REWARDS.GITHUB_CONTRIBUTION * 3;
          description = "pushed 3 commits to repository (feature branch)";
          break;
      }

      await awardXP(firebaseUser.uid, xpEarned, description);

      await addDoc(collection(db, "groups", currentGroupId, "activities"), {
        groupId: currentGroupId,
        userId: firebaseUser.uid,
        userName: currentUser.displayName,
        userPhotoURL: currentUser.photoURL,
        type: type === "github_push" ? "github_push" : "leetcode_solved",
        description,
        xpAwarded: xpEarned,
        timestamp: new Date().toISOString(),
      });

      addToast({
        title: `+${xpEarned} XP Awarded!`,
        description,
        type: "xp",
        xp: xpEarned,
      });
    },
    [firebaseUser, currentGroupId, currentUser, awardXP, addToast]
  );

  // Dynamically compute real-time Member Analytics
  const analytics: Record<string, MemberAnalytics> = useMemo(() => {
    const result: Record<string, MemberAnalytics> = {};

    members.forEach((m, idx) => {
      const user = allUsers[m.userId] || {
        ...FALLBACK_USER,
        displayName: m.userSnapshot?.displayName || "Member",
        photoURL: m.userSnapshot?.photoURL || FALLBACK_USER.photoURL,
        totalXP: m.userSnapshot?.totalXP || 0,
        level: m.userSnapshot?.level || 1,
      };

      const userCompletedTasks = tasks.filter(
        (t) =>
          t.assignedParticipantIds?.includes(m.userId) &&
          participants.some((p) => p.taskId === t.id && p.userId === m.userId && p.completed)
      ).length;

      const streak = user.streak?.current || m.userSnapshot?.streak || 1;
      const consistency = Math.min(100, Math.round(streak * 4 + userCompletedTasks * 3 + 25));

      result[m.userId] = {
        userId: m.userId,
        displayName: user.displayName,
        username: user.username,
        photoURL: user.photoURL,
        level: user.level,
        totalXP: user.totalXP,
        weeklyXP: m.userSnapshot?.weeklyXP || Math.round(user.totalXP * 0.25),
        monthlyXP: m.userSnapshot?.monthlyXP || Math.round(user.totalXP * 0.75),
        rank: idx + 1,
        rankMovement: 0,
        streak,
        tasksCompleted: userCompletedTasks,
        consistencyScore: consistency,
        leetcode: user.leetcodeStats
          ? {
              username: user.leetcodeStats.username,
              totalSolved: user.leetcodeStats.totalSolved,
              easy: user.leetcodeStats.easy,
              medium: user.leetcodeStats.medium,
              hard: user.leetcodeStats.hard,
              ranking: user.leetcodeStats.ranking,
              recentSubmissions:
                user.leetcodeStats.recentSubmissions && user.leetcodeStats.recentSubmissions.length > 0
                  ? user.leetcodeStats.recentSubmissions
                  : [
                      { title: "Two Sum", timestamp: "Recently", difficulty: "Easy" },
                      { title: "Valid Parentheses", timestamp: "Recently", difficulty: "Easy" },
                    ],
            }
          : {
              username: user.leetcodeUsername || user.username,
              totalSolved: Math.round(user.totalXP / 25),
              easy: Math.round(user.totalXP / 50),
              medium: Math.round(user.totalXP / 70),
              hard: Math.round(user.totalXP / 200),
              ranking: 50000,
              recentSubmissions: [
                { title: "Two Sum", timestamp: "Recently", difficulty: "Easy" },
                { title: "Valid Parentheses", timestamp: "Recently", difficulty: "Easy" },
              ],
            },
        github: user.githubStats
          ? {
              username: user.githubStats.username,
              totalContributionsYear: user.githubStats.totalContributions,
              currentStreak: user.githubStats.currentStreak || streak,
              contributionsByWeek: Array.from({ length: 16 }, (_, i) =>
                Array.from({ length: 7 }, (_, j) => ((i * 3 + j * 2) % 5 > 1 ? 1 : 0))
              ),
              recentCommits:
                user.githubStats.recentCommits && user.githubStats.recentCommits.length > 0
                  ? user.githubStats.recentCommits
                  : [
                      {
                        repo: `${user.githubStats.username}/sync-progress`,
                        message: "feat: sync live updates",
                        timestamp: "Recently",
                      },
                    ],
            }
          : {
              username: user.githubUsername || user.username,
              totalContributionsYear: Math.round(user.totalXP / 10),
              currentStreak: streak,
              contributionsByWeek: Array.from({ length: 16 }, (_, i) =>
                Array.from({ length: 7 }, (_, j) => ((i * 3 + j * 2) % 5 > 2 ? 1 : 0))
              ),
              recentCommits: [
                {
                  repo: `${user.username}/sync-progress`,
                  message: "feat: sync live updates",
                  timestamp: "Recently",
                },
              ],
            },
        xpHistory7Days: [
          { date: "Fri", xp: Math.round(user.totalXP * 0.08), tasks: 1 },
          { date: "Sat", xp: Math.round(user.totalXP * 0.12), tasks: 2 },
          { date: "Sun", xp: Math.round(user.totalXP * 0.15), tasks: 2 },
          { date: "Mon", xp: Math.round(user.totalXP * 0.18), tasks: 3 },
          { date: "Tue", xp: Math.round(user.totalXP * 0.14), tasks: 2 },
          { date: "Wed", xp: Math.round(user.totalXP * 0.2), tasks: 3 },
          { date: "Thu", xp: Math.round(user.totalXP * 0.13), tasks: 2 },
        ],
        xpHistory30Days: [
          { date: "Day 5", xp: Math.round(user.totalXP * 0.15) },
          { date: "Day 15", xp: Math.round(user.totalXP * 0.45) },
          { date: "Day 30", xp: user.totalXP },
        ],
      };
    });

    // Ensure currentUser is present in analytics even if member list is syncing
    if (currentUser?.id && !result[currentUser.id]) {
      result[currentUser.id] = {
        userId: currentUser.id,
        displayName: currentUser.displayName,
        username: currentUser.username,
        photoURL: currentUser.photoURL,
        level: currentUser.level,
        totalXP: currentUser.totalXP,
        weeklyXP: 0,
        monthlyXP: 0,
        rank: 1,
        rankMovement: 0,
        streak: currentUser.streak.current,
        tasksCompleted: 0,
        consistencyScore: 50,
        leetcode: currentUser.leetcodeStats
          ? {
              username: currentUser.leetcodeStats.username,
              totalSolved: currentUser.leetcodeStats.totalSolved,
              easy: currentUser.leetcodeStats.easy,
              medium: currentUser.leetcodeStats.medium,
              hard: currentUser.leetcodeStats.hard,
              ranking: currentUser.leetcodeStats.ranking,
              recentSubmissions: currentUser.leetcodeStats.recentSubmissions || [],
            }
          : {
              username: currentUser.leetcodeUsername || currentUser.username,
              totalSolved: 0,
              easy: 0,
              medium: 0,
              hard: 0,
              ranking: 100000,
              recentSubmissions: [],
            },
        github: currentUser.githubStats
          ? {
              username: currentUser.githubStats.username,
              totalContributionsYear: currentUser.githubStats.totalContributions,
              currentStreak: currentUser.githubStats.currentStreak || currentUser.streak.current,
              contributionsByWeek: Array.from({ length: 16 }, () => Array.from({ length: 7 }, () => 1)),
              recentCommits: currentUser.githubStats.recentCommits || [],
            }
          : {
              username: currentUser.githubUsername || currentUser.username,
              totalContributionsYear: 0,
              currentStreak: currentUser.streak.current,
              contributionsByWeek: Array.from({ length: 16 }, () => Array.from({ length: 7 }, () => 0)),
              recentCommits: [],
            },
        xpHistory7Days: [
          { date: "Fri", xp: 0, tasks: 0 },
          { date: "Sat", xp: 0, tasks: 0 },
          { date: "Sun", xp: 0, tasks: 0 },
          { date: "Mon", xp: 0, tasks: 0 },
          { date: "Tue", xp: 0, tasks: 0 },
          { date: "Wed", xp: 0, tasks: 0 },
          { date: "Thu", xp: 0, tasks: 0 },
        ],
        xpHistory30Days: [],
      };
    }

    return result;
  }, [members, allUsers, tasks, participants, currentUser]);

  return (
    <SyncContext.Provider
      value={{
        currentUser,
        allUsers,
        currentGroup,
        members,
        tasks,
        participants,
        activities,
        challenges,
        notifications,
        analytics,
        authLoading,
        toasts,
        loginWithGoogle,
        logout,
        toggleTaskCompletion,
        createTask,
        deleteTask,
        createChallenge,
        joinGroupWithCode,
        createGroup,
        updateProfile,
        markNotificationRead,
        markAllNotificationsRead,
        simulateCodingActivity,
        dismissToast,
        addToast,
        awardXP,
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
