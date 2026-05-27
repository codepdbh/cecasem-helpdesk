import { Controller, Get, Param, Patch, UseGuards } from '@nestjs/common';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';
import { CurrentUser } from '../common/decorators/current-user.decorator';
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard';
import { AuthUser } from '../common/interfaces/auth-user.interface';
import { NotificationsService } from './notifications.service';

@ApiTags('Notificaciones')
@ApiBearerAuth()
@Controller('notifications')
@UseGuards(JwtAuthGuard)
export class NotificationsController {
  constructor(private readonly notifications: NotificationsService) {}

  @Get()
  findAll(@CurrentUser() user: AuthUser) {
    return this.notifications.findAll(user);
  }

  @Patch('read-all')
  readAll(@CurrentUser() user: AuthUser) {
    return this.notifications.readAll(user);
  }

  @Patch(':id/read')
  read(@Param('id') id: string, @CurrentUser() user: AuthUser) {
    return this.notifications.read(id, user);
  }
}

