import { ApiGatewayManagementApiClient, PostToConnectionCommand } from '@aws-sdk/client-apigatewaymanagementapi';
import { Inject } from '@nestjs/common';
import type { ConfigType } from '@nestjs/config';
import { AppEnvsConfig } from 'src/config/env.config';

export class NotificationsSocketGateway {
  constructor(
    @Inject(AppEnvsConfig.KEY)
    private configService: ConfigType<typeof AppEnvsConfig>,
  ) {}

  async notifyStep(id: string | undefined, payload: { step: number; aditional?: any }) {
    const URL = this.configService.socketBaseUrl.replace(/^wss:\/\//, 'https://');
    const client = new ApiGatewayManagementApiClient({
      endpoint: URL,
    });
    const command = new PostToConnectionCommand({
      ConnectionId: id,
      Data: Buffer.from(JSON.stringify(payload)),
    });

    try {
      // eslint-disable-next-line @typescript-eslint/no-unsafe-call
      await client.send(command);
    } catch (error) {
      console.error('Error enviando mensaje por WebSocket:', error);
    }
  }
}
