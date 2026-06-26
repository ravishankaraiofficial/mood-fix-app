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
        globDirectory: '.vercel/output/static', // Astro cloudflare output varies, usually handled automatically
        globPatterns: ['**/*.{js,css,html,ico,png,svg}']
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
