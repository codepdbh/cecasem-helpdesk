import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common';
import { Request, Response } from 'express';
import { existsSync, unlinkSync } from 'fs';
import { PrismaService } from '../prisma/prisma.service';
import { TicketsService } from '../tickets/tickets.service';
import { AuthUser } from '../common/interfaces/auth-user.interface';
import { physicalFilePath, storedFileData } from '../common/utils/file-upload.utils';
import { requestMetadata } from '../common/utils/request.utils';
import { CreateConstancyDto } from './dto/create-constancy.dto';
import { RealtimeGateway } from '../realtime/realtime.gateway';

@Injectable()
export class ConstancyPhotosService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly tickets: TicketsService,
    private readonly realtime: RealtimeGateway,
  ) {}

  async create(
    ticketId: string,
    dto: CreateConstancyDto,
    photo: Express.Multer.File | undefined,
    user: AuthUser,
    request: Request,
  ) {
    const ticket = await this.tickets.requireAccess(ticketId, user);
    if (!photo) throw new BadRequestException('Seleccione una foto de constancia.');
    const metadata = requestMetadata(request);
    const record = await this.prisma.ticketConstancyPhoto.create({
      data: {
        ticketId,
        uploadedById: user.id,
        ...storedFileData(photo, 'constancias'),
        description: dto.description,
        uploadedFromIp: metadata.ipAddress,
        uploadedUserAgent: metadata.userAgent,
      },
      include: { uploadedBy: { select: { fullName: true, profilePhotoPath: true } } },
    });
    await this.prisma.ticketLog.create({
      data: { ticketId, userId: user.id, action: 'CONSTANCY_PHOTO_ADDED', newValue: record.filePath, ...metadata },
    });
    this.realtime.ticketUpdated(ticketId, ticket.createdById);
    return record;
  }

  async findAll(ticketId: string, user: AuthUser) {
    await this.tickets.requireAccess(ticketId, user);
    return this.prisma.ticketConstancyPhoto.findMany({
      where: { ticketId },
      include: { uploadedBy: { select: { fullName: true, profilePhotoPath: true } } },
      orderBy: { createdAt: 'desc' },
    });
  }

  async download(id: string, user: AuthUser, response: Response): Promise<void> {
    const photo = await this.prisma.ticketConstancyPhoto.findUnique({ where: { id } });
    if (!photo) throw new NotFoundException('Foto no encontrada.');
    await this.tickets.requireAccess(photo.ticketId, user);
    const path = physicalFilePath(photo.filePath);
    if (!existsSync(path)) throw new NotFoundException('Archivo fisico no encontrado.');
    response.download(path, photo.originalName);
  }

  async remove(id: string, user: AuthUser) {
    const photo = await this.prisma.ticketConstancyPhoto.findUnique({ where: { id } });
    if (!photo) throw new NotFoundException('Foto no encontrada.');
    const ticket = await this.tickets.requireAccess(photo.ticketId, user);
    await this.prisma.ticketConstancyPhoto.delete({ where: { id } });
    const path = physicalFilePath(photo.filePath);
    if (existsSync(path)) unlinkSync(path);
    this.realtime.ticketUpdated(photo.ticketId, ticket.createdById);
    return { deleted: true };
  }
}
