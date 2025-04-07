import { WebSocketServer } from 'ws';
import { createServer } from 'http';

// Create a dedicated HTTP server for the WebSocket
const httpServer = createServer((req, res) => {
  res.writeHead(200, { 'Access-Control-Allow-Origin': '*' });
  res.end();
});

// Create WebSocket server attached to the HTTP server
const wss = new WebSocketServer({ 
  server: httpServer,
  path: '/ws' // Keep the path
});

console.log('WebSocket server starting...');

// The rest of your connection handling stays the same
httpServer.on('upgrade', (request, socket, head) => {
  const pathname = new URL(request.url, 'ws://localhost').pathname;
  
  if (pathname === '/ws') {
    wss.handleUpgrade(request, socket, head, (ws) => {
      wss.emit('connection', ws, request);
      console.log('WebSocket client connected');
      
      ws.on('message', (message) => {
        try {
          const data = JSON.parse(message);
          console.log('Received message:', data);
          
          // Handle feature updates
          if (data.type === 'featureUpdate') {
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
httpServer.listen(PORT, '0.0.0.0', () => {
  console.log(`WebSocket server is running on port ${PORT}`);
});

// Add graceful shutdown
const shutdown = () => {
  console.log('\nShutting down WebSocket server...');
  httpServer.close(() => {
    console.log('WebSocket server closed.');
    process.exit(0);
  });
};

// Handle termination signals
process.on('SIGINT', shutdown);
process.on('SIGTERM', shutdown);