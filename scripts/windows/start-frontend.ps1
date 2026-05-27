[CmdletBinding()]
param()

$ErrorActionPreference = 'Stop'
$Frontend = Resolve-Path (Join-Path $PSScriptRoot '..\..\frontend')
Set-Location $Frontend
if (-not (Test-Path '.env')) {
    Copy-Item '.env.example' '.env'
    Write-Host 'Se creo frontend\.env con la URL LAN institucional.' -ForegroundColor Yellow
}
npm run dev
