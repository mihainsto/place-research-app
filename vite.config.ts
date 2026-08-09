import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'
import { VitePWA } from 'vite-plugin-pwa'
import { fileURLToPath, URL } from 'node:url'

/**
 * GitHub Pages serves this repo from a subpath, not a domain root, so the
 * production build needs `base`. Everything downstream already reads
 * `import.meta.env.BASE_URL` — the router basename, the data fetch, the
 * service worker — so this one value is the only place the path is written.
 *
 * Dev stays at `/` because a subpath in dev is just friction.
 */
const REPO = 'place-research-app'

export default defineConfig(({ mode }) => {
  const base = mode === 'production' ? `/${REPO}/` : '/'

  return {
    base,
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
          // Relative so the manifest works under any base path.
          start_url: '.',
          scope: '.',
          icons: [{ src: 'favicon.svg', sizes: 'any', type: 'image/svg+xml', purpose: 'any' }],
        },
        workbox: {
          // Covers are precached too, not just cached on view — otherwise a
          // TikTok you hadn't opened before losing signal would have no image.
          globPatterns: ['**/*.{js,css,html,svg,woff2,jpg,png}'],
          maximumFileSizeToCacheInBytes: 4 * 1024 * 1024,
          navigateFallback: `${base}index.html`,
          runtimeCaching: [
            {
              // The dataset: always try the network so edits show up, but never
              // fail because there isn't one.
              urlPattern: ({ url }) => url.pathname.includes('/data/'),
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
          manualChunks(id: string) {
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
  }
})
