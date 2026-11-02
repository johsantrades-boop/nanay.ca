// Nanay website + admin. No dependencies (Node 20+).
//   node app/server.mjs                       -> http://localhost:4180  (admin at /admin)
//   node app/server.mjs set-password <new>    -> sets the admin password
// Data lives in app/data (or NANAY_DATA_DIR): menu.json, uploads/, backups/, auth.json.
import http from 'node:http';
import fs from 'node:fs';
import path from 'node:path';
import crypto from 'node:crypto';
import { fileURLToPath } from 'node:url';
import { BADGES, IMG_SIG, sanitize, renderPage as render } from './lib/site.mjs';

const ROOT = path.dirname(fileURLToPath(import.meta.url));
const DATA = path.resolve(process.env.NANAY_DATA_DIR || path.join(ROOT, 'data'));
const MENU = path.join(DATA, 'menu.json');
const AUTH = path.join(DATA, 'auth.json');
const UPLOADS = path.join(DATA, 'uploads');
const BACKUPS = path.join(DATA, 'backups');
const PUBLIC = path.join(ROOT, 'public');
const VIEWS = path.join(ROOT, 'views');
const PORT = +process.env.PORT || 4180;

for (const d of [DATA, UPLOADS, BACKUPS]) fs.mkdirSync(d, { recursive: true });
if (!fs.existsSync(MENU)) fs.copyFileSync(path.join(ROOT, 'seed', 'menu.json'), MENU);

/* ---------------- Auth ---------------- */
const hash = (pw, salt = crypto.randomBytes(16).toString('hex')) => ({ salt, hash: crypto.scryptSync(pw, salt, 64).toString('hex') });
const setPassword = pw => fs.writeFileSync(AUTH, JSON.stringify(hash(pw)), { mode: 0o600 });
const checkPassword = pw => {
  const a = JSON.parse(fs.readFileSync(AUTH, 'utf8'));
  const got = crypto.scryptSync(String(pw), a.salt, 64);
  return crypto.timingSafeEqual(got, Buffer.from(a.hash, 'hex'));
};

if (process.argv[2] === 'set-password') {
  const pw = process.argv[3] || process.env.NANAY_ADMIN_PASSWORD || '';
  if (pw.length < 10) { console.error('Use at least 10 characters: node app/server.mjs set-password "your new password"'); process.exit(1); }
  setPassword(pw); console.log('Admin password updated.'); process.exit(0);
}
if (!fs.existsSync(AUTH)) {
  if (process.env.NANAY_ADMIN_PASSWORD) setPassword(process.env.NANAY_ADMIN_PASSWORD);
  else {
    const pw = crypto.randomBytes(12).toString('base64url');
    setPassword(pw);
    const f = path.join(DATA, 'FIRST-LOGIN-PASSWORD.txt');
    fs.writeFileSync(f, `Nanay admin first-login password: ${pw}\nChange it after logging in (Admin > Password), then delete this file.\n`, { mode: 0o600 });
    console.log(`No admin password was set, so one was created. It is in ${f}`);
  }
}

const sessions = new Map(); // token -> expiry ms
const SESSION_MS = 12 * 60 * 60 * 1000;
const cookies = req => Object.fromEntries((req.headers.cookie || '').split(';').map(c => c.trim().split('=')).filter(p => p[0]).map(([k, ...v]) => [k, decodeURIComponent(v.join('='))]));
const isAuthed = req => { const t = cookies(req).nanay_admin; const exp = t && sessions.get(t); if (!exp) return false; if (exp < Date.now()) { sessions.delete(t); return false; } return true; };
const isHttps = req => req.headers['x-forwarded-proto'] === 'https' || req.socket.encrypted;
const failed = new Map(); // ip -> { n, until }

/* ---------------- Data ---------------- */
let data = JSON.parse(fs.readFileSync(MENU, 'utf8'));
const save = next => {
  const stamp = new Date().toISOString().replace(/[:.]/g, '-');
  fs.copyFileSync(MENU, path.join(BACKUPS, `menu-${stamp}.json`));
  const old = fs.readdirSync(BACKUPS).filter(f => f.startsWith('menu-')).sort();
  for (const f of old.slice(0, Math.max(0, old.length - 30))) fs.unlinkSync(path.join(BACKUPS, f));
  next.rev = (data.rev || 0) + 1;
  const tmp = MENU + '.tmp';
  fs.writeFileSync(tmp, JSON.stringify(next, null, 1));
  fs.renameSync(tmp, MENU);
  data = next;
};

