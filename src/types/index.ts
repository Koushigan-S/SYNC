export type GroupRole = "owner" | "admin" | "member";

export type TaskVisibility = "only_me" | "group" | "selected";

export type TaskPriority = "low" | "medium" | "high";

export type TaskRepeat = "never" | "daily" | "weekly" | "monthly";

export type XPSourceType =
  | "task"
  | "deadline_bonus"
  | "squad_bonus"
  | "streak"
  | "leetcode"
  | "github"
  | "challenge"
  | "weekly_goal";

export type ActivityType =
  | "task_completed"
  | "squad_task_completed"
  | "leetcode_solved"
  | "github_push"
  | "challenge_completed"
  | "streak_milestone"
  | "level_up";

export type ChallengeMetric =
  | "tasks_completed"
  | "leetcode_solved"
  | "github_contributions"
  | "xp_gained";

export type ChallengeStatus = "active" | "completed" | "cancelled";

export type NotificationType =
  | "task_reminder"
  | "squad_completion"
  | "challenge_update"
  | "rank_change"
  | "invite"
  | "system";

export interface UserStreak {
  current: number;
  longest: number;
  lastActiveDate: string;
}

export interface GitHubStats {
  username: string;
  publicRepos?: number;
  followers?: number;
  totalContributions?: number;
  totalContributionsYear?: number;
  currentStreak?: number;
  contributionsByWeek?: number[][];
  contributionsByYear?: Record<string, number>;
  recentCommits?: Array<{
    repo: string;
    message: string;
    timestamp: string;
  }>;
  avatarUrl?: string;
  lastUpdated?: string;
}

export interface LeetCodeStats {
  username: string;
  totalSolved: number;
  easy: number;
  medium: number;
  hard: number;
  ranking: number;
  acceptanceRate?: number;
  recentSubmissions?: Array<{
    title: string;
    difficulty: string;
    timestamp: string;
  }>;
  lastUpdated?: string;
}

export interface UserProfile {
  id: string;
  displayName: string;
  username: string;
  email: string;
  photoURL: string;
  timezone: string;
  bio?: string;
  githubUsername?: string;
  leetcodeUsername?: string;
  githubStats?: GitHubStats;
  leetcodeStats?: LeetCodeStats;
  lastSyncedAt?: string;
  totalXP: number;
  level: number;
  streak: UserStreak;
  createdAt: string;
}

export interface Group {
  id: string;
  name: string;
  description?: string;
  imageUrl?: string;
  ownerId: string;
  inviteCode: string;
  memberCount: number;
  createdAt: string;
}

export interface GroupMember {
  userId: string;
  groupId: string;
  role: GroupRole;
  joinedAt: string;
  userSnapshot: {
    displayName: string;
    username: string;
    photoURL: string;
    totalXP: number;
    level: number;
    streak: number;
    rank?: number;
    weeklyXP?: number;
    monthlyXP?: number;
    tasksCompleted?: number;
  };
}

export interface Task {
  id: string;
  groupId: string;
  creatorId: string;
  creatorName: string;
  title: string;
  notes?: string;
  scheduledDate: string; // YYYY-MM-DD
  scheduledTime?: string; // HH:mm
  deadline?: string; // ISO string
  repeat: TaskRepeat;
  visibility: TaskVisibility;
  assignedParticipantIds: string[];
  xpReward: number;
  priority: TaskPriority;
  challengeId?: string;
  isSquadComplete: boolean;
  createdAt: string;
}

export interface TaskParticipant {
  userId: string;
  taskId: string;
  groupId: string;
  completed: boolean;
  completedAt: string | null;
}

export interface XPTransaction {
  id: string;
  userId: string;
  groupId: string;
  amount: number;
  reason: string;
  sourceType: XPSourceType;
  sourceId?: string;
  createdAt: string;
}

export interface ActivityFeedItem {
  id: string;
  groupId: string;
  userId: string;
  userName: string;
  userPhotoURL: string;
  type: ActivityType;
  description: string;
  xpAwarded: number;
  metadata?: Record<string, unknown>;
  timestamp: string;
}

export interface Challenge {
  id: string;
  groupId: string;
  title: string;
  description: string;
  startDate: string;
  endDate: string;
  metric: ChallengeMetric;
  targetValue: number;
  xpReward: number;
  participantIds: string[];
  status: ChallengeStatus;
  winnerId?: string | null;
  currentProgress?: Record<string, number>;
  createdAt: string;
}

export interface NotificationItem {
  id: string;
  userId: string;
  groupId: string;
  title: string;
  message: string;
  type: NotificationType;
  read: boolean;
  createdAt: string;
  link?: string;
}

export interface NotificationPreference {
  taskReminders: boolean;
  sharedTaskUpdates: boolean;
  challengeAlerts: boolean;
  rankChanges: boolean;
  squadCompletion: boolean;
  browserPush: boolean;
}


export interface MemberAnalytics {
  userId: string;
  displayName: string;
  username: string;
  photoURL: string;
  level: number;
  totalXP: number;
  weeklyXP: number;
  monthlyXP: number;
  rank: number;
  rankMovement: number; // +1, 0, -1
  streak: number;
  tasksCompleted: number;
  consistencyScore: number;
  leetcode: LeetCodeStats;
  github: GitHubStats;
  xpHistory7Days: { date: string; xp: number; tasks: number }[];
  xpHistory30Days: { date: string; xp: number }[];
}

export interface SongTrack {
  id: string;
  title: string;
  artist: string;
  album?: string;
  albumArt: string;
  audioUrl: string;
  spotifyUrl?: string;
  embedUri?: string;
  streamUrl?: string;
  durationMs?: number;
  duration?: number;
  genre?: string;
  addedBy?: {
    id: string;
    name: string;
    photoURL?: string;
  };
  createdAt?: string;
}

// Backwards compatibility alias
export type SpotifyTrack = SongTrack;

export interface UserMusicPresence {
  userId: string;
  isPlaying: boolean;
  track: SongTrack | null;
  progressMs: number;
  currentTime?: number;
  duration?: number;
  listeningWithUserId?: string | null;
  isBroadcasting?: boolean;
  listenersCount?: number;
  lastUpdated: string;
}

export interface FocusStation {
  id: string;
  title: string;
  description: string;
  genre: string;
  coverArt: string;
  track: SongTrack;
}

export interface FocusRoom {
  meetUrl: string;
  activeMemberIds: string[];
  isGroupListening: boolean;
  hostTrack: SongTrack | null;
  hostUserId?: string | null;
  hostPosition?: number;
  pomodoro: {
    isActive: boolean;
    mode: "focus" | "break";
    timeLeftSeconds: number;
    durationSeconds: number;
    sessionsCompleted: number;
  };
}

