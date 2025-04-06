/**
 * WebSocket Collaboration Client
 * Provides a client interface to the WebSocket-based collaboration service
 */

// Typings for room data structures
export interface Participant {
  id: string;
  name: string;
  isPublisher: boolean;
}

export interface Room {
  id: string;
  name: string;
  participants: Participant[];
  metadata?: Record<string, any>;
  createdAt: number;
}

// Event handler types
type MessageHandler = (data: any) => void;
type ErrorHandler = (error: Error) => void;
type ConnectionHandler = () => void;

export class WebSocketCollab {
  private socket: WebSocket | null = null;
  private participantId: string | null = null;
  private participantName: string | null = null;
  private currentRoomId: string | null = null;
  private connected = false;
  private reconnectAttempts = 0;
  private maxReconnectAttempts = 5;
  private reconnectInterval = 2000;
  private reconnecting = false;
  private messageQueue: string[] = [];
  
  // Event handlers
  private messageHandlers: { [key: string]: MessageHandler[] } = {};
  private errorHandlers: ErrorHandler[] = [];
  private connectHandlers: ConnectionHandler[] = [];
  private disconnectHandlers: ConnectionHandler[] = [];
  
  /**
   * Create a WebSocket collaboration client
   * @param participantName Optional participant name to use (can be set later)
   */
  constructor(participantName?: string) {
    if (participantName) {
      this.participantName = participantName;
    }
  }
  
  /**
   * Connect to the WebSocket server
   * @returns Promise that resolves when connected
   */
  connect(): Promise<void> {
    return new Promise((resolve, reject) => {
      if (this.socket && this.connected) {
        resolve();
        return;
      }
      
      try {
        // Create WebSocket connection
        const protocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:';
        const wsUrl = `${protocol}//${window.location.host}/ws/collab`;
        this.socket = new WebSocket(wsUrl);
        
        // Setup event handlers
        this.socket.onopen = () => {
          console.log('WebSocket collaboration connected');
          this.connected = true;
          this.reconnectAttempts = 0;
          this.reconnecting = false;
          
          // Process any queued messages
          this.processQueue();
          
          // Notify handlers
          this.connectHandlers.forEach(handler => handler());
          
          resolve();
        };
        
        this.socket.onclose = (event) => {
          this.connected = false;
          console.log(`WebSocket collaboration disconnected: ${event.code} ${event.reason}`);
          
          // Notify handlers
          this.disconnectHandlers.forEach(handler => handler());
          
          // Attempt to reconnect if not closed cleanly
          if (!event.wasClean && !this.reconnecting) {
            this.attemptReconnect();
          }
        };
        
        this.socket.onerror = (error) => {
          console.error('WebSocket collaboration error:', error);
          
          // Notify handlers
          this.errorHandlers.forEach(handler => handler(new Error('WebSocket error')));
          
          if (!this.connected) {
            reject(new Error('Failed to connect to WebSocket server'));
          }
        };
        
        this.socket.onmessage = (event) => {
          try {
            const data = JSON.parse(event.data);
            this.handleMessage(data);
          } catch (error) {
            console.error('Error handling WebSocket message:', error);
            this.errorHandlers.forEach(handler => handler(error as Error));
          }
        };
        
      } catch (error) {
        console.error('Error connecting to WebSocket server:', error);
        this.errorHandlers.forEach(handler => handler(error as Error));
        reject(error);
      }
    });
  }
  
  /**
   * Attempt to reconnect to the WebSocket server
   * @private
   */
  private attemptReconnect() {
    if (this.reconnectAttempts >= this.maxReconnectAttempts || this.reconnecting) {
      return;
    }
    
    this.reconnecting = true;
    this.reconnectAttempts++;
    
    console.log(`Attempting to reconnect (${this.reconnectAttempts}/${this.maxReconnectAttempts})...`);
    
    setTimeout(() => {
      this.connect().then(() => {
        // If we were in a room, rejoin it
        if (this.currentRoomId && this.participantName) {
          this.joinRoom(this.currentRoomId, this.participantName);
        }
      }).catch(() => {
        this.reconnecting = false;
        if (this.reconnectAttempts < this.maxReconnectAttempts) {
          this.attemptReconnect();
        } else {
          console.error('Failed to reconnect after maximum attempts');
        }
      });
    }, this.reconnectInterval * this.reconnectAttempts);
  }
  
