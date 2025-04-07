// Purpose: Server-side WebSocket management for real-time collaboration.
// Ensure this file is used only for server-side WebSocket operations.

// WebSocket-based Room Service
// This module provides real-time collaboration capabilities without LiveKit

import { WebSocketServer, WebSocket } from 'ws';
import { Server } from 'http';
import { v4 as uuidv4 } from 'uuid';
import { log } from '../vite.js';
import { z } from 'zod';

// Participant in a room
interface Participant {
  id: string;
  ws: WebSocket;
  name: string;
  isPublisher: boolean;
  joinedAt: Date;
  status: 'active' | 'idle' | 'away';
}

// Room state
interface Room {
  id: string;
  participants: Map<string, Participant>;
  createdAt: Date;
  lastActive: Date;
}

// WebSocket connection with client ID
interface WebSocketWithId extends WebSocket {
  clientId: string;
}

// Message schemas for validation
const PositionSchema = z.object({
  line: z.number(),
  column: z.number(),
});

// Base schema for all messages
const BaseMessageSchema = z.object({
  type: z.string(),
  timestamp: z.number().optional(),
});

// Event schema for general validation
const EventSchema = BaseMessageSchema.extend({
  type: z.string(),
  payload: z.record(z.unknown()).optional(),
});

// Specific message schemas
const MessageSchemas = {
  ping: BaseMessageSchema.extend({
    type: z.literal('ping'),
  }),
  
  create_room: BaseMessageSchema.extend({
    type: z.literal('create_room'),
    roomId: z.string().optional(),
  }),
  
  join_room: BaseMessageSchema.extend({
    type: z.literal('join_room'),
    roomId: z.string(),
    participantName: z.string(),
    isPublisher: z.boolean().optional(),
  }),
  
  leave_room: BaseMessageSchema.extend({
    type: z.literal('leave_room'),
    roomId: z.string().optional(),
  }),
  
  get_participants: BaseMessageSchema.extend({
    type: z.literal('get_participants'),
    roomId: z.string(),
  }),
  
  status_update: BaseMessageSchema.extend({
    type: z.literal('status_update'),
    status: z.enum(['active', 'idle', 'away']),
  }),
  
  cursor_update: BaseMessageSchema.extend({
    type: z.literal('cursor_update'),
    position: PositionSchema,
  }),
  
  code_update: BaseMessageSchema.extend({
    type: z.literal('code_update'),
    fileId: z.string(),
    content: z.string(),
  }),
  
  chat_message: BaseMessageSchema.extend({
    type: z.literal('chat_message'),
    message: z.string(),
  }),
};

/**
 * WebSocketRoomManager
 * Manages rooms and participants for real-time collaboration
 */
export class WebSocketRoomManager {
  private rooms: Map<string, Room> = new Map();
  private clients: Map<string, Participant> = new Map();
  private wss: WebSocketServer | null = null;
  
