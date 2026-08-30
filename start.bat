@echo off
title AI PowerShell Terminal Engine
echo ========================================================
echo  AI PowerShell & Command Terminal Engine
echo  Starting local server on http://localhost:3000
echo ========================================================
echo.

where node >nul 2>nul
if %errorlevel% neq 0 (
    echo [ERROR] Node.js is not installed.
    pause
    exit /b 1
)

:: Check if GEMINI_API_KEY is set in environment or .env
if not exist .env (
    if "%GEMINI_API_KEY%"=="" (
        echo [WARNING] GEMINI_API_KEY environment variable is not set.
        echo Create a .env file with GEMINI_API_KEY=your_key for AI features.
    )
)

echo [+] Starting Server on http://localhost:3000 ...
call npm start
pause
