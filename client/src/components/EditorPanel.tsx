import { useState, useEffect, useRef } from 'react';
import CodeEditor from './CodeEditor';
import { X } from 'lucide-react';
import { ProjectFileInfo } from '@shared/schema';

interface EditorPanelProps {
  openTabs: string[];
  activeTab: string;
  onTabSelect: (fileId: string) => void;
  onEditorChange: (content: string) => void;
  files: ProjectFileInfo[];
  editorContent: string;
}

const EditorPanel = ({
  openTabs,
  activeTab,
  onTabSelect,
  onEditorChange,
  files,
  editorContent
}: EditorPanelProps) => {
  const [language, setLanguage] = useState('javascript');
  const tabsRef = useRef<HTMLDivElement>(null);
  
  // Update language when active tab changes
  useEffect(() => {
    if (activeTab) {
      // Find the file for the active tab
      const flatFiles = getFlattenedFiles(files);
      const activeFile = flatFiles.find(file => file.id === activeTab);
      
      if (activeFile) {
        setLanguage(activeFile.language);
      }
    }
  }, [activeTab, files]);
  
  // Scroll tabs into view when they change
  useEffect(() => {
    if (tabsRef.current) {
      tabsRef.current.scrollTo({
        left: tabsRef.current.scrollWidth,
        behavior: 'smooth'
      });
    }
  }, [openTabs]);
  
  // Flatten nested file structure to find files by ID
  const getFlattenedFiles = (fileTree: ProjectFileInfo[]): ProjectFileInfo[] => {
    const result: ProjectFileInfo[] = [];
    
    const flatten = (items: ProjectFileInfo[]) => {
      for (const item of items) {
        result.push(item);
        if (item.isFolder && item.children) {
          flatten(item.children);
        }
      }
    };
    
    flatten(fileTree);
    return result;
  };
  
  // Get file name from ID
  const getFileName = (fileId: string): string => {
    const flatFiles = getFlattenedFiles(files);
    const file = flatFiles.find(f => f.id === fileId);
    return file ? file.name : 'Untitled';
  };
  
  // Close a tab
  const handleCloseTab = (fileId: string, event: React.MouseEvent) => {
    event.stopPropagation();
    
    // Remove the tab
    const newTabs = openTabs.filter(id => id !== fileId);
    
    // If we closed the active tab, activate another tab if available
    if (activeTab === fileId && newTabs.length > 0) {
      onTabSelect(newTabs[newTabs.length - 1]);
    }
  };
  
  return (
    <div className="flex-1 flex flex-col overflow-hidden">
      <div 
        className="flex overflow-x-auto border-b whitespace-nowrap hide-scrollbar"
        ref={tabsRef}
      >
        {openTabs.map(fileId => (
          <div
            key={fileId}
            className={`flex items-center px-3 py-2 border-r hover:bg-accent/50 cursor-pointer ${
              activeTab === fileId ? 'bg-accent text-accent-foreground' : 'text-muted-foreground'
            }`}
            onClick={() => onTabSelect(fileId)}
          >
            <span className="truncate max-w-[100px]">{getFileName(fileId)}</span>
            <button
              className="ml-2 rounded-full hover:bg-accent p-1"
              onClick={(e) => handleCloseTab(fileId, e)}
            >
              <X className="h-3 w-3" />
            </button>
          </div>
        ))}
      </div>
      
      <div className="flex-1 overflow-hidden">
        {activeTab ? (
          <CodeEditor
            content={editorContent}
            language={language}
            onChange={onEditorChange}
          />
        ) : (
          <div className="flex items-center justify-center h-full text-muted-foreground">
            Open a file to start editing
          </div>
        )}
      </div>
    </div>
  );
};

export default EditorPanel;