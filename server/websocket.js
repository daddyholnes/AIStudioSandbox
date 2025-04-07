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

// Bind the HTTP server to all interfaces
const PORT = 3001;
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
});
