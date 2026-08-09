import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'
import { VitePWA } from 'vite-plugin-pwa'
import { fileURLToPath, URL } from 'node:url'

export default defineConfig({
  plugins: [
    react(),
    tailwindcss(),
    /**
     * Offline support is not a nice-to-have here: this app gets used in
     * mainland China, in basements and back streets, on a foreign SIM. The
     * script has to be readable with no signal at all.
     */
    VitePWA({
      registerType: 'autoUpdate',
      includeAssets: ['favicon.svg'],
      manifest: {
        name: 'China 2026',
        short_name: 'China 2026',
        description: 'TikTok command center',
        theme_color: '#08090a',
        background_color: '#08090a',
        display: 'standalone',
        orientation: 'portrait',
        start_url: '/',
        icons: [{ src: 'favicon.svg', sizes: 'any', type: 'image/svg+xml', purpose: 'any' }],
      },
      workbox: {
        // Covers are precached too, not just cached on view — otherwise a
        // TikTok you hadn't opened before losing signal would have no image.
        globPatterns: ['**/*.{js,css,html,svg,woff2,jpg,png}'],
        maximumFileSizeToCacheInBytes: 4 * 1024 * 1024,
        navigateFallback: '/index.html',
        runtimeCaching: [
          {
            // The dataset: always try the network so edits show up, but never
            // fail because there isn't one.
            urlPattern: ({ url }) => url.pathname.startsWith('/data/'),
            handler: 'NetworkFirst',
            options: {
              cacheName: 'china-2026-data',
              networkTimeoutSeconds: 4,
              expiration: { maxEntries: 8, maxAgeSeconds: 60 * 60 * 24 * 90 },
            },
          },
          {
            // Covers change rarely and are the heaviest thing we load.
            urlPattern: ({ request }) => request.destination === 'image',
            handler: 'CacheFirst',
            options: {
              cacheName: 'china-2026-covers',
              expiration: { maxEntries: 400, maxAgeSeconds: 60 * 60 * 24 * 60 },
              cacheableResponse: { statuses: [0, 200] },
            },
          },
        ],
      },
    }),
  ],
  resolve: {
    alias: {
      '@': fileURLToPath(new URL('./src', import.meta.url)),
    },
  },
  build: {
    rollupOptions: {
      output: {
        // Keep the graph engine out of the Wall/Detail critical path.
        manualChunks(id) {
          if (id.includes('force-graph') || id.includes('/d3-')) return 'graph'
          if (
            id.includes('react-markdown') ||
            id.includes('remark') ||
            id.includes('rehype') ||
            id.includes('micromark') ||
            id.includes('mdast') ||
            id.includes('hast')
          )
            return 'markdown'
        },
      },
    },
  },
})
