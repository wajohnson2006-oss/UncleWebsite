import puppeteer from 'puppeteer';
import { readdirSync, existsSync, mkdirSync } from 'fs';
import { join } from 'path';

const url = process.argv[2] || 'http://localhost:3000';
const label = process.argv[3] || '';
const dir = './temporary screenshots';

if (!existsSync(dir)) mkdirSync(dir, { recursive: true });

const existing = readdirSync(dir).filter(f => f.startsWith('screenshot-'));
const nums = existing.map(f => parseInt(f.match(/screenshot-(\d+)/)?.[1] || '0'));
const next = nums.length ? Math.max(...nums) + 1 : 1;
const filename = label ? `screenshot-${next}-${label}.png` : `screenshot-${next}.png`;

const browser = await puppeteer.launch({ headless: true, args: ['--no-sandbox'] });
const page = await browser.newPage();
await page.setViewport({ width: 1440, height: 900 });
await page.goto(url, { waitUntil: 'networkidle0', timeout: 30000 });
// Scroll through the page to trigger all reveal animations
await page.evaluate(async () => {
  const totalHeight = document.body.scrollHeight;
  const step = 400;
  for (let y = 0; y <= totalHeight; y += step) {
    window.scrollTo(0, y);
    await new Promise(r => setTimeout(r, 150));
  }
  window.scrollTo(0, 0);
  await new Promise(r => setTimeout(r, 500));
});

// If "section" arg given, clip to that viewport area
const section = process.argv[4];
if (section && !isNaN(parseInt(section))) {
  await page.screenshot({ path: join(dir, filename), clip: { x: 0, y: parseInt(section), width: 1440, height: 900 } });
} else if (section === 'top') {
  await page.screenshot({ path: join(dir, filename), clip: { x: 0, y: 0, width: 1440, height: 900 } });
} else {
  await page.screenshot({ path: join(dir, filename), fullPage: true });
}
console.log(`Screenshot saved: ${join(dir, filename)}`);
await browser.close();
