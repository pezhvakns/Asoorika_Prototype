import { useCallback, useEffect, useRef, useState } from 'react';

export interface LeaderboardEntry {
  id: string;
  name: string;
  score: number;
  clearTime: number;
  heartsRemaining: number;
  heightPercent: number;
  victory: boolean;
  controlMode: 'keyboard' | 'webcam';
  createdAt: string;
}

export interface SubmitScorePayload {
  name: string;
  score: number;
  clearTime: number;
  heartsRemaining: number;
  heightPercent: number;
  victory: boolean;
  controlMode: 'keyboard' | 'webcam';
}

const STORAGE_KEY = 'asoorika_leaderboard_v1';
const CHANNEL_NAME = 'asoorika_leaderboard_sync';

export const SEED_LEADERBOARD_ENTRIES: LeaderboardEntry[] = [
  {
    id: 'seed-1',
    name: 'Shahr-e Sukhteh',
    score: 2680,
    clearTime: 34.2,
    heartsRemaining: 3,
    heightPercent: 100,
    victory: true,
    controlMode: 'keyboard',
    createdAt: '2026-11-20T10:15:00.000Z',
  },
  {
    id: 'seed-2',
    name: 'Susa Curator',
    score: 2340,
    clearTime: 42.8,
    heartsRemaining: 2,
    heightPercent: 100,
    victory: true,
    controlMode: 'webcam',
    createdAt: '2026-11-21T14:30:00.000Z',
  },
  {
    id: 'seed-3',
    name: 'Elamite Ibex',
    score: 1990,
    clearTime: 51.5,
    heartsRemaining: 2,
    heightPercent: 100,
    victory: true,
    controlMode: 'keyboard',
    createdAt: '2026-11-22T09:05:00.000Z',
  },
  {
    id: 'seed-4',
    name: 'Gallery Visitor',
    score: 1420,
    clearTime: 38.0,
    heartsRemaining: 0,
    heightPercent: 78,
    victory: false,
    controlMode: 'webcam',
    createdAt: '2026-11-23T16:45:00.000Z',
  },
  {
    id: 'seed-5',
    name: 'Clay Potter',
    score: 980,
    clearTime: 29.4,
    heartsRemaining: 0,
    heightPercent: 56,
    victory: false,
    controlMode: 'keyboard',
    createdAt: '2026-11-24T08:20:00.000Z',
  },
];

export function sortAndTrimEntries(entries: LeaderboardEntry[]): LeaderboardEntry[] {
  return [...entries]
    .sort((a, b) => {
      if (b.score !== a.score) return b.score - a.score;
      if (a.victory !== b.victory) return a.victory ? -1 : 1;
      return a.clearTime - b.clearTime;
    })
    .slice(0, 15);
}

export function createLocalLeaderboardEntry(
  payload: SubmitScorePayload
): LeaderboardEntry {
  const trimmed = payload.name.trim();
  if (!trimmed || trimmed.length > 24) {
    throw new Error('Please enter a name between 1 and 24 characters.');
  }
  if (!Number.isFinite(payload.score) || payload.score < 0 || payload.score > 100000) {
    throw new Error('Invalid score value.');
  }

  return {
    id: `local-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`,
    name: trimmed.replace(/[<>]/g, ''),
    score: Math.round(payload.score),
    clearTime: Number.isFinite(payload.clearTime)
      ? Math.max(0, Math.round(payload.clearTime * 10) / 10)
      : 0,
    heartsRemaining: Number.isFinite(payload.heartsRemaining)
      ? Math.max(0, Math.min(3, Math.round(payload.heartsRemaining)))
      : 0,
    heightPercent: Number.isFinite(payload.heightPercent)
      ? Math.max(0, Math.min(100, Math.round(payload.heightPercent)))
      : 0,
    victory: Boolean(payload.victory),
    controlMode: payload.controlMode === 'webcam' ? 'webcam' : 'keyboard',
    createdAt: new Date().toISOString(),
  };
}

function readLocalLeaderboard(): LeaderboardEntry[] {
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    if (!raw) {
      window.localStorage.setItem(
        STORAGE_KEY,
        JSON.stringify(SEED_LEADERBOARD_ENTRIES)
      );
      return [...SEED_LEADERBOARD_ENTRIES];
    }
    const parsed = JSON.parse(raw);
    if (Array.isArray(parsed) && parsed.length > 0) {
      return sortAndTrimEntries(parsed);
    }
  } catch {
    // Ignore storage access errors in private iframes
  }
  return [...SEED_LEADERBOARD_ENTRIES];
}

