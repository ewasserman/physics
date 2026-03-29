import { defineConfig } from 'vitest/config';
import { resolve } from 'path';

export default defineConfig({
  test: {
    globals: true,
    include: ['tests/**/*.test.ts'],
  },
  resolve: {
    alias: {
      '@math': resolve(__dirname, 'src/math'),
      '@core': resolve(__dirname, 'src/core'),
    },
  },
});
