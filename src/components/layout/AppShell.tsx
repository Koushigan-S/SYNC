"use client";

import React, { useState } from "react";
import { TopNav } from "@/components/navigation/TopNav";
import { BottomNav } from "@/components/navigation/BottomNav";
import { ToastContainer } from "@/components/ui/toast";
import { TaskCreateModal } from "@/components/tasks/TaskCreateModal";
import { NotificationDrawer } from "@/components/notifications/NotificationDrawer";
import { OnboardingModal } from "@/components/onboarding/OnboardingModal";
import { GroupSettingsModal } from "@/components/group/GroupSettingsModal";
import { InitialLoader } from "@/components/ui/InitialLoader";
import { MusicMeetDock } from "@/components/music/MusicMeetDock";
import { GoogleAuthView } from "@/components/auth/GoogleAuthView";
import { useSync } from "@/context/SyncContext";

export function AppShell({ children }: { children: React.ReactNode }) {
  const { currentUser, authLoading } = useSync();
  const [isTaskModalOpen, setIsTaskModalOpen] = useState(false);
  const [isNotificationsOpen, setIsNotificationsOpen] = useState(false);
  const [isOnboardingOpen, setIsOnboardingOpen] = useState(false);
  const [isGroupSettingsOpen, setIsGroupSettingsOpen] = useState(false);

  // If Firebase auth is initializing
  if (authLoading) {
    return (
      <div className="min-h-screen bg-black flex flex-col items-center justify-center text-white space-y-4">
        <div className="w-14 h-14 rounded-2xl flex items-center justify-center animate-pulse">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src="/icon.png"
            alt="SYNC"
            className="w-14 h-14 object-contain drop-shadow-[0_0_20px_rgba(255,255,255,0.3)]"
          />
        </div>
        <div className="text-xs text-zinc-400 font-mono flex items-center gap-2">
          <span className="w-2 h-2 rounded-full bg-emerald-400 animate-ping" />
          Connecting to SYNC...
        </div>
        <ToastContainer />
      </div>
    );
  }

  // If user is not authenticated with Google, show GoogleAuthView only
  if (!currentUser || currentUser.id === "guest") {
    return (
      <div className="min-h-screen flex flex-col bg-black text-white selection:bg-white/20 selection:text-white">
        <header className="w-full glass-header py-4 px-6 border-b border-white/10 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src="/icon.png"
              alt="SYNC"
              className="w-7 h-7 rounded-lg object-contain drop-shadow-[0_0_10px_rgba(255,255,255,0.25)]"
            />
            <span className="font-semibold tracking-wider text-sm text-white">SYNC</span>
          </div>
          <span className="text-xs text-zinc-400 font-mono">Private Network</span>
        </header>

        <main className="flex-1 flex items-center justify-center">
          <GoogleAuthView />
        </main>

        <ToastContainer />
      </div>
    );
  }

  return (
    <div className="min-h-screen flex flex-col bg-black text-white selection:bg-white/20 selection:text-white">
      {/* 3-Second Initial Loader */}
      <InitialLoader />

      {/* Desktop Top Navigation */}
      <TopNav
        onOpenNotifications={() => setIsNotificationsOpen(true)}
        onOpenNewTask={() => setIsTaskModalOpen(true)}
        onOpenOnboarding={() => setIsOnboardingOpen(true)}
        onOpenGroupSettings={() => setIsGroupSettingsOpen(true)}
      />

      {/* Main Content Area */}
      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-6 pb-36 md:pb-28">
        {children}
      </main>

      {/* Floating Squad Music & Google Meet Lounge Dock */}
      <MusicMeetDock />

      {/* Mobile Bottom Dock Navigation */}
      <BottomNav />

      {/* Global Modals & Drawers */}
      <TaskCreateModal
        isOpen={isTaskModalOpen}
        onClose={() => setIsTaskModalOpen(false)}
      />
      <NotificationDrawer
        isOpen={isNotificationsOpen}
        onClose={() => setIsNotificationsOpen(false)}
      />
      <OnboardingModal
        isOpen={isOnboardingOpen}
        onClose={() => setIsOnboardingOpen(false)}
      />
      <GroupSettingsModal
        isOpen={isGroupSettingsOpen}
        onClose={() => setIsGroupSettingsOpen(false)}
      />

      {/* Minimalist Toast Alerts */}
      <ToastContainer />
    </div>
  );
}