function writeLocalLeaderboard(entries: LeaderboardEntry[]): void {
  try {
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(entries));
  } catch {
    // Ignore quota/storage errors
  }
}

function getApiBase(): string {
  const configured = (import.meta.env.VITE_API_BASE_URL || '').trim();
  return configured.replace(/\/+$/, '');
}

export function useRealtimeLeaderboard() {
  const [entries, setEntries] = useState<LeaderboardEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const modeRef = useRef<'api' | 'local'>('api');
  const channelRef = useRef<BroadcastChannel | null>(null);

  useEffect(() => {
    let active = true;
    let source: EventSource | null = null;
    let reconnectTimer: number | null = null;
    const apiBase = getApiBase();

    const activateLocalFallback = () => {
      modeRef.current = 'local';
      if (active) {
        setEntries(readLocalLeaderboard());
        setError(null);
        setLoading(false);
      }
      if (typeof BroadcastChannel !== 'undefined' && !channelRef.current) {
        const ch = new BroadcastChannel(CHANNEL_NAME);
        ch.onmessage = (ev) => {
          if (active && Array.isArray(ev.data?.entries)) {
            setEntries(ev.data.entries);
          }
        };
        channelRef.current = ch;
      }
    };

    const onStorage = (ev: StorageEvent) => {
      if (ev.key === STORAGE_KEY && modeRef.current === 'local' && active) {
        setEntries(readLocalLeaderboard());
      }
    };
    window.addEventListener('storage', onStorage);

    const connectStream = () => {
      if (!active || modeRef.current !== 'api' || typeof EventSource === 'undefined') {
        return;
      }
      source = new EventSource(`${apiBase}/api/leaderboard/stream`);
      source.onmessage = (event) => {
        try {
          const parsed = JSON.parse(event.data);
          if (active && Array.isArray(parsed.entries)) {
            setEntries(parsed.entries);
            setLoading(false);
            setError(null);
          }
        } catch {
          // Ignore malformed keepalive frames
        }
      };
      source.onerror = () => {
        source?.close();
        source = null;
        if (active && modeRef.current === 'api' && reconnectTimer === null) {
          reconnectTimer = window.setTimeout(() => {
            reconnectTimer = null;
            connectStream();
          }, 4000);
        }
      };
    };

    const fetchInitial = async () => {
      try {
        const res = await fetch(`${apiBase}/api/leaderboard`, {
          headers: { Accept: 'application/json' },
        });
        const contentType = res.headers.get('content-type') || '';
        if (!res.ok || !contentType.includes('application/json')) {
          // Static hosting (e.g. GitHub Pages) does not run the Express API
          activateLocalFallback();
          return;
        }
        const data = await res.json();
        if (active && Array.isArray(data.entries)) {
          modeRef.current = 'api';
          setEntries(data.entries);
          setError(null);
          setLoading(false);
          connectStream();
          return;
        }
        activateLocalFallback();
      } catch {
        activateLocalFallback();
      }
    };

    fetchInitial();

    return () => {
      active = false;
      source?.close();
      if (reconnectTimer !== null) window.clearTimeout(reconnectTimer);
      window.removeEventListener('storage', onStorage);
      channelRef.current?.close();
      channelRef.current = null;
    };
  }, []);

  const submitScore = useCallback(async (payload: SubmitScorePayload) => {
    const apiBase = getApiBase();
    if (modeRef.current === 'api') {
      try {
        const res = await fetch(`${apiBase}/api/leaderboard`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(payload),
        });
        const contentType = res.headers.get('content-type') || '';
        if (contentType.includes('application/json')) {
          const data = await res.json();
          if (!res.ok) {
            throw new Error(data.error || 'Could not save score');
          }
          if (Array.isArray(data.entries)) {
            setEntries(data.entries);
          }
          return data.entry as LeaderboardEntry;
        }
      } catch (err) {
        if (err instanceof Error && !err.message.includes('fetch')) {
          throw err;
        }
      }
      modeRef.current = 'local';
    }

    // Local real-time fallback for GitHub Pages / static deployments
    const entry = createLocalLeaderboardEntry(payload);
    const updated = sortAndTrimEntries([...readLocalLeaderboard(), entry]);
    writeLocalLeaderboard(updated);
    setEntries(updated);
    channelRef.current?.postMessage({ entries: updated });
    return entry;
  }, []);

  return { entries, loading, error, submitScore };
}
