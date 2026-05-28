import { INestApplicationContext } from '@nestjs/common';
import { IoAdapter } from '@nestjs/platform-socket.io';
import { ServerOptions } from 'socket.io';
import { createCorsOriginDelegate } from '../common/utils/cors.utils';

export class RealtimeSocketIoAdapter extends IoAdapter {
  constructor(
    app: INestApplicationContext,
    private readonly allowedOrigins: string[],
  ) {
    super(app);
  }

  createIOServer(port: number, options?: ServerOptions): unknown {
    return super.createIOServer(port, {
      ...options,
      cors: {
        origin: createCorsOriginDelegate(this.allowedOrigins),
        credentials: true,
      },
    });
  }
}
