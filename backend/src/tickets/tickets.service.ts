import { BadRequestException, ForbiddenException, Injectable, NotFoundException } from '@nestjs/common';
import { Prisma, TicketStatus, UserRole, UserStatus } from '@prisma/client';
import { Request } from 'express';
import { PrismaService } from '../prisma/prisma.service';
import { AuthUser } from '../common/interfaces/auth-user.interface';
import { requestMetadata } from '../common/utils/request.utils';
import { storedFileData } from '../common/utils/file-upload.utils';
import { ticketStatusLabel } from '../common/utils/labels.utils';
import { RealtimeGateway } from '../realtime/realtime.gateway';
import { CreateTicketDto } from './dto/create-ticket.dto';
import { TicketQueryDto } from './dto/ticket-query.dto';
import { UpdateTicketDto } from './dto/update-ticket.dto';
import {
  AssignTicketDto,
  ChangeStatusDto,
  CloseTicketDto,
  ReopenTicketDto,
  ResolveTicketDto,
} from './dto/ticket-actions.dto';

export const ticketInclude = {
  category: true,
  createdBy: {
    select: { id: true, firstName: true, lastName: true, fullName: true, username: true, profilePhotoPath: true, firstAccessIp: true },
  },
  assignedTo: { select: { id: true, fullName: true, username: true, profilePhotoPath: true } },
  closedBy: { select: { id: true, fullName: true } },
  resolvedBy: { select: { id: true, fullName: true } },
  attachments: true,
  constancyPhotos: {
    include: { uploadedBy: { select: { fullName: true, profilePhotoPath: true } } },
    orderBy: { createdAt: 'desc' as const },
  },
  comments: {
    include: { user: { select: { fullName: true, profilePhotoPath: true, role: true } } },
    orderBy: { createdAt: 'asc' as const },
  },
  logs: { include: { user: { select: { fullName: true } } }, orderBy: { createdAt: 'desc' as const } },
} as const;

const completionStatuses = new Set<TicketStatus>([
  TicketStatus.RESUELTO,
  TicketStatus.CERRADO,
  TicketStatus.CANCELADO,
]);

