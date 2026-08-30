@echo off
title AI PowerShell Terminal - Installer
echo ========================================================
echo  AI PowerShell & Command Terminal - Windows Installer
echo ========================================================
echo.

:: Check for Node.js
where node >nul 2>nul
if %errorlevel% neq 0 (
    echo [ERROR] Node.js is not installed or not found in PATH.
    echo Please install Node.js v18 or later from https://nodejs.org/
    pause
    exit /b 1
)

echo [+] Installing project dependencies...
call npm install
if %errorlevel% neq 0 (
    echo [ERROR] npm install failed.
    pause
    exit /b 1
)

echo.
echo [+] Building server and production assets...
call npm run build
if %errorlevel% neq 0 (
    echo [ERROR] Build failed.
    pause
    exit /b 1
)

echo.
echo ========================================================
echo  [SUCCESS] Installation & Build Completed Successfully!
echo  To start the application, run: start.bat
echo ========================================================
pause
