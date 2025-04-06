import { WebSocketServer, WebSocket } from 'ws';
import { Server } from 'http';
import { v4 as uuidv4 } from 'uuid';

// Define participant and room types
interface Participant {
  id: string;
  name: string;
  socket: WebSocket;
  isPublisher: boolean;
}

interface Room {
  id: string;
  name: string;
  participants: Map<string, Participant>;
  metadata?: Record<string, any>;
  createdAt: number;
}

// Main WebSocket collaboration service
class WebSocketCollaboration {
  private wss: WebSocketServer | null = null;
  private rooms: Map<string, Room> = new Map();
  
  /**
   * Initialize the WebSocket server
   * @param server HTTP server instance
   */
  initialize(server: Server) {
    // Create WebSocket server with a distinct path so it doesn't conflict
    // with Vite's HMR websocket or any other WebSockets
    this.wss = new WebSocketServer({ 
      server, 
      path: '/ws/collab'
    });
    
    console.log('WebSocket collaboration server initialized');
    
    // Handle connections
    this.wss.on('connection', (socket: WebSocket) => {
      // Create a unique ID for the socket
      const socketId = uuidv4();
      let participantRoom: Room | null = null;
      let participantId: string | null = null;
      
      console.log(`WebSocket client connected: ${socketId}`);
      
      // Handle messages from clients
      socket.on('message', (message: string) => {
        try {
          const data = JSON.parse(message);
          this.handleMessage(socket, socketId, data, participantRoom, participantId);
          
          // Update room reference if the message is a join room event
          if (data.type === 'join-room' && data.roomId) {
            const room = this.rooms.get(data.roomId);
            if (room) {
              participantRoom = room;
              participantId = data.participantId || socketId;
            }
          }
        } catch (error) {
          console.error('Error handling WebSocket message:', error);
          this.sendToSocket(socket, {
            type: 'error',
            error: 'Invalid message format'
          });
        }
      });
      
      // Handle disconnection
      socket.on('close', () => {
        console.log(`WebSocket client disconnected: ${socketId}`);
        this.handleDisconnect(socketId, participantRoom, participantId);
      });
      
      // Handle errors
      socket.on('error', (error) => {
        console.error(`WebSocket error for client ${socketId}:`, error);
      });
      
      // Send initial connection acknowledgment
      this.sendToSocket(socket, {
        type: 'connected',
        id: socketId
      });
    });
  }
  
  /**
   * Handle incoming WebSocket messages
   * @param socket WebSocket connection
   * @param socketId Socket identifier
   * @param data Message data
   * @param currentRoom Current room the participant is in
   * @param participantId Participant identifier
   */
  private handleMessage(
    socket: WebSocket, 
    socketId: string, 
    data: any, 
    currentRoom: Room | null,
    participantId: string | null
  ) {
    switch (data.type) {
      case 'create-room':
        this.handleCreateRoom(socket, data, socketId);
        break;
        
      case 'join-room':
        this.handleJoinRoom(socket, data, socketId);
        break;
        
      case 'leave-room':
        this.handleLeaveRoom(socketId, currentRoom, participantId);
        break;
        
      case 'send-message':
        this.handleSendMessage(data, currentRoom, participantId);
        break;
        
      case 'update-state':
        this.handleUpdateState(data, currentRoom, participantId);
        break;
        
      case 'cursor-update':
        this.handleCursorUpdate(data, currentRoom, participantId);
        break;
        
      case 'code-update':
        this.handleCodeUpdate(data, currentRoom, participantId);
        break;
        
      case 'get-room-participants':
        this.handleGetParticipants(socket, currentRoom);
        break;
        
      default:
        this.sendToSocket(socket, {
          type: 'error',
          error: `Unknown message type: ${data.type}`
        });
    }
  }
  
