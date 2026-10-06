import { test, expect } from '@playwright/test';
import { CHEESE_ID, telegram } from './fixtures';

test.beforeEach(async ({ request, page }) => {
  await request.post('http://127.0.0.1:4301/__test/reset');
  await telegram(page);
});

test('loads through one Telegram handshake; search, details and color selection work', async ({
  page,
}) => {
  let sessions = 0;
  const errors: string[] = [];
  page.on('request', (request) => {
    if (request.url().endsWith('/api/session')) sessions++;
  });
  page.on('pageerror', (error) => {
    errors.push(error.message);
  });
  await page.goto('/');
  await expect(page.getByRole('heading', { name: 'Shoppa' })).toBeVisible();
  await expect(
    page.getByRole('list', { name: 'Products', exact: true }).getByRole('listitem'),
  ).toHaveCount(8);
  expect(sessions).toBe(1);
  await page.getByRole('textbox', { name: 'Search products' }).fill('  CHEE ');
  await expect(
    page.getByRole('list', { name: 'Products', exact: true }).getByRole('listitem'),
  ).toHaveCount(1);
  await page.getByRole('link', { name: 'View details for Cheese' }).click();
  await expect(page.getByRole('dialog')).toBeVisible();
  await page.getByRole('button', { name: 'Color', exact: true }).click();
  await page.getByRole('button', { name: 'Purple color' }).click();
  await page.getByRole('button', { name: 'Save', exact: true }).click();
  await expect(page.getByRole('heading', { name: 'Cheese' })).toBeVisible();
  await page.getByRole('button', { name: 'Close item details' }).click();
  expect(errors).toEqual([]);
});

test('moves only after three seconds, supports undo, and returns bought products', async ({
  page,
}) => {
  await page.goto('/');
  await page.getByRole('button', { name: 'Add Cheese to cart', exact: true }).click();
  await expect(page.getByRole('button', { name: 'Undo move of Cheese' })).toBeVisible();
  const before = await page.request.get('/api/shopping-list');
  expect(await before.json()).toEqual({ items: [] });
  await page.getByRole('button', { name: 'Undo move of Cheese' }).click();
  await expect(page.getByRole('button', { name: 'Add Cheese to cart', exact: true })).toBeVisible();
  await page.getByRole('button', { name: 'Add Cheese to cart', exact: true }).click();
  await expect(page.getByRole('button', { name: 'Undo move of Cheese' })).toBeHidden({
    timeout: 7000,
  });
  await page.getByRole('link', { name: 'Open cart' }).click();
  await page.getByRole('button', { name: 'Remove Cheese from cart' }).click();
  await expect(page.getByRole('heading', { name: 'Cart is empty' })).toBeVisible({ timeout: 7000 });
  await page.getByRole('link', { name: 'Back to list' }).click();
  await expect(page.getByRole('button', { name: 'Add Cheese to cart', exact: true })).toBeVisible();
});

test('creates, edits, favourites and deletes a product', async ({ page }) => {
  await page.goto('/');
  await page.getByRole('textbox', { name: 'Search products' }).fill('Kombucha');
  await expect(page.getByText('No products found.')).toBeVisible();
  await page.getByRole('link', { name: 'Create a new product' }).click();
  await expect(page.getByRole('textbox', { name: 'Product name' })).toHaveValue('Kombucha');
  await page.getByRole('button', { name: 'Purple color' }).click();
  await page.getByRole('button', { name: 'Add to Frequent' }).click();
  await page.getByRole('button', { name: 'Add to list' }).click();
  await expect(page.getByRole('button', { name: 'Add frequent Kombucha to cart' })).toBeVisible();
  await page.getByRole('link', { name: 'View details for Kombucha' }).click();
  await page.getByRole('link', { name: 'Edit name' }).click();
  await page.getByRole('textbox', { name: 'Product name' }).fill('Green tea');
  await page.getByRole('button', { name: 'Save changes' }).click();
  await page.getByRole('link', { name: 'View details for Green tea' }).click();
  await page.getByRole('button', { name: 'Delete product', exact: true }).click();
  await page.getByRole('button', { name: 'Keep product' }).click();
  await expect(page.getByRole('heading', { name: 'Green tea' })).toBeVisible();
  await page.getByRole('button', { name: 'Delete product', exact: true }).click();
  await page.getByRole('button', { name: 'Delete product', exact: true }).click();
  await expect(page.getByRole('dialog')).toBeHidden();
  await expect(
    page.getByRole('button', { name: 'Add Green tea to cart', exact: true }),
  ).toBeHidden();
});

test('syncs two independent users through real SSE and keeps favourites personal', async ({
  page,
  browser,
}) => {
  const otherContext = await browser.newContext();
  const other = await otherContext.newPage();
  await telegram(other, 43);
  await page.goto('/');
  await other.goto('http://127.0.0.1:4173/');
  await expect(page.getByRole('region', { name: 'Frequent products' })).toBeVisible();
  await expect(
    other.getByRole('button', { name: 'Add Cheese to cart', exact: true }),
  ).toBeVisible();
  await expect(other.getByRole('region', { name: 'Frequent products' })).toBeHidden();
  await page.getByRole('button', { name: 'Add Cheese to cart', exact: true }).click();
  await expect(
    other.getByRole('button', { name: 'Add Cheese to cart', exact: true }),
  ).toBeVisible();
  await expect(other.getByRole('button', { name: 'Add Cheese to cart', exact: true })).toBeHidden({
    timeout: 7000,
  });
  await other.getByRole('link', { name: 'Open cart' }).click();
  await expect(other.getByRole('button', { name: 'Remove Cheese from cart' })).toBeVisible();
  await otherContext.close();
});

