import { useState } from 'react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { ScrollArea } from '@/components/ui/scroll-area';
import { cn } from '@/lib/utils';

interface OutputPanelProps {
  output: string[];
}

const OutputPanel = ({ output }: OutputPanelProps) => {
  const [activeTab, setActiveTab] = useState('terminal');
  
  return (
    <div className="h-48 bg-background border-t border-gray-700 overflow-hidden flex flex-col">
      <Tabs value={activeTab} onValueChange={setActiveTab} className="h-full">
        <div className="bg-card px-4 py-1.5 border-b border-gray-700">
          <TabsList className="bg-transparent p-0 h-auto gap-3">
            <TabsTrigger 
              value="terminal"
              className={cn(
                "text-sm font-roboto px-0 py-1 rounded-none border-b-2 border-transparent data-[state=active]:border-primary",
                "bg-transparent data-[state=active]:bg-transparent data-[state=active]:shadow-none",
                activeTab === 'terminal' ? 'text-white' : 'text-gray-400'
              )}
            >
              TERMINAL
            </TabsTrigger>
            <TabsTrigger 
              value="problems"
              className={cn(
                "text-sm font-roboto px-0 py-1 rounded-none border-b-2 border-transparent data-[state=active]:border-primary",
                "bg-transparent data-[state=active]:bg-transparent data-[state=active]:shadow-none",
                activeTab === 'problems' ? 'text-white' : 'text-gray-400'
              )}
            >
              PROBLEMS
            </TabsTrigger>
            <TabsTrigger 
              value="output"
              className={cn(
                "text-sm font-roboto px-0 py-1 rounded-none border-b-2 border-transparent data-[state=active]:border-primary",
                "bg-transparent data-[state=active]:bg-transparent data-[state=active]:shadow-none",
                activeTab === 'output' ? 'text-white' : 'text-gray-400'
              )}
            >
              OUTPUT
            </TabsTrigger>
            <TabsTrigger 
              value="debug"
              className={cn(
                "text-sm font-roboto px-0 py-1 rounded-none border-b-2 border-transparent data-[state=active]:border-primary",
                "bg-transparent data-[state=active]:bg-transparent data-[state=active]:shadow-none",
                activeTab === 'debug' ? 'text-white' : 'text-gray-400'
              )}
            >
              DEBUG CONSOLE
            </TabsTrigger>
          </TabsList>
        </div>
        
        <TabsContent value="terminal" className="h-full p-0 m-0">
          <ScrollArea className="h-full p-3">
            <div className="terminal-text">
              {output.map((line, index) => (
                <div key={index} className={line.includes('✓') ? 'text-green-500' : line.includes('LiveKit') ? 'text-blue-400' : ''}>
                  {line}
                </div>
              ))}
              <div className="flex items-center">
                <span className="animate-pulse">▌</span>
              </div>
            </div>
          </ScrollArea>
        </TabsContent>
        
        <TabsContent value="problems" className="h-full p-0 m-0">
          <ScrollArea className="h-full p-3">
            <div className="terminal-text">
              <div>No problems detected in workspace</div>
            </div>
          </ScrollArea>
        </TabsContent>
        
        <TabsContent value="output" className="h-full p-0 m-0">
          <ScrollArea className="h-full p-3">
            <div className="terminal-text">
              <div>No output to display</div>
            </div>
          </ScrollArea>
        </TabsContent>
        
        <TabsContent value="debug" className="h-full p-0 m-0">
          <ScrollArea className="h-full p-3">
            <div className="terminal-text">
              <div>Debug console inactive</div>
            </div>
          </ScrollArea>
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default OutputPanel;
