# FASTEST WAY: Use Firebase CLI with empty import to delete all users
# This is much faster than deleting one by one

Write-Host ""
Write-Host "========================================" -ForegroundColor Cyan
Write-Host "FASTEST FIREBASE USER DELETION METHOD" -ForegroundColor Cyan
Write-Host "========================================" -ForegroundColor Cyan
Write-Host ""

Write-Host "This method will:" -ForegroundColor Yellow
Write-Host "1. Export current users (backup)" -ForegroundColor White
Write-Host "2. Create empty user file" -ForegroundColor White
Write-Host "3. Import empty file (deletes all users)" -ForegroundColor White
Write-Host ""

# Backup first
Write-Host "Step 1: Backing up current users..." -ForegroundColor Yellow
firebase auth:export users-backup-$(Get-Date -Format 'yyyyMMdd-HHmmss').json --project ttkt-aeck-edu-vn

# Get count
$backupFiles = Get-ChildItem "users-backup-*.json" | Sort-Object LastWriteTime -Descending | Select-Object -First 1
if ($backupFiles) {
    $userData = Get-Content $backupFiles.FullName -Raw | ConvertFrom-Json
    $totalUsers = $userData.users.Count
    Write-Host "OK: Backed up $totalUsers users to $($backupFiles.Name)" -ForegroundColor Green
} else {
    Write-Host "ERROR: Backup failed" -ForegroundColor Red
    exit 1
}

Write-Host ""
Write-Host "WARNING: About to delete ALL $totalUsers users!" -ForegroundColor Red
$confirm = Read-Host "Type 'DELETE ALL' to continue"

if ($confirm -ne "DELETE ALL") {
    Write-Host "Cancelled" -ForegroundColor Yellow
    exit 0
}

Write-Host ""
Write-Host "Step 2: Creating empty user file..." -ForegroundColor Yellow
$emptyData = @{
    users = @()
} | ConvertTo-Json

Set-Content -Path "empty-users.json" -Value $emptyData
Write-Host "OK: Created empty-users.json" -ForegroundColor Green

Write-Host ""
Write-Host "Step 3: Importing empty file (this deletes all users)..." -ForegroundColor Yellow
Write-Host "Note: This may take a few minutes..." -ForegroundColor Gray
Write-Host ""

# Import empty file - this is MUCH faster than individual deletes
firebase auth:import empty-users.json --project ttkt-aeck-edu-vn --hash-algo=SCRYPT 2>&1

if ($LASTEXITCODE -eq 0) {
    Write-Host ""
    Write-Host "========================================" -ForegroundColor Green
    Write-Host "SUCCESS!" -ForegroundColor Green
    Write-Host "========================================" -ForegroundColor Green
    Write-Host "All users have been deleted!" -ForegroundColor Green
    Write-Host ""
} else {
    Write-Host ""
    Write-Host "ERROR: Import failed" -ForegroundColor Red
    Write-Host "Trying alternative method..." -ForegroundColor Yellow
    Write-Host ""
    
    # Alternative: Delete via Firebase Console instructions
    Write-Host "Please use Firebase Console instead:" -ForegroundColor Yellow
    Write-Host "1. Go to: https://console.firebase.google.com/project/ttkt-aeck-edu-vn/authentication/users" -ForegroundColor White
    Write-Host "2. Select all users (checkbox at top)" -ForegroundColor White
    Write-Host "3. Click 'Delete selected users'" -ForegroundColor White
    Write-Host ""
}

# Cleanup
Remove-Item "empty-users.json" -Force -ErrorAction SilentlyContinue

Write-Host "Backup saved at: $($backupFiles.FullName)" -ForegroundColor Gray
Write-Host ""
Write-Host "Verify at: https://console.firebase.google.com/project/ttkt-aeck-edu-vn/authentication/users" -ForegroundColor Blue
Write-Host ""
