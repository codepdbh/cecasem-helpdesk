# Registro De Usuarios

## Registro Autónomo

Con `REQUIRE_USER_APPROVAL=true`, el registro desde **Primer ingreso** queda en estado **Pendiente de aprobación**. El usuario recibe el mensaje de revisión y no puede crear tickets hasta ser aprobado.

Con `REQUIRE_USER_APPROVAL=false`, queda **Activo** y puede iniciar sesión inmediatamente.

## Estados Visuales

| Valor interno | Texto visible |
| --- | --- |
| `PENDING` | Pendiente de aprobación |
| `ACTIVE` | Activo |
| `REJECTED` | Rechazado |
| `DISABLED` | Desactivado |

## Gestión Administrativa

En **Usuarios** y **Pendientes**, el Equipo de Sistemas puede crear cuentas manualmente, aprobar, rechazar con motivo, activar, desactivar, editar datos, establecer contraseña temporal y consultar historial de IPs.

Las contraseñas nuevas se validan y almacenan con hash bcrypt; nunca se guardan en texto plano.

