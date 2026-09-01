import { NestFactory } from '@nestjs/core';
import { ValidationPipe } from '@nestjs/common';
import { SwaggerModule, DocumentBuilder } from '@nestjs/swagger';
import { ConfigService } from '@nestjs/config';
import helmet from 'helmet';
import { AppModule } from './app.module';

async function bootstrap() {
  const app = await NestFactory.create(AppModule, { bufferLogs: true });

  const configService = app.get(ConfigService);
  const nodeEnv = configService.get<string>('app.nodeEnv');
  const globalPrefix = configService.get<string>('app.globalPrefix') ?? 'api';
  const port = process.env.PORT ?? configService.get<number>('app.port') ?? 3000;
  const corsOrigins = configService.get<string[]>('app.corsOrigins') ?? ['*'];

  app.use(helmet());

  app.enableCors({
    origin: corsOrigins,
    methods: ['GET', 'HEAD', 'PUT', 'PATCH', 'POST', 'DELETE', 'OPTIONS'],
    credentials: true,
  });

  // health fuera del prefijo /api — así los probes de infraestructura no
  // dependen de versión de API
  app.setGlobalPrefix(globalPrefix, { exclude: ['health'] });

  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      forbidNonWhitelisted: true,
      transform: true,
      transformOptions: { enableImplicitConversion: true },
    }),
  );

  if (nodeEnv !== 'production') {
    const swaggerConfig = new DocumentBuilder()
      .setTitle('Product API')
      .setDescription('Backend service API documentation')
      .setVersion('1.0')
      .addBearerAuth({ type: 'http', scheme: 'bearer', bearerFormat: 'JWT' }, 'access-token')
      .build();
    const document = SwaggerModule.createDocument(app, swaggerConfig);
    SwaggerModule.setup(`${globalPrefix}/docs`, app, document, {
      swaggerOptions: { persistAuthorization: true },
    });
  }

  await app.listen(port);
  console.log(`Application is running on: http://localhost:${port}/${globalPrefix}`);
}

bootstrap();
