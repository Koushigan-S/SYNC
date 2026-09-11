"use client";

import React, {
  createContext,
  useContext,
  useState,
  useEffect,
  useCallback,
  useRef,
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
import { db, handleFirestoreQuotaExceeded } from "@/lib/firebase/config";
import { collection, doc, onSnapshot, setDoc, updateDoc } from "firebase/firestore";
import { cleanFirestoreData } from "@/lib/firebase/utils";
import {
  getSpotifyCredentials,
  searchSpotify,
} from "@/lib/services/spotify-service";

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
  isSpotifyConfigured: boolean;
  volume: number;
  isMuted: boolean;
  isBroadcasting: boolean;

  // Actions
  togglePlay: () => void;
  changeTrack: (track: SpotifyTrack) => void;
  tuneInToMember: (userId: string) => void;
  stopTuneIn: () => void;
  goSolo: () => void;
  toggleBroadcast: () => void;
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
  searchTracks: (query: string) => Promise<SpotifyTrack[]>;
  setVolume: (vol: number) => void;
  toggleMute: () => void;
}

const MusicMeetContext = createContext<MusicMeetContextType | null>(null);

const DEFAULT_FOCUS_ROOM: FocusRoom = {
  meetUrl: DEFAULT_MEET_URL,
  activeMemberIds: [],
  isGroupListening: false,
  hostTrack: CURATED_FOCUS_STATIONS[0].track,
  hostUserId: null,
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
  // Default to PAUSED on initial web open as requested
  const [isPlaying, setIsPlaying] = useState<boolean>(false);
  const [volume, setVolumeState] = useState<number>(0.8);
  const [isMuted, setIsMuted] = useState<boolean>(false);
  const [isBroadcasting, setIsBroadcasting] = useState<boolean>(false);
  const [presences, setPresences] = useState<Record<string, UserMusicPresence>>({});
  const [listeningWith, setListeningWith] = useState<string | null>(null);
  const [focusRoom, setFocusRoom] = useState<FocusRoom>(DEFAULT_FOCUS_ROOM);
  const [stations] = useState<FocusStation[]>(CURATED_FOCUS_STATIONS);
  const [isDockExpanded, setIsDockExpanded] = useState<boolean>(false);
  const [userMicEnabled, setUserMicEnabled] = useState<boolean>(false);
  const [userVideoEnabled, setUserVideoEnabled] = useState<boolean>(true);

  // Persistent HTML5 audio player for instant audible focus sound
  const audioRef = useRef<HTMLAudioElement | null>(null);

  // Refs to avoid stale closures in Firestore real-time listeners
  const currentTrackRef = useRef<SpotifyTrack>(currentTrack);
  const isPlayingRef = useRef<boolean>(isPlaying);
  const listeningWithRef = useRef<string | null>(listeningWith);
  const lastPresenceWriteKeyRef = useRef<string>("");
  const presenceDebounceTimerRef = useRef<NodeJS.Timeout | null>(null);
  const quotaExceededRef = useRef<boolean>(false);
  const roomInitAttemptedRef = useRef<boolean>(false);

  useEffect(() => {
    currentTrackRef.current = currentTrack;
  }, [currentTrack]);

  useEffect(() => {
    isPlayingRef.current = isPlaying;
  }, [isPlaying]);

  useEffect(() => {
    listeningWithRef.current = listeningWith;
  }, [listeningWith]);

  useEffect(() => {
    if (typeof window === "undefined") return;
    const audio = new Audio();
    audio.preload = "none";
    audio.loop = true;
    audio.volume = 0.8;
    audioRef.current = audio;

    return () => {
      audio.pause();
      audio.src = "";
      audioRef.current = null;
    };
  }, []);

  // Subscribe to real-time Presences in Firestore with reactive auto-follow
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

        // Compute listenersCount client-side dynamically
        Object.keys(presMap).forEach((uid) => {
          presMap[uid].listenersCount = Object.values(presMap).filter(
            (p) => p.listeningWithUserId === uid
          ).length;
        });

        setPresences(presMap);

        // Reactive follow: if we are listening with a teammate, synchronize to their track!
        const targetHostId = listeningWithRef.current;
        if (targetHostId && presMap[targetHostId]?.track) {
          const hostTrack = presMap[targetHostId].track;
          if (hostTrack && hostTrack.id !== currentTrackRef.current?.id) {
            setCurrentTrack(hostTrack);
            if (audioRef.current && isPlayingRef.current) {
              const stream = hostTrack.streamUrl || CURATED_FOCUS_STATIONS[0].track.streamUrl;
              if (stream && audioRef.current.src !== stream) {
                audioRef.current.src = stream;
                audioRef.current.play().catch(() => {});
              }
            }
          }
        }
      },
      (err: any) => {
        if (err?.code === "resource-exhausted" || err?.message?.includes("Quota")) {
          quotaExceededRef.current = true;
          handleFirestoreQuotaExceeded();
          console.warn("Firestore presence subscription paused (daily free quota reached).");
        } else {
          console.error("Error subscribing to presence:", err);
        }
      }
    );
    return () => unsub();
  }, [currentUser?.id, currentGroup?.id]);

  // Subscribe to real-time Focus Room state in Firestore with group sync
  useEffect(() => {
    if (!currentUser?.id || currentUser.id === "guest" || !currentGroup?.id) return;
    const roomRef = doc(db, "groups", currentGroup.id, "room", "focusRoom");
    const unsub = onSnapshot(
      roomRef,
      (snap) => {
        if (snap.exists()) {
          const roomData = snap.data() as FocusRoom;
          setFocusRoom(roomData);

          // If room is group listening and user is active in room:
          if (
            roomData.isGroupListening &&
            roomData.hostTrack &&
            roomData.activeMemberIds.includes(currentUser.id) &&
            !listeningWithRef.current
          ) {
            if (roomData.hostTrack.id !== currentTrackRef.current?.id) {
              setCurrentTrack(roomData.hostTrack);
              if (audioRef.current && isPlayingRef.current) {
                const stream =
                  roomData.hostTrack.streamUrl ||
                  CURATED_FOCUS_STATIONS[0].track.streamUrl;
                if (stream && audioRef.current.src !== stream) {
                  audioRef.current.src = stream;
                  audioRef.current.play().catch(() => {});
                }
              }
            }
          }
        } else if (!roomInitAttemptedRef.current && !quotaExceededRef.current) {
          // Initialize in Firestore once if doesn't exist
          roomInitAttemptedRef.current = true;
          setDoc(roomRef, cleanFirestoreData(DEFAULT_FOCUS_ROOM)).catch((e: any) => {
            if (e?.code === "resource-exhausted" || e?.message?.includes("Quota")) {
              quotaExceededRef.current = true;
              handleFirestoreQuotaExceeded();
            }
          });
        }
      },
      (err: any) => {
        if (err?.code === "resource-exhausted" || err?.message?.includes("Quota")) {
          quotaExceededRef.current = true;
          handleFirestoreQuotaExceeded();
          console.warn("Firestore room subscription paused (daily free quota reached).");
        } else {
          console.error("Error subscribing to focusRoom:", err);
        }
      }
    );
    return () => unsub();
  }, [currentUser?.id, currentGroup?.id]);

  // Sync current user's playback state to Firestore presence (debounced, deduplicated, loop-free)
  useEffect(() => {
    if (!currentUser?.id || currentUser.id === "guest" || !currentGroup?.id) return;

    // Deduplicate payload: only write if actual playback/track/sync parameters changed
    const payloadKey = `${currentUser.id}_${Boolean(isPlaying)}_${currentTrack?.id || "none"}_${listeningWith || "none"}_${Boolean(isBroadcasting)}`;
    if (payloadKey === lastPresenceWriteKeyRef.current) {
      return;
    }

    const cleanTrack = currentTrack
      ? {
          id: currentTrack.id,
          title: currentTrack.title || "",
          artist: currentTrack.artist || "",
          album: currentTrack.album || "",
          albumArt: currentTrack.albumArt || "",
          spotifyUrl: currentTrack.spotifyUrl || "",
          embedUri: currentTrack.embedUri || "",
          streamUrl: currentTrack.streamUrl || "",
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
      isBroadcasting: Boolean(isBroadcasting),
      lastUpdated: new Date().toISOString(),
    });

    // Update local in-memory presence immediately so local user sees their own state with zero latency
    setPresences((prev) => ({
      ...prev,
      [currentUser.id]: {
        ...presenceData,
        listenersCount: Object.values(prev).filter(
          (p) => p.listeningWithUserId === currentUser.id
        ).length,
      },
    }));

    if (quotaExceededRef.current) return;

    // Debounce writes to Firestore by 1500ms to avoid burst requests
    if (presenceDebounceTimerRef.current) {
      clearTimeout(presenceDebounceTimerRef.current);
    }

    presenceDebounceTimerRef.current = setTimeout(() => {
      lastPresenceWriteKeyRef.current = payloadKey;
      const presenceRef = doc(db, "groups", currentGroup.id, "presence", currentUser.id);

      setDoc(presenceRef, presenceData, { merge: true }).catch((err: any) => {
        if (err?.code === "resource-exhausted" || err?.message?.includes("Quota")) {
          quotaExceededRef.current = true;
          handleFirestoreQuotaExceeded();
          console.warn("Firestore write quota reached. Switched to local in-memory presence mode.");
        } else {
          console.error("Failed to update presence:", err);
        }
      });
    }, 1500);

    return () => {
      if (presenceDebounceTimerRef.current) {
        clearTimeout(presenceDebounceTimerRef.current);
      }
    };
  }, [
    currentUser?.id,
    currentGroup?.id,
    isPlaying,
    currentTrack?.id,
    listeningWith,
    isBroadcasting,
  ]);

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
    if (!audioRef.current) {
      setIsPlaying((prev) => !prev);
      return;
    }

    if (isPlaying) {
      audioRef.current.pause();
      setIsPlaying(false);
    } else {
      const stream = currentTrack?.streamUrl || CURATED_FOCUS_STATIONS[0].track.streamUrl;
      if (stream) {
        if (audioRef.current.src !== stream) {
          audioRef.current.src = stream;
        }
        audioRef.current
          .play()
          .then(() => {
            setIsPlaying(true);
          })
          .catch((err) => {
            console.warn("Direct stream play interrupted:", err);
            setIsPlaying(false);
          });
      } else {
        setIsPlaying(true);
      }
    }
  }, [isPlaying, currentTrack]);

  const changeTrack = useCallback((track: SpotifyTrack) => {
    setCurrentTrack(track);
    setListeningWith(null);

    const stream = track.streamUrl || CURATED_FOCUS_STATIONS[0].track.streamUrl;
    if (audioRef.current && stream) {
      if (audioRef.current.src !== stream) {
        audioRef.current.src = stream;
      }
      audioRef.current
        .play()
        .then(() => {
          setIsPlaying(true);
        })
        .catch((err) => {
          console.warn("Audio changeTrack play error:", err);
          setIsPlaying(false);
        });
    } else {
      setIsPlaying(true);
    }
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
      setListeningWith(targetUserId);

      const stream = presence.track.streamUrl || CURATED_FOCUS_STATIONS[0].track.streamUrl;
      if (audioRef.current && stream) {
        if (audioRef.current.src !== stream) {
          audioRef.current.src = stream;
        }
        audioRef.current
          .play()
          .then(() => {
            setIsPlaying(true);
          })
          .catch((err) => {
            console.warn("Audio tuneIn play error:", err);
            setIsPlaying(false);
          });
      } else {
        setIsPlaying(true);
      }

      addToast({
        title: `🎧 Tuned into ${targetUser?.displayName || "Squad Member"}`,
        description: `Now listening in sync to "${presence.track.title}" by ${presence.track.artist}.`,
        type: "success",
      });
    },
    [presences, allUsers, addToast]
  );

  const goSolo = useCallback(() => {
    setListeningWith(null);
    addToast({
      title: "🎧 Personal Listening Mode",
      description: "You left the synced stream and are now listening to your own focus beats.",
      type: "default",
    });
  }, [addToast]);

  const stopTuneIn = useCallback(() => {
    goSolo();
  }, [goSolo]);

  const toggleBroadcast = useCallback(() => {
    setIsBroadcasting((prev) => {
      const next = !prev;
      addToast({
        title: next ? "📢 Broadcasting Squad Jam!" : "Personal Stream Mode",
        description: next
          ? "Your focus track is broadcast to the squad. Teammates can join your vibe with 1 click."
          : "You stopped broadcasting to the squad.",
        type: next ? "success" : "default",
      });
      return next;
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
    const nextRoom = {
      ...focusRoom,
      isGroupListening: next,
      hostTrack: next ? currentTrack : focusRoom.hostTrack,
      hostUserId: next ? currentUser.id : null,
    };
    setFocusRoom(nextRoom);

    updateDoc(
      doc(db, "groups", currentGroup.id, "room", "focusRoom"),
      cleanFirestoreData({
        isGroupListening: next,
        hostTrack: next ? currentTrack : focusRoom.hostTrack,
        hostUserId: next ? currentUser.id : null,
      })
    ).catch(() => {});

    addToast({
      title: next ? "🎧 Squad Broadcast Active" : "Solo Lounge Mode",
      description: next
        ? "Everyone active in the Focus Lounge will now hear this track in sync."
        : "Members can now choose their own focus streams.",
      type: next ? "success" : "default",
    });
  }, [currentGroup?.id, focusRoom, currentTrack, currentUser.id, addToast]);

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
        streamUrl: CURATED_FOCUS_STATIONS[0].track.streamUrl,
        genre: "Custom Audio",
      };

      setCurrentTrack(customTrack);
      setListeningWith(null);

      if (audioRef.current && customTrack.streamUrl) {
        if (audioRef.current.src !== customTrack.streamUrl) {
          audioRef.current.src = customTrack.streamUrl;
        }
        audioRef.current
          .play()
          .then(() => setIsPlaying(true))
          .catch(() => setIsPlaying(false));
      } else {
        setIsPlaying(true);
      }

      addToast({
        title: "Loaded Spotify Audio",
        description: "Embedded player updated with your custom link.",
        type: "success",
      });

      return true;
    },
    [addToast]
  );

  const searchTracks = useCallback(async (query: string): Promise<SpotifyTrack[]> => {
    return searchSpotify(query);
  }, []);

  const setVolume = useCallback((val: number) => {
    const clamped = Math.max(0, Math.min(1, val));
    setVolumeState(clamped);
    if (audioRef.current) {
      audioRef.current.volume = clamped;
    }
    if (clamped > 0 && isMuted) {
      setIsMuted(false);
    }
  }, [isMuted]);

  const toggleMute = useCallback(() => {
    setIsMuted((prev) => {
      const next = !prev;
      if (audioRef.current) {
        audioRef.current.muted = next;
      }
      return next;
    });
  }, []);

  const credentials = getSpotifyCredentials();
  const isSpotifyConfigured = Boolean(
    credentials.clientId &&
    credentials.clientSecret &&
    !credentials.clientId.includes("your_spotify") &&
    !credentials.clientSecret.includes("your_spotify")
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
        isSpotifyConfigured,
        volume,
        isMuted,
        isBroadcasting,
        togglePlay,
        changeTrack,
        tuneInToMember,
        stopTuneIn,
        goSolo,
        toggleBroadcast,
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
        searchTracks,
        setVolume,
        toggleMute,
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
