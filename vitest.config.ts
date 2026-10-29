import { defineConfig } from 'vitest/config';
import os from 'node:os';
import path from 'node:path';

export default defineConfig({
  test: {
    environment: 'node',
    include: ['src/**/*.test.ts'],
    // The demo seed stores photos; keep test runs out of the real ./.data/uploads.
    env: { UPLOADS_DIR: path.join(os.tmpdir(), 'isio-test-uploads') },
  },
  resolve: {
    alias: { '@': path.resolve(__dirname, './src') },
  },
});
