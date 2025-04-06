import {
  Files,
  Code,
  Terminal,
  Settings,
  Package,
  MessageSquareText,
  Play,
  Mic,
  Globe,
  BrainCircuit,
  History,
  Zap,
  Sparkles,
  ListPlus,
  CommandIcon
} from 'lucide-react';
import { useState, useEffect } from 'react';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { cn } from '@/lib/utils';

interface SidebarProps {
  onToggleProjectPanel: () => void;
  onToggleAIPanel: () => void;
  onToggleSettingsPanel?: () => void;
  activePanel: string;
}

const Sidebar = ({ 
  onToggleProjectPanel, 
  onToggleAIPanel, 
  onToggleSettingsPanel,
  activePanel 
}: SidebarProps) => {
  const [expanded, setExpanded] = useState(false);
  const [hovered, setHovered] = useState<string | null>(null);

  // Sidebar navigation items
  const navItems = [
    { id: 'project', icon: Files, label: 'Files', onClick: onToggleProjectPanel, active: activePanel === 'project' },
    { id: 'editor', icon: Code, label: 'Editor', onClick: () => {}, active: false },
    { id: 'terminal', icon: Terminal, label: 'Terminal', onClick: () => {}, active: false },
    { id: 'run', icon: Play, label: 'Run', onClick: () => {}, active: false },
    { id: 'extensions', icon: Package, label: 'Extensions', onClick: () => {}, active: false },
  ];

  // AI features
  const aiItems = [
    { id: 'ai', icon: MessageSquareText, label: 'Chat', onClick: onToggleAIPanel, active: activePanel === 'ai' },
    { id: 'prompt', icon: ListPlus, label: 'Prompts', onClick: () => {}, active: false },
    { id: 'history', icon: History, label: 'History', onClick: () => {}, active: false },
    { id: 'web', icon: Globe, label: 'Web Access', onClick: () => {}, active: false },
    { id: 'thinking', icon: BrainCircuit, label: 'Thinking', onClick: () => {}, active: false },
    { id: 'genkit', icon: Sparkles, label: 'Genkit', onClick: () => {}, active: false },
    { id: 'command', icon: CommandIcon, label: 'Commands', onClick: () => {}, active: false },
  ];

  // System items at the bottom
  const systemItems = [
    { id: 'voice', icon: Mic, label: 'Voice', onClick: () => {}, active: false },
    { id: 'settings', icon: Settings, label: 'Settings', onClick: onToggleSettingsPanel, active: activePanel === 'settings' },
  ];

  // Handle mouse enter/leave for the entire sidebar
  const handleMouseEnter = () => {
    setExpanded(true);
  };

  const handleMouseLeave = () => {
    setExpanded(false);
    setHovered(null);
  };

  // Render a navigation item
  const renderNavItem = (item: any) => (
    <TooltipProvider key={item.id} delayDuration={300}>
      <Tooltip>
        <TooltipTrigger asChild>
          <button
            className={cn(
              "flex items-center h-9 w-full rounded-md px-2 transition-colors",
              expanded ? "justify-start" : "justify-center",
              item.active ? "bg-primary/15 text-primary" : "hover:bg-primary/10"
            )}
            onClick={item.onClick}
            onMouseEnter={() => setHovered(item.id)}
            onMouseLeave={() => setHovered(null)}
          >
            <item.icon className="h-4 w-4 shrink-0" />
            {expanded && <span className="ml-2 text-xs font-medium">{item.label}</span>}
          </button>
        </TooltipTrigger>
        <TooltipContent side="right" className={expanded ? "hidden" : ""}>
          {item.label}
        </TooltipContent>
      </Tooltip>
    </TooltipProvider>
  );

  return (
    <div 
      className={cn(
        "border-r border-border bg-secondary flex flex-col py-3 transition-all duration-200 h-full",
        expanded ? "w-36" : "w-12"
      )}
      onMouseEnter={handleMouseEnter}
      onMouseLeave={handleMouseLeave}
    >
      <div className="flex flex-col gap-1 px-2">
        {navItems.map(renderNavItem)}
      </div>
      
      <div className="mt-6 mb-2 px-2">
        {expanded && <div className="text-xs text-muted-foreground font-medium px-2 py-1">AI TOOLS</div>}
        {!expanded && <div className="border-t border-border mx-2 my-2"></div>}
      </div>
      
      <div className="flex flex-col gap-1 px-2">
        {aiItems.map(renderNavItem)}
      </div>
      
      <div className="flex-1"></div>
      
      <div className="flex flex-col gap-1 px-2 mt-4">
        {systemItems.map(renderNavItem)}
      </div>
    </div>
  );
};

export default Sidebar;