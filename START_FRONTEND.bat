@echo off
REM ========================================
REM Smart Drug Detector - Start Frontend Server
REM ========================================
echo.
echo Starting Frontend Development Server...
echo.

REM Change to frontend directory
cd /d "%~dp0frontend"

REM Verify we're in the right place
if not exist "package.json" (
    echo [ERROR] package.json not found!
    echo.
    echo Current directory: %CD%
    echo.
    echo Please make sure this file is in the project root directory.
    pause
    exit /b 1
)

echo [OK] Found package.json
echo [OK] Starting frontend from: %CD%
echo.
echo Frontend will be available at: http://localhost:5173
echo Press CTRL+C to stop the server
echo.
echo ========================================
echo.

REM Check if node_modules exists
if not exist "node_modules" (
    echo [INFO] Installing dependencies first...
    echo.
    npm install
    echo.
)

REM Start the development server
npm run dev

if errorlevel 1 (
    echo.
    echo [ERROR] Frontend failed to start!
    echo.
    echo Common issues:
    echo 1. Make sure Node.js is installed
    echo 2. Try running: npm install
    echo 3. Check if port 5173 is already in use
    echo.
    pause
)

