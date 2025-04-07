#!/bin/bash

echo "Starting environment fix..."

# Check if Node.js is installed
if ! command -v node &> /dev/null; then
    echo "Error: Node.js is not installed or not in your PATH."
    echo "Please install Node.js from https://nodejs.org/ and try again."
    exit 1
fi

# Run the dependency update script
node update-dependencies.js

# Clean installation
echo "Cleaning node_modules and lock files..."
rm -rf node_modules package-lock.json

# Reinstall dependencies
echo "Reinstalling dependencies..."
if command -v npm &> /dev/null; then
    npm install
else
    echo "Error: npm is not installed or not in your PATH."
    echo "Please install Node.js (which includes npm) from https://nodejs.org/ and try again."
    exit 1
fi

echo "Setup complete! You can now run 'npm run dev' to start the development server."
