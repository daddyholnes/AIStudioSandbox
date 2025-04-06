import { useState, useEffect } from 'react';
import Header from '@/components/Header';
import Sidebar from '@/components/Sidebar';
import ProjectPanel from '@/components/ProjectPanel';
import EditorPanel from '@/components/EditorPanel';
import AIPanel from '@/components/AIPanel';
import StatusBar from '@/components/StatusBar';
import { ProjectFileInfo } from '@shared/schema';
import { useQuery } from '@tanstack/react-query';
import { sendWebSocketMessage, registerMessageHandler, unregisterMessageHandler } from '@/lib/websocket';

// Sample initial files
const initialFiles: ProjectFileInfo[] = [
  {
    id: 'folder-1',
    name: 'Project Files',
    path: '/project-files',
    language: 'folder',
    isFolder: true,
    children: [
      {
        id: 'file-1',
        name: 'index.js',
        path: '/project-files/index.js',
        language: 'javascript',
        isFolder: false,
        content: '// Start coding here...'
      },
      {
        id: 'file-2',
        name: 'index.html',
        path: '/project-files/index.html',
        language: 'html',
        isFolder: false,
        content: `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>LiveKit Communication App</title>
  <script src="https://cdn.livekit.io/livekit-client/latest/livekit-client.js"></script>
</head>
<body>
  <div id="app">
    <h1>LiveKit Room Demo</h1>
    <div id="controls"></div>
  </div>
</body>
</html>`
      },
      {
        id: 'file-3',
        name: 'styles.css',
        path: '/project-files/styles.css',
        language: 'css',
        isFolder: false,
        content: `body {
  font-family: 'Roboto', sans-serif;
  margin: 0;
  padding: 20px;
}

#app {
  max-width: 800px;
  margin: 0 auto;
}`
      }
    ]
  },
  {
    id: 'folder-2',
    name: 'LiveKit Config',
    path: '/livekit-config',
    language: 'folder',
    isFolder: true,
    children: []
  },
  {
    id: 'folder-3',
    name: 'Vertex AI',
    path: '/vertex-ai',
    language: 'folder',
    isFolder: true,
    children: []
  }
];

const Home = () => {
  const [showProjectPanel, setShowProjectPanel] = useState(true);
  const [showAIPanel, setShowAIPanel] = useState(true);
  const [selectedFileId, setSelectedFileId] = useState<string | null>('file-2');
  const [activeTab, setActiveTab] = useState<string>('file-2');
  const [openTabs, setOpenTabs] = useState<string[]>(['file-2', 'file-1', 'file-3']);
  const [editorContent, setEditorContent] = useState<string>('');
  const [files, setFiles] = useState<ProjectFileInfo[]>(initialFiles);
  const [roomConnected, setRoomConnected] = useState<boolean>(false);
  const [roomName, setRoomName] = useState<string>('RM_hycBMAjmtGUb');
  const [aiModel, setAiModel] = useState<string>('gemini-2.0-flash-exp');
  const [loading, setLoading] = useState<boolean>(false);
  
  // Set up WebSocket message handlers
  useEffect(() => {
    // Handle room token responses
    registerMessageHandler('room-token', (data) => {
      console.log('Room token received:', data);
      setRoomName(data.roomName);
      // Here you would connect to the room using the token
      setRoomConnected(true);
    });
    
    // Handle AI responses
    registerMessageHandler('ai-response', (data) => {
      console.log('AI response received:', data);
      // You would process the AI response in the appropriate component
    });
    
    // Handle errors
    registerMessageHandler('error', (data) => {
      console.error('WebSocket error received:', data.message);
      // Display error to user
    });
    
    // Clean up handlers on unmount
    return () => {
      unregisterMessageHandler('room-token');
      unregisterMessageHandler('ai-response');
      unregisterMessageHandler('error');
    };
  }, []);
  
  // Join a LiveKit room via WebSocket
  const joinRoom = async (roomName: string, participantName: string = 'User') => {
    try {
      setLoading(true);
      
      // Send join-room message via WebSocket
      await sendWebSocketMessage('join-room', { 
        roomName,
        participantName
      });
      
      return true;
    } catch (error) {
      console.error('Error joining room:', error);
      return false;
    } finally {
      setLoading(false);
    }
  };

  // Find the selected file
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

  // Load file content when selected file changes
  useEffect(() => {
    if (selectedFileId) {
      const file = findFile(selectedFileId, files);
      if (file && !file.isFolder) {
        setEditorContent(file.content || '');
      }
    }
  }, [selectedFileId, files]);

  // Handle file selection
  const handleFileSelect = (fileId: string) => {
    const file = findFile(fileId, files);
    if (file && !file.isFolder) {
      setSelectedFileId(fileId);
      if (!openTabs.includes(fileId)) {
        setOpenTabs([...openTabs, fileId]);
      }
      setActiveTab(fileId);
    }
  };

  // Handle tab selection
  const handleTabSelect = (fileId: string) => {
    setActiveTab(fileId);
    setSelectedFileId(fileId);
  };

  // Handle editor content change
  const handleEditorChange = (content: string) => {
    setEditorContent(content);
    
    // Update the file content in the files state
    if (selectedFileId) {
      setFiles(prevFiles => {
        const updateFileContent = (fileList: ProjectFileInfo[]): ProjectFileInfo[] => {
          return fileList.map(file => {
            if (file.id === selectedFileId) {
              return { ...file, content };
            }
            if (file.isFolder && file.children) {
              return {
                ...file,
                children: updateFileContent(file.children)
              };
            }
            return file;
          });
        };
        
        return updateFileContent(prevFiles);
      });
    }
  };

  // Toggle panels
  const toggleProjectPanel = () => setShowProjectPanel(!showProjectPanel);
  const toggleAIPanel = () => setShowAIPanel(!showAIPanel);

  // Get active file
  const activeFile = selectedFileId ? findFile(selectedFileId, files) : null;

  return (
    <div className="flex flex-col h-screen overflow-hidden">
      <Header 
        aiModel={aiModel} 
        setAiModel={setAiModel} 
      />
      
      <div className="flex-1 flex overflow-hidden">
        <Sidebar 
          onToggleProjectPanel={toggleProjectPanel}
          onToggleAIPanel={toggleAIPanel}
          activePanel={showProjectPanel ? 'files' : showAIPanel ? 'chat' : ''}
        />
        
        {showProjectPanel && (
          <ProjectPanel 
            files={files}
            onFileSelect={handleFileSelect}
            selectedFileId={selectedFileId}
          />
        )}
        
        <EditorPanel 
          openTabs={openTabs}
          activeTab={activeTab}
          onTabSelect={handleTabSelect}
          onEditorChange={handleEditorChange}
          files={files}
          editorContent={editorContent}
        />
        
        {showAIPanel && (
          <AIPanel 
            roomConnected={roomConnected}
            roomName={roomName}
          />
        )}
      </div>
      
      <StatusBar 
        language={activeFile?.language || 'plaintext'}
        roomConnected={roomConnected}
      />
    </div>
  );
};

export default Home;
