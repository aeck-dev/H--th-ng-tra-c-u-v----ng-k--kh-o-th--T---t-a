# Delete Firebase Users in Batches with retry logic
# More efficient for large numbers of users

Write-Host ""
Write-Host "========================================" -ForegroundColor Cyan
Write-Host "FIREBASE BATCH USER DELETION" -ForegroundColor Cyan
Write-Host "========================================" -ForegroundColor Cyan
Write-Host ""

# Check Firebase CLI
$firebaseCLI = Get-Command firebase -ErrorAction SilentlyContinue
if (-not $firebaseCLI) {
    Write-Host "ERROR: Firebase CLI not installed!" -ForegroundColor Red
    exit 1
}

# Export users
Write-Host "Exporting users..." -ForegroundColor Yellow
$exportFile = "users-export.json"
firebase auth:export $exportFile --project ttkt-aeck-edu-vn 2>&1 | Out-Null

if (-not (Test-Path $exportFile)) {
    Write-Host "ERROR: Cannot export users" -ForegroundColor Red
    exit 1
}

$usersData = Get-Content $exportFile -Raw | ConvertFrom-Json
$totalUsers = $usersData.users.Count

Write-Host "Found $totalUsers users" -ForegroundColor Green
Write-Host ""

# Confirm
$confirmation = Read-Host "Type 'DELETE ALL' to delete all $totalUsers users"
if ($confirmation -ne "DELETE ALL") {
    Write-Host "Cancelled" -ForegroundColor Yellow
    Remove-Item $exportFile -Force
    exit 0
}

Write-Host ""
Write-Host "========================================" -ForegroundColor Cyan
Write-Host "DELETING IN BATCHES..." -ForegroundColor Cyan
Write-Host "========================================" -ForegroundColor Cyan
Write-Host ""

$deletedCount = 0
$errorCount = 0
$batchSize = 10
$delayMs = 500

# Process in batches
for ($i = 0; $i -lt $totalUsers; $i += $batchSize) {
    $batch = $usersData.users[$i..[Math]::Min($i + $batchSize - 1, $totalUsers - 1)]
    
    Write-Host "Processing batch $([Math]::Floor($i/$batchSize) + 1)..." -ForegroundColor Yellow
    
    foreach ($user in $batch) {
        $uid = $user.localId
        $email = if ($user.email) { $user.email } else { "UID:$uid" }
        
        $retryCount = 0
        $maxRetries = 3
        $success = $false
        
        while (-not $success -and $retryCount -lt $maxRetries) {
            try {
                $result = firebase auth:delete $uid --project ttkt-aeck-edu-vn --force 2>&1
                
                if ($LASTEXITCODE -eq 0) {
                    $deletedCount++
                    Write-Host "  OK [$deletedCount/$totalUsers] $email" -ForegroundColor Green
                    $success = $true
                } else {
                    $retryCount++
                    if ($retryCount -lt $maxRetries) {
                        Start-Sleep -Milliseconds ($delayMs * $retryCount)
                    }
                }
            }
            catch {
                $retryCount++
                if ($retryCount -lt $maxRetries) {
                    Start-Sleep -Milliseconds ($delayMs * $retryCount)
                }
            }
        }
        
        if (-not $success) {
            $errorCount++
            Write-Host "  FAIL [$errorCount] $email (after $maxRetries retries)" -ForegroundColor Red
        }
        
        Start-Sleep -Milliseconds 100
    }
    
    # Longer delay between batches
    Start-Sleep -Milliseconds $delayMs
    
    # Progress update
    $progress = [Math]::Round(($deletedCount / $totalUsers) * 100, 1)
    Write-Host "Progress: $progress% ($deletedCount/$totalUsers deleted, $errorCount errors)" -ForegroundColor Cyan
    Write-Host ""
}

# Final results
Write-Host ""
Write-Host "========================================" -ForegroundColor Cyan
Write-Host "COMPLETED!" -ForegroundColor Cyan
Write-Host "========================================" -ForegroundColor Cyan
Write-Host "Deleted: $deletedCount users" -ForegroundColor Green
Write-Host "Errors: $errorCount users" -ForegroundColor Red
Write-Host "Success Rate: $([Math]::Round(($deletedCount/$totalUsers)*100, 1))%" -ForegroundColor Yellow
Write-Host "========================================" -ForegroundColor Cyan
Write-Host ""

# Save failed UIDs if any
if ($errorCount -gt 0) {
    Write-Host "Checking for remaining users..." -ForegroundColor Yellow
    firebase auth:export "users-remaining.json" --project ttkt-aeck-edu-vn 2>&1 | Out-Null
    if (Test-Path "users-remaining.json") {
        $remaining = (Get-Content "users-remaining.json" -Raw | ConvertFrom-Json).users.Count
        Write-Host "Remaining users: $remaining" -ForegroundColor Yellow
        Write-Host "Saved to: users-remaining.json" -ForegroundColor Gray
    }
}

# Cleanup
Remove-Item $exportFile -Force -ErrorAction SilentlyContinue

Write-Host ""
Write-Host "Check Firebase Console to verify:" -ForegroundColor Gray
Write-Host "https://console.firebase.google.com/project/ttkt-aeck-edu-vn/authentication/users" -ForegroundColor Blue
Write-Host ""