  /**
   * Initialize the WebSocket server
   * @param server HTTP server instance
   */
  initialize(server: Server): void {
    if (this.wss) {
      return;
    }
    
    // Create WebSocket server with noServer true to handle upgrade manually
    this.wss = new WebSocketServer({
      noServer: true, // Handle upgrade manually
      perMessageDeflate: false // Disable compression which may cause issues
    });
    
    // Add custom upgrade handler to the HTTP server
    server.on('upgrade', (request, socket, head) => {
      const url = new URL(request.url || '', 'http://localhost');
      
      // Only handle our specific path, now supporting sessionId parameter
if (url.pathname === '/ws') {
        // Extract the sessionId if present (not yet used but captured for future use)
        const sessionId = url.searchParams.get('sessionId') || 'default';
        
        // Handle the upgrade regardless of sessionId parameter
        this.wss.handleUpgrade(request, socket, head, (ws) => {
          // Attach the sessionId to the socket for future reference
          (ws as any).sessionId = sessionId;
          this.wss.emit('connection', ws, request);
        });
      }
    });
    
    // Add CORS headers for WebSocket
    this.wss.on('headers', (headers, req) => {
      // More specific origin check if needed, e.g., based on req.headers.origin
      headers.push('Access-Control-Allow-Origin: http://localhost:5173'); // Allow specific client origin
      headers.push('Access-Control-Allow-Methods: GET, POST');
      // Add other headers if necessary, e.g., Access-Control-Allow-Headers
    });
    
    log('WebSocket collaboration server initialized', 'websocket');
    
    // Handle new connections
    this.wss.on('connection', (ws: WebSocket) => {
      const clientId = uuidv4();
      (ws as WebSocketWithId).clientId = clientId;
      
      log(`WebSocket client connected: ${clientId}`, 'websocket');
      
      // Send client ID to client
      ws.send(JSON.stringify({
        type: 'client_id',
        clientId
      }));
      
      // Handle messages
      ws.on('message', (message: Buffer) => {
        this.handleMessage(ws as WebSocketWithId, message);
      });
      
      // Handle disconnections
      ws.on('close', () => {
        this.handleDisconnect(ws as WebSocketWithId);
      });
      
      // Handle errors
      ws.on('error', (error: Error) => {
        log(`WebSocket error for client ${clientId}: ${error.message}`, 'websocket');
      });
    });
  }
  
  /**
   * Handle a message from a client
   * @param ws WebSocket connection
   * @param message Message buffer
   */
  private handleMessage(ws: WebSocketWithId, message: Buffer): void {
    try {
      // Parse the raw message
      const rawData = JSON.parse(message.toString());
      
      // Validate with the base event schema
      const result = EventSchema.safeParse(rawData);
      if (!result.success) {
        log(`Invalid message format from client ${ws.clientId}: ${result.error}`, 'websocket');
        ws.send(JSON.stringify({ 
          type: 'error', 
          message: 'Invalid message format' 
        }));
        return;
      }
      
      // Now we have a valid event with at least a type field
      const data = result.data;
      const messageType = data.type;
      
      // Validate against specific message schema if available
      if (messageType in MessageSchemas) {
        try {
          const schema = MessageSchemas[messageType as keyof typeof MessageSchemas];
          const validatedData = schema.parse(data);
          
          // Process the message based on type with validated data
          this.processMessage(ws, messageType, validatedData);
        } catch (validationError) {
          log(`Message validation failed for type ${messageType} from client ${ws.clientId}: ${validationError}`, 'websocket');
          ws.send(JSON.stringify({ 
            type: 'error', 
            message: `Invalid message format for ${messageType}` 
          }));
        }
      } else {
        // Unknown message type or no schema available, process with basic validation
        log(`Processing message type ${messageType} from client ${ws.clientId} with basic validation`, 'websocket');
        this.processMessage(ws, messageType, data);
      }
    } catch (error) {
      log(`Error parsing message from client ${ws.clientId}: ${error}`, 'websocket');
    }
  }
  
  /**
   * Process a validated message based on its type
   * @param ws WebSocket connection
   * @param messageType Message type
   * @param data Validated message data
   */
  private processMessage(ws: WebSocketWithId, messageType: string, data: any): void {
    switch (messageType) {
      case 'ping':
        // Respond to ping with pong
        ws.send(JSON.stringify({ type: 'pong' }));
        break;
        
      case 'create_room':
        this.handleCreateRoom(ws, data);
        break;
        
      case 'join_room':
        this.handleJoinRoom(ws, data);
        break;
        
      case 'leave_room':
        this.handleLeaveRoom(ws);
        break;
        
      case 'get_participants':
        this.handleGetParticipants(ws, data);
        break;
        
      case 'status_update':
        this.handleStatusUpdate(ws, data);
        break;
        
      case 'cursor_update':
        this.handleCursorUpdate(ws, data);
        break;
        
      case 'code_update':
        this.handleCodeUpdate(ws, data);
        break;
        
      case 'chat_message':
        this.handleChatMessage(ws, data);
        break;
        
      default:
        log(`Unknown message type from client ${ws.clientId}: ${messageType}`, 'websocket');
        ws.send(JSON.stringify({ 
          type: 'error', 
          message: 'Unknown message type' 
        }));
    }
  }
  
