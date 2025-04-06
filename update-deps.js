#!/usr/bin/env node

import { execSync } from 'child_process';
import fs from 'fs';

// ANSI color codes for better output
const colors = {
  reset: '\x1b[0m',
  green: '\x1b[32m',
  yellow: '\x1b[33m',
  red: '\x1b[31m',
  blue: '\x1b[34m'
};

console.log(`${colors.blue}Starting dependency update process...${colors.reset}`);

// Function to run commands safely
function runCommand(command) {
  try {
    console.log(`${colors.yellow}Running: ${command}${colors.reset}`);
    execSync(command, { stdio: 'inherit' });
    return true;
  } catch (error) {
    console.error(`${colors.red}Failed to execute: ${command}${colors.reset}`);
    console.error(error.message);
    return false;
  }
}

// Step 1: Update esbuild for the critical security vulnerability
console.log(`\n${colors.blue}Step 1: Updating esbuild to fix GHSA-67mh-4wv8-2f99 vulnerability${colors.reset}`);
runCommand('npm update esbuild@latest --depth 10');

// Step 2: Update prismjs for the security vulnerability
console.log(`\n${colors.blue}Step 2: Updating prismjs to fix GHSA-x7hr-w5r2-h6wg vulnerability${colors.reset}`);
runCommand('npm update prismjs@latest react-syntax-highlighter@latest --legacy-peer-deps');

// Step 3: Replace deprecated xterm packages
console.log(`\n${colors.blue}Step 3: Replacing deprecated xterm packages${colors.reset}`);
runCommand('npm uninstall xterm xterm-addon-fit');
runCommand('npm install @xterm/xterm@latest @xterm/addon-fit@latest');

// Step 4: Update esbuild-kit dependencies
console.log(`\n${colors.blue}Step 4: Updating esbuild-kit dependencies${colors.reset}`);
runCommand('npm uninstall @esbuild-kit/core-utils @esbuild-kit/esm-loader');
runCommand('npm install tsx@latest');

// Step 5: Run controlled audit fix
console.log(`\n${colors.blue}Step 5: Running controlled audit fix${colors.reset}`);
runCommand('npm audit fix');

// Step 6: Disable fund messages
console.log(`\n${colors.blue}Step 6: Disabling fund messages${colors.reset}`);
runCommand('npm config set fund false --location=project');

// Step 7: Final verification
console.log(`\n${colors.blue}Step 7: Running final verification${colors.reset}`);
runCommand('npm ls @xterm/xterm @xterm/addon-fit tsx vite drizzle-kit react-syntax-highlighter');

console.log(`\n${colors.green}Dependency update process completed!${colors.reset}`);
console.log(`\n${colors.yellow}Next steps:${colors.reset}`);
console.log(`1. Run 'node test-genkit.js' to verify Genkit integration`);
console.log(`2. Check for any remaining warnings with 'npm audit'`);
console.log(`3. Test your application to ensure everything works as expected`);
