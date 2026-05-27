import { Module } from '@nestjs/common';
import { TicketsModule } from '../tickets/tickets.module';
import { CommentsController } from './comments.controller';
import { CommentsService } from './comments.service';

@Module({
  imports: [TicketsModule],
  controllers: [CommentsController],
  providers: [CommentsService],
})
export class CommentsModule {}

