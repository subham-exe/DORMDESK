import { defineConfig } from 'vitest/config';
import path from 'path';

export default defineConfig({
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
    },
  },
  test: {
    fileParallelism: false,
    exclude: ['node_modules', 'dist', '.idea', '.git', '.cache', 'e2e/**/*']
  }
});
