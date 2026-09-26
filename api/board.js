// Halcyon Isle shared leaderboard: one small serverless function on Vercel.
// Storage: an Upstash Redis database added from Vercel's Marketplace (free tier is plenty).
// Optional: set BOARD_KEY in Vercel's environment variables to require a "crew code".
const crypto = require('crypto');

const REDIS_URL = process.env.KV_REST_API_URL || process.env.UPSTASH_REDIS_REST_URL;
const REDIS_TOKEN = process.env.KV_REST_API_TOKEN || process.env.UPSTASH_REDIS_REST_TOKEN;

async function redis(command) {
  const r = await fetch(REDIS_URL, {
    method: 'POST',
    headers: { Authorization: 'Bearer ' + REDIS_TOKEN, 'Content-Type': 'application/json' },
    body: JSON.stringify(command),
  });
  const j = await r.json();
  if (j.error) throw new Error(j.error);
  return j.result;
}
const hash = (s) => crypto.createHash('sha256').update(String(s)).digest('hex');
const num = (v, max) => (typeof v === 'number' && isFinite(v) ? Math.max(0, Math.min(v, max)) : 0);
const word = (v) => (typeof v === 'string' && /^[a-z0-9_-]{1,32}$/i.test(v) ? v : null);

// keep only the fields the game uses, with sane limits
function clean(body) {
  const out = { species: num(body.species, 500), legends: num(body.legends, 50), catches: num(body.catches, 1e6), days: num(body.days, 1e5), letters: num(body.letters, 1e5), recs: {}, recent: [], big: null };
  if (body.recs && typeof body.recs === 'object') for (const k of Object.keys(body.recs).slice(0, 80)) if (word(k)) out.recs[k] = num(body.recs[k], 5000);
  if (body.big && word(body.big.sp)) out.big = { sp: body.big.sp, W: num(body.big.W, 5000) };
  if (Array.isArray(body.recent)) for (const c of body.recent.slice(0, 6)) if (c && word(c.sp)) out.recent.push({ sp: c.sp, W: num(c.W, 5000), v: word(c.v), t: num(c.t, 9e15), why: word(c.why) || 'big' });
  return out;
}

module.exports = async (req, res) => {
  res.setHeader('Cache-Control', 'no-store');
  if (!REDIS_URL || !REDIS_TOKEN) return res.status(503).json({ error: 'storage_not_connected' });
  const code = process.env.BOARD_KEY;
  if (code && req.headers['x-board-key'] !== code) return res.status(401).json({ error: 'crew_code_required' });
  try {
    if (req.method === 'GET') {
      const flat = (await redis(['HGETALL', 'board'])) || [];
      const rows = [];
      for (let i = 0; i < flat.length; i += 2) { try { rows.push(JSON.parse(flat[i + 1])); } catch (e) { /* skip bad row */ } }
      return res.status(200).json({ rows });
    }
    if (req.method === 'POST') {
      let b = req.body; if (typeof b === 'string') b = JSON.parse(b || '{}');
      const id = typeof b.id === 'string' && /^p[a-z0-9]{8,40}$/.test(b.id) ? b.id : null;
      const secret = typeof b.secret === 'string' && b.secret.length >= 16 && b.secret.length <= 80 ? b.secret : null;
      const name = typeof b.name === 'string' ? b.name.trim().slice(0, 24) : '';
      if (!id || !secret || !name || !b.body) return res.status(400).json({ error: 'bad_request' });
      // the first save claims a player slot; later saves must come from the same browser
      const owner = await redis(['HGET', 'owners', id]);
      if (owner && owner !== hash(secret)) return res.status(403).json({ error: 'not_your_slot' });
      if (!owner) {
        const count = await redis(['HLEN', 'owners']);
        if (count >= 50) return res.status(429).json({ error: 'board_full' });
        await redis(['HSET', 'owners', id, hash(secret)]);
      }
      const row = Object.assign({ id, name, updated: Date.now() }, clean(b.body));
      await redis(['HSET', 'board', id, JSON.stringify(row)]);
      return res.status(200).json({ ok: true });
    }
    return res.status(405).json({ error: 'method_not_allowed' });
  } catch (e) {
    return res.status(500).json({ error: 'storage_error' });
  }
};
