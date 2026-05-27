[CmdletBinding()]
param(
    [string]$ApiBaseUrl = $env:VITE_API_BASE_URL,
    [string]$PublicWebUrl = $env:VITE_PUBLIC_WEB_URL
)

$ErrorActionPreference = 'Stop'
$Mobile = Resolve-Path (Join-Path $PSScriptRoot '..')
$Frontend = Resolve-Path (Join-Path $Mobile '..\frontend')
$Destination = Join-Path $Mobile 'www'

Set-Location $Frontend
if ($ApiBaseUrl) {
    $env:VITE_API_BASE_URL = $ApiBaseUrl
    Write-Host "API publica para build movil: $ApiBaseUrl" -ForegroundColor Cyan
}
if ($PublicWebUrl) {
    $env:VITE_PUBLIC_WEB_URL = $PublicWebUrl
}
npm run build
if (-not (Test-Path $Destination)) {
    New-Item -ItemType Directory -Path $Destination | Out-Null
} else {
    $ResolvedDestination = (Resolve-Path $Destination).Path
    if (-not $ResolvedDestination.StartsWith($Mobile.Path + [IO.Path]::DirectorySeparatorChar, [System.StringComparison]::OrdinalIgnoreCase)) {
        throw 'El directorio de destino movil queda fuera del proyecto.'
    }
    Get-ChildItem -LiteralPath $ResolvedDestination -Force | Remove-Item -Recurse -Force
}
Copy-Item (Join-Path $Frontend 'dist\*') $Destination -Recurse -Force
Write-Host 'Aplicacion web copiada a mobile\www para Capacitor.' -ForegroundColor Green
