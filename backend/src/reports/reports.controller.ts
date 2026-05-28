import { Controller, Get, Query, Res, UseGuards } from '@nestjs/common';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';
import { UserRole } from '@prisma/client';
import { Response } from 'express';
import { Roles } from '../common/decorators/roles.decorator';
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard';
import { PasswordChangedGuard } from '../common/guards/password-changed.guard';
import { RolesGuard } from '../common/guards/roles.guard';
import { ReportQueryDto } from './dto/report-query.dto';
import { ReportsService } from './reports.service';

@ApiTags('Reportes')
@ApiBearerAuth()
@Controller('reports')
@Roles(UserRole.SUPERADMIN)
@UseGuards(JwtAuthGuard, PasswordChangedGuard, RolesGuard)
export class ReportsController {
  constructor(private readonly reports: ReportsService) {}

  @Get('summary')
  summary() {
    return this.reports.summary();
  }

  @Get('by-status')
  byStatus() {
    return this.reports.byStatus();
  }

  @Get('by-priority')
  byPriority() {
    return this.reports.byPriority();
  }

  @Get('by-category')
  byCategory() {
    return this.reports.byCategory();
  }

  @Get('by-user')
  byUser() {
    return this.reports.byUser();
  }

  @Get('by-month')
  byMonth() {
    return this.reports.byMonth();
  }

  @Get('by-ip')
  byIp() {
    return this.reports.byIp();
  }

  @Get('with-constancy')
  withConstancy(@Query() query: ReportQueryDto) {
    return this.reports.withConstancy(query);
  }

  @Get('export/csv')
  csv(@Query() query: ReportQueryDto, @Res() response: Response) {
    return this.reports.exportCsv(query, response);
  }

  @Get('export/pdf')
  pdf(@Query() query: ReportQueryDto, @Res() response: Response) {
    return this.reports.exportPdf(query, response);
  }
}

