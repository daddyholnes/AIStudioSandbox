import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig({
  plugins: [react()],
  root: './client', // Point to directory containing index.html
  server: {
    host: true, // Simpler way to bind to all interfaces
    port: 5173,
    strictPort: true,
    // cors: true, // Removed as per suggestion
    // hmr: { ... }, // Removed as per suggestion
    proxy: {
      '/api': 'http://localhost:3000', // Simplified proxy config
      // Add WebSocket proxy configuration
      '/ws': {
        target: 'ws://localhost:3001', // Target the WebSocket server port
        ws: true,                      // Enable WebSocket proxying
        // changeOrigin: true // Removed as per suggestion
      }
    },
    // watch: { ... } // Removed as per suggestion
  },
  build: {
    outDir: '../dist', // Avoid public/ conflicts
    emptyOutDir: true
  }
});
