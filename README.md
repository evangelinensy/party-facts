# Party Facts

Real-time multiplayer party game. Players join in groups and guess which on-stage player submitted each unexpected fact.

## Running Locally

```bash
# 1. Install dependencies
npm install

# 2. Set up environment
cp .env.local.example .env.local
# Edit .env.local and set JWT_SECRET to any random 32+ character string

# 3. Start dev server
npm run dev
```

Open http://localhost:3000 on multiple devices on the same wifi.

## How to Play

1. **Host** opens the app, clicks "Host Game", enters their name → gets a game code
2. **Players** open the app on their phones, click "Join Game", enter the code, pick a group (A/B/C/D), enter their name and an unexpected fact about themselves
3. Host clicks "Start Game" (need at least 2 different groups)
4. Groups take turns on stage — one fact shown at a time, audience guesses which on-stage person it belongs to
5. Points for correct guesses; auto-reveals when everyone has guessed
6. Leaderboard shown at the end

## Deploying to Railway

1. Push this repo to GitHub
2. Go to [Railway](https://railway.app) → New Project → Deploy from GitHub repo
3. Add environment variable: `JWT_SECRET` = any random 32+ character string
4. Deploy — Railway auto-detects Next.js and runs `npm run build && npm run start`

**Important:** Railway must run as a single instance (not scaled horizontally) since game state is in-memory. In Railway settings, ensure replicas = 1.

## Architecture

- **No database** — all state lives in a server-side `Map` for the life of the process
- **No external services** — just Next.js + JWT
- **Polling** — clients poll `/api/games/[code]` every 2 seconds
- **Auth** — host and player JWTs stored in localStorage