  /**
   * Handle client disconnect
   * @param ws WebSocket connection
   */
  private handleDisconnect(ws: WebSocketWithId): void {
    const participant = this.clients.get(ws.clientId);
    
    if (participant) {
      const roomId = this.getRoomIdForParticipant(ws.clientId);
      
      if (roomId) {
        // Remove from room
        const room = this.rooms.get(roomId);
        
        if (room) {
          room.participants.delete(ws.clientId);
          room.lastActive = new Date();
          
          log(`Participant ${ws.clientId} (${participant.name}) left room ${roomId}`, 'websocket');
          
          // Notify other participants
          this.broadcastToRoom(roomId, {
            type: 'participant_left',
            roomId,
            participantId: ws.clientId,
            participantName: participant.name
          }, ws.clientId);
          
          // Delete room if empty
          if (room.participants.size === 0) {
            this.rooms.delete(roomId);
            log(`Room ${roomId} deleted (no participants)`, 'websocket');
          }
        }
      }
      
      // Remove from clients
      this.clients.delete(ws.clientId);
    }
    
    log(`WebSocket client disconnected: ${ws.clientId}`, 'websocket');
  }
  
  /**
   * Handle create room request
   * @param ws WebSocket connection
   * @param data Message data
   */
  private handleCreateRoom(ws: WebSocketWithId, data: any): void {
    // Generate room ID if not provided
    const roomId = data.roomId || uuidv4().substring(0, 8);
    
    // Check if room already exists
    if (this.rooms.has(roomId)) {
      ws.send(JSON.stringify({
        type: 'error',
        message: 'Room already exists'
      }));
      return;
    }
    
    // Create new room
    this.rooms.set(roomId, {
      id: roomId,
      participants: new Map(),
      createdAt: new Date(),
      lastActive: new Date()
    });
    
    log(`Room ${roomId} created by client ${ws.clientId}`, 'websocket');
    
    // Send confirmation
    ws.send(JSON.stringify({
      type: 'room_created',
      roomId
    }));
  }
  
  /**
   * Handle join room request
   * @param ws WebSocket connection
   * @param data Message data
   */
  private handleJoinRoom(ws: WebSocketWithId, data: any): void {
    const roomId = data.roomId;
    const participantName = data.participantName || 'Anonymous';
    const isPublisher = data.isPublisher !== false; // Default to true
    
    // Check if room exists
    if (!this.rooms.has(roomId)) {
      ws.send(JSON.stringify({
        type: 'error',
        message: 'Room does not exist'
      }));
      return;
    }
    
    // Get room
    const room = this.rooms.get(roomId);
    if (!room) {
        ws.send(JSON.stringify({
            type: 'error',
            message: 'Room does not exist'
        }));
        return;
    }
    
    // Check if already in a room
    const existingRoomId = this.getRoomIdForParticipant(ws.clientId);
    
    if (existingRoomId) {
      // Leave existing room first
      this.handleLeaveRoom(ws);
    }
    
    // Create participant
    const participant: Participant = {
      id: ws.clientId,
      ws,
      name: participantName,
      isPublisher,
      joinedAt: new Date(),
      status: 'active'
    };
    
    // Add to room
    room.participants.set(ws.clientId, participant);
    room.lastActive = new Date();
    
    // Add to clients
    this.clients.set(ws.clientId, participant);
    
    log(`Participant ${ws.clientId} (${participantName}) joined room ${roomId}`, 'websocket');
    
    // Get all participants
    const participants = this.getParticipantsInRoom(roomId);
    
    // Send confirmation to client
    ws.send(JSON.stringify({
      type: 'room_joined',
      roomId,
      participants
    }));
    
    // Notify other participants
    this.broadcastToRoom(roomId, {
      type: 'participant_joined',
      roomId,
      participantId: ws.clientId,
      participantName: participantName
    }, ws.clientId);
  }
  
