#!/bin/bash

echo "=== Updating dependencies ==="
echo "Uninstalling deprecated packages..."
npm uninstall xterm xterm-addon-fit @esbuild-kit/core-utils

echo "Installing modern replacements..."
npm install @xterm/xterm@latest @xterm/addon-fit@latest tsx

echo "Updating packages with security fixes..."
npm update esbuild prismjs --legacy-peer-deps

echo "Running security audit..."
npm audit

echo "=== Dependency update complete ==="
