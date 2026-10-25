import { defineConfig } from 'vitest/config';
import react from '@vitejs/plugin-react';

export default defineConfig({
  base: './',
  plugins: [react()],
  // Lane worktrees live under .worktrees/; never collect their copies of the tests.
  test: { exclude: ['**/node_modules/**', 'dist/**', '.worktrees/**'] },
});
