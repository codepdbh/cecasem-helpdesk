# Equipo De Sistemas

El rol interno administrativo es `SUPERADMIN`; la interfaz lo presenta siempre como **Equipo de Sistemas**.

## Cuentas Semilla

| Usuario | Contraseña temporal | Acción obligatoria |
| --- | --- | --- |
| `paulo` | `Paulo.123` | Cambiar al primer login |
| `alfredo` | `Alfredo.123` | Cambiar al primer login |
| `diego` | `Diego.123` | Cambiar al primer login |

## Operación

- Revisar y aprobar usuarios pendientes.
- Consultar todos los tickets, sus IP de creación, dispositivos, comentarios y evidencias.
- Asignar a un integrante, responder y cambiar estado.
- Marcar como resuelto o cerrar indicando comentario de cierre.
- Adjuntar foto de constancia opcional.
- Revisar auditoría de acceso, tickets y dispositivos.
- Exportar reportes CSV/PDF según filtros.
- Recibir en la campana, en vivo, nuevos tickets, respuestas del usuario y alertas administrativas.

## Cierre

Para cerrar un ticket se requiere comentario de cierre y confirmación. Se registran usuario, fecha, IP, User-Agent y constancia opcional, y se notifica al creador.

Después del cierre el detalle se presenta como atención finalizada: ya no muestra asignación, resolución, cierre o cancelación nuevamente.