  /**
   * Handle create room requests
   * @param socket WebSocket connection
   * @param data Message data
   * @param socketId Socket identifier
   */
  private handleCreateRoom(socket: WebSocket, data: any, socketId: string) {
    // Generate a room ID if not provided
    const roomId = data.roomId || uuidv4();
    
    // Check if room already exists
    if (this.rooms.has(roomId)) {
      this.sendToSocket(socket, {
        type: 'error',
        error: 'Room already exists'
      });
      return;
    }
    
    // Create the room
    const room: Room = {
      id: roomId,
      name: data.roomName || `Room-${roomId}`,
      participants: new Map(),
      metadata: data.metadata || {},
      createdAt: Date.now()
    };
    
    this.rooms.set(roomId, room);
    
    // Respond with success
    this.sendToSocket(socket, {
      type: 'room-created',
      roomId,
      roomName: room.name
    });
    
    console.log(`Room created: ${roomId} (${room.name})`);
  }
  
  /**
   * Handle join room requests
   * @param socket WebSocket connection
   * @param data Message data
   * @param socketId Socket identifier
   */
  private handleJoinRoom(socket: WebSocket, data: any, socketId: string) {
    const { roomId, participantName, isPublisher = true } = data;
    const participantId = data.participantId || socketId;
    
    // Check if room exists
    const room = this.rooms.get(roomId);
    if (!room) {
      // Create the room if it doesn't exist and auto-create is set
      if (data.autoCreate) {
        this.handleCreateRoom(socket, data, socketId);
        // Now the room should exist, get it again
        const newRoom = this.rooms.get(roomId);
        if (!newRoom) {
          this.sendToSocket(socket, {
            type: 'error',
            error: 'Failed to create room'
          });
          return;
        }
        
        // Continue with the new room
        this.addParticipantToRoom(newRoom, socket, participantId, participantName, isPublisher);
        return;
      }
      
      // Room doesn't exist and auto-create is not enabled
      this.sendToSocket(socket, {
        type: 'error',
        error: 'Room does not exist'
      });
      return;
    }
    
    // Add participant to the room
    this.addParticipantToRoom(room, socket, participantId, participantName, isPublisher);
  }
  
  /**
   * Add a participant to a room
   * @param room Room to add participant to
   * @param socket WebSocket connection
   * @param participantId Participant identifier
   * @param participantName Participant name
   * @param isPublisher Whether the participant can publish (send data)
   */
  private addParticipantToRoom(
    room: Room, 
    socket: WebSocket, 
    participantId: string, 
    participantName: string = `User-${participantId.substring(0, 6)}`,
    isPublisher: boolean = true
  ) {
    // Create participant object
    const participant: Participant = {
      id: participantId,
      name: participantName,
      socket,
      isPublisher
    };
    
    // Add to the room
    room.participants.set(participantId, participant);
    
    // Notify the participant they've joined
    this.sendToSocket(socket, {
      type: 'room-joined',
      roomId: room.id,
      roomName: room.name,
      participantId,
      participantName
    });
    
    // Notify other participants about the new participant
    this.broadcastToRoom(room, {
      type: 'participant-joined',
      roomId: room.id,
      participantId,
      participantName
    }, participantId); // Exclude the new participant
    
    console.log(`Participant ${participantName} (${participantId}) joined room ${room.name} (${room.id})`);
  }
  
  /**
   * Handle leave room requests
   * @param socketId Socket identifier
   * @param currentRoom Current room the participant is in
   * @param participantId Participant identifier
   */
  private handleLeaveRoom(
    socketId: string, 
    currentRoom: Room | null,
    participantId: string | null
  ) {
    if (!currentRoom || !participantId) {
      return;
    }
    
    this.removeParticipantFromRoom(currentRoom, participantId);
  }
  
  /**
   * Remove a participant from a room
   * @param room Room to remove participant from
   * @param participantId Participant identifier
   */
  private removeParticipantFromRoom(room: Room, participantId: string) {
    // Get the participant
    const participant = room.participants.get(participantId);
    if (!participant) {
      return;
    }
    
    // Remove from the room
    room.participants.delete(participantId);
    
    // Notify the participant they've left
    this.sendToSocket(participant.socket, {
      type: 'room-left',
      roomId: room.id,
      participantId
    });
    
    // Notify other participants
    this.broadcastToRoom(room, {
      type: 'participant-left',
      roomId: room.id,
      participantId,
      participantName: participant.name
    });
    
    console.log(`Participant ${participant.name} (${participantId}) left room ${room.name} (${room.id})`);
    
    // Remove room if empty
    if (room.participants.size === 0) {
      this.rooms.delete(room.id);
      console.log(`Room ${room.name} (${room.id}) deleted as it's empty`);
    }
  }
  
