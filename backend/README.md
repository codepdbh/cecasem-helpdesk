# Backend

API NestJS de Mesa de Ayuda CECASEM en el puerto `47821`, con Prisma/PostgreSQL, JWT, bcrypt, Swagger, subida controlada de archivos, throttling, auditoria de IP/User-Agent y notificaciones en vivo por Socket.IO.

## Desarrollo Local

```powershell
Copy-Item .env.example .env
npm install
npx prisma generate
npx prisma migrate deploy
npx prisma db seed
npm run start:dev
```

Swagger local:

```text
http://192.168.88.123:47821/api/docs
```

## VPS Con Dominio

```bash
cp .env.vps.example .env
nano .env
npm run build
npm run start
```

En VPS use:

```env
SERVER_HOST=127.0.0.1
FRONTEND_URL=https://ayuda.su-dominio.com
PUBLIC_WEB_URL=https://ayuda.su-dominio.com
TRUST_PROXY=true
```

Swagger publicado por Nginx:

```text
https://ayuda.su-dominio.com/api/docs
```

Las carpetas `uploads\profiles`, `uploads\tickets`, `uploads\tickets\constancias` y `uploads\reports` almacenan fotos/evidencias y no deben publicarse en control de versiones.
