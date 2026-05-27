# Ejecutar en PowerShell como Administrador en el servidor CECASEM.
[CmdletBinding()]
param()

$ErrorActionPreference = 'Stop'
$rules = @(
    @{ Name = 'CECASEM Helpdesk Backend 47821'; Port = 47821 },
    @{ Name = 'CECASEM Helpdesk Web 47822'; Port = 47822 }
)
foreach ($rule in $rules) {
    if (-not (Get-NetFirewallRule -DisplayName $rule.Name -ErrorAction SilentlyContinue)) {
        New-NetFirewallRule -DisplayName $rule.Name -Direction Inbound -Action Allow -Protocol TCP -LocalPort $rule.Port -Profile Private
        Write-Host "Puerto $($rule.Port) habilitado para redes privadas." -ForegroundColor Green
    } else {
        Write-Host "La regla $($rule.Name) ya existe." -ForegroundColor Yellow
    }
}
Write-Host 'PostgreSQL 55433 permanece sin regla entrante; la base de datos debe ser local al servidor.' -ForegroundColor Cyan
