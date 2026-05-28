[CmdletBinding()]
param([switch]$Development)

$ErrorActionPreference = 'Stop'
$Backend = Resolve-Path (Join-Path $PSScriptRoot '..\..\backend')
Set-Location $Backend
if (-not (Test-Path '.env')) { throw 'No existe backend\.env. Copie .env.example y configure los valores seguros.' }

if ($Development) {
    npm run start:dev
} else {
    npm run build
    npm run start
}

