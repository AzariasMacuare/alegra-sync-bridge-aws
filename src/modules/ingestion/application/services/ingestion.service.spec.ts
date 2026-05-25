import { Test, TestingModule } from '@nestjs/testing';
import { StorageService } from 'src/common/storage/storage.service';
import { NotificationsSocketGateway } from '../../infra/adapters/notification.gateway';
import { ConnectionsRepository } from '../../infra/persistence/repositories/notifications.repository.db';
import { SalesRepository } from '../../infra/persistence/repositories/sales.repository.db';
import { IngestionService } from './ingestion.service';

jest.mock('ulid', () => ({ ulid: jest.fn(() => '01ULIDTEST') }));

describe('IngestionService', () => {
  let service: IngestionService;
  let storageService: jest.Mocked<StorageService>;
  let notificationsGateway: jest.Mocked<NotificationsSocketGateway>;
  let salesRepository: jest.Mocked<SalesRepository>;
  let connectionsRepository: jest.Mocked<ConnectionsRepository>;

  beforeEach(async () => {
    storageService = {
      uploadFile: jest.fn().mockResolvedValue({}),
      getFileMetadata: jest.fn().mockReturnValue({ key: 'file-key' }),
      uploadManifest: jest.fn().mockResolvedValue({}),
    } as unknown as jest.Mocked<StorageService>;

    notificationsGateway = {
      notifyStep: jest.fn().mockResolvedValue(undefined),
    } as unknown as jest.Mocked<NotificationsSocketGateway>;

    salesRepository = {
      findById: jest.fn().mockResolvedValue({ id: 'sale-1' }),
    } as unknown as jest.Mocked<SalesRepository>;

    connectionsRepository = {
      createConnection: jest.fn().mockResolvedValue(undefined),
      findById: jest.fn().mockResolvedValue({ id: 'tx-1', connectionId: 'ws-1' }),
    } as unknown as jest.Mocked<ConnectionsRepository>;

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        IngestionService,
        { provide: StorageService, useValue: storageService },
        { provide: NotificationsSocketGateway, useValue: notificationsGateway },
        { provide: SalesRepository, useValue: salesRepository },
        { provide: ConnectionsRepository, useValue: connectionsRepository },
      ],
    }).compile();

    service = module.get<IngestionService>(IngestionService);
  });

  it('registers a new transaction id and persists connection', async () => {
    const id = await service.registerIngestTransactionId();
    expect(id).toBe('01ULIDTEST');
    expect(connectionsRepository.createConnection).toHaveBeenCalledWith({
      id: '01ULIDTEST',
      connectionId: '',
    });
  });

  it('uploads files, manifest and notifies step 1 when connection exists', async () => {
    const files = [
      {
        originalname: 'a.jpg',
        mimetype: 'image/jpeg',
        buffer: Buffer.from('x'),
      },
    ] as Express.Multer.File[];

    const result = await service.execute('tx-1', { amount: 1 }, files);

    expect(storageService.uploadFile).toHaveBeenCalledTimes(1);
    expect(storageService.uploadManifest).toHaveBeenCalledWith(
      expect.objectContaining({
        transactionId: 'tx-1',
        attached: [{ key: 'file-key' }],
      }),
    );
    expect(notificationsGateway.notifyStep).toHaveBeenCalledWith('ws-1', { step: 1 });
    expect(result).toBe('tx-1');
  });

  it('skips websocket notification when connectionId is empty', async () => {
    connectionsRepository.findById.mockResolvedValue({ id: 'tx-2', connectionId: '' });
    await service.execute('tx-2', { ok: true });
    expect(notificationsGateway.notifyStep).not.toHaveBeenCalled();
  });

  it('delegates getTransactionIngestedById to sales repository', async () => {
    await service.getTransactionIngestedById('sale-1');
    expect(salesRepository.findById).toHaveBeenCalledWith('sale-1');
  });

  it('logs and swallows errors during execute', async () => {
    const errorSpy = jest.spyOn(console, 'error').mockImplementation();
    storageService.uploadManifest.mockRejectedValue(new Error('S3 fail'));

    const result = await service.execute('tx-err', {});

    expect(result).toBeUndefined();
    errorSpy.mockRestore();
  });
});
