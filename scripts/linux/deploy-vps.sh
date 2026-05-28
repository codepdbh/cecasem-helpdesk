#!/usr/bin/env bash
set -euo pipefail

APP_DIR="${APP_DIR:-/opt/cecasem-helpdesk}"
DOMAIN="${DOMAIN:-ayuda.su-dominio.com}"

cd "$APP_DIR"

echo "Instalando dependencias..."
npm ci

echo "Preparando base de datos..."
docker compose up -d postgres
npm run prisma:generate --workspace backend
npm run prisma:deploy --workspace backend
npm run prisma:seed --workspace backend

echo "Compilando backend y frontend..."
npm run build:prod

echo "Instalando servicio systemd..."
sudo cp deploy/systemd/cecasem-helpdesk-api.service /etc/systemd/system/cecasem-helpdesk-api.service
sudo systemctl daemon-reload
sudo systemctl enable --now cecasem-helpdesk-api

echo "Instalando Nginx para $DOMAIN..."
sudo sed "s/ayuda\\.su-dominio\\.com/$DOMAIN/g" deploy/nginx/cecasem-helpdesk.conf \
  | sudo tee /etc/nginx/sites-available/cecasem-helpdesk >/dev/null
sudo ln -sf /etc/nginx/sites-available/cecasem-helpdesk /etc/nginx/sites-enabled/cecasem-helpdesk
sudo nginx -t
sudo systemctl reload nginx

echo "Despliegue base listo. Active HTTPS con: sudo certbot --nginx -d $DOMAIN"