  /**
   * Process any queued messages
   * @private
   */
  private processQueue() {
    if (!this.connected || !this.socket) {
      return;
    }
    
    while (this.messageQueue.length > 0) {
      const message = this.messageQueue.shift();
      if (message && this.socket.readyState === WebSocket.OPEN) {
        this.socket.send(message);
      }
    }
  }
  
  /**
   * Handle incoming WebSocket messages
   * @param data Message data
   * @private
   */
  private handleMessage(data: any) {
    // Store participant ID if this is the initial connection message
    if (data.type === 'connected') {
      this.participantId = data.id;
    }
    
    // Update room ID if we've joined a room
    if (data.type === 'room-joined') {
      this.currentRoomId = data.roomId;
    }
    
    // Clear room ID if we've left the room
    if (data.type === 'room-left' || data.type === 'room-closed') {
      this.currentRoomId = null;
    }
    
    // Trigger type-specific handlers
    if (data.type && this.messageHandlers[data.type]) {
      this.messageHandlers[data.type].forEach(handler => handler(data));
    }
    
    // Trigger general message handlers
    if (this.messageHandlers['*']) {
      this.messageHandlers['*'].forEach(handler => handler(data));
    }
  }
  
  /**
   * Send a message to the WebSocket server
   * @param data Data to send
   * @returns Boolean indicating if the message was sent or queued
   */
  sendMessage(data: any): boolean {
    const message = JSON.stringify(data);
    
    if (this.connected && this.socket && this.socket.readyState === WebSocket.OPEN) {
      this.socket.send(message);
      return true;
    } else {
      // Queue message for when connection is established
      this.messageQueue.push(message);
      
      // Try to connect if not already connecting
      if (!this.reconnecting && (!this.socket || this.socket.readyState === WebSocket.CLOSED)) {
        this.connect().catch(error => {
          console.error('Error connecting to send message:', error);
        });
      }
      
      return false;
    }
  }
  
  /**
   * Disconnect from the WebSocket server
   */
  disconnect() {
    if (this.socket) {
      // Leave room if we're in one
      if (this.currentRoomId) {
        this.leaveRoom();
      }
      
      this.socket.close();
      this.socket = null;
      this.connected = false;
      this.currentRoomId = null;
    }
  }
  
  /**
   * Register an event handler
   * @param eventType Event type to handle
   * @param handler Handler function
   */
  on(eventType: 'connect' | 'disconnect' | 'error' | string, handler: MessageHandler | ErrorHandler | ConnectionHandler) {
    switch (eventType) {
      case 'connect':
        this.connectHandlers.push(handler as ConnectionHandler);
        break;
      case 'disconnect':
        this.disconnectHandlers.push(handler as ConnectionHandler);
        break;
      case 'error':
        this.errorHandlers.push(handler as ErrorHandler);
        break;
      default:
        if (!this.messageHandlers[eventType]) {
          this.messageHandlers[eventType] = [];
        }
        this.messageHandlers[eventType].push(handler as MessageHandler);
    }
  }
  
  /**
   * Remove an event handler
   * @param eventType Event type
   * @param handler Handler function to remove
   */
  off(eventType: 'connect' | 'disconnect' | 'error' | string, handler: MessageHandler | ErrorHandler | ConnectionHandler) {
    switch (eventType) {
      case 'connect':
        this.connectHandlers = this.connectHandlers.filter(h => h !== handler);
        break;
      case 'disconnect':
        this.disconnectHandlers = this.disconnectHandlers.filter(h => h !== handler);
        break;
      case 'error':
        this.errorHandlers = this.errorHandlers.filter(h => h !== handler);
        break;
      default:
        if (this.messageHandlers[eventType]) {
          this.messageHandlers[eventType] = this.messageHandlers[eventType].filter(
            h => h !== handler
          );
        }
    }
  }
  
