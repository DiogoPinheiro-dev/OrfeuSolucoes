import { ValidationPipe } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { NestFactory } from '@nestjs/core';
import { NestExpressApplication } from '@nestjs/platform-express';
import * as cookieParser from 'cookie-parser';
import helmet from 'helmet';
import { AppModule } from './app.module';
import { createFormValidationException } from './common/exceptions/form-field.exception';
import { createOriginValidationMiddleware } from './common/security/origin-validation.middleware';

async function bootstrap() {
  const app = await NestFactory.create<NestExpressApplication>(AppModule);
  const configService = app.get(ConfigService);
  const nodeEnv = configService.get<string>('NODE_ENV');
  const isProductionRuntime = nodeEnv === 'production';
  const trustedProxies = configService.get<string[]>('TRUST_PROXY') ?? ['loopback'];

  app.set('trust proxy', trustedProxies);
  app.use(
    helmet(
      isProductionRuntime
        ? {}
        : {
            contentSecurityPolicy: false,
            strictTransportSecurity: false
          }
    )
  );

  app.use(cookieParser());
  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      forbidNonWhitelisted: true,
      transform: true,
      exceptionFactory: createFormValidationException
    })
  );

  const origins = (configService.get<string>('CORS_ORIGIN') ?? 'http://localhost:5173')
    .split(',')
    .map((origin) => origin.trim())
    .filter((origin) => origin.length > 0);

  app.use(createOriginValidationMiddleware(origins));

  app.enableCors({
    origin: origins,
    credentials: true
  });

  const port = configService.get<number>('PORT') ?? 3001;
  await app.listen(port, "0.0.0.0");
}

void bootstrap();
