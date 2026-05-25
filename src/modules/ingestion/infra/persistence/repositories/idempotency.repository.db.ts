import { DynamoDBClient } from '@aws-sdk/client-dynamodb';
import { DynamoDBDocumentClient, GetCommand, PutCommand, UpdateCommand } from '@aws-sdk/lib-dynamodb';
import { Inject, Injectable } from '@nestjs/common';
import type { ConfigType } from '@nestjs/config';
import { AppEnvsConfig } from 'src/config/env.config';
import { IdempotencyItem, IdempotencyStatus } from '../../../pseudo-domain/types/Idempotency.types';

@Injectable()
export class IdempotencyRepository {
  private readonly docClient: DynamoDBDocumentClient;
  private readonly tableName: string;

  constructor(
    @Inject(AppEnvsConfig.KEY)
    private config: ConfigType<typeof AppEnvsConfig>,
  ) {
    const client = new DynamoDBClient({
      region: this.config.awsRegion,
    });
    this.docClient = DynamoDBDocumentClient.from(client);
    this.tableName = this.config.idempotencyTable;
  }

  async createLock(id: string) {
    const payload: IdempotencyItem = {
      id,
      status: IdempotencyStatus.processing,
      ttl: Math.floor(Date.now() / 1000) + 60 * 60 * 24 * 3,
      createdAt: new Date().toISOString(),
    };

    const command = new PutCommand({
      TableName: this.tableName,
      Item: payload,
      ConditionExpression: 'attribute_not_exists(id)',
    });

    try {
      await this.docClient.send(command);
    } catch (error: unknown) {
      throw new Error(error instanceof Error ? error.message : String(error));
    }
  }

  async bindIdempotencyIdToClient(id: string, connectionId: string): Promise<void> {
    const command = new UpdateCommand({
      TableName: this.tableName,
      Key: { id },
      UpdateExpression: 'SET connectionId = :connectionId',
      ExpressionAttributeValues: {
        ':connectionId': connectionId,
      },
      ConditionExpression: 'attribute_exists(id)',
    });

    try {
      await this.docClient.send(command);
    } catch (error: unknown) {
      throw new Error(error instanceof Error ? error.message : String(error));
    }
  }

  async findById<T = IdempotencyItem>(id: string): Promise<T> {
    const command = new GetCommand({
      TableName: this.tableName,
      Key: { id },
    });
    return (await this.docClient.send(command)).Item as T;
  }
}
