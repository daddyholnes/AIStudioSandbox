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
  onPromptPanel?: () => void;
  onHistoryPanel?: () => void;
  onWebAccessToggle?: () => void;
  onThinkingToggle?: () => void;
  onGenkitToggle?: () => void;
  onCommandsToggle?: () => void;
  activePanel: string;
}

const Sidebar = ({ 
  onToggleProjectPanel, 
  onToggleAIPanel, 
  onToggleSettingsPanel,
  onPromptPanel,
  onHistoryPanel,
  onWebAccessToggle,
  onThinkingToggle,
  onGenkitToggle,
  onCommandsToggle,
  activePanel 
}: SidebarProps) => {
  const [expanded, setExpanded] = useState(false);
  const [hovered, setHovered] = useState<string | null>(null);

  // Sidebar navigation items
  const navItems = [
    { id: 'project', icon: Files, label: 'Files', onClick: onToggleProjectPanel, active: activePanel === 'project' },
    { id: 'editor', icon: Code, label: 'Editor', onClick: () => console.log('Editor selected'), active: activePanel === 'editor' },
    { id: 'terminal', icon: Terminal, label: 'Terminal', onClick: () => console.log('Terminal selected'), active: activePanel === 'terminal' },
    { id: 'run', icon: Play, label: 'Run', onClick: () => console.log('Run selected'), active: activePanel === 'run' },
    { id: 'extensions', icon: Package, label: 'Extensions', onClick: () => console.log('Extensions selected'), active: activePanel === 'extensions' },
  ];

  // AI features
  const aiItems = [
    { id: 'ai', icon: MessageSquareText, label: 'Chat', onClick: onToggleAIPanel, active: activePanel === 'ai' },
    { id: 'prompt', icon: ListPlus, label: 'Prompts', onClick: onPromptPanel || (() => console.log('Prompts selected')), active: activePanel === 'prompt' },
    { id: 'history', icon: History, label: 'History', onClick: onHistoryPanel || (() => console.log('History selected')), active: activePanel === 'history' },
    { id: 'web', icon: Globe, label: 'Web Access', onClick: onWebAccessToggle || (() => console.log('Web Access selected')), active: activePanel === 'web' },
    { id: 'thinking', icon: BrainCircuit, label: 'Thinking', onClick: onThinkingToggle || (() => console.log('Thinking selected')), active: activePanel === 'thinking' },
    { id: 'genkit', icon: Sparkles, label: 'Genkit', onClick: onGenkitToggle || (() => console.log('Genkit selected')), active: activePanel === 'genkit' },
    { id: 'command', icon: CommandIcon, label: 'Commands', onClick: onCommandsToggle || (() => console.log('Commands selected')), active: activePanel === 'command' },
  ];

  // System items at the bottom
  const systemItems = [
    { id: 'voice', icon: Mic, label: 'Voice', onClick: () => console.log('Voice selected'), active: activePanel === 'voice' },
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