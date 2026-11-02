// Runs Shopify's Theme Check (the same checks as `shopify theme check`) on ../theme.
// usage: node tools/check.mjs
import { themeCheckRun } from '@shopify/theme-check-node';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..', 'theme');
const { offenses } = await themeCheckRun(root, undefined, () => {});
const sev = ['error', 'warning', 'info'];
for (const o of offenses.sort((a, b) => a.severity - b.severity || a.uri.localeCompare(b.uri))) {
  const file = decodeURIComponent(o.uri).replace(/^.*?\/theme\//, '');
  console.log(`${sev[o.severity] ?? o.severity}\t${file}:${(o.start?.line ?? 0) + 1}\t${o.check}\t${o.message}`);
}
const counts = offenses.reduce((m, o) => (m[sev[o.severity]] = (m[sev[o.severity]] || 0) + 1, m), {});
console.log('\nTotal:', offenses.length, counts);
