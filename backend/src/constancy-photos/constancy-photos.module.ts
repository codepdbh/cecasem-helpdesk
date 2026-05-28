import { Module } from '@nestjs/common';
import { TicketsModule } from '../tickets/tickets.module';
import { ConstancyPhotosController } from './constancy-photos.controller';
import { ConstancyPhotosService } from './constancy-photos.service';

@Module({
  imports: [TicketsModule],
  controllers: [ConstancyPhotosController],
  providers: [ConstancyPhotosService],
})
export class ConstancyPhotosModule {}
