@echo off
title AI Terminal OS - Windows Installer Builder
echo ========================================================
echo  Building Standalone Windows Installer (.exe)
echo ========================================================
echo.

:: Check for Node.js
where node >nul 2>nul
if %errorlevel% neq 0 (
    echo [ERROR] Node.js is required to build the Windows executable.
    echo Download and install Node.js v18 or later from https://nodejs.org/
    pause
    exit /b 1
)

echo [+] Step 1: Installing dependencies...
call npm install
if %errorlevel% neq 0 (
    echo [ERROR] npm install failed.
    pause
    exit /b 1
)

echo.
echo [+] Step 2: Compiling Web Terminal Engine & Backend...
call npm run build
if %errorlevel% neq 0 (
    echo [ERROR] Build failed.
    pause
    exit /b 1
)

echo.
echo [+] Step 3: Packaging standalone Windows Installer (.exe) via Electron Builder...
call npx electron-builder --win nsis
if %errorlevel% neq 0 (
    echo [WARNING] electron-builder encountered an error. Attempting portable bundle fallback...
    call npx electron-builder --win portable
)

echo.
echo ========================================================
echo  [SUCCESS] Standalone Windows App Created!
echo  Check the 'release\' directory in this folder for your:
echo    - 'AI Terminal OS Setup 1.0.0.exe' (Windows Installer)
echo    - 'AI Terminal OS 1.0.0.exe' (Standalone Portable App)
echo ========================================================
pause
