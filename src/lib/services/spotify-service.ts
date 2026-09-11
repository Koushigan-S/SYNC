import { SpotifyTrack } from "@/types";

interface SpotifyTokenCache {
  token: string;
  expiresAt: number;
}

let cachedToken: SpotifyTokenCache | null = null;

export interface SpotifyCredentials {
  clientId: string;
  clientSecret: string;
}

const STORAGE_KEY_CLIENT_ID = "sync_spotify_client_id";
const STORAGE_KEY_CLIENT_SECRET = "sync_spotify_client_secret";

/**
 * Retrieve Spotify Client ID and Secret from localStorage or Next.js environment variables.
 */
export function getSpotifyCredentials(): SpotifyCredentials {
  if (typeof window === "undefined") {
    return {
      clientId: process.env.NEXT_PUBLIC_SPOTIFY_CLIENT_ID || process.env.SPOTIFY_CLIENT_ID || "",
      clientSecret: process.env.NEXT_PUBLIC_SPOTIFY_CLIENT_SECRET || process.env.SPOTIFY_CLIENT_SECRET || "",
    };
  }

  const storedId = localStorage.getItem(STORAGE_KEY_CLIENT_ID);
  const storedSecret = localStorage.getItem(STORAGE_KEY_CLIENT_SECRET);

  const clientId =
    storedId ||
    process.env.NEXT_PUBLIC_SPOTIFY_CLIENT_ID ||
    process.env.SPOTIFY_CLIENT_ID ||
    "";

  const clientSecret =
    storedSecret ||
    process.env.NEXT_PUBLIC_SPOTIFY_CLIENT_SECRET ||
    process.env.SPOTIFY_CLIENT_SECRET ||
    "";

  return {
    clientId: clientId.trim(),
    clientSecret: clientSecret.trim(),
  };
}

/**
 * Save Spotify credentials to localStorage.
 */
export function saveSpotifyCredentials(clientId: string, clientSecret: string) {
  if (typeof window === "undefined") return;
  if (clientId.trim()) {
    localStorage.setItem(STORAGE_KEY_CLIENT_ID, clientId.trim());
  } else {
    localStorage.removeItem(STORAGE_KEY_CLIENT_ID);
  }

  if (clientSecret.trim()) {
    localStorage.setItem(STORAGE_KEY_CLIENT_SECRET, clientSecret.trim());
  } else {
    localStorage.removeItem(STORAGE_KEY_CLIENT_SECRET);
  }
  // Clear cached token
  cachedToken = null;
}

/**
 * Request Client Credentials Access Token from Spotify Accounts API
 */
export async function getSpotifyAccessToken(): Promise<string | null> {
  const { clientId, clientSecret } = getSpotifyCredentials();

  // If no credentials or placeholder strings, return null
  if (
    !clientId ||
    !clientSecret ||
    clientId.includes("your_spotify") ||
    clientSecret.includes("your_spotify")
  ) {
    return null;
  }

  // Check cached token
  const now = Date.now();
  if (cachedToken && cachedToken.expiresAt > now + 60000) {
    return cachedToken.token;
  }

  try {
    const basicAuth = btoa(`${clientId}:${clientSecret}`);
    const res = await fetch("https://accounts.spotify.com/api/token", {
      method: "POST",
      headers: {
        "Content-Type": "application/x-www-form-urlencoded",
        Authorization: `Basic ${basicAuth}`,
      },
      body: new URLSearchParams({
        grant_type: "client_credentials",
      }),
    });

    if (!res.ok) {
      console.warn("Spotify token request failed with status:", res.status);
      return null;
    }

    const data = await res.json();
    if (data.access_token) {
      cachedToken = {
        token: data.access_token,
        expiresAt: now + (data.expires_in || 3600) * 1000,
      };
      return data.access_token;
    }
  } catch (err) {
    console.error("Error fetching Spotify access token:", err);
  }

  return null;
}

/**
 * Test if current credentials can successfully obtain a token
 */
export async function testSpotifyConnection(): Promise<{ success: boolean; message: string }> {
  const { clientId, clientSecret } = getSpotifyCredentials();

  if (!clientId || !clientSecret) {
    return {
      success: false,
      message: "Please enter both Client ID and Client Secret.",
    };
  }

  if (clientId.includes("your_spotify") || clientSecret.includes("your_spotify")) {
    return {
      success: false,
      message: "Please replace the placeholder values with your real Spotify developer keys.",
    };
  }

  const token = await getSpotifyAccessToken();
  if (token) {
    return {
      success: true,
      message: "Successfully connected to Spotify Web API!",
    };
  }

  return {
    success: false,
    message: "Invalid Client ID or Client Secret. Check your Spotify Developer Dashboard.",
  };
}

/**
 * Search Spotify for tracks and playlists by keyword query
 */
export async function searchSpotify(query: string): Promise<SpotifyTrack[]> {
  const trimmed = query.trim();
  if (!trimmed) return [];

  const token = await getSpotifyAccessToken();
  if (!token) {
    return [];
  }

  try {
    const res = await fetch(
      `https://api.spotify.com/v1/search?q=${encodeURIComponent(
        trimmed
      )}&type=track,playlist&limit=8`,
      {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      }
    );

    if (!res.ok) {
      console.warn("Spotify search API returned status:", res.status);
      return [];
    }

    const data = await res.json();
    const tracks: SpotifyTrack[] = [];

    // Parse tracks
    if (data.tracks?.items) {
      for (const item of data.tracks.items) {
        tracks.push({
          id: item.id,
          title: item.name,
          artist: item.artists?.map((a: { name: string }) => a.name).join(", ") || "Unknown Artist",
          album: item.album?.name || "Single",
          albumArt:
            item.album?.images?.[0]?.url ||
            "https://images.unsplash.com/photo-1511671782779-c97d3d27a1d4?w=300&auto=format&fit=crop&q=80",
          spotifyUrl: item.external_urls?.spotify || `https://open.spotify.com/track/${item.id}`,
          embedUri: `https://open.spotify.com/embed/track/${item.id}?utm_source=generator&theme=0`,
          durationMs: item.duration_ms,
          genre: "Spotify Track",
        });
      }
    }

    // Parse playlists
    if (data.playlists?.items) {
      for (const item of data.playlists.items) {
        if (!item || !item.id) continue;
        tracks.push({
          id: item.id,
          title: item.name,
          artist: item.owner?.display_name || "Spotify Playlist",
          album: "Playlist",
          albumArt:
            item.images?.[0]?.url ||
            "https://images.unsplash.com/photo-1511671782779-c97d3d27a1d4?w=300&auto=format&fit=crop&q=80",
          spotifyUrl: item.external_urls?.spotify || `https://open.spotify.com/playlist/${item.id}`,
          embedUri: `https://open.spotify.com/embed/playlist/${item.id}?utm_source=generator&theme=0`,
          genre: "Spotify Playlist",
        });
      }
    }

    return tracks;
  } catch (err) {
    console.error("Error searching Spotify:", err);
    return [];
  }
}
