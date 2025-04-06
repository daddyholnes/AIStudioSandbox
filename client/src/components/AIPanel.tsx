import { useState, useEffect, useRef } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { PanelRightClose, Send, User, Code, Wand, Clock } from 'lucide-react';
import { SiGoogle } from 'react-icons/si';
import { Prism as SyntaxHighlighter } from 'react-syntax-highlighter';
import { vscDarkPlus } from 'react-syntax-highlighter/dist/esm/styles/prism';
import { useToast } from '@/hooks/use-toast';

interface Message {
  id: string;
  sender: string;
  senderName: string;
  content: string;
  timestamp: number;
  hasCode: boolean;
}

interface AIResponse {
  id: string;
  role: string;
  content: string;
  timestamp: number;
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
  const [isLoading, setIsLoading] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const { toast } = useToast();
  
  // Add welcome message on initial render
  useEffect(() => {
    if (messages.length === 0) {
      const welcomeMessage: Message = {
        id: 'welcome',
        sender: 'assistant',
        senderName: 'AI Assistant',
        content: "Hello! I'm your AI coding assistant. How can I help you today?",
        timestamp: Date.now(),
        hasCode: false
      };
      setMessages([welcomeMessage]);
    }
  }, []);
  
  // Scroll to bottom when messages change
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);
  
  // Handle message submission
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!inputValue.trim()) return;
    
    // Add user message to chat
    const userMessage: Message = {
      id: `user-${Date.now()}`,
      sender: 'user',
      senderName: 'You',
      content: inputValue,
      timestamp: Date.now(),
      hasCode: false
    };
    
    setMessages(prev => [...prev, userMessage]);
    setInputValue('');
    setIsLoading(true);
    
    try {
      // Simulate AI response (in a real app, you'd call an API)
      setTimeout(() => {
        const aiMessage: Message = {
          id: `ai-${Date.now()}`,
          sender: 'assistant',
          senderName: 'AI Assistant',
          content: generateAIResponse(inputValue),
          timestamp: Date.now(),
          hasCode: inputValue.toLowerCase().includes('code') || inputValue.toLowerCase().includes('function')
        };
        
        setMessages(prev => [...prev, aiMessage]);
        setIsLoading(false);
      }, 1000);
    } catch (error) {
      console.error('Error getting AI response:', error);
      setIsLoading(false);
      
      const errorMessage: Message = {
        id: `error-${Date.now()}`,
        sender: 'system',
        senderName: 'System',
        content: 'There was an error processing your request. Please try again.',
        timestamp: Date.now(),
        hasCode: false
      };
      
      setMessages(prev => [...prev, errorMessage]);
      toast({
        title: 'Error',
        description: 'Failed to get AI response. Please try again.',
        variant: 'destructive'
      });
    }
  };
  
  // Extract code blocks from a message
  const extractCodeBlocks = (content: string): CodeBlock[] => {
    const regex = /\`\`\`([\w-]+)?\n([\s\S]*?)\n\`\`\`/g;
    const codeBlocks: CodeBlock[] = [];
    let match;
    
    while ((match = regex.exec(content)) !== null) {
      codeBlocks.push({
        language: match[1] || 'javascript',
        code: match[2].trim()
      });
    }
    
    return codeBlocks;
  };
  
  // Format message content with code highlighting
  const formatMessageContent = (content: string): JSX.Element => {
    const codeBlocks = extractCodeBlocks(content);
    
    if (codeBlocks.length === 0) {
      return <p className="whitespace-pre-wrap">{content}</p>;
    }
    
    let formattedContent: JSX.Element[] = [];
    let lastIndex = 0;
    
    // Process the content to replace code blocks with syntax-highlighted versions
    const regex = /\`\`\`([\w-]+)?\n([\s\S]*?)\n\`\`\`/g;
    let match;
    let index = 0;
    
    while ((match = regex.exec(content)) !== null) {
      const beforeText = content.substring(lastIndex, match.index);
      if (beforeText) {
        formattedContent.push(
          <p key={`text-${index}`} className="whitespace-pre-wrap mb-4">
            {beforeText}
          </p>
        );
      }
      
      const codeBlock = codeBlocks[index];
      formattedContent.push(
        <div key={`code-${index}`} className="mb-4 rounded-md overflow-hidden">
          <div className="bg-zinc-800 text-zinc-200 text-xs px-3 py-1 flex items-center">
            <Code className="h-3 w-3 mr-2" />
            <span>{codeBlock.language}</span>
          </div>
          <SyntaxHighlighter
            language={codeBlock.language}
            style={vscDarkPlus}
            customStyle={{ margin: 0 }}
          >
            {codeBlock.code}
          </SyntaxHighlighter>
        </div>
      );
      
      lastIndex = match.index + match[0].length;
      index++;
    }
    
    const afterText = content.substring(lastIndex);
    if (afterText) {
      formattedContent.push(
        <p key={`text-${index}`} className="whitespace-pre-wrap">
          {afterText}
        </p>
      );
    }
    
    return <>{formattedContent}</>;
  };
  
  // Generate a simple AI response (for demo purposes)
  const generateAIResponse = (userMessage: string): string => {
    if (userMessage.toLowerCase().includes('hello') || userMessage.toLowerCase().includes('hi')) {
      return "Hello! I'm your AI coding assistant. How can I help you with your project today?";
    }
    
    if (userMessage.toLowerCase().includes('function') || userMessage.toLowerCase().includes('code')) {
      return `Here's a simple JavaScript function that might help:

\`\`\`javascript
function addTwoNumbers(a, b) {
  return a + b;
}

// Example usage
const sum = addTwoNumbers(5, 3);
console.log(sum); // Outputs: 8
\`\`\`

You can use this as a starting point and modify it to suit your specific needs. Let me know if you need anything else!`;
    }
    
    if (userMessage.toLowerCase().includes('help')) {
      return "I can help you with coding tasks, explain concepts, generate code, or debug issues. Just let me know what you're working on!";
    }
    
    return "I understand your message. Could you provide more details about what you're trying to accomplish so I can assist you better?";
  };
  
  return (
    <div className="h-full flex flex-col">
      <div className="flex items-center justify-between p-4 border-b">
        <h2 className="font-medium">AI Assistant</h2>
      </div>
      
      <div className="flex-1 overflow-y-auto p-4 space-y-4">
        {messages.map((message) => (
          <div key={message.id} className={`flex ${message.sender === 'user' ? 'justify-end' : 'justify-start'}`}>
            <div
              className={`max-w-[80%] rounded-lg p-3 ${
                message.sender === 'user'
                  ? 'bg-primary text-primary-foreground'
                  : message.sender === 'assistant'
                  ? 'bg-muted'
                  : 'bg-destructive text-destructive-foreground'
              }`}
            >
              <div className="flex items-center mb-1">
                {message.sender === 'user' ? (
                  <User className="h-4 w-4 mr-2" />
                ) : message.sender === 'assistant' ? (
                  <SiGoogle className="h-4 w-4 mr-2" />
                ) : (
                  <Wand className="h-4 w-4 mr-2" />
                )}
                <span className="font-medium">{message.senderName}</span>
                <span className="ml-2 text-xs opacity-70 flex items-center">
                  <Clock className="h-3 w-3 mr-1" />
                  {new Date(message.timestamp).toLocaleTimeString()}
                </span>
              </div>
              <div className="mt-1">
                {formatMessageContent(message.content)}
              </div>
            </div>
          </div>
        ))}
        
        {isLoading && (
          <div className="flex justify-start">
            <div className="max-w-[80%] rounded-lg p-3 bg-muted">
              <div className="flex items-center">
                <SiGoogle className="h-4 w-4 mr-2" />
                <span className="font-medium">AI Assistant</span>
              </div>
              <div className="mt-2 flex space-x-2">
                <div className="h-2 w-2 rounded-full bg-primary animate-bounce" style={{ animationDelay: '0ms' }}></div>
                <div className="h-2 w-2 rounded-full bg-primary animate-bounce" style={{ animationDelay: '150ms' }}></div>
                <div className="h-2 w-2 rounded-full bg-primary animate-bounce" style={{ animationDelay: '300ms' }}></div>
              </div>
            </div>
          </div>
        )}
        
        <div ref={messagesEndRef} />
      </div>
      
      <div className="p-4 border-t">
        <form onSubmit={handleSubmit} className="flex space-x-2">
          <Input
            value={inputValue}
            onChange={(e) => setInputValue(e.target.value)}
            placeholder="Ask the AI assistant..."
            disabled={isLoading}
            className="flex-1"
          />
          <Button type="submit" size="icon" disabled={isLoading || !inputValue.trim()}>
            <Send className="h-4 w-4" />
          </Button>
        </form>
      </div>
    </div>
  );
};

export default AIPanel;