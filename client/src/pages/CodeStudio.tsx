import { useState, useEffect } from 'react';
import Header from '../components/Header';
import Sidebar from '../components/Sidebar';
import ProjectPanel from '../components/ProjectPanel';
import EditorPanel from '../components/EditorPanel';
import AIPanel from '../components/AIPanel';
import StatusBar from '../components/StatusBar';
import OutputPanel from '../components/OutputPanel';
import { ResizablePanelGroup, ResizablePanel, ResizableHandle } from '@/components/ui/resizable';

// Define ProjectFileInfo type for the client-side components
export interface ProjectFileInfo {
  id: string;
  name: string;
  path: string;
  language: string;
  isFolder: boolean;
  content?: string;
  children?: ProjectFileInfo[];
}

interface CodeStudioProps {
  aiModel: string;
  setAiModel: (model: string) => void;
  isDarkMode: boolean;
  setIsDarkMode: (isDarkMode: boolean) => void;
}

const CodeStudio = ({ aiModel, setAiModel, isDarkMode, setIsDarkMode }: CodeStudioProps) => {
  const [activePanel, setActivePanel] = useState('project');
  const [selectedFileId, setSelectedFileId] = useState<string | null>(null);
  const [openTabs, setOpenTabs] = useState<string[]>([]);
  const [activeTab, setActiveTab] = useState<string>('');
  const [editorContent, setEditorContent] = useState<string>('');
  const [output, setOutput] = useState<string[]>([]);
  const [files, setFiles] = useState<ProjectFileInfo[]>([]);
  const [roomConnected, setRoomConnected] = useState(false);
  const [roomName, setRoomName] = useState('default-room');

  useEffect(() => {
    // Fetch project files on component mount
    fetchFiles();
    // Create or join LiveKit room
    createOrJoinRoom();
  }, []);

  const fetchFiles = async () => {
    try {
      const response = await fetch('/api/files');
      const data = await response.json();
      setFiles(data);
    } catch (error) {
      console.error('Error fetching files:', error);
    }
  };

  const createOrJoinRoom = async () => {
    try {
      // Create room
      const createResponse = await fetch('/api/livekit/room', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ roomName }),
      });
      
      const createData = await createResponse.json();
      
      if (createData.success) {
        // Get token
        const tokenResponse = await fetch('/api/livekit/token', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({ 
            roomName, 
            participantName: 'User-' + Math.floor(Math.random() * 10000) 
          }),
        });
        
        const tokenData = await tokenResponse.json();
        
        if (tokenData.token) {
          // In a real app, we would connect to the room using LiveKit client
          console.log('Got token:', tokenData.token);
          setRoomConnected(true);
        }
      }
    } catch (error) {
      console.error('Error creating/joining room:', error);
    }
  };

  const handleFileSelect = (fileId: string) => {
    setSelectedFileId(fileId);
    
    // Find the file
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
    
    if (file && !file.isFolder) {
      // Add to open tabs if not already open
      if (!openTabs.includes(fileId)) {
        setOpenTabs([...openTabs, fileId]);
      }
      
      setActiveTab(fileId);
      
      // Set editor content
      setEditorContent(file.content || '');
    }
  };

  const handleEditorChange = (content: string) => {
    setEditorContent(content);
    
    // In a real app, we would save the file content
    console.log('File content changed, would save:', content);
  };

  const handleToggleProjectPanel = () => {
    setActivePanel(activePanel === 'project' ? '' : 'project');
  };

  const handleToggleAIPanel = () => {
    setActivePanel(activePanel === 'ai' ? '' : 'ai');
  };

  const executeCode = async () => {
    // Add a loading message
    setOutput([...output, '> Executing code...']);
    
    try {
      // Find the currently active file to determine language
      const findFile = (files: ProjectFileInfo[]): ProjectFileInfo | undefined => {
        for (const file of files) {
          if (file.id === activeTab) return file;
          if (file.isFolder && file.children) {
            const found = findFile(file.children);
            if (found) return found;
          }
        }
        return undefined;
      };
      
      const file = findFile(files);
      const language = file?.language || 'javascript';
      
      const response = await fetch('/api/execute', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ 
          code: editorContent,
          language
        }),
      });
      
      const data = await response.json();
      
      // Display the result
      if (data.result) {
        setOutput([...output, data.result]);
      }
      
      if (data.error) {
        setOutput([...output, `Error: ${data.error}`]);
      }
    } catch (error: any) {
      console.error('Error executing code:', error);
      setOutput([...output, `Error: ${error.message || 'Unknown error'}`]);
    }
  };

  return (
    <div className="flex flex-col h-screen bg-background">
      <Header 
        aiModel={aiModel} 
        setAiModel={setAiModel}
        isDarkMode={isDarkMode}
        setIsDarkMode={setIsDarkMode}
      />
      
      <div className="flex flex-1 overflow-hidden">
        <Sidebar 
          onToggleProjectPanel={handleToggleProjectPanel}
          onToggleAIPanel={handleToggleAIPanel}
          activePanel={activePanel}
        />
        
        <ResizablePanelGroup direction="horizontal" className="flex-1">
          {activePanel === 'project' && (
            <>
              <ResizablePanel defaultSize={20} minSize={15} maxSize={30}>
                <ProjectPanel 
                  files={files}
                  onFileSelect={handleFileSelect}
                  selectedFileId={selectedFileId}
                />
              </ResizablePanel>
              <ResizableHandle />
            </>
          )}
          
          <ResizablePanel defaultSize={activePanel ? 60 : 80}>
            <ResizablePanelGroup direction="vertical">
              <ResizablePanel defaultSize={70}>
                <EditorPanel
                  openTabs={openTabs}
                  activeTab={activeTab}
                  onTabSelect={setActiveTab}
                  onEditorChange={handleEditorChange}
                  files={files}
                  editorContent={editorContent}
                />
              </ResizablePanel>
              <ResizableHandle />
              <ResizablePanel defaultSize={30}>
                <OutputPanel output={output} />
              </ResizablePanel>
            </ResizablePanelGroup>
          </ResizablePanel>
          
          {activePanel === 'ai' && (
            <>
              <ResizableHandle />
              <ResizablePanel defaultSize={20} minSize={20} maxSize={40}>
                <AIPanel 
                  roomConnected={roomConnected}
                  roomName={roomName}
                />
              </ResizablePanel>
            </>
          )}
        </ResizablePanelGroup>
      </div>
      
      <StatusBar 
        language={files.find(f => f.id === activeTab)?.language || 'plaintext'}
        roomConnected={roomConnected}
      />
    </div>
  );
};

export default CodeStudio;