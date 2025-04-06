import { useState, useRef, useEffect } from 'react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Send, Mic, Paperclip, Bot, User } from 'lucide-react';
import { Prism as SyntaxHighlighter } from 'react-syntax-highlighter';
import { vscDarkPlus } from 'react-syntax-highlighter/dist/esm/styles/prism';
import { generateId } from '@/lib/utils';

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
  const [messages, setMessages] = useState<Message[]>([]);
  const [inputValue, setInputValue] = useState('');
  const [isRecording, setIsRecording] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const [activeSession, setActiveSession] = useState('default');
  
  // Add welcome message on mount
  useEffect(() => {
    const welcomeMessage: Message = {
      id: generateId(),
      sender: 'ai',
      senderName: 'AI Assistant',
      content: 'Hello! I\'m your AI assistant. How can I help you today?',
      timestamp: Date.now(),
      hasCode: false,
    };
    
    setMessages([welcomeMessage]);
  }, []);
  
  // Scroll to bottom when messages change
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);
  
  const handleSendMessage = async () => {
    if (!inputValue.trim()) return;
    
    const userMessage: Message = {
      id: generateId(),
      sender: 'user',
      senderName: 'You',
      content: inputValue,
      timestamp: Date.now(),
      hasCode: false,
    };
    
    setMessages(prev => [...prev, userMessage]);
    setInputValue('');
    
    try {
      // Show a loading indicator
      const tempId = generateId();
      setMessages(prev => [...prev, {
        id: tempId,
        sender: 'ai',
        senderName: 'AI Assistant',
        content: '...',
        timestamp: Date.now(),
        hasCode: false,
      }]);
      
      // In a real app, send to backend and get response
      // Simulate a delay
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      // Replace loading indicator with actual response
      const aiMessage: Message = {
        id: tempId,
        sender: 'ai',
        senderName: 'AI Assistant',
        content: simulateAIResponse(inputValue),
        timestamp: Date.now(),
        hasCode: inputValue.toLowerCase().includes('code') || inputValue.toLowerCase().includes('function'),
      };
      
      setMessages(prev => prev.map(msg => msg.id === tempId ? aiMessage : msg));
    } catch (error) {
      console.error('Error getting AI response:', error);
      
      const errorMessage: Message = {
        id: generateId(),
        sender: 'ai',
        senderName: 'AI Assistant',
        content: 'Sorry, I encountered an error. Please try again.',
        timestamp: Date.now(),
        hasCode: false,
      };
      
      setMessages(prev => [...prev.filter(msg => msg.content !== '...'), errorMessage]);
    }
  };
  
  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage();
    }
  };
  
  const toggleRecording = () => {
    setIsRecording(!isRecording);
    // In a real app, we would start/stop recording here
  };
  
  const extractCodeBlocks = (content: string): { text: string; codeBlocks: CodeBlock[] } => {
    const codeBlockRegex = /\`\`\`(\w+)?\n([\s\S]*?)\n\`\`\`/g;
    const codeBlocks: CodeBlock[] = [];
    
    // Replace code blocks with placeholders and collect code blocks
    const textWithoutCode = content.replace(codeBlockRegex, (match, language, code) => {
      codeBlocks.push({
        language: language || 'javascript',
        code,
      });
      return `[CODE_BLOCK_${codeBlocks.length - 1}]`;
    });
    
    return { text: textWithoutCode, codeBlocks };
  };
  
  const renderMessageContent = (message: Message) => {
    if (!message.hasCode) {
      return <p className="whitespace-pre-wrap">{message.content}</p>;
    }
    
    const { text, codeBlocks } = extractCodeBlocks(message.content);
    
    // Split text by code block placeholders
    const textParts = text.split(/\[CODE_BLOCK_(\d+)\]/);
    
    return (
      <div>
        {textParts.map((part, index) => {
          // Even indices are text parts
          if (index % 2 === 0) {
            return <p key={index} className="whitespace-pre-wrap">{part}</p>;
          }
          
          // Odd indices are code block references
          const blockIndex = parseInt(part, 10);
          const block = codeBlocks[blockIndex];
          
          return (
            <div key={index} className="my-2 rounded overflow-hidden">
              <div className="bg-muted/30 px-4 py-1 text-xs flex justify-between items-center">
                <span>{block.language}</span>
                <button className="text-xs hover:text-primary transition-colors">Copy</button>
              </div>
              <SyntaxHighlighter
                language={block.language}
                style={vscDarkPlus}
                customStyle={{ margin: 0, borderRadius: 0 }}
              >
                {block.code}
              </SyntaxHighlighter>
            </div>
          );
        })}
      </div>
    );
  };

  return (
    <div className="h-full flex flex-col bg-background border-l">
      <Tabs defaultValue="chat" className="w-full h-full flex flex-col">
        <div className="px-4 py-2 border-b">
          <TabsList className="w-full">
            <TabsTrigger value="chat" className="flex-1">Chat</TabsTrigger>
            <TabsTrigger value="sessions" className="flex-1">Sessions</TabsTrigger>
          </TabsList>
        </div>
        
        <TabsContent value="chat" className="flex-1 flex flex-col p-0 m-0">
          <div className="p-3 border-b">
            <h3 className="font-medium">AI Chat</h3>
            <p className="text-xs text-muted-foreground">
              {roomConnected ? `Connected to room: ${roomName}` : 'Not connected to a room'}
            </p>
          </div>
          
          <div className="flex-1 overflow-y-auto p-4">
            {messages.map(message => (
              <div
                key={message.id}
                className={`chat-message ${
                  message.sender === 'user' ? 'user-message' : 'ai-message'
                }`}
              >
                <div className="flex items-center mb-1">
                  {message.sender === 'user' ? (
                    <User className="h-4 w-4 mr-1" />
                  ) : (
                    <Bot className="h-4 w-4 mr-1" />
                  )}
                  <span className="text-xs font-medium">{message.senderName}</span>
                  <span className="text-xs text-muted-foreground ml-2">
                    {new Date(message.timestamp).toLocaleTimeString()}
                  </span>
                </div>
                {renderMessageContent(message)}
              </div>
            ))}
            <div ref={messagesEndRef} />
          </div>
          
          <div className="p-3 border-t">
            <div className="flex items-center space-x-2">
              <Input
                value={inputValue}
                onChange={e => setInputValue(e.target.value)}
                onKeyDown={handleKeyDown}
                placeholder="Type a message..."
                className="message-input"
              />
              <Button 
                variant="ghost" 
                size="icon" 
                onClick={toggleRecording}
                className={`toolbar-button ${isRecording ? 'text-red-500 bg-red-500/10' : ''}`}
              >
                <Mic className="h-5 w-5" />
              </Button>
              <Button variant="ghost" size="icon" className="toolbar-button">
                <Paperclip className="h-5 w-5" />
              </Button>
              <Button onClick={handleSendMessage} className="toolbar-button">
                <Send className="h-5 w-5" />
              </Button>
            </div>
          </div>
        </TabsContent>
        
        <TabsContent value="sessions" className="flex-1 flex flex-col p-0 m-0">
          <div className="p-3 border-b">
            <h3 className="font-medium">Chat Sessions</h3>
          </div>
          
          <div className="flex-1 overflow-y-auto p-2">
            <div 
              className={`p-2 rounded-md mb-2 cursor-pointer hover:bg-muted transition-colors ${
                activeSession === 'default' ? 'bg-primary/10 text-primary' : ''
              }`}
              onClick={() => setActiveSession('default')}
            >
              <div className="font-medium">Default Session</div>
              <div className="text-xs text-muted-foreground">Started today at 9:45 AM</div>
            </div>
            
            <div 
              className={`p-2 rounded-md mb-2 cursor-pointer hover:bg-muted transition-colors ${
                activeSession === 'code-generation' ? 'bg-primary/10 text-primary' : ''
              }`}
              onClick={() => setActiveSession('code-generation')}
            >
              <div className="font-medium">Code Generation</div>
              <div className="text-xs text-muted-foreground">Started yesterday at 3:20 PM</div>
            </div>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
};

// Simple simulation of AI responses
function simulateAIResponse(message: string): string {
  if (message.toLowerCase().includes('hello') || message.toLowerCase().includes('hi')) {
    return 'Hello there! How can I assist you today?';
  }
  
  if (message.toLowerCase().includes('help')) {
    return 'I can help you with:\n- Writing code\n- Debugging\n- Answering programming questions\n- Explaining concepts\n\nJust let me know what you need!';
  }
  
  if (message.toLowerCase().includes('code') || message.toLowerCase().includes('function')) {
    return 'Here\'s a simple function that might help:\n\n```javascript\nfunction calculateSum(arr) {\n  return arr.reduce((sum, num) => sum + num, 0);\n}\n\n// Example usage\nconst numbers = [1, 2, 3, 4, 5];\nconst sum = calculateSum(numbers);\nconsole.log(sum); // 15\n```\n\nThis function takes an array of numbers and returns their sum using the reduce method.';
  }
  
  return 'I understand your message. How can I assist you further with your coding project?';
}

export default AIPanel;