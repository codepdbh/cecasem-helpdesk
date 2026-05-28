# Primer Ingreso Por IP

## Flujo

Al seleccionar **Primer ingreso**, el frontend consulta la IP observada por la API y muestra:

```text
IP registrada: 192.168.88.xx
```

El usuario debe registrar nombre, apellido, fotografía JPG/PNG/WEBP de hasta 3 MB, contraseña y confirmación. Área, cargo, celular y correo son opcionales.

La API genera el usuario: `juan.perez`, `juan.perez2`, `juan.perez3`, según disponibilidad. También permite iniciar sesión escribiendo nombre y apellido completos.

## Datos De Auditoría

Se guardan `firstAccessIp`, `firstAccessUserAgent`, `firstAccessAt`, nombre, apellido, foto y un evento `FIRST_ACCESS_REGISTER`. Cada acceso posterior se agrega a `UserDeviceLog`.

## Reglas De Seguridad

- La IP nunca es contraseña ni único factor de autenticación.
- Un cambio de IP no bloquea automáticamente a un usuario activo.
- Un login desde IP diferente genera la alerta **Inicio de sesión desde IP diferente a la IP de primer ingreso** y una notificación interna al Equipo de Sistemas.
- Las fotos se almacenan en `backend\uploads\profiles\`; archivos ejecutables o scripts son rechazados.

