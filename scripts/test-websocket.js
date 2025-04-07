const WebSocket = require('ws');
const readline = require('readline');

const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout
});

console.log('WebSocket Connection Tester\n');

function testConnection(url) {
  console.log(`Attempting to connect to ${url}...`);
  
  const ws = new WebSocket(url);
  
  ws.on('open', () => {
    console.log(`✓ Successfully connected to ${url}`);
    console.log('You can now send messages. Type a message and press Enter to send it.');
    console.log('Type "exit" to close the connection.\n');
    
    rl.on('line', (input) => {
      if (input.toLowerCase() === 'exit') {
        ws.close();
        rl.close();
        return;
      }
      
      try {
        ws.send(input);
        console.log(`Message sent: ${input}`);
      } catch (error) {
        console.error(`Failed to send message: ${error.message}`);
      }
    });
    
    // Send a test message
    setTimeout(() => {
      try {
        ws.send('Test message from client');
        console.log('Test message sent');
      } catch (error) {
        console.error(`Failed to send test message: ${error.message}`);
      }
    }, 1000);
  });
  
  ws.on('message', (data) => {
    console.log(`Message received: ${data}`);
  });
  
  ws.on('error', (error) => {
    console.error(`⚠️  Connection error: ${error.message}`);
    rl.close();
  });
  
  ws.on('close', (code, reason) => {
    console.log(`Connection closed. Code: ${code}, Reason: ${reason || 'No reason provided'}`);
    rl.close();
  });
}

// Ask user for the WebSocket URL or use default
rl.question('Enter WebSocket URL (default: ws://localhost:3001/ws): ', (answer) => {
  const url = answer || 'ws://localhost:3001/ws';
  testConnection(url);
});
