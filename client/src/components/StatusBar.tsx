import { Code, Check, Wifi, WifiOff } from 'lucide-react';

interface StatusBarProps {
  language: string;
  roomConnected: boolean;
}

const StatusBar = ({ language, roomConnected }: StatusBarProps) => {
  return (
    <div className="px-4 py-1 border-t bg-zinc-800 text-zinc-300 flex justify-between text-sm">
      <div className="flex space-x-4">
        <div className="flex items-center space-x-1">
          <Code className="h-3.5 w-3.5" />
          <span>{language}</span>
        </div>
        
        <div className="flex items-center space-x-1">
          {roomConnected ? (
            <>
              <Wifi className="h-3.5 w-3.5 text-green-400" />
              <span className="text-green-400">Connected</span>
            </>
          ) : (
            <>
              <WifiOff className="h-3.5 w-3.5 text-red-400" />
              <span className="text-red-400">Disconnected</span>
            </>
          )}
        </div>
      </div>
      
      <div className="flex items-center space-x-1">
        <Check className="h-3.5 w-3.5 text-green-400" />
        <span>Ready</span>
      </div>
    </div>
  );
};

export default StatusBar;