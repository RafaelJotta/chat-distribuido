import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig({
  plugins: [react()],
  server: {
    host: true, // Permite acesso externo ao container (necessário no Docker)
    port: 5173,
    watch: {
      usePolling: true, // Melhora o hot-reload em alguns sistemas de arquivos Docker (Windows/WSL)
    },
    proxy: {
      // Qualquer requisição começando com /api será enviada para o Nginx
      '/api': {
        target: 'http://api-gateway:80', // Nome do serviço no Docker Compose e porta interna do Nginx
        changeOrigin: true,
        secure: false,
        // NÃO usamos rewrite aqui, pois seu Nginx já tem lógica de rewrite
      },
      // Configuração para WebSocket (se necessário no futuro via Vite)
      '/ws': {
        target: 'http://api-gateway:80',
        ws: true,
        changeOrigin: true
      }
    }
  },
  optimizeDeps: {
    exclude: ['lucide-react'],
  },
});