import { Inject, Injectable } from '@nestjs/common';
import { StorageService } from 'src/common/storage/storage.service';
import { ManifestStorage, MetadataFileStoraged } from 'src/common/storage/types/storage.types';
import { ulid } from 'ulid';
import { NotificationsSocketGateway } from '../../infra/adapters/notification.gateway';
import { ConnectionsRepository } from '../../infra/persistence/repositories/notifications.repository.db';
import { SalesRepository } from '../../infra/persistence/repositories/sales.repository.db';

@Injectable()
export class IngestionService {
  constructor(
    @Inject()
    private storageService: StorageService,
    @Inject()
    private notificationsSocketGateway: NotificationsSocketGateway,
    @Inject()
    private salesRepository: SalesRepository,
    @Inject()
    private connectionsRepository: ConnectionsRepository,
  ) {}

  async execute(transactionId: string, rawData: unknown, files?: Array<Express.Multer.File>) {
    try {
      let filesMetadata: MetadataFileStoraged[] = [];

      if (files) {
        const filesUploading = files?.map((file) => this.storageService.uploadFile({ transactionId, ...file }));
        await Promise.all(filesUploading);
        filesMetadata = files?.map((file) => this.storageService.getFileMetadata({ transactionId, ...file }));
      }

      const manifest: ManifestStorage = {
        transactionId,
        payload: JSON.stringify(rawData),
        attached: filesMetadata,
      };

      await this.storageService.uploadManifest(manifest);
      const { connectionId } = await this.connectionsRepository.findById(transactionId);

      if (connectionId) await this.notificationsSocketGateway.notifyStep(connectionId, { step: 1 });

      return transactionId;
    } catch (error) {
      console.error(
        'ERRO UPLOADING ------------------------------------------------------------------------------------------',
        error,
      );
    }
  }

  getTransactionIngestedById(transactionId: string) {
    return this.salesRepository.findById(transactionId);
  }

  async registerIngestTransactionId() {
    const transactionId = ulid();
    await this.connectionsRepository.createConnection({ id: transactionId, connectionId: '' });
    return transactionId;
  }
}
