// Nanay website + admin. No dependencies (Node 20+).
//   node app/server.mjs                       -> http://localhost:4180  (admin at /admin)
//   node app/server.mjs set-password <new>    -> sets the admin password
// Data lives in app/data (or NANAY_DATA_DIR): menu.json, uploads/, backups/, auth.json.
import http from 'node:http';
import fs from 'node:fs';
import path from 'node:path';
import crypto from 'node:crypto';
import { fileURLToPath } from 'node:url';

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

const BADGES = { bestseller: 'Bestseller', new: 'New', 'nanays-pick': "Nanay's pick", frozen: 'Frozen', solo: 'Solo meal', vegan: 'Vegan', spicy: 'Spicy', dessert: 'Dessert' };
const STYLES = ['', 'party', 'inihaw', 'silog', 'dessert'];
const TRAYS = ['', 'ube', 'caramel'];
const str = (v, max = 400) => String(v ?? '').replace(/\r/g, '').trim().slice(0, max);
const num = (v, max = 100000) => { const n = Number(v); return Number.isFinite(n) && n >= 0 ? Math.min(n, max) : 0; };
const okUrl = v => { v = str(v, 600); return /^(https:\/\/|http:\/\/localhost|sms:|tel:|mailto:)/i.test(v) ? v : ''; };
const okImg = v => { v = str(v, 300); return /^(media\/[\w.-]+|\/uploads\/[\w.-]+)$/.test(v) ? v : ''; };
const slug = v => str(v, 60).toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '');
// Rebuilds the document from known fields only, so the admin can't store anything unexpected.
function sanitize(d) {
  const s = d.settings || {};
  const settings = {
    phone: str(s.phone, 20).replace(/[^\d+]/g, ''), phoneDisplay: str(s.phoneDisplay, 30), email: str(s.email, 80),
    instagram: okUrl(s.instagram), hours: str(s.hours, 80), hoursSchema: str(s.hoursSchema, 80),
    pickupName: str(s.pickupName, 80), pickupAddress: str(s.pickupAddress, 120), deliveryNote: str(s.deliveryNote, 200),
    policy: str(s.policy, 600), orderUrl: okUrl(s.orderUrl),
  };
  const categories = (d.categories || []).slice(0, 20).map(c => ({
    id: slug(c.id) || 'cat-' + crypto.randomBytes(3).toString('hex'), name: str(c.name, 40) || 'Untitled',
    layout: c.layout === 'tiers' ? 'tiers' : 'tabs', intro: str(c.intro, 400),
    banner: c.banner && okImg(c.banner.image) ? { image: okImg(c.banner.image), url: okUrl(c.banner.url), caption: str(c.banner.caption, 160), alt: str(c.banner.alt, 160) } : null,
  }));
  const catIds = new Set(categories.map(c => c.id));
  const seen = new Set();
  const items = (d.items || []).slice(0, 300).map(it => {
    let id = slug(it.id) || slug(it.name) || 'item';
    while (seen.has(id)) id += '-2';
    seen.add(id);
    const img = it.image && okImg(it.image.sm) ? { sm: okImg(it.image.sm), lg: okImg(it.image.lg) || okImg(it.image.sm), alt: str(it.image.alt, 200) } : null;
    return {
      id, category: catIds.has(it.category) ? it.category : categories[0]?.id || '', name: str(it.name, 80) || 'New dish',
      gloss: str(it.gloss, 80), tagline: str(it.tagline, 80), description: str(it.description, 800),
      options: (it.options || []).slice(0, 12).map(o => {
        const min = Math.round(num(o.servesMin, 999)), max = Math.round(num(o.servesMax, 999));
        return { label: str(o.label, 80), servesMin: min, servesMax: Math.max(min, max), price: Math.round(num(o.price) * 100) / 100, url: okUrl(o.url) };
      }).filter(o => o.label || o.price),
      image: img, tray: TRAYS.includes(it.tray) ? it.tray : '',
      badges: [...new Set((it.badges || []).filter(b => b in BADGES))], note: str(it.note, 80),
      contains: str(it.contains, 200), heating: str(it.heating, 600), featured: !!it.featured,
      plannerStyle: STYLES.includes(it.plannerStyle) ? it.plannerStyle : '', orderUrl: okUrl(it.orderUrl),
      soldOut: !!it.soldOut, hidden: !!it.hidden,
    };
  });
  const instagram = (d.instagram || []).slice(0, 12).map(t => ({ image: okImg(t.image), url: okUrl(t.url), alt: str(t.alt, 200), video: !!t.video })).filter(t => t.image);
  return { rev: data.rev, settings, categories, items, instagram };
}

