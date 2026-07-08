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
    // Mismo puerto que dev para que los marcadores del teléfono sigan
    // funcionando. Para uso real la app se sirve con `npm run serve` (build de
    // producción): el dev server inyecta el cliente de HMR, que hace
    // location.reload() al reconectar el websocket cuando el navegador móvil
    // suspende la pestaña (ej. al cambiar a la app de cámara) — eso recargaba
    // la página y perdía la foto recién tomada.
    port: 5173,
    strictPort: true,
  },
})