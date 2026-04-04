import { defineConfig, loadEnv } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, process.cwd(), '');
  const apiBase = env.VITE_API_URL || 'http://localhost:5000/api';
  const apiTarget = apiBase.replace(/\/api\/?$/, '');
  const socketTarget = env.VITE_SOCKET_URL || apiTarget || 'http://localhost:5000';

  return {
    plugins: [react()],
    build: {
      sourcemap: false,
      cssCodeSplit: true,
      chunkSizeWarningLimit: 800,
      rollupOptions: {
        output: {
          manualChunks(id) {
            if (!id.includes('node_modules')) return;
            if (id.includes('socket.io-client')) return 'socket';
            if (id.includes('date-fns')) return 'date';
            if (id.includes('react-icons')) return 'icons';
            return 'vendor';
          }
        }
      }
    },
    server: {
      port: 5173,
      proxy: {
        '/api': {
          target: apiTarget,
          changeOrigin: true
        },
        '/socket.io': {
          target: socketTarget,
          changeOrigin: true,
          ws: true
        }
      }
    }
  };
});
