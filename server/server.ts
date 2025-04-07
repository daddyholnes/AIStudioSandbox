// (Adjust filepath if your main server file is named differently)

import express from 'express';
import http from 'http';
// Import the webSocketRoomManager
import { webSocketRoomManager } from './services/websocket.js'; 
// ... other imports

const app = express();
// ... other express app setup (middleware, routes, etc.)

// Create the HTTP server using your Express app
const server = http.createServer(app);

// Initialize the WebSocket Room Manager and attach it to the server
webSocketRoomManager.initialize(server);

const PORT = process.env.PORT || 3000; // Or your desired port

server.listen(PORT, () => {
  console.log(`Server listening on port ${PORT}`);
  // Make sure the WebSocket manager logs its initialization message too
});

// ... rest of your server setup
