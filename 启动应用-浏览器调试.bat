@echo off
chcp 65001 >nul
cd /d "%~dp0"
title ChronoNote Web Dev

echo ========================================================
echo         ChronoNote Browser Dev Server Starting...
echo ========================================================
echo.

if not exist "node_modules" (
    echo [Info] Installing dependencies...
    call npm install
)

echo [Info] Opening browser at http://localhost:5173 ...
start http://localhost:5173

call npm run dev
