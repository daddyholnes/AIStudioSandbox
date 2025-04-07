import { WebSocketServer } from 'ws';
import { createServer } from 'http';
import { networkInterfaces } from 'os';

// Create a basic HTTP server
const server = createServer((req, res) => {
  res.writeHead(200, { 'Content-Type': 'text/plain' });
  res.end('WebSocket test server');
});

// Create WebSocket server attached to HTTP server
const wss = new WebSocketServer({ 
  server,
  path: '/ws'
});

// Log connection details
console.log('Starting WebSocket test server...');

wss.on('connection', (ws, req) => {
  const ip = req.socket.remoteAddress;
  console.log(`[${new Date().toISOString()}] New client connected from ${ip}`);
  
  ws.on('message', (message) => {
    const msg = message.toString();
    console.log(`[${new Date().toISOString()}] Received: ${msg}`);
    ws.send(`Echo: ${msg}`);
  });
  
  ws.on('close', () => {
    console.log(`[${new Date().toISOString()}] Client from ${ip} disconnected`);
  });
  
  ws.send(JSON.stringify({ 
    type: 'info', 
    message: 'Welcome to WebSocket test server',
    timestamp: new Date().toISOString()
  }));
});

wss.on('error', (error) => {
  console.error(`[${new Date().toISOString()}] Server error:`, error);
});

// Start server
const PORT = 3001;
server.listen(PORT, '0.0.0.0', () => {
  console.log(`[${new Date().toISOString()}] Server is listening on:`);
  console.log(`- HTTP: http://0.0.0.0:${PORT}`);
  console.log(`- WebSocket: ws://0.0.0.0:${PORT}/ws`);
  
  // Display network interfaces
  const nets = networkInterfaces();
  console.log('\nAvailable on:');
  for (const name of Object.keys(nets)) {
    for (const net of nets[name]) {
      if (net.family === 'IPv4' && !net.internal) {
        console.log(`- http://${net.address}:${PORT}`);
        console.log(`- ws://${net.address}:${PORT}/ws`);
      }
    }
  }
});
