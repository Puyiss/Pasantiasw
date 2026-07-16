import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// https://vite.dev/config/
export default defineConfig({
  // Necesario para GitHub Pages: https://puyiss.github.io/Pasantiasw/
  base: '/Pasantiasw/',
  plugins: [react()],
})
