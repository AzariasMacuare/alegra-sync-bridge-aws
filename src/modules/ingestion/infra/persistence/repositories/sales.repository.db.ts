import { DynamoDBClient } from '@aws-sdk/client-dynamodb';
import { DynamoDBDocumentClient, GetCommand, PutCommand } from '@aws-sdk/lib-dynamodb';
import { Inject, Injectable } from '@nestjs/common';
import type { ConfigType } from '@nestjs/config';
import { AppEnvsConfig } from 'src/config/env.config';
import { SaleType } from 'src/modules/ingestion/pseudo-domain/types/sale.types';

@Injectable()
export class SalesRepository {
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
    this.tableName = this.config.salesTable;
  }

  async createSale(sale: SaleType) {
    const command = new PutCommand({
      TableName: this.tableName,
      Item: sale,
      ConditionExpression: 'attribute_not_exists(id)',
    });

    try {
      await this.docClient.send(command);
    } catch (error: unknown) {
      throw new Error(error instanceof Error ? error.message : String(error));
    }
  }

  async findById<T = SaleType>(id: string): Promise<T> {
    const command = new GetCommand({
      TableName: this.tableName,
      Key: { id },
    });
    return (await this.docClient.send(command)).Item as T;
  }
}
