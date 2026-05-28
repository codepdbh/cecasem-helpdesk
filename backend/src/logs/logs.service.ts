import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { PaginationDto } from '../common/dto/pagination.dto';

@Injectable()
export class LogsService {
  constructor(private readonly prisma: PrismaService) {}

  private async paged<T>(itemsPromise: Promise<T[]>, totalPromise: Promise<number>, query: PaginationDto) {
    const [items, total] = await Promise.all([itemsPromise, totalPromise]);
    return { items, meta: { page: query.page, limit: query.limit, total, totalPages: Math.ceil(total / query.limit) } };
  }

  access(query: PaginationDto) {
    return this.paged(
      this.prisma.accessLog.findMany({
        include: { user: { select: { fullName: true, username: true, profilePhotoPath: true } } },
        orderBy: { createdAt: 'desc' },
        skip: (query.page - 1) * query.limit,
        take: query.limit,
      }),
      this.prisma.accessLog.count(),
      query,
    );
  }

  tickets(query: PaginationDto) {
    return this.paged(
      this.prisma.ticketLog.findMany({
        include: { user: { select: { fullName: true, profilePhotoPath: true } }, ticket: { select: { code: true, title: true } } },
        orderBy: { createdAt: 'desc' },
        skip: (query.page - 1) * query.limit,
        take: query.limit,
      }),
      this.prisma.ticketLog.count(),
      query,
    );
  }

  devices(query: PaginationDto) {
    return this.paged(
      this.prisma.userDeviceLog.findMany({
        include: { user: { select: { fullName: true, username: true } } },
        orderBy: { createdAt: 'desc' },
        skip: (query.page - 1) * query.limit,
        take: query.limit,
      }),
      this.prisma.userDeviceLog.count(),
      query,
    );
  }
}

