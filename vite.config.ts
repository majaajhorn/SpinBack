import tailwindcss from '@tailwindcss/vite'
import react from '@vitejs/plugin-react'
import { defineConfig } from 'vite'
import { VitePWA } from 'vite-plugin-pwa'

// https://vite.dev/config/
export default defineConfig({
  plugins: [
    react(),
    tailwindcss(),
    VitePWA({
      // Ask before updating: a silent reload would wipe a game in progress.
      registerType: 'prompt',
      includeAssets: ['favicon.svg', 'favicon.ico', 'apple-touch-icon-180x180.png'],
      manifest: {
        id: '/',
        start_url: '/',
        name: 'SpinBack',
        short_name: 'SpinBack',
        description: 'Glazbena party igra: smjesti pjesmu na svoju vremensku crtu.',
        lang: 'hr',
        theme_color: '#E4EDE8',
        background_color: '#E4EDE8',
        display: 'standalone',
        orientation: 'portrait',
        categories: ['games', 'music', 'entertainment'],
        // Generated from public/favicon.svg by `npm run generate-pwa-assets`.
        icons: [
          { src: 'pwa-64x64.png', sizes: '64x64', type: 'image/png' },
          { src: 'pwa-192x192.png', sizes: '192x192', type: 'image/png' },
          { src: 'pwa-512x512.png', sizes: '512x512', type: 'image/png' },
          { src: 'maskable-icon-512x512.png', sizes: '512x512', type: 'image/png', purpose: 'maskable' },
        ],
      },
      workbox: {
        // App shell plus the song database (bundled into the JS). Clips always need the network.
        globPatterns: ['**/*.{js,css,html,svg,png,ico,woff2}'],
        // Croatian/ex-YU text needs only latin + latin-ext font subsets offline.
        globIgnores: ['**/*-{cyrillic,cyrillic-ext,greek,vietnamese}-*'],
      },
    }),
  ],
})
