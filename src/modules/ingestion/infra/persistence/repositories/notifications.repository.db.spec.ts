import { DynamoDBDocumentClient, PutCommand } from '@aws-sdk/lib-dynamodb';
import { Test, TestingModule } from '@nestjs/testing';
import { appEnvsProvider } from 'src/test/test-utils';
import { ConnectionsRepository } from './notifications.repository.db';

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

describe('ConnectionsRepository', () => {
  let repository: ConnectionsRepository;

  beforeEach(async () => {
    jest.clearAllMocks();
    const module: TestingModule = await Test.createTestingModule({
      providers: [ConnectionsRepository, appEnvsProvider],
    }).compile();

    repository = module.get<ConnectionsRepository>(ConnectionsRepository);
  });

  it('creates connection record', async () => {
    mockSend.mockResolvedValue({});
    await repository.createConnection({ id: 'tx-1', connectionId: '' });

    expect(mockSend).toHaveBeenCalled();
    const command = mockSend.mock.calls[0][0] as PutCommand;
    expect(command.input.TableName).toBe('test-connections');
  });

  it('wraps createConnection errors with descriptive message', async () => {
    mockSend.mockRejectedValue(new Error('ConditionalCheckFailed'));
    await expect(
      repository.createConnection({ id: 'tx-1', connectionId: '' }),
    ).rejects.toThrow(/Error al hacer bind de una conexión/);
  });

  it('updates connection id', async () => {
    mockSend.mockResolvedValue({});
    await repository.updateConnection({ id: 'tx-1', connectionId: 'ws-99' });
    expect(mockSend).toHaveBeenCalled();
  });

  it('finds connection by transaction id', async () => {
    mockSend.mockResolvedValue({ Item: { id: 'tx-1', connectionId: 'ws-99' } });
    const conn = await repository.findById('tx-1');
    expect(conn).toEqual({ id: 'tx-1', connectionId: 'ws-99' });
  });
});
