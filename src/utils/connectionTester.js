/**
 * Connection Tester - Help diagnose connectivity issues
 */

// Test HTTP connection to Vite dev server
export async function testViteConnection() {
  console.log('Testing connection to Vite dev server...');
  
  try {
    const response = await fetch('/');
    if (response.ok) {
      console.log('✓ Successfully connected to Vite server');
      return true;
    } else {
      console.error(`✕ Failed to connect to Vite server: ${response.status} ${response.statusText}`);
      return false;
    }
  } catch (error) {
    console.error('✕ Error connecting to Vite server:', error);
    return false;
  }
}

// Test WebSocket connection
export function testWebSocketConnection(url = null) {
  const wsUrl = url || buildWebSocketUrl();
  console.log(`Testing WebSocket connection to ${wsUrl}...`);
  
  return new Promise((resolve) => {
    try {
      const ws = new WebSocket(wsUrl);
      
      ws.onopen = () => {
        console.log(`✓ Successfully connected to WebSocket at ${wsUrl}`);
        ws.close();
        resolve(true);
      };
      
      ws.onerror = (error) => {
        console.error(`✕ Error connecting to WebSocket at ${wsUrl}:`, error);
        resolve(false);
      };
      
      // Set a timeout
      setTimeout(() => {
        if (ws.readyState !== WebSocket.OPEN) {
          console.error(`✕ WebSocket connection timed out at ${wsUrl}`);
          ws.close();
          resolve(false);
        }
      }, 5000);
    } catch (error) {
      console.error('✕ Error creating WebSocket connection:', error);
      resolve(false);
    }
  });
}

// Test API connection
export async function testApiConnection(endpoint = '/api/health') {
  console.log(`Testing API connection to ${endpoint}...`);
  
  try {
    const response = await fetch(endpoint);
    if (response.ok) {
      const data = await response.json();
      console.log(`✓ Successfully connected to API: ${JSON.stringify(data)}`);
      return true;
    } else {
      console.error(`✕ Failed to connect to API: ${response.status} ${response.statusText}`);
      return false;
    }
  } catch (error) {
    console.error('✕ Error connecting to API:', error);
    return false;
  }
}

// Network information
export function getNetworkInfo() {
  const info = {
    url: window.location.href,
    protocol: window.location.protocol,
    hostname: window.location.hostname,
    port: window.location.port,
    pathname: window.location.pathname,
    userAgent: navigator.userAgent
  };
  
  console.log('Network information:', info);
  return info;
}

// Helper function to build WebSocket URL
export function buildWebSocketUrl() {
  const protocol = window.location.protocol === 'https:' ? 'wss' : 'ws';
  const hostname = window.location.hostname;
  return `${protocol}://${hostname}:3001/ws`;
}

// Run all tests
export async function runAllTests() {
  console.log('=== Starting Connection Tests ===');
  
  getNetworkInfo();
  
  const viteResult = await testViteConnection();
  const wsResult = await testWebSocketConnection();
  const apiResult = await testApiConnection();
  
  console.log('=== Connection Test Results ===');
  console.log(`Vite Server: ${viteResult ? '✓ Connected' : '✕ Failed'}`);
  console.log(`WebSocket Server: ${wsResult ? '✓ Connected' : '✕ Failed'}`);
  console.log(`API Server: ${apiResult ? '✓ Connected' : '✕ Failed'}`);
  
  return {
    vite: viteResult,
    websocket: wsResult,
    api: apiResult
  };
}
