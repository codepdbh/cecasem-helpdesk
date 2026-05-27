import { Injectable, UnauthorizedException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { PassportStrategy } from '@nestjs/passport';
import { ExtractJwt, Strategy } from 'passport-jwt';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class JwtStrategy extends PassportStrategy(Strategy) {
  constructor(config: ConfigService, private readonly prisma: PrismaService) {
    super({
      jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
      ignoreExpiration: false,
      secretOrKey: config.get<string>('JWT_SECRET', 'development-change-this-secret'),
    });
  }

  async validate(payload: { sub: string }): Promise<unknown> {
    const user = await this.prisma.user.findUnique({
      where: { id: payload.sub },
      select: {
        id: true,
        firstName: true,
        lastName: true,
        fullName: true,
        username: true,
        profilePhotoPath: true,
        role: true,
        status: true,
        isActive: true,
        mustChangePassword: true,
        firstAccessIp: true,
      },
    });
    if (!user || !user.isActive) {
      throw new UnauthorizedException('Cuenta no disponible.');
    }
    return user;
  }
}

