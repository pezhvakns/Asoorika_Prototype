# Asoorika

An interactive 2D museum platformer inspired by ancient clay pottery motifs. Guide the ibex up the multi-floor vessel, jump over red hazards, and headbutt evil spirits to reach the sacred leaf at the summit.

## Features

- **Three Goat Speed Levels**: Easy (`1.0×`), Medium (`1.5×`), and Hard (`2.0×`)
- **Dual Controls**:
  - **Keyboard**: `Space` to jump, `E` to headbutt, `P` / `Esc` to pause, `R` to restart, `M` to mute
  - **Webcam (MediaPipe Hand Gestures)**: Left hand fist to jump, Right hand fist to headbutt (requires HTTPS & camera permission)
- **Synthesized Web Audio SFX**: Jump, spring pad, landing, headbutt, enemy KO, damage, and victory cues
- **Real-Time Leaderboard**: Uses live Server-Sent Events (`/api/leaderboard/stream`) when run with the Node/Express server, and automatically falls back to browser-persisted real-time multi-tab sync when hosted statically on GitHub Pages

## Publish to GitHub Pages (Get a Shareable Link)

This repository includes a ready-to-use GitHub Actions workflow (`.github/workflows/deploy.yml`) and subpath-safe relative asset paths:

1. Push this project to a GitHub repository (`main` or `master` branch).
2. In your GitHub repository, open **Settings → Pages**.
3. Under **Build and deployment → Source**, select **GitHub Actions**.
4. Wait ~1 minute for the **Deploy Asoorika to GitHub Pages** workflow under the **Actions** tab to finish.
5. Share your live playable HTTPS link (`https://<your-username>.github.io/<your-repo-name>/`) with anyone.

## Run Locally

```bash
npm install
npm run dev
```

Open `http://localhost:3000`.

## Production Build & Full-Stack Server

```bash
npm run build
NODE_ENV=production npm start
```
