import tailwindcss from "@tailwindcss/vite"
import react from "@vitejs/plugin-react"
import path from "node:path"
import { defineConfig } from "vite"

export default defineConfig({
  plugins: [react(), tailwindcss()],
  build: {
    rollupOptions: {
      output: {
        manualChunks(id) {
          if (!id.includes("node_modules")) {
            return undefined
          }

          if (/[\\/]node_modules[\\/](react|react-dom|react-router-dom)[\\/]/.test(id)) {
            return "react"
          }
          if (/[\\/]node_modules[\\/](@tanstack|axios|zustand|@supabase)[\\/]/.test(id)) {
            return "query"
          }
          if (/[\\/]node_modules[\\/]framer-motion[\\/]/.test(id)) {
            return "motion"
          }
          if (/[\\/]node_modules[\\/](@radix-ui|lucide-react|sonner)[\\/]/.test(id)) {
            return "ui"
          }

          return "vendor"
        },
      },
    },
  },
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./src"),
    },
  },
})
