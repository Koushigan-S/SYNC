export const XP_REWARDS = {
  COMPLETE_TASK: 20,
  EARLY_DEADLINE_BONUS: 10,
  DAILY_ACTIVE_STREAK: 5,
  LEETCODE_EASY: 10,
  LEETCODE_MEDIUM: 25,
  LEETCODE_HARD: 50,
  GITHUB_CONTRIBUTION: 2,
  WEEKLY_GOAL_COMPLETE: 50,
  CHALLENGE_COMPLETE: 100,
  SQUAD_TASK_BONUS: 30,
} as const;

export const DEFAULT_NOTIFICATION_PREFERENCES = {
  taskReminders: true,
  sharedTaskUpdates: true,
  challengeAlerts: true,
  rankChanges: true,
  squadCompletion: true,
  browserPush: false,
};

/**
 * Calculates level from total XP using a smooth progression curve.
 * Level 1: 0 - 99 XP
 * Level 2: 100 - 249 XP
 * Level 3: 250 - 449 XP
 * ...
 */
export function calculateLevel(totalXP: number): number {
  if (totalXP <= 0) return 1;
  // Formula: level = Math.floor(Math.sqrt(totalXP / 25)) + 1
  return Math.floor(Math.sqrt(totalXP / 20)) + 1;
}

export function getXPForLevel(level: number): number {
  if (level <= 1) return 0;
  return Math.pow(level - 1, 2) * 20;
}

export function getLevelProgress(totalXP: number): {
  currentLevel: number;
  currentLevelXP: number;
  nextLevelXP: number;
  percentage: number;
} {
  const currentLevel = calculateLevel(totalXP);
  const currentBase = getXPForLevel(currentLevel);
  const nextBase = getXPForLevel(currentLevel + 1);
  const progressInLevel = Math.max(0, totalXP - currentBase);
  const range = nextBase - currentBase;
  const percentage = Math.min(100, Math.round((progressInLevel / (range || 1)) * 100));

  return {
    currentLevel,
    currentLevelXP: totalXP,
    nextLevelXP: nextBase,
    percentage,
  };
}

export const DEMO_GROUP_ID = "group-founders-squad";
export const DEMO_INVITE_CODE = "SYNC-FOUNDERS-2026";
export const CURRENT_USER_ID = "user-nova";
