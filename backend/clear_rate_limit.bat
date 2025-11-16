@echo off
REM Clear rate limit for login attempts
echo Clearing rate limit...
python backend\reset_rate_limit.py
pause

