import { Body, Controller, Get, Param, Post, Req, UseGuards } from '@nestjs/common';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';
import { Request } from 'express';
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard';
import { PasswordChangedGuard } from '../common/guards/password-changed.guard';
import { CurrentUser } from '../common/decorators/current-user.decorator';
import { AuthUser } from '../common/interfaces/auth-user.interface';
import { CreateCommentDto } from './dto/create-comment.dto';
import { CommentsService } from './comments.service';

@ApiTags('Comentarios')
@ApiBearerAuth()
@Controller('tickets/:ticketId/comments')
@UseGuards(JwtAuthGuard, PasswordChangedGuard)
export class CommentsController {
  constructor(private readonly comments: CommentsService) {}

  @Get()
  findAll(@Param('ticketId') ticketId: string, @CurrentUser() user: AuthUser) {
    return this.comments.findAll(ticketId, user);
  }

  @Post()
  create(
    @Param('ticketId') ticketId: string,
    @Body() dto: CreateCommentDto,
    @CurrentUser() user: AuthUser,
    @Req() request: Request,
  ) {
    return this.comments.create(ticketId, dto, user, request);
  }
}

