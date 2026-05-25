import { Module } from '@nestjs/common';
import { CommonModule } from 'src/common/common.module';
import { IngestionService } from './application/services/ingestion.service';
import { SyncProcessorService } from './application/services/sync-processor.service';
import { AiService } from './infra/adapters/ai.service';
import { IngestionController } from './infra/adapters/controllers/ingestion.controller';
import { NotificationsSocketGateway } from './infra/adapters/notification.gateway';
import { IdempotencyRepository } from './infra/persistence/repositories/idempotency.repository.db';
import { ConnectionsRepository } from './infra/persistence/repositories/notifications.repository.db';
import { SalesRepository } from './infra/persistence/repositories/sales.repository.db';

@Module({
  imports: [CommonModule],
  providers: [
    AiService,
    IngestionService,
    SyncProcessorService,
    IdempotencyRepository,
    NotificationsSocketGateway,
    SalesRepository,
    ConnectionsRepository,
  ],
  controllers: [IngestionController],
})
export class IngestionModule {}
