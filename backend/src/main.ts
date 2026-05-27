import { ValidationPipe } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { NestFactory } from '@nestjs/core';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';
import { NestExpressApplication } from '@nestjs/platform-express';
import compression from 'compression';
import helmet from 'helmet';
import { join } from 'path';
import { AppModule } from './app.module';
import { ApiExceptionFilter } from './common/filters/api-exception.filter';
import { ApiResponseInterceptor } from './common/interceptors/api-response.interceptor';
import { createCorsOriginDelegate, parseCorsOrigins } from './common/utils/cors.utils';
import { RealtimeSocketIoAdapter } from './realtime/realtime.adapter';

const defaultCorsOrigins = [
  'http://localhost:47822',
  'http://127.0.0.1:47822',
  'http://localhost',
  'https://tauri.localhost',
  'tauri://localhost',
  'capacitor://localhost',
].join(',');

async function bootstrap(): Promise<void> {
  const app = await NestFactory.create<NestExpressApplication>(AppModule);
  const config = app.get(ConfigService);
  const apiPrefix = config.get<string>('API_PREFIX', 'api');
  const allowedOrigins = parseCorsOrigins([
    config.get<string>('FRONTEND_URL', 'http://localhost:47822'),
    config.get<string>('PUBLIC_WEB_URL'),
    config.get<string>('ADDITIONAL_CORS_ORIGINS', defaultCorsOrigins),
  ]);

  configureTrustProxy(app, config.get<string>('TRUST_PROXY', 'false'));
  app.setGlobalPrefix(apiPrefix);
  app.use(helmet({ crossOriginResourcePolicy: { policy: 'cross-origin' } }));
  app.use(compression());
  app.useWebSocketAdapter(new RealtimeSocketIoAdapter(app, allowedOrigins));
  app.enableCors({
    origin: createCorsOriginDelegate(allowedOrigins),
    credentials: true,
  });
  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      forbidNonWhitelisted: true,
      transform: true,
    }),
  );
  app.useGlobalInterceptors(new ApiResponseInterceptor());
  app.useGlobalFilters(new ApiExceptionFilter());
  app.useStaticAssets(join(process.cwd(), 'uploads'), { prefix: '/uploads/' });

  const swagger = new DocumentBuilder()
    .setTitle('Mesa de Ayuda CECASEM API')
    .setDescription('API de tickets, auditoria y reportes')
    .setVersion('1.0')
    .addBearerAuth()
    .build();
  SwaggerModule.setup(`${apiPrefix}/docs`, app, SwaggerModule.createDocument(app, swagger));

  await app.listen(
    config.get<number>('SERVER_PORT', 47821),
    config.get<string>('SERVER_HOST', '0.0.0.0'),
  );
}

function configureTrustProxy(app: NestExpressApplication, value: string): void {
  const normalized = value.trim().toLowerCase();
  if (normalized === 'true') {
    app.set('trust proxy', 1);
    return;
  }
  if (normalized === 'false') {
    app.set('trust proxy', false);
    return;
  }
  const numericValue = Number(normalized);
  app.set('trust proxy', Number.isNaN(numericValue) ? value : numericValue);
}

bootstrap();
