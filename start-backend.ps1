# Start Backend Server
# Run this script from the project root directory

Write-Host "Starting Smart Drug Detector Backend..." -ForegroundColor Cyan

if (-not (Test-Path "venv\Scripts\python.exe")) {
    Write-Host "Virtual environment not found! Run setup-backend.ps1 first." -ForegroundColor Red
    exit 1
}

.\venv\Scripts\python.exe -m uvicorn backend.app:app --reload

