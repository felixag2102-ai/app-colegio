/*
  Configuración de Vite (la herramienta que arma la app).
  El plugin VitePWA hace que la app se pueda INSTALAR en el celular
  y que funcione sin internet (guarda una copia de la app en el celular).
*/
import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import { VitePWA } from 'vite-plugin-pwa'

export default defineConfig({
  base: './',
  plugins: [
    react(),
    VitePWA({
      registerType: 'autoUpdate',
      includeAssets: ['favicon.svg', 'apple-touch-icon.png'],
      manifest: {
        name: 'Colegio',
        short_name: 'Colegio',
        description: 'Mi app para organizarme en el colegio',
        lang: 'es-AR',
        start_url: './',
        scope: './',
        display: 'standalone',
        orientation: 'portrait',
        background_color: '#EEF0F7',
        theme_color: '#EEF0F7',
        icons: [
          { src: 'icono-192.png', sizes: '192x192', type: 'image/png' },
          { src: 'icono-512.png', sizes: '512x512', type: 'image/png' },
          { src: 'icono-maskable-512.png', sizes: '512x512', type: 'image/png', purpose: 'maskable' },
        ],
      },
      workbox: {
        globPatterns: ['**/*.{js,css,html,svg,png,woff2}'],
        // Código extra para recibir notificaciones (ver public/push-sw.js)
        importScripts: ['push-sw.js'],
      },
    }),
  ],
})
