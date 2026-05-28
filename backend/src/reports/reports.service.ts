import { Injectable } from '@nestjs/common';
import { Prisma, TicketStatus, UserStatus } from '@prisma/client';
import { Response } from 'express';
import PDFDocument from 'pdfkit';
import { existsSync } from 'fs';
import { PrismaService } from '../prisma/prisma.service';
import { physicalFilePath } from '../common/utils/file-upload.utils';
import { auditActionLabel, ticketPriorityLabel, ticketStatusLabel } from '../common/utils/labels.utils';
import { ReportQueryDto } from './dto/report-query.dto';

@Injectable()
export class ReportsService {
  constructor(private readonly prisma: PrismaService) {}

  private where(query: ReportQueryDto): Prisma.TicketWhereInput {
    return {
      status: query.status,
      priority: query.priority,
      categoryId: query.categoryId,
      createdById: query.userId,
      createdAt:
        query.dateFrom || query.dateTo
          ? { gte: query.dateFrom ? new Date(query.dateFrom) : undefined, lte: query.dateTo ? new Date(query.dateTo) : undefined }
          : undefined,
      constancyPhotos:
        query.hasConstancyPhoto === undefined
          ? undefined
          : query.hasConstancyPhoto
            ? { some: {} }
            : { none: {} },
    };
  }

  private tickets(query: ReportQueryDto) {
    return this.prisma.ticket.findMany({
      where: this.where(query),
      include: {
        category: true,
        createdBy: { select: { firstName: true, lastName: true, fullName: true, profilePhotoPath: true, firstAccessIp: true } },
        constancyPhotos: true,
        logs: query.includeActions,
      },
      orderBy: { createdAt: 'desc' },
    });
  }

  async summary() {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const [
      totalTickets,
      openTickets,
      processingTickets,
      criticalTickets,
      closedToday,
      withConstancy,
      users,
      pendingUsers,
      byStatus,
      byPriority,
      byCategory,
      resolutions,
    ] = await this.prisma.$transaction([
      this.prisma.ticket.count(),
      this.prisma.ticket.count({ where: { status: TicketStatus.ABIERTO } }),
      this.prisma.ticket.count({ where: { status: TicketStatus.EN_PROCESO } }),
      this.prisma.ticket.count({ where: { priority: 'CRITICA' } }),
      this.prisma.ticket.count({ where: { status: TicketStatus.CERRADO, closedAt: { gte: today } } }),
      this.prisma.ticket.count({ where: { constancyPhotos: { some: {} } } }),
      this.prisma.user.count(),
      this.prisma.user.count({ where: { status: UserStatus.PENDING } }),
      this.prisma.ticket.groupBy({ by: ['status'], _count: true, orderBy: { status: 'asc' } }),
      this.prisma.ticket.groupBy({ by: ['priority'], _count: true, orderBy: { priority: 'asc' } }),
      this.prisma.ticket.groupBy({ by: ['categoryId'], _count: true, orderBy: { categoryId: 'asc' } }),
      this.prisma.ticket.findMany({ where: { resolvedAt: { not: null } }, select: { createdAt: true, resolvedAt: true } }),
    ]);
    const categories = await this.prisma.category.findMany({ select: { id: true, name: true } });
    const averageResolutionHours = resolutions.length
      ? resolutions.reduce((sum, item) => sum + ((item.resolvedAt?.getTime() || 0) - item.createdAt.getTime()) / 3600000, 0) / resolutions.length
      : 0;
    return {
      totalTickets,
      openTickets,
      processingTickets,
      criticalTickets,
      closedToday,
      withConstancy,
      withoutConstancy: totalTickets - withConstancy,
      users,
      pendingUsers,
      averageResolutionHours: Number(averageResolutionHours.toFixed(2)),
      byStatus,
      byPriority,
      byCategory: byCategory.map((item) => ({ ...item, name: categories.find((category) => category.id === item.categoryId)?.name || 'Sin categoria' })),
    };
  }

  byStatus() {
    return this.prisma.ticket.groupBy({ by: ['status'], _count: true, orderBy: { status: 'asc' } });
  }

  byPriority() {
    return this.prisma.ticket.groupBy({ by: ['priority'], _count: true, orderBy: { priority: 'asc' } });
  }

  async byCategory() {
    const groups = await this.prisma.ticket.groupBy({ by: ['categoryId'], _count: true, orderBy: { categoryId: 'asc' } });
    const categories = await this.prisma.category.findMany();
    return groups.map((group) => ({ category: categories.find((item) => item.id === group.categoryId)?.name, count: group._count }));
  }

  async byUser() {
    const groups = await this.prisma.ticket.groupBy({ by: ['createdById'], _count: true, orderBy: { createdById: 'asc' } });
    const users = await this.prisma.user.findMany({ select: { id: true, fullName: true, username: true } });
    return groups.map((group) => ({ user: users.find((item) => item.id === group.createdById), count: group._count }));
  }

