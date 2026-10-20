/// <reference types="vitest/config" />
import { fileURLToPath, URL } from 'node:url'
import react from '@vitejs/plugin-react'
import { defineConfig } from 'vite'

export default defineConfig({
  plugins: [react()],
  resolve: {
    alias: {
      '@': fileURLToPath(new URL('./src', import.meta.url)),
    },
  },
  server: {
    port: 5173,
    // Em desenvolvimento, `/api` é repassado à API ASP.NET Core: o navegador
    // fala só com o Vite e o backend não precisa de CORS.
    proxy: {
      '/api': 'http://localhost:5165',
    },
  },
  // As páginas são lazy: varrer todas na inicialização evita que o Vite
  // reotimize dependências (e quebre imports) ao abrir uma página pela primeira vez.
  optimizeDeps: {
    entries: ['index.html', 'src/**/*.tsx'],
  },
  build: {
    // O chunk inicial (React, MUI, roteamento e sessão) fica em ~510 kB (~155 kB com gzip).
    // Separar o MUI manualmente aumentou o total baixado no início, então só o limite foi ajustado.
    chunkSizeWarningLimit: 600,
  },
  test: {
    environment: 'node',
    include: ['src/**/*.test.ts'],
  },
})
