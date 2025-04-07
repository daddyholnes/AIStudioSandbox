import { WebSocketServer } from 'ws';
import { createServer } from 'http';

// Create a dedicated HTTP server for the WebSocket
const httpServer = createServer((req, res) => {
  res.writeHead(200, { 'Content-Type': 'text/plain' });
  res.end('WebSocket server is running. Please connect using a WebSocket client.');
});

// Create WebSocket server attached to the HTTP server instead of standalone
const wss = new WebSocketServer({ 
  server: httpServer,
  // Remove host and port from here since we'll bind the HTTP server instead
  path: '/ws' // Keep the path
});

console.log('WebSocket server starting...');

// The rest of your connection handling stays the same
httpServer.on('upgrade', (request, socket, head) => {
  // Support both /ws and /ws/collab paths for compatibility
  const pathname = new URL(request.url, 'ws://localhost').pathname;
  
  if (pathname === '/ws' || pathname === '/ws/collab') {
    wss.handleUpgrade(request, socket, head, (ws) => {
      wss.emit('connection', ws, request);
      console.log('WebSocket client connected');
      
      ws.on('message', (message) => {
        try {
          const data = JSON.parse(message);
          console.log('Received message:', data);
          
          // Handle feature updates
          if (data.type === 'featureUpdate') {
            // Broadcast to all clients
            wss.clients.forEach((client) => {
              if (client !== ws && client.readyState === 1) {
                client.send(JSON.stringify({
                  type: 'featureUpdate',
                  features: { [data.feature]: data.value }
                }));
              }
            });
          }
        } catch (error) {
          console.error('Error processing message:', error);
        }
      });
      
      ws.on('close', () => {
        console.log('WebSocket client disconnected');
      });
      
      ws.on('error', (error) => {
        console.error('WebSocket client error:', error);
      });
      
      // Send a welcome message to verify connection
      ws.send(JSON.stringify({ type: 'connection', message: 'Connected to WebSocket server' }));
    });
  } else {
    socket.destroy();
  }
});

wss.on('error', (error) => {
  console.error('WebSocket server error:', error);
});

// Use environment variable for port or default to 3001
const PORT = process.env.WS_PORT || 3001;

// Add proper error handling for common issues like port conflicts
httpServer.listen(PORT, '0.0.0.0', async () => {
  console.log(`WebSocket server is running on port ${PORT}`);
  console.log(`- WebSocket URL: ws://localhost:${PORT}/ws`);
  
  // Display all available network interfaces for easier connection
  try {
    const { networkInterfaces } = await import('os');
    const nets = networkInterfaces();
    console.log('\nAvailable on:');
    
    for (const name of Object.keys(nets)) {
      for (const net of nets[name]) {
        if (net.family === 'IPv4' && !net.internal) {
          console.log(`- ws://${net.address}:${PORT}/ws`);
        }
      }
    }
  } catch (err) {
    console.error('Unable to display network interfaces:', err);
  }
}).on('error', (err) => {
  if (err.code === 'EADDRINUSE') {
    console.error(`\x1b[31mError: Port ${PORT} is already in use!\x1b[0m`);
    console.error(`\x1b[33mPossible solutions:\x1b[0m`);
    console.error(`  1. Close any other servers running on port ${PORT}`);
    console.error(`  2. Use a different port by setting the WS_PORT environment variable:`);
    console.error(`     • PowerShell: $env:WS_PORT="3002"; node server/websocket.js`);
    console.error(`     • CMD: set WS_PORT=3002 && node server/websocket.js`);
    console.error(`     • Bash/Mac/Linux: WS_PORT=3002 node server/websocket.js\n`);
  } else {
    console.error(`Server error:`, err);
  }
  process.exit(1);
});

// Add graceful shutdown
const shutdown = () => {
  console.log('\nShutting down WebSocket server...');
  httpServer.close(() => {
    console.log('WebSocket server closed.');
    process.exit(0);
  });
  
  // Force close if it takes too long
  setTimeout(() => {
    console.error('Forced shutdown after timeout');
    process.exit(1);
  }, 5000);
};

// Handle termination signals
process.on('SIGINT', shutdown);
process.on('SIGTERM', shutdown);
