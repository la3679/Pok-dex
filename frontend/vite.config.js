import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig({
  // Legacy feature modules still use the .js extension while containing JSX.
  plugins: [react({ include: /\.[jt]sx?$/ })],
  // Keep the documented REACT_APP_* names working while allowing VITE_* aliases.
  envPrefix: ['VITE_', 'REACT_APP_'],
  server: {
    port: 3000,
  },
  test: {
    environment: 'jsdom',
    globals: true,
  },
});
