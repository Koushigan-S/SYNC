import type { Metadata, Viewport } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import { SyncProvider } from "@/context/SyncContext";
import { AppShell } from "@/components/layout/AppShell";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "SYNC — Private Progress Network",
  description:
    "Progress is better together. Private productivity, shared schedules, LeetCode & GitHub tracking, XP, and healthy competition for close friend groups.",
  keywords: [
    "productivity",
    "friend groups",
    "habits",
    "leetcode tracker",
    "github progress",
    "accountability",
    "shared scheduler",
  ],
  authors: [{ name: "SYNC" }],
};

export const viewport: Viewport = {
  themeColor: "#000000",
  width: "device-width",
  initialScale: 1,
  maximumScale: 1,
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html
      lang="en"
      className={`${geistSans.variable} ${geistMono.variable} dark h-full bg-black`}
    >
      <body className="min-h-full flex flex-col bg-black text-white antialiased font-sans">
        <SyncProvider>
          <AppShell>{children}</AppShell>
        </SyncProvider>
      </body>
    </html>
  );
}
