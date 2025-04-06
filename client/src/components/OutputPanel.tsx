import { Terminal } from 'lucide-react';

interface OutputPanelProps {
  output: string[];
}

const OutputPanel = ({ output }: OutputPanelProps) => {
  return (
    <div className="h-40 border-t flex flex-col">
      <div className="px-4 py-2 flex items-center justify-between bg-muted border-b">
        <div className="flex items-center">
          <Terminal className="h-4 w-4 mr-2" />
          <h3 className="text-sm font-medium">Console Output</h3>
        </div>
      </div>
      
      <div className="flex-1 p-2 bg-zinc-900 text-zinc-100 overflow-auto font-mono text-sm">
        {output.length === 0 ? (
          <div className="text-zinc-500 italic">
            Run code to see output here
          </div>
        ) : (
          output.map((line, index) => (
            <div key={index} className="whitespace-pre-wrap mb-1">
              {line}
            </div>
          ))
        )}
      </div>
    </div>
  );
};

export default OutputPanel;