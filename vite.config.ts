import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig({
  plugins: [react()],
  server: {
    host: '0.0.0.0', // Explicitly bind to all available network interfaces
    port: 5173,
    strictPort: true,
    cors: true, // Enable CORS for all origins
    hmr: {
      protocol: 'ws',
      host: '0.0.0.0',
      port: 5173,
    },
    proxy: {
      '/api': {
        target: 'http://localhost:3000',
        changeOrigin: true,
        secure: false,
      },
      // Add WebSocket proxy configuration
      '/ws': {
        target: 'ws://localhost:3001', // Target the WebSocket server port
        ws: true,                      // Enable WebSocket proxying
        changeOrigin: true             // Recommended for virtual hosts
      }
    },
    watch: {
      usePolling: true, // Helps with file watching in some environments
    }
  }
});
