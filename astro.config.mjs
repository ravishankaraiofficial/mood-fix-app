import { defineConfig } from 'astro/config';
import cloudflare from '@astrojs/cloudflare';
import tailwindcss from '@tailwindcss/vite';
import AstroPWA from '@vite-pwa/astro';

export default defineConfig({
  output: 'server',
  adapter: cloudflare(),
  integrations: [
    AstroPWA({
      registerType: 'autoUpdate',
      workbox: {
        globDirectory: '.vercel/output/static',
        globPatterns: ['**/*.{js,css,html,ico,png,svg}'],
        runtimeCaching: [
          {
            urlPattern: /^https:\/\/huggingface\.co\/.*/i,
            handler: 'CacheFirst',
            options: {
              cacheName: 'transformers-cache',
              expiration: { maxEntries: 20, maxAgeSeconds: 60 * 60 * 24 * 365 }, // Cache models for 1 year
              cacheableResponse: { statuses: [0, 200] }
            }
          }
        ]
      },
      manifest: {
        name: 'Mood Relief',
        short_name: 'Mood',
        theme_color: '#ea580c',
        icons: [{ src: '/favicon.svg', sizes: '192x192', type: 'image/svg+xml' }]
      }
    })
  ],
  vite: {
    plugins: [tailwindcss()],
  },
});
