import { DynamoDBDocumentClient, PutCommand } from '@aws-sdk/lib-dynamodb';
import { Test, TestingModule } from '@nestjs/testing';
import { appEnvsProvider } from 'src/test/test-utils';
import { IdempotencyStatus } from '../../../pseudo-domain/types/Idempotency.types';
import { IdempotencyRepository } from './idempotency.repository.db';

const mockSend = jest.fn();

jest.mock('@aws-sdk/lib-dynamodb', () => {
  const actual = jest.requireActual('@aws-sdk/lib-dynamodb');
  return {
    ...actual,
    DynamoDBDocumentClient: {
      from: jest.fn(() => ({ send: mockSend })),
    },
  };
});

describe('IdempotencyRepository', () => {
  let repository: IdempotencyRepository;

  beforeEach(async () => {
    jest.clearAllMocks();
    const module: TestingModule = await Test.createTestingModule({
      providers: [IdempotencyRepository, appEnvsProvider],
    }).compile();

    repository = module.get<IdempotencyRepository>(IdempotencyRepository);
    expect(DynamoDBDocumentClient.from).toHaveBeenCalled();
  });

  it('creates lock with processing status and condition', async () => {
    mockSend.mockResolvedValue({});
    await repository.createLock('hash-1');

    expect(mockSend).toHaveBeenCalled();
    const command = mockSend.mock.calls[0][0] as PutCommand;
    expect(command.input.TableName).toBe('test-idempotency');
    expect(command.input.Item).toMatchObject({
      id: 'hash-1',
      status: IdempotencyStatus.processing,
    });
    expect(command.input.ConditionExpression).toBe('attribute_not_exists(id)');
  });

  it('throws wrapped error when createLock fails', async () => {
    mockSend.mockRejectedValue(new Error('ConditionalCheckFailed'));
    await expect(repository.createLock('dup')).rejects.toThrow('ConditionalCheckFailed');
  });

  it('binds connection id to existing idempotency record', async () => {
    mockSend.mockResolvedValue({});
    await repository.bindIdempotencyIdToClient('hash-1', 'ws-conn');
    expect(mockSend).toHaveBeenCalled();
  });

  it('throws wrapped error when bindIdempotencyIdToClient fails', async () => {
    mockSend.mockRejectedValue(new Error('ConditionalCheckFailed'));
    await expect(repository.bindIdempotencyIdToClient('hash-1', 'ws-conn')).rejects.toThrow(
      'ConditionalCheckFailed',
    );
  });

  it('finds item by id', async () => {
    mockSend.mockResolvedValue({ Item: { id: 'hash-1', status: IdempotencyStatus.processing } });
    const item = await repository.findById('hash-1');
    expect(item).toEqual({ id: 'hash-1', status: IdempotencyStatus.processing });
  });
});
