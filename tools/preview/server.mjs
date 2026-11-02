// Local preview of the Nanay Shopify theme. NOT part of the theme upload.
// Renders theme/ with LiquidJS + small Shopify shims and nanay.ca's real product data (data.json).
// usage: node tools/preview/server.mjs  ->  http://localhost:4174
import http from 'node:http';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { Liquid, Tag, Hash } from 'liquidjs';

const here = path.dirname(fileURLToPath(import.meta.url));
const T = path.resolve(here, '..', '..', 'theme');
const PORT = +process.env.PORT || 4174;
const data = JSON.parse(fs.readFileSync(path.join(here, 'data.json'), 'utf8'));
const read = f => fs.readFileSync(path.join(T, f), 'utf8');
const readJSON = f => JSON.parse(read(f).replace(/\/\*[\s\S]*?\*\//g, ''));

/* ---------- Shopify-like objects ---------- */
const img = (src, w, h, alt = '') => src ? { src, width: w || 1200, height: h || 900, aspect_ratio: (w || 4) / (h || 3), alt, preview_image: null } : null;
const cents = s => Math.round(parseFloat(s) * 100);
const products = {};
for (const p of data.products) {
  const images = p.images.map(i => ({ ...img(i.src, i.width, i.height, p.title), id: i.id }));
  images.forEach(i => i.preview_image = i);
  const variants = p.variants.map(v => ({
    id: v.id, title: v.title, price: cents(v.price), compare_at_price: v.compare_at_price ? cents(v.compare_at_price) : null,
    available: v.available, options: [v.option1, v.option2, v.option3].filter(Boolean), url: `/products/${p.handle}?variant=${v.id}`,
    featured_media: v.featured_image ? { id: v.featured_image.id, preview_image: img(v.featured_image.src, v.featured_image.width, v.featured_image.height) } : null
  }));
  const prices = variants.map(v => v.price);
  const first = variants.find(v => v.available) || variants[0];
  const media = images.map(i => ({ id: i.id, media_type: 'image', preview_image: i, alt: p.title }));
  products[p.handle] = {
    id: p.id, title: p.title, handle: p.handle, url: `/products/${p.handle}`, description: p.body_html || '', tags: p.tags,
    price: first.price, price_min: Math.min(...prices), price_max: Math.max(...prices), price_varies: Math.min(...prices) !== Math.max(...prices),
    available: variants.some(v => v.available), variants, selected_or_first_available_variant: first,
    has_only_default_variant: variants.length === 1 && variants[0].title === 'Default Title',
    options: p.options.map(o => o.name),
    options_with_values: p.options.map((o, i) => ({ name: o.name, values: o.values, selected_value: first.options[i] })),
    featured_media: media[0] || null, featured_image: images[0] || null, media, metafields: { custom: {} },
  };
}
const collections = {};
for (const c of data.collections) {
  const ps = (data.members[c.handle] || []).map(h => products[h]).filter(Boolean);
  collections[c.handle] = { id: c.id, title: c.title, handle: c.handle, url: `/collections/${c.handle}`, description: c.description || '', products: ps, products_count: ps.length, all_products_count: ps.length, image: c.image ? img(c.image.src, c.image.width, c.image.height) : null };
}
collections.all = { title: 'All', handle: 'all', url: '/collections/all', products: Object.values(products), products_count: data.products.length, all_products_count: data.products.length, description: '' };
const pageHandles = { menu: 'Menu', catering: 'Catering & events', 'how-to-order': 'How to order', about: 'About', contact: 'Contact' };
const pages = Object.fromEntries(Object.entries(pageHandles).map(([h, t]) => [h, { handle: h, title: t, url: `/pages/${h}`, content: '' }]));

/* ---------- Settings ---------- */
const settings = {};
for (const g of readJSON('config/settings_schema.json')) for (const s of g.settings || []) if ('default' in s) settings[s.id] = s.default;
Object.assign(settings, readJSON('config/settings_data.json').current);

/* ---------- Cart (in memory) ---------- */
const cart = { items: [], attributes: {}, note: '', currency: { iso_code: 'CAD' } };
const variantIndex = {};
for (const p of Object.values(products)) for (const v of p.variants) variantIndex[v.id] = { p, v };
const cartJSON = () => {
  const items = cart.items.map(it => ({ ...it, final_line_price: it.price * it.quantity }));
  return { items, item_count: items.reduce((s, i) => s + i.quantity, 0), total_price: items.reduce((s, i) => s + i.final_line_price, 0), attributes: cart.attributes, note: cart.note };
};
const cartDrop = () => { const j = cartJSON(); return { ...cart, ...j, items: j.items.map(i => ({ ...i, image: i.image ? img(i.image) : null, product: products[i.handle], variant: { title: i.variant_title } })) }; };

/* ---------- Liquid engine with Shopify shims ---------- */
const engine = new Liquid({ root: [path.join(T, 'sections'), T], partials: path.join(T, 'snippets'), extname: '.liquid', cache: false, jsTruthy: false, strictFilters: false, ownPropertyOnly: false });
const imgSrc = (o, w) => { const s = typeof o === 'string' ? o : o && (o.src || (o.preview_image && o.preview_image.src)); if (!s) return ''; return s.startsWith('/assets/') ? s : s + (s.includes('?') ? '&' : '?') + 'width=' + (w || 800); };
engine.registerFilter('image_url', (o, ...args) => { const h = Object.fromEntries(args.filter(Array.isArray)); return imgSrc(o, h.width || 800); });
engine.registerFilter('image_tag', (src, ...args) => {
  const h = Object.fromEntries(args.filter(Array.isArray));
  const attrs = Object.entries(h).filter(([k]) => !['widths', 'sizes'].includes(k) || k === 'sizes').map(([k, v]) => `${k}="${String(v).replace(/"/g, '&quot;')}"`).join(' ');
  return `<img src="${src}" ${attrs} width="1200" height="900">`;
});
engine.registerFilter('asset_url', n => '/assets/' + n);
engine.registerFilter('stylesheet_tag', u => `<link rel="stylesheet" href="${u}">`);
engine.registerFilter('preload_tag', (u, ...a) => `<link rel="preload" href="${u}" as="font" type="font/woff2" crossorigin>`);
engine.registerFilter('money', c => '$' + ((+c || 0) / 100).toLocaleString('en-CA', { minimumFractionDigits: 2, maximumFractionDigits: 2 }));
engine.registerFilter('money_without_currency', c => ((+c || 0) / 100).toFixed(2));
engine.registerFilter('t', k => k.split('.').reduce((o, x) => o && o[x], readJSON('locales/en.default.json')) || k);
engine.registerFilter('handle', s => String(s).toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, ''));
engine.registerFilter('default_errors', () => '');
engine.registerFilter('format_address', () => '');
engine.registerFilter('format_code', s => s);
engine.registerFilter('video_tag', () => '');
// Like Shopify's json filter: product.featured_media.preview_image points back at itself here, so drop repeats.
engine.registerFilter('json', v => { const seen = new WeakSet(); return JSON.stringify(v, (k, x) => { if (x && typeof x === 'object') { if (seen.has(x)) return undefined; seen.add(x); } return x; }) ?? 'null'; });
const noop = { parse() {}, *render() { return ''; } };
engine.registerTag('schema', { parse(tok, rest) { this.tpls = []; const s = this.liquid.parser.parseStream(rest); s.on('tag:endschema', () => s.stop()).on('template', () => {}).on('end', () => {}); s.start(); }, *render() { return ''; } });
engine.registerTag('layout', noop);
engine.registerTag('sections', { parse(tok) { this.name = tok.args.trim().replace(/['"]/g, ''); }, *render(ctx) { return yield renderGroup(this.name, ctx.getAll()); } });
engine.registerTag('form', {
  parse(tok, rest) {
    this.args = tok.args; this.tpls = [];
    const s = this.liquid.parser.parseStream(rest);
    s.on('tag:endform', () => s.stop()).on('template', t => this.tpls.push(t)).on('end', () => { throw new Error('form not closed'); });
    s.start();
  },
  *render(ctx, emitter) {
    const id = (this.args.match(/id:\s*'([^']+)'/) || [])[1];
    const cls = (this.args.match(/class:\s*'([^']+)'/) || [])[1];
    const add = /data-add-form/.test(this.args);
    const kind = (this.args.match(/^'(\w+)'/) || [])[1];
    const action = kind === 'product' ? '/cart/add' : '/contact';
    emitter.write(`<form method="post" action="${action}"${id ? ` id="${id}"` : ''}${cls ? ` class="${cls}"` : ''}${add ? ' data-add-form' : ''}>`);
    ctx.push({ form: { errors: null, posted_successfully: false } });
    yield this.liquid.renderer.renderTemplates(this.tpls, ctx, emitter);
    ctx.pop();
    emitter.write('</form>');
  }
});
engine.registerTag('paginate', {
  parse(tok, rest) { this.tpls = []; const s = this.liquid.parser.parseStream(rest); s.on('tag:endpaginate', () => s.stop()).on('template', t => this.tpls.push(t)).on('end', () => {}); s.start(); },
  *render(ctx, emitter) { ctx.push({ paginate: { pages: 1, parts: [] } }); yield this.liquid.renderer.renderTemplates(this.tpls, ctx, emitter); ctx.pop(); }
});

/* ---------- Sections ---------- */
const schemaOf = type => { const m = read(`sections/${type}.liquid`).match(/\{%\s*schema\s*%\}([\s\S]*?)\{%\s*endschema\s*%\}/); return m ? JSON.parse(m[1]) : {}; };
const resolve = (defs, values) => {
  const out = {};
  for (const d of defs || []) if (d.id) out[d.id] = d.default ?? '';
  Object.assign(out, values || {});
  for (const d of defs || []) {
    const v = out[d.id];
    if (d.type === 'product') out[d.id] = v ? products[v] || '' : '';
    if (d.type === 'collection') out[d.id] = v ? collections[v] || '' : '';
    if (d.type === 'product_list') out[d.id] = Array.isArray(v) && v.length ? v.map(h => products[h]).filter(Boolean) : '';
    if (d.type === 'url' && typeof v === 'string') out[d.id] = v.replace(/^shopify:\/\/(pages|products|collections)\//, '/$1/');
    if (d.type === 'link_list') out[d.id] = { links: [] };
    if (d.type === 'image_picker' || d.type === 'video') out[d.id] = '';
  }
  return out;
};
let sid = 0;
async function renderSection(type, conf, scope) {
  const schema = schemaOf(type);
  const blocks = (conf.block_order || Object.keys(conf.blocks || {})).map(k => {
    const b = conf.blocks[k]; const bs = (schema.blocks || []).find(x => x.type === b.type) || {};
    return { id: k, type: b.type, settings: resolve(bs.settings, b.settings), shopify_attributes: '' };
  });
  const section = { id: `${type}-${++sid}`, settings: resolve(schema.settings, conf.settings), blocks, shopify_attributes: '' };
  return engine.renderFile(`sections/${type}`, { ...scope, section }, { globals: scope });
}
async function renderGroup(name, scope) {
  const g = readJSON(`sections/${name}.json`);
  let html = '';
  for (const k of g.order) html += await renderSection(g.sections[k].type, g.sections[k], scope);
  return html;
}
async function renderTemplate(tpl, scope) {
  const j = readJSON(`templates/${tpl}.json`);
  let html = '';
  for (const k of j.order) html += `<div id="shopify-section-${k}">` + await renderSection(j.sections[k].type, j.sections[k], scope) + '</div>';
  return html;
}

/* ---------- Server ---------- */
const mime = { '.css': 'text/css', '.js': 'text/javascript', '.woff2': 'font/woff2', '.mp4': 'video/mp4', '.webp': 'image/webp', '.jpg': 'image/jpeg', '.png': 'image/png' };
const body = req => new Promise(r => { let b = ''; req.on('data', c => b += c); req.on('end', () => r(b)); });
http.createServer(async (req, res) => {
  const url = new URL(req.url, 'http://x');
  const p = url.pathname;
  try {
    if (p.startsWith('/assets/')) {
      const f = path.join(T, 'assets', path.basename(p));
      if (!fs.existsSync(f)) { res.writeHead(404); return res.end(); }
      res.writeHead(200, { 'Content-Type': mime[path.extname(f)] || 'application/octet-stream' }); return fs.createReadStream(f).pipe(res);
    }
    const sendJSON = o => { res.writeHead(200, { 'Content-Type': 'application/json' }); res.end(JSON.stringify(o)); };
    if (p === '/cart.js') return sendJSON(cartJSON());
    if (p === '/cart/add.js') {
      const { items } = JSON.parse(await body(req));
      for (const it of items) {
        const hit = variantIndex[it.id]; if (!hit) { res.writeHead(422); return res.end(JSON.stringify({ description: 'Variant not found' })); }
        const ex = cart.items.find(x => x.variant_id === it.id);
        if (ex) ex.quantity += it.quantity || 1;
        else cart.items.push({ variant_id: it.id, quantity: it.quantity || 1, price: hit.v.price, product_title: hit.p.title, variant_title: hit.v.title, product_has_only_default_variant: hit.p.has_only_default_variant, url: hit.v.url, image: hit.p.featured_image && imgSrc(hit.p.featured_image, 160), handle: hit.p.handle });
      }
      return sendJSON({ items });
    }
    if (p === '/cart/change.js') { const { line, quantity } = JSON.parse(await body(req)); if (quantity <= 0) cart.items.splice(line - 1, 1); else cart.items[line - 1].quantity = quantity; return sendJSON(cartJSON()); }
    if (p === '/cart/update.js') { const b = JSON.parse(await body(req)); Object.assign(cart.attributes, b.attributes || {}); if ('note' in b) cart.note = b.note; return sendJSON(cartJSON()); }

    let tpl, page_type, extra = {};
    const m = p.match(/^\/(pages|products|collections)\/([^/]+)/);
    if (p === '/') { tpl = 'index'; page_type = 'index'; }
    else if (m && m[1] === 'pages' && pages[m[2]]) { tpl = fs.existsSync(path.join(T, `templates/page.${m[2]}.json`)) ? `page.${m[2]}` : 'page'; page_type = 'page'; extra.page = pages[m[2]]; }
    else if (m && m[1] === 'products' && products[m[2]]) { tpl = 'product'; page_type = 'product'; extra.product = products[m[2]]; }
    else if (m && m[1] === 'collections' && collections[m[2]]) { tpl = 'collection'; page_type = 'collection'; extra.collection = collections[m[2]]; }
    else if (p === '/cart') { tpl = 'cart'; page_type = 'cart'; }
    else { tpl = '404'; page_type = '404'; res.statusCode = 404; }

    const scope = {
      settings, collections, pages, all_products: products, linklists: {}, cart: cartDrop(), customer: null,
      shop: { name: 'Nanay', url: 'http://localhost:' + PORT, money_format: '${{amount}}', customer_accounts_enabled: true, policies: [], checkout: {} },
      routes: { root_url: '/', cart_url: '/cart', cart_add_url: '/cart/add', cart_change_url: '/cart/change', cart_update_url: '/cart/update', search_url: '/search', account_url: '/account', account_login_url: '/account/login', account_register_url: '/account/register', all_products_collection_url: '/collections/all', collections_url: '/collections', product_recommendations_url: '/recommendations/products' },
      request: { page_type, locale: { iso_code: 'en' }, design_mode: false },
      template: { name: page_type, suffix: tpl.includes('.') ? tpl.split('.')[1] : null },
      canonical_url: 'http://localhost:' + PORT + p, page_title: extra.product?.title || extra.collection?.title || extra.page?.title || 'Nanay', page_description: '',
      content_for_header: '', recommendations: { performed: false }, ...extra,
    };
    scope.content_for_layout = await renderTemplate(tpl, scope);
    const html = await engine.renderFile('layout/theme', scope, { globals: scope });
    res.setHeader('Content-Type', 'text/html; charset=utf-8'); res.end(html);
  } catch (e) {
    console.error(e); res.writeHead(500, { 'Content-Type': 'text/plain' }); res.end(String(e && e.stack || e));
  }
}).listen(PORT, () => console.log('Nanay theme preview on http://localhost:' + PORT));