test('a server failure restores the row and exposes a retryable error', async ({ page }) => {
  await page.goto('/');
  await page.route(`**/api/shopping-list/${CHEESE_ID}`, async (route) => {
    await route.fulfill({ status: 503, json: { error: 'unavailable' } });
  });
  await page.getByRole('button', { name: 'Add Cheese to cart', exact: true }).click();
  await expect(page.getByRole('alert')).toContainText('Could not move Cheese', { timeout: 7000 });
  await expect(page.getByRole('button', { name: 'Add Cheese to cart', exact: true })).toBeVisible();
});

test('clear cart allows individual undo and survives navigation', async ({ page }) => {
  await page.goto('/');
  await expect(page.getByRole('button', { name: 'Add Cheese to cart', exact: true })).toBeVisible();
  await page.request.put(`/api/shopping-list/${CHEESE_ID}`);
  await page.request.put('/api/shopping-list/00000000-0000-4000-8000-000000000002');
  await page.getByRole('link', { name: 'Open cart' }).click();
  await expect(page.getByRole('listitem')).toHaveCount(2);
  await page.getByRole('button', { name: 'Clear cart' }).click();
  await page.getByRole('button', { name: 'Undo move of Cheese' }).click();
  await page.getByRole('link', { name: 'Back to list' }).click();
  await page.getByRole('link', { name: 'Open cart' }).click();
  await expect(page.getByRole('listitem')).toHaveCount(1, { timeout: 7000 });
  await expect(page.getByRole('button', { name: 'Remove Cheese from cart' })).toBeVisible();
});

test('reconnect refreshes missed updates', async ({ page, context, request }) => {
  await page.goto('/');
  await expect(page.getByRole('button', { name: 'Add Cheese to cart', exact: true })).toBeVisible();
  const cookies = await context.cookies();
  await context.setOffline(true);
  await request.put(`http://127.0.0.1:4301/api/shopping-list/${CHEESE_ID}`, {
    headers: { Cookie: cookies.map((cookie) => `${cookie.name}=${cookie.value}`).join('; ') },
  });
  await context.setOffline(false);
  await expect(page.getByRole('button', { name: 'Add Cheese to cart', exact: true })).toBeHidden({
    timeout: 10000,
  });
});

test('responsive layout and long names do not overflow', async ({ page }, testInfo) => {
  await page.goto('/');
  await expect(page.getByRole('button', { name: 'Add Cheese to cart', exact: true })).toBeVisible();
  await page.screenshot({ path: testInfo.outputPath('main.png'), fullPage: true });
  for (const width of [320, 390, 430]) {
    await page.setViewportSize({ width, height: 844 });
    expect(
      await page.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth),
    ).toBe(true);
    await expect(page.getByRole('link', { name: 'Add product' })).toBeInViewport();
  }
  await page.getByRole('link', { name: 'Add product' }).click();
  await page.getByRole('textbox', { name: 'Product name' }).fill('A'.repeat(120));
  await page.getByRole('button', { name: 'Add to list' }).click();
  expect(await page.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth)).toBe(
    true,
  );
});

test('does not bypass Telegram authentication in a regular browser', async ({ page }) => {
  await page.unroute('https://telegram.org/js/telegram-web-app.js');
  await page.route('https://telegram.org/js/telegram-web-app.js', async (route) => {
    await route.fulfill({ body: '', contentType: 'application/javascript' });
  });
  await page.goto('/');
  await expect(page.getByRole('heading', { name: 'Open Shoppa in Telegram' })).toBeVisible();
});

test('a failed session handshake is shown as a load error and can be retried', async ({ page }) => {
  await page.route('**/api/session', async (route) => {
    await route.fulfill({ status: 503, json: { error: 'unavailable' } });
  });
  await page.goto('/');
  await expect(page.getByRole('alert')).toHaveText('Could not load your products.');
  await page.unroute('**/api/session');
  await page.getByRole('button', { name: 'Try again' }).click();
  await expect(page.getByRole('button', { name: 'Add Cheese to cart', exact: true })).toBeVisible();
});

test('cancelling and immediately restarting does not send an older timer', async ({ page }) => {
  await page.goto('/');
  await expect(page.getByRole('button', { name: 'Add Cheese to cart', exact: true })).toBeVisible();
  await page.clock.install();
  let writes = 0;
  page.on('request', (request) => {
    if (request.method() === 'PUT' && request.url().endsWith(`/api/shopping-list/${CHEESE_ID}`))
      writes++;
  });
  await page.getByRole('button', { name: 'Add Cheese to cart', exact: true }).click();
  await page.clock.fastForward(1000);
  await page.getByRole('button', { name: 'Undo move of Cheese' }).click();
  await page.getByRole('button', { name: 'Add Cheese to cart', exact: true }).click();
  await page.clock.fastForward(2100);
  expect(writes).toBe(0);
  await page.clock.fastForward(1000);
  await expect.poll(() => writes).toBe(1);
});
