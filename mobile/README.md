# Aplicacion Android (Capacitor)

La aplicacion Android empaqueta la SPA y puede llamar a la API LAN o a la API publicada en un dominio.

Para compilar por consola use JDK 21. Android Studio lo incluye en `C:\Program Files\Android\Android Studio\jbr`.

```powershell
cd mobile
npm install
npm run android:sync
npx cap open android
```

Para generar la APK conectada al dominio publico:

```powershell
cd mobile
$env:VITE_API_BASE_URL = "https://ayuda.su-dominio.com/api"
$env:VITE_PUBLIC_WEB_URL = "https://ayuda.su-dominio.com"
npm run android:sync
npx cap open android
```

El manifiesto Android habilita `INTERNET`. Genere el APK desde Android Studio mediante **Build > Build APK(s)**.
`android:sync` genera los iconos Android a partir de `frontend\logo.png`.
