@echo off
chcp 65001 >nul
cd /d "%~dp0"
title ChronoNote Desktop

echo ========================================================
echo         ChronoNote Desktop Starting...
echo ========================================================
echo.

if not exist "dist" (
    echo [Info] Building frontend assets...
    call npm run build
)

echo [Info] Launching ChronoNote Desktop Window...
call .\node_modules\.bin\electron.cmd .

if errorlevel 1 (
    echo.
    echo [Error] Application exited with error.
    pause
)