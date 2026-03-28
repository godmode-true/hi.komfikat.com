param(
  [string]$ManifestPath = "js/carousel-manifest.js",
  [string]$CarouselDir = "img/carousel"
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

if (-not (Test-Path -LiteralPath $resolvedManifestPath)) {
  throw "Manifest file not found: $resolvedManifestPath"
}

if (-not (Test-Path -LiteralPath $resolvedCarouselDir)) {
  throw "Carousel directory not found: $resolvedCarouselDir"
}

$manifestContent = Get-Content -LiteralPath $resolvedManifestPath -Raw

$existingAltBySrc = @{}
$entryPattern = [regex]'src:\s*"(?<src>[^"]+)"\s*,\s*alt:\s*"(?<alt>(?:[^"\\]|\\.)*)"'
foreach ($match in $entryPattern.Matches($manifestContent)) {
  $src = $match.Groups["src"].Value
  $alt = $match.Groups["alt"].Value.Replace('\"', '"').Replace('\\', '\')
  $existingAltBySrc[$src] = $alt
}

$slideFiles = Get-ChildItem -LiteralPath $resolvedCarouselDir -File |
  Where-Object { $_.BaseName -match '^\d+$' -and $_.Extension -match '^\.(png|jpe?g|webp|avif)$' } |
  Sort-Object { [int]$_.BaseName }

$lines = foreach ($file in $slideFiles) {
  $relativeSrc = "img/carousel/$($file.Name)"
  $slideNumber = [int]$file.BaseName
  $alt = if ($existingAltBySrc.ContainsKey($relativeSrc)) {
    $existingAltBySrc[$relativeSrc]
  } else {
    "Instagram carousel image $slideNumber"
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
