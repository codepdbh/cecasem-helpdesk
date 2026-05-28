import { Controller, Get, Param, Post, Req, Res, UploadedFile, UseGuards, UseInterceptors } from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { ApiBearerAuth, ApiConsumes, ApiTags } from '@nestjs/swagger';
import { Request, Response } from 'express';
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard';
import { PasswordChangedGuard } from '../common/guards/password-changed.guard';
import { CurrentUser } from '../common/decorators/current-user.decorator';
import { AuthUser } from '../common/interfaces/auth-user.interface';
import { uploadOptions } from '../common/utils/file-upload.utils';
import { AttachmentsService } from './attachments.service';

@ApiTags('Adjuntos')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, PasswordChangedGuard)
@Controller()
export class AttachmentsController {
  constructor(private readonly attachments: AttachmentsService) {}

  @Post('tickets/:ticketId/attachments')
  @ApiConsumes('multipart/form-data')
  @UseInterceptors(FileInterceptor('attachment', uploadOptions('tickets', 10)))
  create(
    @Param('ticketId') ticketId: string,
    @UploadedFile() file: Express.Multer.File | undefined,
    @CurrentUser() user: AuthUser,
    @Req() request: Request,
  ) {
    return this.attachments.create(ticketId, file, user, request);
  }

  @Get('tickets/:ticketId/attachments')
  findAll(@Param('ticketId') ticketId: string, @CurrentUser() user: AuthUser) {
    return this.attachments.findAll(ticketId, user);
  }

  @Get('attachments/:id/download')
  download(@Param('id') id: string, @CurrentUser() user: AuthUser, @Res() response: Response) {
    return this.attachments.download(id, user, response);
  }
}

