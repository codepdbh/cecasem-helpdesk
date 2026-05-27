[CmdletBinding()]
param()

$ErrorActionPreference = 'Stop'
$Root = (Resolve-Path (Join-Path $PSScriptRoot '..\..')).Path
$BackendEnvironment = Join-Path $Root 'backend\.env'
$FrontendEnvironment = Join-Path $Root 'frontend\.env'
$ComposeEnvironment = Join-Path $Root '.env'

function New-SafeToken([int]$Length) {
    $alphabet = 'abcdefghijkmnopqrstuvwxyzABCDEFGHJKLMNPQRSTUVWXYZ23456789'
    $bytes = [byte[]]::new($Length)
    $generator = [System.Security.Cryptography.RandomNumberGenerator]::Create()
    try {
        $generator.GetBytes($bytes)
    } finally {
        $generator.Dispose()
    }
    return -join ($bytes | ForEach-Object { $alphabet[$_ % $alphabet.Length] })
}

Set-Location $Root

if (-not (Test-Path $ComposeEnvironment)) {
    $DatabasePassword = New-SafeToken 36
    Set-Content -LiteralPath $ComposeEnvironment -Value "CECASEM_DB_PASSWORD=$DatabasePassword" -Encoding ASCII
    Write-Host 'Se creo .env local con una contraseña aleatoria para PostgreSQL.' -ForegroundColor Green
} else {
    $PasswordLine = Get-Content -LiteralPath $ComposeEnvironment |
        Where-Object { $_ -match '^CECASEM_DB_PASSWORD=' } |
        Select-Object -First 1
    if (-not $PasswordLine) {
        throw 'El archivo .env raiz debe contener CECASEM_DB_PASSWORD antes de ejecutar la preparacion.'
    }
    $DatabasePassword = $PasswordLine.Substring('CECASEM_DB_PASSWORD='.Length)
}

if (-not (Test-Path $BackendEnvironment)) {
    $JwtSecret = New-SafeToken 72
    $EncodedPassword = [uri]::EscapeDataString($DatabasePassword)
    $BackendConfiguration = Get-Content -LiteralPath (Join-Path $Root 'backend\.env.example') -Raw
    $BackendConfiguration = $BackendConfiguration.Replace('CAMBIAR_PASSWORD', $EncodedPassword)
    $BackendConfiguration = $BackendConfiguration.Replace('CAMBIAR_SECRET_LARGO_Y_SEGURO', $JwtSecret)
    Set-Content -LiteralPath $BackendEnvironment -Value $BackendConfiguration -Encoding ASCII
    Write-Host 'Se creo backend\.env con credenciales locales seguras.' -ForegroundColor Green
} else {
    Write-Host 'Se conserva backend\.env existente; verifique que use PostgreSQL en localhost:55433.' -ForegroundColor Yellow
}

if (-not (Test-Path $FrontendEnvironment)) {
    Copy-Item -LiteralPath (Join-Path $Root 'frontend\.env.example') -Destination $FrontendEnvironment
    Write-Host 'Se creo frontend\.env con la URL LAN institucional.' -ForegroundColor Green
}

Write-Host 'Instalando dependencias...' -ForegroundColor Cyan
npm install
if ($LASTEXITCODE -ne 0) { throw 'npm install no finalizo correctamente.' }

Write-Host 'Iniciando PostgreSQL local en el puerto 55433...' -ForegroundColor Cyan
docker compose up -d postgres
if ($LASTEXITCODE -ne 0) { throw 'No fue posible iniciar PostgreSQL con Docker Compose.' }

Set-Location (Join-Path $Root 'backend')
Write-Host 'Creando esquema y datos iniciales...' -ForegroundColor Cyan
npx prisma generate
if ($LASTEXITCODE -ne 0) { throw 'No fue posible generar Prisma Client.' }
npx prisma migrate deploy
if ($LASTEXITCODE -ne 0) { throw 'No fue posible aplicar las migraciones.' }
npx prisma db seed
if ($LASTEXITCODE -ne 0) { throw 'No fue posible ejecutar el seed.' }

Write-Host ''
Write-Host 'Preparacion lista. Desde la raiz ejecute: npm run dev' -ForegroundColor Green
Write-Host 'Acceso LAN: http://192.168.88.123:47822' -ForegroundColor Green
