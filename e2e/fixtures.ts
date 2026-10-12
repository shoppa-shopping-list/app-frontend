import { createHmac } from 'node:crypto';
import type { Page } from '@playwright/test';

export const CHEESE_ID = '00000000-0000-4000-8000-000000000003';
export function initData(userId = 42): string {
  const fields = {
    auth_date: String(Math.floor(Date.now() / 1000)),
    user: JSON.stringify({ id: userId, first_name: 'Test' }),
  };
  const data = Object.entries(fields)
    .sort(([a], [b]) => a.localeCompare(b))
    .map(([key, value]) => `${key}=${value}`)
    .join('\n');
  const secret = createHmac('sha256', 'WebAppData').update('123456:test-bot-token').digest();
  const hash = createHmac('sha256', secret).update(data).digest('hex');
  return new URLSearchParams({ ...fields, hash }).toString();
}
export async function telegram(page: Page, userId = 42, deviceStorage = true): Promise<void> {
  await page.route('https://telegram.org/js/telegram-web-app.js', async (route) => {
    await route.fulfill({
      contentType: 'application/javascript',
      body: `window.Telegram={WebApp:{initData:${JSON.stringify(initData(userId))},isVersionAtLeast(){return ${deviceStorage ? 'true' : 'false'}},DeviceStorage:{getItem(key,cb){setTimeout(()=>{try{cb(null,localStorage.getItem('device:'+key))}catch(e){cb(String(e))}},10)},setItem(key,value,cb){setTimeout(()=>{try{localStorage.setItem('device:'+key,value);cb(null,true)}catch(e){cb(String(e),false)}},10)}},ready(){},expand(){},setHeaderColor(){},setBackgroundColor(){},enableClosingConfirmation(){},disableClosingConfirmation(){},BackButton:{show(){},hide(){},onClick(){},offClick(){}}}};`,
    });
  });
}
