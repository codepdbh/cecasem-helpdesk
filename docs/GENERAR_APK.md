# Generar APK Android

## Requisitos

Instale Android Studio, Android SDK y JDK compatibles con Capacitor 8.
Si Windows tiene configurado Java 25 o superior, use el JDK 21 integrado de Android Studio durante el build:

```powershell
$env:JAVA_HOME = "C:\Program Files\Android\Android Studio\jbr"
$env:Path = "$env:JAVA_HOME\bin;$env:Path"
$env:ANDROID_HOME = "$env:LOCALAPPDATA\Android\Sdk"
$env:ANDROID_SDK_ROOT = $env:ANDROID_HOME
```

## Sincronizar La Aplicacion

Modo LAN:

```powershell
cd "C:\ruta\cecasem-helpdesk\mobile"
npm install
npm run android:sync
npx cap open android
```

Modo VPS/dominio:

```powershell
cd "C:\ruta\cecasem-helpdesk\mobile"
$env:VITE_API_BASE_URL = "https://ayuda.su-dominio.com/api"
$env:VITE_PUBLIC_WEB_URL = "https://ayuda.su-dominio.com"
npm run android:sync
npx cap open android
```

`android:sync` genera el build web, lo copia a `mobile\www`, actualiza el proyecto Android y genera los iconos nativos a partir de `frontend\logo.png`.

## Generar APK

En Android Studio:

1. Espere la sincronizacion Gradle.
2. Seleccione **Build > Build APK(s)**.
3. Instale el APK resultante en el celular autorizado.

La APK se denomina **Mesa de Ayuda CECASEM**.

## Uso

En modo VPS el telefono solo necesita Internet y acceso al dominio HTTPS. No abra PostgreSQL a Internet.
