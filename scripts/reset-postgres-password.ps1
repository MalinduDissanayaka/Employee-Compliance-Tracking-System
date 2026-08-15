# One-time recovery script: resets the local 'postgres' superuser password
# when it's been forgotten. Run this in an ELEVATED PowerShell (Run as
# Administrator) — it needs to restart the PostgreSQL Windows service.
#
# What it does:
#   1. Backs up pg_hba.conf
#   2. Temporarily switches local/host auth to "trust" (no password needed)
#   3. Restarts the service so the change takes effect
#   4. Sets the postgres user's password to the value below
#   5. Restores the original pg_hba.conf (back to scram-sha-256)
#   6. Restarts the service again to re-lock it down
#
# Safe to delete after running once.

$ErrorActionPreference = "Stop"

$PgVersion = "16"
$PgHome = "C:\Program Files\PostgreSQL\$PgVersion"
$PgData = "$PgHome\data"
$HbaFile = "$PgData\pg_hba.conf"
$HbaBackup = "$PgData\pg_hba.conf.bak"
$ServiceName = "postgresql-x64-$PgVersion"
$Psql = "$PgHome\bin\psql.exe"

# Change this if you'd rather set a different password than "postgres"
# (must then also update backend\.env and scheduler\.env to match).
$NewPassword = "postgres"

if (-not ([Security.Principal.WindowsPrincipal][Security.Principal.WindowsIdentity]::GetCurrent()).IsInRole([Security.Principal.WindowsBuiltInRole]::Administrator)) {
    Write-Error "This script must be run as Administrator (needed to restart the PostgreSQL service)."
    exit 1
}

Write-Host "Backing up pg_hba.conf..."
Copy-Item $HbaFile $HbaBackup -Force

Write-Host "Switching local auth to 'trust' temporarily..."
(Get-Content $HbaFile) | ForEach-Object {
    if ($_ -match '^\s*(local|host)\s+all\s+all\s') {
        ($_ -replace 'scram-sha-256', 'trust') -replace 'md5', 'trust'
    } else {
        $_
    }
} | Set-Content $HbaFile

Write-Host "Restarting PostgreSQL service..."
Restart-Service -Name $ServiceName -Force
Start-Sleep -Seconds 3

Write-Host "Setting new password for 'postgres' user..."
$env:PGPASSWORD = ""
& $Psql -U postgres -h 127.0.0.1 -c "ALTER USER postgres WITH PASSWORD '$NewPassword';"

Write-Host "Restoring original pg_hba.conf..."
Copy-Item $HbaBackup $HbaFile -Force
Remove-Item $HbaBackup

Write-Host "Restarting PostgreSQL service to re-lock authentication..."
Restart-Service -Name $ServiceName -Force
Start-Sleep -Seconds 3

Write-Host ""
Write-Host "Done. The 'postgres' user's password is now: $NewPassword"
Write-Host "This matches what's already in backend\.env and scheduler\.env, so no further edits needed."
