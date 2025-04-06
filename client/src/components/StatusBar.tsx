import { Wifi, WifiOff, GitBranch } from 'lucide-react';

interface StatusBarProps {
  language: string;
  roomConnected: boolean;
}

const StatusBar = ({ language, roomConnected }: StatusBarProps) => {
  return (
    <div className="py-1 px-3 bg-muted/30 border-t flex items-center justify-between text-xs text-muted-foreground">
      <div className="flex items-center space-x-3">
        <div className="flex items-center">
          <GitBranch className="h-3.5 w-3.5 mr-1" />
          <span>main</span>
        </div>
        <div>
          Language: {language}
        </div>
      </div>
      
      <div className="flex items-center space-x-2">
        <div className="flex items-center">
          {roomConnected ? (
            <>
              <Wifi className="h-3.5 w-3.5 mr-1 text-green-500" />
              <span className="text-green-500">Connected</span>
            </>
          ) : (
            <>
              <WifiOff className="h-3.5 w-3.5 mr-1 text-red-500" />
              <span className="text-red-500">Disconnected</span>
            </>
          )}
        </div>
      </div>
    </div>
  );
};

export default StatusBar;