  /**
   * Create a new collaboration room
   * @param roomName Name of the room to create
   * @param metadata Optional room metadata
   * @returns Promise that resolves when the room is created
   */
  createRoom(roomName: string, metadata?: Record<string, any>): Promise<Room> {
    return new Promise((resolve, reject) => {
      // Set up one-time handler for room created event
      const handleRoomCreated = (data: any) => {
        // Remove the handler
        this.off('room-created', handleRoomCreated);
        this.off('error', handleError);
        
        // Resolve with room data
        resolve({
          id: data.roomId,
          name: data.roomName,
          participants: [],
          metadata: metadata || {},
          createdAt: Date.now()
        });
      };
      
      // Set up one-time error handler
      const handleError = (error: any) => {
        // Only handle errors related to this operation
        if (error && error.operation === 'create-room') {
          // Remove handlers
          this.off('room-created', handleRoomCreated);
          this.off('error', handleError);
          
          reject(error);
        }
      };
      
      // Register handlers
      this.on('room-created', handleRoomCreated);
      this.on('error', handleError);
      
      // Send create room message
      this.sendMessage({
        type: 'create-room',
        roomName,
        metadata
      });
      
      // Set timeout for operation
      setTimeout(() => {
        // Remove handlers
        this.off('room-created', handleRoomCreated);
        this.off('error', handleError);
        
        reject(new Error('Timeout waiting for room creation'));
      }, 10000);
    });
  }
  
  /**
   * Join a collaboration room
   * @param roomId ID of the room to join
   * @param participantName Name to use in the room
   * @param autoCreate Whether to create the room if it doesn't exist
   * @returns Promise that resolves when the room is joined
   */
  joinRoom(roomId: string, participantName: string, autoCreate = false): Promise<Room> {
    return new Promise((resolve, reject) => {
      // Save participant name
      this.participantName = participantName;
      
      // Set up one-time handler for room joined event
      const handleRoomJoined = (data: any) => {
        // Remove the handlers
        this.off('room-joined', handleRoomJoined);
        this.off('error', handleError);
        
        // Update current room
        this.currentRoomId = data.roomId;
        
        // Request participants list
        this.sendMessage({
          type: 'get-room-participants'
        });
        
        // Resolve with basic room info (participants will be updated later)
        resolve({
          id: data.roomId,
          name: data.roomName,
          participants: [{
            id: data.participantId,
            name: data.participantName,
            isPublisher: true // Assume we're a publisher
          }],
          createdAt: Date.now()
        });
      };
      
      // Set up one-time error handler
      const handleError = (error: any) => {
        // Only handle errors related to this operation
        if (error && error.operation === 'join-room') {
          // Remove handlers
          this.off('room-joined', handleRoomJoined);
          this.off('error', handleError);
          
          reject(error);
        }
      };
      
      // Register handlers
      this.on('room-joined', handleRoomJoined);
      this.on('error', handleError);
      
      // Ensure we're connected first
      this.connect().then(() => {
        // Send join room message
        this.sendMessage({
          type: 'join-room',
          roomId,
          participantName,
          participantId: this.participantId,
          autoCreate
        });
      }).catch(reject);
      
      // Set timeout for operation
      setTimeout(() => {
        // Remove handlers
        this.off('room-joined', handleRoomJoined);
        this.off('error', handleError);
        
        reject(new Error('Timeout waiting to join room'));
      }, 10000);
    });
  }
  
  /**
   * Leave the current room
   * @returns Promise that resolves when the room is left
   */
  leaveRoom(): Promise<void> {
    return new Promise((resolve, reject) => {
      if (!this.currentRoomId) {
        resolve();
        return;
      }
      
      // Set up one-time handler for room left event
      const handleRoomLeft = () => {
        // Remove the handlers
        this.off('room-left', handleRoomLeft);
        this.off('error', handleError);
        
        // Clear current room
        this.currentRoomId = null;
        
        resolve();
      };
      
      // Set up one-time error handler
      const handleError = (error: any) => {
        // Only handle errors related to this operation
        if (error && error.operation === 'leave-room') {
          // Remove handlers
          this.off('room-left', handleRoomLeft);
          this.off('error', handleError);
          
          reject(error);
        }
      };
      
      // Register handlers
      this.on('room-left', handleRoomLeft);
      this.on('error', handleError);
      
      // Send leave room message
      this.sendMessage({
        type: 'leave-room',
        roomId: this.currentRoomId
      });
      
      // Set timeout for operation
      setTimeout(() => {
        // Remove handlers
        this.off('room-left', handleRoomLeft);
        this.off('error', handleError);
        
        // Force clear current room on timeout
        this.currentRoomId = null;
        
        resolve();
      }, 5000);
    });
  }
  
