import { useCallback, useEffect, useState } from 'react';

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

export function useRealtimeLeaderboard() {
  const [entries, setEntries] = useState<LeaderboardEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let active = true;
    let source: EventSource | null = null;
    let reconnectTimer: number | null = null;

    const fetchInitial = async () => {
      try {
        const res = await fetch('/api/leaderboard');
        if (!res.ok) throw new Error('Failed to load leaderboard');
        const data = await res.json();
        if (active && Array.isArray(data.entries)) {
          setEntries(data.entries);
          setError(null);
        }
      } catch {
        if (active) {
          setError('Unable to reach live leaderboard.');
        }
      } finally {
        if (active) setLoading(false);
      }
    };

    const connectStream = () => {
      if (!active || typeof EventSource === 'undefined') return;
      source = new EventSource('/api/leaderboard/stream');
      source.onmessage = (event) => {
        try {
          const parsed = JSON.parse(event.data);
          if (active && Array.isArray(parsed.entries)) {
            setEntries(parsed.entries);
            setLoading(false);
            setError(null);
          }
        } catch {
          // Ignore malformed stream keepalive
        }
      };
      source.onerror = () => {
        source?.close();
        source = null;
        if (active && reconnectTimer === null) {
          reconnectTimer = window.setTimeout(() => {
            reconnectTimer = null;
            connectStream();
          }, 3000);
        }
      };
    };

    fetchInitial();
    connectStream();

    return () => {
      active = false;
      source?.close();
      if (reconnectTimer !== null) window.clearTimeout(reconnectTimer);
    };
  }, []);

  const submitScore = useCallback(async (payload: SubmitScorePayload) => {
    const res = await fetch('/api/leaderboard', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    });
    const data = await res.json();
    if (!res.ok) {
      throw new Error(data.error || 'Could not save score');
    }
    if (Array.isArray(data.entries)) {
      setEntries(data.entries);
    }
    return data.entry as LeaderboardEntry;
  }, []);

  return { entries, loading, error, submitScore };
}