  async byMonth() {
    const records = await this.prisma.ticket.findMany({ select: { createdAt: true } });
    return Object.entries(
      records.reduce<Record<string, number>>((months, ticket) => {
        const month = ticket.createdAt.toISOString().slice(0, 7);
        months[month] = (months[month] || 0) + 1;
        return months;
      }, {}),
    ).map(([month, count]) => ({ month, count }));
  }

  byIp() {
    return this.prisma.ticket.groupBy({ by: ['createdFromIp'], _count: true, orderBy: { _count: { createdFromIp: 'desc' } }, take: 20 });
  }

  withConstancy(query: ReportQueryDto) {
    return this.prisma.ticket.findMany({
      where: { ...this.where(query), constancyPhotos: { some: {} } },
      include: { category: true, createdBy: { select: { fullName: true } }, constancyPhotos: true },
      orderBy: { createdAt: 'desc' },
    });
  }

  async exportCsv(query: ReportQueryDto, response: Response): Promise<void> {
    const records = await this.tickets(query);
    const quote = (value: unknown) => `"${String(value ?? '').replace(/"/g, '""')}"`;
    const header = [
      'Código', 'Título', 'Usuario', 'Nombre', 'Apellido', 'Categoría', 'Prioridad', 'Estado',
      'Fecha de creación', 'Fecha de cierre', 'IP de creación', 'IP de primer ingreso', 'Tiene constancia', 'Rutas de constancia',
    ];
    const lines = records.map((ticket) => [
      ticket.code,
      ticket.title,
      ticket.createdBy.fullName,
      ticket.createdBy.firstName,
      ticket.createdBy.lastName,
      ticket.category.name,
      ticketPriorityLabel(ticket.priority),
      ticketStatusLabel(ticket.status),
      ticket.createdAt.toISOString(),
      ticket.closedAt?.toISOString() || '',
      query.includeCreationIp ? ticket.createdFromIp : '',
      query.includeCreationIp ? ticket.createdBy.firstAccessIp || '' : '',
      ticket.constancyPhotos.length ? 'Si' : 'No',
      ticket.constancyPhotos.map((photo) => photo.filePath).join(' | '),
    ]);
    const csv = [header, ...lines].map((line) => line.map(quote).join(';')).join('\r\n');
    response.setHeader('Content-Type', 'text/csv; charset=utf-8');
    response.setHeader('Content-Disposition', 'attachment; filename="reporte_cecasem_tickets.csv"');
    response.send(`\uFEFF${csv}`);
  }

  async exportPdf(query: ReportQueryDto, response: Response): Promise<void> {
    const records = await this.tickets(query);
    response.setHeader('Content-Type', 'application/pdf');
    response.setHeader('Content-Disposition', 'attachment; filename="reporte_cecasem_tickets.pdf"');
    const document = new PDFDocument({ margin: 38, size: 'A4' });
    document.pipe(response);
    document.fontSize(18).fillColor('#123653').text('Mesa de Ayuda CECASEM');
    document.fontSize(11).fillColor('#4b6275').text('Reporte institucional de tickets');
    document.text(`Generado: ${new Date().toLocaleString('es-BO')}`);
    document.moveDown();
    for (const ticket of records) {
      if (document.y > 700) document.addPage();
      document.fontSize(11).fillColor('#123653').text(`${ticket.code} | ${ticket.title}`);
      document.fontSize(9).fillColor('#273747').text(
        `${ticket.createdBy.fullName} | ${ticket.category.name} | ${ticketPriorityLabel(ticket.priority)} | ${ticketStatusLabel(ticket.status)} | ${ticket.createdAt.toLocaleDateString('es-BO')}`,
      );
      if (query.includeCreationIp) document.text(`IP de creacion: ${ticket.createdFromIp} | IP inicial: ${ticket.createdBy.firstAccessIp || 'No registrada'}`);
      if (query.includeProfilePhotos && ticket.createdBy.profilePhotoPath) {
        const path = physicalFilePath(ticket.createdBy.profilePhotoPath);
        if (existsSync(path)) document.image(path, { fit: [42, 42] }).moveDown(0.3);
      }
      if (query.includeConstancyPhotos) {
        if (!ticket.constancyPhotos.length) {
          document.text('Sin foto de constancia registrada');
        } else {
          for (const photo of ticket.constancyPhotos) {
            const path = physicalFilePath(photo.filePath);
            if (existsSync(path)) document.image(path, { fit: [125, 85] }).moveDown(0.3);
          }
        }
      }
      if (query.includeActions) {
        document.text(`Acciones registradas: ${ticket.logs.map((log) => auditActionLabel(log.action)).join(', ') || 'Sin acciones'}`);
      }
      document.moveDown().strokeColor('#dde6ed').moveTo(38, document.y).lineTo(557, document.y).stroke().moveDown();
    }
    document.moveDown().fontSize(9).fillColor('#4b6275').text('Espacio de constancia / firma: ______________________________');
    document.end();
  }
}
