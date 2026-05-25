import { Test, TestingModule } from '@nestjs/testing';
import { IngestionService } from '../../../application/services/ingestion.service';
import { NotificationsSocketGateway } from '../notification.gateway';
import { IngestionController } from './ingestion.controller';

describe('IngestionController', () => {
  let controller: IngestionController;
  let ingestionService: jest.Mocked<IngestionService>;
  let socketGateway: jest.Mocked<NotificationsSocketGateway>;

  beforeEach(async () => {
    ingestionService = {
      registerIngestTransactionId: jest.fn().mockResolvedValue('tx-new'),
      execute: jest.fn().mockResolvedValue('tx-1'),
      getTransactionIngestedById: jest.fn(),
    } as unknown as jest.Mocked<IngestionService>;

    socketGateway = {
      notifyStep: jest.fn().mockResolvedValue(undefined),
    } as unknown as jest.Mocked<NotificationsSocketGateway>;

    const module: TestingModule = await Test.createTestingModule({
      controllers: [IngestionController],
      providers: [
        { provide: IngestionService, useValue: ingestionService },
        { provide: NotificationsSocketGateway, useValue: socketGateway },
      ],
    }).compile();

    controller = module.get<IngestionController>(IngestionController);
    (controller as unknown as { ingestionService: IngestionService }).ingestionService = ingestionService;
    (controller as unknown as { socketGateway: NotificationsSocketGateway }).socketGateway = socketGateway;
  });

  it('registers a new transaction via service', async () => {
    await expect(controller.registerConnection()).resolves.toBe('tx-new');
    expect(ingestionService.registerIngestTransactionId).toHaveBeenCalled();
  });

  it('delegates ingestion with body, query and files', async () => {
    const files = [{ originalname: 'a.pdf' }] as Express.Multer.File[];
    const body = { invoice: 1 };
    const query = { debug: true };

    await controller.handleIngestion('tx-1', body, query, files);

    expect(ingestionService.execute).toHaveBeenCalledWith('tx-1', { body, query }, files);
  });

  it('sends socket notification and returns confirmation message', () => {
    const response = controller.proveSocket(4, 'ws-conn');
    expect(socketGateway.notifyStep).toHaveBeenCalledWith('ws-conn', { step: 4 });
    expect(response).toEqual({ message: 'Notificación enviada' });
  });
});
