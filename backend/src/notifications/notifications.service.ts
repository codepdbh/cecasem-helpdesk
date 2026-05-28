import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { AuthUser } from '../common/interfaces/auth-user.interface';
import { RealtimeGateway } from '../realtime/realtime.gateway';

@Injectable()
export class NotificationsService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly realtime: RealtimeGateway,
  ) {}

  findAll(user: AuthUser) {
    return this.prisma.notification.findMany({
      where: { userId: user.id },
      include: { ticket: { select: { id: true, code: true, title: true } } },
      orderBy: { createdAt: 'desc' },
      take: 50,
    });
  }

  async read(id: string, user: AuthUser) {
    await this.prisma.notification.updateMany({ where: { id, userId: user.id }, data: { isRead: true } });
    this.realtime.notificationUpdated([user.id]);
    return { read: true };
  }

  async readAll(user: AuthUser) {
    await this.prisma.notification.updateMany({ where: { userId: user.id, isRead: false }, data: { isRead: true } });
    this.realtime.notificationUpdated([user.id]);
    return { read: true };
  }
}
