import { Injectable } from '@nestjs/common';
import { UserRole } from '@prisma/client';
import { Request } from 'express';
import { PrismaService } from '../prisma/prisma.service';
import { TicketsService } from '../tickets/tickets.service';
import { AuthUser } from '../common/interfaces/auth-user.interface';
import { requestMetadata } from '../common/utils/request.utils';
import { CreateCommentDto } from './dto/create-comment.dto';
import { RealtimeGateway } from '../realtime/realtime.gateway';

@Injectable()
export class CommentsService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly tickets: TicketsService,
    private readonly realtime: RealtimeGateway,
  ) {}

  async findAll(ticketId: string, user: AuthUser) {
    await this.tickets.requireAccess(ticketId, user);
    return this.prisma.ticketComment.findMany({
      where: { ticketId },
      include: { user: { select: { fullName: true, profilePhotoPath: true, role: true } } },
      orderBy: { createdAt: 'asc' },
    });
  }

  async create(ticketId: string, dto: CreateCommentDto, user: AuthUser, request: Request) {
    const ticket = await this.tickets.requireAccess(ticketId, user);
    const metadata = requestMetadata(request);
    const comment = await this.prisma.ticketComment.create({
      data: { ticketId, userId: user.id, comment: dto.comment.trim(), createdFromIp: metadata.ipAddress, createdUserAgent: metadata.userAgent },
      include: { user: { select: { fullName: true, profilePhotoPath: true, role: true } } },
    });
    await this.prisma.ticketLog.create({
      data: { ticketId, userId: user.id, action: 'COMMENT_ADDED', newValue: dto.comment.trim(), ...metadata },
    });
    await this.prisma.userDeviceLog.create({
      data: {
        userId: user.id,
        firstName: user.firstName,
        lastName: user.lastName,
        profilePhotoPath: user.profilePhotoPath,
        action: 'COMMENT_TICKET',
        ...metadata,
        isDifferentFromFirstIp: Boolean(user.firstAccessIp && user.firstAccessIp !== metadata.ipAddress),
      },
    });
    if (user.role === UserRole.SUPERADMIN) {
      await this.prisma.notification.create({
        data: { userId: ticket.createdById, ticketId, title: 'Respuesta en tu ticket', message: `El Equipo de Sistemas respondio en ${ticket.code}.` },
      });
      this.realtime.notificationUpdated([ticket.createdById]);
    } else {
      const admins = await this.prisma.user.findMany({
        where: { role: UserRole.SUPERADMIN, isActive: true },
        select: { id: true },
      });
      await this.prisma.notification.createMany({
        data: admins.map((admin) => ({
          userId: admin.id,
          ticketId,
          title: 'Nueva respuesta de usuario',
          message: `${user.fullName} respondio en ${ticket.code}.`,
        })),
      });
      this.realtime.adminNotificationsUpdated();
    }
    this.realtime.ticketUpdated(ticketId, ticket.createdById);
    return comment;
  }
}
