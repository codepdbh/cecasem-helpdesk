[CmdletBinding()]
param()

$ErrorActionPreference = 'Stop'
$Root = Resolve-Path (Join-Path $PSScriptRoot '..\..')
$Backend = Join-Path $Root 'backend'

Write-Host 'Instalando dependencias del backend...' -ForegroundColor Cyan
Set-Location $Root
npm install
Set-Location $Backend
if (-not (Test-Path '.env')) {
    Copy-Item '.env.example' '.env'
    Write-Warning 'Se creo backend\.env. Cambie DATABASE_URL y JWT_SECRET antes de iniciar.'
}
npx prisma generate

Write-Host 'Backend instalado. Configure .env y ejecute npx prisma migrate deploy y npx prisma db seed.' -ForegroundColor Green
