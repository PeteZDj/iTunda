import 'dotenv/config';
import express from 'express';
import cors from 'cors';
import pg from 'pg';
import crypto from 'crypto';
import { OAuth2Client } from 'google-auth-library';

const { Pool } = pg;
const PORT = process.env.PORT || 3019;
const GOOGLE_CLIENT_ID = '355354020888-nmt0qlr55adgprvhaht50oamstv637qs.apps.googleusercontent.com';
const pool = new Pool({ connectionString: process.env.DATABASE_URL });
const gClient = new OAuth2Client(GOOGLE_CLIENT_ID);
const app = express();

app.use(cors({ origin: true, credentials: true }));
app.use(express.json({ limit: '1mb' }));

const q = (sql, params) => pool.query(sql, params);
const wrap = fn => (req, res, next) => fn(req, res).catch(next);

async function initDb() {
  await q(`
    CREATE TABLE IF NOT EXISTS users (
      id         TEXT PRIMARY KEY DEFAULT gen_random_uuid()::TEXT,
      email      TEXT UNIQUE NOT NULL,
      name       TEXT,
      avatar     TEXT,
      google_sub TEXT UNIQUE,
      created_at TIMESTAMPTZ DEFAULT NOW()
    )
  `);
  await q(`
    CREATE TABLE IF NOT EXISTS sessions (
      token      TEXT PRIMARY KEY,
      user_id    TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
      expires_at TIMESTAMPTZ NOT NULL,
      created_at TIMESTAMPTZ DEFAULT NOW()
    )
  `);
  console.log('itunda-auth DB ready');
}

async function getSessionUser(req) {
  const auth = req.headers.authorization || '';
  const token = auth.replace('Bearer ', '').trim();
  if (!token) return null;
  const { rows } = await q(
    `SELECT u.* FROM sessions s JOIN users u ON s.user_id = u.id
     WHERE s.token = $1 AND s.expires_at > NOW()`,
    [token]
  );
  return rows[0] || null;
}

async function createSession(userId) {
  const token = crypto.randomBytes(32).toString('hex');
  await q(
    `INSERT INTO sessions (token, user_id, expires_at) VALUES ($1, $2, NOW() + INTERVAL '30 days')`,
    [token, userId]
  );
  return token;
}

// POST /gauth/google
app.post('/gauth/google', wrap(async (req, res) => {
  const { credential } = req.body || {};
  if (!credential) return res.status(400).json({ error: 'credential required' });

  const ticket = await gClient.verifyIdToken({ idToken: credential, audience: GOOGLE_CLIENT_ID });
  const { sub, email, name, picture } = ticket.getPayload();

  const { rows } = await q(
    `INSERT INTO users (email, name, avatar, google_sub)
     VALUES ($1, $2, $3, $4)
     ON CONFLICT (google_sub) DO UPDATE SET name=EXCLUDED.name, avatar=EXCLUDED.avatar
     RETURNING *`,
    [email, name, picture || null, sub]
  );
  const user = rows[0];
  const token = await createSession(user.id);
  res.json({ token, user: { id: user.id, email: user.email, name: user.name, avatar: user.avatar } });
}));

// GET /gauth/me
app.get('/gauth/me', wrap(async (req, res) => {
  const user = await getSessionUser(req);
  res.json({ user: user ? { id: user.id, email: user.email, name: user.name, avatar: user.avatar } : null });
}));

// POST /gauth/logout
app.post('/gauth/logout', wrap(async (req, res) => {
  const auth = req.headers.authorization || '';
  const token = auth.replace('Bearer ', '').trim();
  if (token) await q('DELETE FROM sessions WHERE token = $1', [token]);
  res.json({ ok: true });
}));

app.use((err, _req, res, _next) => {
  console.error(err);
  res.status(500).json({ error: 'Internal server error' });
});

initDb().then(() => {
  app.listen(PORT, () => console.log(`itunda-auth :${PORT}`));
}).catch(err => { console.error('DB init failed', err); process.exit(1); });
