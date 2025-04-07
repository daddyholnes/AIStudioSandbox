import { execSync } from 'child_process';
import os from 'os';

// Ports to check
const ports = [3000, 3001, 3002, 5173];

console.log('Checking port usage...\n');

// Function to get process details by PID
function getProcessInfo(pid) {
  try {
    if (os.platform() === 'win32') {
      const output = execSync(`tasklist /FI "PID eq ${pid}" /FO CSV /NH`).toString();
      if (output.includes(pid)) {
        return output.split(',')[0].replace(/"/g, '');
      }
    } else {
      return execSync(`ps -p ${pid} -o comm=`).toString().trim();
    }
  } catch (e) {
    return 'Unknown';
  }
  return 'Not found';
}

// Check each port
ports.forEach(port => {
  try {
    console.log(`Checking port ${port}...`);
    
    let command;
    if (os.platform() === 'win32') {
      command = `netstat -ano | findstr :${port}`;
    } else {
      command = `lsof -i :${port} | grep LISTEN`;
    }
    
    const result = execSync(command).toString();
    
    if (result) {
      console.log(`⚠️  Port ${port} is in use:`);
      
      const lines = result.split('\n').filter(Boolean);
      lines.forEach(line => {
        const parts = line.trim().split(/\s+/);
        const pid = os.platform() === 'win32' ? parts[parts.length - 1] : parts[1];
        const processName = getProcessInfo(pid);
        
        console.log(`   - Process: ${processName} (PID: ${pid})`);
      });
    } else {
      console.log(`✓ Port ${port} is available`);
    }
  } catch (e) {
    console.log(`✓ Port ${port} is available`);
  }
  
  console.log('');
});

console.log('Checking network interfaces...');
const interfaces = os.networkInterfaces();
console.log('\nAvailable network addresses:');

Object.keys(interfaces).forEach(iface => {
  interfaces[iface].forEach(details => {
    if (details.family === 'IPv4' && !details.internal) {
      console.log(`- ${iface}: ${details.address}`);
    }
  });
});

console.log('\nTry accessing your application from another device using one of these IPs and port 5173');
console.log('For example: http://<IP_ADDRESS>:5173');
