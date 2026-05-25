import { NestFactory } from '@nestjs/core';
import { ConnectionsRepository } from '../modules/ingestion/infra/persistence/repositories/notifications.repository.db';
import { handler } from './websocket-lambda';

jest.mock('@nestjs/core', () => ({
  NestFactory: {
    createApplicationContext: jest.fn(),
  },
}));

describe('websocket-lambda handler', () => {
  const updateConnection = jest.fn();

  beforeEach(() => {
    jest.clearAllMocks();
    updateConnection.mockResolvedValue(undefined);
    (NestFactory.createApplicationContext as jest.Mock).mockResolvedValue({
      get: jest.fn((token: unknown) => {
        if (token === ConnectionsRepository) {
          return { updateConnection };
        }
        return {};
      }),
    });
  });

  const baseEvent = (routeKey: string, overrides: Record<string, unknown> = {}) => ({
    requestContext: { routeKey, connectionId: 'ws-123' },
    body: null,
    ...overrides,
  });

  it('returns 400 when register body is missing', async () => {
    const result = await handler(baseEvent('register'), {} as never, jest.fn());
    expect(result).toEqual({ statusCode: 400, body: 'Missing body' });
  });

  it('returns 400 when transactionId is missing in body', async () => {
    const result = await handler(
      baseEvent('register', { body: JSON.stringify({}) }),
      {} as never,
      jest.fn(),
    );
    expect(result).toEqual({ statusCode: 400, body: 'Missing transactionId' });
  });

  it('registers connection on register route', async () => {
    const result = await handler(
      baseEvent('register', { body: JSON.stringify({ transactionId: 'tx-1' }) }),
      {} as never,
      jest.fn(),
    );

    expect(updateConnection).toHaveBeenCalledWith({ id: 'tx-1', connectionId: 'ws-123' });
    expect(result).toEqual({ statusCode: 200, body: 'Registered successfully' });
  });

  it('handles $default route like register', async () => {
    await handler(
      baseEvent('$default', { body: JSON.stringify({ transactionId: 'tx-2' }) }),
      {} as never,
      jest.fn(),
    );
    expect(updateConnection).toHaveBeenCalledWith({ id: 'tx-2', connectionId: 'ws-123' });
  });

  it('decodes base64 body', async () => {
    const body = Buffer.from(JSON.stringify({ transactionId: 'tx-b64' })).toString('base64');
    await handler(
      baseEvent('register', { body, isBase64Encoded: true }),
      {} as never,
      jest.fn(),
    );
    expect(updateConnection).toHaveBeenCalledWith({ id: 'tx-b64', connectionId: 'ws-123' });
  });

  it('returns 200 on disconnect', async () => {
    const result = await handler(baseEvent('$disconnect'), {} as never, jest.fn());
    expect(result).toEqual({ statusCode: 200, body: 'Disconnected cleanly' });
  });

  it('returns 500 on unexpected errors', async () => {
    updateConnection.mockRejectedValue(new Error('Dynamo fail'));
    const errorSpy = jest.spyOn(console, 'error').mockImplementation();

    const result = await handler(
      baseEvent('register', { body: JSON.stringify({ transactionId: 'tx-err' }) }),
      {} as never,
      jest.fn(),
    );

    expect(result).toEqual({ statusCode: 500, body: 'Internal error' });
    errorSpy.mockRestore();
  });
});
