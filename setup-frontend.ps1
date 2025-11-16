# Smart Drug Detector - Frontend Setup Script for Windows PowerShell
# Run this script from the project root directory

Write-Host "Setting up Smart Drug Detector Frontend..." -ForegroundColor Cyan

# Check if Node.js is available
try {
    $nodeVersion = node --version
    Write-Host "Found Node.js: $nodeVersion" -ForegroundColor Green
} catch {
    Write-Host "Node.js not found!" -ForegroundColor Red
    Write-Host "Please install Node.js from https://nodejs.org/" -ForegroundColor Yellow
    Write-Host "After installing, restart PowerShell and run this script again." -ForegroundColor Yellow
    exit 1
}

# Check if npm is available
try {
    $npmVersion = npm --version
    Write-Host "Found npm: $npmVersion" -ForegroundColor Green
} catch {
    Write-Host "npm not found!" -ForegroundColor Red
    exit 1
}

# Navigate to frontend directory
if (-not (Test-Path "frontend")) {
    Write-Host "Frontend directory not found!" -ForegroundColor Red
    exit 1
}

Set-Location frontend

# Install dependencies
Write-Host "`nInstalling frontend dependencies..." -ForegroundColor Yellow
npm install

if ($LASTEXITCODE -eq 0) {
    Write-Host "`nFrontend setup complete!" -ForegroundColor Green
    Write-Host "`nTo start the frontend server, run:" -ForegroundColor Cyan
    Write-Host "  cd frontend" -ForegroundColor White
    Write-Host "  npm run dev" -ForegroundColor White
    Set-Location ..
} else {
    Write-Host "`nFailed to install dependencies!" -ForegroundColor Red
    Set-Location ..
    exit 1
}