/* ---------------- Rendering ---------------- */
const esc = s => String(s ?? '').replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
const md = s => esc(s).replace(/\*\*(.+?)\*\*/g, '<b>$1</b>');
const money = n => '$' + Number(n).toLocaleString('en-CA', { minimumFractionDigits: n % 1 ? 2 : 0, maximumFractionDigits: 2 });
const cents = n => Number(n).toLocaleString('en-CA', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
const servesText = o => o.servesMin ? (o.servesMax > o.servesMin ? `${o.servesMin}–${o.servesMax}` : `${o.servesMin}`) : '';
const ppText = o => {
  if (!o.servesMin || !o.price) return '';
  const lo = o.price / (o.servesMax || o.servesMin), hi = o.price / o.servesMin;
  return lo === hi ? `$${cents(lo)}` : `$${cents(lo)}–${cents(hi)}`;
};
const visible = it => !it.hidden;
const ARROW = '<svg width="16" height="16" aria-hidden="true"><use href="#i-arrow"/></svg>';
const PEOPLE = '<svg aria-hidden="true"><use href="#i-people"/></svg>';
const smsHref = (s, body) => `sms:${esc(s.phone)}?&amp;body=${encodeURIComponent(body)}`;
const orderLink = (it, s, cls = 'order') => {
  if (it.soldOut) return '<span class="chip chip--muted">Sold out</span>';
  const url = it.orderUrl || it.options.find(o => o.url)?.url;
  return url
    ? `<a class="${cls}" href="${esc(url)}">Order${cls === 'order' ? ' ' + ARROW : ''}<span class="sr-only"> ${esc(it.name)}</span></a>`
    : `<a class="${cls}" href="${smsHref(s, `Hi Nanay! I'd like to order: ${it.name}`)}">Text to order<span class="sr-only"> ${esc(it.name)}</span></a>`;
};
const chips = it => it.badges.map(b => `<span class="chip chip--${b}">${esc(BADGES[b])}</span>`).join('');
const goodToKnow = it => (it.contains || it.heating)
  ? `<details class="gtk"><summary>Good to know</summary><dl>${it.contains ? `<div><dt>Contains</dt><dd>${esc(it.contains)}</dd></div>` : ''}${it.heating ? `<div><dt>How to heat</dt><dd>${esc(it.heating)}</dd></div>` : ''}</dl></details>`
  : '';
const imgTag = (img, sizes, extra = '') => `<img src="${esc(img.sm)}" srcset="${esc(img.sm)} 480w, ${esc(img.lg || img.sm)} 900w" sizes="${sizes}" alt="${esc(img.alt)}" width="480" height="480" loading="lazy" decoding="async"${extra}>`;

function dishCard(it, s, i) {
  const serves = [...new Set(it.options.map(servesText).filter(Boolean))];
  // One overall range ("Feeds 8–30"); each size's own count is in the price list below.
  const fed = it.options.filter(o => o.servesMin);
  const lo = Math.min(...fed.map(o => o.servesMin)), hi = Math.max(...fed.map(o => o.servesMax || o.servesMin));
  const badge = fed.length ? `${PEOPLE}Feeds ${lo === hi ? lo : `${lo}–${hi}`}` : esc(it.tagline);
  const showServesInLabel = serves.length > 1 || it.options.length > 1 && serves.length === 1 && it.options.some(o => !o.servesMin);
  const lines = it.options.map(o => {
    const pp = ppText(o);
    const label = esc(o.label) + (showServesInLabel && o.servesMin ? ` · good for ${servesText(o)}` : '');
    return `<li><span class="opt">${o.url ? `<a href="${esc(o.url)}">${label}</a>` : label}${pp ? `<span class="pp">${pp} / person</span>` : ''}</span><span class="dots"></span><span class="price">${money(o.price)}</span></li>`;
  }).join('');
  return `<article class="dish rv${it.soldOut ? ' is-sold' : ''}"${i ? ` data-d="${Math.min(i, 3)}"` : ''}>
          <div class="bilao${it.tray ? ' bilao--' + it.tray : ''}">${imgTag(it.image, '220px')}</div>
          ${badge ? `<span class="serves${it.tray ? ' serves--' + it.tray : ''}">${badge}</span>` : ''}
          <h3>${esc(it.name)}</h3>
          ${it.gloss ? `<p class="gloss">${esc(it.gloss)}</p>` : ''}
          ${serves.length && it.tagline ? `<p class="pitch">${esc(it.tagline)}</p>` : ''}
          ${it.description ? `<p class="desc">${esc(it.description)}</p>` : ''}
          <ul class="ledger">${lines}</ul>
          ${goodToKnow(it)}
          <div class="dish__foot"><span class="note">${chips(it)}${esc(it.note)}</span>${orderLink(it, s)}</div>
        </article>`;
}
function ledgerRow(it, s) {
  const prices = [...new Set(it.options.map(o => money(o.price)))];
  const parts = [];
  const forOne = it.options.every(o => o.servesMin === 1 && o.servesMax === 1);
  if (it.description) parts.push(esc(it.description)); else if (it.gloss) parts.push(esc(it.gloss));
  if (it.options.length > 1) parts.push(it.options.map(o => esc(o.label) + (o.servesMin && !forOne ? ` (${servesText(o)})` : '')).join(' / '));
  else if (it.options[0]?.servesMin && !forOne) parts.push(`good for ${servesText(it.options[0])}`);
  if (forOne && !/for one/i.test(it.gloss + it.description)) parts.push('for one');
  const pps = forOne ? [] : it.options.map(ppText).filter(Boolean);
  if (pps.length) parts.push(`${[...new Set(pps)].join(', ')} pp`);
  if (it.tagline) parts.push(esc(it.tagline));
  return `<div class="row${it.soldOut ? ' is-sold' : ''}">
          <div class="row__top"><span class="row__name">${esc(it.name)}${it.badges.length ? ` <span class="row__chips">${chips(it)}</span>` : ''}</span><span class="dots"></span><span class="row__price">${prices.join(' · ')}</span></div>
          <div class="row__sub"><span>${parts.join(' · ')}</span>${orderLink(it, s, 'row__order')}</div>
          ${goodToKnow(it)}
        </div>`;
}
function renderMenu(d) {
  const s = d.settings;
  const cats = d.categories.filter(c => c.layout === 'tabs').map(c => ({ c, items: d.items.filter(it => it.category === c.id && visible(it)) })).filter(x => x.items.length);
  if (!cats.length) return '<p class="panel__intro">The menu is being updated. Text us to order.</p>';
  const tabs = cats.map(({ c }, i) => `<button class="tab" role="tab" id="t-${c.id}" aria-controls="p-${c.id}" aria-selected="${i === 0}"${i ? ' tabindex="-1"' : ''}>${esc(c.name)}</button>`).join('\n      ');
  const panels = cats.map(({ c, items }, i) => {
    const featured = items.filter(it => it.featured && it.image);
    const rows = items.filter(it => !(it.featured && it.image));
    const banner = c.banner ? `<a class="cat-banner" href="${esc(c.banner.url || s.instagram)}" target="_blank" rel="noopener">
        <img src="${esc(c.banner.image)}" alt="${esc(c.banner.alt)}" width="480" height="480" loading="lazy" decoding="async">
        <span><b><svg aria-hidden="true"><use href="#i-insta"/></svg>Seen on @nanaykitchen</b>${esc(c.banner.caption)}<span class="sr-only"> (opens Instagram in a new tab)</span></span>
      </a>` : '';
    return `<div class="panel" role="tabpanel" id="p-${c.id}" aria-labelledby="t-${c.id}"${i ? ' hidden' : ''}>
      ${c.intro ? `<p class="panel__intro">${md(c.intro)}</p>` : ''}
      ${banner}
      ${featured.length ? `<div class="dishes">${featured.map((it, j) => dishCard(it, s, j)).join('\n')}</div>` : ''}
      ${rows.length ? `<div class="board"${featured.length ? '' : ' style="margin-top:0"'}>${featured.length ? `<h3>More ${esc(c.name.toLowerCase())}</h3>` : ''}${rows.map(it => ledgerRow(it, s)).join('\n')}</div>` : ''}
    </div>`;
  }).join('\n\n    ');
  return `<div class="tabs" role="tablist" aria-label="Menu categories">\n      ${tabs}\n    </div>\n\n    ${panels}`;
}
function renderTiers(d) {
  const ids = new Set(d.categories.filter(c => c.layout === 'tiers').map(c => c.id));
  const items = d.items.filter(it => ids.has(it.category) && visible(it) && it.options.length);
  if (!items.length) return '';
  return `<div class="tiers">${items.map((it, i) => {
    const o = it.options[0];
    const pp = ppText(o);
    return `
      <article class="tier rv"${i ? ` data-d="${Math.min(i, 3)}"` : ''}>
        <p class="tier__n">${esc(servesText(o) || '—')}<small>guests</small></p>
        <h3>${esc(it.name)}</h3>
        <p>${esc(it.description)}</p>
        <div class="tier__price"><b>${money(o.price)}</b>${pp ? `<span>${pp} pp</span>` : ''}</div>
        ${it.soldOut ? '<span class="chip chip--muted">Sold out</span>' : `<a href="${it.orderUrl || o.url ? esc(it.orderUrl || o.url) : smsHref(d.settings, `Hi Nanay! I'd like to order a ${it.name}`)}">Order this feast →</a>`}
      </article>`;
  }).join('')}
    </div>`;
}
function renderInstagram(d) {
  if (!d.instagram.length) return '';
  const tiles = d.instagram.map(t => `<li class="ig-tile"><a href="${esc(t.url || d.settings.instagram)}" target="_blank" rel="noopener">
          <img src="${esc(t.image)}" alt="${esc(t.alt)}" width="480" height="480" loading="lazy" decoding="async">
          ${t.video ? '<span class="ig-tile__play" aria-hidden="true"><svg viewBox="0 0 14 14"><path d="M3 1.5v11l9-5.5z" fill="currentColor"/></svg></span>' : ''}
          <span class="sr-only">${t.video ? 'Watch' : 'View'} on Instagram (opens in a new tab)</span></a></li>`).join('\n        ');
  return `<!-- ================= INSTAGRAM ================= -->
<section class="insta" id="instagram" aria-labelledby="ig-title">
  <div class="wrap">
    <div class="sec-head rv">
      <div>
        <p class="kicker"><svg aria-hidden="true"><use href="#i-insta"/></svg>@nanaykitchen</p>
        <h2 id="ig-title">Fresh from <em>the kitchen</em></h2>
      </div>
      <a class="btn btn--ghost" href="${esc(d.settings.instagram)}" target="_blank" rel="noopener">Follow on Instagram<span class="sr-only"> (opens in a new tab)</span></a>
    </div>
    <ul class="ig-grid" role="list">
        ${tiles}
    </ul>
  </div>
</section>
`;
}
function plannerData(d) {
  const live = d.items.filter(it => visible(it) && !it.soldOut);
  const title = (it, o) => it.options.length < 2 ? it.name : o.label.toLowerCase().includes(it.name.toLowerCase()) ? o.label : `${it.name} (${o.label})`;
  const url = (it, o) => o.url || it.orderUrl || '';
  const packages = [], extras = [];
  let dessert = null;
  for (const it of live) for (const o of it.options) {
    if (!o.price) continue;
    const line = { title: title(it, o), note: o.servesMin ? `good for ${servesText(o)}` : '', serves: o.servesMin, price: o.price, url: url(it, o) };
    if (['party', 'inihaw', 'silog'].includes(it.plannerStyle) && o.servesMin) packages.push({ ...line, style: it.plannerStyle });
    if (it.plannerStyle === 'dessert') {
      line.isDessert = true;
      if (!dessert) dessert = { ...line, title: live.filter(x => x.plannerStyle === 'dessert').map(x => x.name).join(' or ') };
    }
    extras.push(line);
  }
  return JSON.stringify({ packages, dessert, extras, phone: d.settings.phone }).replace(/</g, '\\u003c');
}
function jsonLd(d, site) {
  const s = d.settings;
  return JSON.stringify({
    '@context': 'https://schema.org', '@type': 'FoodEstablishment', name: 'Nanay',
    description: 'Filipino comfort food: silogs, charcoal-grilled inihaw, noodles, solo meals and party feasts.',
    servesCuisine: 'Filipino', url: site + '/', image: site + '/og.jpg', logo: site + '/apple-touch-icon.png',
    telephone: s.phone, email: s.email,
    address: { '@type': 'PostalAddress', streetAddress: s.pickupAddress.split(',')[0], addressLocality: 'Langley', addressRegion: 'BC', addressCountry: 'CA' },
    ...(s.hoursSchema ? { openingHours: s.hoursSchema } : {}),
    sameAs: s.instagram ? [s.instagram] : [],
  }, null, 2).replace(/</g, '\\u003c');
}
function renderPage(req) {
  const d = data, s = d.settings;
  const host = String(req.headers.host || `localhost:${PORT}`).replace(/[^\w.:-]/g, '');
  const site = `${isHttps(req) ? 'https' : 'http'}://${host}`;
  const mapsQuery = encodeURIComponent(`${s.pickupName}, ${s.pickupAddress}`);
  const tokens = {
    MENU: renderMenu(d), TIERS: renderTiers(d), INSTAGRAM: renderInstagram(d), PLANNER_JSON: plannerData(d), JSONLD: jsonLd(d, site),
    PHONE: esc(s.phone), PHONE_DISPLAY: esc(s.phoneDisplay), EMAIL: esc(s.email), IG_URL: esc(s.instagram), HOURS: esc(s.hours),
    DELIVERY: esc(s.deliveryNote), PICKUP_NAME: esc(s.pickupName), PICKUP_ADDRESS: esc(s.pickupAddress), POLICY: esc(s.policy),
    ORDER_URL: esc(s.orderUrl || 'https://nanay.ca'), MAPS_URL: `https://www.google.com/maps/dir/?api=1&amp;destination=${mapsQuery}`,
  };
  return fs.readFileSync(path.join(VIEWS, 'index.html'), 'utf8')
    .replace(/\{\{([A-Z_]+)\}\}/g, (m, k) => k in tokens ? tokens[k] : m)
    .replaceAll('%%SITE_URL%%', site);
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
const IMG_SIG = { webp: b => b.toString('ascii', 0, 4) === 'RIFF' && b.toString('ascii', 8, 12) === 'WEBP', jpg: b => b[0] === 0xff && b[1] === 0xd8, png: b => b.toString('hex', 0, 8) === '89504e470d0a1a0a' };

async function api(req, res, p) {
  const ip = req.socket.remoteAddress || '';
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
    save(sanitize(body.data || {}));
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
