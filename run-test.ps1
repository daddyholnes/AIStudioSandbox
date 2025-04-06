# PowerShell script to run the Genkit test

Write-Host "=== Genkit Integration Quick Start ===" -ForegroundColor Cyan

# Check if API key is set
if (-not $env:GEMINI_API_KEY) {
    Write-Host "WARNING: GEMINI_API_KEY environment variable is not set" -ForegroundColor Yellow
    Write-Host "Please set your API key by running:" -ForegroundColor Yellow
    Write-Host '$env:GEMINI_API_KEY = "your_actual_key"' -ForegroundColor White
    
    $continue = Read-Host "Continue with test key? (y/n)"
    if ($continue -ne "y") {
        exit
    }
}

# Verify Node.js is installed
try {
    $nodeVersion = node --version
    Write-Host "Node.js detected: $nodeVersion" -ForegroundColor Green
} catch {
    Write-Host "ERROR: Node.js is not installed or not in PATH" -ForegroundColor Red
    Write-Host "Please install Node.js from https://nodejs.org/" -ForegroundColor Red
    exit 1
}

# Run the test
Write-Host "Running Genkit integration test..." -ForegroundColor Green
node test-genkit.js

Write-Host ""
Write-Host "=== COMPLETED ===" -ForegroundColor Cyan
Write-Host ""
Write-Host "If you encountered errors:" -ForegroundColor Yellow
Write-Host "1. Make sure your API key is correct"
Write-Host "2. Check your internet connection"
Write-Host "3. Try reinstalling dependencies: npm install @genkit-ai/core @genkit-ai/googleai"
$env:GEMINI_API_KEY = "your_actual_key"
node test-genkit.js