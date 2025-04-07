import { useState, useEffect } from 'react';
import { Route, Switch, useLocation } from 'wouter';
import CodeStudio from './pages/CodeStudio';
// Import the consolidated WebSocket collaboration client
import { webSocketCollab } from './lib/websocketCollab'; // Use the class instance directly

function App() {
  const [aiModel, setAiModel] = useState('gemini-1.5-flash'); // Updated default model
  const [isDarkMode, setIsDarkMode] = useState(true);
  const [location] = useLocation();
  const [isConnected, setIsConnected] = useState(false); // Track connection status

  useEffect(() => {
    // Apply dark mode to the document
    if (isDarkMode) {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
  }, [isDarkMode]);

  // WebSocket Initialization and Event Handling
  useEffect(() => {
    console.log('App component mounted, initializing WebSocket collaboration...');

    // Define event handlers
    const handleConnect = () => {
      console.log('WebSocket collaboration connected');
      setIsConnected(true);
      // Optionally join a default room or wait for user action
      // webSocketCollab.joinRoom('default-room', 'User-' + Math.random().toString(36).substring(7));
    };

    const handleDisconnect = (data: { code: number, reason: string }) => {
      console.log(`WebSocket collaboration disconnected: ${data.code} ${data.reason}`);
      setIsConnected(false);
      // Handle reconnection attempts if needed (logic is within websocketCollab)
    };

    const handleError = (error: Error) => {
      console.error('WebSocket collaboration error:', error);
      setIsConnected(false);
    };

    const handleMessage = (data: any) => {
      console.log('WebSocket message received:', data);
      // Handle specific message types if needed at the App level
      if (data.type === 'client_id') {
        console.log('Received client ID:', data.clientId);
      } else if (data.type === 'error') {
        console.error('Server error message:', data.message);
      }
    };

    // Register event listeners using the EventEmitter pattern
    webSocketCollab.on('connect', handleConnect);
    webSocketCollab.on('disconnect', handleDisconnect);
    webSocketCollab.on('error', handleError);
    webSocketCollab.on('message', handleMessage);

    // Initiate connection (if not already connecting/connected)
    if (!webSocketCollab.isConnected()) {
      webSocketCollab.connect().catch(err => {
        console.error("Initial connection failed:", err);
      });
    } else {
      // Already connected from a previous mount? Update status.
      setIsConnected(true);
    }

    // Cleanup on component unmount
    return () => {
      console.log('App component unmounting, removing WebSocket listeners.');
      // Remove listeners
      webSocketCollab.off('connect', handleConnect);
      webSocketCollab.off('disconnect', handleDisconnect);
      webSocketCollab.off('error', handleError);
      webSocketCollab.off('message', handleMessage);
      // Optionally disconnect if the App unmount means the end of the session
      // webSocketCollab.disconnect();
    };
  }, []); // Empty dependency array ensures this runs only once on mount

  // Function to test sending a message
  const testConnection = async () => {
    console.log('Attempting to send test message via WebSocket collaboration...');
    if (!webSocketCollab.isConnected()) {
      console.error('Cannot send test message: WebSocket not connected.');
      return;
    }
    try {
      // Use a generic message type or a specific test type if defined
      await webSocketCollab.send({ type: 'test_message', payload: 'Hello Server from Client!' });
      console.log('Test message sent successfully');
    } catch (error) {
      console.error('Failed to send test message:', error);
    }
  };

  return (
    <div className="min-h-screen flex flex-col">
      {/* Add a button to test the connection */}
      <button
        onClick={testConnection}
        className="absolute top-2 right-2 bg-blue-500 hover:bg-blue-700 text-white font-bold py-1 px-2 rounded z-50 disabled:opacity-50"
        disabled={!isConnected} // Disable button if not connected
      >
        Test WS {isConnected ? '✅' : '❌'}
      </button>

      <Switch>
        {/* Pass connection status down if needed */}
        <Route path="/" component={() =>
          <CodeStudio
            aiModel={aiModel}
            setAiModel={setAiModel}
            isDarkMode={isDarkMode}
            setIsDarkMode={setIsDarkMode}
            // Pass isConnected status if CodeStudio needs it
            // isConnected={isConnected}
          />
        } />
        {/* ... other routes ... */}
        <Route>
          <div className="flex items-center justify-center h-screen">
            <h1 className="text-2xl">Page Not Found</h1>
          </div>
        </Route>
      </Switch>
    </div>
  );
}

export default App;