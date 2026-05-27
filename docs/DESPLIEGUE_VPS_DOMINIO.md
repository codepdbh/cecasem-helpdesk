# Despliegue En VPS Con Dominio

Esta guia publica Mesa de Ayuda CECASEM en Internet usando un dominio, Nginx como reverse proxy, PostgreSQL privado y la API NestJS escuchando solo en `127.0.0.1:47821`.

Use `ayuda.su-dominio.com` como ejemplo y reemplacelo por el dominio real.

## 1. DNS

En el panel del dominio cree un registro:

```text
Tipo: A
Nombre: ayuda
Destino: IP_PUBLICA_DE_LA_VPS
```

Espere a que el dominio resuelva:

```bash
nslookup ayuda.su-dominio.com
```

## 2. Requisitos En Ubuntu

```bash
sudo apt update
sudo apt install -y git nginx docker.io docker-compose-plugin certbot python3-certbot-nginx
```

Instale Node.js LTS. En servidores recientes se recomienda Node 22 o superior.

## 3. Variables De Entorno

Copie los ejemplos y cambie dominio, contrasenas y secretos:

```bash
cd /opt/cecasem-helpdesk
cp backend/.env.vps.example backend/.env
cp frontend/.env.vps.example frontend/.env.production
nano backend/.env
nano frontend/.env.production
```

Valores clave del backend:

```env
SERVER_HOST=127.0.0.1
SERVER_PORT=47821
FRONTEND_URL=https://ayuda.su-dominio.com
PUBLIC_WEB_URL=https://ayuda.su-dominio.com
TRUST_PROXY=true
DATABASE_URL="postgresql://cecasem_ticket_user:CAMBIAR_PASSWORD@127.0.0.1:55433/cecasem_tickets?schema=public"
JWT_SECRET="CAMBIAR_SECRET_LARGO_Y_SEGURO"
```

Valores clave del frontend si API y web van en el mismo dominio:

```env
VITE_API_BASE_URL="/api"
VITE_PUBLIC_WEB_URL="https://ayuda.su-dominio.com"
```

## 4. Base De Datos Privada

PostgreSQL se mantiene solo en localhost:

```bash
docker compose up -d postgres
```

No abra el puerto `55433` a Internet.

## 5. Compilar Y Migrar

```bash
npm ci
npm run prisma:generate --workspace backend
npm run prisma:deploy --workspace backend
npm run prisma:seed --workspace backend
npm run build:prod
```

## 6. Servicio Backend

Use la plantilla:

```bash
sudo cp deploy/systemd/cecasem-helpdesk-api.service /etc/systemd/system/
sudo systemctl daemon-reload
sudo systemctl enable --now cecasem-helpdesk-api
sudo systemctl status cecasem-helpdesk-api
```

La plantilla asume:

```text
/opt/cecasem-helpdesk
usuario Linux: cecasem
```

Ajuste esos valores si su ruta o usuario son distintos.

## 7. Nginx

Copie la plantilla y reemplace el dominio:

```bash
sudo sed "s/ayuda\\.su-dominio\\.com/ayuda.REAL.com/g" deploy/nginx/cecasem-helpdesk.conf \
  | sudo tee /etc/nginx/sites-available/cecasem-helpdesk >/dev/null
sudo ln -sf /etc/nginx/sites-available/cecasem-helpdesk /etc/nginx/sites-enabled/cecasem-helpdesk
sudo nginx -t
sudo systemctl reload nginx
```

Nginx publica:

- `/` desde `frontend/dist`
- `/api/` hacia `127.0.0.1:47821`
- `/uploads/` hacia el backend
- `/socket.io/` para notificaciones en vivo

## 8. HTTPS

```bash
sudo certbot --nginx -d ayuda.su-dominio.com
```

Despues de esto, el sistema debe entrar por:

```text
https://ayuda.su-dominio.com
```

## 9. Firewall VPS

Abra solo:

```bash
sudo ufw allow OpenSSH
sudo ufw allow 80/tcp
sudo ufw allow 443/tcp
sudo ufw enable
```

No abra `47821`, `47822` ni `55433` a Internet. El backend y PostgreSQL quedan internos.

## 10. APK Y EXE Con Dominio

Android:

```powershell
cd mobile
$env:VITE_API_BASE_URL = "https://ayuda.su-dominio.com/api"
$env:VITE_PUBLIC_WEB_URL = "https://ayuda.su-dominio.com"
npm run android:sync
npx cap open android
```

Windows Tauri:

```powershell
cd frontend
$env:VITE_API_BASE_URL = "https://ayuda.su-dominio.com/api"
npm run build
cd ..\desktop
npm run tauri:build
```