function renderPage(req) {
  const host = String(req.headers.host || `localhost:${PORT}`).replace(/[^\w.:-]/g, '');
  return render(data, `${isHttps(req) ? 'https' : 'http'}://${host}`);
}

/* ---------------- HTTP ---------------- */
const MIME = { '.html': 'text/html; charset=utf-8', '.css': 'text/css', '.js': 'text/javascript', '.json': 'application/json', '.webmanifest': 'application/manifest+json', '.svg': 'image/svg+xml', '.png': 'image/png', '.jpg': 'image/jpeg', '.jpeg': 'image/jpeg', '.webp': 'image/webp', '.woff2': 'font/woff2', '.mp4': 'video/mp4' };
const base = res => { res.setHeader('X-Content-Type-Options', 'nosniff'); res.setHeader('Referrer-Policy', 'strict-origin-when-cross-origin'); };
const send = (res, code, body, type = 'text/plain; charset=utf-8', extra = {}) => { res.writeHead(code, { 'Content-Type': type, ...extra }); res.end(body); };
const json = (res, code, obj) => send(res, code, JSON.stringify(obj), 'application/json', { 'Cache-Control': 'no-store' });
function serveFile(req, res, dir, rel, maxAge) {
  const file = path.resolve(dir, '.' + path.posix.normalize('/' + rel));
  if (!file.startsWith(dir + path.sep) || !fs.existsSync(file) || !fs.statSync(file).isFile()) return send(res, 404, 'Not found');
  const stat = fs.statSync(file), type = MIME[path.extname(file).toLowerCase()] || 'application/octet-stream';
  const range = req.headers.range && /bytes=(\d*)-(\d*)/.exec(req.headers.range);
  const head = { 'Content-Type': type, 'Cache-Control': `public, max-age=${maxAge}`, 'Accept-Ranges': 'bytes' };
  if (range) { // video seeking / Safari
    const start = range[1] ? +range[1] : 0, end = range[2] ? Math.min(+range[2], stat.size - 1) : stat.size - 1;
    if (start > end || start >= stat.size) return send(res, 416, '', 'text/plain', { 'Content-Range': `bytes */${stat.size}` });
    res.writeHead(206, { ...head, 'Content-Range': `bytes ${start}-${end}/${stat.size}`, 'Content-Length': end - start + 1 });
    return fs.createReadStream(file, { start, end }).pipe(res);
  }
  res.writeHead(200, { ...head, 'Content-Length': stat.size });
  if (req.method === 'HEAD') return res.end();
  fs.createReadStream(file).pipe(res);
}
const readBody = (req, limit) => new Promise((resolve, reject) => {
  let size = 0; const chunks = [];
  req.on('data', c => { size += c.length; if (size > limit) { reject(Object.assign(new Error('Too large'), { code: 413 })); req.destroy(); } else chunks.push(c); });
  req.on('end', () => { try { resolve(JSON.parse(Buffer.concat(chunks).toString('utf8') || '{}')); } catch { reject(Object.assign(new Error('Bad JSON'), { code: 400 })); } });
  req.on('error', reject);
});
// Writes must come from the admin page itself: custom header (blocks cross-site forms) + same-origin check.
const sameOrigin = req => {
  if (req.headers['x-nanay-admin'] !== '1') return false;
  const o = req.headers.origin; if (!o) return true;
  try { return new URL(o).host === req.headers.host; } catch { return false; }
};

