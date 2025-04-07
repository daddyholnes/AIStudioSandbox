import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig({
  plugins: [react()],
  server: {
    host: true, // Bind to all network interfaces
    port: 5173, // Ensure the correct port
    strictPort: true, // Fail if port is unavailable
    proxy: {
      '/api': 'http://localhost:3000',
      '/ws': {
        target: 'ws://localhost:3001',
        ws: true
      }
    }
  }
});
