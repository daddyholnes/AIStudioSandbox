Write-Output "Starting environment fix..."

# Check if Node.js is installed
if (!(Get-Command node -ErrorAction SilentlyContinue)) {
    Write-Error "Node.js is not installed or not in your PATH."
    Write-Output "Please install Node.js from https://nodejs.org/ and try again."
    exit 1
}

# Run the dependency update script
node update-dependencies.js

# Clean installation
Write-Output "Cleaning node_modules and lock files..."
if (Test-Path -Path "node_modules") {
    Remove-Item -Recurse -Force "node_modules"
}
if (Test-Path -Path "package-lock.json") {
    Remove-Item -Force "package-lock.json"
}

# Reinstall dependencies
Write-Output "Reinstalling dependencies..."
if (Get-Command npm -ErrorAction SilentlyContinue) {
    npm install
} else {
    Write-Error "npm is not installed or not in your PATH."
    Write-Output "Please install Node.js (which includes npm) from https://nodejs.org/ and try again."
    exit 1
}

Write-Output "Setup complete! You can now run 'npm run dev' to start the development server."
