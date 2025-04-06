// WebSocket-based Room Service
// This module provides real-time collaboration capabilities without LiveKit

import { WebSocketServer, WebSocket } from 'ws';
import { Server } from 'http';
import { v4 as uuidv4 } from 'uuid';
import { log } from '../vite';

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
    
    // Create WebSocket server
    this.wss = new WebSocketServer({ 
      server,
      path: '/ws'
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
      const data = JSON.parse(message.toString());
      
      switch (data.type) {
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
          log(`Unknown message type from client ${ws.clientId}: ${data.type}`, 'websocket');
      }
    } catch (error) {
      log(`Error parsing message from client ${ws.clientId}: ${error}`, 'websocket');
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
    const room = this.rooms.get(roomId)!;
    
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
    
    if (participant) {
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
    
    if (participant) {
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

// Create a singleton instance
export const webSocketRoomManager = new WebSocketRoomManager();