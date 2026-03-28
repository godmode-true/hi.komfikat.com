param(
  [string]$CarouselDir = "img/carousel",
  [int]$Quality = 92,
  [switch]$Overwrite
)

$ErrorActionPreference = "Stop"

$repoRoot = Split-Path -Parent $PSScriptRoot
$resolvedCarouselDir = Join-Path $repoRoot $CarouselDir

if (-not (Test-Path -LiteralPath $resolvedCarouselDir)) {
  throw "Carousel directory not found: $resolvedCarouselDir"
}

if (-not (Get-Command ffmpeg -ErrorAction SilentlyContinue)) {
  throw "ffmpeg is required but was not found in PATH."
}

$sourceFiles = Get-ChildItem -LiteralPath $resolvedCarouselDir -File |
  Where-Object { $_.BaseName -match '^\d+$' -and $_.Extension -match '^\.(png|jpe?g)$' } |
  Sort-Object { [int]$_.BaseName }

if ($sourceFiles.Count -eq 0) {
  Write-Host "No numeric PNG/JPG carousel files found in $resolvedCarouselDir"
  exit 0
}

foreach ($file in $sourceFiles) {
  $outputPath = Join-Path $resolvedCarouselDir ($file.BaseName + ".webp")

  if ((Test-Path -LiteralPath $outputPath) -and -not $Overwrite) {
    Write-Host "Skipping existing $($file.BaseName).webp"
    continue
  }

  $ffmpegArgs = @(
    "-y",
    "-i", $file.FullName,
    "-c:v", "libwebp",
    "-quality", "$Quality",
    "-compression_level", "6",
    "-preset", "picture",
    $outputPath
  )

  & ffmpeg @ffmpegArgs | Out-Null
  Write-Host "Created $([System.IO.Path]::GetFileName($outputPath))"
}

Write-Host "Done. Run .\\scripts\\sync-carousel-manifest.ps1 to switch the manifest to preferred modern formats."
