import * as moment from 'moment-timezone';
import { ConfigService } from '@nestjs/config';
import { NestFactory, Reflector } from '@nestjs/core';
import { ValidationPipe, VersioningType } from '@nestjs/common';
import { ClassSerializerInterceptor, RequestMethod } from '@nestjs/common';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';
import { useContainer } from 'class-validator';
import { jsonConfig } from '@app-common';
import { UserInterceptor } from '@app-common';
import { AppModule } from './modules/app/app.module';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);

  moment.tz.setDefault('UTC');

  app.enableVersioning({
    type: VersioningType.URI,
  });

  app.setGlobalPrefix('api', {
    exclude: [{ path: 'health-check', method: RequestMethod.GET }],
  });

  const docConfig = new DocumentBuilder()
    .setTitle('API Document')
    .setDescription('This is a test project API document.')
    .setVersion('0.0.1')
    .addBearerAuth()
    .build();
  const document = SwaggerModule.createDocument(app, docConfig);
  SwaggerModule.setup('/api/docs', app, document, {
    swaggerOptions: {
      persistAuthorization: true,
    },
  });

  const config: ConfigService = app.get(ConfigService);

  const serverConfiguration: object = jsonConfig(
    config.get<string>('NODE_ENV'),
    'ServerConfiguration',
  );

  const port =
    config.get<number>('PORT') ?? serverConfiguration['port'] ?? 3001;

  app.useGlobalInterceptors(new UserInterceptor());
  app.useGlobalInterceptors(new ClassSerializerInterceptor(app.get(Reflector)));
  useContainer(app.select(AppModule), { fallbackOnErrors: true });

  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      transform: true,
      transformOptions: {
        enableImplicitConversion: true,
      },
    }),
  );

  await app.listen(port);
}

bootstrap();
