import { Module } from '@nestjs/common';
import { ConverterService } from './infra/adapters/converter/converter.adapter';
import { StorageService } from './storage/storage.service';

@Module({
  providers: [StorageService, ConverterService],
  exports: [StorageService, ConverterService],
  imports: [],
})
export class CommonModule {}