@Injectable()
export class TicketsService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly realtime: RealtimeGateway,
  ) {}

  private ready(user: AuthUser): void {
    if (!user.isActive || user.status !== UserStatus.ACTIVE) {
      throw new ForbiddenException('Su cuenta no esta activa.');
    }
    if (user.mustChangePassword) {
      throw new ForbiddenException('Debe cambiar su contrasena temporal antes de continuar.');
    }
  }

  private async ticketCode(): Promise<string> {
    const year = new Date().getFullYear();
    const sequence = await this.prisma.ticketSequence.upsert({
      where: { year },
      create: { year, lastValue: 1 },
      update: { lastValue: { increment: 1 } },
    });
    return `TCK-${year}-${String(sequence.lastValue).padStart(4, '0')}`;
  }

  private async notifyAdmins(title: string, message: string, ticketId: string): Promise<void> {
    const admins = await this.prisma.user.findMany({
      where: { role: UserRole.SUPERADMIN, isActive: true },
      select: { id: true },
    });
    await this.prisma.notification.createMany({
      data: admins.map((admin) => ({ userId: admin.id, title, message, ticketId })),
    });
    this.realtime.adminNotificationsUpdated();
  }

  private deviceData(user: AuthUser, action: string, request: Request, message?: string) {
    const metadata = requestMetadata(request);
    return {
      userId: user.id,
      firstName: user.firstName,
      lastName: user.lastName,
      profilePhotoPath: user.profilePhotoPath,
      action,
      success: true,
      message,
      ...metadata,
      isDifferentFromFirstIp: Boolean(user.firstAccessIp && user.firstAccessIp !== metadata.ipAddress),
    };
  }

  async requireAccess(id: string, user: AuthUser) {
    const ticket = await this.prisma.ticket.findUnique({ where: { id }, include: ticketInclude });
    if (!ticket) throw new NotFoundException('Ticket no encontrado.');
    if (user.role !== UserRole.SUPERADMIN && ticket.createdById !== user.id) {
      throw new ForbiddenException('No puede acceder a este ticket.');
    }
    return ticket;
  }

  async create(dto: CreateTicketDto, file: Express.Multer.File | undefined, user: AuthUser, request: Request) {
    this.ready(user);
    const category = await this.prisma.category.findFirst({ where: { id: dto.categoryId, isActive: true } });
    if (!category) throw new NotFoundException('Categoria no disponible.');
    const metadata = requestMetadata(request);
    const description = dto.description.trim();
    const ticket = await this.prisma.ticket.create({
      data: {
        code: await this.ticketCode(),
        title: dto.title.trim(),
        categoryId: dto.categoryId,
        priority: dto.priority,
        priorityJustification: dto.priorityJustification.trim(),
        reason: dto.reason?.trim() || description,
        purpose: dto.purpose?.trim() || description,
        description,
        createdById: user.id,
        status: TicketStatus.ABIERTO,
        createdFromIp: metadata.ipAddress,
        createdUserAgent: metadata.userAgent,
        attachments: file
          ? { create: { ...storedFileData(file, 'tickets'), uploadedById: user.id, uploadedFromIp: metadata.ipAddress, uploadedUserAgent: metadata.userAgent } }
          : undefined,
        logs: {
          create: {
            userId: user.id,
            action: 'TICKET_CREATED',
            newValue: TicketStatus.ABIERTO,
            ipAddress: metadata.ipAddress,
            userAgent: metadata.userAgent,
          },
        },
      },
      include: ticketInclude,
    });
    await this.prisma.userDeviceLog.create({ data: this.deviceData(user, 'CREATE_TICKET', request, ticket.code) });
    await this.notifyAdmins('Nuevo ticket creado', `${user.fullName} registro ${ticket.code}.`, ticket.id);
    this.realtime.ticketUpdated(ticket.id, ticket.createdById);
    return ticket;
  }

  async findAll(query: TicketQueryDto, user: AuthUser) {
    this.ready(user);
    const where: Prisma.TicketWhereInput = {
      createdById: user.role === UserRole.USER ? user.id : query.createdById,
      assignedToId: query.assignedToId,
      status: query.status,
      priority: query.priority,
      categoryId: query.categoryId,
      createdAt:
        query.dateFrom || query.dateTo
          ? { gte: query.dateFrom ? new Date(query.dateFrom) : undefined, lte: query.dateTo ? new Date(query.dateTo) : undefined }
          : undefined,
      OR: query.search
        ? [
            { code: { contains: query.search, mode: 'insensitive' } },
            { title: { contains: query.search, mode: 'insensitive' } },
          ]
        : undefined,
      constancyPhotos:
        query.hasConstancyPhoto === undefined
          ? undefined
          : query.hasConstancyPhoto
            ? { some: {} }
            : { none: {} },
    };
    const [items, total] = await this.prisma.$transaction([
      this.prisma.ticket.findMany({
        where,
        include: ticketInclude,
        skip: (query.page - 1) * query.limit,
        take: query.limit,
        orderBy: { [query.sortBy]: query.sortOrder },
      }),
      this.prisma.ticket.count({ where }),
    ]);
    return { items, meta: { page: query.page, limit: query.limit, total, totalPages: Math.ceil(total / query.limit) } };
  }

  findOne(id: string, user: AuthUser) {
    this.ready(user);
    return this.requireAccess(id, user);
  }

  async update(id: string, dto: UpdateTicketDto, user: AuthUser, request: Request) {
    const previous = await this.requireAccess(id, user);
    if (previous.status === TicketStatus.CERRADO || previous.status === TicketStatus.CANCELADO) {
      throw new ForbiddenException('Un ticket finalizado no puede editarse.');
    }
    const ticket = await this.prisma.ticket.update({ where: { id }, data: dto, include: ticketInclude });
    await this.prisma.ticketLog.create({
      data: {
        ticketId: id,
        userId: user.id,
        action: dto.priority && dto.priority !== previous.priority ? 'PRIORITY_CHANGED' : 'TICKET_UPDATED',
        previousValue: JSON.stringify({ title: previous.title, priority: previous.priority }),
        newValue: JSON.stringify(dto),
        ...requestMetadata(request),
      },
    });
    this.realtime.ticketUpdated(id, previous.createdById);
    return ticket;
  }

  async status(id: string, dto: ChangeStatusDto, user: AuthUser, request: Request) {
    const previous = await this.requireAccess(id, user);
    if (previous.status === TicketStatus.CERRADO || previous.status === TicketStatus.CANCELADO) {
      throw new ForbiddenException('El ticket ya se encuentra finalizado.');
    }
    if (completionStatuses.has(dto.status)) {
      throw new BadRequestException('Use la accion especifica para resolver, cerrar o cancelar el ticket.');
    }
    const metadata = requestMetadata(request);
    await this.prisma.ticket.update({ where: { id }, data: { status: dto.status } });
    await this.prisma.ticketLog.create({
      data: { ticketId: id, userId: user.id, action: 'STATUS_CHANGED', previousValue: previous.status, newValue: dto.status, ...metadata },
    });
    await this.prisma.notification.create({
      data: { userId: previous.createdById, ticketId: id, title: 'Estado actualizado', message: `${previous.code} ahora está ${ticketStatusLabel(dto.status).toLowerCase()}.` },
    });
    this.realtime.notificationUpdated([previous.createdById]);
    this.realtime.ticketUpdated(id, previous.createdById);
    return this.requireAccess(id, user);
  }

  async assign(id: string, dto: AssignTicketDto, user: AuthUser, request: Request) {
    const assignee = await this.prisma.user.findFirst({
      where: { id: dto.assignedToId, role: UserRole.SUPERADMIN, isActive: true },
    });
    if (!assignee) throw new NotFoundException('Integrante del Equipo de Sistemas no disponible.');
    const ticket = await this.requireAccess(id, user);
    if (ticket.status === TicketStatus.CERRADO || ticket.status === TicketStatus.CANCELADO) {
      throw new ForbiddenException('No puede asignar un ticket finalizado.');
    }
    const metadata = requestMetadata(request);
    await this.prisma.ticket.update({ where: { id }, data: { assignedToId: assignee.id } });
    await this.prisma.ticketLog.create({
      data: { ticketId: id, userId: user.id, action: 'ASSIGNED', newValue: assignee.fullName, ...metadata },
    });
    await this.prisma.notification.createMany({
      data: [
        { userId: assignee.id, ticketId: id, title: 'Ticket asignado', message: `Se le asigno ${ticket.code} para atencion.` },
        { userId: ticket.createdById, ticketId: id, title: 'Su ticket esta siendo atendido', message: `${assignee.fullName} fue asignado a ${ticket.code}.` },
      ],
    });
    this.realtime.notificationUpdated([assignee.id, ticket.createdById]);
    this.realtime.ticketUpdated(id, ticket.createdById);
    return this.requireAccess(id, user);
  }

  async resolve(
    id: string,
    dto: ResolveTicketDto,
    photo: Express.Multer.File | undefined,
    user: AuthUser,
    request: Request,
  ) {
    const ticket = await this.requireAccess(id, user);
    if (completionStatuses.has(ticket.status)) {
      throw new ForbiddenException('Este ticket ya no puede marcarse como resuelto.');
    }
    const metadata = requestMetadata(request);
    await this.prisma.ticket.update({
      where: { id },
      data: {
        status: TicketStatus.RESUELTO,
        resolvedAt: new Date(),
        resolvedById: user.id,
        constancyPhotos: photo
          ? { create: { ...storedFileData(photo, 'constancias'), description: dto.constancyDescription, uploadedById: user.id, uploadedFromIp: metadata.ipAddress, uploadedUserAgent: metadata.userAgent } }
          : undefined,
      },
    });
    await this.prisma.ticketLog.create({
      data: { ticketId: id, userId: user.id, action: 'TICKET_RESOLVED', previousValue: ticket.status, newValue: TicketStatus.RESUELTO, ...metadata },
    });
    if (photo) {
      await this.prisma.ticketLog.create({
        data: { ticketId: id, userId: user.id, action: 'CONSTANCY_PHOTO_ADDED', newValue: photo.originalname, ...metadata },
      });
    }
    await this.prisma.notification.create({
      data: { userId: ticket.createdById, ticketId: id, title: 'Ticket resuelto', message: `${ticket.code} fue marcado como resuelto.` },
    });
    this.realtime.notificationUpdated([ticket.createdById]);
    this.realtime.ticketUpdated(id, ticket.createdById);
    return this.requireAccess(id, user);
  }

  async close(
    id: string,
    dto: CloseTicketDto,
    photo: Express.Multer.File | undefined,
    user: AuthUser,
    request: Request,
  ) {
    const ticket = await this.requireAccess(id, user);
    if (ticket.status === TicketStatus.CERRADO || ticket.status === TicketStatus.CANCELADO) {
      throw new ForbiddenException('Este ticket ya se encuentra finalizado.');
    }
    const metadata = requestMetadata(request);
    await this.prisma.ticket.update({
      where: { id },
      data: {
        status: TicketStatus.CERRADO,
        closedAt: new Date(),
        closedById: user.id,
        closeComment: dto.closeComment,
        constancyPhotos: photo
          ? { create: { ...storedFileData(photo, 'constancias'), description: dto.constancyDescription, uploadedById: user.id, uploadedFromIp: metadata.ipAddress, uploadedUserAgent: metadata.userAgent } }
          : undefined,
      },
    });
    await this.prisma.ticketLog.create({
      data: { ticketId: id, userId: user.id, action: 'TICKET_CLOSED', previousValue: ticket.status, newValue: TicketStatus.CERRADO, ...metadata },
    });
    if (photo) {
      await this.prisma.ticketLog.create({
        data: { ticketId: id, userId: user.id, action: 'CONSTANCY_PHOTO_ADDED', newValue: photo.originalname, ...metadata },
      });
    }
    await this.prisma.userDeviceLog.create({ data: this.deviceData(user, 'CLOSE_TICKET', request, ticket.code) });
    await this.prisma.notification.create({
      data: {
        userId: ticket.createdById,
        ticketId: id,
        title: photo ? 'Ticket cerrado con foto de constancia' : 'Ticket cerrado',
        message: `${ticket.code} fue cerrado por el Equipo de Sistemas.`,
      },
    });
    this.realtime.notificationUpdated([ticket.createdById]);
    this.realtime.ticketUpdated(id, ticket.createdById);
    return this.requireAccess(id, user);
  }

  async reopen(id: string, dto: ReopenTicketDto, user: AuthUser, request: Request) {
    this.ready(user);
    const ticket = await this.requireAccess(id, user);
    if (ticket.status !== TicketStatus.CERRADO && ticket.status !== TicketStatus.RESUELTO) {
      throw new ForbiddenException('Solo se puede reabrir un ticket cerrado o resuelto.');
    }
    const metadata = requestMetadata(request);
    await this.prisma.ticket.update({
      where: { id },
      data: {
        status: TicketStatus.REABIERTO,
        reopenedAt: new Date(),
        reopenedById: user.id,
        comments: { create: { userId: user.id, comment: `Motivo de reapertura: ${dto.reason}`, createdFromIp: metadata.ipAddress, createdUserAgent: metadata.userAgent } },
      },
    });
    await this.prisma.ticketLog.create({
      data: { ticketId: id, userId: user.id, action: 'TICKET_REOPENED', previousValue: ticket.status, newValue: dto.reason, ...metadata },
    });
    await this.prisma.userDeviceLog.create({ data: this.deviceData(user, 'REOPEN_TICKET', request, ticket.code) });
    await this.notifyAdmins('Ticket reabierto', `${ticket.code}: ${dto.reason}`, id);
    this.realtime.ticketUpdated(id, ticket.createdById);
    return this.requireAccess(id, user);
  }

  async cancel(id: string, user: AuthUser, request: Request) {
    const ticket = await this.requireAccess(id, user);
    if (ticket.status === TicketStatus.CERRADO || ticket.status === TicketStatus.CANCELADO) {
      throw new ForbiddenException('Este ticket ya se encuentra finalizado.');
    }
    const metadata = requestMetadata(request);
    await this.prisma.ticket.update({ where: { id }, data: { status: TicketStatus.CANCELADO } });
    await this.prisma.ticketLog.create({
      data: { ticketId: id, userId: user.id, action: 'TICKET_CANCELLED', previousValue: ticket.status, newValue: TicketStatus.CANCELADO, ...metadata },
    });
    await this.prisma.notification.create({
      data: { userId: ticket.createdById, ticketId: id, title: 'Ticket cancelado', message: `${ticket.code} fue cancelado por el Equipo de Sistemas.` },
    });
    this.realtime.notificationUpdated([ticket.createdById]);
    this.realtime.ticketUpdated(id, ticket.createdById);
    return this.requireAccess(id, user);
  }
}
