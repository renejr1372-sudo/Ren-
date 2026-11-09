import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// `host: true` expone el servidor en la red local para poder abrirlo desde el iPhone.
export default defineConfig({
  plugins: [react()],
  base: './',
  server: { host: true, port: 5173 },
  preview: { host: true, port: 4173 },
})
