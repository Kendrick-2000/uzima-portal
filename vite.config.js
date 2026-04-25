import { defineConfig } from 'vite';

export default defineConfig({
  base: './',
  build: {
    outDir: 'dist',
    assetsDir: 'assets',
    sourcemap: false,
    minify: 'esbuild',
    rollupOptions: {
      // Tell Vite: "Don't bundle these — they're loaded via CDN"
      external: ['pocketbase'],
      output: {
        // Map the external import to the global variable PocketBase provides
        globals: {
          pocketbase: 'PocketBase'
        },
        manualChunks: {
          // Only chunk your own code, not external libs
          app: ['js/main.js', 'js/dashboard.js', 'js/courses.js', 'js/admin.js']
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