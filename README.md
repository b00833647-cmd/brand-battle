# Brand Battle

A marketing analytics game built for ESSEC's Marketing Analytics course. Players compete against an escalating roster of AI rivals across 5 levels using concepts from **conjoint analysis, segmentation, positioning, and demand modeling**.

Each level teaches one concept from class and unlocks a new mechanic (market events, new rivals, taunts, chaos). The game includes a global leaderboard so students can compare their performance.

## Levels

| Level | Concept | Mechanic Unlock |
|-------|---------|-----------------|
| 1 | Conjoint analysis basics | Solo duel vs RoboCafé |
| 2 | Dynamic demand & market shocks | Random market events + AI taunts |
| 3 | Positioning & differentiation | + LuxBrand (premium rival) |
| 4 | Margin arithmetic & competition | + BudgetBean (race-to-bottom) |
| 5 | Multi-competitor modeling | + TrendCafé (boss) — profit doubled |

## Local Development

```bash
npm install
npm start
```

Visit http://localhost:3000

Without a `DATABASE_URL` env var, the leaderboard runs in-memory (scores reset on restart). For persistence, see deployment below.

## Deploy to Railway

1. **Push this repo to GitHub** (already done if you're reading this on github.com).
2. Go to [railway.app](https://railway.app) and click **New Project → Deploy from GitHub repo**.
3. Select this repository. Railway auto-detects Node.js and runs `npm start`.
4. **Add a Postgres database**: in your project, click **+ New → Database → Add PostgreSQL**.
5. Click the web service → **Variables** → reference `DATABASE_URL` from the Postgres service (Railway will auto-populate it).
6. Click **Deploy**. Railway gives you a public URL like `brand-battle-production.up.railway.app`.

That's it — students can now visit the URL and compete on the shared leaderboard.

## Tech Stack

- **Frontend**: vanilla HTML/CSS/JS (no build step, no framework)
- **Backend**: Node.js + Express
- **Database**: PostgreSQL (optional — falls back to in-memory)
- **Music**: Web Audio API chiptune synth (no external assets)

## API

| Method | Path | Description |
|--------|------|-------------|
| GET | `/api/scores` | Top 500 scores ordered by total profit desc |
| POST | `/api/scores` | Add a score: `{ "name": "Alex M.", "level": [180,220,320,380,580] }` |
| GET | `/health` | Health check |

## License

Built for ESSEC Marketing Analytics course. MIT-licensed for educational use.
