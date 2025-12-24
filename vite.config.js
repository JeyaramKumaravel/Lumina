import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import { VitePWA } from 'vite-plugin-pwa'

// https://vite.dev/config/
export default defineConfig({
  plugins: [
    react(),
    VitePWA({
      registerType: 'autoUpdate',
      includeAssets: ['favicon.ico', 'apple-touch-icon.png', 'masked-icon.svg', 'sw-custom.js'],
      workbox: {
        // Import custom service worker
        importScripts: ['sw-custom.js']
      },
      manifest: {
        name: 'Lumina - Premium Stream',
        short_name: 'Lumina',
        description: 'A premium video player experience',
        theme_color: '#0f0f0f',
        background_color: '#0f0f0f',
        display: 'standalone',
        start_url: '/',
        scope: '/',
        icons: [
          {
            src: 'pwa-192x192.png',
            sizes: '192x192',
            type: 'image/png'
          },
          {
            src: 'pwa-512x512.png',
            sizes: '512x512',
            type: 'image/png'
          }
        ],
        // Web Share Target API - allows receiving shared URLs and files
        share_target: {
          action: '/share-target',
          method: 'POST',
          enctype: 'multipart/form-data',
          params: {
            title: 'title',
            text: 'text',
            url: 'url',
            files: [
              {
                name: 'video',
                accept: ['video/*', '.mp4', '.mkv', '.avi', '.mov', '.webm', '.m4v', '.3gp', '.flv', '.wmv']
              }
            ]
          }
        },
        // File Handlers API - allows opening video files from file manager
        file_handlers: [
          {
            action: '/',
            accept: {
              'video/*': ['.mp4', '.mkv', '.avi', '.mov', '.webm', '.m4v', '.3gp', '.flv', '.wmv', '.ts', '.m3u8']
            }
          }
        ]
      }
    })
  ],
  server: {
    allowedHosts: [
      'luminastream.onrender.com'
    ],
  },
})