import { WebSocketServer } from 'ws';
import { createServer } from 'http';

const httpServer = createServer();
const wss = new WebSocketServer({ noServer: true });

httpServer.on('upgrade', (request, socket, head) => {
  const pathname = new URL(request.url!, 'ws://localhost').pathname;
  
  if (pathname === '/ws/collab') {
    wss.handleUpgrade(request, socket, head, (ws) => {
      wss.emit('connection', ws, request);
      console.log('WebSocket connection established');
    });
  } else {
    socket.destroy();
  }
});

httpServer.listen(3001, () => {
  console.log('WebSocket server listening on port 3001');
});
