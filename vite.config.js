import { defineConfig } from 'vite';
import { resolve } from 'path';

export default defineConfig({
  base: '/uzima-portal/',
  build: {
    outDir: 'dist',
    assetsDir: 'assets',
    sourcemap: false,
    minify: 'esbuild',
    rollupOptions: {
      external: ['pocketbase'],
      input: {
        main: resolve(__dirname, 'index.html'),
        dashboard: resolve(__dirname, 'dashboard.html'),
        courses: resolve(__dirname, 'courses.html'),
        admin: resolve(__dirname, 'admin.html')
      },
      output: {
        globals: {
          pocketbase: 'PocketBase'
        }
      }
    }
  },
  server: {
    port: 3000,
    open: true
  },
  preview: {
    port: 4173,
    open: true
  }
});