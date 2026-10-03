import { defineConfig } from 'vitest/config';

// Unit tests for pure logic (cart identity, market guard, grouping, storage
// migration). Kept separate from vite.config.* so the app build is untouched.
export default defineConfig({
  test: {
    environment: 'node',
    include: ['src/**/*.test.ts'],
  },
});
