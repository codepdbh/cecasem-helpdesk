# Mesa de Ayuda CECASEM

Sistema de gestion de tickets y soporte interno para CECASEM. Soporta operacion local en LAN y despliegue publico en una VPS con dominio HTTPS.

## Modos De Uso

### 1. Modo local/LAN

| Componente | Direccion |
| --- | --- |
| Web | `http://192.168.88.123:47822` |
| API | `http://192.168.88.123:47821/api` |
| Swagger | `http://192.168.88.123:47821/api/docs` |
| PostgreSQL | `127.0.0.1:55433` |

### 2. Modo VPS/dominio

| Componente | Direccion recomendada |
| --- | --- |
| Web | `https://ayuda.su-dominio.com` |
| API | `https://ayuda.su-dominio.com/api` |
| Swagger | `https://ayuda.su-dominio.com/api/docs` |
| Socket.IO en vivo | `https://ayuda.su-dominio.com/socket.io/` |
| PostgreSQL | `127.0.0.1:55433`, privado |

En produccion no se publica Vite ni PostgreSQL. Nginx sirve `frontend/dist` y redirige `/api`, `/uploads` y `/socket.io` al backend interno `127.0.0.1:47821`.

## Requisitos

- Node.js LTS moderno.
- PostgreSQL 16 o Docker.
- Git.
- Nginx y Certbot para VPS.
- Rust y WebView2 para EXE Tauri.
- Android Studio para APK.

## Inicio Local Rapido

Desde PowerShell:

```powershell
cd "C:\ruta\cecasem-helpdesk"
npm run setup:local
npm run dev
```

Comandos directos posteriores:

```powershell
npm run db:up
npm run db:prepare
npm run dev
npm run db:down
```

## Despliegue VPS Con Dominio

1. Apunte el DNS del dominio a la IP publica de la VPS.
2. Copie los entornos:

```bash
cp backend/.env.vps.example backend/.env
cp frontend/.env.vps.example frontend/.env.production
```

3. Edite `backend/.env` y `frontend/.env.production` reemplazando `ayuda.su-dominio.com`.
4. Compile y migre:

```bash
npm ci
docker compose up -d postgres
npm run prisma:generate --workspace backend
npm run prisma:deploy --workspace backend
npm run prisma:seed --workspace backend
npm run build:prod
```

5. Instale servicio y Nginx usando las plantillas en `deploy/`.
6. Active HTTPS:

```bash
sudo certbot --nginx -d ayuda.su-dominio.com
```

Guia completa: [DESPLIEGUE_VPS_DOMINIO.md](docs/DESPLIEGUE_VPS_DOMINIO.md).

## Cuentas Iniciales

El seed crea tres cuentas internas con rol `SUPERADMIN`, mostrado siempre como **Equipo de Sistemas**:

| Nombre | Usuario | Contrasena temporal |
| --- | --- | --- |
| Paulo Equipo de Sistemas | `paulo` | `Paulo.123` |
| Alfredo Equipo de Sistemas | `alfredo` | `Alfredo.123` |
| Diego Equipo de Sistemas | `diego` | `Diego.123` |

Las contrasenas se guardan hasheadas y las tres cuentas deben cambiar contrasena en el primer ingreso.

## Primer Ingreso, IP Y Auditoria

El usuario registra nombre, apellido, foto y contrasena. La API guarda IP y User-Agent. En VPS, con `TRUST_PROXY=true` y Nginx enviando `X-Forwarded-For`, se registra la IP real del visitante cuando la infraestructura lo permite.

La IP no se usa como contrasena ni como unico mecanismo de autenticacion. Si cambia, el acceso continua y queda una alerta de auditoria.

## EXE Windows

LAN:

```powershell
cd .\desktop
npm run tauri:build
```

Dominio:

```powershell
cd .\frontend
$env:VITE_API_BASE_URL = "https://ayuda.su-dominio.com/api"
npm run build
cd ..\desktop
npm run tauri:build
```

## APK Android

LAN:

```powershell
cd .\mobile
npm run android:sync
npx cap open android
```

Dominio:

```powershell
cd .\mobile
$env:VITE_API_BASE_URL = "https://ayuda.su-dominio.com/api"
$env:VITE_PUBLIC_WEB_URL = "https://ayuda.su-dominio.com"
npm run android:sync
npx cap open android
```

## Seguridad En VPS

- Abra solo `80` y `443` publicamente.
- Mantenga `47821` escuchando en `127.0.0.1`.
- Mantenga PostgreSQL en `127.0.0.1:55433`.
- Use HTTPS con Certbot.
- Cambie `JWT_SECRET` y la contrasena de PostgreSQL.
- No suba archivos `.env` al repositorio.

## Documentacion

- [Despliegue VPS con dominio](docs/DESPLIEGUE_VPS_DOMINIO.md)
- [Instalacion Windows](docs/INSTALACION_WINDOWS.md)
- [Configuracion de red local](docs/CONFIGURACION_RED_LOCAL.md)
- [Uso del sistema](docs/USO_DEL_SISTEMA.md)
- [Primer ingreso por IP](docs/PRIMER_INGRESO_POR_IP.md)
- [Registro de usuarios](docs/REGISTRO_DE_USUARIOS.md)
- [Equipo de Sistemas](docs/EQUIPO_DE_SISTEMAS.md)
- [Reportes con constancia](docs/REPORTES_CON_CONSTANCIA.md)
- [Generar EXE](docs/GENERAR_EXE.md)
- [Generar APK](docs/GENERAR_APK.md)
- [Backups](docs/BACKUPS.md)
