import { ArgumentsHost, Catch, ExceptionFilter, HttpException, HttpStatus } from '@nestjs/common';
import { Response } from 'express';

@Catch()
export class ApiExceptionFilter implements ExceptionFilter {
  catch(exception: unknown, host: ArgumentsHost): void {
    const response = host.switchToHttp().getResponse<Response>();
    const isHttp = exception instanceof HttpException;
    const status = isHttp ? exception.getStatus() : HttpStatus.INTERNAL_SERVER_ERROR;
    const raw = isHttp ? exception.getResponse() : 'Error interno del servidor';
    const message =
      typeof raw === 'string'
        ? raw
        : Array.isArray((raw as { message?: unknown }).message)
          ? ((raw as { message: string[] }).message).join(', ')
          : String((raw as { message?: string }).message || 'Solicitud invalida');
    response.status(status).json({
      success: false,
      message,
      error: HttpStatus[status] || 'ERROR',
    });
  }
}
