import { useState, useEffect, useRef } from 'react';
import { Button } from '@/components/ui/button';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Textarea } from '@/components/ui/textarea';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { apiRequest } from '@/lib/queryClient';
import { useMutation, useQuery } from '@tanstack/react-query';
import { initRoom, connectToRoom, toggleMicrophone } from '@/lib/livekit';
import { queryClient } from '@/lib/queryClient';

interface Message {
  id: string;
  sender: string;
  senderName: string;
  content: string;
  timestamp: number;
  hasCode: boolean;
}

interface CodeBlock {
  language: string;
  code: string;
}

interface AIPanelProps {
  roomConnected: boolean;
  roomName: string;
}

const AIPanel = ({ roomConnected, roomName }: AIPanelProps) => {
  const [message, setMessage] = useState('');
  const [messages, setMessages] = useState<Message[]>([]);
  const [micEnabled, setMicEnabled] = useState(false);
  const [micActivity, setMicActivity] = useState(0);
  const scrollAreaRef = useRef<HTMLDivElement>(null);
  
  // Query for getting message history
  const { data: chatHistory, isLoading } = useQuery({
    queryKey: ['/api/chat/history'],
    queryFn: () => {
      // If we can't load history, just start with welcome message
      return {
        messages: [
          {
            id: '1',
            sender: 'assistant',
            senderName: 'Gemini Assistant',
            content: "Welcome to Dartopia, your AI-powered development environment! I'm connected via LiveKit and ready to help you build your application.\n\nWhat would you like to work on today?",
            timestamp: Date.now() - 60000,
            hasCode: false
          }
        ]
      };
    }
  });
  
  // Mutation for sending a message
  const sendMessageMutation = useMutation({
    mutationFn: async (content: string) => {
      // Add the user message to the UI immediately
      const userMessage: Message = {
        id: Date.now().toString(),
        sender: 'user',
        senderName: 'You',
        content,
        timestamp: Date.now(),
        hasCode: false
      };
      
      setMessages(prev => [...prev, userMessage]);
      
      try {
        // Simulated API call - in a real implementation this would send to backend
        // const response = await apiRequest('POST', '/api/chat/message', { content });
        // return await response.json();
        
        // For now, just simulate an AI response
        return simulateAIResponse(content);
      } catch (error) {
        console.error('Error sending message:', error);
        throw error;
      }
    },
    onSuccess: (data) => {
      // Add the AI response to the UI
      setMessages(prev => [...prev, data]);
      queryClient.invalidateQueries({ queryKey: ['/api/chat/history'] });
    }
  });
  
  // Toggle microphone
  const toggleMic = async () => {
    const newState = !micEnabled;
    setMicEnabled(newState);
    
    try {
      await toggleMicrophone(newState);
      
      // Simulate mic activity
      if (newState) {
        const interval = setInterval(() => {
          setMicActivity(Math.random() * 0.8);
        }, 200);
        
        return () => clearInterval(interval);
      }
    } catch (error) {
      console.error('Error toggling microphone:', error);
      setMicEnabled(false);
    }
  };
  
  // Handle message submission
  const handleSendMessage = () => {
    if (message.trim()) {
      sendMessageMutation.mutate(message);
      setMessage('');
    }
  };
  
  // Handle Enter key for sending message
  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage();
    }
  };
  
  // Extract code blocks from message content
  const extractCodeBlocks = (content: string): (string | CodeBlock)[] => {
    const parts: (string | CodeBlock)[] = [];
    const codeBlockRegex = /```(\w+)?\n([\s\S]*?)\n```/g;
    
    let lastIndex = 0;
    let match;
    
    while ((match = codeBlockRegex.exec(content)) !== null) {
      // Add text before the code block
      if (match.index > lastIndex) {
        parts.push(content.substring(lastIndex, match.index));
      }
      
      // Add the code block
      parts.push({
        language: match[1] || 'plaintext',
        code: match[2]
      });
      
      lastIndex = match.index + match[0].length;
    }
    
    // Add remaining text after the last code block
    if (lastIndex < content.length) {
      parts.push(content.substring(lastIndex));
    }
    
    return parts;
  };
  
  // Simulate AI response (for demo purposes)
  const simulateAIResponse = (userMessage: string): Promise<Message> => {
    return new Promise((resolve) => {
      // Simple simulation logic
      let response = '';
      
      if (userMessage.toLowerCase().includes('livekit') || userMessage.toLowerCase().includes('room')) {
        response = "I'd be happy to help you set up a LiveKit room connection! Here's how you can implement it:\n\n```javascript\nimport { Room } from 'livekit-client';\n\nconst room = new Room({\n  adaptiveStream: true,\n  dynacast: true,\n  audioDeviceId: 'default'\n});\n\nasync function connectToRoom(token) {\n  try {\n    await room.connect('wss://your-project-url.livekit.cloud', token);\n    console.log('Connected to room:', room.name);\n    setupAudioTracks();\n  } catch (error) {\n    console.error('Error connecting to room:', error);\n  }\n}\n```\n\nYou'll need to first generate a token from your server. Here's how to set up the audio tracks after connecting:\n\n```javascript\nasync function setupAudioTracks() {\n  // Publish local audio\n  const microphoneTrack = await createLocalAudioTrack();\n  await room.localParticipant.publishTrack(microphoneTrack);\n  \n  // Subscribe to remote tracks\n  room.on('trackSubscribed', (track, publication, participant) => {\n    if (track.kind === 'audio') {\n      // Attach audio to audio element\n      const audioElement = document.getElementById('remote-audio');\n      track.attach(audioElement);\n    }\n  });\n}\n```\n\nWould you like me to help implement the server-side token generation as well?";
      } else if (userMessage.toLowerCase().includes('gemini') || userMessage.toLowerCase().includes('ai')) {
        response = "Gemini is Google's advanced AI model that I'm based on. To integrate Gemini into your application, you can use the Google AI Node.js client. Here's a simple example:\n\n```javascript\nconst { GoogleGenerativeAI } = require('@google/generative-ai');\n\n// Access your API key (use environment variables in production)\nconst genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);\n\nasync function generateContent(prompt) {\n  // For text-only input, use the gemini-pro model\n  const model = genAI.getGenerativeModel({ model: 'gemini-2.0-flash-exp' });\n  \n  const result = await model.generateContent(prompt);\n  const response = await result.response;\n  return response.text();\n}\n\n// Example usage\ngenerateContent('Explain how to use LiveKit with Gemini')\n  .then(text => console.log(text))\n  .catch(err => console.error(err));\n```\n\nYou can find more details in the [Google AI documentation](https://ai.google.dev/docs).\n\nDo you need help with any specific aspect of AI integration?";
      } else {
        response = "I'm here to help with your development needs. I can assist with:\n\n- Setting up LiveKit for real-time audio/video\n- Integrating Google AI models like Gemini\n- Writing and debugging code\n- Explaining programming concepts\n- Providing code examples and tutorials\n\nJust let me know what you'd like to work on, and we can get started!";
      }
      
      setTimeout(() => {
        resolve({
          id: (Date.now() + 1).toString(),
          sender: 'assistant',
          senderName: 'Gemini Assistant',
          content: response,
          timestamp: Date.now(),
          hasCode: response.includes('```')
        });
      }, 1000);
    });
  };
  
  // Initialize messages from chat history
  useEffect(() => {
    if (chatHistory && !isLoading) {
      setMessages(chatHistory.messages);
    }
  }, [chatHistory, isLoading]);
  
  // Auto-scroll to bottom when messages change
  useEffect(() => {
    if (scrollAreaRef.current) {
      const scrollContainer = scrollAreaRef.current.querySelector('[data-radix-scroll-area-viewport]');
      if (scrollContainer) {
        scrollContainer.scrollTop = scrollContainer.scrollHeight;
      }
    }
  }, [messages]);
  
  return (
    <div className="w-96 bg-card border-l border-gray-700 flex flex-col">
      <div className="px-4 py-3 border-b border-gray-700 flex items-center justify-between">
        <h2 className="font-google-sans font-medium">AI ASSISTANT (GEMINI)</h2>
        <div className="flex space-x-2">
          <Button 
            variant="ghost" 
            size="icon" 
            className={`opacity-${micEnabled ? '100' : '70'} hover:opacity-100 transition-opacity`}
            onClick={toggleMic}
          >
            <i className={`ri-mic-${micEnabled ? 'fill' : 'line'} text-lg`}></i>
          </Button>
          <Button variant="ghost" size="icon" className="opacity-70 hover:opacity-100 transition-opacity">
            <i className="ri-more-2-fill"></i>
          </Button>
        </div>
      </div>
      
      <div className="bg-muted p-2 border-b border-gray-700">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <div className="w-2 h-2 rounded-full bg-green-500"></div>
            <span className="text-xs font-roboto">Connected to {roomName}</span>
          </div>
          <Button variant="secondary" size="sm" className="text-xs h-6">Room Settings</Button>
        </div>
      </div>
      
      <ScrollArea className="flex-1 p-4" ref={scrollAreaRef}>
        <div className="space-y-6">
          {messages.map((msg) => (
            <div key={msg.id} className="chat-message">
              {msg.sender === 'assistant' ? (
                <>
                  <div className="flex items-center space-x-2 mb-1">
                    <div className="w-6 h-6 rounded-full bg-primary flex items-center justify-center">
                      <i className="ri-ai-generate text-xs text-white"></i>
                    </div>
                    <span className="font-medium text-sm">{msg.senderName}</span>
                    <span className="text-xs text-muted-foreground">
                      {new Date(msg.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                    </span>
                  </div>
                  <div className="pl-8 text-sm text-gray-300 space-y-2">
                    {msg.hasCode ? (
                      extractCodeBlocks(msg.content).map((part, index) => {
                        if (typeof part === 'string') {
                          return (
                            <p key={index} className="whitespace-pre-line">{part}</p>
                          );
                        } else {
                          return (
                            <div key={index} className="mt-2 mb-3 bg-background rounded-md overflow-hidden">
                              <div className="bg-muted px-3 py-1.5 text-xs flex justify-between items-center">
                                <span>{part.language}</span>
                                <Button 
                                  variant="ghost" 
                                  size="icon" 
                                  className="h-6 w-6 hover:bg-secondary"
                                  onClick={() => navigator.clipboard.writeText(part.code)}
                                >
                                  <i className="ri-clipboard-line text-xs"></i>
                                </Button>
                              </div>
                              <pre className="p-3 text-xs overflow-x-auto">
                                <code>{part.code}</code>
                              </pre>
                            </div>
                          );
                        }
                      })
                    ) : (
                      <p className="whitespace-pre-line">{msg.content}</p>
                    )}
                  </div>
                </>
              ) : (
                <>
                  <div className="flex items-center justify-end mb-1">
                    <span className="text-xs text-muted-foreground mr-2">
                      {new Date(msg.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                    </span>
                    <span className="font-medium text-sm">{msg.senderName}</span>
                  </div>
                  <div className="text-sm text-gray-300">
                    <p className="whitespace-pre-line">{msg.content}</p>
                  </div>
                </>
              )}
            </div>
          ))}
          
          {sendMessageMutation.isPending && (
            <div className="chat-message">
              <div className="flex items-center space-x-2 mb-1">
                <div className="w-6 h-6 rounded-full bg-primary flex items-center justify-center">
                  <i className="ri-ai-generate text-xs text-white"></i>
                </div>
                <span className="font-medium text-sm">Gemini Assistant</span>
              </div>
              <div className="pl-8 text-sm text-gray-300">
                <div className="flex items-center space-x-2">
                  <div className="h-2 w-2 bg-primary rounded-full animate-bounce"></div>
                  <div className="h-2 w-2 bg-primary rounded-full animate-bounce" style={{ animationDelay: '0.2s' }}></div>
                  <div className="h-2 w-2 bg-primary rounded-full animate-bounce" style={{ animationDelay: '0.4s' }}></div>
                </div>
              </div>
            </div>
          )}
        </div>
      </ScrollArea>
      
      <div className="p-4 border-t border-gray-700">
        <div className="relative">
          <Textarea 
            className="w-full bg-muted border border-gray-700 rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-primary resize-none" 
            placeholder="Ask me anything..." 
            rows={2}
            value={message}
            onChange={(e) => setMessage(e.target.value)}
            onKeyDown={handleKeyDown}
          />
          <div className="absolute right-2 bottom-2 flex space-x-2">
            <Button 
              variant="ghost" 
              size="icon" 
              className="h-6 w-6 text-muted-foreground hover:text-foreground"
            >
              <i className="ri-attachment-2"></i>
            </Button>
            <Button 
              variant="ghost" 
              size="icon" 
              className="h-6 w-6 text-primary hover:bg-secondary"
              onClick={handleSendMessage}
              disabled={!message.trim() || sendMessageMutation.isPending}
            >
              <i className="ri-send-plane-fill"></i>
            </Button>
          </div>
        </div>
        
        <div className="flex justify-between items-center mt-2 text-xs text-muted-foreground">
          <div>{micEnabled ? 'Microphone active' : 'Microphone inactive'}</div>
          <div className="flex items-center space-x-4">
            {micEnabled && (
              <div className="flex items-center">
                <i className="ri-mic-line mr-1"></i>
                <div className="w-12 h-1 bg-gray-700 rounded-full overflow-hidden">
                  <div 
                    className="bg-green-500 h-full" 
                    style={{ width: `${micActivity * 100}%`, transition: 'width 0.1s ease-in-out' }}
                  ></div>
                </div>
              </div>
            )}
            <div className="flex items-center">
              <i className="ri-speaker-line mr-1"></i>
              <span>Active</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AIPanel;
