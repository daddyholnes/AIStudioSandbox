import {
  Room,
  RoomEvent,
  LocalTrack,
  RemoteTrack,
  RemoteParticipant,
  TrackPublication,
  ConnectionState,
  Track,
  LocalAudioTrack,
  createLocalAudioTrack
} from 'livekit-client';
import { apiRequest } from './queryClient';

let room: Room | null = null;

/**
 * Initialize a new LiveKit room instance
 */
export const initRoom = (): Room => {
  if (!room) {
    room = new Room();
    setupRoomEventListeners();
  }
  return room;
};

/**
 * Get the current room instance
 */
export const getRoom = (): Room | null => {
  return room;
};

/**
 * Connect to a LiveKit room with the provided token
 */
export const connectToRoom = async (token: string): Promise<boolean> => {
  if (!room) {
    initRoom();
  }

  if (!room) {
    console.error('Failed to initialize room');
    return false;
  }

  try {
    await room.connect(import.meta.env.VITE_LIVEKIT_URL || 'wss://your-livekit-server.com', token);
    return room.state === ConnectionState.Connected;
  } catch (error) {
    console.error('Error connecting to room:', error);
    return false;
  }
};

/**
 * Disconnect from the current LiveKit room
 */
export const disconnectFromRoom = () => {
  if (room) {
    room.disconnect();
  }
};

/**
 * Toggle microphone on/off
 */
export const toggleMicrophone = async (enabled: boolean): Promise<boolean> => {
  if (!room) {
    return false;
  }

  try {
    if (enabled) {
      // If we need to enable the microphone
      const audioPublications = room.localParticipant.getTrackPublications()
        .filter(pub => pub.kind === Track.Kind.Audio);
      
      if (audioPublications.length > 0) {
        // If we already have an audio track, just unmute it
        for (const pub of audioPublications) {
          pub.setMuted(false);
        }
      } else {
        // Otherwise create a new audio track
        const track = await createMicrophoneTrack();
        await room.localParticipant.publishTrack(track);
      }
    } else {
      // If we need to disable the microphone, mute all audio tracks
      const audioPublications = room.localParticipant.getTrackPublications()
        .filter(pub => pub.kind === Track.Kind.Audio);
      
      for (const pub of audioPublications) {
        pub.setMuted(true);
      }
    }
    
    // Return the current mute state (true means audio is enabled)
    const audioPublications = room.localParticipant.getTrackPublications()
      .filter(pub => pub.kind === Track.Kind.Audio);
    
    return audioPublications.some(pub => !pub.isMuted);
  } catch (error) {
    console.error('Error toggling microphone:', error);
    return false;
  }
};

/**
 * Create a microphone track for audio streaming
 */
export const createMicrophoneTrack = async (): Promise<LocalAudioTrack> => {
  try {
    return await createLocalAudioTrack({
      echoCancellation: true,
      noiseSuppression: true,
      autoGainControl: true
    });
  } catch (error) {
    console.error('Error creating microphone track:', error);
    throw error;
  }
};

/**
 * Setup event listeners for the LiveKit room
 */
const setupRoomEventListeners = () => {
  if (!room) return;

  room.on(RoomEvent.ParticipantConnected, (participant: RemoteParticipant) => {
    console.log(`Participant connected: ${participant.identity}`);
  });

  room.on(RoomEvent.ParticipantDisconnected, (participant: RemoteParticipant) => {
    console.log(`Participant disconnected: ${participant.identity}`);
  });

  room.on(RoomEvent.TrackSubscribed, (track: RemoteTrack, publication: TrackPublication, participant: RemoteParticipant) => {
    console.log(`Subscribed to ${track.kind} track from ${participant.identity}`);
    
    if (track.kind === Track.Kind.Audio) {
      try {
        // Attach audio track to audio element
        const audioElement = new Audio();
        // Use mediaStreamTrack for MediaStream creation
        const mediaTrack = track.mediaStreamTrack;
        if (mediaTrack) {
          audioElement.srcObject = new MediaStream([mediaTrack]);
          audioElement.play().catch(error => console.error('Error playing audio:', error));
        }
      } catch (error) {
        console.error('Error attaching audio track:', error);
      }
    }
  });

  room.on(RoomEvent.TrackUnsubscribed, (track: RemoteTrack, publication: TrackPublication, participant: RemoteParticipant) => {
    console.log(`Unsubscribed from ${track.kind} track from ${participant.identity}`);
  });

  room.on(RoomEvent.DataReceived, (data: Uint8Array, participant?: RemoteParticipant) => {
    try {
      const decodedData = new TextDecoder().decode(data);
      const parsedData = JSON.parse(decodedData);
      console.log('Received data:', parsedData, 'from:', participant?.identity);
    } catch (error) {
      console.error('Error decoding received data:', error);
    }
  });
};

/**
 * Generate a token for connecting to a LiveKit room
 */
export const generateToken = async (roomName: string, participantName: string): Promise<string> => {
  try {
    const response = await apiRequest<{ token: string }>('/api/livekit/token', {
      method: 'POST',
      body: JSON.stringify({
        roomName,
        participantName
      })
    });
    return response.token;
  } catch (error) {
    console.error('Error generating token:', error);
    throw error;
  }
};

/**
 * Create a new LiveKit room
 */
export const createRoom = async (roomName: string): Promise<{ success: boolean; roomName: string }> => {
  try {
    const response = await apiRequest<{ success: boolean; roomName: string }>('/api/livekit/room', {
      method: 'POST',
      body: JSON.stringify({ roomName })
    });
    return response;
  } catch (error) {
    console.error('Error creating room:', error);
    throw error;
  }
};