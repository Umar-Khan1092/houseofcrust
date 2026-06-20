import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import compression from 'vite-plugin-compression';

export default defineConfig({
  plugins: [
    react(),
    // Gzip compression for all JS/CSS/HTML assets
    compression({
      algorithm: 'gzip',
      ext: '.gz',
      threshold: 1024, // Only compress files > 1KB
    }),
    // Brotli compression (better compression than gzip)
    compression({
      algorithm: 'brotliCompress',
      ext: '.br',
      threshold: 1024,
    }),
  ],
  server: {
    host: '0.0.0.0',
  },
  build: {
    // Target modern browsers for smaller bundles
    target: 'es2020',
    // Enable CSS code splitting
    cssCodeSplit: true,
    // Increase chunk size warning limit (our app is intentionally rich)
    chunkSizeWarningLimit: 600,
    rollupOptions: {
      output: {
        // Manual code splitting: separate vendor libs from app code
        manualChunks: {
          // React core in its own chunk (cached separately by browser)
          'react-vendor': ['react', 'react-dom'],
        },
        // Use content hash for cache busting
        chunkFileNames: 'assets/[name]-[hash].js',
        entryFileNames: 'assets/[name]-[hash].js',
        assetFileNames: 'assets/[name]-[hash].[ext]',
      },
    },
    // Minify with esbuild (faster than terser, near same output size)
    minify: 'esbuild',
  },
});
