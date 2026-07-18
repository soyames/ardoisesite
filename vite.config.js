import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'
import { VitePWA } from 'vite-plugin-pwa'

// Served at the domain root (ardoise.soyames.com via GitHub Pages +
// a custom domain / CNAME, see public/CNAME) -- base stays '/' rather
// than a repo-name subpath, unlike the default github.io project-page
// setup, because a CNAME makes this a user-mapped root domain.
export default defineConfig({
  base: '/',
  plugins: [
    react(),
    tailwindcss(),
    VitePWA({
      registerType: 'autoUpdate',
      includeAssets: ['favicon.svg', 'icons/icon-192.png', 'icons/icon-512.png'],
      manifest: {
        name: 'Ardoise',
        short_name: 'Ardoise',
        description: 'Gestion scolaire tout-en-un pour les etablissements prives au Benin.',
        theme_color: '#2B2621',
        background_color: '#F7F3EA',
        display: 'standalone',
        start_url: '/',
        scope: '/',
        icons: [
          { src: '/icons/icon-192.png', sizes: '192x192', type: 'image/png' },
          { src: '/icons/icon-512.png', sizes: '512x512', type: 'image/png' },
          { src: '/icons/icon-512.png', sizes: '512x512', type: 'image/png', purpose: 'maskable' },
        ],
      },
      workbox: {
        // Never cache API calls with a stale-while-revalidate-style
        // strategy -- a cached "pending approvals" list or account
        // balance going stale silently would be actively misleading
        // for a school. Only the app shell (JS/CSS/HTML) is
        // precached for offline load; API data freshness is the
        // client code's job (see shared/api/client.js), not the
        // service worker's.
        navigateFallbackDenylist: [/^\/api\//],
        runtimeCaching: [],
        // The default 2 MiB precache limit was silently failing every
        // production build (Workbox throws, not warns) once the main
        // chunk grew past it -- see the Univer/Tiptap editors pulling
        // in a large single bundle. Raised as an immediate unblock;
        // the real fix is code-splitting those editors behind
        // React.lazy() so the marketplace's own bundle doesn't carry
        // them at all (tracked separately, not done here).
        maximumFileSizeToCacheInBytes: 10 * 1024 * 1024,
      },
    }),
  ],
})
