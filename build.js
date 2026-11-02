// Builds a deployable copy of site/ into dist/nanaykitchen with the live URL filled in.
// usage: node build.js https://nanaykitchen.vercel.app
const fs = require('fs');
const path = require('path');
const url = (process.argv[2] || '').replace(/\/$/, '');
if (!/^https:\/\//.test(url)) { console.error('Pass the site URL, e.g. node build.js https://nanaykitchen.vercel.app'); process.exit(1); }
const src = path.join(__dirname, 'site');
const out = path.join(__dirname, 'dist', 'nanaykitchen');
fs.rmSync(out, { recursive: true, force: true });
fs.cpSync(src, out, { recursive: true, filter: f => !/og-source\.html$/.test(f) });
const idx = path.join(out, 'index.html');
fs.writeFileSync(idx, fs.readFileSync(idx, 'utf8').replaceAll('%%SITE_URL%%', url));
fs.writeFileSync(path.join(out, 'robots.txt'), `User-agent: *\nAllow: /\nSitemap: ${url}/sitemap.xml\n`);
fs.writeFileSync(path.join(out, 'sitemap.xml'), `<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9"><url><loc>${url}/</loc><lastmod>${new Date().toISOString().slice(0, 10)}</lastmod></url></urlset>\n`);
fs.writeFileSync(path.join(out, 'vercel.json'), JSON.stringify({
  headers: [
    { source: '/media/(.*)', headers: [{ key: 'Cache-Control', value: 'public, max-age=31536000, immutable' }] },
    { source: '/fonts/(.*)', headers: [{ key: 'Cache-Control', value: 'public, max-age=31536000, immutable' }] },
    { source: '/(.*)\\.(png|svg|jpg|webmanifest)', headers: [{ key: 'Cache-Control', value: 'public, max-age=604800' }] },
  ],
}, null, 2));
console.log('built', out);
