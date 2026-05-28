export function ticketStatusLabel(status: string): string {
  const labels: Record<string, string> = {
    ABIERTO: 'Abierto',
    EN_PROCESO: 'En proceso',
    ESPERANDO_USUARIO: 'Esperando respuesta del usuario',
    RESUELTO: 'Resuelto',
    CERRADO: 'Cerrado',
    REABIERTO: 'Reabierto',
    CANCELADO: 'Cancelado',
  };
  return labels[status] || humanizeCode(status);
}

export function ticketPriorityLabel(priority: string): string {
  const labels: Record<string, string> = {
    BAJA: 'Baja',
    MEDIA: 'Media',
    ALTA: 'Alta',
    CRITICA: 'Crítica',
  };
  return labels[priority] || humanizeCode(priority);
}

export function auditActionLabel(action: string): string {
  const labels: Record<string, string> = {
    ASSIGNED: 'Responsable asignado',
    ATTACHMENT_ADDED: 'Archivo adjunto agregado',
    CHANGE_PASSWORD: 'Contraseña cambiada',
    CLOSE_TICKET: 'Ticket cerrado',
    COMMENT_ADDED: 'Comentario agregado',
    COMMENT_TICKET: 'Comentario en ticket',
    CONSTANCY_PHOTO_ADDED: 'Foto de constancia agregada',
    CREATE_TICKET: 'Ticket creado',
    FIRST_ACCESS_REGISTER: 'Primer ingreso registrado',
    FIRST_ACCESS_REGISTER_FAILED: 'Primer ingreso fallido',
    FIRST_ACCESS_REGISTER_SUCCESS: 'Primer ingreso exitoso',
    LOGIN_FAILED: 'Inicio de sesión fallido',
    LOGIN_SUCCESS: 'Inicio de sesión exitoso',
    LOGOUT: 'Cierre de sesión',
    PASSWORD_CHANGED: 'Contraseña restablecida',
    PASSWORD_RESET_REQUEST: 'Solicitud de restablecimiento',
    PRIORITY_CHANGED: 'Prioridad cambiada',
    REOPEN_TICKET: 'Ticket reabierto',
    STATUS_CHANGED: 'Estado cambiado',
    TICKET_CANCELLED: 'Ticket cancelado',
    TICKET_CLOSED: 'Ticket cerrado',
    TICKET_CREATED: 'Ticket creado',
    TICKET_REOPENED: 'Ticket reabierto',
    TICKET_RESOLVED: 'Ticket resuelto',
    TICKET_UPDATED: 'Ticket actualizado',
    UPDATE_PROFILE: 'Perfil actualizado',
    USER_ACTIVATED: 'Usuario activado',
    USER_APPROVED: 'Usuario aprobado',
    USER_CREATED: 'Usuario creado',
    USER_DISABLED: 'Usuario desactivado',
    USER_REJECTED: 'Usuario rechazado',
    USER_UPDATED: 'Usuario actualizado',
  };
  return labels[action] || humanizeCode(action);
}

function humanizeCode(value: string): string {
  const text = value.replaceAll('_', ' ').toLowerCase();
  return text.charAt(0).toUpperCase() + text.slice(1);
}
