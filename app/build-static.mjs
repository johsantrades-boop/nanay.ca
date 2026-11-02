// Renders the website to plain files in app/static-build for Vercel.
// Uses the menu the admin saved (app/content/menu.json), or the seed menu before the first save.
// Usage: node app/build-static.mjs
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { renderPage } from './lib/site.mjs';

const ROOT = path.dirname(fileURLToPath(import.meta.url));
const OUT = path.join(ROOT, 'static-build');
const CONTENT = path.join(ROOT, 'content');
const HOST = process.env.SITE_HOST || process.env.VERCEL_PROJECT_PRODUCTION_URL || 'nanay.ca';

const menuFile = fs.existsSync(path.join(CONTENT, 'menu.json')) ? path.join(CONTENT, 'menu.json') : path.join(ROOT, 'seed', 'menu.json');
const data = JSON.parse(fs.readFileSync(menuFile, 'utf8'));

fs.rmSync(OUT, { recursive: true, force: true });
fs.cpSync(path.join(ROOT, 'public'), OUT, { recursive: true });
if (fs.existsSync(path.join(CONTENT, 'uploads'))) fs.cpSync(path.join(CONTENT, 'uploads'), path.join(OUT, 'uploads'), { recursive: true });
fs.writeFileSync(path.join(OUT, 'index.html'), renderPage(data, `https://${HOST}`));
fs.copyFileSync(path.join(ROOT, 'views', 'admin.html'), path.join(OUT, 'admin.html'));
fs.writeFileSync(path.join(OUT, 'robots.txt'), 'User-agent: *\nDisallow: /admin\nDisallow: /api/\n');
console.log(`Built ${path.relative(process.cwd(), OUT)} from ${path.relative(process.cwd(), menuFile)} for https://${HOST}`);
