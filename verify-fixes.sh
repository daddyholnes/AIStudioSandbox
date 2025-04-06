#!/bin/bash

echo "=== Verification Tests ==="

echo "1. Testing WebSocket connection..."
curl -i -N -H "Connection: Upgrade" -H "Upgrade: websocket" \
  -H "Sec-WebSocket-Key: $(openssl rand -base64 16)" \
  -H "Sec-WebSocket-Version: 13" \
  http://localhost:3001/ws/collab

echo -e "\n\n2. Testing Genkit flow..."
curl -X POST http://localhost:3000/api/ai/code \
  -H "Content-Type: application/json" \
  -d '{"input":"Create React counter"}'

echo -e "\n\n=== Tests Complete ==="
