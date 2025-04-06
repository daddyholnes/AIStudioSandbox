import { FolderIcon, FileIcon, ChevronDown, ChevronRight } from 'lucide-react';
import { useState } from 'react';
import { ProjectFileInfo } from '../pages/CodeStudio';

interface ProjectPanelProps {
  files: ProjectFileInfo[];
  onFileSelect: (fileId: string) => void;
  selectedFileId: string | null;
}

const ProjectPanel = ({ files, onFileSelect, selectedFileId }: ProjectPanelProps) => {
  const [expandedFolders, setExpandedFolders] = useState<Record<string, boolean>>({});

  const toggleFolder = (folderId: string) => {
    setExpandedFolders({
      ...expandedFolders,
      [folderId]: !expandedFolders[folderId],
    });
  };

  const renderItem = (item: ProjectFileInfo, depth: number = 0) => {
    const isSelected = item.id === selectedFileId;
    const isExpanded = expandedFolders[item.id] || false;
    
    return (
      <div key={item.id} className="select-none">
        <div
          className={`flex items-center py-1 px-2 cursor-pointer hover:bg-muted transition-colors ${
            isSelected ? 'bg-primary/10 text-primary' : ''
          }`}
          style={{ paddingLeft: `${depth * 12 + 8}px` }}
          onClick={() => item.isFolder ? toggleFolder(item.id) : onFileSelect(item.id)}
        >
          {item.isFolder ? (
            <>
              <span className="mr-1">
                {isExpanded ? <ChevronDown className="h-4 w-4" /> : <ChevronRight className="h-4 w-4" />}
              </span>
              <FolderIcon className="h-4 w-4 mr-2" />
            </>
          ) : (
            <FileIcon className="h-4 w-4 mr-2" />
          )}
          <span className="truncate">{item.name}</span>
        </div>
        
        {item.isFolder && isExpanded && item.children?.map(child => renderItem(child, depth + 1))}
      </div>
    );
  };

  return (
    <div className="h-full overflow-y-auto bg-background border-r p-1">
      <div className="font-semibold px-2 py-1 mb-2 text-sm">Project Files</div>
      {files.length === 0 ? (
        <div className="p-4 text-sm text-muted-foreground">No files found</div>
      ) : (
        files.map(item => renderItem(item))
      )}
    </div>
  );
};

export default ProjectPanel;