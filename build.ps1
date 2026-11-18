<#
.SYNOPSIS
    Build script to generate index_single.html (standalone bundle) from index.html, style.css, script.js, and assets.
    Embeds image assets as Base64 Data URIs for complete offline portability.
    Ensures 100% clean UTF-8 encoding without mojibake.
#>

$ErrorActionPreference = "Stop"

$currentDir = $PSScriptRoot
if (-not $currentDir) { $currentDir = Get-Location }

$htmlPath = Join-Path $currentDir "index.html"
$cssPath  = Join-Path $currentDir "style.css"
$jsPath   = Join-Path $currentDir "script.js"
$outPath  = Join-Path $currentDir "index_single.html"
$assetsDir = Join-Path $currentDir "assets"

Write-Host "Membaca berkas sumber..." -ForegroundColor Cyan

$html = [System.IO.File]::ReadAllText($htmlPath, [System.Text.Encoding]::UTF8)
$css  = [System.IO.File]::ReadAllText($cssPath,  [System.Text.Encoding]::UTF8)
$js   = [System.IO.File]::ReadAllText($jsPath,   [System.Text.Encoding]::UTF8)

Write-Host "Mengonversi aset gambar menjadi Base64 Data URI..." -ForegroundColor Cyan

$iconPath = Join-Path $assetsDir "logo-pneulab-icon.png"
$fullPath = Join-Path $assetsDir "logo-pneulab-full.png"
$origPath = Join-Path $assetsDir "logo-pneulab.png"

if (Test-Path $iconPath) {
    $bytes = [System.IO.File]::ReadAllBytes($iconPath)
    $b64 = "data:image/png;base64," + [Convert]::ToBase64String($bytes)
    $html = $html.Replace("assets/logo-pneulab-icon.png", $b64)
    $js   = $js.Replace("assets/logo-pneulab-icon.png", $b64)
}

if (Test-Path $fullPath) {
    $bytes = [System.IO.File]::ReadAllBytes($fullPath)
    $b64 = "data:image/png;base64," + [Convert]::ToBase64String($bytes)
    $html = $html.Replace("assets/logo-pneulab-full.png", $b64)
    $js   = $js.Replace("assets/logo-pneulab-full.png", $b64)
}

if (Test-Path $origPath) {
    $bytes = [System.IO.File]::ReadAllBytes($origPath)
    $b64 = "data:image/png;base64," + [Convert]::ToBase64String($bytes)
    $html = $html.Replace("assets/logo-pneulab.png", $b64)
    $js   = $js.Replace("assets/logo-pneulab.png", $b64)
}

$fav32Path  = Join-Path $assetsDir "favicon-32x32.png"
$fav180Path = Join-Path $assetsDir "favicon-180x180.png"

if (Test-Path $fav32Path) {
    $bytes = [System.IO.File]::ReadAllBytes($fav32Path)
    $b64 = "data:image/png;base64," + [Convert]::ToBase64String($bytes)
    $html = $html.Replace("assets/favicon-32x32.png", $b64)
}

if (Test-Path $fav180Path) {
    $bytes = [System.IO.File]::ReadAllBytes($fav180Path)
    $b64 = "data:image/png;base64," + [Convert]::ToBase64String($bytes)
    $html = $html.Replace("assets/favicon-180x180.png", $b64)
}

Write-Host "Menggabungkan style.css dan script.js ke dalam template HTML..." -ForegroundColor Cyan

# Replace CSS link with inline style tag
$cssTag = "<style>`n$css`n  </style>"
$bundle = $html -replace '<link\s+rel="stylesheet"\s+href="style\.css">', $cssTag

# Replace Script link with inline script tag
$jsTag = "<script>`n$js`n  </script>"
$bundle = $bundle -replace '<script\s+src="script\.js"></script>', $jsTag

Write-Host "Menulis ke $outPath dengan encoding UTF-8..." -ForegroundColor Cyan

$utf8NoBom = New-Object System.Text.UTF8Encoding($false)
[System.IO.File]::WriteAllText($outPath, $bundle, $utf8NoBom)

$sizeKb = [Math]::Round((Get-Item $outPath).Length / 1KB, 2)
Write-Host "Sukses membuat index_single.html ($sizeKb KB) dengan aset Base64 tanpa mojibake!" -ForegroundColor Green