async function api(req, res, p) {
  // Behind a host's proxy (Render) the socket address is the proxy; its own entry is the last one in X-Forwarded-For
  const fwd = process.env.NANAY_TRUST_PROXY === '1' && String(req.headers['x-forwarded-for'] || '').split(',').pop().trim();
  const ip = fwd || req.socket.remoteAddress || '';
  if (req.method !== 'GET' && !sameOrigin(req)) return json(res, 403, { error: 'Request blocked' });
  if (p === '/api/admin/login' && req.method === 'POST') {
    const f = failed.get(ip);
    if (f && f.n >= 8 && f.until > Date.now()) return json(res, 429, { error: 'Too many attempts. Try again in 15 minutes.' });
    const { password } = await readBody(req, 2000);
    if (!password || !checkPassword(password)) {
      const g = f && f.until > Date.now() ? f : { n: 0, until: Date.now() + 15 * 60 * 1000 };
      g.n++; failed.set(ip, g);
      await new Promise(r => setTimeout(r, 400));
      return json(res, 401, { error: 'Wrong password' });
    }
    failed.delete(ip);
    const token = crypto.randomBytes(32).toString('hex');
    sessions.set(token, Date.now() + SESSION_MS);
    res.setHeader('Set-Cookie', `nanay_admin=${token}; Path=/; HttpOnly; SameSite=Strict; Max-Age=${SESSION_MS / 1000}${isHttps(req) ? '; Secure' : ''}`);
    return json(res, 200, { ok: true });
  }
  if (!isAuthed(req)) return json(res, 401, { error: 'Please log in' });
  if (p === '/api/admin/logout' && req.method === 'POST') {
    sessions.delete(cookies(req).nanay_admin);
    res.setHeader('Set-Cookie', 'nanay_admin=; Path=/; HttpOnly; SameSite=Strict; Max-Age=0');
    return json(res, 200, { ok: true });
  }
  if (p === '/api/admin/data' && req.method === 'GET') return json(res, 200, { data, badges: BADGES });
  if (p === '/api/admin/data' && req.method === 'PUT') {
    const body = await readBody(req, 2_000_000);
    if (body.rev !== data.rev) return json(res, 409, { error: 'The menu was changed in another window. Reload to get the latest version.', data });
    save(sanitize(body.data || {}, data.rev));
    return json(res, 200, { ok: true, data });
  }
  if (p === '/api/admin/upload' && req.method === 'POST') {
    const { dataUrl } = await readBody(req, 6_000_000);
    const m = /^data:image\/(webp|jpeg|png);base64,([A-Za-z0-9+/=]+)$/.exec(dataUrl || '');
    if (!m) return json(res, 400, { error: 'Please upload a JPG, PNG or WebP image.' });
    const buf = Buffer.from(m[2], 'base64'), ext = m[1] === 'jpeg' ? 'jpg' : m[1];
    if (buf.length > 4_000_000 || !IMG_SIG[ext](buf)) return json(res, 400, { error: 'That file is not a valid image (max 4 MB).' });
    const name = `${Date.now().toString(36)}-${crypto.randomBytes(6).toString('hex')}.${ext}`;
    fs.writeFileSync(path.join(UPLOADS, name), buf);
    return json(res, 200, { url: `/uploads/${name}` });
  }
  if (p === '/api/admin/password' && req.method === 'POST') {
    const { current, next } = await readBody(req, 2000);
    if (!checkPassword(current || '')) return json(res, 400, { error: 'Your current password is wrong.' });
    if (String(next || '').length < 10) return json(res, 400, { error: 'Use at least 10 characters.' });
    setPassword(String(next));
    const keep = cookies(req).nanay_admin;
    for (const t of sessions.keys()) if (t !== keep) sessions.delete(t); // sign out other devices
    const first = path.join(DATA, 'FIRST-LOGIN-PASSWORD.txt');
    if (fs.existsSync(first)) fs.unlinkSync(first);
    return json(res, 200, { ok: true });
  }
  return json(res, 404, { error: 'Not found' });
}

http.createServer(async (req, res) => {
  base(res);
  const p = decodeURIComponent(new URL(req.url, 'http://x').pathname);
  try {
    if (p.startsWith('/api/admin/')) return await api(req, res, p);
    if (req.method !== 'GET' && req.method !== 'HEAD') return send(res, 405, 'Method not allowed');
    if (p === '/' || p === '/index.html') return send(res, 200, renderPage(req), 'text/html; charset=utf-8', { 'Cache-Control': 'no-cache' });
    if (p === '/admin' || p === '/admin/') return send(res, 200, fs.readFileSync(path.join(VIEWS, 'admin.html')), 'text/html; charset=utf-8', { 'Cache-Control': 'no-store', 'X-Frame-Options': 'DENY', 'X-Robots-Tag': 'noindex' });
    if (p.startsWith('/uploads/')) return serveFile(req, res, UPLOADS, p.slice(9), 31536000);
    if (p === '/robots.txt') return send(res, 200, 'User-agent: *\nDisallow: /admin\nDisallow: /api/\n');
    return serveFile(req, res, PUBLIC, p.slice(1), p.startsWith('/media/') || p.startsWith('/fonts/') ? 604800 : 3600);
  } catch (e) {
    if (e.code === 413 || e.code === 400) return json(res, e.code, { error: e.message });
    console.error(e);
    send(res, 500, 'Something went wrong');
  }
}).listen(PORT, () => console.log(`Nanay site on http://localhost:${PORT}  (admin: http://localhost:${PORT}/admin)`));
