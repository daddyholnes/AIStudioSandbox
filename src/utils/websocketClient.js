/**
 * WebSocket client with automatic reconnection and keep-alive functionality
 */

class WebSocketClient {
  constructor(url, options = {}) {
    this.url = url || this._buildDefaultUrl();
    this.options = {
      reconnectInterval: 2000,
      pingInterval: 5000,
      maxReconnectAttempts: 10,
      ...options
    };
    
    this.reconnectAttempts = 0;
    this.isConnecting = false;
    this.ws = null;
    this.pingInterval = null;
    
    this.onMessageHandlers = [];
    this.onOpenHandlers = [];
    this.onCloseHandlers = [];
    this.onErrorHandlers = [];
    
    // Auto-connect if specified
    if (this.options.autoConnect) {
      this.connect();
    }
  }
  
  _buildDefaultUrl() {
    const protocol = window.location.protocol === 'https:' ? 'wss' : 'ws';
    // Update the host and port construction
    const wsUrl = `${protocol}://${window.location.hostname}:${import.meta.env.VITE_WS_PORT || 3001}/ws`;
    return wsUrl;
  }
  
  connect() {
    if (this.isConnecting || (this.ws && this.ws.readyState === WebSocket.OPEN)) {
      console.log('WebSocket is already connected or connecting');
      return;
    }
    
    this.isConnecting = true;
    console.log(`Connecting to WebSocket at ${this.url}`);
    
    try {
      this.ws = new WebSocket(this.url);
      
      this.ws.onopen = (event) => {
        console.log('WebSocket connection established');
        this.isConnecting = false;
        this.reconnectAttempts = 0;
        
        // Start ping interval
        this._startPingInterval();
        
        // Notify all handlers
        this.onOpenHandlers.forEach(handler => handler(event));
      };
      
      this.ws.onmessage = (event) => {
        // Parse message if it's JSON
        let data;
        try {
          data = JSON.parse(event.data);
          
          // Handle ping/pong
          if (data.type === 'pong') {
            console.debug('Received pong from server');
            return;
          }
          
        } catch (e) {
          data = event.data;
        }
        
        // Notify all handlers
        this.onMessageHandlers.forEach(handler => handler(data, event));
      };
      
      this.ws.onclose = (event) => {
        console.log(`WebSocket connection closed: ${event.code} - ${event.reason || 'No reason provided'}`);
        this.isConnecting = false;
        this._clearPingInterval();
        
        // Notify all handlers
        this.onCloseHandlers.forEach(handler => handler(event));
        
        // Attempt to reconnect if not closed cleanly
        if (event.code !== 1000 && event.code !== 1001) {
          this._attemptReconnect();
        }
      };
      
      this.ws.onerror = (error) => {
        console.error('WebSocket error:', error);
        this.isConnecting = false;
        
        // Notify all handlers
        this.onErrorHandlers.forEach(handler => handler(error));
        
        // Close the connection to trigger reconnection
        if (this.ws) {
          this.ws.close();
        }
      };
      
    } catch (error) {
      console.error('Error creating WebSocket:', error);
      this.isConnecting = false;
      this._attemptReconnect();
    }
  }
  
  _attemptReconnect() {
    if (this.reconnectAttempts >= this.options.maxReconnectAttempts) {
      console.error(`Maximum reconnection attempts (${this.options.maxReconnectAttempts}) reached`);
      return;
    }
    
    this.reconnectAttempts++;
    const delay = this.options.reconnectInterval;
    
    console.log(`Attempting to reconnect (${this.reconnectAttempts}/${this.options.maxReconnectAttempts}) in ${delay}ms`);
    
    setTimeout(() => {
      this.connect();
    }, delay);
  }
  
  _startPingInterval() {
    this._clearPingInterval();
    this.pingInterval = setInterval(() => {
      if (this.ws && this.ws.readyState === WebSocket.OPEN) {
        console.debug('Sending ping to server');
        this.ws.send(JSON.stringify({ type: 'ping' }));
      }
    }, this.options.pingInterval);
  }
  
  _clearPingInterval() {
    if (this.pingInterval) {
      clearInterval(this.pingInterval);
      this.pingInterval = null;
    }
  }
  
  // Public methods to send messages
  send(data) {
    if (!this.ws || this.ws.readyState !== WebSocket.OPEN) {
      console.error('Cannot send message: WebSocket is not connected');
      return false;
    }
    
    try {
      const message = typeof data === 'string' ? data : JSON.stringify(data);
      this.ws.send(message);
      return true;
    } catch (error) {
      console.error('Error sending message:', error);
      return false;
    }
  }
  
