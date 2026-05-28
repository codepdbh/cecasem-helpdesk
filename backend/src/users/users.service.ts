import { Injectable, NotFoundException } from '@nestjs/common';
import { Prisma, UserRole, UserStatus } from '@prisma/client';
import * as bcrypt from 'bcryptjs';
import { PrismaService } from '../prisma/prisma.service';
import { AuthUser } from '../common/interfaces/auth-user.interface';
import { requestMetadata } from '../common/utils/request.utils';
import { Request } from 'express';
import { CreateUserDto } from './dto/create-user.dto';
import { UpdateUserDto } from './dto/update-user.dto';
import { AdminPasswordDto } from './dto/admin-password.dto';
import { RejectUserDto } from './dto/reject-user.dto';
import { UserQueryDto } from './dto/user-query.dto';
import { RealtimeGateway } from '../realtime/realtime.gateway';

const userSelect = {
  id: true,
  firstName: true,
  lastName: true,
  fullName: true,
  username: true,
  email: true,
  phone: true,
  area: true,
  position: true,
  profilePhotoPath: true,
  role: true,
  status: true,
  isActive: true,
  mustChangePassword: true,
  firstAccessIp: true,
  firstAccessUserAgent: true,
  firstAccessAt: true,
  lastLoginIp: true,
  lastLoginUserAgent: true,
  lastLoginAt: true,
  createdAt: true,
} as const;

@Injectable()
export class UsersService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly realtime: RealtimeGateway,
  ) {}

  private async audit(
    administrator: AuthUser,
    action: string,
    request: Request,
    message: string,
  ): Promise<void> {
    await this.prisma.accessLog.create({
      data: {
        userId: administrator.id,
        action,
        success: true,
        message,
        ...requestMetadata(request),
      },
    });
  }

  private usernameBase(firstName: string, lastName: string): string {
    return `${firstName}.${lastName}`
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '')
      .replace(/[^A-Za-z0-9.]/g, '')
      .toLowerCase();
  }

  private async availableUsername(base: string): Promise<string> {
    let username = base;
    let number = 2;
    while (await this.prisma.user.findUnique({ where: { username } })) username = `${base}${number++}`;
    return username;
  }

  async findAll(query: UserQueryDto) {
    const where: Prisma.UserWhereInput = {
      status: query.status,
      OR: query.search
        ? [
            { fullName: { contains: query.search, mode: 'insensitive' } },
            { username: { contains: query.search, mode: 'insensitive' } },
          ]
        : undefined,
    };
    const [items, total] = await this.prisma.$transaction([
      this.prisma.user.findMany({
        where,
        select: userSelect,
        skip: (query.page - 1) * query.limit,
        take: query.limit,
        orderBy: { createdAt: query.sortOrder },
      }),
      this.prisma.user.count({ where }),
    ]);
    return { items, meta: { page: query.page, limit: query.limit, total, totalPages: Math.ceil(total / query.limit) } };
  }

  pending() {
    return this.prisma.user.findMany({
      where: { status: UserStatus.PENDING },
      select: userSelect,
      orderBy: { createdAt: 'asc' },
    });
  }

  async findOne(id: string) {
    const user = await this.prisma.user.findUnique({ where: { id }, select: userSelect });
    if (!user) throw new NotFoundException('Usuario no encontrado.');
    return user;
  }

  async create(dto: CreateUserDto, administrator: AuthUser, request: Request) {
    const username = await this.availableUsername(
      dto.username?.trim().toLowerCase() || this.usernameBase(dto.firstName, dto.lastName),
    );
    const user = await this.prisma.user.create({
      data: {
        firstName: dto.firstName.trim(),
        lastName: dto.lastName.trim(),
        fullName: `${dto.firstName.trim()} ${dto.lastName.trim()}`,
        username,
        passwordHash: await bcrypt.hash(dto.password, 12),
        email: dto.email,
        phone: dto.phone,
        area: dto.area,
        position: dto.position,
        role: dto.role,
        status: dto.status,
        isActive: dto.status === UserStatus.ACTIVE,
        mustChangePassword: true,
      },
      select: userSelect,
    });
    await this.audit(administrator, 'USER_CREATED', request, `Usuario creado: ${username}`);
    return user;
  }

  async update(id: string, dto: UpdateUserDto, administrator: AuthUser, request: Request) {
    const current = await this.findOne(id);
    const firstName = dto.firstName?.trim() || current.firstName;
    const lastName = dto.lastName?.trim() || current.lastName;
    const user = await this.prisma.user.update({
      where: { id },
      data: {
        ...dto,
        firstName,
        lastName,
        fullName: `${firstName} ${lastName}`,
        email: dto.email || undefined,
      },
      select: userSelect,
    });
    await this.audit(administrator, 'USER_UPDATED', request, `Usuario actualizado: ${user.username}`);
    return user;
  }

  async password(id: string, dto: AdminPasswordDto, administrator: AuthUser, request: Request) {
    const user = await this.prisma.user.update({
      where: { id },
      data: {
        passwordHash: await bcrypt.hash(dto.newPassword, 12),
        mustChangePassword: dto.mustChangePassword,
      },
      select: userSelect,
    });
    await this.audit(administrator, 'PASSWORD_CHANGED', request, `Contrasena restablecida: ${user.username}`);
    return user;
  }

  async approve(id: string, administrator: AuthUser, request: Request) {
    const user = await this.prisma.user.update({
      where: { id },
      data: {
        status: UserStatus.ACTIVE,
        isActive: true,
        approvedById: administrator.id,
        approvedAt: new Date(),
        rejectionReason: null,
      },
      select: userSelect,
    });
    await this.prisma.notification.create({
      data: { userId: id, title: 'Cuenta aprobada', message: 'El Equipo de Sistemas aprobo tu acceso.' },
    });
    this.realtime.notificationUpdated([id]);
    this.realtime.adminNotificationsUpdated();
    await this.audit(administrator, 'USER_APPROVED', request, `Usuario aprobado: ${user.username}`);
    return user;
  }

  async reject(id: string, dto: RejectUserDto, administrator: AuthUser, request: Request) {
    const user = await this.prisma.user.update({
      where: { id },
      data: {
        status: UserStatus.REJECTED,
        isActive: false,
        rejectedById: administrator.id,
        rejectedAt: new Date(),
        rejectionReason: dto.reason,
      },
      select: userSelect,
    });
    await this.prisma.notification.create({
      data: { userId: id, title: 'Cuenta rechazada', message: `Motivo: ${dto.reason}` },
    });
    this.realtime.notificationUpdated([id]);
    this.realtime.adminNotificationsUpdated();
    await this.audit(administrator, 'USER_REJECTED', request, `Usuario rechazado: ${user.username}`);
    return user;
  }

  async activate(id: string, administrator: AuthUser, request: Request) {
    const user = await this.prisma.user.update({
      where: { id },
      data: { status: UserStatus.ACTIVE, isActive: true },
      select: userSelect,
    });
    await this.audit(administrator, 'USER_ACTIVATED', request, `Usuario activado: ${user.username}`);
    return user;
  }

  async deactivate(id: string, administrator: AuthUser, request: Request) {
    const user = await this.prisma.user.update({
      where: { id },
      data: { status: UserStatus.DISABLED, isActive: false },
      select: userSelect,
    });
    await this.audit(administrator, 'USER_DISABLED', request, `Usuario desactivado: ${user.username}`);
    return user;
  }

  async ipHistory(id: string) {
    await this.findOne(id);
    return this.prisma.userDeviceLog.findMany({ where: { userId: id }, orderBy: { createdAt: 'desc' } });
  }
}
