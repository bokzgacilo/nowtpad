import { defineConfig } from "vite"
import react from "@vitejs/plugin-react"
import { VitePWA } from "vite-plugin-pwa"

export default defineConfig({
  plugins: [
    react(),
    VitePWA({
      registerType: "autoUpdate",
      includeAssets: ["notepad-icon.svg"],
      manifest: {
        name: "nowtpad",
        short_name: "nowtpad",
        description: "An offline-first text editor for local files.",
        theme_color: "#f6f4ef",
        background_color: "#f6f4ef",
        display: "standalone",
        scope: "/",
        start_url: "/",
        icons: [
          {
            src: "/notepad-icon.svg",
            sizes: "any",
            type: "image/svg+xml",
            purpose: "any maskable"
          }
        ]
      },
      workbox: {
        globPatterns: ["**/*.{js,css,html,svg,woff2}"],
        maximumFileSizeToCacheInBytes: 8 * 1024 * 1024
      }
    })
  ]
})