  // Event handler registration methods
  onMessage(handler) {
    this.onMessageHandlers.push(handler);
    return () => {
      this.onMessageHandlers = this.onMessageHandlers.filter(h => h !== handler);
    };
  }
  
  onOpen(handler) {
    this.onOpenHandlers.push(handler);
    return () => {
      this.onOpenHandlers = this.onOpenHandlers.filter(h => h !== handler);
    };
  }
  
  onClose(handler) {
    this.onCloseHandlers.push(handler);
    return () => {
      this.onCloseHandlers = this.onCloseHandlers.filter(h => h !== handler);
    };
  }
  
  onError(handler) {
    this.onErrorHandlers.push(handler);
    return () => {
      this.onErrorHandlers = this.onErrorHandlers.filter(h => h !== handler);
    };
  }
  
  // Method to manually disconnect
  disconnect() {
    this._clearPingInterval();
    if (this.ws) {
      this.ws.close(1000, 'Client disconnected');
      this.ws = null;
    }
  }
}

// Add new wsUrl definition based on prompt
const protocol = window.location.protocol === 'https:' ? 'wss' : 'ws';
const wsUrl = `${protocol}://${window.location.hostname}:${import.meta.env.VITE_WS_PORT || 3001}/ws`;

let socket = null;
let reconnectInterval = 5000; // 5 seconds
let messageQueue = []; // Queue for messages if socket is not ready

const connectWebSocket = (roomId = 'default-room') => {
  // Update URL construction to use the new wsUrl and append roomId correctly
  const urlWithRoom = `${wsUrl}?roomId=${roomId}`; // Use the updated wsUrl
  console.log(`Attempting to connect to WebSocket: ${urlWithRoom}`);

  // Close existing socket if any before reconnecting
  if (socket && socket.readyState !== WebSocket.CLOSED) {
    socket.close();
  }

  socket = new WebSocket(urlWithRoom, 'chat'); // Specify protocol if needed

  socket.onopen = () => {
    console.log('WebSocket connection established');
    // Send any queued messages
    messageQueue.forEach(msg => sendMessage(msg));
    messageQueue = [];
    // Reset reconnect interval on successful connection
    reconnectInterval = 5000; 
  };

  socket.onmessage = (event) => {
    try {
      const message = JSON.parse(event.data);
      console.log('Message from server:', message);
      // Handle incoming messages (e.g., update UI, dispatch actions)
      // Example: dispatch(handleWebSocketMessage(message));
    } catch (error) {
      console.error('Failed to parse message or invalid message format:', event.data, error);
    }
  };

  socket.onerror = (error) => {
    console.error('WebSocket error:', error);
    // Optionally attempt to reconnect on error
  };

  socket.onclose = (event) => {
    console.log(`WebSocket connection closed: Code=${event.code}, Reason=${event.reason}`);
    socket = null; // Ensure socket is nullified
    // Attempt to reconnect after a delay
    setTimeout(() => {
      console.log('Attempting to reconnect WebSocket...');
      connectWebSocket(roomId); // Pass roomId for reconnection
    }, reconnectInterval);
    // Exponential backoff could be implemented here
    // reconnectInterval = Math.min(reconnectInterval * 2, 60000); // e.g., double interval up to 60s
  };
};

const sendMessage = (message) => {
  if (socket && socket.readyState === WebSocket.OPEN) {
    socket.send(JSON.stringify(message));
  } else {
    console.warn('WebSocket not connected. Queuing message:', message);
    // Queue message if socket is not open
    messageQueue.push(message);
    // Attempt to connect if socket is null or closed
    if (!socket || socket.readyState === WebSocket.CLOSED) {
       // You might need to know the current roomId here if it's dynamic
       // connectWebSocket('current_room_id'); // Re-trigger connection
    }
  }
};

const disconnectWebSocket = () => {
  if (socket) {
    socket.close();
    socket = null;
  }
};

// Export functions for use in components
export { connectWebSocket, sendMessage, disconnectWebSocket };

// Optional: Initialize connection automatically if needed
// connectWebSocket();

// Export a singleton instance with auto-connection
// Ensure the WebSocketClient uses the correct default URL logic if no URL is passed
export const websocket = new WebSocketClient(undefined, { autoConnect: true }); // Pass undefined to use default URL

// Export the class for custom instances
export default WebSocketClient;
