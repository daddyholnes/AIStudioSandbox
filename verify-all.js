const { spawn, exec } = require('child_process');
const http = require('http');
const WebSocket = require('ws');
const readline = require('readline');
const fs = require('fs');

// ANSI color codes for console output
const colors = {
  reset: '\x1b[0m',
  green: '\x1b[32m',
  red: '\x1b[31m',
  yellow: '\x1b[33m',
  blue: '\x1b[36m',
  bold: '\x1b[1m'
};

// Create readline interface for user input
const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout
});

// Helper for formatted logging
const log = {
  info: (msg) => console.log(`${colors.blue}${msg}${colors.reset}`),
  success: (msg) => console.log(`${colors.green}✓ ${msg}${colors.reset}`),
  error: (msg) => console.log(`${colors.red}✗ ${msg}${colors.reset}`),
  warning: (msg) => console.log(`${colors.yellow}! ${msg}${colors.reset}`),
  header: (msg) => console.log(`\n${colors.bold}${colors.blue}=== ${msg} ===${colors.reset}\n`)
};

// Run a command and return its output as a promise
function runCommand(command, args = []) {
  return new Promise((resolve, reject) => {
    const proc = spawn(command, args, { shell: true });
    let output = '';
    let errorOutput = '';

    proc.stdout.on('data', (data) => {
      output += data.toString();
      process.stdout.write(data.toString());
    });

    proc.stderr.on('data', (data) => {
      errorOutput += data.toString();
      process.stderr.write(data.toString());
    });

    proc.on('close', (code) => {
      if (code === 0) {
        resolve(output);
      } else {
        reject(new Error(`Command failed with code ${code}: ${errorOutput}`));
      }
    });
  });
}

// Prompt the user for input
function prompt(question) {
  return new Promise((resolve) => {
    rl.question(`${colors.yellow}${question}${colors.reset}`, (answer) => {
      resolve(answer);
    });
  });
}

// Test WebSocket connection
async function testWebSocketConnection() {
  log.header('Testing WebSocket Connection');
  
  log.info('Attempting to connect to WebSocket server...');
  
  return new Promise((resolve) => {
    try {
      const ws = new WebSocket('ws://localhost:3001/ws/collab');
      
      ws.on('open', () => {
        log.success('WebSocket connection established successfully');
        ws.send(JSON.stringify({ type: 'test', message: 'Hello WebSocket Server' }));
        
        setTimeout(() => {
          ws.close();
          resolve(true);
        }, 2000);
      });
      
      ws.on('message', (data) => {
        const message = data.toString();
        log.info(`Received message from server: ${message}`);
      });
      
      ws.on('error', (error) => {
        log.error(`WebSocket connection failed: ${error.message}`);
        resolve(false);
      });
      
      // Timeout after 5 seconds
      setTimeout(() => {
        if (ws.readyState !== WebSocket.OPEN) {
          log.error('WebSocket connection timed out');
          resolve(false);
        }
      }, 5000);
    } catch (error) {
      log.error(`Failed to create WebSocket connection: ${error.message}`);
      resolve(false);
    }
  });
}

// Test Genkit API endpoint
async function testGenkitFlow() {
  log.header('Testing Genkit API Flow');
  
  log.info('Sending request to code generation API...');
  
  return new Promise((resolve) => {
    const options = {
      hostname: 'localhost',
      port: 3000,
      path: '/api/ai/code',
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      }
    };
    
    const req = http.request(options, (res) => {
      let data = '';
      
      res.on('data', (chunk) => {
        data += chunk;
      });
      
      res.on('end', () => {
        if (res.statusCode === 200) {
          log.success(`API responded with status ${res.statusCode}`);
          try {
            const jsonResponse = JSON.parse(data);
            log.info('Response:');
            console.log(JSON.stringify(jsonResponse, null, 2));
            resolve(true);
          } catch (e) {
            log.warning(`Response is not valid JSON: ${data}`);
            resolve(false);
          }
        } else {
          log.error(`API responded with status ${res.statusCode}: ${data}`);
          resolve(false);
        }
      });
    });
    
    req.on('error', (error) => {
      log.error(`Request failed: ${error.message}`);
      resolve(false);
    });
    
    const postData = JSON.stringify({ input: 'Create React counter' });
    req.write(postData);
    req.end();
  });
}

