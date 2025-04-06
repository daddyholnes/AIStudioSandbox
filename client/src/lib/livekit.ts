import { Room, RoomEvent, LocalTrack, TrackPublication, RemoteTrack, RemoteParticipant, LocalParticipant, Track } from 'livekit-client';
import { apiRequest } from './queryClient';

// Room instance
let room: Room | null = null;
let microphoneTrack: LocalTrack | null = null;

// Initialize room
export const initRoom = (): Room => {
  if (!room) {
    room = new Room({
      adaptiveStream: true,
      dynacast: true,
      audioDeviceId: 'default'
    });
    
    // Set up event listeners
    setupRoomEventListeners();
  }
  
  return room;
};

// Get the room instance
export const getRoom = (): Room | null => {
  return room;
};

// Connect to a room
export const connectToRoom = async (token: string): Promise<boolean> => {
  try {
    const currentRoom = initRoom();
    
    if (currentRoom.state !== 'disconnected') {
      console.log('Already connected or connecting to a room');
      return currentRoom.state === 'connected';
    }
    
    // Connect to the room
    await currentRoom.connect(process.env.LIVEKIT_URL || 'wss://your-project-url.livekit.cloud', token);
    console.log('Connected to room:', currentRoom.name);
    
    return true;
  } catch (error) {
    console.error('Error connecting to room:', error);
    return false;
  }
};

// Disconnect from the room
export const disconnectFromRoom = () => {
  if (room) {
    room.disconnect();
    console.log('Disconnected from room');
  }
};

// Toggle microphone
export const toggleMicrophone = async (enabled: boolean): Promise<boolean> => {
  try {
    if (!room) {
      console.error('Room not initialized');
      return false;
    }
    
    const participant = room.localParticipant;
    
    if (enabled) {
      // Enable microphone if not already enabled
      if (!microphoneTrack) {
        microphoneTrack = await createLocalAudioTrack();
        await participant.publishTrack(microphoneTrack);
      } else {
        // Unpublish and republish if already exists
        await participant.publishTrack(microphoneTrack);
      }
    } else {
      // Disable microphone
      if (microphoneTrack) {
        await participant.unpublishTrack(microphoneTrack);
      }
    }
    
    return enabled;
  } catch (error) {
    console.error('Error toggling microphone:', error);
    return false;
  }
};

// Create a local audio track
export const createLocalAudioTrack = async (): Promise<LocalTrack> => {
  try {
    const audioTrack = await LocalTrack.createAudioTrack({
      deviceId: 'default',
      echoCancellation: true,
      noiseSuppression: true,
      autoGainControl: true
    });
    
    return audioTrack;
  } catch (error) {
    console.error('Error creating local audio track:', error);
    throw error;
  }
};

// Set up room event listeners
const setupRoomEventListeners = () => {
  if (!room) return;
  
  // When a participant connects
  room.on(RoomEvent.ParticipantConnected, (participant: RemoteParticipant) => {
    console.log('Participant connected:', participant.identity);
  });
  
  // When a participant disconnects
  room.on(RoomEvent.ParticipantDisconnected, (participant: RemoteParticipant) => {
    console.log('Participant disconnected:', participant.identity);
  });
  
  // When the local participant is connected to the room
  room.on(RoomEvent.Connected, () => {
    console.log('Connected to room:', room?.name);
  });
  
  // When the connection is disrupted
  room.on(RoomEvent.Disconnected, () => {
    console.log('Disconnected from room');
  });
  
  // When a new track is subscribed
  room.on(RoomEvent.TrackSubscribed, (track: RemoteTrack, publication: TrackPublication, participant: RemoteParticipant) => {
    console.log('Track subscribed:', track.kind, 'from', participant.identity);
    
    if (track.kind === Track.Kind.Audio) {
      // Attach audio to an audio element
      const audioElement = document.createElement('audio');
      audioElement.id = `audio-${participant.identity}`;
      audioElement.autoplay = true;
      audioElement.controls = false;
      document.body.appendChild(audioElement);
      
      track.attach(audioElement);
    }
  });
  
  // When a track is unsubscribed
  room.on(RoomEvent.TrackUnsubscribed, (track: RemoteTrack, publication: TrackPublication, participant: RemoteParticipant) => {
    console.log('Track unsubscribed:', track.kind, 'from', participant.identity);
    
    // Detach and remove any elements
    track.detach();
    
    if (track.kind === Track.Kind.Audio) {
      const audioElement = document.getElementById(`audio-${participant.identity}`);
      if (audioElement) {
        document.body.removeChild(audioElement);
      }
    }
  });
  
  // When receiving data through the channel
  room.on(RoomEvent.DataReceived, (data: Uint8Array, participant?: RemoteParticipant) => {
    try {
      const message = JSON.parse(new TextDecoder().decode(data));
      console.log('Data received:', message, 'from', participant?.identity || 'server');
      
      // Handle different message types
      if (message.type === 'chat') {
        // Handle chat message
        console.log('Chat message:', message.content);
      } else if (message.type === 'system') {
        // Handle system message
        console.log('System message:', message.content);
      }
    } catch (error) {
      console.error('Error processing received data:', error);
    }
  });
};

// Generate a room token (request from server)
export const generateToken = async (roomName: string, participantName: string): Promise<string> => {
  try {
    const response = await apiRequest('POST', '/api/livekit/token', {
      roomName,
      participantName
    });
    
    const data = await response.json();
    return data.token;
  } catch (error) {
    console.error('Error generating token:', error);
    throw error;
  }
};

// Create a room (request from server)
export const createRoom = async (roomName: string): Promise<{ success: boolean; roomName: string }> => {
  try {
    const response = await apiRequest('POST', '/api/livekit/room', {
      roomName
    });
    
    return await response.json();
  } catch (error) {
    console.error('Error creating room:', error);
    throw error;
  }
};
