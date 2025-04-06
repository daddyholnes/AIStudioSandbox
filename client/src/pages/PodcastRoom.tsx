import { useState, useEffect } from 'react';
import { useToast } from '@/hooks/use-toast';
import { Button } from '@/components/ui/button';
import {
  connectToRoom,
  disconnectFromRoom,
  createRoom,
  generateToken,
  toggleMicrophone
} from '../lib/livekit';

interface PodcastRoomProps {
  roomId?: string;
}

const PodcastRoom = ({ roomId = '' }: PodcastRoomProps) => {
  const { toast } = useToast();
  const [isHost, setIsHost] = useState(false);
  const [roomName, setRoomName] = useState(roomId || '');
  const [participantName, setParticipantName] = useState('');
  const [isConnected, setIsConnected] = useState(false);
  const [isMicrophoneEnabled, setIsMicrophoneEnabled] = useState(false);
  const [participants, setParticipants] = useState<string[]>([]);
  const [isLoading, setIsLoading] = useState(false);

  // Connect to the room
  const handleJoinRoom = async () => {
    if (!roomName) {
      toast({
        title: 'Room name required',
        description: 'Please enter a room name to join or create.',
        variant: 'destructive'
      });
      return;
    }

    if (!participantName) {
      toast({
        title: 'Participant name required',
        description: 'Please enter your name to join the room.',
        variant: 'destructive'
      });
      return;
    }

    setIsLoading(true);

    try {
      // Create or join the room
      if (!roomId) {
        const result = await createRoom(roomName);
        if (result.success) {
          setIsHost(true);
        }
      }

      // Generate token and connect to room
      const token = await generateToken(roomName, participantName);
      const connected = await connectToRoom(token);

      if (connected) {
        setIsConnected(true);
        toast({
          title: 'Connected to room',
          description: `You've joined the podcast room "${roomName}".`,
        });

        // If host, enable microphone automatically
        if (isHost) {
          await handleToggleMicrophone(true);
        }
      } else {
        toast({
          title: 'Connection failed',
          description: 'Failed to connect to the room. Please try again.',
          variant: 'destructive'
        });
      }
    } catch (error) {
      console.error('Error joining room:', error);
      toast({
        title: 'Error joining room',
        description: 'An error occurred while joining the room.',
        variant: 'destructive'
      });
    } finally {
      setIsLoading(false);
    }
  };

  // Leave the room
  const handleLeaveRoom = () => {
    disconnectFromRoom();
    setIsConnected(false);
    setIsMicrophoneEnabled(false);
    toast({
      title: 'Disconnected',
      description: 'You have left the podcast room.',
    });
  };

  // Toggle microphone
  const handleToggleMicrophone = async (enabled: boolean) => {
    try {
      const result = await toggleMicrophone(enabled);
      setIsMicrophoneEnabled(result);
      toast({
        title: `Microphone ${result ? 'enabled' : 'disabled'}`,
        description: `Your microphone is now ${result ? 'on' : 'off'}.`,
      });
      return result;
    } catch (error) {
      console.error('Error toggling microphone:', error);
      toast({
        title: 'Microphone error',
        description: 'Failed to toggle microphone. Please check permissions.',
        variant: 'destructive'
      });
      return false;
    }
  };

  // Clean up on component unmount
  useEffect(() => {
    return () => {
      if (isConnected) {
        disconnectFromRoom();
      }
    };
  }, [isConnected]);

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="mb-8">
        <h1 className="text-3xl font-bold mb-4">
          {isConnected ? `Podcast Room: ${roomName}` : 'Join a Podcast'}
        </h1>
        <p className="text-lg text-gray-600 dark:text-gray-300">
          {isConnected
            ? `You are ${isHost ? 'hosting' : 'participating in'} this podcast room.`
            : 'Enter a room name to start or join a podcast.'}
        </p>
      </div>

      {!isConnected ? (
        <div className="grid gap-4 bg-card p-6 rounded-lg shadow-md max-w-md">
          <div className="space-y-4">
            <div>
              <label htmlFor="roomName" className="block text-sm font-medium mb-1">
                Room Name
              </label>
              <input
                id="roomName"
                type="text"
                className="w-full px-3 py-2 border rounded-md"
                value={roomName}
                onChange={(e) => setRoomName(e.target.value)}
                placeholder="Enter room name"
                disabled={!!roomId}
              />
            </div>
            <div>
              <label htmlFor="participantName" className="block text-sm font-medium mb-1">
                Your Name
              </label>
              <input
                id="participantName"
                type="text"
                className="w-full px-3 py-2 border rounded-md"
                value={participantName}
                onChange={(e) => setParticipantName(e.target.value)}
                placeholder="Enter your name"
              />
            </div>
            <Button 
              onClick={handleJoinRoom} 
              className="w-full" 
              disabled={isLoading}
            >
              {isLoading ? 'Connecting...' : roomId ? 'Join Podcast' : 'Create Podcast'}
            </Button>
          </div>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="md:col-span-2 bg-card p-6 rounded-lg shadow-md">
            <div className="mb-6">
              <h2 className="text-2xl font-semibold mb-4">Participants</h2>
              <div className="space-y-2">
                {participants.length > 0 ? (
                  participants.map((participant, index) => (
                    <div key={index} className="flex items-center p-3 rounded-md bg-muted">
                      <div className="w-3 h-3 rounded-full bg-green-500 mr-3"></div>
                      <span>{participant}</span>
                      {participant === participantName && (
                        <span className="ml-2 text-xs bg-primary/20 py-1 px-2 rounded-full">
                          You
                        </span>
                      )}
                    </div>
                  ))
                ) : (
                  <p className="text-gray-500">No participants yet.</p>
                )}
              </div>
            </div>

            <div className="mb-6">
              <h2 className="text-2xl font-semibold mb-4">Controls</h2>
              <div className="flex space-x-4">
                <Button
                  variant={isMicrophoneEnabled ? "destructive" : "default"}
                  onClick={() => handleToggleMicrophone(!isMicrophoneEnabled)}
                  className="flex items-center gap-2"
                >
                  <span className="material-icons">
                    {isMicrophoneEnabled ? 'mic' : 'mic_off'}
                  </span>
                  {isMicrophoneEnabled ? 'Mute' : 'Unmute'}
                </Button>
                <Button
                  variant="outline"
                  onClick={handleLeaveRoom}
                  className="flex items-center gap-2"
                >
                  <span className="material-icons">call_end</span>
                  Leave Room
                </Button>
              </div>
            </div>
          </div>

          <div className="bg-card p-6 rounded-lg shadow-md h-min">
            <h2 className="text-2xl font-semibold mb-4">Room Info</h2>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium mb-1">Room Name</label>
                <p className="text-lg font-semibold">{roomName}</p>
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">Your Role</label>
                <p className="text-lg font-semibold">{isHost ? 'Host' : 'Guest'}</p>
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">Share Link</label>
                <div className="flex items-center gap-2">
                  <input
                    type="text"
                    readOnly
                    value={`${window.location.origin}/podcast/${roomName}`}
                    className="w-full px-3 py-2 border rounded-md text-sm"
                  />
                  <Button
                    size="sm"
                    onClick={() => {
                      navigator.clipboard.writeText(`${window.location.origin}/podcast/${roomName}`);
                      toast({
                        title: 'Link copied',
                        description: 'Room link copied to clipboard.',
                      });
                    }}
                  >
                    Copy
                  </Button>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default PodcastRoom;