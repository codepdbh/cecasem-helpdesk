import { Request } from 'express';

export interface RequestMetadata {
  ipAddress: string;
  userAgent: string;
}

export function requestMetadata(request: Request): RequestMetadata {
  const forwarded = request.headers['x-forwarded-for'];
  const forwardedIp = Array.isArray(forwarded) ? forwarded[0] : forwarded?.split(',')[0];
  const rawIp =
    forwardedIp?.trim() ||
    String(request.headers['x-real-ip'] || '') ||
    request.ip ||
    request.socket.remoteAddress ||
    'unknown';
  return {
    ipAddress: rawIp.replace(/^::ffff:/, ''),
    userAgent: request.get('user-agent') || 'Desconocido',
  };
}

