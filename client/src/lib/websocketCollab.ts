// WebSocket Collaboration Client
// This module provides a client-side implementation for collaborative
// editing and real-time communication via WebSockets.

import { EventEmitter } from 'events';

type WebSocketEvent = 
  | 'connect'
  | 'disconnect'
  | 'error'
  | 'room-joined'
  | 'room-left'
  | 'participant-joined'
  | 'participant-left'
  | 'cursor-update'
  | 'code-update'
  | 'message';

interface Position {
  line: number;
  column: number;
}

interface Participant {
  id: string;
  name: string;
  status?: 'active' | 'idle' | 'away';
  joinedAt: string;
}

class WebSocketCollab extends EventEmitter {
  private socket: WebSocket | null = null;
  private roomId: string | null = null;
  private clientId: string | null = null;
  private participantName: string = '';
  private reconnectAttempts: number = 0;
  private maxReconnectAttempts: number = 5;
  private reconnectTimeout: number = 2000;
  private reconnecting: boolean = false;
  private reconnectTimer: NodeJS.Timeout | null = null;
  private pingInterval: NodeJS.Timeout | null = null;
  private pingIntervalMs: number = 30000; // 30 seconds

  /**
   * Connect to the WebSocket server
   * @returns Promise that resolves when connected
   */
  connect(): Promise<void> {
    return new Promise((resolve, reject) => {
      try {
        // Clear any existing connection
        this.disconnect();
        
        // Create a new WebSocket connection
        const protocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:';
        const wsUrl = `${protocol}//${window.location.host}/ws/collab`;
        this.socket = new WebSocket(wsUrl);
        
        // Set up event handlers
        this.socket.onopen = () => {
          this.emit('connect');
          this.reconnectAttempts = 0;
          this.startPingInterval();
          resolve();
        };
        
        this.socket.onclose = (event) => {
          console.log(`WebSocket collaboration disconnected: ${event.code} ${event.reason}`);
          this.emit('disconnect', { code: event.code, reason: event.reason });
          this.socket = null;
          
          // Clear ping interval
          if (this.pingInterval) {
            clearInterval(this.pingInterval);
            this.pingInterval = null;
          }
          
          // Attempt to reconnect if not intentionally closed
          if (event.code !== 1000 && !this.reconnecting) {
            this.attemptReconnect();
          }
        };
        
        this.socket.onerror = (error) => {
          console.error('WebSocket collaboration error:', error);
          this.emit('error', error);
        };
        
        this.socket.onmessage = (event) => {
          try {
            const data = JSON.parse(event.data);
            
            // Handle client ID assignment
            if (data.type === 'client_id') {
              this.clientId = data.clientId;
            }
            
            // Handle room join confirmation
            if (data.type === 'room_joined') {
              this.roomId = data.roomId;
              this.emit('room-joined', data);
            }
            
            // Handle room leave confirmation
            if (data.type === 'room_left') {
              this.roomId = null;
              this.emit('room-left', data);
            }
            
            // Handle participant joined event
            if (data.type === 'participant_joined') {
              this.emit('participant-joined', data);
            }
            
            // Handle participant left event
            if (data.type === 'participant_left') {
              this.emit('participant-left', data);
            }
            
            // Handle cursor update event
            if (data.type === 'cursor_update') {
              this.emit('cursor-update', data);
            }
            
            // Handle code update event
            if (data.type === 'code_update') {
              this.emit('code-update', data);
            }
            
            // Handle ping response
            if (data.type === 'pong') {
              // Connection is alive, nothing to do
            }
            
            // Forward all messages as a generic message event
            this.emit('message', data);
          } catch (error) {
            console.error('Error parsing WebSocket message:', error);
          }
        };
      } catch (error) {
        console.error('Error connecting to WebSocket server:', error);
        reject(error);
      }
    });
  }
  
  /**
   * Start ping interval to keep the connection alive
   */
  private startPingInterval(): void {
    // Clear any existing interval
    if (this.pingInterval) {
      clearInterval(this.pingInterval);
    }
    
    // Set up a new interval
    this.pingInterval = setInterval(() => {
      if (this.socket && this.socket.readyState === WebSocket.OPEN) {
        this.socket.send(JSON.stringify({ type: 'ping' }));
      }
    }, this.pingIntervalMs);
  }
  
  /**
   * Attempt to reconnect to the WebSocket server
   */
  private attemptReconnect(): void {
    this.reconnecting = true;
    
    // Clear any existing reconnect timer
    if (this.reconnectTimer) {
      clearTimeout(this.reconnectTimer);
      this.reconnectTimer = null;
    }
    
    this.reconnectAttempts++;
    
    if (this.reconnectAttempts <= this.maxReconnectAttempts) {
      console.log(`Attempting to reconnect (${this.reconnectAttempts}/${this.maxReconnectAttempts})...`);
      
      // Exponential backoff
      const timeout = this.reconnectTimeout * Math.pow(1.5, this.reconnectAttempts - 1);
      
      this.reconnectTimer = setTimeout(() => {
        this.connect()
          .then(() => {
            // If we were in a room before, attempt to rejoin
            if (this.roomId && this.participantName) {
              this.joinRoom(this.roomId, this.participantName);
            }
            this.reconnecting = false;
          })
          .catch(() => {
            this.reconnecting = false;
            this.attemptReconnect();
          });
      }, timeout);
    } else {
      console.log('Failed to reconnect after maximum attempts');
      this.reconnecting = false;
      this.emit('error', new Error('Failed to reconnect after maximum attempts'));
    }
  }
  
