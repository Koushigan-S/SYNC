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

export function AppShell({ children }: { children: React.ReactNode }) {
  const [isTaskModalOpen, setIsTaskModalOpen] = useState(false);
  const [isNotificationsOpen, setIsNotificationsOpen] = useState(false);
  const [isOnboardingOpen, setIsOnboardingOpen] = useState(false);
  const [isGroupSettingsOpen, setIsGroupSettingsOpen] = useState(false);

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
      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-6 pb-24 md:pb-12">
        {children}
      </main>

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
