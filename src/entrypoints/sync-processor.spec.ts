import { NestFactory } from '@nestjs/core';
import { SyncProcessorService } from '../modules/ingestion/application/services/sync-processor.service';
import { handler } from './sync-processor';

jest.mock('@nestjs/core', () => ({
  NestFactory: {
    createApplicationContext: jest.fn(),
  },
}));

describe('sync-processor handler', () => {
  const execute = jest.fn();

  beforeEach(() => {
    jest.clearAllMocks();
    execute.mockResolvedValue(undefined);
    (NestFactory.createApplicationContext as jest.Mock).mockResolvedValue({
      get: jest.fn().mockReturnValue({ execute }),
    });
  });

  it('processes SQS records with S3 event payload', async () => {
    const s3Event = {
      Records: [
        {
          s3: {
            object: { key: 'ingestion/2026/manifests/tx-manifest.json' },
          },
        },
      ],
    };

    await handler(
      {
        Records: [{ body: JSON.stringify(s3Event) }],
      } as Parameters<typeof handler>[0],
      {} as Parameters<typeof handler>[1],
      jest.fn(),
    );

    expect(execute).toHaveBeenCalledWith({ key: 'ingestion/2026/manifests/tx-manifest.json' });
  });

  it('ignores records without s3 payload', async () => {
    await handler(
      {
        Records: [{ body: JSON.stringify({ Records: [] }) }],
      } as Parameters<typeof handler>[0],
      {} as Parameters<typeof handler>[1],
      jest.fn(),
    );

    expect(execute).not.toHaveBeenCalled();
  });

  it('invokes sync processor once per SQS record', async () => {
    const s3Event = { Records: [{ s3: { object: { key: 'a' } } }] };

    await handler(
      {
        Records: [
          { body: JSON.stringify(s3Event) },
          { body: JSON.stringify(s3Event) },
        ],
      } as Parameters<typeof handler>[0],
      {} as Parameters<typeof handler>[1],
      jest.fn(),
    );

    expect(execute).toHaveBeenCalledTimes(2);
  });
});
