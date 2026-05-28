import { Controller, Get, Query, UseGuards } from '@nestjs/common';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';
import { UserRole } from '@prisma/client';
import { Roles } from '../common/decorators/roles.decorator';
import { PaginationDto } from '../common/dto/pagination.dto';
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard';
import { PasswordChangedGuard } from '../common/guards/password-changed.guard';
import { RolesGuard } from '../common/guards/roles.guard';
import { LogsService } from './logs.service';

@ApiTags('Auditoria')
@ApiBearerAuth()
@Roles(UserRole.SUPERADMIN)
@UseGuards(JwtAuthGuard, PasswordChangedGuard, RolesGuard)
@Controller('logs')
export class LogsController {
  constructor(private readonly logs: LogsService) {}

  @Get('access')
  access(@Query() query: PaginationDto) {
    return this.logs.access(query);
  }

  @Get('tickets')
  tickets(@Query() query: PaginationDto) {
    return this.logs.tickets(query);
  }

  @Get('user-devices')
  devices(@Query() query: PaginationDto) {
    return this.logs.devices(query);
  }
}

