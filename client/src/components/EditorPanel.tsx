import { useState } from 'react';
import CodeEditor from './CodeEditor';
import OutputPanel from './OutputPanel';
import { Button } from '@/components/ui/button';
import { ProjectFileInfo } from '@shared/schema';
import { cn } from '@/lib/utils';

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
  const [terminalOutput, setTerminalOutput] = useState<string[]>([
    '$ npm run dev',
    'Starting development server...',
    'Compiling...',
    '✓ Compiled successfully!',
    'Local:            http://localhost:3000',
    'On Your Network:  http://192.168.1.5:3000',
    'Ready for LiveKit connection'
  ]);
  
  // Function to find file by id
  const findFile = (fileId: string, fileList: ProjectFileInfo[]): ProjectFileInfo | null => {
    for (const file of fileList) {
      if (file.id === fileId) {
        return file;
      }
      if (file.isFolder && file.children) {
        const found = findFile(fileId, file.children);
        if (found) return found;
      }
    }
    return null;
  };

  // Get all open file names
  const tabFiles = openTabs.map(tabId => findFile(tabId, files)).filter(Boolean) as ProjectFileInfo[];

  return (
    <div className="flex-1 flex flex-col overflow-hidden">
      <div className="bg-card border-b border-gray-700 px-4 py-2 flex items-center">
        <div className="flex space-x-1">
          {tabFiles.map(file => (
            <Button
              key={file.id}
              variant="ghost"
              className={cn(
                "px-3 py-1 rounded text-sm font-roboto",
                activeTab === file.id ? "bg-[#264F78]" : "opacity-80 hover:bg-[#2D2D2D]"
              )}
              onClick={() => onTabSelect(file.id)}
            >
              {file.name}
            </Button>
          ))}
        </div>
      </div>
      
      <div className="flex-1 overflow-hidden relative">
        <CodeEditor 
          content={editorContent}
          language={findFile(activeTab, files)?.language || 'plaintext'}
          onChange={onEditorChange}
        />
      </div>
      
      <OutputPanel output={terminalOutput} />
    </div>
  );
};

export default EditorPanel;
