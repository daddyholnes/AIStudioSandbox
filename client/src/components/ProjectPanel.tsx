import { useState } from 'react';
import { ChevronDown, ChevronRight, File, Folder, Plus } from 'lucide-react';
import { ProjectFileInfo } from '@shared/schema';
import { Button } from '@/components/ui/button';

interface ProjectPanelProps {
  files: ProjectFileInfo[];
  onFileSelect: (fileId: string) => void;
  selectedFileId: string | null;
}

const ProjectPanel = ({ files, onFileSelect, selectedFileId }: ProjectPanelProps) => {
  const [expandedFolders, setExpandedFolders] = useState<Record<string, boolean>>({
    'folder-1': true // Start with the first folder expanded
  });
  
  // Toggle folder expansion
  const toggleFolder = (folderId: string, e: React.MouseEvent) => {
    e.stopPropagation();
    setExpandedFolders(prev => ({
      ...prev,
      [folderId]: !prev[folderId]
    }));
  };
  
  // Render a file or folder item
  const renderItem = (item: ProjectFileInfo, depth: number = 0) => {
    const isExpanded = expandedFolders[item.id] || false;
    const isSelected = selectedFileId === item.id;
    
    return (
      <div key={item.id}>
        <div
          className={`flex items-center px-2 py-1 cursor-pointer hover:bg-accent group ${
            isSelected ? 'bg-accent/50' : ''
          }`}
          style={{ paddingLeft: `${(depth + 1) * 8}px` }}
          onClick={() => !item.isFolder && onFileSelect(item.id)}
        >
          {item.isFolder ? (
            <div 
              className="flex items-center w-full"
              onClick={(e) => toggleFolder(item.id, e)}
            >
              <div className="mr-1">
                {isExpanded ? (
                  <ChevronDown className="h-4 w-4 text-muted-foreground" />
                ) : (
                  <ChevronRight className="h-4 w-4 text-muted-foreground" />
                )}
              </div>
              <Folder className="h-4 w-4 mr-2 text-blue-400" />
              <span>{item.name}</span>
            </div>
          ) : (
            <>
              <File className="h-4 w-4 mr-2 text-muted-foreground" />
              <span>{item.name}</span>
            </>
          )}
        </div>
        
        {/* Render children if folder is expanded */}
        {item.isFolder && isExpanded && item.children && (
          <div>
            {item.children.map(child => renderItem(child, depth + 1))}
          </div>
        )}
      </div>
    );
  };
  
  return (
    <div className="h-full flex flex-col">
      <div className="flex items-center justify-between p-4 border-b">
        <h2 className="font-medium">Project Files</h2>
        <Button variant="ghost" size="icon" title="New File">
          <Plus className="h-4 w-4" />
        </Button>
      </div>
      
      <div className="flex-1 overflow-auto">
        {files.map(item => renderItem(item))}
      </div>
    </div>
  );
};

export default ProjectPanel;