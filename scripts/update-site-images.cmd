@echo off
setlocal

powershell -NoProfile -ExecutionPolicy Bypass -File "%~dp0update-site-images.ps1"

echo.
pause