  /**
   * Handle leave room request
   * @param ws WebSocket connection
   */
  private handleLeaveRoom(ws: WebSocketWithId): void {
    const participant = this.clients.get(ws.clientId);
    
    if (!participant) {
      ws.send(JSON.stringify({
        type: 'error',
        message: 'Not in a room'
      }));
      return;
    }
    
    const roomId = this.getRoomIdForParticipant(ws.clientId);
    
    if (!roomId) {
      ws.send(JSON.stringify({
        type: 'error',
        message: 'Not in a room'
      }));
      return;
    }
    
    // Get room
    const room = this.rooms.get(roomId);
    
    if (room) {
      // Remove from room
      room.participants.delete(ws.clientId);
      room.lastActive = new Date();
      
      log(`Participant ${ws.clientId} (${participant.name}) left room ${roomId}`, 'websocket');
      
      // Notify other participants
      this.broadcastToRoom(roomId, {
        type: 'participant_left',
        roomId,
        participantId: ws.clientId,
        participantName: participant.name
      });
      
      // Delete room if empty
      if (room.participants.size === 0) {
        this.rooms.delete(roomId);
        log(`Room ${roomId} deleted (no participants)`, 'websocket');
      }
    }
    
    // Remove from clients
    this.clients.delete(ws.clientId);
    
    // Send confirmation
    ws.send(JSON.stringify({
      type: 'room_left'
    }));
  }
  
  /**
   * Handle get participants request
   * @param ws WebSocket connection
   * @param data Message data
   */
  private handleGetParticipants(ws: WebSocketWithId, data: any): void {
    const roomId = data.roomId;
    
    // Check if room exists
    if (!this.rooms.has(roomId)) {
      ws.send(JSON.stringify({
        type: 'error',
        message: 'Room does not exist'
      }));
      return;
    }
    
    // Get participants
    const participants = this.getParticipantsInRoom(roomId);
    
    // Send response
    ws.send(JSON.stringify({
      type: 'participants',
      roomId,
      participants
    }));
  }
  
  /**
   * Handle status update request
   * @param ws WebSocket connection
   * @param data Message data
   */
  private handleStatusUpdate(ws: WebSocketWithId, data: any): void {
    const status = data.status;
    const roomId = this.getRoomIdForParticipant(ws.clientId);
    
    if (!roomId) {
      ws.send(JSON.stringify({
        type: 'error',
        message: 'Not in a room'
      }));
      return;
    }
    
    // Get participant
    const participant = this.clients.get(ws.clientId);
    
    if (!participant) {
      ws.send(JSON.stringify({
        type: 'error',
        message: 'Not in a room'
      }));
      return;
    }
    
    // Update status
    participant.status = status;
    
    // Notify other participants
    this.broadcastToRoom(roomId, {
      type: 'status_update',
      roomId,
      participantId: ws.clientId,
      status
    });
  }
  
  /**
   * Handle cursor update request
   * @param ws WebSocket connection
   * @param data Message data
   */
  private handleCursorUpdate(ws: WebSocketWithId, data: any): void {
    const position = data.position;
    const roomId = this.getRoomIdForParticipant(ws.clientId);
    
    if (!roomId) {
      return;
    }
    
    // Notify other participants
    this.broadcastToRoom(roomId, {
      type: 'cursor_update',
      roomId,
      senderId: ws.clientId,
      position
    }, ws.clientId);
  }
  
