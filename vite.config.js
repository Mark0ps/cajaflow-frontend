import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'

export default defineConfig({
  plugins: [react(), tailwindcss()],
  // Escucha en todas las interfaces para que el frontend sea accesible
  // vía la IP de Tailscale (100.108.101.97) desde otros equipos.
  server: {
    host: true,
  },
  preview: {
    host: true,
  },
})