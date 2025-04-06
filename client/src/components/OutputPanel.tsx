import { Trash } from 'lucide-react';
import { Button } from '@/components/ui/button';

interface OutputPanelProps {
  output: string[];
}

const OutputPanel = ({ output }: OutputPanelProps) => {
  return (
    <div className="h-full flex flex-col">
      <div className="p-2 bg-muted/50 border-b flex items-center justify-between">
        <h3 className="text-sm font-medium">Console Output</h3>
        <Button variant="ghost" size="icon" className="h-6 w-6">
          <Trash className="h-4 w-4" />
        </Button>
      </div>
      <div className="flex-1 overflow-auto p-2 font-mono text-sm bg-background">
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
    </div>
  );
};

export default OutputPanel;