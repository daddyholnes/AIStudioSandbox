$ErrorActionPreference = "Stop"

function Test-Port($port) {
    try { 
        $socket = New-Object System.Net.Sockets.TcpClient('localhost', $port)
        $socket.Close()
        return $true
    } catch { return $false }
}

Write-Host "=== AIStudioSandbox Verification Tool ===" -ForegroundColor Cyan

# Check Node.js
if (-not (Get-Command node -ErrorAction SilentlyContinue)) {
    Write-Host "Node.js not found! Please install Node.js 18+" -ForegroundColor Red
    exit 1
} else {
    $nodeVersion = node --version
    Write-Host "Node.js detected: $nodeVersion" -ForegroundColor Green
}

# Check environment variable
if (-not $env:GEMINI_API_KEY) {
    Write-Host "GEMINI_API_KEY environment variable not set!" -ForegroundColor Yellow
    $setKey = Read-Host "Do you want to set the GEMINI_API_KEY now? (y/n)"
    
    if ($setKey -eq "y") {
        $apiKey = Read-Host "Enter your Gemini API key"
        $env:GEMINI_API_KEY = $apiKey
        Write-Host "API key set for this session" -ForegroundColor Green
    } else {
        Write-Host "Continuing without API key - some tests may fail" -ForegroundColor Yellow
    }
} else {
    Write-Host "GEMINI_API_KEY environment variable is set" -ForegroundColor Green
}

# Start servers if not running
if (-not (Test-Port 3001)) {
    Write-Host "WebSocket server not running. Starting server..." -ForegroundColor Yellow
    Start-Process -NoNewWindow -FilePath "node" -ArgumentList "server/websocket.ts"
    Write-Host "Waiting for WebSocket server to start..." -ForegroundColor Yellow
    Start-Sleep -Seconds 2
    
    if (Test-Port 3001) {
        Write-Host "WebSocket server started successfully!" -ForegroundColor Green
    } else {
        Write-Host "Failed to start WebSocket server" -ForegroundColor Red
    }
} else {
    Write-Host "WebSocket server is already running on port 3001" -ForegroundColor Green
}

if (-not (Test-Port 3000)) {
    Write-Host "API server not running. Starting server..." -ForegroundColor Yellow
    Start-Process -NoNewWindow -FilePath "npm" -ArgumentList "run start"
    Write-Host "Waiting for API server to start..." -ForegroundColor Yellow
    Start-Sleep -Seconds 5
    
    if (Test-Port 3000) {
        Write-Host "API server started successfully!" -ForegroundColor Green
    } else {
        Write-Host "Failed to start API server" -ForegroundColor Red
    }
} else {
    Write-Host "API server is already running on port 3000" -ForegroundColor Green
}

# Run tests
if ((Test-Port 3000) -and (Test-Port 3001)) {
    Write-Host "`n=== Running Tests ===" -ForegroundColor Cyan
    
    # Run Genkit integration test
    Write-Host "`n=== Testing Genkit Integration ===" -ForegroundColor Cyan
    node test-genkit.js
    
    # Test WebSocket Connection
    Write-Host "`n=== Testing WebSocket Connection ===" -ForegroundColor Cyan
    Write-Host "Running curl command to test WebSocket connection..."
    
    try {
        # PowerShell-friendly curl command
        curl.exe -i -N -H "Connection: Upgrade" -H "Upgrade: websocket" -H "Sec-WebSocket-Key: dGhlIHNhbXBsZSBub25jZQ==" -H "Sec-WebSocket-Version: 13" http://localhost:3001/ws/collab
        Write-Host "WebSocket connection test complete." -ForegroundColor Green
    } catch {
        Write-Host "Error running WebSocket test: $_" -ForegroundColor Red
    }
    
    # Test API endpoints
    Write-Host "`n=== Testing API Endpoints ===" -ForegroundColor Cyan
    try {
        # Test basic API endpoint
        $response = Invoke-WebRequest -Uri "http://localhost:3000" -ErrorAction SilentlyContinue
        Write-Host "API server root endpoint: $($response.StatusCode) $($response.StatusDescription)" -ForegroundColor Green
    } catch {
        Write-Host "Error testing API endpoint: $_" -ForegroundColor Red
    }
    
    Write-Host "`n=== Verification Complete ===" -ForegroundColor Cyan
    Write-Host "Servers are running and ready for development" -ForegroundColor Green
} else {
    Write-Host "Unable to start required servers" -ForegroundColor Red
}
