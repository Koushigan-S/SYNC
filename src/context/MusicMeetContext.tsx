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
  SongTrack,
  UserMusicPresence,
  FocusRoom,
  FocusStation,
} from "@/types";
import { CURATED_FOCUS_STATIONS, DEFAULT_MEET_URL, STANDBY_TRACK } from "@/lib/demo-data";
import { XP_REWARDS } from "@/lib/constants";
import { useSync } from "@/context/SyncContext";
import { db, handleFirestoreQuotaExceeded } from "@/lib/firebase/config";
import {
  collection,
  doc,
  onSnapshot,
  setDoc,
  updateDoc,
} from "firebase/firestore";
import { cleanFirestoreData } from "@/lib/firebase/utils";
import {
  addSongToLibrary,
  deleteSongFromLibrary,
} from "@/lib/services/music-service";

interface MusicMeetContextType {
  currentTrack: SongTrack;
  isPlaying: boolean;
  presences: Record<string, UserMusicPresence>;
  listeningWith: string | null;
  focusRoom: FocusRoom;
  stations: FocusStation[];
  squadSongs: SongTrack[];
  allAvailableTracks: SongTrack[];
  isDockExpanded: boolean;
  userMicEnabled: boolean;
  userVideoEnabled: boolean;
  volume: number;
  isMuted: boolean;
  isBroadcasting: boolean;
  currentTime: number;
  duration: number;

  // Actions
  togglePlay: () => void;
  changeTrack: (track: SongTrack) => void;
  seekTo: (seconds: number) => void;
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
  addNewSong: (song: Omit<SongTrack, "id" | "createdAt">) => Promise<SongTrack>;
  removeSong: (songId: string) => Promise<void>;
  setVolume: (vol: number) => void;
  toggleMute: () => void;
  playNextTrack: () => void;
  playPrevTrack: () => void;
}

const MusicMeetContext = createContext<MusicMeetContextType | null>(null);

