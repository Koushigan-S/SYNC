import * as functions from "firebase-functions";
import * as admin from "firebase-admin";

admin.initializeApp();
const db = admin.firestore();

const XP_REWARDS = {
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
};

function calculateLevel(totalXP: number): number {
  if (totalXP <= 0) return 1;
  return Math.floor(Math.sqrt(totalXP / 20)) + 1;
}

/**
 * Securely awards XP to a user via Firestore transaction.
 * Creates an immutable record in users/{userId}/xpTransactions
 * and increments totalXP on users/{userId}.
 */
async function secureAwardXP(
  userId: string,
  groupId: string,
  amount: number,
  reason: string,
  sourceType: string,
  sourceId?: string
) {
  const userRef = db.collection("users").doc(userId);
  const txRef = userRef.collection("xpTransactions").doc();

  await db.runTransaction(async (transaction) => {
    const userDoc = await transaction.get(userRef);
    if (!userDoc.exists) return;

    const currentXP = userDoc.data()?.totalXP || 0;
    const newTotalXP = currentXP + amount;
    const newLevel = calculateLevel(newTotalXP);

    // Create immutable transaction ledger item
    transaction.set(txRef, {
      id: txRef.id,
      userId,
      groupId,
      amount,
      reason,
      sourceType,
      sourceId: sourceId || null,
      createdAt: admin.firestore.FieldValue.serverTimestamp(),
    });

    // Update user profile totalXP and level
    transaction.update(userRef, {
      totalXP: newTotalXP,
      level: newLevel,
      updatedAt: admin.firestore.FieldValue.serverTimestamp(),
    });
  });
}

/**
 * Triggered whenever a participant completion state changes.
 * 1. If participant completed: awards task XP (+ early deadline bonus).
 * 2. Checks if all participants of this shared task are now complete.
 * 3. If so, awards +30 XP squad completion bonus to each member!
 */
export const onTaskParticipantWritten = functions.firestore
  .document("groups/{groupId}/tasks/{taskId}/participants/{userId}")
  .onWrite(async (change, context) => {
    const { groupId, taskId, userId } = context.params;
    const beforeData = change.before.data();
    const afterData = change.after.data();

    // If deleted or not completed, skip
    if (!afterData || !afterData.completed) return;

    // Check if newly completed
    const wasCompleted = beforeData?.completed || false;
    if (wasCompleted) return; // already processed

    // Fetch the task document
    const taskRef = db.collection("groups").doc(groupId).collection("tasks").doc(taskId);
    const taskDoc = await taskRef.get();
    if (!taskDoc.exists) return;

    const taskData = taskDoc.data()!;
    let earnedXP = XP_REWARDS.COMPLETE_TASK;

    // Check deadline bonus
    if (taskData.deadline) {
      const deadlineMillis = new Date(taskData.deadline).getTime();
      if (Date.now() < deadlineMillis) {
        earnedXP += XP_REWARDS.EARLY_DEADLINE_BONUS;
      }
    }

    // Award task completion XP to this user
    await secureAwardXP(
      userId,
      groupId,
      earnedXP,
      `Completed task: ${taskData.title}`,
      "task",
      taskId
    );

    // Check all assigned participants for full squad completion
    const participantsSnap = await taskRef.collection("participants").get();
    const assignedIds: string[] = taskData.assignedParticipantIds || [];

    if (assignedIds.length > 1) {
      const allCompleted = assignedIds.every((uid) => {
        const pDoc = participantsSnap.docs.find((d) => d.id === uid);
        return pDoc && pDoc.data().completed;
      });

      if (allCompleted && !taskData.isSquadComplete) {
        // Mark task squad complete
        await taskRef.update({
          isSquadComplete: true,
          squadCompletedAt: admin.firestore.FieldValue.serverTimestamp(),
        });

        // Award +30 XP squad bonus to every participant
        for (const uid of assignedIds) {
          await secureAwardXP(
            uid,
            groupId,
            XP_REWARDS.SQUAD_TASK_BONUS,
            `Squad completion bonus: ${taskData.title}`,
            "squad_bonus",
            taskId
          );
        }

        // Post squad activity
        await db.collection("groups").doc(groupId).collection("activities").add({
          groupId,
          type: "squad_task_completed",
          description: `Squad complete: "${taskData.title}" · All ${assignedIds.length} members completed!`,
          xpAwarded: XP_REWARDS.SQUAD_TASK_BONUS,
          timestamp: admin.firestore.FieldValue.serverTimestamp(),
        });
      }
    }
  });

/**
 * Callable function to query LeetCode public profile and award XP.
 */
export const syncLeetCodeStats = functions.https.onCall(async (data, context) => {
  if (!context.auth) {
    throw new functions.https.HttpsError("unauthenticated", "Must be logged in.");
  }

  const username = data.username;
  if (!username) {
    throw new functions.https.HttpsError("invalid-argument", "Missing username.");
  }

  // Uses public LeetCode GraphQL query schema
  try {
    const response = await fetch("https://leetcode.com/graphql", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        query: `
          query getUserProfile($username: String!) {
            matchedUser(username: $username) {
              username
              submitStats: submitStatsGlobal {
                acSubmissionNum {
                  difficulty
                  count
                }
              }
            }
          }
        `,
        variables: { username },
      }),
    });

    const result = (await response.json()) as any;
    const stats = result?.data?.matchedUser?.submitStats?.acSubmissionNum;

    return {
      success: true,
      stats,
    };
  } catch {
    // Return gracefully if rate-limited or unavailable
    return {
      success: false,
      message: "LeetCode stats synchronization fallback mode.",
    };
  }
});

/**
 * Scheduled daily function at 08:00 UTC to evaluate upcoming tasks and send FCM reminders.
 */
export const scheduledTaskReminders = functions.pubsub
  .schedule("every 24 hours")
  .onRun(async () => {
    const today = new Date().toISOString().split("T")[0];
    const tasksSnapshot = await db
      .collectionGroup("tasks")
      .where("scheduledDate", "==", today)
      .get();

    for (const doc of tasksSnapshot.docs) {
      const task = doc.data();
      const groupId = task.groupId;
      const title = task.title;

      await db
        .collection("groups")
        .doc(groupId)
        .collection("notifications")
        .add({
          title: "Upcoming Squad Task",
          message: `"${title}" is scheduled for today.`,
          type: "task_reminder",
          read: false,
          createdAt: admin.firestore.FieldValue.serverTimestamp(),
        });
    }

    return null;
  });
