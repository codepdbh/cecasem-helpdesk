# Configuración De Red Local

## Dirección fija

El servidor de CECASEM debe conservar la IP `192.168.88.123`. Configure una reserva DHCP en el router o una IP fija válida en Windows para evitar que el acceso web cambie.

## Puertos

| Servicio | Puerto | Exposición |
| --- | --- | --- |
| Backend NestJS | `47821` | LAN privada |
| Frontend Vite/web | `47822` | LAN privada |
| PostgreSQL | `55433` | Solo `localhost` del servidor |

La API escucha en `0.0.0.0:47821`; el frontend debe iniciarse con `--host 0.0.0.0 --port 47822`.

## Firewall Windows

Abra PowerShell como Administrador en el servidor:

```powershell
cd "C:\ruta\cecasem-helpdesk"
.\scripts\windows\open-firewall-ports.ps1
```

El script crea reglas entrantes únicamente para redes privadas y no abre PostgreSQL.

## Acceso De Estaciones Y Celulares

1. Conecte el equipo por cable Ethernet o al Wi-Fi institucional CECASEM.
2. Abra `http://192.168.88.123:47822`.
3. Si no responde, verifique `ipconfig`, conectividad con `Test-NetConnection 192.168.88.123 -Port 47822` y el perfil privado del firewall.

Tauri y Capacitor requieren orígenes técnicos adicionales en CORS (`tauri://localhost`, `https://tauri.localhost` y `http://localhost`); se incluyen en `.env.example` solo para las aplicaciones instaladas.
