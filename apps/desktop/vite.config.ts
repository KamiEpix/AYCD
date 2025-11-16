import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import path from 'path';

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [react()],

  // Vite options tailored for Tauri development
  clearScreen: false,

  server: {
    port: 5173,
    strictPort: true,
    host: '0.0.0.0',
  },

  // Production build configuration
  build: {
    target: 'esnext',
    minify: !process.env.TAURI_DEBUG ? 'esbuild' : false,
    sourcemap: !!process.env.TAURI_DEBUG,
    outDir: 'dist',
  },

  resolve: {
    alias: {
      '@': path.resolve('./src'),
      '@/lib': path.resolve('./src/lib'),
      '@/components': path.resolve('./src/lib/components'),
      '@/contexts': path.resolve('./src/lib/contexts'),
      '@/api': path.resolve('./src/lib/api'),
      '@/utils': path.resolve('./src/lib/utils'),
    },
  },

  // Prevent vite from obscuring rust errors
  envPrefix: ['VITE_', 'TAURI_'],
});
