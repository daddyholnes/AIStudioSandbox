// WebSocket Collaboration Client
// This module provides a client-side implementation for collaborative
// editing and real-time communication via WebSockets.

import { EventEmitter } from 'events';
import { z } from 'zod';
import { FeatureState } from '../types';
import { useState, useEffect, useCallback } from 'react';

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

// Define Zod schemas for message validation
const PositionSchema = z.object({
  line: z.number(),
  column: z.number(),
});

// Base schema for all messages
const BaseMessageSchema = z.object({
  type: z.string(),
  timestamp: z.number().optional(),
});

// General event schema for initial validation
const EventSchema = BaseMessageSchema.extend({
  type: z.string(),
  payload: z.record(z.unknown()).optional(),
});

const MessageSchemas = {
  client_id: BaseMessageSchema.extend({
    type: z.literal('client_id'),
    clientId: z.string(),
  }),
  
  room_created: BaseMessageSchema.extend({
    type: z.literal('room_created'),
    roomId: z.string(),
  }),
  
  room_joined: BaseMessageSchema.extend({
    type: z.literal('room_joined'),
    roomId: z.string(),
    participants: z.array(
      z.object({
        id: z.string(),
        name: z.string(),
        isPublisher: z.boolean().optional(),
        joinedAt: z.string(),
        status: z.enum(['active', 'idle', 'away']).optional(),
      })
    ),
  }),
  
  room_left: BaseMessageSchema.extend({
    type: z.literal('room_left'),
  }),
  
  participant_joined: BaseMessageSchema.extend({
    type: z.literal('participant_joined'),
    roomId: z.string(),
    participantId: z.string(),
    participantName: z.string(),
  }),
  
  participant_left: BaseMessageSchema.extend({
    type: z.literal('participant_left'),
    roomId: z.string(),
    participantId: z.string(),
    participantName: z.string(),
  }),
  
  cursor_update: BaseMessageSchema.extend({
    type: z.literal('cursor_update'),
    roomId: z.string(),
    senderId: z.string(),
    position: PositionSchema,
  }),
  
  code_update: BaseMessageSchema.extend({
    type: z.literal('code_update'),
    roomId: z.string(),
    senderId: z.string(),
    senderName: z.string().optional(),
    fileId: z.string(),
    content: z.string(),
  }),
  
  error: BaseMessageSchema.extend({
    type: z.literal('error'),
    message: z.string(),
  }),
  
  pong: BaseMessageSchema.extend({
    type: z.literal('pong'),
  }),
  
  participants: BaseMessageSchema.extend({
    type: z.literal('participants'),
    roomId: z.string(),
    participants: z.array(
      z.object({
        id: z.string(),
        name: z.string(),
        isPublisher: z.boolean().optional(),
        joinedAt: z.string(),
        status: z.enum(['active', 'idle', 'away']).optional(),
      })
    ),
  }),
};

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
   * Handle and validate incoming WebSocket messages
   * @param rawData The raw message data (already parsed from JSON)
   */
  private handleMessage(rawData: unknown): void {
    // Validate the message against the base event schema
    const result = EventSchema.safeParse(rawData);
    if (!result.success) {
      console.error('Invalid message format:', result.error);
      return;
    }
    
    // Now we have a valid event with at least a type field
    const data = result.data;
    const messageType = data.type;
    
    // Additional validation with specific message schemas when available
    if (messageType in MessageSchemas) {
      try {
        // Validate against the appropriate schema
        const schema = MessageSchemas[messageType as keyof typeof MessageSchemas];
        const validatedData = schema.parse(data);
        
        // Process the validated message
        this.processMessage(messageType, validatedData);
      } catch (validationError) {
        console.error(`Message validation failed for type ${messageType}:`, validationError);
      }
    } else {
      // For unknown message types, just process with basic validation
      this.processMessage(messageType, data);
    }
  }
  
  /**
   * Process a validated message
   * @param messageType The message type
   * @param data The validated message data
   */
  private processMessage(messageType: string, data: any): void {
    // Handle client ID assignment
    if (messageType === 'client_id') {
      this.clientId = data.clientId;
    }
    
    // Handle room join confirmation
    else if (messageType === 'room_joined') {
      this.roomId = data.roomId;
      this.emit('room-joined', data);
    }
    
    // Handle room leave confirmation
    else if (messageType === 'room_left') {
      this.roomId = null;
      this.emit('room-left', data);
    }
    
    // Handle participant joined event
    else if (messageType === 'participant_joined') {
      this.emit('participant-joined', data);
    }
    
    // Handle participant left event
    else if (messageType === 'participant_left') {
      this.emit('participant-left', data);
    }
    
    // Handle cursor update event
    else if (messageType === 'cursor_update') {
      this.emit('cursor-update', data);
    }
    
    // Handle code update event
    else if (messageType === 'code_update') {
      this.emit('code-update', data);
    }
    
    // Handle ping response
    else if (messageType === 'pong') {
      // Connection is alive, nothing to do
    }
    
    // Forward all messages as a generic message event
    this.emit('message', data);
  }

  /**
   * Connect to the WebSocket server
   * @returns Promise that resolves when connected
   */
  connect(): Promise<void> {
    return new Promise((resolve, reject) => {
      try {
        // Clear any existing connection
        this.disconnect();
        
        // Create a new WebSocket connection with sessionId
        const protocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:';
        const sessionId = localStorage.getItem('sessionId') || 'default';
        const wsUrl = `${protocol}//${window.location.host}/ws/collab?sessionId=${sessionId}`;
        console.log(`Connecting to WebSocket server at ${wsUrl}...`);
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
            const rawData = JSON.parse(event.data);
            this.handleMessage(rawData);
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
   * Attempt to reconnect to the WebSocket server with improved reconnection logic
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
      
      // Improved exponential backoff with jitter to prevent thundering herd
      const jitter = Math.random() * 0.3 + 0.85; // Random between 0.85 and 1.15
      const baseTimeout = this.reconnectTimeout * Math.pow(2, this.reconnectAttempts - 1);
      const timeout = Math.min(baseTimeout * jitter, 30000); // Cap at 30 seconds
      
      this.reconnectTimer = setTimeout(() => {
        console.log(`Reconnecting after ${Math.round(timeout)}ms delay...`);
        
        this.connect()
          .then(() => {
            console.log('WebSocket collaboration connected');
            // If we were in a room before, attempt to rejoin
            if (this.roomId && this.participantName) {
              console.log(`Attempting to rejoin room ${this.roomId}...`);
              this.joinRoom(this.roomId, this.participantName)
                .then(() => {
                  console.log(`Successfully rejoined room ${this.roomId}`);
                })
                .catch(error => {
                  console.error(`Failed to rejoin room: ${error.message}`);
                });
            }
            this.reconnecting = false;
          })
          .catch((error) => {
            console.error(`Reconnection attempt failed: ${error.message}`);
            this.reconnecting = false;
            this.attemptReconnect();
          });
      }, timeout);
    } else {
      console.log('Failed to reconnect after maximum attempts');
      this.reconnecting = false;
      this.emit('error', new Error('Failed to reconnect after maximum attempts'));
      
      // After maximum attempts, we'll try one last time after a longer delay
      setTimeout(() => {
        console.log('Making final reconnection attempt...');
        this.reconnectAttempts = 0;
        this.connect().catch(error => {
          console.error(`Final reconnection attempt failed: ${error.message}`);
        });
      }, 60000); // Wait 1 minute before final attempt
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

export class WebSocketCollabService {
  private socket: WebSocket | null = null;
  private reconnectAttempts = 0;
  private readonly maxReconnectAttempts = 5;
  
  constructor() {
    this.connect();
  }
  
  connect() {
    const protocol = window.location.protocol === 'https:' ? 'wss' : 'ws';
    const wsUrl = `${protocol}://${window.location.hostname}:3001/ws/collab`;
    
    this.socket = new WebSocket(wsUrl);
    
    this.socket.onopen = () => {
      console.log('WebSocket connection established');
      this.reconnectAttempts = 0;
    };
    
    this.socket.onmessage = (event) => {
      try {
        const data = JSON.parse(event.data);
        this.handleMessage(data);
      } catch (error) {
        console.error('Error parsing WebSocket message:', error);
      }
    };
    
    this.socket.onclose = () => {
      if (this.reconnectAttempts < this.maxReconnectAttempts) {
        this.reconnectAttempts++;
        console.log(`WebSocket connection closed. Reconnecting (${this.reconnectAttempts}/${this.maxReconnectAttempts})...`);
        setTimeout(() => this.connect(), 1000 * this.reconnectAttempts);
      } else {
        console.error('WebSocket connection closed permanently after max reconnect attempts');
      }
    };
    
    this.socket.onerror = (error) => {
      console.error('WebSocket error:', error);
    };
  }
  
  private handleMessage(data: any) {
    const event = new CustomEvent('ws-message', { detail: data });
    window.dispatchEvent(event);
  }
  
  send(data: any) {
    if (this.socket?.readyState === WebSocket.OPEN) {
      this.socket.send(JSON.stringify(data));
    } else {
      console.warn('Cannot send message - WebSocket not connected');
    }
  }
  
  disconnect() {
    if (this.socket) {
      this.socket.close();
      this.socket = null;
    }
  }
}

// Create singleton instance
export const websocketCollab = new WebSocketCollabService();
export default websocketCollab;