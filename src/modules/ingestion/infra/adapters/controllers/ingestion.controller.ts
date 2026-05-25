import { Body, Controller, Inject, Param, Post, Query, UploadedFiles, UseInterceptors } from '@nestjs/common';
import { AnyFilesInterceptor } from '@nestjs/platform-express';
import { ApiQuery } from '@nestjs/swagger';
import { IngestionService } from '../../../application/services/ingestion.service';
import { NotificationsSocketGateway } from '../notification.gateway';

@Controller('ingest')
export class IngestionController {
  @Inject()
  private ingestionService: IngestionService;
  @Inject()
  private socketGateway: NotificationsSocketGateway;

  @Post('register')
  registerConnection() {
    return this.ingestionService.registerIngestTransactionId();
  }

  @Post(':transactionId')
  @UseInterceptors(
    AnyFilesInterceptor({
      limits: { files: 2 },
    }),
  )
  handleIngestion(
    @Param('transactionId') transactionId: string,
    @Body() body: unknown,
    @Query() query: unknown,
    @UploadedFiles() files?: Array<Express.Multer.File>,
  ) {
    return this.ingestionService.execute(transactionId, { body, query }, files);
  }

  @Post('notification/:step/:transactionId')
  @ApiQuery({ name: 'step', type: Number, required: true, description: 'Número del paso' })
  proveSocket(@Param('step') step: number, @Param('transactionId') transactionId: string) {
    void this.socketGateway.notifyStep(transactionId, { step: Number(step) });
    return { message: 'Notificación enviada' };
  }
}
