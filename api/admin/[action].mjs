// The admin API on Vercel (free plan). There is no disk, so the menu, photos and password hash
// are saved as files in the GitHub repo (app/content/). Each menu save is a commit, and Vercel
// rebuilds the site from it in about a minute.
// Vercel settings needed: GITHUB_TOKEN (fine-grained, Contents read/write on this repo only)
// and NANAY_ADMIN_PASSWORD (the first password; it can be changed in the admin afterwards).
import crypto from 'node:crypto';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { BADGES, IMG_SIG, sanitize } from '../../app/lib/site.mjs';

const APP = path.join(path.dirname(fileURLToPath(import.meta.url)), '..', '..', 'app');
const SEED = path.join(APP, 'seed', 'menu.json');
const MENU = 'app/content/menu.json', AUTH = 'app/content/auth.json', UPLOADS = 'app/content/uploads';
const SESSION_MS = 12 * 60 * 60 * 1000;
const env = process.env;
const TOKEN = String(env.GITHUB_TOKEN || '').trim(); // pasted values often carry a space or line break
const REPO = env.NANAY_GITHUB_REPO || (env.VERCEL_GIT_REPO_OWNER ? `${env.VERCEL_GIT_REPO_OWNER}/${env.VERCEL_GIT_REPO_SLUG}` : 'johsantrades-boop/nanay.ca');
const BRANCH = env.NANAY_GITHUB_BRANCH || env.VERCEL_GIT_COMMIT_REF || 'main';
const failed = new Map(); // ip -> { n, until }; per running instance, so a best-effort brake

/* ---------------- GitHub storage ---------------- */
async function gh(method, file, body, accept = 'application/vnd.github+json') {
  if (!TOKEN) throw Object.assign(new Error('The admin is not set up yet: add GITHUB_TOKEN in Vercel.'), { code: 500 });
  const url = `https://api.github.com/repos/${REPO}/contents/${file.split('/').map(encodeURIComponent).join('/')}` + (method === 'GET' ? `?ref=${encodeURIComponent(BRANCH)}` : '');
  const r = await fetch(url, {
    method, headers: { Authorization: `Bearer ${TOKEN}`, Accept: accept, 'X-GitHub-Api-Version': '2022-11-28', 'User-Agent': 'nanay-admin' },
    body: body && JSON.stringify({ ...body, branch: BRANCH }),
  });
  if (method === 'GET' && r.status === 404) return null;
  if (r.status === 409 || r.status === 422) throw Object.assign(new Error('The menu was changed in another window. Reload to get the latest version.'), { code: 409 });
  if (r.status === 401) throw Object.assign(new Error('GitHub did not accept GITHUB_TOKEN (401). Paste the whole token again in Vercel, then redeploy.'), { code: 502 });
  if (!r.ok) throw Object.assign(new Error(`Saving to GitHub failed (${r.status}). Check GITHUB_TOKEN in Vercel.`), { code: 502 });
  return accept.includes('raw') ? Buffer.from(await r.arrayBuffer()) : r.json();
}
const readJson = async file => {
  const f = await gh('GET', file);
  return f && { sha: f.sha, json: JSON.parse(Buffer.from(f.content, 'base64').toString('utf8')) };
};
const writeFile = (file, buf, message, sha) => gh('PUT', file, { message, content: buf.toString('base64'), ...(sha ? { sha } : {}) });

async function loadMenu() {
  const f = await readJson(MENU);
  const data = f ? f.json : JSON.parse(fs.readFileSync(SEED, 'utf8'));
  return { ...data, rev: f ? f.sha : 'seed' };
}

/* ---------------- Auth ---------------- */
const scrypt = (pw, salt) => crypto.scryptSync(String(pw), salt, 64);
const sessionKey = () => crypto.createHash('sha256').update('nanay-session:' + (env.NANAY_SESSION_SECRET || TOKEN)).digest();
async function loadAuth() {
  const f = await readJson(AUTH);
  if (f) return { ...f.json, sha: f.sha, version: f.json.salt };
  if (!env.NANAY_ADMIN_PASSWORD) throw Object.assign(new Error('The admin is not set up yet: add NANAY_ADMIN_PASSWORD in Vercel.'), { code: 500 });
  return { env: true, version: 'env' };
}
function checkPassword(auth, pw) {
  if (auth.env) { // compare fixed-length hashes so the check takes the same time
    const salt = 'nanay-env';
    return crypto.timingSafeEqual(scrypt(pw, salt), scrypt(env.NANAY_ADMIN_PASSWORD, salt));
  }
  return crypto.timingSafeEqual(scrypt(pw, auth.salt), Buffer.from(auth.hash, 'hex'));
}
// Stateless session: expiry + signature over the password version, so changing the password signs out other devices.
const sign = (exp, version) => crypto.createHmac('sha256', sessionKey()).update(`${exp}.${version}`).digest('hex');
const sessionCookie = version => {
  const exp = Date.now() + SESSION_MS;
  return `nanay_admin=${exp}.${sign(exp, version)}; Path=/; HttpOnly; Secure; SameSite=Strict; Max-Age=${SESSION_MS / 1000}`;
};
const cookies = req => Object.fromEntries((req.headers.cookie || '').split(';').map(c => c.trim().split('=')).filter(p => p[0]).map(([k, ...v]) => [k, decodeURIComponent(v.join('='))]));
function isAuthed(req, auth) {
  const [exp, sig] = String(cookies(req).nanay_admin || '').split('.');
  if (!exp || !sig || +exp < Date.now()) return false;
  const want = Buffer.from(sign(exp, auth.version), 'hex'), got = Buffer.from(sig, 'hex');
  return got.length === want.length && crypto.timingSafeEqual(got, want);
}
// Writes must come from the admin page itself: custom header (blocks cross-site forms) + same-origin check.
const sameOrigin = req => {
  if (req.headers['x-nanay-admin'] !== '1') return false;
  const o = req.headers.origin; if (!o) return true;
  try { return new URL(o).host === req.headers.host; } catch { return false; }
};

