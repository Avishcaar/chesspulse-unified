# Pre-Flight Deployment Checker for ChessPulse Unified
param (
    [string]$ProjectRoot = (Resolve-Path "$PSScriptRoot\..\..\..\..").Path
)

Write-Host "==========================================================" -ForegroundColor Cyan
Write-Host "  ChessPulse Unified: Render Pre-Flight Deployment Check  " -ForegroundColor Cyan
Write-Host "==========================================================" -ForegroundColor Cyan
Write-Host "Checking Project Root: $ProjectRoot`n"

$allPassed = $true

# 1. Check Node.js
try {
    $nodeVer = node --version
    Write-Host "[PASS] Node.js is installed ($nodeVer)" -ForegroundColor Green
} catch {
    Write-Host "[FAIL] Node.js is not found in PATH" -ForegroundColor Red
    $allPassed = $false
}

# 2. Check render.yaml
$renderYamlPath = Join-Path $ProjectRoot "render.yaml"
if (Test-Path $renderYamlPath) {
    Write-Host "[PASS] render.yaml exists" -ForegroundColor Green
} else {
    Write-Host "[FAIL] render.yaml missing at root" -ForegroundColor Red
    $allPassed = $false
}

# 3. Check backend/server.js
$serverJsPath = Join-Path $ProjectRoot "backend\server.js"
if (Test-Path $serverJsPath) {
    Write-Host "[PASS] backend/server.js exists" -ForegroundColor Green
} else {
    Write-Host "[FAIL] backend/server.js missing" -ForegroundColor Red
    $allPassed = $false
}

# 4. Check frontend build
$distPath = Join-Path $ProjectRoot "frontend\dist"
$indexPath = Join-Path $distPath "index.html"
$stockfishWasm = Join-Path $distPath "stockfish.wasm"

if ((Test-Path $indexPath) -and (Test-Path $stockfishWasm)) {
    Write-Host "[PASS] frontend/dist is compiled with Stockfish WASM and index.html" -ForegroundColor Green
} else {
    Write-Host "[WARN] frontend/dist not found. Testing build script..." -ForegroundColor Yellow
    Push-Location $ProjectRoot
    npm run build
    Pop-Location
    if (Test-Path $indexPath) {
        Write-Host "[PASS] Build generated frontend/dist successfully" -ForegroundColor Green
    } else {
        Write-Host "[FAIL] Build failed to generate frontend/dist" -ForegroundColor Red
        $allPassed = $false
    }
}

# 5. Check Git Status
Push-Location $ProjectRoot
$gitStatus = git status --porcelain 2>$null
if ($LASTEXITCODE -eq 0) {
    if ([string]::IsNullOrWhiteSpace($gitStatus)) {
        Write-Host "[PASS] Git working tree is clean and ready to push" -ForegroundColor Green
    } else {
        Write-Host "[WARN] Uncommitted changes detected in Git repository" -ForegroundColor Yellow
    }
}
Pop-Location

Write-Host "`n==========================================================" -ForegroundColor Cyan
if ($allPassed) {
    Write-Host "  PRE-FLIGHT CHECK PASSED - READY TO DEPLOY TO RENDER!    " -ForegroundColor Green
} else {
    Write-Host "  PRE-FLIGHT CHECK FOUND ISSUES - REVIEW OUTPUT ABOVE     " -ForegroundColor Red
}
Write-Host "==========================================================" -ForegroundColor Cyan
