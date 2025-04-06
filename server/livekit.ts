import { AccessToken, RoomServiceClient } from 'livekit-server-sdk';

// LiveKit API key and secret from environment variables
const livekitApiKey = process.env.LIVEKIT_API_KEY;
const livekitApiSecret = process.env.LIVEKIT_API_SECRET;
const livekitUrl = process.env.LIVEKIT_URL || 'wss://dartopia-gvu1e64v.livekit.cloud';

// Initialize LiveKit room service client
const roomService = new RoomServiceClient(
  livekitUrl,
  livekitApiKey,
  livekitApiSecret
);

// LiveKit handler
export const livekitHandler = {
  /**
   * Create a new LiveKit room
   * @param roomName Name of the room to create
   * @returns Promise with creation result
   */
  async createRoom(roomName: string): Promise<{ success: boolean; roomName: string }> {
    try {
      await roomService.createRoom({
        name: roomName,
        emptyTimeout: 300, // Room closes after 5 minutes if empty
        maxParticipants: 2  // Limit to user and AI assistant
      });
      
      return { success: true, roomName };
    } catch (error) {
      console.error('Error creating room:', error);
      throw error;
    }
  },
  
  /**
   * Generate a token for joining a room
   * @param roomName Name of the room to join
   * @param participantName Name of the participant
   * @param isPublisher Whether the participant can publish media
   * @returns JWT token for room access
   */
  generateToken(roomName: string, participantName: string, isPublisher = true): string {
    const token = new AccessToken(livekitApiKey!, livekitApiSecret!, {
      identity: participantName
    });
    
    // Add appropriate permissions
    token.addGrant({
      roomJoin: true,
      room: roomName,
      canPublish: isPublisher,
      canSubscribe: true
    });
    
    return token.toJwt();
  },
  
  /**
   * Join or create a room and return access token
   * @param roomName Name of the room to join
   * @param participantName Name of the participant
   * @returns Promise with JWT token
   */
  async joinRoom(roomName: string, participantName: string): Promise<string> {
    try {
      // Check if room exists, create if it doesn't
      try {
        // Use listRooms to check if room exists - livekit-server-sdk doesn't have getRoom
        const rooms = await roomService.listRooms();
        const roomExists = rooms.some(room => room.name === roomName);
        
        if (!roomExists) {
          // Room doesn't exist, create it
          await this.createRoom(roomName);
        }
      } catch (error) {
        // Room doesn't exist or error occurred, create it
        await this.createRoom(roomName);
      }
      
      // Generate token for the participant
      const token = this.generateToken(roomName, participantName);
      
      return token;
    } catch (error) {
      console.error('Error joining room:', error);
      throw error;
    }
  },
  
  /**
   * Send data to a specific participant or the entire room
   * @param roomName Name of the room
   * @param data Data to send
   * @param participantIdentity Optional participant identity to send to
   * @returns Promise resolving when data is sent
   */
  async sendData(roomName: string, data: any, participantIdentity?: string): Promise<void> {
    try {
      // Send data to room or specific participant
      const dataToSend = Buffer.from(JSON.stringify(data));
      const kind = 1; // RELIABLE delivery
      
      if (participantIdentity) {
        await roomService.sendData(roomName, dataToSend, kind, [participantIdentity]);
      } else {
        await roomService.sendData(roomName, dataToSend, kind);
      }
    } catch (error) {
      console.error('Error sending data:', error);
      throw error;
    }
  },
  
  /**
   * Get all participants in a room
   * @param roomName Name of the room
   * @returns Promise with array of participants
   */
  async getRoomParticipants(roomName: string): Promise<any[]> {
    try {
      // Use listParticipants to get participants instead of getRoom
      const participants = await roomService.listParticipants(roomName);
      return participants || [];
    } catch (error) {
      console.error('Error getting room participants:', error);
      throw error;
    }
  },
  
  /**
   * Close a room
   * @param roomName Name of the room to close
   * @returns Promise resolving when room is closed
   */
  async closeRoom(roomName: string): Promise<void> {
    try {
      await roomService.deleteRoom(roomName);
    } catch (error) {
      console.error('Error closing room:', error);
      throw error;
    }
  }
};
