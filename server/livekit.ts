import { AccessToken, RoomServiceClient } from 'livekit-server-sdk';

// Parse LiveKit environment variables (handle case where they might be bundled in one string)
let livekitApiKey = process.env.LIVEKIT_API_KEY;
let livekitApiSecret = process.env.LIVEKIT_API_SECRET;
let livekitUrl = process.env.LIVEKIT_URL;

// Check if the URL contains all environment variables (a common error when setting env vars)
if (livekitUrl && livekitUrl.includes('LIVEKIT_API_KEY=') && livekitUrl.includes('LIVEKIT_API_SECRET=')) {
  // Extract values from the string
  const urlMatch = livekitUrl.match(/LIVEKIT_URL=([^\s]+)/);
  const keyMatch = livekitUrl.match(/LIVEKIT_API_KEY=([^\s]+)/);
  const secretMatch = livekitUrl.match(/LIVEKIT_API_SECRET=([^\s]+)/);
  
  if (urlMatch && urlMatch[1]) livekitUrl = urlMatch[1];
  if (keyMatch && keyMatch[1] && !livekitApiKey) livekitApiKey = keyMatch[1];
  if (secretMatch && secretMatch[1] && !livekitApiSecret) livekitApiSecret = secretMatch[1];
  
  console.log('Fixed LiveKit environment variables from combined string');
}

// Use default URL if none provided
if (!livekitUrl) {
  livekitUrl = 'wss://dartopia-gvu1e64v.livekit.cloud';
}

// Initialize LiveKit room service client
const roomService = new RoomServiceClient(
  livekitUrl,
  livekitApiKey,
  livekitApiSecret
);

export const livekitHandler = {
  /**
   * Create a new LiveKit room
   * @param roomName Name of the room to create
   * @returns Promise with creation result
   */
  async createRoom(roomName: string): Promise<{ success: boolean; roomName: string }> {
    if (!livekitApiKey || !livekitApiSecret) {
      console.warn('LiveKit API key or secret not provided, skipping room creation');
      return { success: true, roomName };
    }
    
    try {
      await roomService.createRoom({
        name: roomName,
        emptyTimeout: 300, // Room closes after 5 minutes if empty
        maxParticipants: 10
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
    if (!livekitApiKey || !livekitApiSecret) {
      console.warn('LiveKit API key or secret not provided, returning mock token');
      return 'mock-token-for-development';
    }
    
    const token = new AccessToken(livekitApiKey, livekitApiSecret, {
      identity: participantName
    });
    
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
      // Create room if it doesn't exist
      await this.createRoom(roomName).catch(() => {
        // Ignore errors, room might already exist
        console.log(`Room ${roomName} might already exist, continuing...`);
      });
      
      // Generate token for the participant
      return this.generateToken(roomName, participantName);
    } catch (error) {
      console.error('Error joining room:', error);
      return `Error joining room: ${(error as Error).message}`;
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
    if (!livekitApiKey || !livekitApiSecret) {
      console.warn('LiveKit API key or secret not provided, skipping data sending');
      return;
    }
    
    try {
      // Serialize data to JSON
      const jsonData = JSON.stringify(data);
      const binaryData = new TextEncoder().encode(jsonData);
      
      // In a real implementation, we would use the appropriate DataPacket_Kind
      // and provide all required parameters. For now, we're just logging.
      console.log(`[MOCK] Sending data to room ${roomName}${participantIdentity ? ` for ${participantIdentity}` : ''}`);
      console.log(`[MOCK] Data:`, data);
      
      // Note: This would be the real implementation with proper types:
      // import { DataPacket_Kind } from 'livekit-server-sdk';
      // await roomService.sendData(roomName, binaryData, DataPacket_Kind.RELIABLE, participantIdentity ? [participantIdentity] : undefined);
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
    if (!livekitApiKey || !livekitApiSecret) {
      console.warn('LiveKit API key or secret not provided, returning empty participants list');
      return [];
    }
    
    try {
      const participants = await roomService.listParticipants(roomName);
      return participants;
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
    if (!livekitApiKey || !livekitApiSecret) {
      console.warn('LiveKit API key or secret not provided, skipping room closing');
      return;
    }
    
    try {
      await roomService.deleteRoom(roomName);
    } catch (error) {
      console.error('Error closing room:', error);
      throw error;
    }
  }
};