import { defineConfig } from 'vite'

export default defineConfig({
  build: {
    rollupOptions: {
      input: {
        main: 'index.js'
      }
    }
  },
  server: {
    port: 3000,
    open: true
  }
})