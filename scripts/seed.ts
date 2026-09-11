/**
 * SYNC — Firebase Firestore Emulator / Production Seeder Script
 * Run with: npx tsx scripts/seed.ts
 */

import * as admin from "firebase-admin";

// Initialize Firebase Admin (respects FIRESTORE_EMULATOR_HOST if running against emulators)
if (!admin.apps.length) {
  admin.initializeApp({
    projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID || "sync-progress-network",
  });
}

const db = admin.firestore();

const DEMO_GROUP_ID = "group-founders-squad";

async function seed() {
  console.log("🌱 Starting SYNC Firestore database seeding...");

  // 1. Users
  const users = [
    {
      id: "user-nova",
      displayName: "Nova Vance",
      username: "novavance",
      email: "nova@sync.dev",
      photoURL: "https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150&auto=format&fit=crop&q=80",
      timezone: "America/New_York",
      bio: "Building distributed systems & prepping for SWE interviews.",
      githubUsername: "novavance",
      leetcodeUsername: "novacodes",
      totalXP: 3920,
      level: 14,
      streak: { current: 18, longest: 24, lastActiveDate: "2026-09-11" },
      createdAt: admin.firestore.FieldValue.serverTimestamp(),
    },
    {
      id: "user-rahul",
      displayName: "Rahul Sharma",
      username: "rahulsharma",
      email: "rahul@sync.dev",
      photoURL: "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=150&auto=format&fit=crop&q=80",
      timezone: "America/Chicago",
      bio: "Systems hacker. Rust & Go enthusiast.",
      githubUsername: "rahulsh",
      leetcodeUsername: "rahul_codes",
      totalXP: 3480,
      level: 13,
      streak: { current: 14, longest: 19, lastActiveDate: "2026-09-11" },
      createdAt: admin.firestore.FieldValue.serverTimestamp(),
    },
    {
      id: "user-arun",
      displayName: "Arun Patel",
      username: "arunpatel",
      email: "arun@sync.dev",
      photoURL: "https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=150&auto=format&fit=crop&q=80",
      timezone: "America/Los_Angeles",
      bio: "Full stack TypeScript & UI perfectionist.",
      githubUsername: "arunp",
      leetcodeUsername: "arun_algo",
      totalXP: 2750,
      level: 11,
      streak: { current: 9, longest: 15, lastActiveDate: "2026-09-11" },
      createdAt: admin.firestore.FieldValue.serverTimestamp(),
    },
    {
      id: "user-karthik",
      displayName: "Karthik Raja",
      username: "karthikraja",
      email: "karthik@sync.dev",
      photoURL: "https://images.unsplash.com/photo-1519085360753-af0119f7cbe7?w=150&auto=format&fit=crop&q=80",
      timezone: "America/Toronto",
      bio: "ML algorithms & backend engineering.",
      githubUsername: "karthikr",
      leetcodeUsername: "kraja_dev",
      totalXP: 2340,
      level: 10,
      streak: { current: 6, longest: 12, lastActiveDate: "2026-09-11" },
      createdAt: admin.firestore.FieldValue.serverTimestamp(),
    },
  ];

  for (const user of users) {
    await db.collection("users").doc(user.id).set(user, { merge: true });
    console.log(`✓ Seeded user: ${user.displayName}`);
  }

  // 2. Group
  const groupRef = db.collection("groups").doc(DEMO_GROUP_ID);
  await groupRef.set({
    id: DEMO_GROUP_ID,
    name: "Founders Squad",
    description: "Private engineering & interview prep sprint crew.",
    imageUrl: "https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?w=400&auto=format&fit=crop&q=80",
    ownerId: "user-nova",
    inviteCode: "SYNC-FOUNDERS-2026",
    memberCount: 4,
    createdAt: admin.firestore.FieldValue.serverTimestamp(),
  });
  console.log("✓ Seeded group: Founders Squad");

  // 3. Group Members
  for (const user of users) {
    await groupRef.collection("members").doc(user.id).set({
      userId: user.id,
      groupId: DEMO_GROUP_ID,
      role: user.id === "user-nova" ? "owner" : user.id === "user-rahul" ? "admin" : "member",
      joinedAt: admin.firestore.FieldValue.serverTimestamp(),
      userSnapshot: {
        displayName: user.displayName,
        username: user.username,
        photoURL: user.photoURL,
        totalXP: user.totalXP,
        level: user.level,
        streak: user.streak.current,
      },
    });
  }
  console.log("✓ Seeded group members");

  // 4. Shared Task: ETM Test Preparation
  const etmTaskRef = groupRef.collection("tasks").doc("task-etm-prep");
  await etmTaskRef.set({
    id: "task-etm-prep",
    groupId: DEMO_GROUP_ID,
    creatorId: "user-rahul",
    creatorName: "Rahul Sharma",
    title: "ETM Test Preparation & High-Yield Review",
    notes: "Review Chapters 3-7: Finite Automata and Turing Decidability proofs.",
    scheduledDate: "2026-09-11",
    scheduledTime: "14:00",
    deadline: "2026-09-11T20:00:00Z",
    repeat: "never",
    visibility: "group",
    assignedParticipantIds: ["user-nova", "user-rahul", "user-arun", "user-karthik"],
    xpReward: 20,
    priority: "high",
    isSquadComplete: false,
    createdAt: admin.firestore.FieldValue.serverTimestamp(),
  });

  // Participant completion states
  const participantStates = [
    { uid: "user-nova", completed: true },
    { uid: "user-rahul", completed: true },
    { uid: "user-arun", completed: false },
    { uid: "user-karthik", completed: false },
  ];

  for (const p of participantStates) {
    await etmTaskRef.collection("participants").doc(p.uid).set({
      userId: p.uid,
      taskId: "task-etm-prep",
      groupId: DEMO_GROUP_ID,
      completed: p.completed,
      completedAt: p.completed ? admin.firestore.FieldValue.serverTimestamp() : null,
    });
  }
  console.log("✓ Seeded shared task: ETM Test Prep with participants");

  // 5. Challenges
  await groupRef.collection("challenges").doc("chal-sept-leetcode").set({
    id: "chal-sept-leetcode",
    groupId: DEMO_GROUP_ID,
    title: "September LeetCode Sprint",
    description: "Solve 40 LeetCode problems before month end.",
    startDate: "2026-09-01",
    endDate: "2026-09-30",
    metric: "leetcode_solved",
    targetValue: 40,
    xpReward: 100,
    participantIds: ["user-nova", "user-rahul", "user-arun", "user-karthik"],
    status: "active",
    currentProgress: {
      "user-nova": 28,
      "user-rahul": 31,
      "user-arun": 18,
      "user-karthik": 14,
    },
    createdAt: admin.firestore.FieldValue.serverTimestamp(),
  });
  console.log("✓ Seeded squad challenge");

  console.log("✨ Seeding completed successfully!");
}

seed()
  .then(() => process.exit(0))
  .catch((err) => {
    console.error("Seeding error:", err);
    process.exit(1);
  });
