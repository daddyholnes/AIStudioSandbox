# Clean existing installation
Write-Host "Cleaning existing installation..." -ForegroundColor Green
Remove-Item -Path "node_modules" -Recurse -Force -ErrorAction SilentlyContinue
Remove-Item -Path "package-lock.json" -Force -ErrorAction SilentlyContinue

# Install dependencies
Write-Host "Installing dependencies..." -ForegroundColor Green
npm install --save-exact @esbuild/win32-x64@0.19.2
npm install @xterm/xterm@5.3.0 @xterm/addon-fit@0.8.0

# Install global tools if not already installed
Write-Host "Installing required tools..." -ForegroundColor Green
if (-not (Get-Command yarn -ErrorAction SilentlyContinue)) {
    npm install -g yarn
}
if (-not (Get-Command concurrently -ErrorAction SilentlyContinue)) {
    npm install -g concurrently
}

# Reinstall all dependencies with yarn for better resolution
Write-Host "Reinstalling all dependencies with Yarn..." -ForegroundColor Green
yarn install --ignore-optional

# Verify installation
Write-Host "Setup complete! Run 'yarn dev' to start the application" -ForegroundColor Green
```

To run this script, open a PowerShell terminal and execute:
.\fix-dependencies.ps1
