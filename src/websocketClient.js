// WebSocket connection utility

export function createWebSocketConnection() {
  const protocol = window.location.protocol === 'https:' ? 'wss' : 'ws';
  const host = window.location.hostname;
  const wsUrl = `${protocol}://${host}:3001/ws`;
  
  const ws = new WebSocket(wsUrl);
  
  ws.onopen = () => {
    console.log('WebSocket connected successfully');
  };
  
  ws.onerror = (error) => {
    console.error('WebSocket connection error:', error);
  };
  
  ws.onclose = (event) => {
    console.log('WebSocket connection closed:', event.code, event.reason);
  };
  
  ws.onmessage = (event) => {
    console.log('Message received:', event.data);
    // Process the message here
  };
  
  return ws;
}

// Usage example:
// import { createWebSocketConnection } from './websocketClient';
// const ws = createWebSocketConnection();
// To send messages: ws.send('your message');
