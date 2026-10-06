// Test-only harness: real backend routes, auth and SSE, with in-memory persistence.
// Never imports the production bootstrap or reads .env / data/state.json.
import { buildApp } from '../../app-backend/src/app.ts';
import { loadConfig } from '../../app-backend/src/config.ts';
import { configureStore, installState, mutate } from '../../app-backend/src/shared/state/store.ts';
import { emptyState } from '../../app-backend/src/shared/state/test-helpers.ts';
import { buildInitData, TEST_BOT_TOKEN } from '../../app-backend/src/shared/auth-test-helpers.ts';
import pino from '../../app-backend/node_modules/pino/pino.js';

const names = [
  ['Croissants', 'purple'],
  ['Yogurt', 'blue'],
  ['Cheese', 'yellow'],
  ['Tomatoes', 'red'],
  ['Coffee', 'brown'],
  ['Pasta', 'orange'],
  ['Rice', 'green'],
  ['Olive oil', 'black'],
];
function seed() {
  const state = emptyState();
  names.forEach(([name, color], index) => {
    const id = `00000000-0000-4000-8000-${String(index + 1).padStart(12, '0')}`;
    state.products[id] = {
      id,
      name,
      color,
      createdAt: '2026-01-01T00:00:00.000Z',
      favouritedBy: ['Coffee', 'Yogurt', 'Croissants', 'Cheese'].includes(name) ? [42] : [],
    };
  });
  return state;
}
const app = await buildApp({
  config: loadConfig({
    NODE_ENV: 'test',
    BOT_TOKEN: TEST_BOT_TOKEN,
    ALLOWED_USER_IDS: '42,43',
    SESSION_SECRET: 'shoppa-e2e-only-not-a-real-session-secret',
  }),
  log: pino({ level: 'silent' }),
});
installState(seed());
configureStore({
  emitChange: () => {
    app.events.emit();
  },
  writeLocalSync: () => {},
  scheduleTelegramFlush: () => {},
});
app.get('/__test/health', () => ({ ok: true }));
app.post('/__test/reset', () => {
  mutate((draft) => {
    Object.assign(draft, seed());
  });
  return { ok: true };
});
// Local preview convenience, present only in this test harness (never production).
app.get('/api/__test/preview', async (_request, reply) => {
  const session = await app.inject({
    method: 'POST',
    url: '/api/session',
    headers: { authorization: `tma ${buildInitData()}` },
  });
  reply.header('set-cookie', session.headers['set-cookie']);
  return reply.redirect('/');
});
await app.listen({ host: '127.0.0.1', port: 4301 });
const shutdown = async () => {
  app.events.closeAll();
  await app.close();
};
process.on('SIGTERM', () => {
  void shutdown();
});
process.on('SIGINT', () => {
  void shutdown();
});
