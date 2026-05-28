import {
  BadRequestException,
  ForbiddenException,
  Injectable,
  UnauthorizedException,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { JwtService } from '@nestjs/jwt';
import { Prisma, UserRole, UserStatus } from '@prisma/client';
import * as bcrypt from 'bcryptjs';
import { PrismaService } from '../prisma/prisma.service';
import { RequestMetadata, requestMetadata } from '../common/utils/request.utils';
import { storedFileData } from '../common/utils/file-upload.utils';
import { AuthUser } from '../common/interfaces/auth-user.interface';
import { FirstAccessDto } from './dto/first-access.dto';
import { LoginDto } from './dto/login.dto';
import { ChangePasswordDto } from './dto/change-password.dto';
import { PasswordResetRequestDto } from './dto/password-reset-request.dto';
import { UpdateProfileDto } from './dto/update-profile.dto';
import { Request } from 'express';
import { RealtimeGateway } from '../realtime/realtime.gateway';

const publicUserSelect = {
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
export class AuthService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly jwt: JwtService,
    private readonly config: ConfigService,
    private readonly realtime: RealtimeGateway,
  ) {}

  private normalizedName(value: string): string {
    return value
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '')
      .replace(/[^A-Za-z0-9 ]/g, '')
      .trim();
  }

  private async nextUsername(firstName: string, lastName: string): Promise<string> {
    const base = `${this.normalizedName(firstName).split(' ')[0]}.${this.normalizedName(lastName).split(' ')[0]}`
      .toLowerCase()
      .replace(/\s+/g, '');
    let username = base;
    let suffix = 2;
    while (await this.prisma.user.findUnique({ where: { username } })) {
      username = `${base}${suffix++}`;
    }
    return username;
  }

  private async deviceLog(
    user: { id: string; firstName: string; lastName: string; profilePhotoPath: string | null; firstAccessIp: string | null } | null,
    action: string,
    metadata: RequestMetadata,
    success: boolean,
    message?: string,
    usernameAttempt?: string,
  ): Promise<void> {
    await this.prisma.userDeviceLog.create({
      data: {
        userId: user?.id,
        firstName: user?.firstName,
        lastName: user?.lastName,
        profilePhotoPath: user?.profilePhotoPath,
        usernameAttempt,
        ...metadata,
        action,
        success,
        message,
        isDifferentFromFirstIp: Boolean(
          user?.firstAccessIp && user.firstAccessIp !== metadata.ipAddress,
        ),
      },
    });
  }

  private async accessLog(
    userId: string | undefined,
    action: string,
    metadata: RequestMetadata,
    success: boolean,
    message?: string,
    usernameAttempt?: string,
  ): Promise<void> {
    await this.prisma.accessLog.create({
      data: { userId, usernameAttempt, action, success, message, ...metadata },
    });
  }

  networkInfo(request: Request) {
    return { detectedIp: requestMetadata(request).ipAddress };
  }

  async firstAccess(dto: FirstAccessDto, photo: Express.Multer.File | undefined, request: Request) {
    const metadata = requestMetadata(request);
    if (!photo) throw new BadRequestException('La foto de perfil es obligatoria.');
    if (dto.password !== dto.confirmPassword) {
      await this.accessLog(undefined, 'FIRST_ACCESS_REGISTER_FAILED', metadata, false, 'Las contrasenas no coinciden.');
      throw new BadRequestException('Las contrasenas no coinciden.');
    }
    const fullName = `${dto.firstName.trim()} ${dto.lastName.trim()}`;
    const username = await this.nextUsername(dto.firstName, dto.lastName);
    const requireApproval = this.config.get<string>('REQUIRE_USER_APPROVAL', 'true') === 'true';
    const user = await this.prisma.user.create({
      data: {
        firstName: dto.firstName.trim(),
        lastName: dto.lastName.trim(),
        fullName,
        username,
        email: dto.email || undefined,
        phone: dto.phone,
        area: dto.area,
        position: dto.position,
        profilePhotoPath: storedFileData(photo, 'profiles').filePath,
        passwordHash: await bcrypt.hash(dto.password, 12),
        role: UserRole.USER,
        status: requireApproval ? UserStatus.PENDING : UserStatus.ACTIVE,
        isActive: !requireApproval,
        firstAccessIp: metadata.ipAddress,
        firstAccessUserAgent: metadata.userAgent,
        firstAccessAt: new Date(),
      },
      select: publicUserSelect,
    });
    await this.deviceLog(user, 'FIRST_ACCESS_REGISTER', metadata, true);
    await this.accessLog(user.id, 'FIRST_ACCESS_REGISTER_SUCCESS', metadata, true);
    if (requireApproval) {
      const administrators = await this.prisma.user.findMany({
        where: { role: UserRole.SUPERADMIN, isActive: true },
        select: { id: true },
      });
      await this.prisma.notification.createMany({
        data: administrators.map((admin) => ({
          userId: admin.id,
          title: 'Usuario pendiente de aprobacion',
          message: `${fullName} realizo su primer ingreso desde ${metadata.ipAddress}.`,
        })),
      });
      this.realtime.adminNotificationsUpdated();
    }
    return {
      user,
      detectedIp: metadata.ipAddress,
      requiresApproval: requireApproval,
      message: requireApproval
        ? 'Tus datos fueron registrados. El Equipo de Sistemas revisara tu cuenta.'
        : 'Tus datos fueron registrados correctamente. Ya puedes iniciar sesion.',
    };
  }

  async login(dto: LoginDto, request: Request) {
    const metadata = requestMetadata(request);
    const identifier = dto.identifier.trim();
    const user = await this.prisma.user.findFirst({
      where: {
        OR: [
          { username: identifier.toLowerCase() },
          { fullName: { equals: identifier, mode: 'insensitive' } },
        ],
      },
    });
    if (!user || !(await bcrypt.compare(dto.password, user.passwordHash))) {
      await this.accessLog(user?.id, 'LOGIN_FAILED', metadata, false, 'Credenciales invalidas.', identifier);
      await this.deviceLog(user, 'LOGIN_FAILED', metadata, false, 'Credenciales invalidas.', identifier);
      throw new UnauthorizedException('Credenciales invalidas.');
    }
    if (user.status !== UserStatus.ACTIVE || !user.isActive) {
      await this.accessLog(user.id, 'LOGIN_FAILED', metadata, false, `Estado de cuenta: ${user.status}`, identifier);
      throw new ForbiddenException(
        user.status === UserStatus.PENDING
          ? 'Tu cuenta esta pendiente de aprobacion por el Equipo de Sistemas.'
          : 'Tu cuenta no se encuentra activa.',
      );
    }
    const differentIp = Boolean(user.firstAccessIp && user.firstAccessIp !== metadata.ipAddress);
    const updated = await this.prisma.user.update({
      where: { id: user.id },
      data: {
        lastLoginAt: new Date(),
        lastLoginIp: metadata.ipAddress,
        lastLoginUserAgent: metadata.userAgent,
      },
      select: publicUserSelect,
    });
    const alert = differentIp
      ? 'Inicio de sesion desde IP diferente a la IP de primer ingreso'
      : undefined;
    await this.accessLog(user.id, 'LOGIN_SUCCESS', metadata, true, alert, identifier);
    await this.deviceLog(user, 'LOGIN_SUCCESS', metadata, true, alert, identifier);
    if (differentIp) {
      const administrators = await this.prisma.user.findMany({
        where: { role: UserRole.SUPERADMIN, isActive: true },
        select: { id: true },
      });
      await this.prisma.notification.createMany({
        data: administrators.map(({ id }) => ({
          userId: id,
          title: 'Alerta de IP diferente',
          message: `${user.fullName} inicio sesion desde ${metadata.ipAddress}; su IP inicial es ${user.firstAccessIp}.`,
        })),
      });
      this.realtime.adminNotificationsUpdated();
    }
    return {
      accessToken: await this.jwt.signAsync({ sub: user.id, role: user.role }),
      user: updated,
      mustChangePassword: user.mustChangePassword,
      ipAlert: alert,
    };
  }

  async passwordResetRequest(dto: PasswordResetRequestDto, request: Request) {
    const metadata = requestMetadata(request);
    const identifier = dto.identifier.trim();
    const email = dto.email?.trim().toLowerCase();
    const phone = dto.phone?.trim();
    const notes = dto.notes?.trim();

    if (!email && !phone) {
      throw new BadRequestException('Ingresa al menos el correo o el numero de celular registrado.');
    }

    const resetRequestSearch: Prisma.UserWhereInput[] = [
      { username: identifier.toLowerCase() },
      { fullName: { equals: identifier, mode: 'insensitive' } },
    ];
    if (email) resetRequestSearch.push({ email: { equals: email, mode: 'insensitive' } });
    if (phone) resetRequestSearch.push({ phone });

    const matchedUser = await this.prisma.user.findFirst({
      where: { OR: resetRequestSearch },
      select: {
        id: true,
        fullName: true,
        username: true,
        email: true,
        phone: true,
        status: true,
        isActive: true,
      },
    });

    const administrators = await this.prisma.user.findMany({
      where: { role: UserRole.SUPERADMIN, isActive: true },
      select: { id: true },
    });

    const matchText = matchedUser
      ? `Coincidencia: ${matchedUser.fullName} (@${matchedUser.username}), estado ${matchedUser.status}, activo ${matchedUser.isActive ? 'si' : 'no'}.`
      : 'Sin coincidencia exacta automatica.';
    const message = [
      `Datos enviados: ${identifier}.`,
      email ? `Correo: ${email}.` : undefined,
      phone ? `Celular: ${phone}.` : undefined,
      `IP: ${metadata.ipAddress}.`,
      matchText,
      notes ? `Nota: ${notes}.` : undefined,
      'Revisar Usuarios y restablecer la contrasena si corresponde.',
    ].filter(Boolean).join(' ');

    if (administrators.length) {
      await this.prisma.notification.createMany({
        data: administrators.map((admin) => ({
          userId: admin.id,
          title: 'Solicitud de restablecimiento de contrasena',
          message,
        })),
      });
      this.realtime.adminNotificationsUpdated();
    }

    await this.accessLog(
      matchedUser?.id,
      'PASSWORD_RESET_REQUEST',
      metadata,
      true,
      matchedUser ? 'Solicitud vinculada a usuario existente.' : 'Solicitud sin coincidencia exacta.',
      identifier,
    );

    return {
      requestSent: true,
      message: 'Tu solicitud fue enviada al Equipo de Sistemas. Te contactaran para restablecer tu contrasena.',
    };
  }

  async profile(user: AuthUser) {
    return this.prisma.user.findUniqueOrThrow({ where: { id: user.id }, select: publicUserSelect });
  }

  async updateProfile(user: AuthUser, dto: UpdateProfileDto, request: Request) {
    const updated = await this.prisma.user.update({
      where: { id: user.id },
      data: { email: dto.email || undefined, phone: dto.phone, area: dto.area, position: dto.position },
      select: publicUserSelect,
    });
    await this.deviceLog(updated, 'UPDATE_PROFILE', requestMetadata(request), true);
    return updated;
  }

  async updatePhoto(user: AuthUser, photo: Express.Multer.File | undefined, request: Request) {
    if (!photo) throw new BadRequestException('Seleccione una foto valida.');
    const updated = await this.prisma.user.update({
      where: { id: user.id },
      data: { profilePhotoPath: storedFileData(photo, 'profiles').filePath },
      select: publicUserSelect,
    });
    await this.deviceLog(updated, 'UPDATE_PROFILE', requestMetadata(request), true, 'Foto actualizada');
    return updated;
  }

  async changePassword(user: AuthUser, dto: ChangePasswordDto, request: Request) {
    if (dto.newPassword !== dto.confirmPassword) {
      throw new BadRequestException('Las contrasenas nuevas no coinciden.');
    }
    const current = await this.prisma.user.findUniqueOrThrow({ where: { id: user.id } });
    if (!(await bcrypt.compare(dto.currentPassword, current.passwordHash))) {
      throw new UnauthorizedException('La contrasena actual no es correcta.');
    }
    await this.prisma.user.update({
      where: { id: user.id },
      data: { passwordHash: await bcrypt.hash(dto.newPassword, 12), mustChangePassword: false },
    });
    const metadata = requestMetadata(request);
    await this.accessLog(user.id, 'PASSWORD_CHANGED', metadata, true);
    await this.deviceLog(current, 'CHANGE_PASSWORD', metadata, true);
    return { passwordChanged: true };
  }

  async logout(user: AuthUser, request: Request) {
    await this.accessLog(user.id, 'LOGOUT', requestMetadata(request), true);
    return { loggedOut: true };
  }
}
