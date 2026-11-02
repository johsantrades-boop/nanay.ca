// Saves nanay.ca's public product + collection data for the local preview (tools/preview/data.json).
import fs from 'node:fs';
const base = 'https://nanay.ca';
const get = async u => { const r = await fetch(base + u, { headers: { 'User-Agent': 'Mozilla/5.0 (preview)' } }); if (!r.ok) throw new Error(u + ' ' + r.status); return r.json(); };
const products = (await get('/products.json?limit=250')).products;
const collections = (await get('/collections.json?limit=250')).collections;
const members = {};
for (const c of collections) {
  members[c.handle] = (await get(`/collections/${c.handle}/products.json?limit=250`)).products.map(p => p.handle);
  await new Promise(r => setTimeout(r, 400));
}
fs.writeFileSync(new URL('./data.json', import.meta.url), JSON.stringify({ products, collections, members }, null, 1));
console.log('products', products.length, 'collections', collections.length);
