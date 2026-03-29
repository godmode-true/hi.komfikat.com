@echo off
setlocal

powershell -NoProfile -ExecutionPolicy Bypass -File "%~dp0start-mobile-preview.ps1"

echo.
pause
