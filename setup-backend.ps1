# Smart Drug Detector - Backend Setup Script for Windows PowerShell
# Run this script from the project root directory

Write-Host "Setting up Smart Drug Detector Backend..." -ForegroundColor Cyan

# Check if Python is available
try {
    $pythonVersion = py --version
    Write-Host "Found Python: $pythonVersion" -ForegroundColor Green
} catch {
    Write-Host "Python not found! Please install Python 3.8+ from python.org" -ForegroundColor Red
    exit 1
}

# Create virtual environment
Write-Host "`nCreating virtual environment..." -ForegroundColor Yellow
py -m venv venv

if (Test-Path "venv\Scripts\python.exe") {
    Write-Host "Virtual environment created successfully!" -ForegroundColor Green
} else {
    Write-Host "Failed to create virtual environment!" -ForegroundColor Red
    exit 1
}

# Install dependencies
Write-Host "`nInstalling backend dependencies..." -ForegroundColor Yellow
.\venv\Scripts\python.exe -m pip install --upgrade pip
.\venv\Scripts\python.exe -m pip install -r backend\requirements.txt

if ($LASTEXITCODE -eq 0) {
    Write-Host "`nBackend setup complete!" -ForegroundColor Green
    Write-Host "`nTo start the backend server, run:" -ForegroundColor Cyan
    Write-Host "  .\venv\Scripts\python.exe -m uvicorn backend.app:app --reload" -ForegroundColor White
} else {
    Write-Host "`nFailed to install dependencies!" -ForegroundColor Red
    exit 1
}

