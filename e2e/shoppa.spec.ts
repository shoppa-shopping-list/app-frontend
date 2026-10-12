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

test('a server failure keeps an addition saved until retry', async ({ page }) => {
  await page.goto('/');
  await page.route(`**/api/shopping-list/${CHEESE_ID}`, async (route) => {
    await route.fulfill({ status: 503, json: { error: 'unavailable' } });
  });
  await page.getByRole('button', { name: 'Add Cheese to cart', exact: true }).click();
  await expect(page.getByText('Changes saved on this device. Waiting to sync.')).toBeVisible({
    timeout: 7000,
  });
  await page.getByRole('link', { name: 'Open cart' }).click();
  await expect(page.getByRole('button', { name: 'Remove Cheese from cart' })).toBeVisible();
  await page.unroute(`**/api/shopping-list/${CHEESE_ID}`);
  await page.getByRole('button', { name: 'Retry', exact: true }).click();
  await expect(page.getByText('Changes saved on this device. Waiting to sync.')).toBeHidden();
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

test('offline cart removal is durable, supports undo and preserves another user’s additions', async ({
  page,
  context,
  request,
}, testInfo) => {
  await page.goto('/');
  await expect(page.getByRole('button', { name: 'Add Cheese to cart', exact: true })).toBeVisible();
  await page.request.put(`/api/shopping-list/${CHEESE_ID}`);
  await page.getByRole('link', { name: 'Open cart' }).click();
  await expect(page.getByRole('button', { name: 'Remove Cheese from cart' })).toBeVisible();
  const cookies = await context.cookies();
  const headers = { Cookie: cookies.map((cookie) => `${cookie.name}=${cookie.value}`).join('; ') };
  await context.setOffline(true);
  await expect(page.getByRole('button', { name: 'Remove Cheese from cart' })).toBeVisible();
  await page.getByRole('button', { name: 'Remove Cheese from cart' }).click();
  await page.getByRole('button', { name: 'Undo move of Cheese' }).click();
  await expect(page.getByRole('button', { name: 'Remove Cheese from cart' })).toBeVisible();
  await page.getByRole('button', { name: 'Remove Cheese from cart' }).click();
  await expect(page.getByRole('heading', { name: 'Cart is empty' })).toBeVisible({ timeout: 7000 });
  await expect(page.getByText('Changes saved on this device. Waiting to sync.')).toBeVisible();
  await page.evaluate(() => {
    window.scrollTo(0, 0);
  });
  await page.screenshot({ path: testInfo.outputPath('offline-cart.png'), fullPage: true });
  const serverCart = await request.get('http://127.0.0.1:4301/api/shopping-list', { headers });
  expect(await serverCart.json()).toMatchObject({ items: [{ productId: CHEESE_ID }] });
  await request.put(
    'http://127.0.0.1:4301/api/shopping-list/00000000-0000-4000-8000-000000000002',
    { headers },
  );
  // Reload the frontend with API unavailable: this tests persistence, not Telegram's launcher.
  await page.route('http://127.0.0.1:4173/api/**', (route) => route.abort());
  await context.setOffline(false);
  await page.reload();
  await expect(page.getByRole('heading', { name: 'Cart is empty' })).toBeVisible();
  await expect(page.getByText('Changes saved on this device. Waiting to sync.')).toBeVisible();
  await page.unroute('http://127.0.0.1:4173/api/**');
  await page.getByRole('button', { name: 'Retry', exact: true }).click();
  await expect(page.getByText('Changes saved on this device. Waiting to sync.')).toBeHidden({
    timeout: 10000,
  });
  await expect(page.getByRole('button', { name: 'Remove Yogurt from cart' })).toBeVisible();
  await expect(page.getByRole('button', { name: 'Remove Cheese from cart' })).toBeHidden();
  const finalCart = await request.get('http://127.0.0.1:4301/api/shopping-list', { headers });
  expect(await finalCart.json()).toMatchObject({
    items: [{ productId: '00000000-0000-4000-8000-000000000002' }],
  });
});

test('failed deletion stays queued until the server recovers without an online event', async ({
  page,
}) => {
  await page.goto('/');
  await expect(page.getByRole('button', { name: 'Add Cheese to cart', exact: true })).toBeVisible();
  await page.request.put(`/api/shopping-list/${CHEESE_ID}`);
  await page.getByRole('link', { name: 'Open cart' }).click();
  await page.route(`**/api/shopping-list/${CHEESE_ID}`, (route) =>
    route.fulfill({ status: 503, json: { error: 'unavailable' } }),
  );
  await page.getByRole('button', { name: 'Remove Cheese from cart' }).click();
  await expect(page.getByRole('heading', { name: 'Cart is empty' })).toBeVisible({ timeout: 7000 });
  await expect(page.getByText('Changes saved on this device. Waiting to sync.')).toBeVisible();
  await page.unroute(`**/api/shopping-list/${CHEESE_ID}`);
  await expect(page.getByText('Changes saved on this device. Waiting to sync.')).toBeHidden({
    timeout: 20000,
  });
  const cart = await page.request.get('/api/shopping-list');
  expect(await cart.json()).toEqual({ items: [] });
});

test('storage failure leaves the item in the cart with an explicit error', async ({ page }) => {
  await page.goto('/');
  await expect(page.getByRole('button', { name: 'Add Cheese to cart', exact: true })).toBeVisible();
  await page.request.put(`/api/shopping-list/${CHEESE_ID}`);
  await page.getByRole('link', { name: 'Open cart' }).click();
  await page.evaluate(() => {
    Storage.prototype.setItem = () => {
      throw new DOMException('Storage full', 'QuotaExceededError');
    };
  });
  await page.getByRole('button', { name: 'Remove Cheese from cart' }).click();
  await expect(page.getByRole('alert')).toContainText('Could not save on this device', {
    timeout: 7000,
  });
  await expect(page.getByRole('button', { name: 'Remove Cheese from cart' })).toBeVisible();
});

test('offline clear cart syncs automatically when connectivity returns', async ({
  page,
  context,
}) => {
  await page.goto('/');
  await expect(page.getByRole('button', { name: 'Add Cheese to cart', exact: true })).toBeVisible();
  await page.request.put(`/api/shopping-list/${CHEESE_ID}`);
  await page.request.put('/api/shopping-list/00000000-0000-4000-8000-000000000002');
  await page.getByRole('link', { name: 'Open cart' }).click();
  await expect(page.getByRole('listitem')).toHaveCount(2);
  await context.setOffline(true);
  await page.getByRole('button', { name: 'Clear cart' }).click();
  await expect(page.getByRole('heading', { name: 'Cart is empty' })).toBeVisible({ timeout: 7000 });
  await expect(page.getByText('Changes saved on this device. Waiting to sync.')).toBeVisible();
  await context.setOffline(false);
  await expect(page.getByText('Changes saved on this device. Waiting to sync.')).toBeHidden({
    timeout: 10000,
  });
  const cart = await page.request.get('/api/shopping-list');
  expect(await cart.json()).toEqual({ items: [] });
});

test('offline additions can be removed and added again, survive reload and sync the final choice', async ({
  page,
  context,
}) => {
  test.setTimeout(45000);
  await page.goto('/');
  const add = page.getByRole('button', { name: 'Add Cheese to cart', exact: true });
  await expect(add).toBeVisible();
  await context.setOffline(true);
  await add.click();
  await page.getByRole('button', { name: 'Undo move of Cheese' }).click();
  await expect(add).toBeVisible();
  await add.click();
  await expect(add).toBeHidden({ timeout: 7000 });
  await page.getByRole('link', { name: 'Open cart' }).click();
  await page.getByRole('button', { name: 'Remove Cheese from cart' }).click();
  await expect(page.getByRole('heading', { name: 'Cart is empty' })).toBeVisible({ timeout: 7000 });
  await page.getByRole('link', { name: 'Back to list' }).click();
  await add.click();
  await expect(add).toBeHidden({ timeout: 7000 });
  await page.getByRole('button', { name: 'Add Yogurt to cart', exact: true }).click();
  await expect(page.getByRole('button', { name: 'Undo move of Yogurt' })).toBeHidden({
    timeout: 7000,
  });
  await page.getByRole('link', { name: 'Open cart' }).click();
  await page.getByRole('button', { name: 'Remove Yogurt from cart' }).click();
  await expect(page.getByRole('button', { name: 'Undo move of Yogurt' })).toBeHidden({
    timeout: 7000,
  });
  await page.route('http://127.0.0.1:4173/api/**', (route) => route.abort());
  await context.setOffline(false);
  await page.reload();
  await expect(page.getByRole('button', { name: 'Remove Cheese from cart' })).toBeVisible();
  await expect(page.getByRole('listitem')).toHaveCount(1);
  await page.unroute('http://127.0.0.1:4173/api/**');
  await page.getByRole('button', { name: 'Retry', exact: true }).click();
  await expect(page.getByText('Changes saved on this device. Waiting to sync.')).toBeHidden();
  const result = await page.request.get('/api/shopping-list');
  expect(await result.json()).toMatchObject({ items: [{ productId: CHEESE_ID }] });
});

test('older Telegram clients retain offline cart support through browser storage', async ({
  page,
  context,
}) => {
  await telegram(page, 42, false);
  await page.goto('/');
  await expect(page.getByRole('button', { name: 'Add Cheese to cart', exact: true })).toBeVisible();
  await context.setOffline(true);
  await page.getByRole('button', { name: 'Add Cheese to cart', exact: true }).click();
  await expect(page.getByRole('button', { name: 'Undo move of Cheese' })).toBeHidden({
    timeout: 7000,
  });
  await page.getByRole('link', { name: 'Open cart' }).click();
  await expect(page.getByRole('button', { name: 'Remove Cheese from cart' })).toBeVisible();
  await context.setOffline(false);
  await expect(page.getByText('Changes saved on this device. Waiting to sync.')).toBeHidden({
    timeout: 10000,
  });
  const cart = await page.request.get('/api/shopping-list');
  expect(await cart.json()).toMatchObject({ items: [{ productId: CHEESE_ID }] });
});

test('cart indicator, circle trail, text focus and favourite disintegration', async ({
  page,
}, testInfo) => {
  await page.goto('/');
  const indicator = page.getByRole('img', { name: 'Cart has products' });
  await expect(indicator).toHaveCount(0);
  const search = page.getByRole('textbox', { name: 'Search products' });
  await search.click();
  await expect(search).toHaveCSS('outline-style', 'none');
  await page.getByRole('button', { name: 'Add frequent Cheese to cart' }).click();
  const undo = page.getByRole('button', { name: 'Undo frequent Cheese' });
  await expect(undo).toHaveCSS('opacity', '0.55');
  const row = page.getByRole('button', { name: 'Undo move of Cheese' });
  const trail = await row.evaluate((element) => {
    const sweep = element.querySelector('[aria-hidden="true"]');
    if (!sweep) throw new Error('Missing circle trail');
    const animation = sweep.getAnimations()[0];
    if (!animation) throw new Error('Missing circle animation');
    animation.pause();
    animation.currentTime = 1500;
    const line = getComputedStyle(sweep, '::before');
    const dot = getComputedStyle(sweep, '::after');
    return {
      lineEnd: parseFloat(line.left) + parseFloat(line.width),
      dotCenter: sweep.getBoundingClientRect().width - parseFloat(dot.width) / 2,
      lineHeight: parseFloat(line.height),
      dotHeight: parseFloat(dot.height),
    };
  });
  expect(trail.lineEnd).toBeCloseTo(trail.dotCenter, 1);
  expect(trail.lineHeight).toBe(trail.dotHeight);
  await page.screenshot({ path: testInfo.outputPath('circle-trail.png') });
  await undo.click();
  await expect(page.getByRole('button', { name: 'Add frequent Cheese to cart' })).toHaveCSS(
    'opacity',
    '1',
  );
  await expect(indicator).toHaveCount(0);
  await page.getByRole('button', { name: 'Add frequent Cheese to cart' }).click();
  await expect(indicator).toBeVisible({ timeout: 7000 });
  const fragments = page.getByTestId('favourite-fragments');
  await expect(fragments).toBeVisible();
  await page.screenshot({ path: testInfo.outputPath('favourite-disintegration.png') });
  await expect(fragments).toHaveCount(0);
  await expect(undo).toBeHidden();
  await page.getByRole('link', { name: 'Open cart' }).click();
  await page.getByRole('button', { name: 'Remove Cheese from cart' }).click();
  await expect(page.getByRole('heading', { name: 'Cart is empty' })).toBeVisible({ timeout: 7000 });
  await page.getByRole('link', { name: 'Back to list' }).click();
  await expect(indicator).toHaveCount(0);
  await page.getByRole('link', { name: 'Add product' }).click();
  const name = page.getByRole('textbox', { name: 'Product name' });
  await name.click();
  await expect(name).toHaveCSS('outline-style', 'none');
});

test('last favourites disappear and reduced motion keeps the trail static', async ({ page }) => {
  await page.emulateMedia({ reducedMotion: 'reduce' });
  await page.goto('/');
  for (const name of ['Cheese', 'Yogurt', 'Croissants', 'Coffee']) {
    await page.getByRole('button', { name: `Add frequent ${name} to cart` }).click();
  }
  const row = page.getByRole('button', { name: 'Undo move of Coffee' });
  await expect(row.locator('[aria-hidden="true"]')).toHaveCSS('animation-name', 'none');
  await expect(page.getByRole('region', { name: 'Frequent products' })).toBeHidden({
    timeout: 7000,
  });
  await expect(page.getByRole('img', { name: 'Cart has products' })).toBeVisible();
  await page.getByRole('link', { name: 'Open cart' }).click();
  await expect(
    page.getByRole('list', { name: 'Products in cart' }).getByRole('listitem'),
  ).toHaveCount(4);
});

test('browser preview supplies the storage identity and moves favourites into the cart', async ({
  page,
}) => {
  await page.unroute('https://telegram.org/js/telegram-web-app.js');
  await page.route('https://telegram.org/js/telegram-web-app.js', async (route) => {
    await route.fulfill({
      contentType: 'application/javascript',
      body: `window.Telegram={WebApp:{
        initData:new URLSearchParams(location.hash.slice(1)).get('tgWebAppData')||'',
        isVersionAtLeast(){return false},ready(){},expand(){},setHeaderColor(){},
        setBackgroundColor(){},enableClosingConfirmation(){},disableClosingConfirmation(){},
        BackButton:{show(){},hide(){},onClick(){},offClick(){}}
      }};`,
    });
  });
  await page.goto('/api/__test/preview');
  await page.getByRole('button', { name: 'Add frequent Cheese to cart' }).click();
  await expect(page.getByRole('img', { name: 'Cart has products' })).toBeVisible({ timeout: 7000 });
  await expect(page.getByRole('button', { name: 'Undo frequent Cheese' })).toBeHidden();
  await page.getByRole('link', { name: 'Open cart' }).click();
  await expect(page.getByRole('button', { name: 'Remove Cheese from cart' })).toBeVisible();
  await expect
    .poll(async () => {
      const response = await page.request.get('/api/shopping-list');
      const body: unknown = await response.json();
      return body;
    })
    .toMatchObject({ items: [{ productId: CHEESE_ID }] });
  await page.reload();
  await expect(page.getByRole('button', { name: 'Remove Cheese from cart' })).toBeVisible();
  await expect(
    page.getByText('Could not save on this device. Your product was not moved.', { exact: true }),
  ).toHaveCount(0);
});

test('last favourite group finishes its fragments before disappearing', async ({ page }) => {
  await page.goto('/');
  for (const name of ['Cheese', 'Yogurt', 'Croissants', 'Coffee']) {
    await page.getByRole('button', { name: `Add frequent ${name} to cart` }).click();
  }
  const fragments = page.getByTestId('favourite-fragments');
  await expect(fragments.first()).toBeVisible({ timeout: 7000 });
  await expect(page.getByRole('region', { name: 'Frequent products' })).toBeHidden();
  await expect(fragments).toHaveCount(0);
  await page.getByRole('button', { name: 'Add Tomatoes to cart', exact: true }).click();
  await expect(page.getByRole('button', { name: 'Undo move of Tomatoes' })).toBeVisible();
  await page.getByRole('button', { name: 'Undo move of Tomatoes' }).click();
});
