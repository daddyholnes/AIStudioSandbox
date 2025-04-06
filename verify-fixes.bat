@echo off
echo === Verification Tests ===

echo 1. Testing WebSocket connection...
curl -i -N -H "Connection: Upgrade" -H "Upgrade: websocket" ^
  -H "Sec-WebSocket-Key: dGhlIHNhbXBsZSBub25jZQ==" ^
  -H "Sec-WebSocket-Version: 13" ^
  http://localhost:3001/ws/collab

echo.
echo.
echo 2. Testing Genkit flow...
curl -X POST http://localhost:3000/api/ai/code ^
  -H "Content-Type: application/json" ^
  -d "{\"input\":\"Create React counter\"}"

echo.
echo.
echo === Tests Complete ===