  /**
   * Send a chat message to the current room
   * @param content Message content
   * @param metadata Optional message metadata
   * @param targetParticipantId Optional participant ID to send to (private message)
   * @returns Promise that resolves when the message is sent
   */
  sendChatMessage(content: string, metadata?: Record<string, any>, targetParticipantId?: string): Promise<void> {
    return new Promise((resolve, reject) => {
      if (!this.currentRoomId) {
        reject(new Error('Not in a room'));
        return;
      }
      
      // Send message
      const sent = this.sendMessage({
        type: 'send-message',
        roomId: this.currentRoomId,
        content,
        metadata,
        targetParticipantId
      });
      
      if (sent) {
        resolve();
      } else {
        // We'll resolve anyway since the message is queued
        resolve();
      }
    });
  }
  
  /**
   * Update shared state in the current room
   * @param state State object to update
   * @returns Promise that resolves when the state is updated
   */
  updateState(state: Record<string, any>): Promise<void> {
    return new Promise((resolve, reject) => {
      if (!this.currentRoomId) {
        reject(new Error('Not in a room'));
        return;
      }
      
      // Send state update
      const sent = this.sendMessage({
        type: 'update-state',
        roomId: this.currentRoomId,
        state
      });
      
      if (sent) {
        resolve();
      } else {
        // We'll resolve anyway since the message is queued
        resolve();
      }
    });
  }
  
  /**
   * Update cursor position for collaborative editing
   * @param position Cursor position object (format depends on implementation)
   * @returns Promise that resolves when the cursor position is updated
   */
  updateCursor(position: any): Promise<void> {
    return new Promise((resolve, reject) => {
      if (!this.currentRoomId) {
        reject(new Error('Not in a room'));
        return;
      }
      
      // Send cursor update
      const sent = this.sendMessage({
        type: 'cursor-update',
        roomId: this.currentRoomId,
        position
      });
      
      if (sent) {
        resolve();
      } else {
        // We'll resolve anyway since the message is queued
        resolve();
      }
    });
  }
  
  /**
   * Update code content for collaborative editing
   * @param fileId ID of the file being edited
   * @param content New content
   * @param changes Optional change details (for incremental updates)
   * @returns Promise that resolves when the code is updated
   */
  updateCode(fileId: string, content: string, changes?: any): Promise<void> {
    return new Promise((resolve, reject) => {
      if (!this.currentRoomId) {
        reject(new Error('Not in a room'));
        return;
      }
      
      // Send code update
      const sent = this.sendMessage({
        type: 'code-update',
        roomId: this.currentRoomId,
        fileId,
        content,
        changes
      });
      
      if (sent) {
        resolve();
      } else {
        // We'll resolve anyway since the message is queued
        resolve();
      }
    });
  }
  
  /**
   * Get the current room ID
   * @returns Current room ID or null if not in a room
   */
  getCurrentRoomId(): string | null {
    return this.currentRoomId;
  }
  
  /**
   * Get the participant ID
   * @returns Participant ID or null if not connected
   */
  getParticipantId(): string | null {
    return this.participantId;
  }
  
  /**
   * Get the participant name
   * @returns Participant name or null if not set
   */
  getParticipantName(): string | null {
    return this.participantName;
  }
  
  /**
   * Set the participant name
   * @param name New participant name
   */
  setParticipantName(name: string) {
    this.participantName = name;
  }
  
  /**
   * Check if connected to the WebSocket server
   * @returns Boolean indicating if connected
   */
  isConnected(): boolean {
    return this.connected;
  }
  
  /**
   * Check if in a room
   * @returns Boolean indicating if in a room
   */
  isInRoom(): boolean {
    return Boolean(this.currentRoomId);
  }
}

// Create a singleton instance
export const webSocketCollab = new WebSocketCollab();

export default webSocketCollab;