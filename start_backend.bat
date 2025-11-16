@echo off
REM Start FastAPI backend server
echo ========================================
echo Smart Drug Detector Backend Server
echo ========================================
echo.

REM Get the directory where this batch file is located
set SCRIPT_DIR=%~dp0
cd /d "%SCRIPT_DIR%"

REM Verify we're in the right place
if not exist "backend\app.py" (
    echo ERROR: backend\app.py not found!
    echo Make sure you're running this from the project root directory.
    echo Current directory: %CD%
    pause
    exit /b 1
)

echo Starting server from: %CD%
echo.
python -m uvicorn backend.app:app --reload --host 0.0.0.0 --port 8000

if errorlevel 1 (
    echo.
    echo ERROR: Server failed to start
    echo Make sure you're in the project root directory
    echo and all dependencies are installed.
    pause
)

