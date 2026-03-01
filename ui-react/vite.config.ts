import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import { sentryVitePlugin } from '@sentry/vite-plugin'
import { VitePWA } from 'vite-plugin-pwa'

// Sentry source maps upload (only in production with auth token)
const sentryPlugin = process.env.SENTRY_AUTH_TOKEN
  ? sentryVitePlugin({
      org: process.env.SENTRY_ORG,
      project: process.env.SENTRY_PROJECT,
      authToken: process.env.SENTRY_AUTH_TOKEN,
    })
  : null

// PWA plugin for iPad/mobile installability
const pwaPlugin = VitePWA({
  registerType: 'autoUpdate',
  includeAssets: ['favicon.ico', 'icon-192.png', 'icon-512.png'],
  manifest: {
    name: 'Pronetheia',
    short_name: 'Pronetheia',
    description: 'AI-Powered Multi-Agent Development Platform',
    theme_color: '#22c55e',
    background_color: '#09090b',
    display: 'standalone',
    icons: [
      {
        src: 'icon-192.png',
        sizes: '192x192',
        type: 'image/png',
        purpose: 'any maskable',
      },
      {
        src: 'icon-512.png',
        sizes: '512x512',
        type: 'image/png',
        purpose: 'any maskable',
      },
    ],
  },
  workbox: {
    globPatterns: ['**/*.{js,css,html,ico,png,svg,woff2}'],
    // Increase limit for large JS bundles
    maximumFileSizeToCacheInBytes: 5 * 1024 * 1024, // 5MB
    // Navigation fallback for SPA routing
    navigateFallback: '/index.html',
    navigateFallbackDenylist: [/^\/api/],
    runtimeCaching: [
      {
        // API calls - network only, never cache (prevents stale HTML from being served)
        urlPattern: /^https?:\/\/.*\/api\//i,
        handler: 'NetworkOnly',
      },
      {
        // Static assets - cache first strategy
        urlPattern: /\.(?:png|jpg|jpeg|svg|gif|webp|ico|woff2?)$/i,
        handler: 'CacheFirst',
        options: {
          cacheName: 'static-assets',
          expiration: {
            maxEntries: 100,
            maxAgeSeconds: 30 * 24 * 60 * 60, // 30 days
          },
        },
      },
    ],
  },
})

export default defineConfig({
  plugins: [react(), pwaPlugin, sentryPlugin].filter(Boolean),
  server: {
    proxy: {
      '/api': { target: 'http://localhost:8000', changeOrigin: true },
      '/ws': { target: 'ws://localhost:8000', ws: true }
    }
  },
  build: {
    outDir: '../dist/neural-ui',
    emptyDirBeforeWrite: true,
    rollupOptions: {
      // Mark optional dependencies as external - they're loaded dynamically with fallbacks
      external: ['@met4citizen/headtts'],
      onwarn(warning, warn) {
        // Suppress warnings about optional external modules
        if (warning.code === 'UNRESOLVED_IMPORT' && warning.exporter === '@met4citizen/headtts') {
          return;
        }
        warn(warning);
      }
    }
  },
  // Suppress warnings for optional dependencies
  optimizeDeps: {
    exclude: ['@met4citizen/headtts']
  }
})