const DEFAULT_FOCUS_ROOM: FocusRoom = {
  meetUrl: DEFAULT_MEET_URL,
  activeMemberIds: [],
  isGroupListening: false,
  hostTrack: null,
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

  const [currentTrack, setCurrentTrack] = useState<SongTrack>(STANDBY_TRACK);
  // Default to PAUSED on initial web load as per user requirement
  const [isPlaying, setIsPlaying] = useState<boolean>(false);
  const [volume, setVolumeState] = useState<number>(0.8);
  const [isMuted, setIsMuted] = useState<boolean>(false);
  const [isBroadcasting, setIsBroadcasting] = useState<boolean>(false);
  const [currentTime, setCurrentTime] = useState<number>(0);
  const [duration, setDuration] = useState<number>(0);
  const [presences, setPresences] = useState<Record<string, UserMusicPresence>>({});
  const [listeningWith, setListeningWith] = useState<string | null>(null);
  const [focusRoom, setFocusRoom] = useState<FocusRoom>(DEFAULT_FOCUS_ROOM);
  const [stations] = useState<FocusStation[]>(CURATED_FOCUS_STATIONS);
  const [squadSongs, setSquadSongs] = useState<SongTrack[]>([]);
  const [isDockExpanded, setIsDockExpanded] = useState<boolean>(false);
  const [userMicEnabled, setUserMicEnabled] = useState<boolean>(false);
  const [userVideoEnabled, setUserVideoEnabled] = useState<boolean>(true);

  // Persistent HTML5 audio player for instant audible focus sound
  const audioRef = useRef<HTMLAudioElement | null>(null);

  // Refs to avoid stale closures in Firestore real-time listeners
  const currentTrackRef = useRef<SongTrack>(currentTrack);
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

  // Combined track collection (squad custom songs are primary!)
  const allAvailableTracks: SongTrack[] = squadSongs.length > 0
    ? squadSongs
    : currentTrack.id !== STANDBY_TRACK.id && currentTrack.audioUrl
    ? [currentTrack]
    : [];

  // Initialize native HTML5 Audio element with event listeners
  useEffect(() => {
    if (typeof window === "undefined") return;

    const audio = new Audio();
    audio.preload = "auto";
    audio.loop = true;
    audio.volume = 0.8;
    audioRef.current = audio;

    const onTimeUpdate = () => {
      setCurrentTime(audio.currentTime || 0);
    };

    const onLoadedMetadata = () => {
      if (audio.duration && isFinite(audio.duration)) {
        setDuration(audio.duration);
      }
    };

    const onPlay = () => setIsPlaying(true);
    const onPause = () => setIsPlaying(false);

    const onEnded = () => {
      // Loop or play next
      audio.currentTime = 0;
      audio.play().catch(() => {});
    };

    audio.addEventListener("timeupdate", onTimeUpdate);
    audio.addEventListener("loadedmetadata", onLoadedMetadata);
    audio.addEventListener("durationchange", onLoadedMetadata);
    audio.addEventListener("play", onPlay);
    audio.addEventListener("pause", onPause);
    audio.addEventListener("ended", onEnded);

    return () => {
      audio.removeEventListener("timeupdate", onTimeUpdate);
      audio.removeEventListener("loadedmetadata", onLoadedMetadata);
      audio.removeEventListener("durationchange", onLoadedMetadata);
      audio.removeEventListener("play", onPlay);
      audio.removeEventListener("pause", onPause);
      audio.removeEventListener("ended", onEnded);
      audio.pause();
      audio.src = "";
      audioRef.current = null;
    };
  }, []);

  // Real-time listener for squad shared songs in Firestore
  useEffect(() => {
    if (!currentGroup?.id || currentGroup.id === "default-squad") return;

    const songsColl = collection(db, "groups", currentGroup.id, "songs");
    const unsub = onSnapshot(
      songsColl,
      (snap) => {
        const loaded: SongTrack[] = [];
        snap.forEach((d) => {
          loaded.push({ id: d.id, ...d.data() } as SongTrack);
        });
        setSquadSongs(loaded);
        if (
          loaded.length > 0 &&
          (!currentTrackRef.current ||
            currentTrackRef.current.id === STANDBY_TRACK.id ||
            !currentTrackRef.current.audioUrl)
        ) {
          setCurrentTrack(loaded[0]);
        }
      },
      (err: any) => {
        if (err?.code === "resource-exhausted" || err?.message?.includes("Quota")) {
          quotaExceededRef.current = true;
          handleFirestoreQuotaExceeded();
        } else {
          console.error("Error loading squad songs:", err);
        }
      }
    );

    return () => unsub();
  }, [currentGroup?.id]);

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

        // Compute listenersCount dynamically
        Object.keys(presMap).forEach((uid) => {
          presMap[uid].listenersCount = Object.values(presMap).filter(
            (p) => p.listeningWithUserId === uid
          ).length;
        });

        setPresences(presMap);

        // Reactive follow: if we are tuned into a teammate, sync track and playback time!
        const targetHostId = listeningWithRef.current;
        if (targetHostId && presMap[targetHostId]?.track) {
          const hostPresence = presMap[targetHostId];
          const hostTrack = hostPresence.track;
          if (hostTrack) {
            const currentAudio = audioRef.current;
            const targetAudioUrl = hostTrack.audioUrl || hostTrack.streamUrl;

            // Follow track change
            if (hostTrack.id !== currentTrackRef.current?.id) {
              setCurrentTrack(hostTrack);
              if (currentAudio && targetAudioUrl) {
                currentAudio.src = targetAudioUrl;
                if (hostPresence.currentTime) {
                  currentAudio.currentTime = hostPresence.currentTime;
                }
                if (hostPresence.isPlaying) {
                  currentAudio.play().catch(() => {});
                }
              }
            } else if (currentAudio && hostPresence.currentTime !== undefined) {
              // Drift correction: if drift > 3.5 seconds, resync time position
              const drift = Math.abs(currentAudio.currentTime - hostPresence.currentTime);
              if (drift > 3.5) {
                currentAudio.currentTime = hostPresence.currentTime;
              }
              if (hostPresence.isPlaying && currentAudio.paused) {
                currentAudio.play().catch(() => {});
              } else if (!hostPresence.isPlaying && !currentAudio.paused) {
                currentAudio.pause();
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

  // Subscribe to real-time Focus Room state in Firestore
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
              const targetUrl = roomData.hostTrack.audioUrl || roomData.hostTrack.streamUrl;
              if (audioRef.current && targetUrl) {
                if (audioRef.current.src !== targetUrl) {
                  audioRef.current.src = targetUrl;
                  audioRef.current.play().catch(() => {});
                }
              }
            }
          }
        } else if (!roomInitAttemptedRef.current && !quotaExceededRef.current) {
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
        } else {
          console.error("Error subscribing to focusRoom:", err);
        }
      }
    );
    return () => unsub();
  }, [currentUser?.id, currentGroup?.id]);

  // Sync current user's playback state to Firestore presence (debounced & deduplicated)
  useEffect(() => {
    if (!currentUser?.id || currentUser.id === "guest" || !currentGroup?.id) return;

    const payloadKey = `${currentUser.id}_${Boolean(isPlaying)}_${currentTrack?.id || "none"}_${listeningWith || "none"}_${Boolean(isBroadcasting)}`;
    if (payloadKey === lastPresenceWriteKeyRef.current) {
      return;
    }

    const cleanTrack: SongTrack | null = currentTrack
      ? {
          id: currentTrack.id,
          title: currentTrack.title || "Focus Beats",
          artist: currentTrack.artist || "Squad Music",
          album: currentTrack.album || "Squad Library",
          albumArt: currentTrack.albumArt || "",
          audioUrl: currentTrack.audioUrl || currentTrack.streamUrl || "",
          streamUrl: currentTrack.streamUrl || currentTrack.audioUrl || "",
          duration: currentTrack.duration || 180,
          durationMs: currentTrack.durationMs || (currentTrack.duration ? currentTrack.duration * 1000 : 180000),
          genre: currentTrack.genre || "Focus",
          addedBy: currentTrack.addedBy || undefined,
        }
      : null;

    const currentSecs = Math.round(audioRef.current?.currentTime || 0);
    const totalSecs = Math.round(audioRef.current?.duration || currentTrack?.duration || 180);

    const presenceData: UserMusicPresence = cleanFirestoreData({
      userId: currentUser.id,
      isPlaying: Boolean(isPlaying),
      track: cleanTrack,
      progressMs: currentSecs * 1000,
      currentTime: currentSecs,
      duration: totalSecs,
      listeningWithUserId: listeningWith ? listeningWith : null,
      isBroadcasting: Boolean(isBroadcasting),
      lastUpdated: new Date().toISOString(),
    });

    // Update local in-memory presence immediately with zero latency
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
        } else {
          console.error("Failed to update presence:", err);
        }
      });
    }, 1200);

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
      let targetTrack = currentTrack;
      if (
        (!targetTrack || !targetTrack.audioUrl || targetTrack.id === STANDBY_TRACK.id) &&
        squadSongs.length > 0
      ) {
        targetTrack = squadSongs[0];
        setCurrentTrack(targetTrack);
      }

      const url = targetTrack?.audioUrl || targetTrack?.streamUrl;
      if (url) {
        if (audioRef.current.src !== url) {
          audioRef.current.src = url;
        }
        audioRef.current
          .play()
          .then(() => setIsPlaying(true))
          .catch((err) => {
            console.warn("Audio play interrupted:", err);
            setIsPlaying(false);
          });
      } else {
        addToast({
          title: "No song selected",
          description: "Click '+ Add Song' to add your tracks to the squad library.",
          type: "default",
        });
      }
    }
  }, [isPlaying, currentTrack, squadSongs, addToast]);

  const changeTrack = useCallback((track: SongTrack) => {
    setCurrentTrack(track);
    setListeningWith(null);

    const url = track.audioUrl || track.streamUrl;
    if (audioRef.current && url) {
      if (audioRef.current.src !== url) {
        audioRef.current.src = url;
      }
      audioRef.current.currentTime = 0;
      audioRef.current
        .play()
        .then(() => setIsPlaying(true))
        .catch((err) => {
          console.warn("Audio changeTrack play error:", err);
          setIsPlaying(false);
        });
    } else {
      setIsPlaying(true);
    }
  }, []);

  const seekTo = useCallback((seconds: number) => {
    if (audioRef.current && isFinite(seconds)) {
      audioRef.current.currentTime = seconds;
      setCurrentTime(seconds);
    }
  }, []);

  const tuneInToMember = useCallback(
    (targetUserId: string) => {
      const presence = presences[targetUserId];
      const targetUser = allUsers[targetUserId];
      if (!presence || !presence.track) {
        addToast({
          title: "Member is not currently playing",
          description: "No active song detected for this squad member.",
          type: "error",
        });
        return;
      }

      setCurrentTrack(presence.track);
      setListeningWith(targetUserId);

      const url = presence.track.audioUrl || presence.track.streamUrl;
      if (audioRef.current && url) {
        if (audioRef.current.src !== url) {
          audioRef.current.src = url;
        }
        if (presence.currentTime) {
          audioRef.current.currentTime = presence.currentTime;
        }
        audioRef.current
          .play()
          .then(() => setIsPlaying(true))
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

      const customTrack: SongTrack = {
        id: "custom-" + Date.now(),
        title: "Custom Squad Stream",
        artist: "Direct Audio",
        album: "Squad Session",
        albumArt:
          "https://images.unsplash.com/photo-1511671782779-c97d3d27a1d4?w=400&auto=format&fit=crop&q=80",
        audioUrl: trimmed,
        streamUrl: trimmed,
        genre: "Custom Audio",
        duration: 180,
        addedBy: {
          id: currentUser.id,
          name: currentUser.displayName,
          photoURL: currentUser.photoURL,
        },
      };

      changeTrack(customTrack);

      addToast({
        title: "Loaded Audio Stream",
        description: "Direct audio stream is now playing.",
        type: "success",
      });

      return true;
    },
    [changeTrack, currentUser, addToast]
  );

  const addNewSong = useCallback(
    async (songData: Omit<SongTrack, "id" | "createdAt">): Promise<SongTrack> => {
      if (!currentGroup?.id) {
        throw new Error("No active squad found.");
      }
      const newSong = await addSongToLibrary(currentGroup.id, songData);
      setSquadSongs((prev) => [newSong, ...prev]);
      changeTrack(newSong);
      return newSong;
    },
    [currentGroup?.id, changeTrack]
  );

  const removeSong = useCallback(
    async (songId: string): Promise<void> => {
      if (!currentGroup?.id) return;
      await deleteSongFromLibrary(currentGroup.id, songId);
      setSquadSongs((prev) => prev.filter((s) => s.id !== songId));
      addToast({
        title: "Song Removed",
        description: "The track has been removed from the squad library.",
        type: "default",
      });
    },
    [currentGroup?.id, addToast]
  );

  const playNextTrack = useCallback(() => {
    const list = allAvailableTracks;
    if (list.length === 0) return;
    const currentIndex = list.findIndex((t) => t.id === currentTrack.id);
    const nextIndex = (currentIndex + 1) % list.length;
    changeTrack(list[nextIndex]);
  }, [allAvailableTracks, currentTrack.id, changeTrack]);

  const playPrevTrack = useCallback(() => {
    const list = allAvailableTracks;
    if (list.length === 0) return;
    const currentIndex = list.findIndex((t) => t.id === currentTrack.id);
    const prevIndex = (currentIndex - 1 + list.length) % list.length;
    changeTrack(list[prevIndex]);
  }, [allAvailableTracks, currentTrack.id, changeTrack]);

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

  return (
    <MusicMeetContext.Provider
      value={{
        currentTrack,
        isPlaying,
        presences,
        listeningWith,
        focusRoom,
        stations,
        squadSongs,
        allAvailableTracks,
        isDockExpanded,
        userMicEnabled,
        userVideoEnabled,
        volume,
        isMuted,
        isBroadcasting,
        currentTime,
        duration,
        togglePlay,
        changeTrack,
        seekTo,
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
        addNewSong,
        removeSong,
        setVolume,
        toggleMute,
        playNextTrack,
        playPrevTrack,
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
