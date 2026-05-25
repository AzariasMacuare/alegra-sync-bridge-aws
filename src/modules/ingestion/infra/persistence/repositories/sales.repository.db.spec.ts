import { DynamoDBDocumentClient, PutCommand } from '@aws-sdk/lib-dynamodb';
import { Test, TestingModule } from '@nestjs/testing';
import { appEnvsProvider } from 'src/test/test-utils';
import { SalesRepository } from './sales.repository.db';

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

describe('SalesRepository', () => {
  let repository: SalesRepository;

  const sale = {
    id: 'sale-1',
    country: 'Colombia',
    price: 10,
    currency: 'USD',
    location: 'Shop',
    category: 'Otros',
    billId: 'B-1',
  };

  beforeEach(async () => {
    jest.clearAllMocks();
    const module: TestingModule = await Test.createTestingModule({
      providers: [SalesRepository, appEnvsProvider],
    }).compile();

    repository = module.get<SalesRepository>(SalesRepository);
  });

  it('creates sale with idempotency condition', async () => {
    mockSend.mockResolvedValue({});
    await repository.createSale(sale);

    expect(mockSend).toHaveBeenCalled();
    const command = mockSend.mock.calls[0][0] as PutCommand;
    expect(command.input.TableName).toBe('test-sales');
    expect(command.input.Item).toEqual(sale);
  });

  it('throws on createSale dynamodb error', async () => {
    mockSend.mockRejectedValue(new Error('duplicate'));
    await expect(repository.createSale(sale)).rejects.toThrow('duplicate');
  });

  it('finds sale by id', async () => {
    mockSend.mockResolvedValue({ Item: sale });
    const found = await repository.findById('sale-1');
    expect(found).toEqual(sale);
  });
});
