param(
  [string]$ManifestPath = "js/carousel-manifest.js",
  [string]$CarouselDir = "img/carousel",
  [int]$WebpQuality = 92
)

$ErrorActionPreference = "Stop"

function Escape-JsString {
  param(
    [Parameter(Mandatory = $true)]
    [string]$Value
  )

  return $Value.Replace('\', '\\').Replace('"', '\"')
}

$repoRoot = Split-Path -Parent $PSScriptRoot
$resolvedManifestPath = Join-Path $repoRoot $ManifestPath
$resolvedCarouselDir = Join-Path $repoRoot $CarouselDir

function Update-CarouselWebpAssets {
  param(
    [Parameter(Mandatory = $true)]
    [string]$DirectoryPath,
    [Parameter(Mandatory = $true)]
    [int]$Quality
  )

  $ffmpegCommand = Get-Command ffmpeg -ErrorAction SilentlyContinue
  if (-not $ffmpegCommand) {
    Write-Host "ffmpeg not found in PATH. Skipping WebP conversion."
    return
  }

  $convertedCount = 0

  $sourceFiles = Get-ChildItem -LiteralPath $DirectoryPath -File |
    Where-Object { $_.BaseName -match '^\d+$' -and $_.Extension -match '^\.(png|jpe?g)$' } |
    Sort-Object { [int]$_.BaseName }

  foreach ($file in $sourceFiles) {
    $webpPath = Join-Path $DirectoryPath ($file.BaseName + ".webp")
    $shouldConvert = $true

    if (Test-Path -LiteralPath $webpPath) {
      $webpItem = Get-Item -LiteralPath $webpPath
      $shouldConvert = $file.LastWriteTimeUtc -gt $webpItem.LastWriteTimeUtc
    }

    if (-not $shouldConvert) {
      continue
    }

    $ffmpegArgs = @(
      "-y",
      "-loglevel", "error",
      "-i", $file.FullName,
      "-c:v", "libwebp",
      "-quality", "$Quality",
      "-compression_level", "6",
      "-preset", "picture",
      $webpPath
    )

    & $ffmpegCommand.Source @ffmpegArgs

    if ($LASTEXITCODE -ne 0) {
      throw "ffmpeg failed while converting $($file.Name) to WebP."
    }

    $convertedCount += 1
    Write-Host "Created or refreshed $($file.BaseName).webp"
  }

  if ($convertedCount -eq 0) {
    Write-Host "WebP assets are already up to date."
  }
}

if (-not (Test-Path -LiteralPath $resolvedManifestPath)) {
  throw "Manifest file not found: $resolvedManifestPath"
}

if (-not (Test-Path -LiteralPath $resolvedCarouselDir)) {
  throw "Carousel directory not found: $resolvedCarouselDir"
}

Update-CarouselWebpAssets -DirectoryPath $resolvedCarouselDir -Quality $WebpQuality

$manifestContent = Get-Content -LiteralPath $resolvedManifestPath -Raw

$existingAltBySrc = @{}
$entryPattern = [regex]'src:\s*"(?<src>[^"]+)"\s*,\s*alt:\s*"(?<alt>(?:[^"\\]|\\.)*)"'
foreach ($match in $entryPattern.Matches($manifestContent)) {
  $src = $match.Groups["src"].Value
  $alt = $match.Groups["alt"].Value.Replace('\"', '"').Replace('\\', '\')
  $existingAltBySrc[$src] = $alt
}

$extensionPriority = @{
  ".avif" = 0
  ".webp" = 1
  ".jpg"  = 2
  ".jpeg" = 3
  ".png"  = 4
}

$slideFiles = Get-ChildItem -LiteralPath $resolvedCarouselDir -File |
  Where-Object { $_.BaseName -match '^\d+$' -and $_.Extension -match '^\.(png|jpe?g|webp|avif)$' } |
  Group-Object BaseName |
  Sort-Object { [int]$_.Name } |
  ForEach-Object {
    $_.Group |
      Sort-Object { $extensionPriority[$_.Extension.ToLowerInvariant()] } |
      Select-Object -First 1
  }

$lines = foreach ($file in $slideFiles) {
  $relativeSrc = "img/carousel/$($file.Name)"
  $slideNumber = [int]$file.BaseName
  $alt = $null

  if ($existingAltBySrc.ContainsKey($relativeSrc)) {
    $alt = $existingAltBySrc[$relativeSrc]
  } else {
    foreach ($extension in @(".avif", ".webp", ".jpg", ".jpeg", ".png")) {
      $candidateSrc = "img/carousel/$($file.BaseName)$extension"
      if ($existingAltBySrc.ContainsKey($candidateSrc)) {
        $alt = $existingAltBySrc[$candidateSrc]
        break
      }
    }
  }

  if (-not $alt) {
    $alt = "Instagram carousel image $slideNumber"
  }

  '      { src: "' + (Escape-JsString $relativeSrc) + '", alt: "' + (Escape-JsString $alt) + '" },'
}

$replacement = if ($lines.Count -gt 0) {
  "files: [`r`n$($lines -join "`r`n")`r`n    ],"
} else {
  "files: [],"
}

$updatedManifest = [regex]::Replace(
  $manifestContent,
  'files:\s*\[(?:.|\r|\n)*?\],',
  $replacement,
  1
)

Set-Content -LiteralPath $resolvedManifestPath -Value $updatedManifest -NoNewline

Write-Host "Resolved carousel directory: $resolvedCarouselDir"
Write-Host "Resolved manifest path: $resolvedManifestPath"

if ($slideFiles.Count -gt 0) {
  Write-Host "Detected slide files:"
  $slideFiles | ForEach-Object {
    Write-Host " - $($_.Name)"
  }
} else {
  Write-Host "Detected slide files: none"
}

Write-Host "Updated carousel manifest with $($slideFiles.Count) image(s) from $CarouselDir"
