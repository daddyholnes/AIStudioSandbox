import { Button } from '@/components/ui/button';
import { Folder, MessageCircle } from 'lucide-react';

interface SidebarProps {
  onToggleProjectPanel: () => void;
  onToggleAIPanel: () => void;
  activePanel: string;
}

const Sidebar = ({ onToggleProjectPanel, onToggleAIPanel, activePanel }: SidebarProps) => {
  return (
    <div className="flex items-center space-x-2">
      <Button
        size="icon"
        variant={activePanel === 'files' ? 'default' : 'outline'}
        onClick={onToggleProjectPanel}
        title="Toggle Project Files"
      >
        <Folder className="h-4 w-4" />
      </Button>
      
      <Button
        size="icon"
        variant={activePanel === 'ai' ? 'default' : 'outline'}
        onClick={onToggleAIPanel}
        title="Toggle AI Assistant"
      >
        <MessageCircle className="h-4 w-4" />
      </Button>
    </div>
  );
};

export default Sidebar;