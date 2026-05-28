# Aplicacion Windows (Tauri)

El envoltorio Tauri empaqueta el build React y puede conectarse al backend LAN o al dominio HTTPS.

Requisitos: Rust estable, Microsoft C++ Build Tools y WebView2.

```powershell
cd desktop
npm install
npm run icon
npm run tauri:dev
npm run tauri:build
```

Para generar el instalador conectado al dominio:

```powershell
cd ..\frontend
$env:VITE_API_BASE_URL = "https://ayuda.su-dominio.com/api"
npm run build

cd ..\desktop
npm run tauri:build
```

El producto generado se denomina **Mesa de Ayuda CECASEM** y sus instaladores se ubican bajo `src-tauri\target\release\bundle`.
