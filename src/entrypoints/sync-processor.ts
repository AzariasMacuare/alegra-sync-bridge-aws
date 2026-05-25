import { INestApplicationContext } from '@nestjs/common';
import { NestFactory } from '@nestjs/core';
import { S3Event, SQSEvent, SQSHandler } from 'aws-lambda';
import { AppModule } from 'src/app.module';
import { SyncProcessorService } from '../modules/ingestion/application/services/sync-processor.service';

let cachedApp: INestApplicationContext;

async function bootstrap() {
  if (!cachedApp) {
    cachedApp = await NestFactory.createApplicationContext(AppModule);
  }
  return cachedApp;
}

export const handler: SQSHandler = async (event: SQSEvent) => {
  const app = await bootstrap();
  const syncProcessorService = app.get(SyncProcessorService);

  await Promise.all(
    event.Records.map(async (record) => {
      const body: S3Event = JSON.parse(record.body) as S3Event;

      if (body?.Records?.[0]?.s3) {
        const { object } = body.Records[0].s3;
        await syncProcessorService.execute(object);
      }
    }),
  );
};
