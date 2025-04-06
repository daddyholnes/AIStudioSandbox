import { useState, useRef, useEffect } from 'react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { 
  Send, 
  Mic, 
  Paperclip, 
  Bot, 
  User, 
  Code, 
  Image, 
  MessageSquare, 
  Sparkles, 
  FileCode, 
  FileText,
  Settings,
  ChevronRight,
  Maximize2,
  X,
  ImagePlus
} from 'lucide-react';
import { Prism as SyntaxHighlighter } from 'react-syntax-highlighter';
import { vscDarkPlus } from 'react-syntax-highlighter/dist/esm/styles/prism';
import { generateId } from '@/lib/utils';
import { 
  ResizableHandle,
  ResizablePanel,
  ResizablePanelGroup,
} from "@/components/ui/resizable";
import { Separator } from "@/components/ui/separator";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";

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
  const [mode, setMode] = useState<'chat' | 'code' | 'image'>('chat');
  const [chatMode, setChatMode] = useState<'chat' | 'history' | 'settings'>('chat');
  const [isStandalone, setIsStandalone] = useState(false);
  const [position, setPosition] = useState({ x: 100, y: 100 });
  const [isDragging, setIsDragging] = useState(false);
  const [dragStart, setDragStart] = useState({ x: 0, y: 0 });
  
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
            <div key={index} className="my-2 rounded-md overflow-hidden border border-border">
              <div className="bg-muted/30 px-4 py-1 text-xs flex justify-between items-center">
                <span>{block.language}</span>
                <Button variant="ghost" size="sm" className="h-6 px-2 text-xs">Copy</Button>
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

  // For draggable chat window in standalone mode
  const handleMouseDown = (e: React.MouseEvent<HTMLDivElement>) => {
    if (!isStandalone) return;
    setIsDragging(true);
    setDragStart({
      x: e.clientX - position.x,
      y: e.clientY - position.y
    });
  };

  useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => {
      if (!isDragging) return;
      
      setPosition({
        x: e.clientX - dragStart.x,
        y: e.clientY - dragStart.y
      });
    };

    const handleMouseUp = () => {
      setIsDragging(false);
    };

    if (isDragging) {
      document.addEventListener('mousemove', handleMouseMove);
      document.addEventListener('mouseup', handleMouseUp);
    }

    return () => {
      document.removeEventListener('mousemove', handleMouseMove);
      document.removeEventListener('mouseup', handleMouseUp);
    };
  }, [isDragging, dragStart]);

  const toggleStandaloneMode = () => {
    setIsStandalone(!isStandalone);
    if (!isStandalone) {
      // Set initial position for floating window
      setPosition({
        x: window.innerWidth / 2 - 200,
        y: window.innerHeight / 2 - 300
      });
    }
  };

  // Memoize the main content to avoid re-rendering when dragging
  const renderChatContent = () => (
    <div className="flex-1 overflow-y-auto p-4">
      {messages.map(message => (
        <div
          key={message.id}
          className={cn(
            "my-4 px-4 py-3 rounded-lg",
            message.sender === 'user' 
              ? "bg-primary-foreground ml-8" 
              : "bg-muted/30 mr-8"
          )}
        >
          <div className="flex items-center mb-2">
            {message.sender === 'user' ? (
              <div className="bg-primary h-6 w-6 rounded-full flex items-center justify-center text-primary-foreground text-xs mr-2">
                <User className="h-3 w-3" />
              </div>
            ) : (
              <div className="bg-blue-500 h-6 w-6 rounded-full flex items-center justify-center text-white text-xs mr-2">
                <Bot className="h-3 w-3" />
              </div>
            )}
            <span className="text-xs font-medium">{message.senderName}</span>
            <span className="text-xs text-muted-foreground ml-2">
              {new Date(message.timestamp).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}
            </span>
          </div>
          <div className="pl-8">
            {renderMessageContent(message)}
          </div>
        </div>
      ))}
      <div ref={messagesEndRef} />
    </div>
  );

  // Main panel rendering logic
  if (isStandalone) {
    return (
      <div 
        className="fixed bg-background border border-border rounded-lg shadow-lg overflow-hidden flex flex-col"
        style={{
          width: 400,
          height: 500,
          left: position.x,
          top: position.y,
          zIndex: 50
        }}
      >
        <div 
          className="px-4 py-2 bg-secondary/50 flex items-center justify-between cursor-move"
          onMouseDown={handleMouseDown}
        >
          <div className="flex items-center">
            <Bot className="h-4 w-4 mr-2" />
            <span className="font-medium text-sm">AI Assistant</span>
          </div>
          <div className="flex items-center space-x-1">
            <Button variant="ghost" size="icon" className="h-6 w-6" onClick={toggleStandaloneMode}>
              <Maximize2 className="h-3 w-3" />
            </Button>
            <Button variant="ghost" size="icon" className="h-6 w-6 hover:bg-destructive/10 hover:text-destructive" onClick={toggleStandaloneMode}>
              <X className="h-3 w-3" />
            </Button>
          </div>
        </div>
        
        <div className="flex-1 flex flex-col overflow-hidden">
          {renderChatContent()}
        </div>
        
        <div className="p-3 border-t border-border">
          <div className="flex items-center space-x-2">
            <Input
              value={inputValue}
              onChange={e => setInputValue(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder="Type a message..."
              className="text-sm"
            />
            <Button 
              variant="ghost" 
              size="icon" 
              onClick={toggleRecording}
              className={`h-8 w-8 ${isRecording ? 'text-red-500 bg-red-500/10' : ''}`}
            >
              <Mic className="h-4 w-4" />
            </Button>
            <Button 
              onClick={handleSendMessage} 
              size="icon"
              className="h-8 w-8 bg-blue-600 hover:bg-blue-700 text-white rounded-full flex items-center justify-center"
            >
              <Send className="h-4 w-4" />
            </Button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="h-full flex flex-col bg-background border-l border-border">
      <div className="flex items-center justify-between border-b border-border px-4 py-2">
        <div className="flex gap-3">
          <Button 
            variant={mode === 'chat' ? 'secondary' : 'ghost'} 
            className="h-8 px-3 text-xs"
            onClick={() => setMode('chat')}
          >
            <MessageSquare className="h-3.5 w-3.5 mr-1.5" />
            Chat
          </Button>
          <Button 
            variant={mode === 'code' ? 'secondary' : 'ghost'} 
            className="h-8 px-3 text-xs"
            onClick={() => setMode('code')}
          >
            <Code className="h-3.5 w-3.5 mr-1.5" />
            Code
          </Button>
          <Button 
            variant={mode === 'image' ? 'secondary' : 'ghost'} 
            className="h-8 px-3 text-xs"
            onClick={() => setMode('image')}
          >
            <Image className="h-3.5 w-3.5 mr-1.5" />
            Image
          </Button>
        </div>
        <Button variant="outline" size="icon" className="h-7 w-7" onClick={toggleStandaloneMode}>
          <Maximize2 className="h-3.5 w-3.5" />
        </Button>
      </div>
      
      {mode === 'chat' && (
        <ResizablePanelGroup direction="horizontal" className="flex-1">
          <ResizablePanel defaultSize={75} minSize={60}>
            <div className="flex flex-col h-full">
              <div className="p-3 border-b border-border flex justify-between items-center">
                <div className="flex space-x-3">
                  <Button 
                    variant={chatMode === 'chat' ? 'secondary' : 'ghost'} 
                    size="sm" 
                    className="h-7 px-2.5 text-xs"
                    onClick={() => setChatMode('chat')}
                  >
                    Chat
                  </Button>
                  <Button 
                    variant={chatMode === 'history' ? 'secondary' : 'ghost'} 
                    size="sm" 
                    className="h-7 px-2.5 text-xs"
                    onClick={() => setChatMode('history')}
                  >
                    History
                  </Button>
                  <Button 
                    variant={chatMode === 'settings' ? 'secondary' : 'ghost'} 
                    size="sm" 
                    className="h-7 px-2.5 text-xs"
                    onClick={() => setChatMode('settings')}
                  >
                    <Settings className="h-3 w-3 mr-1" />
                    Settings
                  </Button>
                </div>
                <Badge variant="outline" className="text-xs">
                  <span className="w-1.5 h-1.5 rounded-full bg-green-500 mr-1.5" />
                  Connected
                </Badge>
              </div>
              
              {chatMode === 'chat' && (
                <>
                  {renderChatContent()}
                  
                  <div className="p-3 border-t border-border">
                    <div className="flex items-center space-x-2">
                      <Input
                        value={inputValue}
                        onChange={e => setInputValue(e.target.value)}
                        onKeyDown={handleKeyDown}
                        placeholder="Message Gemini..."
                        className="text-sm"
                      />
                      <Button 
                        variant="ghost" 
                        size="icon" 
                        onClick={toggleRecording}
                        className={`h-8 w-8 ${isRecording ? 'text-red-500 bg-red-500/10' : ''}`}
                      >
                        <Mic className="h-4 w-4" />
                      </Button>
                      <Button variant="ghost" size="icon" className="h-8 w-8">
                        <Paperclip className="h-4 w-4" />
                      </Button>
                      <Button variant="ghost" size="icon" className="h-8 w-8">
                        <ImagePlus className="h-4 w-4" />
                      </Button>
                      <Button 
                        onClick={handleSendMessage} 
                        size="icon"
                        className="h-8 w-8 bg-blue-600 hover:bg-blue-700 text-white rounded-full flex items-center justify-center"
                      >
                        <Send className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                </>
              )}
              
              {chatMode === 'history' && (
                <div className="flex-1 overflow-y-auto p-3">
                  <div className="text-xs font-medium text-muted-foreground mb-3">TODAY</div>
                  
                  <div 
                    className={`p-2 rounded-md mb-2 cursor-pointer hover:bg-muted/50 transition-colors ${
                      activeSession === 'default' ? 'bg-primary/10 text-primary' : ''
                    }`}
                    onClick={() => setActiveSession('default')}
                  >
                    <div className="font-medium text-sm">Summarize recent market developments</div>
                    <div className="text-xs text-muted-foreground mt-0.5">10:45 AM</div>
                  </div>
                  
                  <div 
                    className={`p-2 rounded-md mb-2 cursor-pointer hover:bg-muted/50 transition-colors ${
                      activeSession === 'code-generation' ? 'bg-primary/10 text-primary' : ''
                    }`}
                    onClick={() => setActiveSession('code-generation')}
                  >
                    <div className="font-medium text-sm">Generate React component for file upload</div>
                    <div className="text-xs text-muted-foreground mt-0.5">9:20 AM</div>
                  </div>
                  
                  <div className="text-xs font-medium text-muted-foreground my-3">YESTERDAY</div>
                  
                  <div 
                    className="p-2 rounded-md mb-2 cursor-pointer hover:bg-muted/50 transition-colors"
                    onClick={() => setActiveSession('other')}
                  >
                    <div className="font-medium text-sm">Optimize database query for performance</div>
                    <div className="text-xs text-muted-foreground mt-0.5">3:45 PM</div>
                  </div>
                </div>
              )}
              
              {chatMode === 'settings' && (
                <div className="flex-1 overflow-y-auto p-4">
                  <h3 className="text-sm font-medium mb-2">Model Settings</h3>
                  <div className="space-y-4">
                    <div className="space-y-1">
                      <label className="text-xs font-medium">Temperature</label>
                      <input type="range" className="w-full h-2 bg-muted rounded-lg appearance-none cursor-pointer" />
                      <div className="flex justify-between text-xs text-muted-foreground">
                        <span>Precise</span>
                        <span>Balanced</span>
                        <span>Creative</span>
                      </div>
                    </div>
                    
                    <div className="space-y-1">
                      <label className="text-xs font-medium">Maximum output tokens</label>
                      <input type="range" className="w-full h-2 bg-muted rounded-lg appearance-none cursor-pointer" />
                      <div className="flex justify-between text-xs text-muted-foreground">
                        <span>256</span>
                        <span>1024</span>
                        <span>4096</span>
                      </div>
                    </div>
                  </div>
                </div>
              )}
            </div>
          </ResizablePanel>
          
          <ResizableHandle withHandle />
          
          <ResizablePanel defaultSize={25} minSize={20}>
            <div className="flex flex-col h-full border-l border-border">
              <div className="p-3 border-b border-border">
                <h3 className="font-medium text-sm">Model Selection</h3>
              </div>
              
              <div className="flex-1 overflow-y-auto p-3">
                <div className="space-y-4">
                  <div>
                    <h4 className="text-xs font-medium text-muted-foreground mb-2">GEMINI MODELS</h4>
                    <div className="space-y-1">
                      <div className="flex items-center px-2 py-1.5 rounded-md bg-primary/10 text-primary">
                        <ChevronRight className="h-3 w-3 mr-1" />
                        <span className="text-xs font-medium">Gemini 2.0 Flash</span>
                      </div>
                      <div className="flex items-center px-2 py-1.5 rounded-md hover:bg-muted/50 cursor-pointer">
                        <span className="h-3 w-3 mr-1" />
                        <span className="text-xs">Gemini 2.5 Pro Experimental</span>
                      </div>
                      <div className="flex items-center px-2 py-1.5 rounded-md hover:bg-muted/50 cursor-pointer">
                        <span className="h-3 w-3 mr-1" />
                        <span className="text-xs">Gemini 1.5 Pro</span>
                      </div>
                    </div>
                  </div>
                  
                  <div>
                    <h4 className="text-xs font-medium text-muted-foreground mb-2">CLAUDE MODELS</h4>
                    <div className="space-y-1">
                      <div className="flex items-center px-2 py-1.5 rounded-md hover:bg-muted/50 cursor-pointer">
                        <span className="h-3 w-3 mr-1" />
                        <span className="text-xs">Claude 3.7 Sonnet</span>
                      </div>
                      <div className="flex items-center px-2 py-1.5 rounded-md hover:bg-muted/50 cursor-pointer">
                        <span className="h-3 w-3 mr-1" />
                        <span className="text-xs">Claude 3.5 Sonnet</span>
                      </div>
                    </div>
                  </div>
                  
                  <div>
                    <h4 className="text-xs font-medium text-muted-foreground mb-2">META MODELS</h4>
                    <div className="space-y-1">
                      <div className="flex items-center px-2 py-1.5 rounded-md hover:bg-muted/50 cursor-pointer">
                        <span className="h-3 w-3 mr-1" />
                        <span className="text-xs">Llama 3.3 (Preview)</span>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </ResizablePanel>
        </ResizablePanelGroup>
      )}
      
      {mode === 'code' && (
        <div className="flex-1 flex flex-col">
          <div className="p-4 flex-1 flex items-center justify-center">
            <div className="text-center max-w-md">
              <div className="bg-primary/10 rounded-full w-12 h-12 flex items-center justify-center mx-auto mb-4">
                <Code className="h-6 w-6 text-primary" />
              </div>
              <h3 className="text-lg font-medium mb-2">Code Assistant</h3>
              <p className="text-sm text-muted-foreground mb-4">
                Get help with writing, explaining, or optimizing code across multiple languages
              </p>
              <div className="space-y-2">
                <Button variant="outline" className="w-full justify-start text-sm">
                  <FileCode className="h-4 w-4 mr-2" />
                  Generate a React component
                </Button>
                <Button variant="outline" className="w-full justify-start text-sm">
                  <FileText className="h-4 w-4 mr-2" />
                  Explain this code
                </Button>
                <Button variant="outline" className="w-full justify-start text-sm">
                  <Sparkles className="h-4 w-4 mr-2" />
                  Optimize my code
                </Button>
              </div>
            </div>
          </div>
        </div>
      )}
      
      {mode === 'image' && (
        <div className="flex-1 flex flex-col">
          <div className="p-4 flex-1 flex items-center justify-center">
            <div className="text-center max-w-md">
              <div className="bg-primary/10 rounded-full w-12 h-12 flex items-center justify-center mx-auto mb-4">
                <Image className="h-6 w-6 text-primary" />
              </div>
              <h3 className="text-lg font-medium mb-2">Image Generation</h3>
              <p className="text-sm text-muted-foreground mb-4">
                Create images from text descriptions or modify existing images
              </p>
              <div className="space-y-4">
                <div className="relative">
                  <Input
                    placeholder="Describe the image you want to create..."
                    className="pr-12"
                  />
                  <Button 
                    className="absolute inset-y-0 right-0 rounded-l-none"
                    size="sm"
                  >
                    Generate
                  </Button>
                </div>
                <div className="text-xs text-muted-foreground text-center">
                  Or upload an image to edit
                </div>
                <Button variant="outline" className="w-full">
                  <ImagePlus className="mr-2 h-4 w-4" />
                  Upload Image
                </Button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

// Simple simulation of AI responses
function simulateAIResponse(message: string): string {
  if (message.toLowerCase().includes('hello') || message.toLowerCase().includes('hi')) {
    return 'Hello there! How can I assist you today?';
  }
  
  if (message.toLowerCase().includes('help')) {
    return 'I can help you with:\n- Writing code\n- Debugging\n- Answering programming questions\n- Explaining concepts\n- Generating images\n\nJust let me know what you need!';
  }
  
  if (message.toLowerCase().includes('code') || message.toLowerCase().includes('function')) {
    return 'Here\'s a simple function that might help:\n\n```javascript\nfunction calculateSum(arr) {\n  return arr.reduce((sum, num) => sum + num, 0);\n}\n\n// Example usage\nconst numbers = [1, 2, 3, 4, 5];\nconst sum = calculateSum(numbers);\nconsole.log(sum); // 15\n```\n\nThis function takes an array of numbers and returns their sum using the reduce method.';
  }
  
  return 'I understand your message. How can I assist you further with your project?';
}

export default AIPanel;