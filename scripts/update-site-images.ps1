param(
  [string]$ManifestPath = "js/carousel-manifest.js",
  [string]$CarouselDir = "img/carousel",
  [int]$WebpQuality = 92,
  [int]$CarouselMaxDimension = 1400,
  [switch]$RebuildWebp
)

$ErrorActionPreference = "Stop"

$repoRoot = Split-Path -Parent $PSScriptRoot
$indexPath = Join-Path $repoRoot "index.html"
$storiesPath = Join-Path $repoRoot "js/stories.js"
$logoSource = Join-Path $repoRoot "img/logo.png"
$logoWebp = Join-Path $repoRoot "img/logo.webp"
$storiesDir = Join-Path $repoRoot "img/stories"
$resolvedManifestPath = Join-Path $repoRoot $ManifestPath
$resolvedCarouselDir = Join-Path $repoRoot $CarouselDir

function Get-FfmpegCommand {
  $ffmpegCommand = Get-Command ffmpeg -ErrorAction SilentlyContinue
  if (-not $ffmpegCommand) {
    throw "ffmpeg is required but was not found in PATH."
  }

  return $ffmpegCommand.Source
}

function Escape-JsString {
  param(
    [Parameter(Mandatory = $true)]
    [string]$Value
  )

  return $Value.Replace('\', '\\').Replace('"', '\"')
}

function Convert-ToWebp {
  param(
    [Parameter(Mandatory = $true)]
    [string]$SourcePath,
    [Parameter(Mandatory = $true)]
    [string]$OutputPath,
    [Parameter(Mandatory = $true)]
    [string]$ScaleFilter,
    [int]$Quality = 92,
    [bool]$ForceRebuild = $false
  )

  if (-not (Test-Path -LiteralPath $SourcePath)) {
    return $false
  }

  $sourceItem = Get-Item -LiteralPath $SourcePath
  $shouldConvert = $true

  if ((Test-Path -LiteralPath $OutputPath) -and -not $ForceRebuild) {
    $outputItem = Get-Item -LiteralPath $OutputPath
    $shouldConvert = $sourceItem.LastWriteTimeUtc -gt $outputItem.LastWriteTimeUtc
  }

  if (-not $shouldConvert) {
    return $false
  }

  $ffmpeg = Get-FfmpegCommand
  $ffmpegArgs = @(
    "-y",
    "-loglevel", "error",
    "-i", $SourcePath,
    "-vf", $ScaleFilter,
    "-c:v", "libwebp",
    "-quality", "$Quality",
    "-compression_level", "6",
    "-preset", "picture",
    $OutputPath
  )

  & $ffmpeg @ffmpegArgs

  if ($LASTEXITCODE -ne 0) {
    throw "ffmpeg failed while converting $SourcePath to WebP."
  }

  return $true
}

function Set-FileContentIfChanged {
  param(
    [Parameter(Mandatory = $true)]
    [string]$Path,
    [Parameter(Mandatory = $true)]
    [string]$Content
  )

  $existing = Get-Content -LiteralPath $Path -Raw
  if ($existing -ne $Content) {
    Set-Content -LiteralPath $Path -Value $Content -NoNewline
    return $true
  }

  return $false
}

function Update-LogoReferences {
  if (-not (Test-Path -LiteralPath $logoWebp)) {
    return
  }

  $indexContent = Get-Content -LiteralPath $indexPath -Raw
  $updatedIndexContent = $indexContent.Replace("img/logo.png", "img/logo.webp")
  $didUpdate = Set-FileContentIfChanged -Path $indexPath -Content $updatedIndexContent

  if ($didUpdate) {
    Write-Host "Updated logo references in index.html to img/logo.webp"
  }
}

function Update-StoryReferences {
  if (-not (Test-Path -LiteralPath $storiesPath)) {
    return
  }

  $storiesContent = Get-Content -LiteralPath $storiesPath -Raw
  $updatedStoriesContent = [regex]::Replace(
    $storiesContent,
    'image:\s*"img/stories/(?<name>[^"]+)\.(?<ext>png|jpg|jpeg)"',
    {
      param($match)

      $name = $match.Groups["name"].Value
      $webpPath = Join-Path $storiesDir ($name + ".webp")

      if (Test-Path -LiteralPath $webpPath) {
        return 'image: "img/stories/' + $name + '.webp"'
      }

      return $match.Value
    }
  )

  $didUpdate = Set-FileContentIfChanged -Path $storiesPath -Content $updatedStoriesContent

  if ($didUpdate) {
    Write-Host "Updated js/stories.js to prefer generated WebP story assets"
  }
}

function Update-CarouselManifest {
  param(
    [Parameter(Mandatory = $true)]
    [string]$DirectoryPath,
    [Parameter(Mandatory = $true)]
    [string]$ManifestPath
  )

  if (-not (Test-Path -LiteralPath $ManifestPath)) {
    throw "Manifest file not found: $ManifestPath"
  }

  if (-not (Test-Path -LiteralPath $DirectoryPath)) {
    throw "Carousel directory not found: $DirectoryPath"
  }

  $manifestContent = Get-Content -LiteralPath $ManifestPath -Raw

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

  $slideFiles = Get-ChildItem -LiteralPath $DirectoryPath -File |
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

  Set-Content -LiteralPath $ManifestPath -Value $updatedManifest -NoNewline

  Write-Host "Resolved carousel directory: $DirectoryPath"
  Write-Host "Resolved manifest path: $ManifestPath"

  if ($slideFiles.Count -gt 0) {
    Write-Host "Detected slide files:"
    $slideFiles | ForEach-Object {
      Write-Host " - $($_.Name)"
    }
  } else {
    Write-Host "Detected slide files: none"
  }

  Write-Host "Updated carousel manifest with $($slideFiles.Count) image(s) from $CarouselDir"
}

Write-Host "Updating site images..."

$didConvertLogo = Convert-ToWebp `
  -SourcePath $logoSource `
  -OutputPath $logoWebp `
  -ScaleFilter "scale='min(1200,iw)':'min(1200,ih)':force_original_aspect_ratio=decrease" `
  -ForceRebuild:$RebuildWebp

if ($didConvertLogo) {
  Write-Host "Created or refreshed img/logo.webp"
}

if (Test-Path -LiteralPath $storiesDir) {
  $storySources = Get-ChildItem -LiteralPath $storiesDir -File |
    Where-Object { $_.Extension -match '^\.(png|jpe?g)$' }

  foreach ($file in $storySources) {
    $outputPath = Join-Path $storiesDir ($file.BaseName + ".webp")
    $didConvert = Convert-ToWebp `
      -SourcePath $file.FullName `
      -OutputPath $outputPath `
      -ScaleFilter "scale='min(1080,iw)':'min(1350,ih)':force_original_aspect_ratio=decrease" `
      -ForceRebuild:$RebuildWebp

    if ($didConvert) {
      Write-Host "Created or refreshed img/stories/$($file.BaseName).webp"
    }
  }
}

if (-not (Test-Path -LiteralPath $resolvedCarouselDir)) {
  throw "Carousel directory not found: $resolvedCarouselDir"
}

$carouselSources = Get-ChildItem -LiteralPath $resolvedCarouselDir -File |
  Where-Object { $_.BaseName -match '^\d+$' -and $_.Extension -match '^\.(png|jpe?g)$' } |
  Sort-Object { [int]$_.BaseName }

foreach ($file in $carouselSources) {
  $outputPath = Join-Path $resolvedCarouselDir ($file.BaseName + ".webp")
  $didConvert = Convert-ToWebp `
    -SourcePath $file.FullName `
    -OutputPath $outputPath `
    -ScaleFilter "scale='min($CarouselMaxDimension,iw)':'min($CarouselMaxDimension,ih)':force_original_aspect_ratio=decrease" `
    -Quality $WebpQuality `
    -ForceRebuild:$RebuildWebp

  if ($didConvert) {
    Write-Host "Created or refreshed img/carousel/$($file.BaseName).webp"
  }
}

Update-LogoReferences
Update-StoryReferences
Update-CarouselManifest -DirectoryPath $resolvedCarouselDir -ManifestPath $resolvedManifestPath

Write-Host ""
Write-Host "Done."
Write-Host "Main command to remember:"
Write-Host " - .\scripts\update-site-images.ps1"
Write-Host ""
Write-Host "Optimized automatically:"
Write-Host " - img/logo.png -> img/logo.webp (max 1200 px)"
Write-Host " - img/stories/*.png/jpg -> .webp (max 1080x1350)"
Write-Host " - img/carousel/*.png/jpg -> .webp (max 1400 px)"
Write-Host ""
Write-Host "Kept as original formats:"
Write-Host " - SVG icons"
Write-Host " - favicon.ico"
Write-Host " - img/icons/favicon-16x16.png"
Write-Host " - img/icons/favicon-32x32.png"
Write-Host " - img/icons/apple-touch-icon.png"
