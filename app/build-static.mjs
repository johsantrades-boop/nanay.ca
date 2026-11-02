// Renders the website to plain files in app/static-build for static hosts (Vercel).
// The admin panel needs the running server, so it is not part of this build.
// Usage: node app/build-static.mjs
import { spawn } from 'node:child_process';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const ROOT = path.dirname(fileURLToPath(import.meta.url));
const OUT = path.join(ROOT, 'static-build');
const PORT = 4199;
const HOST = process.env.SITE_HOST || process.env.VERCEL_PROJECT_PRODUCTION_URL || 'nanay.ca';

// A throwaway data folder, so the page is built from app/seed/menu.json
const dataDir = fs.mkdtempSync(path.join(os.tmpdir(), 'nanay-build-'));
const server = spawn(process.execPath, [path.join(ROOT, 'server.mjs')], {
  env: { ...process.env, PORT: String(PORT), NANAY_DATA_DIR: dataDir, NANAY_ADMIN_PASSWORD: 'build-only-' + Date.now() },
  stdio: 'ignore',
});

try {
  let html;
  for (let i = 0; i < 50 && !html; i++) {
    await new Promise(r => setTimeout(r, 100));
    html = await fetch(`http://127.0.0.1:${PORT}/`, { headers: { Host: HOST, 'X-Forwarded-Proto': 'https' } })
      .then(r => (r.ok ? r.text() : null)).catch(() => null);
  }
  if (!html) throw new Error('The server did not start');

  fs.rmSync(OUT, { recursive: true, force: true });
  fs.cpSync(path.join(ROOT, 'public'), OUT, { recursive: true });
  fs.writeFileSync(path.join(OUT, 'index.html'), html);
  fs.writeFileSync(path.join(OUT, 'robots.txt'), 'User-agent: *\nAllow: /\n');
  console.log(`Built ${OUT} for https://${HOST}`);
} finally {
  server.kill();
  fs.rmSync(dataDir, { recursive: true, force: true });
}
