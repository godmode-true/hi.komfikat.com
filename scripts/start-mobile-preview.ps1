param(
  [int]$Port = 8080
)

$ErrorActionPreference = "Stop"

$scriptPath = Join-Path $PSScriptRoot "serve_mobile_preview.py"

if (-not (Test-Path -LiteralPath $scriptPath)) {
  throw "Python preview script not found: $scriptPath"
}

$pythonCommand = Get-Command py -ErrorAction SilentlyContinue
if ($pythonCommand) {
  & $pythonCommand.Source -3 $scriptPath --port $Port
  exit $LASTEXITCODE
}

$pythonCommand = Get-Command python -ErrorAction SilentlyContinue
if ($pythonCommand) {
  & $pythonCommand.Source $scriptPath --port $Port
  exit $LASTEXITCODE
}

Write-Host ""
Write-Host "Python was not found in PATH."
Write-Host "Install Python, then run:"
Write-Host "  .\scripts\start-mobile-preview.ps1"
Write-Host ""
exit 1
