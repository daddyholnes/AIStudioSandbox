import { X, FileCode } from 'lucide-react';
import CodeEditor from './CodeEditor';
import { ProjectFileInfo } from '../pages/CodeStudio';

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
  editorContent,
}: EditorPanelProps) => {
  const getFileName = (fileId: string): string => {
    const findFile = (files: ProjectFileInfo[]): ProjectFileInfo | undefined => {
      for (const file of files) {
        if (file.id === fileId) return file;
        if (file.isFolder && file.children) {
          const found = findFile(file.children);
          if (found) return found;
        }
      }
      return undefined;
    };
    
    const file = findFile(files);
    return file?.name || 'Untitled';
  };

  const getLanguage = (fileId: string): string => {
    const findFile = (files: ProjectFileInfo[]): ProjectFileInfo | undefined => {
      for (const file of files) {
        if (file.id === fileId) return file;
        if (file.isFolder && file.children) {
          const found = findFile(file.children);
          if (found) return found;
        }
      }
      return undefined;
    };
    
    const file = findFile(files);
    return file?.language || 'plaintext';
  };

  return (
    <div className="h-full flex flex-col">
      {openTabs.length > 0 ? (
        <>
          <div className="tabs-container">
            {openTabs.map(tabId => (
              <div
                key={tabId}
                className={`tab ${activeTab === tabId ? 'active' : ''}`}
                onClick={() => onTabSelect(tabId)}
              >
                <FileCode className="h-4 w-4" />
                <span className="ml-1">{getFileName(tabId)}</span>
                <X className="h-4 w-4 ml-2 opacity-50 hover:opacity-100" />
              </div>
            ))}
          </div>
          <div className="flex-1 overflow-hidden">
            {activeTab && (
              <CodeEditor
                content={editorContent}
                language={getLanguage(activeTab)}
                onChange={onEditorChange}
              />
            )}
          </div>
        </>
      ) : (
        <div className="h-full flex items-center justify-center text-muted-foreground">
          <div className="text-center">
            <FileCode className="h-12 w-12 mx-auto mb-4 opacity-50" />
            <p>No files open</p>
            <p className="text-sm mt-1">Select a file from the project panel to start editing</p>
          </div>
        </div>
      )}
    </div>
  );
};

export default EditorPanel;