import { useState, useEffect } from 'react';
import { runAllTests, getNetworkInfo, testWebSocketConnection } from '../utils/connectionTester';
import { websocket } from '../utils/websocketClient';

export default function ConnectionDiagnostics() {
  const [testResults, setTestResults] = useState(null);
  const [networkInfo, setNetworkInfo] = useState(null);
  const [wsStatus, setWsStatus] = useState('disconnected');
  const [wsMessages, setWsMessages] = useState([]);
  const [messageInput, setMessageInput] = useState('');

  useEffect(() => {
    // Get network info
    setNetworkInfo(getNetworkInfo());
    
    // Run connection tests
    runAllTests().then(setTestResults);
    
    // Set up WebSocket listeners
    const onOpenUnsubscribe = websocket.onOpen(() => {
      setWsStatus('connected');
    });
    
    const onCloseUnsubscribe = websocket.onClose(() => {
      setWsStatus('disconnected');
    });
    
    const onMessageUnsubscribe = websocket.onMessage((data) => {
      setWsMessages(prev => [...prev, { received: true, data, time: new Date() }].slice(-10));
    });
    
    return () => {
      onOpenUnsubscribe();
      onCloseUnsubscribe();
      onMessageUnsubscribe();
    };
  }, []);
  
  const handleSendMessage = () => {
    if (messageInput.trim()) {
      const success = websocket.send(messageInput);
      if (success) {
        setWsMessages(prev => [...prev, { sent: true, data: messageInput, time: new Date() }].slice(-10));
        setMessageInput('');
      }
    }
  };
  
  const handleConnectionTest = async () => {
    const results = await runAllTests();
    setTestResults(results);
  };
  
  const handleReconnect = () => {
    websocket.connect();
  };

  return (
    <div style={{ maxWidth: '800px', margin: '20px auto', padding: '20px', fontFamily: 'sans-serif' }}>
      <h2>Connection Diagnostics</h2>
      
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
            </li>
            <li>
              <strong>API Server:</strong> 
              <span style={{ color: testResults.api ? 'green' : 'red' }}>
                {testResults.api ? '✓ Connected' : '✕ Failed'}
              </span>
            </li>
          </ul>
        ) : (
          <p>No test results yet</p>
        )}
        <button onClick={handleConnectionTest}>Run Tests Again</button>
      </div>

      <div style={{ border: '1px solid #ccc', borderRadius: '4px', padding: '15px' }}>
        <h3>WebSocket Tester</h3>
        <div style={{ marginBottom: '10px' }}>
          <strong>Status:</strong> 
          <span style={{ color: wsStatus === 'connected' ? 'green' : 'red' }}>
            {wsStatus === 'connected' ? '✓ Connected' : '✕ Disconnected'}
          </span>
          {wsStatus !== 'connected' && (
            <button onClick={handleReconnect} style={{ marginLeft: '10px' }}>
              Reconnect
            </button>
          )}
        </div>
        
        <div style={{ marginBottom: '10px' }}>
          <input
            type="text"
            value={messageInput}
            onChange={(e) => setMessageInput(e.target.value)}
            placeholder="Type a message to send"
            style={{ width: '70%', padding: '8px' }}
            disabled={wsStatus !== 'connected'}
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
    </div>
  );
}
