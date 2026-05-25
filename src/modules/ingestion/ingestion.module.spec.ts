import { Test, TestingModule } from '@nestjs/testing';
import { ConfigModule } from '@nestjs/config';
import { CommonModule } from 'src/common/common.module';
import { AppEnvsConfig, EnvValidationSchema } from 'src/config/env.config';
import { setTestEnvVars } from 'src/test/test-utils';
import { IngestionModule } from './ingestion.module';
import { SyncProcessorService } from './application/services/sync-processor.service';

describe('IngestionModule', () => {
  beforeEach(() => {
    setTestEnvVars();
  });

  it('compiles and resolves SyncProcessorService with all dependencies', async () => {
    const module: TestingModule = await Test.createTestingModule({
      imports: [
        ConfigModule.forRoot({
          isGlobal: true,
          load: [AppEnvsConfig],
          validationSchema: EnvValidationSchema,
        }),
        CommonModule,
        IngestionModule,
      ],
    }).compile();

    const syncProcessor = module.get(SyncProcessorService);
    expect(syncProcessor).toBeInstanceOf(SyncProcessorService);
    await module.close();
  });
});
