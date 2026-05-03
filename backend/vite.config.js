import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig({
  plugins: [react()],
  base: '/app/',
  publicDir: false,
  build: {
    outDir: 'public/app',
    emptyOutDir: true,
  },
  server: {
    proxy: {
      '/api': {
        target: 'http://localhost:8050',
        changeOrigin: true,
      },
    },
  },
  optimizeDeps: {
    include: ['leaflet', 'react-leaflet'],
  },
});
