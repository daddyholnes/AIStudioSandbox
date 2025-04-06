import { useState } from 'react';
import { Trash, Terminal as TerminalIcon, ListFilter } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import Terminal from './Terminal';

interface OutputPanelProps {
  output: string[];
}

const OutputPanel = ({ output }: OutputPanelProps) => {
  const [activeTab, setActiveTab] = useState('console');
  
  const handleTerminalData = (data: string) => {
    console.log('Terminal input:', data);
    // In a real implementation, this would send the terminal input to the server
  };
  
  const clearOutput = () => {
    // Terminal clearing is handled within the Terminal component
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
              <TerminalIcon className="h-3.5 w-3.5" />
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
          <Terminal 
            onData={handleTerminalData}
            height="100%"
          />
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default OutputPanel;