import { defineConfig } from 'vite';
import { resolve } from 'path';

export default defineConfig({
  build: {
    lib: {
      entry: resolve(__dirname, 'src/index.ts'),
      name: 'PhysicsSim',
      fileName: 'physics-sim',
    },
  },
  resolve: {
    alias: {
      '@math': resolve(__dirname, 'src/math'),
      '@core': resolve(__dirname, 'src/core'),
    },
  },
});
