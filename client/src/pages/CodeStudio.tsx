import { useState, useEffect } from 'react';
import Header from '@/components/Header';
import Sidebar from '@/components/Sidebar';
import ProjectPanel from '@/components/ProjectPanel';
import EditorPanel from '@/components/EditorPanel';
import OutputPanel from '@/components/OutputPanel';
import AIPanel from '@/components/AIPanel';
import StatusBar from '@/components/StatusBar';
import { useIsMobile } from '@/hooks/use-mobile';
import { ResizablePanel, ResizablePanelGroup } from '@/components/ui/resizable';
import { useToast } from '@/hooks/use-toast';
import { ProjectFileInfo } from '@shared/schema';

const CodeStudio = () => {
  // State for panels
  const [activePanel, setActivePanel] = useState<string>('');
  const [showProjectPanel, setShowProjectPanel] = useState<boolean>(false);
  const [showAIPanel, setShowAIPanel] = useState<boolean>(false);
  
  // State for editor
  const [aiModel, setAiModel] = useState<string>('gemini-pro');
  const [files, setFiles] = useState<ProjectFileInfo[]>([]);
  const [selectedFileId, setSelectedFileId] = useState<string | null>(null);
  const [openTabs, setOpenTabs] = useState<string[]>([]);
  const [activeTab, setActiveTab] = useState<string>('');
  const [editorContent, setEditorContent] = useState<string>('');
  const [consoleOutput, setConsoleOutput] = useState<string[]>([]);
  
  // LiveKit room state
  const [roomConnected, setRoomConnected] = useState<boolean>(false);
  const [roomName, setRoomName] = useState<string>('default-room');
  
  const isMobile = useIsMobile();
  const { toast } = useToast();
  
  // Initialize with some sample files
  useEffect(() => {
    const sampleFiles: ProjectFileInfo[] = [
      {
        id: 'folder-1',
        name: 'src',
        path: '/src',
        language: 'plaintext',
        isFolder: true,
        children: [
          {
            id: 'file-1',
            name: 'index.js',
            path: '/src/index.js',
            language: 'javascript',
            isFolder: false,
            content: '// Sample JavaScript file\n\nfunction helloWorld() {\n  console.log("Hello, World!");\n}\n\nhelloWorld();'
          },
          {
            id: 'file-2',
            name: 'app.js',
            path: '/src/app.js',
            language: 'javascript',
            isFolder: false,
            content: '// App component\n\nconst App = () => {\n  return (\n    <div>\n      <h1>Hello from App</h1>\n    </div>\n  );\n};\n\nexport default App;'
          },
          {
            id: 'file-3',
            name: 'styles.css',
            path: '/src/styles.css',
            language: 'css',
            isFolder: false,
            content: '/* Styles */\n\nbody {\n  font-family: sans-serif;\n  margin: 0;\n  padding: 0;\n  background-color: #f5f5f5;\n}\n\n.container {\n  max-width: 1200px;\n  margin: 0 auto;\n  padding: 20px;\n}'
          }
        ]
      },
      {
        id: 'folder-2',
        name: 'public',
        path: '/public',
        language: 'plaintext',
        isFolder: true,
        children: [
          {
            id: 'file-4',
            name: 'index.html',
            path: '/public/index.html',
            language: 'html',
            isFolder: false,
            content: '<!DOCTYPE html>\n<html lang="en">\n<head>\n  <meta charset="UTF-8">\n  <meta name="viewport" content="width=device-width, initial-scale=1.0">\n  <title>Code Studio</title>\n</head>\n<body>\n  <div id="root"></div>\n  <script src="../src/index.js"></script>\n</body>\n</html>'
          }
        ]
      }
    ];
    
    setFiles(sampleFiles);
  }, []);
  
  // Toggle panels
  const toggleProjectPanel = () => {
    const newState = !showProjectPanel;
    setShowProjectPanel(newState);
    
    if (newState) {
      setActivePanel('files');
      // Close AI panel on mobile
      if (isMobile && showAIPanel) {
        setShowAIPanel(false);
      }
    } else if (activePanel === 'files') {
      setActivePanel('');
    }
  };
  
  const toggleAIPanel = () => {
    const newState = !showAIPanel;
    setShowAIPanel(newState);
    
    if (newState) {
      setActivePanel('ai');
      // Close project panel on mobile
      if (isMobile && showProjectPanel) {
        setShowProjectPanel(false);
      }
    } else if (activePanel === 'ai') {
      setActivePanel('');
    }
  };
  
  // Handle file selection
  const handleFileSelect = (fileId: string) => {
    setSelectedFileId(fileId);
    
    // Find file content
    const findFileById = (files: ProjectFileInfo[], id: string): ProjectFileInfo | null => {
      for (const file of files) {
        if (file.id === id) return file;
        if (file.isFolder && file.children) {
          const foundInChildren = findFileById(file.children, id);
          if (foundInChildren) return foundInChildren;
        }
      }
      return null;
    };
    
    const flattenFiles = (fileTree: ProjectFileInfo[]): ProjectFileInfo[] => {
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
    
    const allFiles = flattenFiles(files);
    const selectedFile = allFiles.find(file => file.id === fileId);
    
    if (selectedFile && !selectedFile.isFolder) {
      // Add to tabs if not already open
      if (!openTabs.includes(fileId)) {
        setOpenTabs([...openTabs, fileId]);
      }
      
      setActiveTab(fileId);
      setEditorContent(selectedFile.content || '');
    }
  };
  
  // Handle editor content change
  const handleEditorChange = (newContent: string) => {
    setEditorContent(newContent);
    
    // Update file content in the files array
    const updateFileContent = (files: ProjectFileInfo[], fileId: string, content: string): ProjectFileInfo[] => {
      return files.map(file => {
        if (file.id === fileId) {
          return { ...file, content };
        }
        if (file.isFolder && file.children) {
          return {
            ...file,
            children: updateFileContent(file.children, fileId, content)
          };
        }
        return file;
      });
    };
    
    if (activeTab) {
      setFiles(updateFileContent(files, activeTab, newContent));
    }
  };
  
  // Execute code from editor
  const executeCode = () => {
    // Simple code execution simulation
    if (!editorContent) {
      toast({
        title: 'No code to execute',
        description: 'Please open a file and write some code first.',
        variant: 'destructive'
      });
      return;
    }
    
    // Clear previous output
    setConsoleOutput([]);
    
    // Simulate console output
    setConsoleOutput([
      '> Executing code...',
      `> File: ${activeTab ? files.find(f => f.id === activeTab)?.name : 'Untitled'}`,
      '> Output:',
      '> "Hello, World!"',
      '> Execution completed successfully.'
    ]);
    
    toast({
      title: 'Code Executed',
      description: 'See the output in the console panel below.'
    });
  };
  
  // Get active file language
  const getActiveLanguage = (): string => {
    if (!activeTab) return 'javascript';
    
    const findFileById = (files: ProjectFileInfo[], id: string): ProjectFileInfo | null => {
      for (const file of files) {
        if (file.id === id) return file;
        if (file.isFolder && file.children) {
          const foundInChildren = findFileById(file.children, id);
          if (foundInChildren) return foundInChildren;
        }
      }
      return null;
    };
    
    const activeFile = findFileById(files, activeTab);
    return activeFile?.language || 'javascript';
  };
  
  return (
    <div className="h-screen flex flex-col">
      <Header aiModel={aiModel} setAiModel={setAiModel} />
      
      <div className="flex-1 flex overflow-hidden">
        <ResizablePanelGroup direction="horizontal">
          {/* Project Panel */}
          {showProjectPanel && (
            <ResizablePanel defaultSize={20} minSize={15} maxSize={30}>
              <ProjectPanel
                files={files}
                onFileSelect={handleFileSelect}
                selectedFileId={selectedFileId}
              />
            </ResizablePanel>
          )}
          
          {/* Main Editor */}
          <ResizablePanel defaultSize={showAIPanel ? 60 : 80} minSize={30}>
            <div className="h-full flex flex-col">
              <div className="p-2 bg-muted flex items-center space-x-2">
                <Sidebar
                  activePanel={activePanel}
                  onToggleProjectPanel={toggleProjectPanel}
                  onToggleAIPanel={toggleAIPanel}
                />
                
                <button
                  className="ml-auto px-3 py-1 text-xs bg-primary text-primary-foreground rounded-md"
                  onClick={executeCode}
                >
                  Run Code
                </button>
              </div>
              
              <div className="flex-1 overflow-hidden flex flex-col">
                <EditorPanel
                  openTabs={openTabs}
                  activeTab={activeTab}
                  onTabSelect={setActiveTab}
                  onEditorChange={handleEditorChange}
                  files={files}
                  editorContent={editorContent}
                />
                
                <OutputPanel output={consoleOutput} />
              </div>
              
              <StatusBar language={getActiveLanguage()} roomConnected={roomConnected} />
            </div>
          </ResizablePanel>
          
          {/* AI Panel */}
          {showAIPanel && (
            <ResizablePanel defaultSize={20} minSize={15} maxSize={40}>
              <AIPanel roomConnected={roomConnected} roomName={roomName} />
            </ResizablePanel>
          )}
        </ResizablePanelGroup>
      </div>
    </div>
  );
};

export default CodeStudio;