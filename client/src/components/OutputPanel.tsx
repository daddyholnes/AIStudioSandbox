import { useEffect, useRef, useState } from 'react';
import { Trash, Terminal, ListFilter } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';

interface OutputPanelProps {
  output: string[];
}

const OutputPanel = ({ output }: OutputPanelProps) => {
  const [activeTab, setActiveTab] = useState('console');
  const [terminalReady, setTerminalReady] = useState(false);
  const [terminalSession, setTerminalSession] = useState<any>(null);
  const terminalRef = useRef<HTMLDivElement>(null);
  
  // Initialize terminal when component mounts
  useEffect(() => {
    let isMounted = true;
    
    const initTerminal = async () => {
      try {
        // Dynamically import the xterm library to avoid SSR issues
        const { Terminal } = await import('xterm');
        const { FitAddon } = await import('xterm-addon-fit');
        
        // Create terminal instance if not already created
        if (terminalRef.current && !terminalSession && isMounted) {
          // Clear previous terminal if any
          terminalRef.current.innerHTML = '';
          
          // Initialize the terminal
          const term = new Terminal({
            cursorBlink: true,
            theme: {
              background: '#1E1E1E',
              foreground: '#FFFFFF'
            },
            fontFamily: 'monospace',
            fontSize: 14,
            lineHeight: 1.2
          });
          
          // Add the fit addon
          const fitAddon = new FitAddon();
          term.loadAddon(fitAddon);
          
          // Open the terminal in the container
          term.open(terminalRef.current);
          fitAddon.fit();
          
          // Welcome message
          term.writeln('Welcome to AI Studio Sandbox Terminal');
          term.writeln('This is a simulated terminal for demonstration purposes');
          term.writeln('Type "help" for available commands');
          term.write('\r\n$ ');
          
          // Handle user input
          term.onData((data) => {
            // Echo input
            term.write(data);
            
            // Handle Enter key
            if (data === '\r') {
              term.writeln('');
              term.write('$ ');
            }
          });
          
          // Store the terminal instance
          setTerminalSession({ term, fitAddon });
          setTerminalReady(true);
          
          // Handle resize events
          const handleResize = () => {
            if (fitAddon) {
              setTimeout(() => {
                fitAddon.fit();
              }, 10);
            }
          };
          
          window.addEventListener('resize', handleResize);
          
          // Cleanup
          return () => {
            window.removeEventListener('resize', handleResize);
          };
        }
      } catch (error) {
        console.error('Failed to initialize terminal:', error);
      }
    };
    
    // Only initialize terminal when the terminal tab is active
    if (activeTab === 'terminal') {
      initTerminal();
    }
    
    return () => {
      isMounted = false;
    };
  }, [activeTab, terminalSession]);
  
  // Add resize observer for terminal fit
  useEffect(() => {
    if (!terminalRef.current || !terminalSession || !terminalReady) return;
    
    const resizeObserver = new ResizeObserver(() => {
      if (terminalSession.fitAddon) {
        terminalSession.fitAddon.fit();
      }
    });
    
    resizeObserver.observe(terminalRef.current);
    
    return () => {
      resizeObserver.disconnect();
    };
  }, [terminalSession, terminalReady]);
  
  const clearOutput = () => {
    if (activeTab === 'terminal' && terminalSession) {
      terminalSession.term.clear();
    }
  };
  
  return (
    <div className="h-full flex flex-col">
      <Tabs value={activeTab} onValueChange={setActiveTab} className="h-full flex flex-col">
        <div className="p-2 bg-muted/50 border-b flex items-center justify-between">
          <TabsList className="h-7 grid grid-cols-2 w-48">
            <TabsTrigger value="console" className="text-xs flex items-center gap-1">
              <ListFilter className="h-3.5 w-3.5" />
              Console
            </TabsTrigger>
            <TabsTrigger value="terminal" className="text-xs flex items-center gap-1">
              <Terminal className="h-3.5 w-3.5" />
              Terminal
            </TabsTrigger>
          </TabsList>
          
          <Button variant="ghost" size="icon" className="h-6 w-6" onClick={clearOutput}>
            <Trash className="h-4 w-4" />
          </Button>
        </div>
        
        <TabsContent value="console" className="flex-1 p-0 m-0 h-full">
          <div className="h-full overflow-auto p-2 font-mono text-sm bg-background">
            {output.length > 0 ? (
              output.map((line, index) => (
                <div key={index} className="whitespace-pre-wrap mb-1">
                  {line}
                </div>
              ))
            ) : (
              <div className="text-muted-foreground italic">No output</div>
            )}
          </div>
        </TabsContent>
        
        <TabsContent value="terminal" className="flex-1 p-0 m-0 h-full">
          <div 
            ref={terminalRef} 
            className="h-full overflow-hidden bg-[#1E1E1E]"
          />
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default OutputPanel;