import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Post,
  Req,
  Res,
  UploadedFile,
  UseGuards,
  UseInterceptors,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { ApiBearerAuth, ApiConsumes, ApiTags } from '@nestjs/swagger';
import { UserRole } from '@prisma/client';
import { Request, Response } from 'express';
import { CurrentUser } from '../common/decorators/current-user.decorator';
import { Roles } from '../common/decorators/roles.decorator';
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard';
import { PasswordChangedGuard } from '../common/guards/password-changed.guard';
import { RolesGuard } from '../common/guards/roles.guard';
import { AuthUser } from '../common/interfaces/auth-user.interface';
import { uploadOptions } from '../common/utils/file-upload.utils';
import { ConstancyPhotosService } from './constancy-photos.service';
import { CreateConstancyDto } from './dto/create-constancy.dto';

@ApiTags('Fotos de constancia')
@ApiBearerAuth()
@Controller()
@UseGuards(JwtAuthGuard, PasswordChangedGuard)
export class ConstancyPhotosController {
  constructor(private readonly photos: ConstancyPhotosService) {}

  @Post('tickets/:ticketId/constancy-photos')
  @Roles(UserRole.SUPERADMIN)
  @UseGuards(RolesGuard)
  @ApiConsumes('multipart/form-data')
  @UseInterceptors(FileInterceptor('photo', uploadOptions('constancias', 5)))
  create(
    @Param('ticketId') ticketId: string,
    @Body() dto: CreateConstancyDto,
    @UploadedFile() photo: Express.Multer.File | undefined,
    @CurrentUser() user: AuthUser,
    @Req() request: Request,
  ) {
    return this.photos.create(ticketId, dto, photo, user, request);
  }

  @Get('tickets/:ticketId/constancy-photos')
  findAll(@Param('ticketId') ticketId: string, @CurrentUser() user: AuthUser) {
    return this.photos.findAll(ticketId, user);
  }

  @Get('constancy-photos/:id/download')
  download(@Param('id') id: string, @CurrentUser() user: AuthUser, @Res() response: Response) {
    return this.photos.download(id, user, response);
  }

  @Delete('constancy-photos/:id')
  @Roles(UserRole.SUPERADMIN)
  @UseGuards(RolesGuard)
  remove(@Param('id') id: string, @CurrentUser() user: AuthUser) {
    return this.photos.remove(id, user);
  }
}

