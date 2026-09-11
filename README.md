# SYNC — Private Progress Network

> **“Progress is better together.”**

SYNC is a private productivity and healthy-competition web application for small friend groups. It combines personal tasks, shared schedules, participant-based completion tracking, LeetCode & GitHub coding progress, XP, leaderboards, analytics, squad challenges, and notifications.

---

## ✦ Technology Stack

- **Framework**: [Next.js 16 (App Router)](https://nextjs.org/) + TypeScript
- **Styling**: [Tailwind CSS v4](https://tailwindcss.com/) with a curated Behance/Apple-grade monochrome design system
- **Motion**: [Framer Motion](https://www.framer.com/motion/) for quiet, tactile transitions and rank reordering
- **Icons**: [Lucide React](https://lucide.dev/)
- **Visualizations**: [Recharts](https://recharts.org/) for multi-member XP trajectories and task volume breakdowns
- **Celebrations**: [Canvas Confetti](https://www.npmjs.com/package/canvas-confetti) for squad completion bonuses
- **Backend & Database**: Firebase Authentication, Cloud Firestore, Firebase Storage, Firebase Cloud Messaging
- **Serverless Automation**: Firebase Cloud Functions (Node.js 20 / TypeScript)
- **Local Testing**: Firebase Local Emulator Suite

---

## ✦ Visual Design Language

Inspired by **Apple.com, Linear, GitHub, and Apple Fitness**, SYNC adheres strictly to an editorial monochrome palette:

| Token | Hex / Value | Purpose |
|---|---|---|
| **Background** | `#000000` | Deep pitch black foundational canvas |
| **Surface** | `#111111` | Primary cards and panels |
| **Raised Surface** | `#1C1C1E` | Dropdowns, inputs, and interactive sheets |
| **Border Subtle** | `rgba(255, 255, 255, 0.08)` | Ultra-fine dividers and container outlines |
| **Border Regular** | `rgba(255, 255, 255, 0.12)` | Focused boundaries and card edges |
| **Primary Text** | `#FFFFFF` | Editorial headings, metrics, and key data |
| **Secondary Text** | `#A1A1AA` | Supporting labels and descriptions |
| **Muted Text** | `#71717A` | Metadata, timestamps, and captions |
| **Success / Completed** | `#4ADE80` (Muted) | Restrained emerald accent for verified tasks |
| **Warning / Overdue** | `#F87171` (Muted) | Restrained coral accent for missed deadlines |

---

## ✦ Core Features & Architecture

### 1. Participant-Level Completion Model
Unlike generic task managers where one user marks a shared item complete for everyone:
- A shared task has **one parent `Task` record** and **individual `TaskParticipant` records**.
- Each assigned friend has their own independent completion state and timestamp.
- **Strict rule**: Users can *only* mark their own participant record complete.
- **Squad Bonus**: When all participants complete a task, a **+30 XP Squad Bonus** is automatically awarded to every member via atomic transactions.

### 2. Verified XP & Level System
XP is calculated and awarded according to strict rules:

| Action | XP | Notes |
|---|---:|---|
| **Complete Task** | 20 | Awarded on completion |
| **Early Deadline Bonus** | +10 | Awarded if completed before scheduled deadline |
| **Daily Active Streak** | +5 | Awarded for consecutive daily logins & activity |
| **LeetCode Easy** | 10 | Solved algorithm problem |
| **LeetCode Medium** | 25 | Solved algorithm problem |
| **LeetCode Hard** | 50 | Solved algorithm problem |
| **GitHub Contribution** | 2 | Per verified commit / PR |
| **Weekly Goal Complete** | 50 | Hitting all weekly targets |
| **Squad Task Completion** | +30 | All participants finish a shared task |
| **Challenge Victory** | 100 | Winner bounty for squad sprints |

### 3. Integrated Coding Progress
- **LeetCode Adapter**: Displays total solved, Easy/Medium/Hard breakdown, global ranking, and recent submissions.
- **GitHub Contribution Matrix**: 16-week and 52-week activity heatmap, commit history, and streak counter.

### 4. Interactive Simulation & Perspective Switching
- **Top Bar Simulation Trigger**: Reviewers can click **Simulate** in the top navigation to instantly simulate solving a LeetCode problem or pushing a Git commit. Watch the XP counter, level progress, and activity feed update reactively!
- **Member Switcher**: Click the avatar in the top right to switch between **Nova, Rahul, Arun, and Karthik** to verify participant permissions and multi-user views.

---

## ✦ Project Structure

```
├── public/                      # Static assets
├── src/
│   ├── app/
│   │   ├── layout.tsx           # App Shell & Providers
│   │   ├── page.tsx             # Dashboard (7-day chart, schedule, feed)
│   │   ├── schedule/page.tsx    # Scheduler (Day, Week, Month, List views)
│   │   ├── leaderboard/page.tsx # Animated rank leaderboard
│   │   ├── friends/page.tsx     # Profiles & Head-to-Head Comparison
│   │   ├── analytics/page.tsx   # Recharts XP trends & velocity
│   │   ├── challenges/page.tsx  # Squad challenge sprints
│   │   └── globals.css          # Design system variables & custom scrollbar
│   ├── components/
│   │   ├── layout/AppShell.tsx  # Root client layout
│   │   ├── navigation/
│   │   │   ├── TopNav.tsx       # Desktop minimal navigation & actions
│   │   │   └── BottomNav.tsx    # Mobile bottom dock navigation
│   │   ├── tasks/
│   │   │   ├── TaskCreateModal.tsx
│   │   │   └── TaskDetailModal.tsx
│   │   ├── notifications/
│   │   │   └── NotificationDrawer.tsx
│   │   ├── onboarding/
│   │   │   └── OnboardingModal.tsx
│   │   ├── group/
│   │   │   └── GroupSettingsModal.tsx
│   │   └── ui/
│   │       └── toast.tsx        # Framer Motion notification toasts
│   ├── context/
│   │   └── SyncContext.tsx      # Central reactive state & demo provider
│   ├── lib/
│   │   ├── constants.ts         # XP formulas & level calculations
│   │   ├── demo-data.ts         # Believable Founders Squad seed data
│   │   ├── utils.ts             # Tailwind class merging
│   │   └── firebase/
│   │       └── config.ts        # Firebase client & emulator connection
│   └── types/
│       └── index.ts             # Domain models & TypeScript interfaces
├── functions/                   # Firebase Cloud Functions (TypeScript)
│   ├── src/index.ts             # Squad bonus trigger & LeetCode sync
│   ├── package.json
│   └── tsconfig.json
├── firestore.rules              # Strict security rules
├── firestore.indexes.json       # Composite querying indexes
├── storage.rules                # Media upload rules
├── firebase.json                # Firebase Hosting & Emulator configuration
├── scripts/
│   └── seed.ts                  # Admin SDK database seeder
└── .env.example                 # Environment variable template
```

---

## ✦ Getting Started

### 1. Install Dependencies
```bash
npm install
```

### 2. Start Development Server
```bash
npm run dev
```
Open [http://localhost:3000](http://localhost:3000) in your browser.

> [!NOTE]
> **Instant Zero-Config Mode:**
> The application launches in high-fidelity **Demo Mode** out of the box, pre-populated with believable squad data (Founders Squad: Nova, Rahul, Arun, Karthik). Every feature—from marking participant tasks to XP level progression and challenge updates—works immediately with zero configuration.

---

## ✦ Local Firebase Emulator Suite

To run with local Firebase Emulators:

1. Copy `.env.example` to `.env.local`:
   ```bash
   cp .env.example .env.local
   ```
2. Set `NEXT_PUBLIC_USE_FIREBASE_EMULATOR=true` in `.env.local`.
3. Start the Firebase Emulator Suite:
   ```bash
   npx firebase-tools emulators:start
   ```
   Emulators will spin up at:
   - **Authentication**: `http://localhost:9099`
   - **Firestore**: `http://localhost:8080`
   - **Cloud Functions**: `http://localhost:5001`
   - **Emulator UI**: `http://localhost:4000`

4. (Optional) Seed the emulator with data:
   ```bash
   FIRESTORE_EMULATOR_HOST=localhost:8080 npx tsx scripts/seed.ts
   ```

---

## ✦ Production Deployment

### 1. Deploy Cloud Functions & Security Rules
```bash
npx firebase-tools deploy --only firestore:rules,firestore:indexes,functions
```

### 2. Build & Deploy Web Application
```bash
npm run build
npx firebase-tools deploy --only hosting
```

---

## ✦ Quality Assurance & Verification

- **TypeScript Compilation**: `npx tsc --noEmit` passed with 0 errors.
- **Production Build**: Verified clean Next.js App Router build.
- **Responsiveness**: Tested across desktop (1440px), tablet (768px), and mobile (390px iPhone viewport with dedicated bottom dock).
- **Accessibility**: Semantic HTML5 tags, high contrast ratios, reduced-motion compatibility, and tactile focus states.
