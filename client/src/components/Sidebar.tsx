import { Button } from '@/components/ui/button';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';

interface SidebarProps {
  onToggleProjectPanel: () => void;
  onToggleAIPanel: () => void;
  activePanel: string;
}

const Sidebar = ({ onToggleProjectPanel, onToggleAIPanel, activePanel }: SidebarProps) => {
  return (
    <div className="w-16 bg-card border-r border-gray-700 flex flex-col items-center py-4 space-y-6">
      <TooltipProvider>
        <Tooltip>
          <TooltipTrigger asChild>
            <Button 
              variant="ghost" 
              size="icon" 
              className={`sidebar-icon ${activePanel === 'files' ? 'text-primary' : ''}`}
              onClick={onToggleProjectPanel}
            >
              <i className="ri-file-list-line text-2xl"></i>
            </Button>
          </TooltipTrigger>
          <TooltipContent side="right">
            <p>Explorer</p>
          </TooltipContent>
        </Tooltip>
        
        <Tooltip>
          <TooltipTrigger asChild>
            <Button variant="ghost" size="icon" className="sidebar-icon">
              <i className="ri-search-line text-2xl"></i>
            </Button>
          </TooltipTrigger>
          <TooltipContent side="right">
            <p>Search</p>
          </TooltipContent>
        </Tooltip>
        
        <Tooltip>
          <TooltipTrigger asChild>
            <Button variant="ghost" size="icon" className="sidebar-icon">
              <i className="ri-code-box-line text-2xl"></i>
            </Button>
          </TooltipTrigger>
          <TooltipContent side="right">
            <p>Source Control</p>
          </TooltipContent>
        </Tooltip>
        
        <Tooltip>
          <TooltipTrigger asChild>
            <Button variant="ghost" size="icon" className="sidebar-icon">
              <i className="ri-terminal-box-line text-2xl"></i>
            </Button>
          </TooltipTrigger>
          <TooltipContent side="right">
            <p>Terminal</p>
          </TooltipContent>
        </Tooltip>
        
        <Tooltip>
          <TooltipTrigger asChild>
            <Button 
              variant="ghost" 
              size="icon" 
              className={`sidebar-icon ${activePanel === 'chat' ? 'text-primary' : ''}`}
              onClick={onToggleAIPanel}
            >
              <i className="ri-wechat-line text-2xl"></i>
            </Button>
          </TooltipTrigger>
          <TooltipContent side="right">
            <p>AI Assistant</p>
          </TooltipContent>
        </Tooltip>
      </TooltipProvider>
      
      <div className="flex-1"></div>
      
      <TooltipProvider>
        <Tooltip>
          <TooltipTrigger asChild>
            <Button variant="ghost" size="icon" className="sidebar-icon">
              <i className="ri-question-line text-2xl"></i>
            </Button>
          </TooltipTrigger>
          <TooltipContent side="right">
            <p>Help</p>
          </TooltipContent>
        </Tooltip>
      </TooltipProvider>
    </div>
  );
};

export default Sidebar;