/* ---------------- Handler ---------------- */
const json = (res, code, obj) => { res.setHeader('Cache-Control', 'no-store'); res.status(code).json(obj); };

export default async function handler(req, res) {
  res.setHeader('X-Content-Type-Options', 'nosniff');
  const action = String(req.query.action || '');
  const body = req.body && typeof req.body === 'object' ? req.body : {};
  try {
    // Photos uploaded since the last rebuild: served from the repo until the rebuilt site has them
    if (action === 'file' && req.method === 'GET') {
      const name = String(req.query.name || '');
      const ext = /^[\w-]+\.(webp|jpg|png)$/.exec(name)?.[1];
      const buf = ext && await gh('GET', `${UPLOADS}/${name}`, null, 'application/vnd.github.raw+json');
      if (!buf) return res.status(404).send('Not found');
      res.setHeader('Content-Type', { webp: 'image/webp', jpg: 'image/jpeg', png: 'image/png' }[ext]);
      res.setHeader('Cache-Control', 'public, max-age=300');
      return res.status(200).send(buf);
    }

    if (req.method !== 'GET' && !sameOrigin(req)) return json(res, 403, { error: 'Request blocked' });
    const auth = await loadAuth();

    if (action === 'login' && req.method === 'POST') {
      const ip = String(req.headers['x-forwarded-for'] || '').split(',')[0].trim();
      const f = failed.get(ip);
      if (f && f.n >= 8 && f.until > Date.now()) return json(res, 429, { error: 'Too many attempts. Try again in 15 minutes.' });
      if (!body.password || !checkPassword(auth, body.password)) {
        const g = f && f.until > Date.now() ? f : { n: 0, until: Date.now() + 15 * 60 * 1000 };
        g.n++; failed.set(ip, g);
        await new Promise(r => setTimeout(r, 400));
        return json(res, 401, { error: 'Wrong password' });
      }
      failed.delete(ip);
      res.setHeader('Set-Cookie', sessionCookie(auth.version));
      return json(res, 200, { ok: true });
    }
    if (!isAuthed(req, auth)) return json(res, 401, { error: 'Please log in' });

    if (action === 'logout' && req.method === 'POST') {
      res.setHeader('Set-Cookie', 'nanay_admin=; Path=/; HttpOnly; Secure; SameSite=Strict; Max-Age=0');
      return json(res, 200, { ok: true });
    }
    if (action === 'data' && req.method === 'GET') return json(res, 200, { data: await loadMenu(), badges: BADGES });
    if (action === 'data' && req.method === 'PUT') {
      const current = await loadMenu();
      if (body.rev !== current.rev) return json(res, 409, { error: 'The menu was changed in another window. Reload to get the latest version.', data: current });
      const { rev, ...next } = sanitize(body.data || {}, null);
      const r = await writeFile(MENU, Buffer.from(JSON.stringify(next, null, 1)), 'Menu updated in the admin', current.rev === 'seed' ? null : current.rev);
      return json(res, 200, { ok: true, data: { ...next, rev: r.content.sha } });
    }
    if (action === 'upload' && req.method === 'POST') {
      const m = /^data:image\/(webp|jpeg|png);base64,([A-Za-z0-9+/=]+)$/.exec(body.dataUrl || '');
      if (!m) return json(res, 400, { error: 'Please upload a JPG, PNG or WebP image.' });
      const buf = Buffer.from(m[2], 'base64'), ext = m[1] === 'jpeg' ? 'jpg' : m[1];
      if (buf.length > 3_000_000 || !IMG_SIG[ext](buf)) return json(res, 400, { error: 'That file is not a valid image (max 3 MB).' });
      const name = `${Date.now().toString(36)}-${crypto.randomBytes(6).toString('hex')}.${ext}`;
      // "[upload]" commits don't trigger a rebuild (vercel.json ignoreCommand); the next menu save does
      await writeFile(`${UPLOADS}/${name}`, buf, `[upload] Photo ${name}`);
      return json(res, 200, { url: `/uploads/${name}` });
    }
    if (action === 'password' && req.method === 'POST') {
      if (!checkPassword(auth, body.current || '')) return json(res, 400, { error: 'Your current password is wrong.' });
      if (String(body.next || '').length < 10) return json(res, 400, { error: 'Use at least 10 characters.' });
      const salt = crypto.randomBytes(16).toString('hex');
      const next = { salt, hash: scrypt(body.next, salt).toString('hex') };
      await writeFile(AUTH, Buffer.from(JSON.stringify(next)), '[upload] Admin password changed', auth.sha);
      res.setHeader('Set-Cookie', sessionCookie(salt)); // keep this device signed in; others are signed out
      return json(res, 200, { ok: true });
    }
    return json(res, 404, { error: 'Not found' });
  } catch (e) {
    if (e.code) return json(res, e.code, { error: e.message, ...(e.code === 409 ? { data: await loadMenu().catch(() => null) } : {}) });
    console.error(e);
    return json(res, 500, { error: 'Something went wrong' });
  }
}
