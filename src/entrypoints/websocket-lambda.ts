import { INestApplicationContext } from '@nestjs/common';
import { NestFactory } from '@nestjs/core';
import type { Context, Handler } from 'aws-lambda';
import { AppModule } from '../app.module';
import { ConnectionsRepository } from '../modules/ingestion/infra/persistence/repositories/notifications.repository.db';

interface ApiGatewayWebSocketEvent {
  requestContext: {
    routeKey: string;
    connectionId: string;
  };
  queryStringParameters?: Record<string, string | undefined> | null;
  body?: string | null;
  isBase64Encoded?: boolean | null;
}

let cachedApp: INestApplicationContext;

async function getApp(): Promise<INestApplicationContext> {
  if (!cachedApp) {
    cachedApp = await NestFactory.createApplicationContext(AppModule);
  }
  return cachedApp;
}

function wsResponse(statusCode: number, body = '') {
  return { statusCode, body };
}

function decodeBody(event: ApiGatewayWebSocketEvent): string {
  const raw = event.body ?? '';
  if (event.isBase64Encoded) {
    return Buffer.from(raw, 'base64').toString('utf8');
  }
  return raw;
}

export const handler: Handler = async (event: ApiGatewayWebSocketEvent, _context: Context) => {
  const routeKey = event.requestContext?.routeKey;
  const connectionId = event.requestContext?.connectionId;

  try {
    const app = await getApp();
    const connectionsRepository = app.get(ConnectionsRepository);

    if (routeKey === 'register' || routeKey === '$default') {
      const raw = decodeBody(event);

      if (!raw) {
        return wsResponse(400, 'Missing body');
      }

      const parsed = JSON.parse(raw) as { transactionId?: string };
      if (!parsed.transactionId) return wsResponse(400, 'Missing transactionId');
      await connectionsRepository.updateConnection({ id: parsed.transactionId, connectionId });
      return wsResponse(200, 'Registered successfully');
    }

    if (routeKey === '$disconnect') return wsResponse(200, 'Disconnected cleanly');

    return wsResponse(200, 'OK');
  } catch (err: unknown) {
    console.error('websocket-lambda error', err);
    return wsResponse(500, 'Internal error');
  }
};
