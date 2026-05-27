# Backups Y Restauración

## Backup

Instale las herramientas cliente de PostgreSQL (`pg_dump` y `psql`) en el servidor. Ejecute:

```powershell
cd "C:\ruta\cecasem-helpdesk"
.\scripts\windows\backup-db.ps1
```

Si la instalación se realizó con `npm run setup:local`, el script usa la contraseña privada guardada en `.env`, archivo excluido del repositorio. Si no existe esa variable, solicita la contraseña de forma interactiva. El respaldo se produce en:

```text
backups\cecasem_tickets_YYYY-MM-DD_HH-mm.sql
```

También puede definir temporalmente `$env:CECASEM_DB_PASSWORD` antes del comando en un entorno controlado.

## Restauración

Detenga temporalmente el backend antes de restaurar y seleccione un archivo verificado:

```powershell
.\scripts\windows\restore-db.ps1 -BackupFile ".\backups\cecasem_tickets_2026-05-26_10-40.sql"
```

El script exige escribir `RESTAURAR` antes de importar la copia.

## Protección

- Mantenga `backups\` fuera del repositorio.
- Copie respaldos a un medio seguro con acceso limitado.
- Pruebe restauraciones periódicamente en una base no productiva.
