import tailwindcss from '@tailwindcss/vite'
import react from '@vitejs/plugin-react'
import { defineConfig } from 'vite'
import { VitePWA } from 'vite-plugin-pwa'

// https://vite.dev/config/
export default defineConfig({
  plugins: [
    react(),
    tailwindcss(),
    // shortcut: no PNG icons yet, app is not installable until Phase 6 adds them
    VitePWA({
      registerType: 'autoUpdate',
      includeAssets: ['favicon.svg'],
      manifest: {
        name: 'SpinBack',
        short_name: 'SpinBack',
        description: 'Glazbena party igra: smjesti pjesmu na svoju vremensku crtu.',
        lang: 'hr',
        theme_color: '#E4EDE8',
        background_color: '#E4EDE8',
        display: 'standalone',
        icons: [{ src: 'favicon.svg', sizes: 'any', type: 'image/svg+xml' }],
      },
      workbox: {
        globPatterns: ['**/*.{js,css,html,svg,woff2}'],
        // Croatian/ex-YU text needs only latin + latin-ext font subsets offline.
        globIgnores: ['**/*-{cyrillic,cyrillic-ext,greek,vietnamese}-*'],
      },
    }),
  ],
})
