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
// Import the singleton instance of the collaboration client
import { webSocketCollab } from '../lib/websocketCollab';
import { FeatureState } from '../types'; // Import FeatureState type

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
  const [roomConnected, setRoomConnected] = useState(webSocketCollab.isConnected()); // Initialize with current status
  const [roomName, setRoomName] = useState('default-room');
  const [sessionId, setSessionId] = useState<string>('default'); // Example session ID

  // AI features state
  const [features, setFeatures] = useState<FeatureState>({
    webAccess: false,
    thinking: false,
    // prompts: true, // Removed as it's not in FeatureState type
    genkit: true,
    commands: false,
    // Add other features defined in FeatureState if needed
    collaboration: false,
    codeCompletion: false,
    autoSave: false,
    darkMode: isDarkMode, // Initialize from props
  });

  // Convenience accessor functions
  const webAccessEnabled = features.webAccess;
  const thinkingEnabled = features.thinking;
  // const promptsEnabled = features.prompts; // Removed
  const genkitEnabled = features.genkit;
  const commandsEnabled = features.commands;

  // Fetch initial data and set up WebSocket listeners
  useEffect(() => {
    fetchFiles();
    fetchFeatureStates(); // Fetch initial feature states

    // WebSocket connection listeners
    const handleConnect = () => {
      console.log('CodeStudio: WebSocket connected');
      setRoomConnected(true);
      // Attempt to join room after connection
      joinRoom();
    };
    const handleDisconnect = () => {
      console.log('CodeStudio: WebSocket disconnected');
      setRoomConnected(false);
    };
    const handleError = (error: Error) => {
      console.error('CodeStudio: WebSocket error', error);
      setRoomConnected(false);
    };
     const handleFeatureUpdate = (data: any) => {
       if (data.type === 'featureUpdate') {
         console.log('Received feature update via WebSocket:', data.features);
         setFeatures(prev => ({ ...prev, ...data.features }));
       }
     };

    webSocketCollab.on('connect', handleConnect);
    webSocketCollab.on('disconnect', handleDisconnect);
    webSocketCollab.on('error', handleError);
    webSocketCollab.on('message', handleFeatureUpdate); // Listen for feature updates

    // If already connected when component mounts, join room
    if (webSocketCollab.isConnected()) {
      setRoomConnected(true);
      joinRoom();
    } else {
      // Attempt connection if not already connected
      webSocketCollab.connect().catch(err => console.error("Initial connection failed:", err));
    }

    // Cleanup listeners on unmount
    return () => {
      webSocketCollab.off('connect', handleConnect);
      webSocketCollab.off('disconnect', handleDisconnect);
      webSocketCollab.off('error', handleError);
      webSocketCollab.off('message', handleFeatureUpdate);
    };
  }, []); // Run only on mount

  // Fetch the current state of all feature toggles from the server
  const fetchFeatureStates = async () => {
    try {
      const response = await fetch(`/api/ai/features?sessionId=${sessionId}`);
      const data = await response.json();

      if (data.success && data.features) {
        // Update local state with server state
        setFeatures(prev => ({
          ...prev,
          ...data.features
        }));
        console.log('Feature states synchronized with server:', data.features);
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
      // Select the first file if none is selected
      if (!selectedFileId && data.length > 0) {
          const firstFile = findFirstFile(data);
          if (firstFile) {
              handleFileSelect(firstFile.id);
          }
      }
    } catch (error) {
      console.error('Error fetching files:', error);
    }
  };

  // Helper to find the first non-folder file
  const findFirstFile = (fileList: ProjectFileInfo[]): ProjectFileInfo | null => {
      for (const file of fileList) {
          if (!file.isFolder) return file;
          if (file.children) {
              const found = findFirstFile(file.children);
              if (found) return found;
          }
      }
      return null;
  };


  const joinRoom = async () => {
    if (!webSocketCollab.isConnected()) {
      console.warn("Cannot join room: WebSocket not connected.");
      return;
    }
    try {
      const participantName = 'User-' + Math.random().toString(36).substring(7);
      await webSocketCollab.joinRoom(roomName, participantName, true);
      console.log(`Successfully joined room: ${roomName}`);
    } catch (error) {
      console.error('Error joining room:', error);
      // Optionally try creating the room if joining fails
      try {
          await webSocketCollab.createRoom(roomName);
          console.log(`Created room ${roomName}, attempting to join again...`);
          await joinRoom(); // Retry joining
      } catch (createError) {
          console.error(`Failed to create or join room ${roomName}:`, createError);
      }
    }
  };

  // ... (handleFileSelect, findFile, handleEditorChange remain mostly the same) ...
  const handleFileSelect = (fileId: string) => {
    setSelectedFileId(fileId);

    // Find the file
    const findFile = (currentFiles: ProjectFileInfo[]): ProjectFileInfo | undefined => {
      for (const file of currentFiles) {
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
        setOpenTabs(prevTabs => [...prevTabs, fileId]);
      }

      setActiveTab(fileId);

      // Set editor content
      setEditorContent(file.content || '');
    }
  };

  const handleEditorChange = (content: string) => {
    setEditorContent(content);

    // Update the file content in the local state immediately for responsiveness
    if (activeTab) {
      setFiles(prevFiles => {
        const updateFileContent = (fileList: ProjectFileInfo[]): ProjectFileInfo[] => {
          return fileList.map(file => {
            if (file.id === activeTab) {
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

      // Debounce saving or send updates via WebSocket if collab is active
      // Example: Send update via WebSocket collab
      if (webSocketCollab.isInRoom()) {
        webSocketCollab.updateCode(activeTab, content)
          .catch(err => console.error("Failed to send code update:", err));
      } else {
        // Implement debounced saving to API here if needed
        console.log('File content changed, would save:', content.substring(0, 50) + '...');
      }
    }
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
    // handleFeatureToggle('prompts'); // Toggle prompts feature if needed
    console.log('Prompts panel selected');
  };

  const handleHistoryPanel = () => {
    setActivePanel(activePanel === 'ai' ? '' : 'ai');
    // setAiChatMode('history'); // Assuming AIPanel handles internal mode
    console.log('History selected');
  };

  // Updated generic toggle handler that works with any feature in FeatureState
  const handleFeatureToggle = async (feature: keyof FeatureState) => {
    const newValue = !features[feature];
    // Optimistic UI update
    setFeatures(prev => ({ ...prev, [feature]: newValue }));

    try {
      // Send update via WebSocket for real-time sync
      if (webSocketCollab.isConnected()) {
        webSocketCollab.send({
          type: 'featureUpdate',
          feature,
          value: newValue
        });
      }

      // Update via REST API for persistence
      const response = await fetch(`/api/ai/features?sessionId=${sessionId}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ [feature]: newValue })
      });

      if (!response.ok) {
        throw new Error(`Failed to update feature ${feature}`);
      }
      const data = await response.json();
      console.log(`Feature ${feature} updated successfully:`, data.features);
      // Optionally re-sync state from server response if needed
      // setFeatures(prev => ({ ...prev, ...data.features }));

    } catch (error) {
      console.error(`Error toggling feature ${feature}:`, error);
      // Revert UI state on error
      setFeatures(prev => ({ ...prev, [feature]: !newValue }));
      // Optionally show an error toast to the user
    }
  };


  // Feature-specific toggle handlers that use the generic handler
  const handleWebAccessToggle = () => handleFeatureToggle('webAccess');
  const handleThinkingToggle = () => handleFeatureToggle('thinking');
  // const handlePromptsToggle = () => handleFeatureToggle('prompts'); // Removed
  const handleGenkitToggle = () => handleFeatureToggle('genkit');
  const handleCommandsToggle = () => handleFeatureToggle('commands');

  // ... (executeCode remains the same) ...
   const executeCode = async () => {
    // Add a loading message
    setOutput(prev => [...prev, '> Executing code...']);

    try {
      // Find the currently active file to determine language
      const findFile = (currentFiles: ProjectFileInfo[]): ProjectFileInfo | undefined => {
        for (const file of currentFiles) {
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
        setOutput(prev => [...prev, data.result]);
      }

      if (data.error) {
        setOutput(prev => [...prev, `Error: ${data.error}`]);
      }
    } catch (error: any) {
      console.error('Error executing code:', error);
      setOutput(prev => [...prev, `Error: ${error.message || 'Unknown error'}`]);
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
              <ResizableHandle withHandle />
            </>
          )}

          <ResizablePanel
            id="editor-panel"
            order={2}
            // Adjust default size based on which panels are open
            defaultSize={
                activePanel === 'project' && activePanel === 'ai' ? 60 :
                activePanel === 'project' || activePanel === 'ai' ? 80 : 100
            }
          >
            <ResizablePanelGroup direction="vertical">
              <ResizablePanel id="code-editor" order={1} defaultSize={70}>
                <EditorPanel
                  openTabs={openTabs}
                  activeTab={activeTab}
                  onTabSelect={setActiveTab} // Pass setActiveTab directly
                  onEditorChange={handleEditorChange}
                  files={files}
                  editorContent={editorContent}
                />
              </ResizablePanel>
              <ResizableHandle withHandle />
              <ResizablePanel id="output-panel" order={2} defaultSize={30}>
                <OutputPanel output={output} />
              </ResizablePanel>
            </ResizablePanelGroup>
          </ResizablePanel>

          {activePanel === 'ai' && (
            <>
              <ResizableHandle withHandle />
              <ResizablePanel id="ai-panel" order={3} defaultSize={20} minSize={20} maxSize={40}>
                <AIPanel
                  roomConnected={roomConnected}
                  roomName={roomName}
                  // Pass feature states and handlers down
                  webAccessEnabled={webAccessEnabled}
                  thinkingEnabled={thinkingEnabled}
                  // promptsEnabled={promptsEnabled} // Removed
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
                  onClose={() => setActivePanel('')} // Close panel on request
                  features={features}
                  onFeatureToggle={handleFeatureToggle} // Pass generic handler
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