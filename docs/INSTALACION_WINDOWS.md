# Instalación En Windows

## 1. Requisitos

Instale Node.js LTS, Git y Docker Desktop o PostgreSQL 16. Para aplicaciones instalables agregue Rust/Tauri y Android Studio cuando corresponda.

## 2. Instalación Directa Con Docker

Desde la raíz del proyecto ejecute:

```powershell
cd "C:\ruta\cecasem-helpdesk"
npm run setup:local
npm run dev
```

`setup:local` crea configuración local segura, inicia PostgreSQL en `localhost:55433`, aplica las migraciones y carga los usuarios iniciales. `npm run dev` abre la API en `47821` y la web en `47822` al mismo tiempo.

PostgreSQL se enlaza únicamente a `127.0.0.1:55433`; no queda expuesto a la red LAN.

## 3. Comandos De Operación

```powershell
npm run db:up
npm run db:prepare
npm run dev
npm run db:down
```

El seed crea categorías y las cuentas del Equipo de Sistemas `paulo`, `alfredo` y `diego`, obligadas a cambiar sus claves temporales.

## 4. Configuración Manual Opcional

Si utiliza PostgreSQL instalado directamente, cree `backend\.env` desde el ejemplo y configure:

```dotenv
DATABASE_URL="postgresql://cecasem_ticket_user:SU_PASSWORD@localhost:55433/cecasem_tickets?schema=public"
JWT_SECRET="UN_SECRETO_EXTENSO_ALEATORIO_Y_PRIVADO"
REQUIRE_USER_APPROVAL=true
```

Luego ejecute desde la raíz:

```powershell
npm install
npm run db:prepare
npm run dev
```

## 5. Validar

- Web: `http://192.168.88.123:47822`
- API: `http://192.168.88.123:47821/api`
- Swagger: `http://192.168.88.123:47821/api/docs`

Ejecute `scripts\windows\open-firewall-ports.ps1` como Administrador para permitir acceso de otros equipos de la red privada.