  /**
   * Handle code update request
   * @param ws WebSocket connection
   * @param data Message data
   */
  private handleCodeUpdate(ws: WebSocketWithId, data: any): void {
    const fileId = data.fileId;
    const content = data.content;
    const roomId = this.getRoomIdForParticipant(ws.clientId);
    
    if (!roomId) {
      return;
    }
    
    // Get participant
    const participant = this.clients.get(ws.clientId);
    
    if (!participant || !participant.isPublisher) {
      return; // Only publishers can update code
    }
    
    // Notify other participants
    this.broadcastToRoom(roomId, {
      type: 'code_update',
      roomId,
      senderId: ws.clientId,
      senderName: participant.name,
      fileId,
      content
    }, ws.clientId);
  }
  
  /**
   * Handle chat message request
   * @param ws WebSocket connection
   * @param data Message data
   */
  private handleChatMessage(ws: WebSocketWithId, data: any): void {
    const message = data.message;
    const roomId = this.getRoomIdForParticipant(ws.clientId);
    
    if (!roomId) {
      ws.send(JSON.stringify({
        type: 'error',
        message: 'Not in a room'
      }));
      return;
    }
    
    // Get participant
    const participant = this.clients.get(ws.clientId);
    
    if (!participant) {
      ws.send(JSON.stringify({
        type: 'error',
        message: 'Not in a room'
      }));
      return;
    }
    
    // Broadcast to room
    this.broadcastToRoom(roomId, {
      type: 'chat_message',
      roomId,
      senderId: ws.clientId,
      senderName: participant.name,
      message,
      timestamp: new Date().toISOString()
    });
  }
  
  /**
   * Get the room ID for a participant
   * @param clientId Client ID
   * @returns Room ID or null
   */
  private getRoomIdForParticipant(clientId: string): string | null {
    for (const [roomId, room] of this.rooms.entries()) {
      if (room.participants.has(clientId)) {
        return roomId;
      }
    }
    
    return null;
  }
  
  /**
   * Get participants in a room
   * @param roomId Room ID
   * @returns Array of participants
   */
  private getParticipantsInRoom(roomId: string): any[] {
    const room = this.rooms.get(roomId);
    
    if (!room) {
      return [];
    }
    
    const participants = [];
    
    for (const [id, participant] of room.participants) {
      participants.push({
        id,
        name: participant.name,
        isPublisher: participant.isPublisher,
        joinedAt: participant.joinedAt.toISOString(),
        status: participant.status
      });
    }
    
    return participants;
  }
  
  /**
   * Broadcast a message to all participants in a room
   * @param roomId Room ID
   * @param message Message to broadcast
   * @param excludeClientId Client ID to exclude
   */
  private broadcastToRoom(roomId: string, message: any, excludeClientId?: string): void {
    const room = this.rooms.get(roomId);
    
    if (!room) {
      return;
    }
    
    const messageStr = JSON.stringify(message);
    
    for (const [clientId, participant] of room.participants) {
      if (excludeClientId && clientId === excludeClientId) {
        continue;
      }
      
      try {
        if (participant.ws.readyState === WebSocket.OPEN) {
          participant.ws.send(messageStr);
        }
      } catch (error) {
        log(`Error sending message to client ${clientId}: ${error}`, 'websocket');
      }
    }
  }
  
  /**
   * Get all rooms
   * @returns Array of rooms
   */
  getRooms(): any[] {
    const rooms = [];
    
    for (const [id, room] of this.rooms) {
      rooms.push({
        id,
        participantCount: room.participants.size,
        createdAt: room.createdAt.toISOString(),
        lastActive: room.lastActive.toISOString()
      });
    }
    
    return rooms;
  }
  
  /**
   * Get a room by ID
   * @param roomId Room ID
   * @returns Room or null
   */
  getRoom(roomId: string): any | null {
    const room = this.rooms.get(roomId);
    
    if (!room) {
      return null;
    }
    
    return {
      id: room.id,
      participants: this.getParticipantsInRoom(roomId),
      createdAt: room.createdAt.toISOString(),
      lastActive: room.lastActive.toISOString()
    };
  }
}

// Create a singleton instance of the Room Manager
export const webSocketRoomManager = new WebSocketRoomManager();