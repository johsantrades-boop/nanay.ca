// Shared by the local server (server.mjs), the static build and the Vercel admin API:
// cleaning what the admin saves, and rendering the website from the menu data.
import crypto from 'node:crypto';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const TEMPLATE = path.join(path.dirname(fileURLToPath(import.meta.url)), '..', 'views', 'index.html');

export const BADGES = { bestseller: 'Bestseller', new: 'New', 'nanays-pick': "Nanay's pick", frozen: 'Frozen', solo: 'Solo meal', vegan: 'Vegan', spicy: 'Spicy', dessert: 'Dessert' };
export const STYLES = ['', 'party', 'inihaw', 'silog', 'dessert'];
export const TRAYS = ['', 'ube', 'caramel'];
const str = (v, max = 400) => String(v ?? '').replace(/\r/g, '').trim().slice(0, max);
const num = (v, max = 100000) => { const n = Number(v); return Number.isFinite(n) && n >= 0 ? Math.min(n, max) : 0; };
const okUrl = v => { v = str(v, 600); return /^(https:\/\/|http:\/\/localhost|sms:|tel:|mailto:)/i.test(v) ? v : ''; };
const okImg = v => { v = str(v, 300); return /^(media\/[\w.-]+|\/uploads\/[\w.-]+)$/.test(v) ? v : ''; };
const slug = v => str(v, 60).toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '');
// Rebuilds the document from known fields only, so the admin can't store anything unexpected.
export function sanitize(d, rev) {
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
  return { rev, settings, categories, items, instagram };
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

export function renderPage(d, site) {
  const s = d.settings;
  const mapsQuery = encodeURIComponent(`${s.pickupName}, ${s.pickupAddress}`);
  const tokens = {
    MENU: renderMenu(d), TIERS: renderTiers(d), INSTAGRAM: renderInstagram(d), PLANNER_JSON: plannerData(d), JSONLD: jsonLd(d, site),
    PHONE: esc(s.phone), PHONE_DISPLAY: esc(s.phoneDisplay), EMAIL: esc(s.email), IG_URL: esc(s.instagram), HOURS: esc(s.hours),
    DELIVERY: esc(s.deliveryNote), PICKUP_NAME: esc(s.pickupName), PICKUP_ADDRESS: esc(s.pickupAddress), POLICY: esc(s.policy),
    ORDER_URL: esc(s.orderUrl || 'https://nanay.ca'), MAPS_URL: `https://www.google.com/maps/dir/?api=1&amp;destination=${mapsQuery}`,
  };
  return fs.readFileSync(TEMPLATE, 'utf8')
    .replace(/\{\{([A-Z_]+)\}\}/g, (m, k) => k in tokens ? tokens[k] : m)
    .replaceAll('%%SITE_URL%%', site);
}

export const IMG_SIG = { webp: b => b.toString('ascii', 0, 4) === 'RIFF' && b.toString('ascii', 8, 12) === 'WEBP', jpg: b => b[0] === 0xff && b[1] === 0xd8, png: b => b.toString('hex', 0, 8) === '89504e470d0a1a0a' };
