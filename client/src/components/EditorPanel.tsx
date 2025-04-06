import { useState, useEffect } from 'react';
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

// Define RemoteUser type for collaborative cursors
interface RemoteUser {
  id: string;
  name: string;
  color: string;
  position?: {
    line: number;
    column: number;
  };
}

const EditorPanel = ({
  openTabs,
  activeTab,
  onTabSelect,
  onEditorChange,
  files,
  editorContent,
}: EditorPanelProps) => {
  const [remoteUsers, setRemoteUsers] = useState<RemoteUser[]>([]);
  const [collabInitialized, setCollabInitialized] = useState(false);
  const [webSocketCollab, setWebSocketCollab] = useState<any>(null);
  
  // Initialize collaboration when component mounts
  useEffect(() => {
    const initCollaboration = async () => {
      try {
        // Dynamically import the WebSocket collaboration client
        const { webSocketCollab: wsCollab } = await import('../lib/websocketCollab');
        
        if (wsCollab && !collabInitialized) {
          // Set up event handlers for collaborative editing
          wsCollab.on('participant-joined', (data: any) => {
            console.log('Participant joined:', data);
            
            // Generate a random color for the user
            const colors = [
              '#FF5252', '#FF4081', '#E040FB', '#7C4DFF', 
              '#536DFE', '#448AFF', '#40C4FF', '#18FFFF',
              '#64FFDA', '#69F0AE', '#B2FF59', '#EEFF41'
            ];
            
            // Add the user to our remote users list
            setRemoteUsers(prev => [
              ...prev, 
              {
                id: data.participantId,
                name: data.participantName,
                color: colors[Math.floor(Math.random() * colors.length)]
              }
            ]);
          });
          
          wsCollab.on('participant-left', (data: any) => {
            console.log('Participant left:', data);
            
            // Remove the user from our remote users list
            setRemoteUsers(prev => 
              prev.filter(user => user.id !== data.participantId)
            );
          });
          
          wsCollab.on('cursor-update', (data: any) => {
            console.log('Cursor update:', data);
            
            // Update the cursor position for the remote user
            setRemoteUsers(prev => 
              prev.map(user => {
                if (user.id === data.senderId) {
                  return {
                    ...user,
                    position: data.position
                  };
                }
                return user;
              })
            );
          });
          
          wsCollab.on('code-update', (data: any) => {
            console.log('Code update:', data);
            
            // Only apply code updates for the active file
            if (data.fileId === activeTab) {
              onEditorChange(data.content);
            }
          });
          
          setWebSocketCollab(wsCollab);
          setCollabInitialized(true);
        }
      } catch (error) {
        console.error('Error initializing collaboration:', error);
      }
    };
    
    initCollaboration();
    
    // Cleanup function
    return () => {
      if (webSocketCollab) {
        webSocketCollab.off('participant-joined', () => {});
        webSocketCollab.off('participant-left', () => {});
        webSocketCollab.off('cursor-update', () => {});
        webSocketCollab.off('code-update', () => {});
      }
    };
  }, [activeTab, onEditorChange]);
  
  // Update remote editor content when our content changes
  useEffect(() => {
    if (webSocketCollab && webSocketCollab.isInRoom() && activeTab) {
      // Send the content update to other collaborators
      webSocketCollab.updateCode(activeTab, editorContent).catch(error => {
        console.error('Error sending code update:', error);
      });
    }
  }, [webSocketCollab, activeTab, editorContent]);
  
  // Handle cursor position updates
  const handleCursorPositionChange = (position: { line: number, column: number }) => {
    if (webSocketCollab && webSocketCollab.isInRoom() && activeTab) {
      // Send the cursor position update to other collaborators
      webSocketCollab.updateCursor(position).catch(error => {
        console.error('Error sending cursor update:', error);
      });
    }
  };
  
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
  
  const handleTabClose = (tabId: string, e: React.MouseEvent) => {
    e.stopPropagation();
    
    // Remove the tab from open tabs
    // In a real implementation, we would need to handle saving changes first
    const updatedTabs = openTabs.filter(id => id !== tabId);
    onTabSelect(updatedTabs.length > 0 ? updatedTabs[0] : '');
  };

  return (
    <div className="h-full flex flex-col">
      {openTabs.length > 0 ? (
        <>
          <div className="flex bg-muted/30 border-b">
            {openTabs.map(tabId => (
              <div
                key={tabId}
                className={`
                  flex items-center px-3 py-2 text-sm cursor-pointer
                  ${activeTab === tabId ? 'bg-background border-b-2 border-primary' : 'hover:bg-muted/50'}
                `}
                onClick={() => onTabSelect(tabId)}
              >
                <FileCode className="h-4 w-4 mr-1.5" />
                <span>{getFileName(tabId)}</span>
                <X 
                  className="h-4 w-4 ml-2 opacity-50 hover:opacity-100" 
                  onClick={(e) => handleTabClose(tabId, e)}
                />
              </div>
            ))}
          </div>
          <div className="flex-1 overflow-hidden">
            {activeTab && (
              <CodeEditor
                content={editorContent}
                language={getLanguage(activeTab)}
                onChange={onEditorChange}
                onCursorPositionChange={handleCursorPositionChange}
                remoteCursors={remoteUsers.filter((u): u is RemoteUser & { position: { line: number, column: number } } => 
                  u.position !== undefined
                )}
              />
            )}
          </div>
          
          {/* Collaborative users indicator */}
          {remoteUsers.length > 0 && (
            <div className="p-1 bg-muted/20 border-t flex items-center">
              <span className="text-xs mr-2 text-muted-foreground">Collaborators:</span>
              <div className="flex -space-x-2">
                {remoteUsers.map(user => (
                  <div 
                    key={user.id}
                    className="w-6 h-6 rounded-full flex items-center justify-center text-white text-xs"
                    style={{ backgroundColor: user.color }}
                    title={user.name}
                  >
                    {user.name.substring(0, 1).toUpperCase()}
                  </div>
                ))}
              </div>
            </div>
          )}
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