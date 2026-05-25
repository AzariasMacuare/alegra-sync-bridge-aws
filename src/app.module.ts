import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { CommonModule } from './common/common.module';
import { AppEnvsConfig, EnvValidationSchema } from './config/env.config';
import { IngestionModule } from './modules/ingestion/ingestion.module';

@Module({
  imports: [
    IngestionModule,
    ConfigModule.forRoot({
      isGlobal: true,
      ignoreEnvFile: process.env.NODE_ENV == 'prod',
      load: [AppEnvsConfig],
      validationSchema: EnvValidationSchema,
    }),
    CommonModule,
  ],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}
