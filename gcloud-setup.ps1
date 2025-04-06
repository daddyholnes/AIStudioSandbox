# PowerShell script for Google Cloud CLI authentication and setup

Write-Host "=== Google Cloud CLI Authentication Setup ===" -ForegroundColor Cyan
Write-Host "This script will help you authenticate with Google Cloud and set up your Gemini API project"
Write-Host ""

# Check if gcloud CLI is installed
try {
    $gcloudVersion = gcloud --version | Select-Object -First 1
    Write-Host "Google Cloud CLI detected: $gcloudVersion" -ForegroundColor Green
} catch {
    Write-Host "ERROR: Google Cloud CLI is not installed" -ForegroundColor Red
    Write-Host "Please install Google Cloud CLI from: https://cloud.google.com/sdk/docs/install" -ForegroundColor Yellow
    Write-Host ""
    Write-Host "After installation, return to this script."
    exit 1
}

# Step 1: Authenticate with Google Cloud
Write-Host "Step 1: Authenticating with Google Cloud..." -ForegroundColor Cyan
Write-Host "This will open a browser window for authentication."
Write-Host ""
$continue = Read-Host "Continue? (y/n)"
if ($continue -eq "y") {
    # Run gcloud auth login
    gcloud auth login
} else {
    Write-Host "Authentication skipped. You'll need to authenticate before proceeding with other commands." -ForegroundColor Yellow
}

# Step 2: Create or select a project
Write-Host "Step 2: Configure Google Cloud Project" -ForegroundColor Cyan
$projectAction = Read-Host "Do you want to [c]reate a new project or [s]elect an existing one? (c/s)"

if ($projectAction -eq "c") {
    $projectId = Read-Host "Enter a unique project ID for your new project (lowercase letters, numbers, hyphens)"
    gcloud projects create $projectId
    Write-Host "Project $projectId created." -ForegroundColor Green
    gcloud config set project $projectId
} elseif ($projectAction -eq "s") {
    # List existing projects
    Write-Host "Listing your existing projects..."
    gcloud projects list
    $projectId = Read-Host "Enter the project ID you want to use"
    gcloud config set project $projectId
} else {
    Write-Host "Invalid option. Skipping project configuration." -ForegroundColor Yellow
}

# Step 3: Enable the Gemini API
Write-Host "Step 3: Enable the Gemini API" -ForegroundColor Cyan
$enableApi = Read-Host "Enable the Gemini API for project $projectId? (y/n)"
if ($enableApi -eq "y") {
    gcloud services enable generativelanguage.googleapis.com --project=$projectId
    Write-Host "Gemini API enabled for project $projectId." -ForegroundColor Green
}

# Step 4: Create API key
Write-Host "Step 4: Create API Key" -ForegroundColor Cyan
Write-Host "To create an API key:"
Write-Host "1. Go to: https://console.cloud.google.com/apis/credentials?project=$projectId" -ForegroundColor Yellow
Write-Host "2. Click '+ CREATE CREDENTIALS' and select 'API key'" -ForegroundColor Yellow
Write-Host "3. Copy your new API key" -ForegroundColor Yellow
Write-Host ""
$newKey = Read-Host "Enter your new API key (leave blank to skip)"

if ($newKey) {
    # Set the API key as environment variable
    $env:GEMINI_API_KEY = $newKey
    Write-Host "API key set as environment variable GEMINI_API_KEY." -ForegroundColor Green
    
    # Ask if user wants to save to PowerShell profile
    $saveToProfile = Read-Host "Would you like to save this API key to your PowerShell profile for future sessions? (y/n)"
    if ($saveToProfile -eq "y") {
        Add-Content -Path $PROFILE -Value "`n# Gemini API Key`n`$env:GEMINI_API_KEY = `"$newKey`"`n"
        Write-Host "API key saved to PowerShell profile. It will be available in new PowerShell sessions." -ForegroundColor Green
    }
}

# Step 5: Test the setup
Write-Host "Step 5: Test the setup" -ForegroundColor Cyan
$runTest = Read-Host "Would you like to run the Genkit test script now? (y/n)"
if ($runTest -eq "y") {
    Write-Host "Running Genkit test script..."
    node test-genkit.js
}

Write-Host ""
Write-Host "=== Google Cloud Setup Complete ===" -ForegroundColor Cyan
Write-Host ""
Write-Host "Quick reference for Google Cloud CLI commands:" -ForegroundColor Yellow
Write-Host "- Log in to Google Cloud: gcloud auth login"
Write-Host "- List projects: gcloud projects list" 
Write-Host "- Set active project: gcloud config set project PROJECT_ID"
Write-Host "- Enable Gemini API: gcloud services enable generativelanguage.googleapis.com"
Write-Host "- View API credentials: gcloud alpha services api-keys list"
