import { NestFactory } from '@nestjs/core';
import express from 'express';
import { AppModule } from './app.module';
import { setupSwagger } from './swagger';

const MAX_PAYLOAD_SIZE = '10mb';

async function bootstrap() {
  const app = await NestFactory.create(AppModule, { rawBody: true });
  setupSwagger(app);

  app.use(
    express.text({
      type: ['text/xml', 'text/plain', 'application/xml'],
      limit: MAX_PAYLOAD_SIZE,
    }),
  );

  app.enableCors({
    origin: ['https://main.dslo245ccqnve.amplifyapp.com'],
    methods: 'GET,HEAD,PUT,PATCH,POST,DELETE',
    allowedHeaders: '*',
  });

  await app.listen(process.env.PORT ?? 3000);
}
void bootstrap();
