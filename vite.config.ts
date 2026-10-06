import { defineConfig } from 'vitest/config';
import react from '@vitejs/plugin-react';
import { fileURLToPath, URL } from 'node:url';

export default defineConfig({
  plugins: [react()],
  resolve: { alias: { '@': fileURLToPath(new URL('./src', import.meta.url)) } },
  server: {
    host: '127.0.0.1',
    proxy: { '/api': process.env.SHOPPA_API_TARGET ?? 'http://127.0.0.1:3000' },
  },
  test: {
    environment: 'jsdom',
    setupFiles: ['./src/test/setup.ts'],
    include: ['src/**/*.test.{ts,tsx}'],
    coverage: {
      provider: 'v8',
      include: [
        'src/entities/product/model.ts',
        'src/features/transfers/transfersSlice.ts',
        'src/features/transfers/productsWithTransfers.ts',
      ],
      thresholds: { statements: 90, branches: 85, functions: 90, lines: 90 },
    },
  },
});
