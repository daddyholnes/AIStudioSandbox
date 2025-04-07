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
    const host = window.location.hostname;
    return `${protocol}://${host}:3001/ws`;
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

// Export a singleton instance with auto-connection
export const websocket = new WebSocketClient(null, { autoConnect: true });

// Export the class for custom instances
export default WebSocketClient;
