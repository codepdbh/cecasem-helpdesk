import { Body, Controller, Get, Param, Patch, Post, Query, Req, UseGuards } from '@nestjs/common';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';
import { UserRole } from '@prisma/client';
import { Request } from 'express';
import { CurrentUser } from '../common/decorators/current-user.decorator';
import { Roles } from '../common/decorators/roles.decorator';
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard';
import { PasswordChangedGuard } from '../common/guards/password-changed.guard';
import { RolesGuard } from '../common/guards/roles.guard';
import { AuthUser } from '../common/interfaces/auth-user.interface';
import { AdminPasswordDto } from './dto/admin-password.dto';
import { CreateUserDto } from './dto/create-user.dto';
import { RejectUserDto } from './dto/reject-user.dto';
import { UpdateUserDto } from './dto/update-user.dto';
import { UserQueryDto } from './dto/user-query.dto';
import { UsersService } from './users.service';

@ApiTags('Usuarios')
@ApiBearerAuth()
@Controller('users')
@Roles(UserRole.SUPERADMIN)
@UseGuards(JwtAuthGuard, PasswordChangedGuard, RolesGuard)
export class UsersController {
  constructor(private readonly users: UsersService) {}

  @Get()
  findAll(@Query() query: UserQueryDto) {
    return this.users.findAll(query);
  }

  @Get('pending')
  pending() {
    return this.users.pending();
  }

  @Post()
  create(@Body() dto: CreateUserDto, @CurrentUser() user: AuthUser, @Req() request: Request) {
    return this.users.create(dto, user, request);
  }

  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.users.findOne(id);
  }

  @Patch(':id')
  update(
    @Param('id') id: string,
    @Body() dto: UpdateUserDto,
    @CurrentUser() user: AuthUser,
    @Req() request: Request,
  ) {
    return this.users.update(id, dto, user, request);
  }

  @Patch(':id/password')
  password(
    @Param('id') id: string,
    @Body() dto: AdminPasswordDto,
    @CurrentUser() user: AuthUser,
    @Req() request: Request,
  ) {
    return this.users.password(id, dto, user, request);
  }

  @Patch(':id/approve')
  approve(@Param('id') id: string, @CurrentUser() user: AuthUser, @Req() request: Request) {
    return this.users.approve(id, user, request);
  }

  @Patch(':id/reject')
  reject(
    @Param('id') id: string,
    @Body() dto: RejectUserDto,
    @CurrentUser() user: AuthUser,
    @Req() request: Request,
  ) {
    return this.users.reject(id, dto, user, request);
  }

  @Patch(':id/activate')
  activate(@Param('id') id: string, @CurrentUser() user: AuthUser, @Req() request: Request) {
    return this.users.activate(id, user, request);
  }

  @Patch(':id/deactivate')
  deactivate(@Param('id') id: string, @CurrentUser() user: AuthUser, @Req() request: Request) {
    return this.users.deactivate(id, user, request);
  }

  @Get(':id/ip-history')
  ipHistory(@Param('id') id: string) {
    return this.users.ipHistory(id);
  }
}

