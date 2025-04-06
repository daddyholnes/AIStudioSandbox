# PowerShell verification script for AIStudioSandbox

Write-Host "=== AIStudioSandbox Verification Tool ===" -ForegroundColor Cyan

# Check if Node.js is installed
try {
    $nodeVersion = node --version
    Write-Host "Node.js detected: $nodeVersion" -ForegroundColor Green
} catch {
    Write-Host "Error: Node.js is not installed or not in PATH" -ForegroundColor Red
    Write-Host "Please install Node.js from https://nodejs.org/" -ForegroundColor Yellow
    exit 1
}

# Function to test WebSocket connection
function Test-WebSocketConnection {
    Write-Host "`n=== Testing WebSocket Connection ===" -ForegroundColor Cyan
    
    Write-Host "Running curl command to test WebSocket connection..."
    
    try {
        # PowerShell-friendly curl command
        curl.exe -i -N -H "Connection: Upgrade" -H "Upgrade: websocket" -H "Sec-WebSocket-Key: dGhlIHNhbXBsZSBub25jZQ==" -H "Sec-WebSocket-Version: 13" http://localhost:3001/ws/collab
        Write-Host "WebSocket connection test complete." -ForegroundColor Green
    } catch {
        Write-Host "Error running WebSocket test: $_" -ForegroundColor Red
    }
}

# Function to test Genkit flow
function Test-GenkitFlow {
    Write-Host "`n=== Testing Genkit API Flow ===" -ForegroundColor Cyan
    
    Write-Host "Running curl command to test Genkit code generation API..."
    
    try {
        # PowerShell-friendly curl command with proper JSON escaping
        curl.exe -X POST http://localhost:3000/api/ai/code -H "Content-Type: application/json" -d "{\"input\":\"Create React counter\"}"
        Write-Host "Genkit API test complete." -ForegroundColor Green
    } catch {
        Write-Host "Error running Genkit API test: $_" -ForegroundColor Red
    }
}

# Function to test feature toggle
function Test-FeatureToggle {
    Write-Host "`n=== Testing Feature Toggle API ===" -ForegroundColor Cyan
    
    Write-Host "Running curl command to test feature toggle API..."
    
    try {
        # PowerShell-friendly curl command with proper JSON escaping
        curl.exe -X POST http://localhost:3000/api/ai/features -H "Content-Type: application/json" -d "{\"genkit\":true}"
        Write-Host "Feature toggle API test complete." -ForegroundColor Green
    } catch {
        Write-Host "Error running feature toggle test: $_" -ForegroundColor Red
    }
}

# Check if servers are running
function Test-ServerStatus {
    Write-Host "`n=== Checking Server Status ===" -ForegroundColor Cyan
    
    # Check WebSocket server
    $wsServerRunning = $false
    try {
        $response = Invoke-WebRequest -Uri "http://localhost:3001" -Method Head -ErrorAction SilentlyContinue
        $wsServerRunning = $true
        Write-Host "WebSocket server is running on port 3001" -ForegroundColor Green
    } catch {
        Write-Host "WebSocket server is not running on port 3001" -ForegroundColor Red
        
        $startServer = Read-Host "Do you want to try starting the WebSocket server? (y/n)"
        if ($startServer -eq "y") {
            Write-Host "Starting WebSocket server..."
            try {
                # Start server in background using PowerShell
                Start-Process -FilePath "node" -ArgumentList "server/websocket.ts" -WindowStyle Hidden
                Write-Host "Waiting for server to start..."
                Start-Sleep -Seconds 3
                $wsServerRunning = $true
            } catch {
                Write-Host "Failed to start WebSocket server: $_" -ForegroundColor Red
            }
        }
    }
    
    # Check API server
    $apiServerRunning = $false
    try {
        $response = Invoke-WebRequest -Uri "http://localhost:3000" -Method Head -ErrorAction SilentlyContinue
        $apiServerRunning = $true
        Write-Host "API server is running on port 3000" -ForegroundColor Green
    } catch {
        Write-Host "API server is not running on port 3000" -ForegroundColor Red
    }
    
    return $wsServerRunning -and $apiServerRunning
}

# Check environment variables
if (-not $env:GEMINI_API_KEY) {
    Write-Host "GEMINI_API_KEY environment variable is not set" -ForegroundColor Yellow
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

# Run verification tests
$serversRunning = Test-ServerStatus
if (-not $serversRunning) {
    Write-Host "Cannot proceed with all tests - servers are not running" -ForegroundColor Red
    $proceed = Read-Host "Do you want to proceed with available tests? (y/n)"
    if ($proceed -ne "y") {
        Write-Host "Verification aborted." -ForegroundColor Yellow
        exit
    }
}

# Run the individual tests
Test-WebSocketConnection
Test-GenkitFlow
Test-FeatureToggle

Write-Host "`n=== Verification Complete ===" -ForegroundColor Cyan
