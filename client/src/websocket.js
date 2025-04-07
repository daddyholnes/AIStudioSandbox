// Create or update this file to handle WebSocket connections on the client side

export const connectWebSocket = () => {
  try {
    const protocol = window.location.protocol === 'https:' ? 'wss' : 'ws';
    // By default, connect to the same hostname but on port 3001 with /ws path
    const wsUrl = `${protocol}://${window.location.hostname}:3001/ws`;
    
    console.log(`Attempting to connect to WebSocket at: ${wsUrl}`);
    
    const socket = new WebSocket(wsUrl);
    
    socket.onopen = () => {
      console.log('WebSocket connected successfully');
    };
    
    socket.onmessage = (event) => {
      try {
        const data = JSON.parse(event.data);
        console.log('Received WebSocket message:', data);
        
        // Handle different message types
        if (data.type === 'connection') {
          console.log('Connection confirmed:', data.message);
        } else if (data.type === 'featureUpdate') {
          console.log('Feature update received:', data.features);
          // You can dispatch this to your application state here
        }
      } catch (error) {
        console.error('Error parsing WebSocket message:', error);
      }
    };
    
    socket.onerror = (error) => {
      console.error('WebSocket connection error:', error);
    };
    
    socket.onclose = (event) => {
      console.log(`WebSocket closed with code: ${event.code}, reason: ${event.reason}`);
      
      // Optional: implement reconnection logic
      // setTimeout(() => connectWebSocket(), 5000);
    };
    
    return socket;
  } catch (error) {
    console.error('Error establishing WebSocket connection:', error);
    return null;
  }
};

// Helper function to send messages through the socket
export const sendMessage = (socket, messageType, data) => {
  if (!socket || socket.readyState !== WebSocket.OPEN) {
    console.error('Cannot send message: WebSocket is not connected');
    return false;
  }
  
  try {
    const message = JSON.stringify({
      type: messageType,
      ...data,
      timestamp: new Date().toISOString()
    });
    
    socket.send(message);
    return true;
  } catch (error) {
    console.error('Error sending WebSocket message:', error);
    return false;
  }
};