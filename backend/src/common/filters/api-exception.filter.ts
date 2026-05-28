import { ArgumentsHost, Catch, ExceptionFilter, HttpException, HttpStatus, Logger } from '@nestjs/common';
import { Response } from 'express';

@Catch()
export class ApiExceptionFilter implements ExceptionFilter {
  private readonly logger = new Logger(ApiExceptionFilter.name);

  catch(exception: unknown, host: ArgumentsHost): void {
    const response = host.switchToHttp().getResponse<Response>();
    const isHttp = exception instanceof HttpException;
    const multerMessage = this.multerMessage(exception);
    const status = isHttp
      ? exception.getStatus()
      : multerMessage
        ? HttpStatus.BAD_REQUEST
        : HttpStatus.INTERNAL_SERVER_ERROR;
    const raw = isHttp ? exception.getResponse() : multerMessage || 'Error interno del servidor';
    const message = 
      typeof raw === 'string'
        ? raw
        : Array.isArray((raw as { message?: unknown }).message)
          ? ((raw as { message: string[] }).message).join(', ')
          : String((raw as { message?: string }).message || 'Solicitud invalida');
    if (!isHttp && !multerMessage) {
      const error = exception as { stack?: string; message?: string };
      this.logger.error(error.message || 'Unhandled exception', error.stack);
    }
    response.status(status).json({
      success: false,
      message,
      error: HttpStatus[status] || 'ERROR',
    });
  }

  private multerMessage(exception: unknown): string | undefined {
    const error = exception as { code?: string; name?: string; message?: string; field?: string };
    if (error?.name !== 'MulterError') return undefined;
    if (error.code === 'LIMIT_FILE_SIZE') return 'La imagen es demasiado grande. Sube una foto de hasta 3 MB.';
    if (error.code === 'LIMIT_UNEXPECTED_FILE') return `Archivo no esperado${error.field ? `: ${error.field}` : ''}.`;
    return error.message || 'No se pudo procesar el archivo seleccionado.';
  }
}
