import {
  Body,
  Controller,
  Get,
  Param,
  Patch,
  Post,
  Query,
  Req,
  UploadedFile,
  UseGuards,
  UseInterceptors,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { ApiBearerAuth, ApiConsumes, ApiTags } from '@nestjs/swagger';
import { UserRole } from '@prisma/client';
import { Request } from 'express';
import { CurrentUser } from '../common/decorators/current-user.decorator';
import { Roles } from '../common/decorators/roles.decorator';
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard';
import { PasswordChangedGuard } from '../common/guards/password-changed.guard';
import { RolesGuard } from '../common/guards/roles.guard';
import { AuthUser } from '../common/interfaces/auth-user.interface';
import { uploadOptions } from '../common/utils/file-upload.utils';
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
import { TicketsService } from './tickets.service';

@ApiTags('Tickets')
@ApiBearerAuth()
@Controller('tickets')
@UseGuards(JwtAuthGuard, PasswordChangedGuard)
export class TicketsController {
  constructor(private readonly tickets: TicketsService) {}

  @Get()
  findAll(@Query() query: TicketQueryDto, @CurrentUser() user: AuthUser) {
    return this.tickets.findAll(query, user);
  }

  @Post()
  @ApiConsumes('multipart/form-data')
  @UseInterceptors(FileInterceptor('attachment', uploadOptions('tickets', 10)))
  create(
    @Body() dto: CreateTicketDto,
    @UploadedFile() file: Express.Multer.File | undefined,
    @CurrentUser() user: AuthUser,
    @Req() request: Request,
  ) {
    return this.tickets.create(dto, file, user, request);
  }

  @Get(':id')
  findOne(@Param('id') id: string, @CurrentUser() user: AuthUser) {
    return this.tickets.findOne(id, user);
  }

  @Patch(':id')
  @Roles(UserRole.SUPERADMIN)
  @UseGuards(RolesGuard)
  update(@Param('id') id: string, @Body() dto: UpdateTicketDto, @CurrentUser() user: AuthUser, @Req() request: Request) {
    return this.tickets.update(id, dto, user, request);
  }

  @Patch(':id/status')
  @Roles(UserRole.SUPERADMIN)
  @UseGuards(RolesGuard)
  status(@Param('id') id: string, @Body() dto: ChangeStatusDto, @CurrentUser() user: AuthUser, @Req() request: Request) {
    return this.tickets.status(id, dto, user, request);
  }

  @Patch(':id/assign')
  @Roles(UserRole.SUPERADMIN)
  @UseGuards(RolesGuard)
  assign(@Param('id') id: string, @Body() dto: AssignTicketDto, @CurrentUser() user: AuthUser, @Req() request: Request) {
    return this.tickets.assign(id, dto, user, request);
  }

  @Patch(':id/resolve')
  @Roles(UserRole.SUPERADMIN)
  @UseGuards(RolesGuard)
  @ApiConsumes('multipart/form-data')
  @UseInterceptors(FileInterceptor('constancyPhoto', uploadOptions('constancias', 5)))
  resolve(
    @Param('id') id: string,
    @Body() dto: ResolveTicketDto,
    @UploadedFile() photo: Express.Multer.File | undefined,
    @CurrentUser() user: AuthUser,
    @Req() request: Request,
  ) {
    return this.tickets.resolve(id, dto, photo, user, request);
  }

  @Patch(':id/close')
  @Roles(UserRole.SUPERADMIN)
  @UseGuards(RolesGuard)
  @ApiConsumes('multipart/form-data')
  @UseInterceptors(FileInterceptor('constancyPhoto', uploadOptions('constancias', 5)))
  close(
    @Param('id') id: string,
    @Body() dto: CloseTicketDto,
    @UploadedFile() photo: Express.Multer.File | undefined,
    @CurrentUser() user: AuthUser,
    @Req() request: Request,
  ) {
    return this.tickets.close(id, dto, photo, user, request);
  }

  @Patch(':id/reopen')
  reopen(@Param('id') id: string, @Body() dto: ReopenTicketDto, @CurrentUser() user: AuthUser, @Req() request: Request) {
    return this.tickets.reopen(id, dto, user, request);
  }

  @Patch(':id/cancel')
  @Roles(UserRole.SUPERADMIN)
  @UseGuards(RolesGuard)
  cancel(@Param('id') id: string, @CurrentUser() user: AuthUser, @Req() request: Request) {
    return this.tickets.cancel(id, user, request);
  }
}

