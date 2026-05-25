import { NestFactory } from '@nestjs/core';
import { configure as serverlessExpress } from '@vendia/serverless-express';
import { APIGatewayProxyEvent, Context } from 'aws-lambda';
import type { RequestListener } from 'http';
import { AppModule } from 'src/app.module';
import { setupSwagger } from '../swagger';

type LambdaHandler = (event: APIGatewayProxyEvent, context: Context) => Promise<any>;

let cachedServer: ReturnType<typeof serverlessExpress>;

export const handler: LambdaHandler = async (event: APIGatewayProxyEvent, context: Context) => {
  if (!cachedServer) {
    const nestApp = await NestFactory.create(AppModule);

    nestApp.enableCors({
      origin: '*',
      methods: 'GET,HEAD,PUT,PATCH,POST,DELETE,OPTIONS',
      credentials: true,
    });

    setupSwagger(nestApp);
    await nestApp.init();
    cachedServer = serverlessExpress({
      app: nestApp.getHttpAdapter().getInstance() as RequestListener,
    });
  }
  return cachedServer(event, context, () => {});
};
