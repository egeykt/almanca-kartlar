// Usage: node render.mjs [@hesap_adi] [id ...]  → kartlar/NN.png
import { chromium } from 'playwright';
import { readFileSync, mkdirSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
const dir = fileURLToPath(new URL('.', import.meta.url));
const items = JSON.parse(readFileSync(dir + 'hatalar.json', 'utf8'));
const [handle = '@turkce_dusunme', ...ids] = process.argv.slice(2);
const pick = ids.length ? items.filter(x => ids.includes(String(x.id))) : items;
mkdirSync(dir + 'kartlar', { recursive: true });
const browser = await chromium.launch({ executablePath: process.env.CHROMIUM_PATH || '/opt/pw-browsers/chromium' });
const page = await browser.newPage({ viewport: { width: 1080, height: 1350 } });
await page.goto('file://' + dir + 'sablon.html');
await page.evaluate(() => document.fonts.ready);
for (const x of pick) {
  await page.evaluate(([x, h]) => window.fill(x, h), [x, handle]);
  await page.screenshot({ path: dir + 'kartlar/' + String(x.id).padStart(2, '0') + '.png' });
}
await browser.close();
console.log(pick.length + ' kart üretildi');
