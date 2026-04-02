import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import { VitePWA } from 'vite-plugin-pwa'
import path from "path"

// https://vitejs.dev/config/
export default defineConfig({
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./src"),
    },
  },
  plugins: [
    react(),
    VitePWA({
      // Use custom SW file — gives us full control over push/alarm logic
      strategies: 'injectManifest',
      srcDir: 'src',
      filename: 'sw.ts',

      registerType: 'autoUpdate',
      injectManifest: {
        // Build the SW with Rollup so ES imports (workbox-*) resolve correctly
        rollupFormat: 'iife',
      },

      // Enable SW in dev mode for notification testing
      devOptions: {
        enabled: true,
        type: 'module',
      },

      includeAssets: ['favicon.ico', 'apple-touch-icon.png', 'masked-icon.svg'],

      manifest: {
        name: 'FamiliaAgenda — Gestor de Actividades',
        short_name: 'FamiliaAgenda',
        description: 'PWA para gestionar actividades diarias personales y de trabajo en grupo con recordatorios inteligentes',
        theme_color: '#0f172a',
        background_color: '#0f172a',
        display: 'standalone',
        orientation: 'portrait',
        icons: [
          {
            src: 'pwa-192x192.png',
            sizes: '192x192',
            type: 'image/png',
          },
          {
            src: 'pwa-512x512.png',
            sizes: '512x512',
            type: 'image/png',
          },
          {
            src: 'pwa-512x512.png',
            sizes: '512x512',
            type: 'image/png',
            purpose: 'any maskable',
          },
        ],
      },
    }),
  ],
})
