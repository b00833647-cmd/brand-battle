/**
 * Brand Battle — Express server + leaderboard API
 *
 * Endpoints:
 *   GET  /api/scores  → top 500 scores ordered by total desc
 *   POST /api/scores  → { name, level: [l1,l2,l3,l4,l5] } adds a score, returns updated list
 *   GET  /health      → simple health check
 *   GET  /            → serves public/index.html (the game)
 *
 * Storage:
 *   - If DATABASE_URL is set (Railway, Heroku, etc.) → uses Postgres
 *   - Otherwise → in-memory (resets on restart; fine for local dev)
 */

const express = require('express');
const path = require('path');
const { Pool } = require('pg');

const app = express();
const PORT = process.env.PORT || 3000;

app.use(express.json({ limit: '32kb' }));
app.use(express.static(path.join(__dirname, 'public'), { maxAge: '1h' }));

/* ============ STORAGE ============ */
let pool = null;
const memoryScores = []; // fallback when no DATABASE_URL

if (process.env.DATABASE_URL) {
  pool = new Pool({
    connectionString: process.env.DATABASE_URL,
    ssl: process.env.DATABASE_URL.includes('localhost') ? false : { rejectUnauthorized: false }
  });

  (async () => {
    try {
      await pool.query(`
        CREATE TABLE IF NOT EXISTS scores (
          id SERIAL PRIMARY KEY,
          name VARCHAR(50) NOT NULL,
          level1 INTEGER NOT NULL DEFAULT 0,
          level2 INTEGER NOT NULL DEFAULT 0,
          level3 INTEGER NOT NULL DEFAULT 0,
          level4 INTEGER NOT NULL DEFAULT 0,
          level5 INTEGER NOT NULL DEFAULT 0,
          total INTEGER NOT NULL DEFAULT 0,
          created_at TIMESTAMPTZ DEFAULT NOW()
        );
      `);
      await pool.query('CREATE INDEX IF NOT EXISTS idx_scores_total ON scores(total DESC);');
      console.log('[db] Postgres schema ready');
    } catch (err) {
      console.error('[db] init failed:', err.message);
    }
  })();
} else {
  console.log('[db] No DATABASE_URL — using in-memory storage. Scores will reset on restart.');
}

/* ============ HELPERS ============ */
function rowToScore(r) {
  return {
    name: r.name,
    level: [r.level1, r.level2, r.level3, r.level4, r.level5]
  };
}

function sanitizeName(raw) {
  const s = String(raw || '').trim().slice(0, 50);
  // Strip control chars
  return s.replace(/[\x00-\x1F\x7F]/g, '') || 'Player';
}

function sanitizeLevels(arr) {
  if (!Array.isArray(arr) || arr.length !== 5) return null;
  return arr.map(v => {
    const n = Math.round(Number(v) || 0);
    return Math.max(0, Math.min(99999, n));
  });
}

async function fetchAllScores() {
  if (pool) {
    const { rows } = await pool.query(
      'SELECT name, level1, level2, level3, level4, level5, total FROM scores ORDER BY total DESC LIMIT 500'
    );
    return rows.map(rowToScore);
  }
  return [...memoryScores].sort((a, b) =>
    (b.level.reduce((x,y)=>x+y,0)) - (a.level.reduce((x,y)=>x+y,0))
  ).slice(0, 500);
}

/* ============ ROUTES ============ */
app.get('/health', (req, res) => {
  res.json({ ok: true, db: !!pool });
});

app.get('/api/scores', async (req, res) => {
  try {
    const scores = await fetchAllScores();
    res.json(scores);
  } catch (err) {
    console.error('[GET /api/scores]', err.message);
    res.status(500).json({ error: 'Failed to load scores' });
  }
});

app.post('/api/scores', async (req, res) => {
  try {
    const name = sanitizeName(req.body?.name);
    const levels = sanitizeLevels(req.body?.level);
    if (!levels) return res.status(400).json({ error: 'level must be an array of 5 numbers' });
    const total = levels.reduce((a, b) => a + b, 0);

    if (pool) {
      await pool.query(
        'INSERT INTO scores (name, level1, level2, level3, level4, level5, total) VALUES ($1, $2, $3, $4, $5, $6, $7)',
        [name, ...levels, total]
      );
    } else {
      memoryScores.push({ name, level: levels });
    }

    const scores = await fetchAllScores();
    res.json(scores);
  } catch (err) {
    console.error('[POST /api/scores]', err.message);
    res.status(500).json({ error: 'Failed to save score' });
  }
});

// Root → game
app.get('/', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

app.listen(PORT, () => {
  console.log(`[brand-battle] listening on :${PORT}`);
});
