"use client";

import React, {
  createContext,
  useContext,
  useState,
  useEffect,
  useCallback,
} from "react";
import confetti from "canvas-confetti";
import {
  SpotifyTrack,
  UserMusicPresence,
  FocusRoom,
  FocusStation,
} from "@/types";
import { CURATED_FOCUS_STATIONS, DEFAULT_MEET_URL } from "@/lib/demo-data";
import { XP_REWARDS } from "@/lib/constants";
import { useSync } from "@/context/SyncContext";
import { db } from "@/lib/firebase/config";
import { collection, doc, onSnapshot, setDoc, updateDoc } from "firebase/firestore";
import { cleanFirestoreData } from "@/lib/firebase/utils";

interface MusicMeetContextType {
  currentTrack: SpotifyTrack;
  isPlaying: boolean;
  presences: Record<string, UserMusicPresence>;
  listeningWith: string | null;
  focusRoom: FocusRoom;
  stations: FocusStation[];
  isDockExpanded: boolean;
  userMicEnabled: boolean;
  userVideoEnabled: boolean;

  // Actions
  togglePlay: () => void;
  changeTrack: (track: SpotifyTrack) => void;
  tuneInToMember: (userId: string) => void;
  stopTuneIn: () => void;
  joinFocusRoom: () => void;
  leaveFocusRoom: () => void;
  setMeetUrl: (url: string) => void;
  toggleGroupListening: () => void;
  togglePomodoro: () => void;
  resetPomodoro: (mode?: "focus" | "break") => void;
  toggleUserMic: () => void;
  toggleUserVideo: () => void;
  toggleDockExpanded: () => void;
  setDockExpanded: (expanded: boolean) => void;
  loadCustomTrack: (urlOrUri: string) => boolean;
}

const MusicMeetContext = createContext<MusicMeetContextType | null>(null);

const DEFAULT_FOCUS_ROOM: FocusRoom = {
  meetUrl: DEFAULT_MEET_URL,
  activeMemberIds: [],
  isGroupListening: false,
  hostTrack: CURATED_FOCUS_STATIONS[0].track,
  pomodoro: {
    isActive: false,
    mode: "focus",
    timeLeftSeconds: 25 * 60,
    durationSeconds: 25 * 60,
    sessionsCompleted: 0,
  },
};

