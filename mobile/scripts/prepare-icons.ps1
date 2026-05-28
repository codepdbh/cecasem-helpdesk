[CmdletBinding()]
param()

$ErrorActionPreference = 'Stop'
$Mobile = Resolve-Path (Join-Path $PSScriptRoot '..')
$Desktop = Resolve-Path (Join-Path $Mobile '..\desktop')
$Generated = Join-Path $Desktop 'src-tauri\icons\android'
$Resources = Join-Path $Mobile 'android\app\src\main\res'

Push-Location $Desktop
try {
    npm run icon
    if ($LASTEXITCODE -ne 0) { throw 'No se pudieron generar los iconos Tauri desde frontend\logo.png.' }
} finally {
    Pop-Location
}

Copy-Item -Path (Join-Path $Generated '*') -Destination $Resources -Recurse -Force
Write-Host 'Iconos Android generados desde frontend\logo.png.' -ForegroundColor Green
