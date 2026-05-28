import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { APP_GUARD } from '@nestjs/core';
import { ThrottlerGuard, ThrottlerModule } from '@nestjs/throttler';
import { PrismaModule } from './prisma/prisma.module';
import { CommonModule } from './common/common.module';
import { AuthModule } from './auth/auth.module';
import { UsersModule } from './users/users.module';
import { TicketsModule } from './tickets/tickets.module';
import { CommentsModule } from './comments/comments.module';
import { AttachmentsModule } from './attachments/attachments.module';
import { ConstancyPhotosModule } from './constancy-photos/constancy-photos.module';
import { CategoriesModule } from './categories/categories.module';
import { ReportsModule } from './reports/reports.module';
import { LogsModule } from './logs/logs.module';
import { NotificationsModule } from './notifications/notifications.module';
import { UserDeviceLogsModule } from './user-device-logs/user-device-logs.module';
import { RealtimeModule } from './realtime/realtime.module';

@Module({
  imports: [
    ConfigModule.forRoot({ isGlobal: true }),
    ThrottlerModule.forRoot([{ ttl: 60000, limit: 100 }]),
    PrismaModule,
    CommonModule,
    RealtimeModule,
    AuthModule,
    UsersModule,
    UserDeviceLogsModule,
    TicketsModule,
    CommentsModule,
    AttachmentsModule,
    ConstancyPhotosModule,
    CategoriesModule,
    ReportsModule,
    LogsModule,
    NotificationsModule,
  ],
  providers: [{ provide: APP_GUARD, useClass: ThrottlerGuard }],
})
export class AppModule {}
