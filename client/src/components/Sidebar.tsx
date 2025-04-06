import {
  Files,
  Code,
  Terminal,
  Settings,
  Package,
  MessageSquareText,
  Play,
  Mic
} from 'lucide-react';

interface SidebarProps {
  onToggleProjectPanel: () => void;
  onToggleAIPanel: () => void;
  activePanel: string;
}

const Sidebar = ({ onToggleProjectPanel, onToggleAIPanel, activePanel }: SidebarProps) => {
  return (
    <div className="w-12 border-r bg-secondary flex flex-col items-center py-4 space-y-6">
      <button
        className={`sidebar-icon ${activePanel === 'project' ? 'active' : ''}`}
        onClick={onToggleProjectPanel}
        title="Project Files"
      >
        <Files />
      </button>
      
      <button
        className="sidebar-icon"
        title="Code Editor"
      >
        <Code />
      </button>
      
      <button
        className="sidebar-icon"
        title="Terminal"
      >
        <Terminal />
      </button>
      
      <button
        className="sidebar-icon"
        title="Run Project"
      >
        <Play />
      </button>
      
      <button
        className="sidebar-icon"
        title="Extensions"
      >
        <Package />
      </button>
      
      <button
        className={`sidebar-icon ${activePanel === 'ai' ? 'active' : ''}`}
        onClick={onToggleAIPanel}
        title="AI Assistant"
      >
        <MessageSquareText />
      </button>
      
      <button
        className="sidebar-icon"
        title="Voice Assistant"
      >
        <Mic />
      </button>
      
      <div className="flex-1" />
      
      <button
        className="sidebar-icon"
        title="Settings"
      >
        <Settings />
      </button>
    </div>
  );
};

export default Sidebar;