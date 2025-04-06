import { useState, useEffect } from 'react';
import Header from '../components/Header';
import Sidebar from '../components/Sidebar';
import ProjectPanel from '../components/ProjectPanel';
import EditorPanel from '../components/EditorPanel';
import AIPanel from '../components/AIPanel';
import StatusBar from '../components/StatusBar';
import OutputPanel from '../components/OutputPanel';
import { SettingsPanel } from '../components/SettingsPanel';
import { ResizablePanelGroup, ResizablePanel, ResizableHandle } from '@/components/ui/resizable';
import websocketCollab from '../lib/websocketCollab';

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
  
  // AI features state
  const [aiChatMode, setAiChatMode] = useState<'chat' | 'history' | 'settings'>('chat');
  const [features, setFeatures] = useState({
    webAccess: false,
    thinking: false,
    prompts: true,
    genkit: true,
    commands: false
  });
  
  // Convenience accessor functions 
  const webAccessEnabled = features.webAccess;
  const thinkingEnabled = features.thinking;
  const promptsEnabled = features.prompts;
  const genkitEnabled = features.genkit;
  const commandsEnabled = features.commands;

  useEffect(() => {
    // Fetch project files on component mount
    fetchFiles();
    // Create or join LiveKit room
    createOrJoinRoom();
    // Fetch current feature toggle states
    fetchFeatureStates();
  }, []);
  
  // Fetch the current state of all feature toggles from the server
  const fetchFeatureStates = async () => {
    try {
      const response = await fetch('/api/ai/features');
      const data = await response.json();
      
      if (data.success) {
        // Update local state with server state
        setFeatures(prev => ({
          ...prev,
          ...(data.features || {})  // Only update if features exist in response
        }));
        console.log('Feature states synchronized with server');
      } else {
        console.error('Failed to fetch feature states:', data.message);
      }
    } catch (error) {
      console.error('Error fetching feature states:', error);
    }
  };

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
      // Create or join a collaboration room using our WebSocket collaboration service
      const participantName = 'User-' + Math.floor(Math.random() * 10000);
      
      // Import the WebSocket collab client
      const { webSocketCollab } = await import('../lib/websocketCollab');
      
      // Set up event handlers
      webSocketCollab.on('connect', () => {
        console.log('WebSocket collaboration connected');
      });
      
      webSocketCollab.on('error', (error) => {
        console.error('WebSocket collaboration error:', error);
      });
      
      webSocketCollab.on('room-joined', (data) => {
        console.log('Joined room:', data);
        setRoomConnected(true);
      });
      
      // Connect to the WebSocket server
      await webSocketCollab.connect();
      
      // Join or create the room
      try {
        await webSocketCollab.joinRoom(roomName, participantName, true);
      } catch (joinError) {
        console.error('Error joining room:', joinError);
        
        // Try to create the room first
        try {
          await webSocketCollab.createRoom(roomName);
          await webSocketCollab.joinRoom(roomName, participantName);
        } catch (createError) {
          console.error('Error creating room:', createError);
        }
      }
    } catch (error) {
      console.error('Error with WebSocket collaboration:', error);
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
  
  const handleToggleSettingsPanel = () => {
    setActivePanel(activePanel === 'settings' ? '' : 'settings');
  };
  
  // Handle AI feature toggles
  const handlePromptPanel = () => {
    setActivePanel(activePanel === 'prompt' ? '' : 'prompt');
    setFeatures(prev => ({
      ...prev,
      prompts: true
    }));
    console.log('Prompts selected');
  };
  
  const handleHistoryPanel = () => {
    setActivePanel(activePanel === 'ai' ? '' : 'ai');
    setAiChatMode('history');
    console.log('History selected');
  };
  
  // Updated generic toggle handler that works with any feature
  const handleFeatureToggle = async (feature: keyof FeatureState) => {
    const newValue = !features[feature];
    setFeatures(prev => ({ ...prev, [feature]: newValue }));
    
    // Send to server
    websocketCollab.sendFeatureUpdate(feature, newValue);
    
    // Also update via REST API for persistence
    try {
      await fetch(`/api/ai/features?sessionId=${sessionId}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ [feature]: newValue })
      });
    } catch (error) {
      console.error('Error updating feature toggle:', error);
      
      // Verify state in case of error
      try {
        const response = await fetch(`/api/ai/features?sessionId=${sessionId}`);
        const serverState = await response.json();
        if (serverState.features[feature] !== newValue) {
          setFeatures(prev => ({ ...prev, ...serverState.features }));
        }
      } catch (syncError) {
        console.error('Error syncing feature state:', syncError);
      }
    }
  };

  // Add event listener for WebSocket updates
  useEffect(() => {
    const handleFeatureUpdate = (event: CustomEvent) => {
      const { features: updatedFeatures } = event.detail;
      setFeatures(prev => ({ ...prev, ...updatedFeatures }));
    };
    
    window.addEventListener('featureUpdate', handleFeatureUpdate as EventListener);
    
    return () => {
      window.removeEventListener('featureUpdate', handleFeatureUpdate as EventListener);
    };
  }, []);

  // Feature-specific toggle handlers that use the generic handler
  const handleWebAccessToggle = () => handleFeatureToggle('webAccess');
  const handleThinkingToggle = () => handleFeatureToggle('thinking');
  const handlePromptsToggle = () => handleFeatureToggle('prompts');
  const handleGenkitToggle = () => handleFeatureToggle('genkit');
  const handleCommandsToggle = () => handleFeatureToggle('commands');

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
          onToggleSettingsPanel={handleToggleSettingsPanel}
          onPromptPanel={handlePromptPanel}
          onHistoryPanel={handleHistoryPanel}
          onWebAccessToggle={handleWebAccessToggle}
          onThinkingToggle={handleThinkingToggle}
          onGenkitToggle={handleGenkitToggle}
          onCommandsToggle={handleCommandsToggle}
          activePanel={activePanel}
        />
        
        <ResizablePanelGroup direction="horizontal" className="flex-1">
          {activePanel === 'project' && (
            <>
              <ResizablePanel id="project-panel" order={1} defaultSize={20} minSize={15} maxSize={30}>
                <ProjectPanel 
                  files={files}
                  onFileSelect={handleFileSelect}
                  selectedFileId={selectedFileId}
                />
              </ResizablePanel>
              <ResizableHandle />
            </>
          )}
          
          <ResizablePanel 
            id="editor-panel" 
            order={2} 
            defaultSize={activePanel ? (activePanel === 'project' ? 80 : 60) : 100}
          >
            <ResizablePanelGroup direction="vertical">
              <ResizablePanel id="code-editor" order={1} defaultSize={70}>
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
              <ResizablePanel id="output-panel" order={2} defaultSize={30}>
                <OutputPanel output={output} />
              </ResizablePanel>
            </ResizablePanelGroup>
          </ResizablePanel>
          
          {activePanel === 'ai' && (
            <>
              <ResizableHandle />
              <ResizablePanel id="ai-panel" order={3} defaultSize={20} minSize={20} maxSize={40}>
                <AIPanel 
                  roomConnected={roomConnected}
                  roomName={roomName}
                  chatMode={aiChatMode}
                  setChatMode={setAiChatMode}
                  webAccessEnabled={webAccessEnabled}
                  thinkingEnabled={thinkingEnabled}
                  promptsEnabled={promptsEnabled}
                  genkitEnabled={genkitEnabled}
                  commandsEnabled={commandsEnabled}
                  onWebAccessToggle={handleWebAccessToggle}
                  onThinkingToggle={handleThinkingToggle}
                  onPromptPanel={handlePromptPanel}
                  onHistoryPanel={handleHistoryPanel}
                  onGenkitToggle={handleGenkitToggle}
                  onCommandsToggle={handleCommandsToggle}
                />
              </ResizablePanel>
            </>
          )}
          
          {activePanel === 'settings' && (
            <>
              <ResizableHandle />
              <ResizablePanel id="settings-panel" order={3} defaultSize={20} minSize={20} maxSize={40}>
                <SettingsPanel 
                  onClose={() => handleToggleSettingsPanel()} 
                  features={features}
                  onFeatureToggle={(feature, value) => {
                    // Update the local state
                    setFeatures(prev => ({
                      ...prev,
                      [feature]: value
                    }));
                    
                    // Call the API to update server-side state
                    fetch('/api/ai/features', {
                      method: 'POST',
                      headers: { 'Content-Type': 'application/json' },
                      body: JSON.stringify({ [feature]: value })
                    })
                    .then(res => res.json())
                    .then(data => {
                      console.log(`${feature} ${value ? 'enabled' : 'disabled'}`);
                    })
                    .catch(error => {
                      console.error(`Error toggling ${feature}:`, error);
                      // Revert UI state if API call fails
                      setFeatures(prev => ({
                        ...prev,
                        [feature]: !value
                      }));
                    });
                  }}
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