// Test feature toggle synchronization
async function testFeatureToggle() {
  log.header('Testing Feature Toggle API');
  
  log.info('Sending request to feature toggle API...');
  
  return new Promise((resolve) => {
    const options = {
      hostname: 'localhost',
      port: 3000,
      path: '/api/ai/features',
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      }
    };
    
    const req = http.request(options, (res) => {
      let data = '';
      
      res.on('data', (chunk) => {
        data += chunk;
      });
      
      res.on('end', () => {
        if (res.statusCode === 200) {
          log.success(`API responded with status ${res.statusCode}`);
          try {
            const jsonResponse = JSON.parse(data);
            log.info('Response:');
            console.log(JSON.stringify(jsonResponse, null, 2));
            resolve(true);
          } catch (e) {
            log.warning(`Response is not valid JSON: ${data}`);
            resolve(false);
          }
        } else {
          log.error(`API responded with status ${res.statusCode}: ${data}`);
          resolve(false);
        }
      });
    });
    
    req.on('error', (error) => {
      log.error(`Request failed: ${error.message}`);
      resolve(false);
    });
    
    const postData = JSON.stringify({ genkit: true });
    req.write(postData);
    req.end();
  });
}

// Check if servers are running
async function checkServersRunning() {
  log.header('Checking Server Status');
  
  // Check if WebSocket server is running
  try {
    await new Promise((resolve, reject) => {
      const req = http.get('http://localhost:3001', () => {
        resolve();
      });
      
      req.on('error', (err) => {
        if (err.code === 'ECONNREFUSED') {
          reject(new Error('WebSocket server is not running on port 3001'));
        } else {
          reject(err);
        }
      });
      
      req.end();
    });
    
    log.success('WebSocket server is running on port 3001');
  } catch (error) {
    log.error(`WebSocket server check failed: ${error.message}`);
    log.info('You need to start the WebSocket server before running tests.');
    
    const startServer = await prompt('Do you want to try starting the WebSocket server? (y/n): ');
    if (startServer.toLowerCase() === 'y') {
      try {
        log.info('Starting WebSocket server...');
        // Start server in background
        const serverProcess = spawn('node', ['server/websocket.ts'], {
          detached: true,
          stdio: 'ignore'
        });
        serverProcess.unref();
        log.info('Waiting for server to start...');
        await new Promise(resolve => setTimeout(resolve, 3000));
      } catch (e) {
        log.error(`Failed to start WebSocket server: ${e.message}`);
        return false;
      }
    } else {
      return false;
    }
  }
  
  // Check if API server is running
  try {
    await new Promise((resolve, reject) => {
      const req = http.get('http://localhost:3000', () => {
        resolve();
      });
      
      req.on('error', (err) => {
        if (err.code === 'ECONNREFUSED') {
          reject(new Error('API server is not running on port 3000'));
        } else {
          reject(err);
        }
      });
      
      req.end();
    });
    
    log.success('API server is running on port 3000');
  } catch (error) {
    log.error(`API server check failed: ${error.message}`);
    log.info('You need to start the API server before running tests.');
    return false;
  }
  
  return true;
}

// Main function to run all tests
async function runAllTests() {
  log.header('AIStudioSandbox Verification Suite');
  
  // Check environment variables
  if (!process.env.GEMINI_API_KEY) {
    log.warning('GEMINI_API_KEY environment variable is not set');
    const setKey = await prompt('Do you want to set the GEMINI_API_KEY now? (y/n): ');
    
    if (setKey.toLowerCase() === 'y') {
      const apiKey = await prompt('Enter your Gemini API key: ');
      process.env.GEMINI_API_KEY = apiKey;
      log.success('API key set for this session');
    } else {
      log.warning('Continuing without API key - some tests may fail');
    }
  } else {
    log.success('GEMINI_API_KEY environment variable is set');
  }
  
  // Check if servers are running
  const serversRunning = await checkServersRunning();
  if (!serversRunning) {
    log.error('Cannot proceed with tests - servers are not running');
    rl.close();
    return;
  }
  
  // Run WebSocket test
  const wsResult = await testWebSocketConnection();
  
  // Run Genkit flow test
  const genkitResult = await testGenkitFlow();
  
  // Run feature toggle test
  const featureResult = await testFeatureToggle();
  
  // Show summary
  log.header('Test Results Summary');
  console.log(`WebSocket Connection: ${wsResult ? colors.green + 'PASSED' : colors.red + 'FAILED'}${colors.reset}`);
  console.log(`Genkit Flow API: ${genkitResult ? colors.green + 'PASSED' : colors.red + 'FAILED'}${colors.reset}`);
  console.log(`Feature Toggle API: ${featureResult ? colors.green + 'PASSED' : colors.red + 'FAILED'}${colors.reset}`);
  
  rl.close();
}

// Run all tests
runAllTests();
