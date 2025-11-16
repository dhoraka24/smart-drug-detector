@echo off
REM Run FastAPI server from project root
echo ========================================
echo Smart Drug Detector Backend Server
echo ========================================
echo.
echo This script will navigate to project root and start the server...
echo.

REM Get the directory where this batch file is located (backend folder)
set SCRIPT_DIR=%~dp0
REM Go to parent directory (project root)
cd /d "%SCRIPT_DIR%.."

REM Verify we're in the right place
if not exist "backend\app.py" (
    echo ERROR: backend\app.py not found!
    echo Current directory: %CD%
    echo Please run this from the backend directory.
    pause
    exit /b 1
)

echo Starting server from project root: %CD%
echo.
python -m uvicorn backend.app:app --reload --host 0.0.0.0 --port 8000

if errorlevel 1 (
    echo.
    echo ERROR: Server failed to start
    pause
)

