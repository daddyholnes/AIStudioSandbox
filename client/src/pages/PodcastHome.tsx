import { useState } from 'react';
import { Link, useLocation } from 'wouter';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { useToast } from '@/hooks/use-toast';

interface PodcastRoom {
  id: string;
  name: string;
  host: string;
  participants: number;
  isLive: boolean;
  createdAt: Date;
}

const PodcastHome = () => {
  const [, navigate] = useLocation();
  const { toast } = useToast();
  const [newRoomName, setNewRoomName] = useState('');
  
  // This would typically come from an API call to get active rooms
  // For demo purposes, using mock data
  const [activeRooms] = useState<PodcastRoom[]>([
    {
      id: 'tech-talk',
      name: 'Tech Talk',
      host: 'Alex Johnson',
      participants: 3,
      isLive: true,
      createdAt: new Date(Date.now() - 30 * 60000) // 30 minutes ago
    },
    {
      id: 'music-vibes',
      name: 'Music Vibes',
      host: 'Jamie Smith',
      participants: 2,
      isLive: true,
      createdAt: new Date(Date.now() - 15 * 60000) // 15 minutes ago
    }
  ]);

  const handleCreateRoom = () => {
    if (!newRoomName.trim()) {
      toast({
        title: 'Room name required',
        description: 'Please enter a name for your podcast room.',
        variant: 'destructive'
      });
      return;
    }

    // Create a room ID from the name (simplified)
    const roomId = newRoomName.toLowerCase().replace(/\s+/g, '-');
    
    // Navigate to the room
    navigate(`/podcast/${roomId}`);
  };

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="flex flex-col md:flex-row md:items-center md:justify-between mb-8">
        <div>
          <h1 className="text-4xl font-bold mb-2">Podplai Live</h1>
          <p className="text-lg text-muted-foreground">Create or join a live podcast session</p>
        </div>
        
        <div className="mt-4 md:mt-0 flex items-center gap-4">
          <Input
            placeholder="Enter a room name"
            value={newRoomName}
            onChange={(e) => setNewRoomName(e.target.value)}
            className="max-w-[200px]"
          />
          <Button onClick={handleCreateRoom}>Create Room</Button>
        </div>
      </div>

      <div className="mb-8">
        <h2 className="text-2xl font-semibold mb-4">Live Now</h2>
        
        {activeRooms.length > 0 ? (
          <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
            {activeRooms.map((room) => (
              <Card key={room.id} className="overflow-hidden transition-all hover:shadow-lg">
                <CardHeader className="relative pb-2">
                  {room.isLive && (
                    <div className="absolute top-4 right-4 bg-red-500 text-white text-xs px-2 py-1 rounded-full flex items-center">
                      <span className="block w-2 h-2 rounded-full bg-white mr-1"></span> LIVE
                    </div>
                  )}
                  <CardTitle>{room.name}</CardTitle>
                  <CardDescription>
                    Hosted by {room.host}
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="text-sm space-y-2">
                    <div className="flex justify-between">
                      <span>Started</span>
                      <span className="text-muted-foreground">
                        {room.createdAt.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span>Participants</span>
                      <span className="text-muted-foreground">{room.participants}</span>
                    </div>
                  </div>
                </CardContent>
                <CardFooter className="pt-2">
                  <Button asChild className="w-full">
                    <Link href={`/podcast/${room.id}`}>Join Room</Link>
                  </Button>
                </CardFooter>
              </Card>
            ))}
          </div>
        ) : (
          <div className="bg-muted/50 rounded-lg p-8 text-center">
            <h3 className="text-xl font-medium mb-2">No Live Podcasts</h3>
            <p className="text-muted-foreground mb-4">
              There are no live podcasts at the moment. Why not start your own?
            </p>
            <Button onClick={() => document.getElementById('new-room-input')?.focus()}>
              Start a Podcast
            </Button>
          </div>
        )}
      </div>

      <div>
        <h2 className="text-2xl font-semibold mb-4">How It Works</h2>
        <div className="grid gap-6 md:grid-cols-3">
          <Card>
            <CardHeader>
              <CardTitle>1. Create</CardTitle>
            </CardHeader>
            <CardContent>
              <p>Start a new podcast room and set yourself as the host. Give your podcast a catchy name!</p>
            </CardContent>
          </Card>
          
          <Card>
            <CardHeader>
              <CardTitle>2. Invite</CardTitle>
            </CardHeader>
            <CardContent>
              <p>Share your room link with guests and listeners. Anyone can join and listen in real-time.</p>
            </CardContent>
          </Card>
          
          <Card>
            <CardHeader>
              <CardTitle>3. Broadcast</CardTitle>
            </CardHeader>
            <CardContent>
              <p>Start your live session. Talk, discuss, and engage with listeners through audio and chat.</p>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
};

export default PodcastHome;