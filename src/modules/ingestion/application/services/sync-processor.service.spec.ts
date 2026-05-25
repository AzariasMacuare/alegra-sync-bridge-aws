import { Test, TestingModule } from '@nestjs/testing';
import { ConverterService } from 'src/common/infra/adapters/converter/converter.adapter';
import { StorageService } from 'src/common/storage/storage.service';
import { AiService } from '../../infra/adapters/ai.service';
import { NotificationsSocketGateway } from '../../infra/adapters/notification.gateway';
import { IdempotencyRepository } from '../../infra/persistence/repositories/idempotency.repository.db';
import { ConnectionsRepository } from '../../infra/persistence/repositories/notifications.repository.db';
import { SalesRepository } from '../../infra/persistence/repositories/sales.repository.db';
import { MainSaleCurrency } from '../../pseudo-domain/types/sale.types';
import { SyncProcessorService } from './sync-processor.service';

describe('SyncProcessorService', () => {
  let service: SyncProcessorService;
  let storageService: jest.Mocked<StorageService>;
  let aiService: jest.Mocked<AiService>;
  let converterService: jest.Mocked<ConverterService>;
  let salesRepository: jest.Mocked<SalesRepository>;
  let idempotencyRepository: jest.Mocked<IdempotencyRepository>;
  let connectionsRepository: jest.Mocked<ConnectionsRepository>;
  let notificationsGateway: jest.Mocked<NotificationsSocketGateway>;

  const saleFromAi = {
    country: 'Colombia',
    price: 50000,
    currency: 'COP',
    location: 'Cafe',
    category: 'Alimentación y Bebidas',
    billId: 'FAC-99',
  };

  const savedSale = {
    ...saleFromAi,
    id: expect.any(String) as unknown as string,
    currency: MainSaleCurrency,
    price: 12.5,
  };

  beforeEach(async () => {
    storageService = {
      downloadTextFile: jest.fn().mockResolvedValue({
        file: JSON.stringify({
          transactionId: 'tx-1',
          payload: '{}',
          attached: [{ key: 'img-key' }],
        }),
        mimeType: 'application/json',
      }),
      downloadImageFile: jest.fn().mockResolvedValue({
        file: Buffer.from('img'),
        mimeType: 'image/png',
      }),
    } as unknown as jest.Mocked<StorageService>;

    aiService = {
      getStructuredOutputAI: jest.fn().mockResolvedValue(saleFromAi),
    } as unknown as jest.Mocked<AiService>;

    converterService = {
      exchageAmountToUSD: jest.fn().mockResolvedValue(12.5),
    } as unknown as jest.Mocked<ConverterService>;

    salesRepository = {
      createSale: jest.fn().mockResolvedValue(undefined),
      findById: jest.fn().mockResolvedValue(savedSale),
    } as unknown as jest.Mocked<SalesRepository>;

    idempotencyRepository = {
      createLock: jest.fn().mockResolvedValue(undefined),
    } as unknown as jest.Mocked<IdempotencyRepository>;

    connectionsRepository = {
      findById: jest.fn().mockResolvedValue({ id: 'tx-1', connectionId: 'ws-conn' }),
    } as unknown as jest.Mocked<ConnectionsRepository>;

    notificationsGateway = {
      notifyStep: jest.fn().mockResolvedValue(undefined),
    } as unknown as jest.Mocked<NotificationsSocketGateway>;

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        SyncProcessorService,
        { provide: StorageService, useValue: storageService },
        { provide: AiService, useValue: aiService },
        { provide: ConverterService, useValue: converterService },
        { provide: SalesRepository, useValue: salesRepository },
        { provide: IdempotencyRepository, useValue: idempotencyRepository },
        { provide: ConnectionsRepository, useValue: connectionsRepository },
        { provide: NotificationsSocketGateway, useValue: notificationsGateway },
      ],
    }).compile();

    service = module.get<SyncProcessorService>(SyncProcessorService);
  });

  describe('execute', () => {
    it('processes manifest, converts currency, saves sale and notifies steps', async () => {
      await service.execute({ key: 'manifest-key' });

      expect(idempotencyRepository.createLock).toHaveBeenCalled();
      expect(converterService.exchageAmountToUSD).toHaveBeenCalledWith('COP', 50000);
      expect(salesRepository.createSale).toHaveBeenCalledWith(
        expect.objectContaining({
          currency: MainSaleCurrency,
          price: 12.5,
          billId: 'FAC-99',
        }),
      );
      expect(notificationsGateway.notifyStep).toHaveBeenCalledWith('ws-conn', { step: 6, aditional: savedSale });
    });

    it('throws when idempotency lock already exists', async () => {
      idempotencyRepository.createLock.mockRejectedValue(new Error('duplicate'));
      await expect(service.execute({ key: 'manifest-key' })).rejects.toThrow(
        'Error al guardar el id idempotente',
      );
    });
  });

  describe('extractData', () => {
    it('throws when manifest file is empty', async () => {
      storageService.downloadTextFile.mockResolvedValue({ file: undefined, mimeType: 'application/json' });
      await expect(service.extractData({ key: 'k' })).rejects.toThrow('Manifest Empty');
    });

    it('throws when AI returns incomplete sale', async () => {
      aiService.getStructuredOutputAI.mockResolvedValue({
        ...saleFromAi,
        billId: '',
      });
      await expect(service.extractData({ key: 'k' })).rejects.toThrow('Faltan Datos');
    });

    it('returns sale with connectionId on success', async () => {
      const result = await service.extractData({ key: 'k' });
      expect(result).toEqual({ ...saleFromAi, connectionId: 'ws-conn' });
      expect(notificationsGateway.notifyStep).toHaveBeenCalledWith('ws-conn', { step: 2 });
      expect(notificationsGateway.notifyStep).toHaveBeenCalledWith('ws-conn', { step: 3 });
      expect(notificationsGateway.notifyStep).toHaveBeenCalledWith('ws-conn', { step: 4 });
    });
  });
});
