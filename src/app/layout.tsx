import type { Metadata, Viewport } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import { SyncProvider } from "@/context/SyncContext";
import { MusicMeetProvider } from "@/context/MusicMeetContext";
import { AppShell } from "@/components/layout/AppShell";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
  display: "swap",
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
  display: "swap",
  preload: false,
});

export const metadata: Metadata = {
  metadataBase: new URL("https://sync-4517e.web.app"),
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
  icons: {
    icon: [
      { url: "/favicon.ico", sizes: "any" },
      { url: "/icon.png", type: "image/png", sizes: "512x512" },
    ],
    apple: [
      { url: "/apple-icon.png", sizes: "180x180", type: "image/png" },
    ],
  },
  openGraph: {
    title: "SYNC — Private Progress Network",
    description:
      "Progress is better together. Private productivity, shared schedules, LeetCode & GitHub tracking, XP, and healthy competition for close friend groups.",
    images: [{ url: "/logo.png", width: 1024, height: 1024, alt: "SYNC Logo" }],
  },
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
          <MusicMeetProvider>
            <AppShell>{children}</AppShell>
          </MusicMeetProvider>
        </SyncProvider>
      </body>
    </html>
  );
}
