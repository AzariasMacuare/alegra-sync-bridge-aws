import { DynamoDBClient } from '@aws-sdk/client-dynamodb';
import { DynamoDBDocumentClient, GetCommand, PutCommand, UpdateCommand } from '@aws-sdk/lib-dynamodb';
import { Inject, Injectable } from '@nestjs/common';
import type { ConfigType } from '@nestjs/config';
import { AppEnvsConfig } from 'src/config/env.config';
import { ConnectionType } from 'src/modules/ingestion/pseudo-domain/types/connection.types';

@Injectable()
export class ConnectionsRepository {
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
    this.tableName = this.config.connectionsTable;
  }

  async createConnection(connection: ConnectionType) {
    const command = new PutCommand({
      TableName: this.tableName,
      Item: connection,
      ConditionExpression: 'attribute_not_exists(transactionId)',
    });

    try {
      await this.docClient.send(command);
    } catch (error: unknown) {
      throw new Error(`Error al hacer bind de una conexión ${error instanceof Error ? error.message : String(error)})`);
    }
  }

  async updateConnection(connection: ConnectionType): Promise<void> {
    const { id, connectionId } = connection;
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

  async findById<T = ConnectionType>(id: string): Promise<T> {
    const command = new GetCommand({
      TableName: this.tableName,
      Key: { id },
    });
    return (await this.docClient.send(command)).Item as T;
  }
}
