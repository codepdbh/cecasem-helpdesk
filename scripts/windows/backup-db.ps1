[CmdletBinding()]
param(
    [string]$Database = 'cecasem_tickets',
    [string]$User = 'cecasem_ticket_user',
    [string]$HostName = 'localhost',
    [int]$Port = 55433
)

$ErrorActionPreference = 'Stop'
$Root = Resolve-Path (Join-Path $PSScriptRoot '..\..')
$BackupDirectory = Join-Path $Root 'backups'
if (-not (Test-Path $BackupDirectory)) { New-Item -ItemType Directory -Path $BackupDirectory | Out-Null }

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

$File = Join-Path $BackupDirectory ("cecasem_tickets_{0}.sql" -f (Get-Date -Format 'yyyy-MM-dd_HH-mm'))
try {
    & pg_dump --host $HostName --port $Port --username $User --dbname $Database --format plain --file $File
    if ($LASTEXITCODE -ne 0) { throw 'pg_dump devolvio un codigo de error.' }
    Write-Host "Backup creado: $File" -ForegroundColor Green
} finally {
    Remove-Item Env:\PGPASSWORD -ErrorAction SilentlyContinue
}
