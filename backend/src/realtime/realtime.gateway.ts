import { JwtService } from '@nestjs/jwt';
import { UserRole } from '@prisma/client';
import {
  OnGatewayConnection,
  WebSocketGateway,
  WebSocketServer,
} from '@nestjs/websockets';
import { Server, Socket } from 'socket.io';
import { PrismaService } from '../prisma/prisma.service';

@WebSocketGateway({
  namespace: '/live',
})
export class RealtimeGateway implements OnGatewayConnection {
  @WebSocketServer()
  private server!: Server;

  constructor(
    private readonly jwt: JwtService,
    private readonly prisma: PrismaService,
  ) {}

  async handleConnection(client: Socket): Promise<void> {
    try {
      const token = String(client.handshake.auth?.token || '');
      const payload = await this.jwt.verifyAsync<{ sub: string }>(token);
      const user = await this.prisma.user.findUnique({
        where: { id: payload.sub },
        select: { id: true, role: true, isActive: true },
      });
      if (!user?.isActive) throw new Error('Cuenta no disponible');

      client.data.userId = user.id;
      await client.join(`user:${user.id}`);
      if (user.role === UserRole.SUPERADMIN) await client.join('admins');
      client.emit('live.ready', { connected: true });
    } catch {
      client.disconnect(true);
    }
  }

  notificationUpdated(userIds: string[]): void {
    for (const userId of new Set(userIds)) {
      this.server.to(`user:${userId}`).emit('notification.updated');
    }
  }

  adminNotificationsUpdated(): void {
    this.server.to('admins').emit('notification.updated');
    this.server.to('admins').emit('administration.updated');
  }

  ticketUpdated(ticketId: string, createdById: string): void {
    this.server.to('admins').to(`user:${createdById}`).emit('ticket.updated', { ticketId });
  }
}
