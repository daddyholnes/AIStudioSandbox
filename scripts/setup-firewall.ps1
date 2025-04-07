# Script to create Windows Firewall rules for development servers

# Check if running as administrator
if (-NOT ([Security.Principal.WindowsPrincipal][Security.Principal.WindowsIdentity]::GetCurrent()).IsInRole([Security.Principal.WindowsBuiltInRole] "Administrator")) {
    Write-Warning "Please run this script as Administrator"
    exit
}

# Create firewall rules
try {
    # Rule for Vite Dev Server
    New-NetFirewallRule -DisplayName "Allow Vite Dev Server" -Direction Inbound -LocalPort 5173 -Protocol TCP -Action Allow -ErrorAction Stop
    Write-Host "Successfully created firewall rule for Vite Dev Server (port 5173)" -ForegroundColor Green
    
    # Rule for WebSocket Server
    New-NetFirewallRule -DisplayName "Allow WebSocket Server" -Direction Inbound -LocalPort 3001,3002 -Protocol TCP -Action Allow -ErrorAction Stop
    Write-Host "Successfully created firewall rule for WebSocket Server (ports 3001, 3002)" -ForegroundColor Green
    
    # Rule for API Server
    New-NetFirewallRule -DisplayName "Allow API Server" -Direction Inbound -LocalPort 3000 -Protocol TCP -Action Allow -ErrorAction Stop
    Write-Host "Successfully created firewall rule for API Server (port 3000)" -ForegroundColor Green
} 
catch {
    Write-Error "Failed to create firewall rules: $_"
}
