@echo off
REM ========================================
REM Smart Drug Detector - Start Backend Server
REM ========================================
echo.
echo Starting Backend Server...
echo.

REM Change to project root (where this file is located)
cd /d "%~dp0"

REM Verify we're in the right place
if not exist "backend\app.py" (
    echo [ERROR] backend\app.py not found!
    echo.
    echo Current directory: %CD%
    echo.
    echo Please make sure this file is in the project root directory.
    echo Project root should contain: backend folder, frontend folder, etc.
    pause
    exit /b 1
)

echo [OK] Found backend\app.py
echo [OK] Starting server from: %CD%
echo.
echo Server will be available at: http://localhost:8000
echo Press CTRL+C to stop the server
echo.
echo ========================================
echo.

REM Start the server
python -m uvicorn backend.app:app --reload --host 0.0.0.0 --port 8000

if errorlevel 1 (
    echo.
    echo [ERROR] Server failed to start!
    echo.
    echo Common issues:
    echo 1. Make sure you're in the project root directory
    echo 2. Make sure Python is installed and in PATH
    echo 3. Make sure dependencies are installed: pip install -r backend\requirements.txt
    echo.
    pause
)

