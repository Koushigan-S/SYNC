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
  SongTrack,
  UserMusicPresence,
  FocusStation,
  FocusRoom,
} from "@/types";

export const DEFAULT_MEET_URL = process.env.NEXT_PUBLIC_DEFAULT_MEET_URL || "";

export const STANDBY_TRACK: SongTrack = {
  id: "standby-track",
  title: "No Song Playing",
  artist: "Add songs to your squad library",
  album: "Squad Library",
  albumArt: "",
  audioUrl: "",
  duration: 0,
  durationMs: 0,
  genre: "Squad Audio",
};

export const CURATED_FOCUS_STATIONS: FocusStation[] = [];

export const INITIAL_FOCUS_ROOM: FocusRoom = {
  meetUrl: DEFAULT_MEET_URL,
  activeMemberIds: [],
  isGroupListening: false,
  hostTrack: null,
  pomodoro: {
    isActive: false,
    mode: "focus",
    timeLeftSeconds: 25 * 60,
    durationSeconds: 25 * 60,
    sessionsCompleted: 0,
  },
};
