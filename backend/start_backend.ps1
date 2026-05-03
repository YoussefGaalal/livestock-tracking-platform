$ErrorActionPreference = "Continue"
$psi = New-Object System.Diagnostics.ProcessStartInfo
$psi.FileName = "C:\php82\php.exe"
$psi.Arguments = "-d memory_limit=512M -S 127.0.0.1:8050 -t C:\animal-tracking-system-head\backend\public"
$psi.UseShellExecute = $false
$psi.RedirectStandardOutput = $true
$psi.RedirectStandardError = $true
$process = [System.Diagnostics.Process]::Start($psi)
Write-Host "PHP started with PID: $($process.Id)"
Start-Sleep 3