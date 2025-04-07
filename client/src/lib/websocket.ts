// Purpose: Client-side WebSocket connection management for LiveKit.
// Ensure this file is used only for client-side WebSocket operations.

// WebSocket connection management
let socket: WebSocket | null = null;
// Add connection state tracking
let isConnecting = false;
let reconnectAttempts = 0;
const MAX_RECONNECT_ATTEMPTS = 5;

interface MessageHandler {
  type: string;
  handler: (data: any) => void;
}

const messageHandlers: MessageHandler[] = [];

/**
 * Initialize WebSocket connection
 * @returns WebSocket instance
 */
export const initWebSocket = (): WebSocket => {
  if (isConnecting) {
    console.log('Connection attempt already in progress');
    // Return the existing socket instance even if it's connecting
    return socket as WebSocket; 
  }

  if (socket?.readyState === WebSocket.OPEN) {
    console.log('WebSocket already connected');
    return socket;
  }

  isConnecting = true;
  
  // Close existing socket if any
  if (socket) {
    // Remove previous listeners to avoid duplicates
    socket.onopen = null;
    socket.onmessage = null;
    socket.onerror = null;
    socket.onclose = null;
    socket.close();
  }
  
  const protocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:';
  const wsUrl = `${protocol}//${window.location.host}/ws`;
  console.log(`Attempting WebSocket connection to ${wsUrl} (Attempt ${reconnectAttempts + 1})`);
  
  try {
    socket = new WebSocket(wsUrl);
  } catch (error) {
    console.error("Failed to create WebSocket:", error);
    isConnecting = false;
    // Rethrow or handle appropriately, maybe schedule reconnect here too
    throw error; 
  }
  
  socket.onopen = () => {
    console.log('WebSocket connection established');
    isConnecting = false;
    reconnectAttempts = 0; // Reset attempts on successful connection
  };
  
  socket.onmessage = (event) => {
    try {
      const data = JSON.parse(event.data);
      console.log('WebSocket message received:', data);
      
      // Process with registered handlers
      messageHandlers
        .filter(h => h.type === data.type)
        .forEach(h => h.handler(data));
    } catch (error) {
      console.error('Error processing WebSocket message:', error);
    }
  };
  
  socket.onerror = (event) => {
    // Log the event itself for more details if available
    console.error('WebSocket error:', event); 
    isConnecting = false;
    // Note: 'onerror' is usually followed by 'onclose'. Reconnection logic is in 'onclose'.
  };
  
  socket.onclose = (event) => {
    console.log(`WebSocket connection closed. Code: ${event.code}, Reason: ${event.reason}, Clean: ${event.wasClean}`);
    isConnecting = false;
    socket = null; // Clear the socket reference
    
    // Only attempt reconnection if not a clean close and haven't exceeded max attempts
    if (!event.wasClean && reconnectAttempts < MAX_RECONNECT_ATTEMPTS) {
      reconnectAttempts++;
      // Exponential backoff with jitter (add random delay up to 1s)
      const delay = Math.min(1000 * Math.pow(2, reconnectAttempts -1), 10000) + Math.random() * 1000; 
      console.log(`Attempting reconnection in ${Math.round(delay)}ms (attempt ${reconnectAttempts}/${MAX_RECONNECT_ATTEMPTS})`);
      
      setTimeout(() => {
        // Check again before reconnecting, maybe the user closed the tab
        if (reconnectAttempts <= MAX_RECONNECT_ATTEMPTS) { 
            initWebSocket();
        }
      }, delay);
    } else if (reconnectAttempts >= MAX_RECONNECT_ATTEMPTS) {
      console.error('Max reconnection attempts reached. Please refresh the page or check server status.');
    } else {
        console.log('WebSocket closed cleanly or reconnection not attempted.');
    }
  };
  
  return socket;
};

/**
 * Get the current WebSocket instance
 * @returns WebSocket instance or null
 */
export const getWebSocket = (): WebSocket | null => {
  return socket;
};

/**
 * Send a message through the WebSocket
 * @param type Message type
 * @param data Message data
 * @returns Promise resolving when message is sent
 */
// Modify sendWebSocketMessage to include connection state check and be async
export const sendWebSocketMessage = (type: string, data: any): Promise<void> => {
  return new Promise((resolve, reject) => {
    // Check connection status before attempting to send
    const checkAndSend = () => {
        if (isConnecting) {
            // Wait a bit and retry if connecting
            console.warn('WebSocket is connecting, delaying message send...');
            setTimeout(checkAndSend, 500); 
            return;
        }

        if (!socket || socket.readyState !== WebSocket.OPEN) {
            console.error('WebSocket not open. Cannot send message.');
            // Optionally try to reconnect here, or just reject
            // initWebSocket(); // Be careful with triggering reconnects here
            reject(new Error('WebSocket connection is not open.'));
            return;
        }
        
        // If connected, send the message
        sendMessage(socket, type, data, resolve, reject);
    };

    checkAndSend();
  });
};

/**
 * Helper to send a message on a WebSocket
 */
const sendMessage = (
  socket: WebSocket,
  type: string,
  data: any,
  resolve: () => void,
  reject: (error: Error) => void
) => {
  try {
    socket.send(JSON.stringify({
      type,
      ...data
    }));
    resolve();
  } catch (error) {
    reject(error as Error);
  }
};

/**
 * Register a message handler
 * @param type Message type to handle
 * @param handler Handler function
 */
export const registerMessageHandler = (type: string, handler: (data: any) => void): void => {
  // Remove existing handler for this type if exists
  const existingIndex = messageHandlers.findIndex(h => h.type === type);
  if (existingIndex >= 0) {
    messageHandlers.splice(existingIndex, 1);
  }
  
  // Add new handler
  messageHandlers.push({ type, handler });
};

/**
 * Unregister a message handler
 * @param type Message type
 */
export const unregisterMessageHandler = (type: string): void => {
  const index = messageHandlers.findIndex(h => h.type === type);
  if (index >= 0) {
    messageHandlers.splice(index, 1);
  }
};

/**
 * Close the WebSocket connection cleanly and prevent reconnection.
 */
export const closeWebSocket = (): void => {
  // Prevent automatic reconnection attempts
  reconnectAttempts = MAX_RECONNECT_ATTEMPTS; 
  if (socket) {
    console.log('Closing WebSocket connection manually.');
    socket.close(1000, "Client closed connection"); // Use code 1000 for normal closure
    socket = null;
  }
  isConnecting = false;
};