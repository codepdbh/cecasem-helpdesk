# Generar EXE En Windows

## Requisitos

Instale Rust estable (`rustup`), Visual Studio Build Tools con desarrollo de escritorio C++ y Microsoft Edge WebView2 Runtime.

## Desarrollo

Con backend disponible por LAN:

```powershell
cd "C:\ruta\cecasem-helpdesk\desktop"
npm run icon
npm run tauri:dev
```

Tauri inicia el frontend local en el puerto `47822`.

## Instalador LAN

```powershell
cd "C:\ruta\cecasem-helpdesk\desktop"
npm run icon
npm run tauri:build
```

## Instalador Con Dominio

```powershell
cd "C:\ruta\cecasem-helpdesk\frontend"
$env:VITE_API_BASE_URL = "https://ayuda.su-dominio.com/api"
npm run build

cd "..\desktop"
npm run tauri:build
```

La configuracion genera instaladores MSI/NSIS denominados **Mesa de Ayuda CECASEM** en:

```text
desktop\src-tauri\target\release\bundle\
```

La aplicacion no incorpora PostgreSQL ni backend; debe alcanzar el servidor CECASEM por LAN o por el dominio HTTPS.
