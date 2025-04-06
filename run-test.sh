#!/bin/bash
# Simple script to run the Genkit integration test

# Check if Node.js is installed
if ! command -v node &> /dev/null; then
    echo "Error: Node.js is not installed. Please install Node.js 18+ from https://nodejs.org/"
    exit 1
fi

# Check Node.js version
NODE_VERSION=$(node -v | cut -d 'v' -f 2 | cut -d '.' -f 1)
if [ "$NODE_VERSION" -lt 18 ]; then
    echo "Warning: Node.js version $NODE_VERSION detected. This script requires Node.js 18+."
    echo "Please upgrade your Node.js version: https://nodejs.org/"
    exit 1
fi

# Check if npm packages are installed
if [ ! -d "node_modules/@genkit-ai" ]; then
    echo "Installing required dependencies..."
    npm install @genkit-ai/core @genkit-ai/googleai
fi

# Check if GEMINI_API_KEY is set (using this instead of GOOGLE_API_KEY)
if [ -z "$GEMINI_API_KEY" ]; then
    echo "Notice: GEMINI_API_KEY environment variable is not set. Using test key."
    echo "For production use, set your API key with: export GEMINI_API_KEY=your_key_here"
    
    # Add verbose output to help with debugging
    echo "Running with test key..."
fi

# Run the test with more verbose output
echo "===================================================="
echo "Running Genkit integration test..."
echo "===================================================="
node test-genkit.js

# Check exit status
if [ $? -eq 0 ]; then
    echo "===================================================="
    echo "✅ Test completed successfully!"
    echo "===================================================="
else
    echo "===================================================="
    echo "❌ Test failed with errors. Check the output above."
    echo "===================================================="
    exit 1
fi
