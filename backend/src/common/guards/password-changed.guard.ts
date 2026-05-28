import { CanActivate, ExecutionContext, ForbiddenException, Injectable } from '@nestjs/common';
import { AuthUser } from '../interfaces/auth-user.interface';

@Injectable()
export class PasswordChangedGuard implements CanActivate {
  canActivate(context: ExecutionContext): boolean {
    const user = context.switchToHttp().getRequest().user as AuthUser;
    if (user?.mustChangePassword) {
      throw new ForbiddenException('Debe cambiar su contrasena temporal antes de continuar.');
    }
    return true;
  }
}

