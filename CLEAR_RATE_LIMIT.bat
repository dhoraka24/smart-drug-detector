@echo off
REM ========================================
REM Clear Rate Limit for Login
REM ========================================
echo.
echo Clearing rate limit...
echo.

cd /d "%~dp0"
python backend\reset_rate_limit.py

echo.
echo ========================================
echo Rate limit cleared!
echo.
echo IMPORTANT: Restart the backend server for changes to take effect.
echo.
echo Steps:
echo 1. Stop the backend server (Ctrl+C)
echo 2. Start it again: START_SERVER.bat
echo 3. Try logging in again
echo ========================================
echo.
pause

