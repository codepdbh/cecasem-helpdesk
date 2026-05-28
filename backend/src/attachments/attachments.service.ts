import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common';
import { Request, Response } from 'express';
import { existsSync } from 'fs';
import { PrismaService } from '../prisma/prisma.service';
import { TicketsService } from '../tickets/tickets.service';
import { AuthUser } from '../common/interfaces/auth-user.interface';
import { physicalFilePath, storedFileData } from '../common/utils/file-upload.utils';
import { requestMetadata } from '../common/utils/request.utils';
import { RealtimeGateway } from '../realtime/realtime.gateway';

@Injectable()
export class AttachmentsService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly tickets: TicketsService,
    private readonly realtime: RealtimeGateway,
  ) {}

  async create(ticketId: string, file: Express.Multer.File | undefined, user: AuthUser, request: Request) {
    const ticket = await this.tickets.requireAccess(ticketId, user);
    if (!file) throw new BadRequestException('Seleccione un archivo permitido.');
    const metadata = requestMetadata(request);
    const attachment = await this.prisma.ticketAttachment.create({
      data: { ticketId, uploadedById: user.id, ...storedFileData(file, 'tickets'), uploadedFromIp: metadata.ipAddress, uploadedUserAgent: metadata.userAgent },
    });
    await this.prisma.ticketLog.create({
      data: { ticketId, userId: user.id, action: 'ATTACHMENT_ADDED', newValue: attachment.originalName, ...metadata },
    });
    this.realtime.ticketUpdated(ticketId, ticket.createdById);
    return attachment;
  }

  async findAll(ticketId: string, user: AuthUser) {
    await this.tickets.requireAccess(ticketId, user);
    return this.prisma.ticketAttachment.findMany({ where: { ticketId }, orderBy: { createdAt: 'desc' } });
  }

  async download(id: string, user: AuthUser, response: Response): Promise<void> {
    const attachment = await this.prisma.ticketAttachment.findUnique({ where: { id } });
    if (!attachment) throw new NotFoundException('Archivo no encontrado.');
    await this.tickets.requireAccess(attachment.ticketId, user);
    const path = physicalFilePath(attachment.filePath);
    if (!existsSync(path)) throw new NotFoundException('Archivo fisico no encontrado.');
    response.download(path, attachment.originalName);
  }
}
