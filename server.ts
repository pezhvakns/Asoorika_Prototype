import express from 'express';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

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

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const DATA_DIR = path.resolve(__dirname, 'data');
const DATA_FILE = path.join(DATA_DIR, 'leaderboard.json');

const SEED_ENTRIES: LeaderboardEntry[] = [
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

function loadLeaderboard(): LeaderboardEntry[] {
  try {
    if (!fs.existsSync(DATA_FILE)) {
      fs.mkdirSync(DATA_DIR, { recursive: true });
      fs.writeFileSync(DATA_FILE, JSON.stringify(SEED_ENTRIES, null, 2), 'utf8');
      return [...SEED_ENTRIES];
    }
    const raw = fs.readFileSync(DATA_FILE, 'utf8');
    const parsed = JSON.parse(raw);
    if (Array.isArray(parsed)) {
      return parsed.slice(0, 20);
    }
  } catch {
    // Fallback to seed data if file is unreadable
  }
  return [...SEED_ENTRIES];
}

function saveLeaderboard(entries: LeaderboardEntry[]): void {
  try {
    fs.mkdirSync(DATA_DIR, { recursive: true });
    fs.writeFileSync(DATA_FILE, JSON.stringify(entries, null, 2), 'utf8');
  } catch {
    // Keep running in memory if filesystem is read-only
  }
}

let leaderboard: LeaderboardEntry[] = loadLeaderboard();
const sseClients = new Set<express.Response>();

function sortAndTrim(entries: LeaderboardEntry[]): LeaderboardEntry[] {
  return [...entries]
    .sort((a, b) => {
      if (b.score !== a.score) return b.score - a.score;
      if (a.victory !== b.victory) return a.victory ? -1 : 1;
      return a.clearTime - b.clearTime;
    })
    .slice(0, 15);
}

function broadcastLeaderboard(): void {
  const payload = `data: ${JSON.stringify({ entries: leaderboard })}\n\n`;
  for (const res of sseClients) {
    try {
      res.write(payload);
    } catch {
      sseClients.delete(res);
    }
  }
}

async function createServer() {
  const app = express();
  app.use(express.json({ limit: '16kb' }));

  app.get('/api/leaderboard', (_req, res) => {
    res.json({ entries: leaderboard });
  });

  app.get('/api/leaderboard/stream', (req, res) => {
    res.setHeader('Content-Type', 'text/event-stream');
    res.setHeader('Cache-Control', 'no-cache, no-transform');
    res.setHeader('Connection', 'keep-alive');
    res.flushHeaders?.();
    res.write(`data: ${JSON.stringify({ entries: leaderboard })}\n\n`);
    sseClients.add(res);

    const heartbeat = setInterval(() => {
      try {
        res.write(': keepalive\n\n');
      } catch {
        clearInterval(heartbeat);
        sseClients.delete(res);
      }
    }, 20000);

    req.on('close', () => {
      clearInterval(heartbeat);
      sseClients.delete(res);
    });
  });

  app.post('/api/leaderboard', (req, res) => {
    const body = req.body ?? {};
    const rawName = typeof body.name === 'string' ? body.name.trim() : '';
    if (!rawName || rawName.length > 24) {
      res.status(400).json({ error: 'Please enter a name between 1 and 24 characters.' });
      return;
    }

    const score = Number(body.score);
    const clearTime = Number(body.clearTime);
    const heartsRemaining = Number(body.heartsRemaining);
    const heightPercent = Number(body.heightPercent);
    const victory = Boolean(body.victory);
    const controlMode = body.controlMode === 'webcam' ? 'webcam' : 'keyboard';

    if (!Number.isFinite(score) || score < 0 || score > 100000) {
      res.status(400).json({ error: 'Invalid score value.' });
      return;
    }

    const entry: LeaderboardEntry = {
      id: `run-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`,
      name: rawName.replace(/[<>]/g, ''),
      score: Math.round(score),
      clearTime: Number.isFinite(clearTime) ? Math.max(0, Math.round(clearTime * 10) / 10) : 0,
      heartsRemaining: Number.isFinite(heartsRemaining)
        ? Math.max(0, Math.min(3, Math.round(heartsRemaining)))
        : 0,
      heightPercent: Number.isFinite(heightPercent)
        ? Math.max(0, Math.min(100, Math.round(heightPercent)))
        : 0,
      victory,
      controlMode,
      createdAt: new Date().toISOString(),
    };

    leaderboard = sortAndTrim([...leaderboard, entry]);
    saveLeaderboard(leaderboard);
    broadcastLeaderboard();

    res.status(201).json({ entry, entries: leaderboard });
  });

  const isProd = process.env.NODE_ENV === 'production';
  const distDir = path.resolve(__dirname, 'dist');

  if (!isProd) {
    const { createServer: createViteServer } = await import('vite');
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    app.use(express.static(distDir));
    app.get('*', (_req, res) => {
      res.sendFile(path.join(distDir, 'index.html'));
    });
  }

  const PORT = Number(process.env.PORT) || 3000;
  app.listen(PORT, '0.0.0.0', () => {
    console.log(`Asoorika museum server listening on http://localhost:${PORT}`);
  });
}

createServer().catch((err) => {
  console.error('Failed to start Asoorika server:', err);
  process.exit(1);
});
