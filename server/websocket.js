import { WebSocketServer } from 'ws';
import { createServer } from 'http';

const httpServer = createServer();
const wss = new WebSocketServer({ noServer: true });

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
    });
  } else {
    socket.destroy();
  }
});

httpServer.listen(3001, () => {
  console.log('WebSocket server listening on port 3001');
});
