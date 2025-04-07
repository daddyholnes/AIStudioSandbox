import { useState, useEffect } from 'react';
import { runAllTests, getNetworkInfo, testWebSocketConnection } from '../utils/connectionTester';
import { websocket } from '../utils/websocketClient';

export default function ConnectionDiagnostics() {
  const [testResults, setTestResults] = useState(null);
  const [networkInfo, setNetworkInfo] = useState(null);
  const [wsStatus, setWsStatus] = useState('disconnected');
  const [wsError, setWsError] = useState(null);
  const [wsMessages, setWsMessages] = useState([]);
  const [messageInput, setMessageInput] = useState('');
  const [connectionAttempts, setConnectionAttempts] = useState(0);

  useEffect(() => {
    // Get network info
    setNetworkInfo(getNetworkInfo());
    
    // Run connection tests
    runAllTests().then(results => {
      setTestResults(results);
      // If WebSocket test failed, store the error information
      if (!results.websocket) {
        setWsError('WebSocket connection test failed. Check server availability.');
      }
    });
    
    // Set up WebSocket listeners
    const onOpenUnsubscribe = websocket.onOpen(() => {
      setWsStatus('connected');
      setWsError(null); // Clear any previous errors
    });
    
    const onCloseUnsubscribe = websocket.onClose((event) => {
      setWsStatus('disconnected');
      if (event.code === 1006) {
        setWsError(`Connection closed abnormally (Code 1006). This typically means the server is not available or the connection timed out.`);
      } else if (event.code !== 1000) {
        setWsError(`Connection closed with code ${event.code}${event.reason ? ': ' + event.reason : ''}`);
      }
    });
    
    const onErrorUnsubscribe = websocket.onError((error) => {
      setWsStatus('error');
      setWsError(`WebSocket error: ${error.message || 'Unknown error'}`);
    });
    
    const onMessageUnsubscribe = websocket.onMessage((data) => {
      setWsMessages(prev => [...prev, { received: true, data, time: new Date() }].slice(-10));
    });
    
    return () => {
      onOpenUnsubscribe();
      onCloseUnsubscribe();
      onErrorUnsubscribe();
      onMessageUnsubscribe();
    };
  }, [connectionAttempts]);
  
  const handleSendMessage = () => {
    if (messageInput.trim()) {
      const success = websocket.send(messageInput);
      if (success) {
        setWsMessages(prev => [...prev, { sent: true, data: messageInput, time: new Date() }].slice(-10));
        setMessageInput('');
      } else {
        setWsError('Failed to send message. Connection might be closed.');
      }
    }
  };
  
  const handleConnectionTest = async () => {
    setTestResults(null); // Clear previous results
    setWsError(null); // Clear previous errors
    const results = await runAllTests();
    setTestResults(results);
  };
  
  const handleReconnect = () => {
    setWsError(null); // Clear previous errors
    websocket.connect();
    setConnectionAttempts(prev => prev + 1); // Force effect to run again
  };
  
  const handleAlternatePortTest = async () => {
    // Try connecting to port 3002 instead of 3001
    const result = await testWebSocketConnection('ws://localhost:3002/ws');
    if (result) {
      alert('Successfully connected to ws://localhost:3002/ws! Consider updating your app to use this port instead.');
    } else {
      alert('Connection to alternate port (3002) also failed.');
    }
  };

  // Adding a simple method to help you restart and run your app
  const handleStartApp = () => {
    // This will redirect to your main app entry point
    window.location.href = '/';
  };

  // Adding below the other handlers and before the return statement
  const showRunInstructions = () => {
    alert(`
How to run your app:

1. Terminal #1: Start your Vite development server
   npm run dev

2. Terminal #2: Start your WebSocket server 
   npm run server

Open your browser at: http://localhost:5173
    `);
  };

  return (
    <div style={{ maxWidth: '800px', margin: '20px auto', padding: '20px', fontFamily: 'sans-serif' }}>
      <h2>Connection Diagnostics</h2>
      
      <div style={{ marginBottom: '20px', padding: '15px', backgroundColor: '#e3f2fd', borderRadius: '4px' }}>
        <h3 style={{ marginTop: '0' }}>App Navigation</h3>
        <div style={{ display: 'flex', gap: '10px' }}>
          <button 
            onClick={handleStartApp}
            style={{ 
              padding: '10px 15px',
              backgroundColor: '#4caf50',
              color: 'white',
              border: 'none',
              borderRadius: '4px',
              cursor: 'pointer',
              fontWeight: 'bold'
            }}
          >
            Go To Main App
          </button>
          <button 
            onClick={showRunInstructions}
            style={{ 
              padding: '10px 15px',
              backgroundColor: '#2196f3',
              color: 'white',
              border: 'none',
              borderRadius: '4px',
              cursor: 'pointer'
            }}
          >
            Show Run Instructions
          </button>
        </div>
      </div>
      
      <div style={{ border: '1px solid #ccc', borderRadius: '4px', padding: '15px', marginBottom: '20px' }}>
        <h3>Network Information</h3>
        {networkInfo && (
          <ul>
            <li><strong>Current URL:</strong> {networkInfo.url}</li>
            <li><strong>Protocol:</strong> {networkInfo.protocol}</li>
            <li><strong>Hostname:</strong> {networkInfo.hostname}</li>
            <li><strong>Port:</strong> {networkInfo.port || '(default)'}</li>
          </ul>
        )}
      </div>
      
      <div style={{ border: '1px solid #ccc', borderRadius: '4px', padding: '15px', marginBottom: '20px' }}>
        <h3>Connection Test Results</h3>
        {testResults ? (
          <ul>
            <li>
              <strong>Vite Server:</strong> 
              <span style={{ color: testResults.vite ? 'green' : 'red' }}>
                {testResults.vite ? '✓ Connected' : '✕ Failed'}
              </span>
            </li>
            <li>
              <strong>WebSocket Server:</strong> 
              <span style={{ color: testResults.websocket ? 'green' : 'red' }}>
                {testResults.websocket ? '✓ Connected' : '✕ Failed'}
              </span>
              {!testResults.websocket && (
                <button 
                  onClick={handleAlternatePortTest}
                  style={{ marginLeft: '10px', fontSize: '0.8em' }}
                >
                  Try Port 3002
                </button>
              )}
            </li>
            <li>
              <strong>API Server:</strong> 
              <span style={{ color: testResults.api ? 'green' : 'red' }}>
                {testResults.api ? '✓ Connected' : '✕ Failed'}
              </span>
            </li>
          </ul>
        ) : (
          <p>Running tests...</p>
        )}
        <button onClick={handleConnectionTest}>Run Tests Again</button>
      </div>

      <div style={{ border: '1px solid #ccc', borderRadius: '4px', padding: '15px' }}>
        <h3>WebSocket Tester</h3>
        <div style={{ marginBottom: '10px' }}>
          <strong>Status:</strong> 
          <span style={{ 
            color: wsStatus === 'connected' ? 'green' : wsStatus === 'error' ? 'red' : 'orange' 
          }}>
            {wsStatus === 'connected' ? '✓ Connected' : wsStatus === 'error' ? '✕ Error' : '⚠ Disconnected'}
          </span>
          {wsStatus !== 'connected' && (
            <button onClick={handleReconnect} style={{ marginLeft: '10px' }}>
              Reconnect
            </button>
          )}
        </div>
        
        {wsError && (
          <div style={{ 
            backgroundColor: '#ffebee', 
            padding: '10px', 
            borderRadius: '4px',
            marginBottom: '10px',
            color: '#c62828'
          }}>
            <strong>Error:</strong> {wsError}
            <div style={{ marginTop: '8px', fontSize: '0.9em' }}>
              <strong>Troubleshooting tips:</strong>
              <ul style={{ marginTop: '5px' }}>
                <li>Check if the WebSocket server is running on port 3001</li>
                <li>Make sure there are no firewall rules blocking the connection</li>
                <li>Try an alternate port (e.g., 3002) if available</li>
                <li>Verify the WebSocket server accepts connections at the "/ws" path</li>
              </ul>
            </div>
          </div>
        )}
        
        <div style={{ marginBottom: '10px' }}>
          <input
            type="text"
            value={messageInput}
            onChange={(e) => setMessageInput(e.target.value)}
            placeholder="Type a message to send"
            style={{ width: '70%', padding: '8px' }}
            disabled={wsStatus !== 'connected'}
            onKeyPress={(e) => e.key === 'Enter' && handleSendMessage()}
          />
          <button 
            onClick={handleSendMessage}
            style={{ marginLeft: '10px', padding: '8px' }}
            disabled={wsStatus !== 'connected'}
          >
            Send
          </button>
        </div>
        
        <div>
          <h4>Message Log:</h4>
          <div style={{ 
            border: '1px solid #eee',
            height: '200px',
            overflowY: 'auto',
            padding: '10px',
            backgroundColor: '#f8f8f8'
          }}>
            {wsMessages.length > 0 ? (
              wsMessages.map((msg, idx) => (
                <div key={idx} style={{ 
                  margin: '5px 0',
                  textAlign: msg.sent ? 'right' : 'left',
                  color: msg.sent ? 'blue' : 'green'
                }}>
                  <small>{msg.time.toLocaleTimeString()}</small>
                  <div style={{ 
                    display: 'inline-block',
                    backgroundColor: msg.sent ? '#dcf8c6' : '#f0f0f0',
                    padding: '5px 10px',
                    borderRadius: '8px'
                  }}>
                    {typeof msg.data === 'string' ? msg.data : JSON.stringify(msg.data)}
                  </div>
                </div>
              ))
            ) : (
              <p style={{ textAlign: 'center', color: '#999' }}>No messages yet</p>
            )}
          </div>
        </div>
      </div>
      
      <div style={{ marginTop: '20px', padding: '15px', backgroundColor: '#f5f5f5', borderRadius: '4px' }}>
        <h3>Manual WebSocket Test</h3>
        <p>
          You can test WebSocket connections directly in your browser's console with this code:
        </p>
        <pre style={{ 
          backgroundColor: '#2d2d2d', 
          color: '#fff', 
          padding: '10px', 
          borderRadius: '4px',
          overflowX: 'auto'
        }}>
{`// Try default connection
const ws = new WebSocket('ws://localhost:3001/ws');
ws.onopen = () => console.log('Connected!');
ws.onclose = (e) => console.log('Closed:', e.code, e.reason);
ws.onerror = (e) => console.error('Error:', e);
ws.onmessage = (e) => console.log('Message:', e.data);

// Or try alternate port
// const ws2 = new WebSocket('ws://localhost:3002/ws');`}
        </pre>
      </div>
    </div>
  );
}