  /**
   * Disconnect from the WebSocket server
   */
  disconnect(): void {
    // Clear any reconnect attempts
    this.reconnecting = false;
    
    if (this.reconnectTimer) {
      clearTimeout(this.reconnectTimer);
      this.reconnectTimer = null;
    }
    
    if (this.pingInterval) {
      clearInterval(this.pingInterval);
      this.pingInterval = null;
    }
    
    // Close the socket if it exists
    if (this.socket) {
      try {
        this.socket.close(1000, 'Normal closure');
      } catch (error) {
        console.error('Error closing WebSocket:', error);
      }
      this.socket = null;
    }
  }
  
  /**
   * Check if connected to the WebSocket server
   * @returns True if connected
   */
  isConnected(): boolean {
    return this.socket !== null && this.socket.readyState === WebSocket.OPEN;
  }
  
  /**
   * Check if in a room
   * @returns True if in a room
   */
  isInRoom(): boolean {
    return this.roomId !== null;
  }
  
  /**
   * Send a message to the WebSocket server
   * @param data Data to send
   * @returns Promise that resolves when the message is sent
   */
  send(data: any): Promise<void> {
    return new Promise((resolve, reject) => {
      if (!this.isConnected()) {
        reject(new Error('WebSocket not connected'));
        return;
      }
      
      try {
        this.socket!.send(JSON.stringify(data));
        resolve();
      } catch (error) {
        reject(error);
      }
    });
  }
  
  /**
   * Create a new room
   * @param roomId Room ID (optional, server will generate one if not provided)
   * @returns Promise that resolves with the room ID
   */
  async createRoom(roomId?: string): Promise<string> {
    if (!this.isConnected()) {
      throw new Error('WebSocket not connected');
    }
    
    await this.send({
      type: 'create_room',
      roomId
    });
    
    return new Promise((resolve) => {
      const handleRoomCreated = (data: any) => {
        if (data.type === 'room_created') {
          this.off('message', handleRoomCreated);
          resolve(data.roomId);
        }
      };
      
      this.on('message', handleRoomCreated);
    });
  }
  
  /**
   * Join a room
   * @param roomId Room ID
   * @param participantName Participant name
   * @param isPublisher Whether the participant can publish (default: true)
   * @returns Promise that resolves when joined
   */
  async joinRoom(roomId: string, participantName: string, isPublisher: boolean = true): Promise<void> {
    if (!this.isConnected()) {
      throw new Error('WebSocket not connected');
    }
    
    this.participantName = participantName;
    
    await this.send({
      type: 'join_room',
      roomId,
      participantName,
      isPublisher
    });
    
    return new Promise((resolve) => {
      const handleRoomJoined = (data: any) => {
        if (data.type === 'room_joined' && data.roomId === roomId) {
          this.roomId = data.roomId;
          this.off('room-joined', handleRoomJoined);
          resolve();
        }
      };
      
      this.on('room-joined', handleRoomJoined);
    });
  }
  
  /**
   * Leave the current room
   * @returns Promise that resolves when left
   */
  async leaveRoom(): Promise<void> {
    if (!this.isConnected() || !this.isInRoom()) {
      throw new Error('Not in a room');
    }
    
    await this.send({
      type: 'leave_room',
      roomId: this.roomId
    });
    
    return new Promise((resolve) => {
      const handleRoomLeft = () => {
        this.roomId = null;
        this.off('room-left', handleRoomLeft);
        resolve();
      };
      
      this.on('room-left', handleRoomLeft);
    });
  }
  
  /**
   * Update cursor position
   * @param position Cursor position (line and column)
   * @returns Promise that resolves when sent
   */
  async updateCursor(position: Position): Promise<void> {
    if (!this.isConnected() || !this.isInRoom()) {
      throw new Error('Not in a room');
    }
    
    await this.send({
      type: 'cursor_update',
      roomId: this.roomId,
      position
    });
  }
  
  /**
   * Update code content
   * @param fileId File ID
   * @param content Code content
   * @returns Promise that resolves when sent
   */
  async updateCode(fileId: string, content: string): Promise<void> {
    if (!this.isConnected() || !this.isInRoom()) {
      throw new Error('Not in a room');
    }
    
    await this.send({
      type: 'code_update',
      roomId: this.roomId,
      fileId,
      content
    });
  }
  
  /**
   * Get participants in the current room
   * @returns Promise that resolves with an array of participants
   */
  async getParticipants(): Promise<Participant[]> {
    if (!this.isConnected() || !this.isInRoom()) {
      throw new Error('Not in a room');
    }
    
    await this.send({
      type: 'get_participants',
      roomId: this.roomId
    });
    
    return new Promise((resolve) => {
      const handleParticipants = (data: any) => {
        if (data.type === 'participants' && data.roomId === this.roomId) {
          this.off('message', handleParticipants);
          resolve(data.participants);
        }
      };
      
      this.on('message', handleParticipants);
    });
  }
  
  /**
   * Update participant status
   * @param status Status ('active', 'idle', 'away')
   * @returns Promise that resolves when sent
   */
  async updateStatus(status: 'active' | 'idle' | 'away'): Promise<void> {
    if (!this.isConnected() || !this.isInRoom()) {
      throw new Error('Not in a room');
    }
    
    await this.send({
      type: 'status_update',
      roomId: this.roomId,
      status
    });
  }
  
  /**
   * Send a chat message to the room
   * @param message Message text
   * @returns Promise that resolves when sent
   */
  async sendChatMessage(message: string): Promise<void> {
    if (!this.isConnected() || !this.isInRoom()) {
      throw new Error('Not in a room');
    }
    
    await this.send({
      type: 'chat_message',
      roomId: this.roomId,
      message
    });
  }
}

// Create a singleton instance
export const webSocketCollab = new WebSocketCollab();