# Run this script as Administrator

# Add firewall rules for development servers
New-NetFirewallRule -DisplayName "Allow Vite Dev Server" -Direction Inbound -LocalPort 5173 -Protocol TCP -Action Allow
New-NetFirewallRule -DisplayName "Allow WebSocket Server" -Direction Inbound -LocalPort 3001 -Protocol TCP -Action Allow
New-NetFirewallRule -DisplayName "Allow API Server" -Direction Inbound -LocalPort 3000 -Protocol TCP -Action Allow

Write-Host "Firewall rules added successfully for ports 3000, 3001, and 5173."
