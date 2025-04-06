// WebSocket connection management
let socket: WebSocket | null = null;

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
  if (socket && socket.readyState === WebSocket.OPEN) {
    console.log('WebSocket already connected');
    return socket;
  }
  
  // Close existing socket if any
  if (socket) {
    socket.close();
  }
  
  // Create new WebSocket with path to avoid conflicts with Vite
  const protocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:';
  const wsUrl = `${protocol}//${window.location.host}/ws`;
  socket = new WebSocket(wsUrl);
  
  socket.onopen = () => {
    console.log('WebSocket connection established');
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
  
  socket.onerror = (error) => {
    console.error('WebSocket error:', error);
  };
  
  socket.onclose = () => {
    console.log('WebSocket connection closed');
    // Attempt to reconnect after a delay
    setTimeout(() => {
      if (socket?.readyState !== WebSocket.OPEN) {
        console.log('Attempting to reconnect WebSocket...');
        initWebSocket();
      }
    }, 5000);
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
export const sendWebSocketMessage = (type: string, data: any): Promise<void> => {
  return new Promise((resolve, reject) => {
    if (!socket || socket.readyState !== WebSocket.OPEN) {
      // Initialize WebSocket if not already open
      try {
        const newSocket = initWebSocket();
        
        // If socket is connecting, wait for it to open
        if (newSocket.readyState === WebSocket.CONNECTING) {
          newSocket.addEventListener('open', () => {
            sendMessage(newSocket, type, data, resolve, reject);
          });
        } else {
          sendMessage(newSocket, type, data, resolve, reject);
        }
      } catch (error) {
        reject(error);
      }
    } else {
      sendMessage(socket, type, data, resolve, reject);
    }
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
 * Close the WebSocket connection
 */
export const closeWebSocket = (): void => {
  if (socket) {
    socket.close();
    socket = null;
  }
};