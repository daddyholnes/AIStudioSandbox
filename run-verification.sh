#!/bin/bash

echo "=== AIStudioSandbox Verification Tool ==="
echo

# Check if Node.js is installed
if ! command -v node &> /dev/null; then
  echo "Error: Node.js is not installed or not in PATH"
  echo "Please install Node.js from https://nodejs.org/"
  exit 1
fi

# Run the verification script
echo "Running verification tests..."
echo
node verify-all.js

echo
echo "=== Verification Complete ==="
