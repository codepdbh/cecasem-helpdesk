[CmdletBinding()]
param(
    [Parameter(Mandatory = $true)][string]$BackupFile,
    [string]$Database = 'cecasem_tickets',
    [string]$User = 'cecasem_ticket_user',
    [string]$HostName = 'localhost',
    [int]$Port = 55433
)

$ErrorActionPreference = 'Stop'
$Root = Resolve-Path (Join-Path $PSScriptRoot '..\..')
$ResolvedBackup = Resolve-Path $BackupFile
if (-not (Test-Path $ResolvedBackup -PathType Leaf)) { throw 'El archivo de backup no existe.' }
if (-not $env:CECASEM_DB_PASSWORD) {
    $LocalEnvironment = Join-Path $Root '.env'
    if (Test-Path $LocalEnvironment) {
        $PasswordLine = Get-Content -LiteralPath $LocalEnvironment | Where-Object { $_ -match '^CECASEM_DB_PASSWORD=' } | Select-Object -First 1
        if ($PasswordLine) { $env:CECASEM_DB_PASSWORD = $PasswordLine.Substring('CECASEM_DB_PASSWORD='.Length) }
    }
}
if (-not $env:CECASEM_DB_PASSWORD) {
    $secure = Read-Host 'Contraseña de PostgreSQL' -AsSecureString
    $pointer = [Runtime.InteropServices.Marshal]::SecureStringToBSTR($secure)
    try { $env:PGPASSWORD = [Runtime.InteropServices.Marshal]::PtrToStringBSTR($pointer) }
    finally { [Runtime.InteropServices.Marshal]::ZeroFreeBSTR($pointer) }
} else {
    $env:PGPASSWORD = $env:CECASEM_DB_PASSWORD
}

try {
    Write-Warning "Se restaurara $ResolvedBackup en la base de datos $Database."
    $confirmation = Read-Host 'Escriba RESTAURAR para continuar'
    if ($confirmation -ne 'RESTAURAR') { throw 'Restauracion cancelada.' }
    & psql --host $HostName --port $Port --username $User --dbname $Database --file $ResolvedBackup
    if ($LASTEXITCODE -ne 0) { throw 'psql devolvio un codigo de error.' }
    Write-Host 'Restauracion finalizada.' -ForegroundColor Green
} finally {
    Remove-Item Env:\PGPASSWORD -ErrorAction SilentlyContinue
}
