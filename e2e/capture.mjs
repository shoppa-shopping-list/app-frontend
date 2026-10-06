import { readFile, mkdtemp, writeFile, rm } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { pathToFileURL } from 'node:url';
import { gunzipSync } from 'node:zlib';
import { chromium } from '@playwright/test';
import { initData } from './fixtures.ts';
const reference = process.argv[2];
if (!reference) throw new Error('Pass the original Shoppa HTML file as the first argument.');
const source = await readFile(reference, 'utf8');
const manifestMatch = source.match(/<script type="__bundler\/manifest">([\s\S]*?)<\/script>/);
if (!manifestMatch) throw new Error('Reference bundle manifest is missing');
const manifest = JSON.parse(manifestMatch[1]);
const directory = await mkdtemp(join(tmpdir(), 'shoppa-reference-'));
let index = 0;
for (const asset of Object.values(manifest)) {
  if (asset.mime !== 'text/html') continue;
  const bytes = Buffer.from(asset.data, 'base64');
  await writeFile(join(directory, `${index++}.html`), asset.compressed ? gunzipSync(bytes) : bytes);
}
const browser = await chromium.launch();
const context = await browser.newContext({
  viewport: { width: 390, height: 844 },
  deviceScaleFactor: 1,
});
const page = await context.newPage();
await page.route('https://telegram.org/js/telegram-web-app.js', (route) =>
  route.fulfill({ contentType: 'application/javascript', body: '' }),
);
await context.request.post('http://127.0.0.1:4301/__test/reset');
await context.request.post('http://127.0.0.1:4173/api/session', {
  headers: { Authorization: `tma ${initData()}` },
});
await page.goto(pathToFileURL(join(directory, '0.html')).href);
await page.getByRole('heading', { name: 'Shoppa' }).waitFor();
await page.screenshot({ path: 'docs/screenshots/reference-main.png' });
await page.goto(pathToFileURL(join(directory, '1.html')).href);
await page.getByRole('heading', { name: 'Yogurt' }).waitFor();
await page.screenshot({ path: 'docs/screenshots/reference-details.png' });
await page.goto(pathToFileURL(join(directory, '4.html')).href);
await page.getByText('New product', { exact: true }).waitFor();
await page.screenshot({ path: 'docs/screenshots/reference-new.png' });
await page.goto('http://127.0.0.1:4173/');
await page.getByRole('button', { name: 'Add Cheese to cart', exact: true }).waitFor();
await page.screenshot({ path: 'docs/screenshots/main.png' });
await page.getByRole('button', { name: 'Add Cheese to cart', exact: true }).click();
await page.getByRole('button', { name: 'Undo move of Cheese' }).evaluate((button) => {
  for (const animation of button.getAnimations({ subtree: true })) {
    animation.pause();
    animation.currentTime = 1500;
  }
});
await page.screenshot({ path: 'docs/screenshots/transfer.png' });
await page.getByRole('button', { name: 'Undo move of Cheese' }).click();
await page.getByRole('textbox', { name: 'Search products' }).fill('chee');
await page
  .getByRole('button', { name: 'Add Tomatoes to cart', exact: true })
  .waitFor({ state: 'hidden' });
await page.screenshot({ path: 'docs/screenshots/search.png' });
await page.getByRole('button', { name: 'Clear search' }).click();

await page.getByRole('link', { name: 'View details for Yogurt' }).click();
await page.getByRole('dialog').waitFor();
await page.screenshot({ path: 'docs/screenshots/details.png', animations: 'disabled' });
await page.getByRole('button', { name: 'Close item details' }).click();
await page.getByRole('link', { name: 'Add product' }).click();
await page.getByRole('textbox', { name: 'Product name' }).fill('Kombucha');
await page.getByRole('button', { name: 'Purple color' }).click();
await page.getByRole('button', { name: 'Add to Frequent' }).click();
await page.screenshot({ path: 'docs/screenshots/new.png' });
await page.goto('http://127.0.0.1:4173/cart');
await page.getByRole('heading', { name: 'Cart is empty' }).waitFor();
await page.screenshot({ path: 'docs/screenshots/empty-cart.png' });
await browser.close();

await rm(directory, { recursive: true });