  /**
   * Handle send message requests
   * @param data Message data
   * @param currentRoom Current room the participant is in
   * @param participantId Participant identifier
   */
  private handleSendMessage(
    data: any, 
    currentRoom: Room | null,
    participantId: string | null
  ) {
    if (!currentRoom || !participantId) {
      return;
    }
    
    // Get the participant
    const participant = currentRoom.participants.get(participantId);
    if (!participant) {
      return;
    }
    
    // Check if the participant can publish
    if (!participant.isPublisher) {
      this.sendToSocket(participant.socket, {
        type: 'error',
        error: 'You do not have permission to send messages'
      });
      return;
    }
    
    // Broadcast to all or specific participant
    if (data.targetParticipantId) {
      // Send to specific participant
      const targetParticipant = currentRoom.participants.get(data.targetParticipantId);
      if (targetParticipant) {
        this.sendToSocket(targetParticipant.socket, {
          type: 'message',
          roomId: currentRoom.id,
          senderId: participantId,
          senderName: participant.name,
          content: data.content,
          timestamp: Date.now(),
          metadata: data.metadata
        });
      }
    } else {
      // Broadcast to room
      this.broadcastToRoom(currentRoom, {
        type: 'message',
        roomId: currentRoom.id,
        senderId: participantId,
        senderName: participant.name,
        content: data.content,
        timestamp: Date.now(),
        metadata: data.metadata
      });
    }
  }
  
  /**
   * Handle state update requests (for shared state)
   * @param data Message data
   * @param currentRoom Current room the participant is in
   * @param participantId Participant identifier
   */
  private handleUpdateState(
    data: any, 
    currentRoom: Room | null,
    participantId: string | null
  ) {
    if (!currentRoom || !participantId) {
      return;
    }
    
    // Get the participant
    const participant = currentRoom.participants.get(participantId);
    if (!participant || !participant.isPublisher) {
      return;
    }
    
    // Update room metadata
    if (data.state) {
      currentRoom.metadata = {
        ...currentRoom.metadata,
        ...data.state
      };
    }
    
    // Broadcast state update
    this.broadcastToRoom(currentRoom, {
      type: 'state-updated',
      roomId: currentRoom.id,
      state: data.state,
      senderId: participantId,
      timestamp: Date.now()
    });
  }
  
  /**
   * Handle cursor update requests for collaborative editing
   * @param data Message data
   * @param currentRoom Current room the participant is in
   * @param participantId Participant identifier
   */
  private handleCursorUpdate(
    data: any, 
    currentRoom: Room | null,
    participantId: string | null
  ) {
    if (!currentRoom || !participantId) {
      return;
    }
    
    // Get the participant
    const participant = currentRoom.participants.get(participantId);
    if (!participant) {
      return;
    }
    
    // Broadcast cursor position to others
    this.broadcastToRoom(currentRoom, {
      type: 'cursor-update',
      roomId: currentRoom.id,
      senderId: participantId,
      senderName: participant.name,
      position: data.position,
      timestamp: Date.now()
    }, participantId); // Don't send back to sender
  }
  
  /**
   * Handle code update requests for collaborative editing
   * @param data Message data
   * @param currentRoom Current room the participant is in
   * @param participantId Participant identifier
   */
  private handleCodeUpdate(
    data: any, 
    currentRoom: Room | null,
    participantId: string | null
  ) {
    if (!currentRoom || !participantId) {
      return;
    }
    
    // Get the participant
    const participant = currentRoom.participants.get(participantId);
    if (!participant || !participant.isPublisher) {
      return;
    }
    
    // Broadcast code update
    this.broadcastToRoom(currentRoom, {
      type: 'code-update',
      roomId: currentRoom.id,
      senderId: participantId,
      senderName: participant.name,
      fileId: data.fileId,
      content: data.content,
      changes: data.changes,
      timestamp: Date.now()
    });
  }
  
