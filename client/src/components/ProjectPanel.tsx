import { useState } from 'react';
import { ProjectFileInfo } from '@shared/schema';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';

interface ProjectPanelProps {
  files: ProjectFileInfo[];
  onFileSelect: (fileId: string) => void;
  selectedFileId: string | null;
}

const ProjectPanel = ({ files, onFileSelect, selectedFileId }: ProjectPanelProps) => {
  const [expandedFolders, setExpandedFolders] = useState<Record<string, boolean>>({
    'folder-1': true,  // Project Files folder expanded by default
  });

  const toggleFolder = (folderId: string) => {
    setExpandedFolders(prev => ({
      ...prev,
      [folderId]: !prev[folderId]
    }));
  };

  const renderFileTree = (files: ProjectFileInfo[], level = 0) => {
    return files.map(file => (
      <div key={file.id} style={{ marginLeft: `${level * 8}px` }}>
        {file.isFolder ? (
          <div className="mb-2">
            <div 
              className="flex items-center space-x-1 cursor-pointer py-1" 
              onClick={() => toggleFolder(file.id)}
            >
              <i className={`ri-arrow-${expandedFolders[file.id] ? 'down' : 'right'}-s-line text-sm`}></i>
              <i className="ri-folder-line text-[#F4B400]"></i>
              <span className="text-sm font-roboto">{file.name}</span>
            </div>
            
            {expandedFolders[file.id] && file.children && file.children.length > 0 && (
              <div className="pl-4">
                {renderFileTree(file.children, level + 1)}
              </div>
            )}
          </div>
        ) : (
          <div 
            className={cn(
              "flex items-center space-x-2 text-sm py-1 px-2 rounded cursor-pointer",
              selectedFileId === file.id ? "bg-[#264F78]" : "hover:bg-[#2D2D2D]"
            )}
            onClick={() => onFileSelect(file.id)}
          >
            <FileIcon language={file.language} />
            <span>{file.name}</span>
          </div>
        )}
      </div>
    ));
  };

  return (
    <div className="w-64 bg-card border-r border-gray-700 flex flex-col">
      <div className="px-4 py-3 border-b border-gray-700 flex items-center justify-between">
        <h2 className="font-google-sans font-medium">EXPLORER</h2>
        <Button variant="ghost" size="icon" className="h-6 w-6">
          <i className="ri-more-2-fill"></i>
        </Button>
      </div>
      
      <div className="overflow-y-auto flex-1">
        <div className="py-2 px-4">
          {renderFileTree(files)}
        </div>
      </div>
    </div>
  );
};

// Helper component for file icons
const FileIcon = ({ language }: { language: string }) => {
  const getIconClass = (lang: string) => {
    switch (lang) {
      case 'javascript':
        return 'ri-javascript-line text-[#F4B400]';
      case 'html':
        return 'ri-html5-line text-[#DB4437]';
      case 'css':
        return 'ri-css3-line text-[#4285F4]';
      case 'typescript':
        return 'ri-file-code-line text-[#4285F4]';
      case 'json':
        return 'ri-file-list-line text-[#F4B400]';
      default:
        return 'ri-file-line text-gray-400';
    }
  };

  return <i className={getIconClass(language)}></i>;
};

export default ProjectPanel;