export function MusicMeetProvider({ children }: { children: React.ReactNode }) {
  const { currentUser, allUsers, currentGroup, addToast, awardXP } = useSync();

  const [currentTrack, setCurrentTrack] = useState<SpotifyTrack>(
    CURATED_FOCUS_STATIONS[0].track
  );
  const [isPlaying, setIsPlaying] = useState<boolean>(true);
  const [presences, setPresences] = useState<Record<string, UserMusicPresence>>({});
  const [listeningWith, setListeningWith] = useState<string | null>(null);
  const [focusRoom, setFocusRoom] = useState<FocusRoom>(DEFAULT_FOCUS_ROOM);
  const [stations] = useState<FocusStation[]>(CURATED_FOCUS_STATIONS);
  const [isDockExpanded, setIsDockExpanded] = useState<boolean>(false);
  const [userMicEnabled, setUserMicEnabled] = useState<boolean>(false);
  const [userVideoEnabled, setUserVideoEnabled] = useState<boolean>(true);

  // Subscribe to real-time Presences in Firestore
  useEffect(() => {
    if (!currentUser?.id || currentUser.id === "guest" || !currentGroup?.id) return;
    const presenceColl = collection(db, "groups", currentGroup.id, "presence");
    const unsub = onSnapshot(
      presenceColl,
      (snap) => {
        const presMap: Record<string, UserMusicPresence> = {};
        snap.forEach((d) => {
          presMap[d.id] = d.data() as UserMusicPresence;
        });
        setPresences(presMap);
      },
      (err) => console.error("Error subscribing to presence:", err)
    );
    return () => unsub();
  }, [currentUser?.id, currentGroup?.id]);

  // Subscribe to real-time Focus Room state in Firestore
  useEffect(() => {
    if (!currentUser?.id || currentUser.id === "guest" || !currentGroup?.id) return;
    const roomRef = doc(db, "groups", currentGroup.id, "room", "focusRoom");
    const unsub = onSnapshot(
      roomRef,
      (snap) => {
        if (snap.exists()) {
          setFocusRoom(snap.data() as FocusRoom);
        } else {
          // Initialize in Firestore if doesn't exist
          setDoc(roomRef, cleanFirestoreData(DEFAULT_FOCUS_ROOM)).catch((e) =>
            console.error("Failed to init focusRoom in Firestore:", e)
          );
        }
      },
      (err) => console.error("Error subscribing to focusRoom:", err)
    );
    return () => unsub();
  }, [currentUser?.id, currentGroup?.id]);

  // Sync current user's playback state to Firestore presence
  useEffect(() => {
    if (!currentUser?.id || currentUser.id === "guest" || !currentGroup?.id) return;

    const presenceRef = doc(db, "groups", currentGroup.id, "presence", currentUser.id);
    const cleanTrack = currentTrack
      ? {
          id: currentTrack.id,
          title: currentTrack.title || "",
          artist: currentTrack.artist || "",
          album: currentTrack.album || "",
          albumArt: currentTrack.albumArt || "",
          spotifyUrl: currentTrack.spotifyUrl || "",
          embedUri: currentTrack.embedUri || "",
          durationMs: currentTrack.durationMs || 0,
          genre: currentTrack.genre || "Focus",
        }
      : null;

    const presenceData: UserMusicPresence = cleanFirestoreData({
      userId: currentUser.id,
      isPlaying: Boolean(isPlaying),
      track: cleanTrack,
      progressMs: 30000,
      listeningWithUserId: listeningWith ? listeningWith : null,
      lastUpdated: new Date().toISOString(),
    });

    setDoc(presenceRef, presenceData, { merge: true }).catch((err) =>
      console.error("Failed to update presence:", err)
    );
  }, [currentUser?.id, currentGroup?.id, isPlaying, currentTrack, listeningWith]);

  // Pomodoro countdown timer tick
  useEffect(() => {
    if (!focusRoom.pomodoro.isActive) return;

    const interval = setInterval(() => {
      setFocusRoom((prev) => {
        const { pomodoro } = prev;
        if (!pomodoro.isActive) return prev;

        if (pomodoro.timeLeftSeconds <= 1) {
          if (pomodoro.mode === "focus") {
            try {
              confetti({
                particleCount: 90,
                spread: 70,
                origin: { y: 0.6 },
              });
            } catch (e) {
              // ignore
            }

            const bonusXP = XP_REWARDS.POMODORO_SPRINT_BONUS;
            if (currentUser?.id && currentUser.id !== "guest") {
              awardXP(
                currentUser.id,
                bonusXP,
                "Pomodoro Squad Focus Sprint completed (25m)"
              );
            }

            addToast({
              title: "🍅 Focus Sprint Complete!",
              description: `+${bonusXP} XP awarded! Squad synchronized 25m sprint done. Take 5m rest.`,
              type: "xp",
              xp: bonusXP,
            });

            const nextRoom: FocusRoom = {
              ...prev,
              pomodoro: {
                ...pomodoro,
                isActive: false,
                mode: "break",
                timeLeftSeconds: 5 * 60,
                durationSeconds: 5 * 60,
                sessionsCompleted: pomodoro.sessionsCompleted + 1,
              },
            };

            // Sync to Firestore
            if (currentGroup?.id) {
              updateDoc(
                doc(db, "groups", currentGroup.id, "room", "focusRoom"),
                nextRoom as any
              ).catch(() => {});
            }

            return nextRoom;
          } else {
            addToast({
              title: "☕ Break Complete!",
              description: "Ready for your next squad deep work sprint?",
              type: "default",
            });

            const nextRoom: FocusRoom = {
              ...prev,
              pomodoro: {
                ...pomodoro,
                isActive: false,
                mode: "focus",
                timeLeftSeconds: 25 * 60,
                durationSeconds: 25 * 60,
              },
            };

            if (currentGroup?.id) {
              updateDoc(
                doc(db, "groups", currentGroup.id, "room", "focusRoom"),
                nextRoom as any
              ).catch(() => {});
            }

            return nextRoom;
          }
        }

        return {
          ...prev,
          pomodoro: {
            ...pomodoro,
            timeLeftSeconds: pomodoro.timeLeftSeconds - 1,
          },
        };
      });
    }, 1000);

    return () => clearInterval(interval);
  }, [focusRoom.pomodoro.isActive, currentUser.id, currentGroup?.id, awardXP, addToast]);

  const togglePlay = useCallback(() => {
    setIsPlaying((prev) => !prev);
  }, []);

  const changeTrack = useCallback((track: SpotifyTrack) => {
    setCurrentTrack(track);
    setIsPlaying(true);
    setListeningWith(null);
  }, []);

  const tuneInToMember = useCallback(
    (targetUserId: string) => {
      const presence = presences[targetUserId];
      const targetUser = allUsers[targetUserId];
      if (!presence || !presence.track) {
        addToast({
          title: "Member is not currently playing",
          description: "No active track detected for this squad member.",
          type: "error",
        });
        return;
      }

      setCurrentTrack(presence.track);
      setIsPlaying(true);
      setListeningWith(targetUserId);

      addToast({
        title: `🎧 Tuned into ${targetUser?.displayName || "Squad Member"}`,
        description: `Now listening in sync to "${presence.track.title}" by ${presence.track.artist}.`,
        type: "success",
      });
    },
    [presences, allUsers, addToast]
  );

  const stopTuneIn = useCallback(() => {
    setListeningWith(null);
    addToast({
      title: "🎧 Personal Listening Mode",
      description: "You left the squad synchronized stream.",
      type: "default",
    });
  }, [addToast]);

  const joinFocusRoom = useCallback(() => {
    if (!currentUser?.id || currentUser.id === "guest" || !currentGroup?.id) return;
    const nextMemberIds = Array.from(
      new Set([...focusRoom.activeMemberIds, currentUser.id])
    );
    setFocusRoom((prev) => ({
      ...prev,
      activeMemberIds: nextMemberIds,
    }));

    updateDoc(doc(db, "groups", currentGroup.id, "room", "focusRoom"), {
      activeMemberIds: nextMemberIds,
    }).catch(() => {});

    addToast({
      title: "Joined Focus Lounge",
      description: "You are now active in the squad co-working space.",
      type: "success",
    });
  }, [currentUser?.id, currentGroup?.id, focusRoom.activeMemberIds, addToast]);

  const leaveFocusRoom = useCallback(() => {
    if (!currentUser?.id || !currentGroup?.id) return;
    const nextMemberIds = focusRoom.activeMemberIds.filter(
      (id) => id !== currentUser.id
    );
    setFocusRoom((prev) => ({
      ...prev,
      activeMemberIds: nextMemberIds,
    }));

    updateDoc(doc(db, "groups", currentGroup.id, "room", "focusRoom"), {
      activeMemberIds: nextMemberIds,
    }).catch(() => {});

    addToast({
      title: "Left Focus Lounge",
      description: "You left the virtual co-working space.",
      type: "default",
    });
  }, [currentUser?.id, currentGroup?.id, focusRoom.activeMemberIds, addToast]);

  const setMeetUrl = useCallback(
    (url: string) => {
      const trimmed = url.trim();
      if (!trimmed || !currentGroup?.id) return;

      setFocusRoom((prev) => ({
        ...prev,
        meetUrl: trimmed,
      }));

      updateDoc(doc(db, "groups", currentGroup.id, "room", "focusRoom"), {
        meetUrl: trimmed,
      }).catch(() => {});

      addToast({
        title: "Google Meet link updated",
        description: `Squad room URL set to: ${trimmed}`,
        type: "success",
      });
    },
    [currentGroup?.id, addToast]
  );

  const toggleGroupListening = useCallback(() => {
    if (!currentGroup?.id) return;
    const next = !focusRoom.isGroupListening;
    setFocusRoom((prev) => ({
      ...prev,
      isGroupListening: next,
      hostTrack: next ? currentTrack : prev.hostTrack,
    }));

    updateDoc(
      doc(db, "groups", currentGroup.id, "room", "focusRoom"),
      cleanFirestoreData({
        isGroupListening: next,
        hostTrack: next ? currentTrack : focusRoom.hostTrack,
      })
    ).catch(() => {});

    addToast({
      title: focusRoom.isGroupListening
        ? "Squad Broadcast Mode Off"
        : "🎧 Squad Listening Party Active!",
      description: focusRoom.isGroupListening
        ? "Squad members can now pick separate tracks."
        : "Broadcasting your Spotify selection to the study room.",
      type: "success",
    });
  }, [currentGroup?.id, focusRoom.isGroupListening, focusRoom.hostTrack, currentTrack, addToast]);

  const togglePomodoro = useCallback(() => {
    if (!currentGroup?.id) return;
    const nextActive = !focusRoom.pomodoro.isActive;
    setFocusRoom((prev) => ({
      ...prev,
      pomodoro: {
        ...prev.pomodoro,
        isActive: nextActive,
      },
    }));

    updateDoc(doc(db, "groups", currentGroup.id, "room", "focusRoom"), {
      "pomodoro.isActive": nextActive,
    }).catch(() => {});
  }, [currentGroup?.id, focusRoom.pomodoro]);

  const resetPomodoro = useCallback(
    (mode: "focus" | "break" = "focus") => {
      if (!currentGroup?.id) return;
      const nextPomodoro = {
        ...focusRoom.pomodoro,
        isActive: false,
        mode,
        timeLeftSeconds: mode === "focus" ? 25 * 60 : 5 * 60,
        durationSeconds: mode === "focus" ? 25 * 60 : 5 * 60,
      };

      setFocusRoom((prev) => ({
        ...prev,
        pomodoro: nextPomodoro,
      }));

      updateDoc(doc(db, "groups", currentGroup.id, "room", "focusRoom"), {
        pomodoro: nextPomodoro,
      }).catch(() => {});
    },
    [currentGroup?.id, focusRoom.pomodoro]
  );

  const toggleUserMic = useCallback(() => {
    setUserMicEnabled((prev) => !prev);
  }, []);

  const toggleUserVideo = useCallback(() => {
    setUserVideoEnabled((prev) => !prev);
  }, []);

  const toggleDockExpanded = useCallback(() => {
    setIsDockExpanded((prev) => !prev);
  }, []);

  const setDockExpanded = useCallback((expanded: boolean) => {
    setIsDockExpanded(expanded);
  }, []);

  const loadCustomTrack = useCallback(
    (input: string): boolean => {
      const trimmed = input.trim();
      if (!trimmed) return false;

      let embedUri = "";
      let title = "Custom Spotify Stream";
      let artist = "Spotify Audio";

      const urlMatch = trimmed.match(
        /spotify\.com\/(track|playlist|album|episode)\/([a-zA-Z0-9]+)/
      );
      const uriMatch = trimmed.match(
        /spotify:(track|playlist|album|episode):([a-zA-Z0-9]+)/
      );

      if (urlMatch) {
        const type = urlMatch[1];
        const id = urlMatch[2];
        embedUri = `https://open.spotify.com/embed/${type}/${id}?utm_source=generator&theme=0`;
        title = `Spotify ${type.charAt(0).toUpperCase() + type.slice(1)}`;
      } else if (uriMatch) {
        const type = uriMatch[1];
        const id = uriMatch[2];
        embedUri = `https://open.spotify.com/embed/${type}/${id}?utm_source=generator&theme=0`;
        title = `Spotify ${type.charAt(0).toUpperCase() + type.slice(1)}`;
      } else if (trimmed.startsWith("https://open.spotify.com/embed/")) {
        embedUri = trimmed;
      } else {
        addToast({
          title: "Invalid Spotify URL",
          description:
            "Please paste a valid Spotify link (e.g., https://open.spotify.com/track/... or playlist)",
          type: "error",
        });
        return false;
      }

      const customTrack: SpotifyTrack = {
        id: "custom-" + Date.now(),
        title,
        artist,
        album: "Squad Session",
        albumArt:
          "https://images.unsplash.com/photo-1511671782779-c97d3d27a1d4?w=300&auto=format&fit=crop&q=80",
        spotifyUrl: trimmed.startsWith("http")
          ? trimmed
          : `https://open.spotify.com/track/${trimmed.split(":")[2] || ""}`,
        embedUri,
        genre: "Custom Audio",
      };

      setCurrentTrack(customTrack);
      setIsPlaying(true);
      setListeningWith(null);

      addToast({
        title: "Loaded Spotify Audio",
        description: "Embedded player updated with your custom link.",
        type: "success",
      });

      return true;
    },
    [addToast]
  );

  return (
    <MusicMeetContext.Provider
      value={{
        currentTrack,
        isPlaying,
        presences,
        listeningWith,
        focusRoom,
        stations,
        isDockExpanded,
        userMicEnabled,
        userVideoEnabled,
        togglePlay,
        changeTrack,
        tuneInToMember,
        stopTuneIn,
        joinFocusRoom,
        leaveFocusRoom,
        setMeetUrl,
        toggleGroupListening,
        togglePomodoro,
        resetPomodoro,
        toggleUserMic,
        toggleUserVideo,
        toggleDockExpanded,
        setDockExpanded,
        loadCustomTrack,
      }}
    >
      {children}
    </MusicMeetContext.Provider>
  );
}

export function useMusicMeet() {
  const context = useContext(MusicMeetContext);
  if (!context) {
    throw new Error("useMusicMeet must be used within a MusicMeetProvider");
  }
  return context;
}