  /**
   * Handle get participants request
   * @param socket WebSocket connection
   * @param currentRoom Current room the participant is in
   */
  private handleGetParticipants(socket: WebSocket, currentRoom: Room | null) {
    if (!currentRoom) {
      this.sendToSocket(socket, {
        type: 'error',
        error: 'Not in a room'
      });
      return;
    }
    
    // Get participants list (without socket objects)
    const participants = Array.from(currentRoom.participants.values()).map(p => ({
      id: p.id,
      name: p.name,
      isPublisher: p.isPublisher
    }));
    
    // Send participants list
    this.sendToSocket(socket, {
      type: 'room-participants',
      roomId: currentRoom.id,
      participants
    });
  }
  
  /**
   * Handle disconnect
   * @param socketId Socket identifier
   * @param currentRoom Current room the participant is in
   * @param participantId Participant identifier
   */
  private handleDisconnect(
    socketId: string, 
    currentRoom: Room | null,
    participantId: string | null
  ) {
    if (currentRoom && participantId) {
      this.removeParticipantFromRoom(currentRoom, participantId);
    }
  }
  
  /**
   * Send a message to a specific WebSocket
   * @param socket WebSocket to send to
   * @param data Data to send
   */
  private sendToSocket(socket: WebSocket, data: any) {
    if (socket.readyState === WebSocket.OPEN) {
      socket.send(JSON.stringify(data));
    }
  }
  
  /**
   * Broadcast a message to all participants in a room
   * @param room Room to broadcast to
   * @param data Data to broadcast
   * @param excludeParticipantId Optional participant ID to exclude
   */
  private broadcastToRoom(room: Room, data: any, excludeParticipantId?: string) {
    for (const [id, participant] of room.participants.entries()) {
      if (!excludeParticipantId || id !== excludeParticipantId) {
        this.sendToSocket(participant.socket, data);
      }
    }
  }
  
  /**
   * Get a list of all rooms
   * @returns Array of room information
   */
  getRooms() {
    return Array.from(this.rooms.values()).map(room => ({
      id: room.id,
      name: room.name,
      participantCount: room.participants.size,
      createdAt: room.createdAt
    }));
  }
  
  /**
   * Get a room by ID
   * @param roomId Room identifier
   * @returns Room if found, null otherwise
   */
  getRoom(roomId: string) {
    const room = this.rooms.get(roomId);
    if (!room) {
      return null;
    }
    
    return {
      id: room.id,
      name: room.name,
      participants: Array.from(room.participants.values()).map(p => ({
        id: p.id,
        name: p.name,
        isPublisher: p.isPublisher
      })),
      metadata: room.metadata,
      createdAt: room.createdAt
    };
  }
  
  /**
   * Create a new room
   * @param roomName Name of the room
   * @param metadata Optional room metadata
   * @returns Room information
   */
  createRoom(roomName: string, metadata?: Record<string, any>) {
    const roomId = uuidv4();
    const room: Room = {
      id: roomId,
      name: roomName,
      participants: new Map(),
      metadata,
      createdAt: Date.now()
    };
    
    this.rooms.set(roomId, room);
    console.log(`Room created via API: ${roomId} (${roomName})`);
    
    return {
      id: roomId,
      name: roomName,
      participantCount: 0,
      createdAt: room.createdAt
    };
  }
  
  /**
   * Close a room
   * @param roomId Room identifier
   * @returns Boolean indicating success
   */
  closeRoom(roomId: string): boolean {
    const room = this.rooms.get(roomId);
    if (!room) {
      return false;
    }
    
    // Notify all participants
    this.broadcastToRoom(room, {
      type: 'room-closed',
      roomId
    });
    
    // Remove the room
    this.rooms.delete(roomId);
    console.log(`Room closed: ${roomId} (${room.name})`);
    
    return true;
  }
  
  /**
   * Send data to a specific participant or the entire room
   * @param roomId Room identifier
   * @param data Data to send
   * @param participantId Optional participant to send to
   * @returns Boolean indicating success
   */
  sendData(roomId: string, data: any, participantId?: string): boolean {
    const room = this.rooms.get(roomId);
    if (!room) {
      return false;
    }
    
    if (participantId) {
      // Send to specific participant
      const participant = room.participants.get(participantId);
      if (!participant) {
        return false;
      }
      
      this.sendToSocket(participant.socket, data);
    } else {
      // Broadcast to all participants
      this.broadcastToRoom(room, data);
    }
    
    return true;
  }
}

// Export a singleton instance
export const webSocketCollaboration = new WebSocketCollaboration();