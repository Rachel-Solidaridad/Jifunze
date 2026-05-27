import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig({
  plugins: [react()],
  server: {
    // Honor PORT env var when set (used by the Claude Code preview harness so
    // multiple dev servers can coexist). Falls back to Vite's 5173 default.
    port: process.env.PORT ? Number(process.env.PORT) : 5173,
    host: true,
  },
  build: {
    outDir: 'dist',
    sourcemap: false,
  },
});
