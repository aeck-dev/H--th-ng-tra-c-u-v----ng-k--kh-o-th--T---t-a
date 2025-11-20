# Firebase User Deletion Script
# Project: ttkt-aeck-edu-vn

Write-Host ""
Write-Host "========================================" -ForegroundColor Cyan
Write-Host "FIREBASE USER DELETION TOOL" -ForegroundColor Cyan
Write-Host "========================================" -ForegroundColor Cyan
Write-Host "Project: ttkt-aeck-edu-vn" -ForegroundColor Yellow
Write-Host ""

# Check Firebase CLI
Write-Host "Checking Firebase CLI..." -ForegroundColor Yellow
$firebaseCLI = Get-Command firebase -ErrorAction SilentlyContinue

if (-not $firebaseCLI) {
    Write-Host "ERROR: Firebase CLI not installed!" -ForegroundColor Red
    Write-Host "Install with: npm install -g firebase-tools" -ForegroundColor Yellow
    Write-Host ""
    exit 1
}

Write-Host "OK: Firebase CLI installed" -ForegroundColor Green
Write-Host ""

# Login check
Write-Host "Checking Firebase login..." -ForegroundColor Yellow
firebase login --no-localhost 2>$null
if ($LASTEXITCODE -ne 0) {
    Write-Host "ERROR: Please login to Firebase first" -ForegroundColor Red
    Write-Host ""
    exit 1
}
Write-Host "OK: Logged in to Firebase" -ForegroundColor Green
Write-Host ""

# Export users
Write-Host "Exporting user list..." -ForegroundColor Yellow
$exportFile = "users-export.json"
firebase auth:export $exportFile --project ttkt-aeck-edu-vn 2>&1 | Out-Null

if (-not (Test-Path $exportFile)) {
    Write-Host "ERROR: Cannot export users. Maybe no users exist." -ForegroundColor Red
    Write-Host ""
    exit 1
}

# Parse JSON
$usersData = Get-Content $exportFile -Raw | ConvertFrom-Json
$totalUsers = $usersData.users.Count

Write-Host "OK: Found $totalUsers users" -ForegroundColor Green
Write-Host ""

# Display list
Write-Host "========================================" -ForegroundColor Cyan
Write-Host "USER LIST:" -ForegroundColor Cyan
Write-Host "========================================" -ForegroundColor Cyan
Write-Host ""

$usersData.users | ForEach-Object -Begin { $i = 1 } -Process {
    $email = if ($_.email) { $_.email } else { "No email" }
    $uid = $_.localId
    Write-Host "$i. $email" -ForegroundColor White
    Write-Host "   UID: $uid" -ForegroundColor Gray
    $i++
}

# Confirm deletion
Write-Host ""
Write-Host "========================================" -ForegroundColor Red
Write-Host "WARNING!" -ForegroundColor Red
Write-Host "========================================" -ForegroundColor Red
Write-Host "You are about to DELETE ALL $totalUsers USERS!" -ForegroundColor Red
Write-Host "This action CANNOT BE UNDONE!" -ForegroundColor Red
Write-Host ""

$confirmation = Read-Host "Type 'DELETE ALL' to confirm (or Enter to cancel)"

if ($confirmation -ne "DELETE ALL") {
    Write-Host ""
    Write-Host "Cancelled. Nothing deleted." -ForegroundColor Yellow
    Write-Host ""
    Remove-Item $exportFile -Force
    exit 0
}

# Start deletion
Write-Host ""
Write-Host "========================================" -ForegroundColor Cyan
Write-Host "DELETING USERS..." -ForegroundColor Cyan
Write-Host "========================================" -ForegroundColor Cyan
Write-Host ""

$deletedCount = 0
$errorCount = 0

$usersData.users | ForEach-Object {
    $uid = $_.localId
    $email = if ($_.email) { $_.email } else { $_.phoneNumber }
    
    try {
        firebase auth:delete $uid --project ttkt-aeck-edu-vn --force 2>&1 | Out-Null
        
        if ($LASTEXITCODE -eq 0) {
            $deletedCount++
            Write-Host "OK [$deletedCount/$totalUsers] Deleted: $email" -ForegroundColor Green
        } else {
            $errorCount++
            Write-Host "ERROR [$errorCount] Failed: $email (UID: $uid)" -ForegroundColor Red
        }
    }
    catch {
        $errorCount++
        Write-Host "ERROR [$errorCount] Exception: $email" -ForegroundColor Red
    }
    
    Start-Sleep -Milliseconds 100
}

# Results
Write-Host ""
Write-Host "========================================" -ForegroundColor Cyan
Write-Host "COMPLETED!" -ForegroundColor Cyan
Write-Host "========================================" -ForegroundColor Cyan
Write-Host "Deleted: $deletedCount users" -ForegroundColor Green
Write-Host "Errors: $errorCount users" -ForegroundColor Red
Write-Host "========================================" -ForegroundColor Cyan
Write-Host ""

# Cleanup
Remove-Item $exportFile -Force
Write-Host "Cleanup done. Check Firebase Console to verify." -ForegroundColor Gray
Write-Host ""
