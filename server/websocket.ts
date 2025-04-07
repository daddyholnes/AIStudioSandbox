import { WebSocketServer } from 'ws';
import { createServer } from 'http';

interface MessageData {
  type: string;
  feature?: string;
  value?: boolean;
  message?: string;
}

const httpServer = createServer();
const wss = new WebSocketServer({ noServer: true });

httpServer.on('upgrade', (request, socket, head) => {
  const url = request.url || '';
  const pathname = new URL(url, 'ws://localhost').pathname;
  
  if (pathname === '/ws' || pathname === '/ws/collab') {
    wss.handleUpgrade(request, socket, head, (ws) => {
      wss.emit('connection', ws, request);
      console.log('WebSocket client connected');
      
      ws.on('message', (message) => {
        try {
          const data = JSON.parse(message.toString()) as MessageData;
          console.log('Received message:', data);
          
          // Handle feature updates
          if (data.type === 'featureUpdate') {
            // Broadcast to all clients
            wss.clients.forEach((client) => {
              if (client !== ws && client.readyState === 1) {
                client.send(JSON.stringify({
                  type: 'featureUpdate',
                  features: { [data.feature as string]: data.value }
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
