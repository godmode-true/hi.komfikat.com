@echo off
setlocal

powershell -NoProfile -ExecutionPolicy Bypass -File "%~dp0sync-carousel-manifest.ps1"

echo.
pause
