import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'

export default defineConfig({
  plugins: [react(), tailwindcss()],
  build: {
    rollupOptions: {
      output: {
        // React + router change rarely: a separate file stays cached across deploys.
        manualChunks: (id) =>
          /node_modules\/(react|react-dom|scheduler|react-router|react-router-dom|@remix-run)\//.test(id) ? 'vendor' : undefined,
      },
    },
  },
})
