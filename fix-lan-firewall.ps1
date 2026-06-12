#Requires -RunAsAdministrator
# Add firewall rules for AR Menu local-network testing

$rules = @(
    @{ Name = 'Next.js LAN 3000 (frontend)'; Port = 3000 }
    @{ Name = 'AR Menu LAN 5000 (backend)';  Port = 5000 }
)

foreach ($r in $rules) {
    $existing = Get-NetFirewallRule -DisplayName $r.Name -ErrorAction SilentlyContinue
    if ($existing) {
        Write-Host "  - already exists: $($r.Name)" -ForegroundColor Yellow
    } else {
        New-NetFirewallRule `
            -DisplayName $r.Name `
            -Direction Inbound `
            -Protocol TCP `
            -LocalPort $r.Port `
            -Action Allow `
            -Profile Any `
            -Enabled True | Out-Null
        Write-Host "  + added: $($r.Name) on port $($r.Port)" -ForegroundColor Green
    }
}

Write-Host ""
Write-Host "Done. Your phone/tablet can now reach this PC on ports 3000 and 5000." -ForegroundColor Cyan
Write-Host "Open http://192.168.31.106:3000 from any device on the same WiFi." -ForegroundColor Cyan
Write-Host ""
pause
