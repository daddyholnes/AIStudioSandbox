import { cn } from '@/lib/utils';

interface StatusBarProps {
  language: string;
  roomConnected: boolean;
}

const StatusBar = ({ language, roomConnected }: StatusBarProps) => {
  return (
    <footer className="bg-[#007ACC] text-white py-0.5 px-4 text-xs font-roboto flex items-center justify-between">
      <div className="flex items-center space-x-4">
        <div className="flex items-center space-x-1">
          <i className="ri-git-branch-line"></i>
          <span>main</span>
        </div>
        <div>{formatLanguage(language)}</div>
        <div>UTF-8</div>
      </div>
      <div className="flex items-center space-x-4">
        <div>Ln 12, Col 24</div>
        <div>Spaces: 2</div>
        <div className="flex items-center">
          <i className={cn("ri-wifi-line mr-1", !roomConnected && "text-red-300")}></i>
          <span>{roomConnected ? 'Connected' : 'Disconnected'}</span>
        </div>
      </div>
    </footer>
  );
};

// Format language for display
const formatLanguage = (language: string): string => {
  const languageMap: Record<string, string> = {
    'javascript': 'JavaScript',
    'typescript': 'TypeScript',
    'html': 'HTML',
    'css': 'CSS',
    'json': 'JSON',
    'markdown': 'Markdown',
    'plaintext': 'Plain Text'
  };
  
  return languageMap[language] || language.charAt(0).toUpperCase() + language.slice(1);
};

export default StatusBar;
