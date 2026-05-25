import { Test, TestingModule } from '@nestjs/testing';
import axios from 'axios';
import { appEnvsProvider } from 'src/test/test-utils';
import { ConverterService } from './converter.adapter';

jest.mock('axios');
const mockedAxios = axios as jest.Mocked<typeof axios>;

describe('ConverterService', () => {
  let service: ConverterService;

  beforeEach(async () => {
    jest.clearAllMocks();
    const module: TestingModule = await Test.createTestingModule({
      providers: [ConverterService, appEnvsProvider],
    }).compile();

    service = module.get<ConverterService>(ConverterService);
  });

  it('converts amount to USD using external API', async () => {
    mockedAxios.get.mockResolvedValue({
      data: { conversion_result: 10.126 },
    });

    const result = await service.exchageAmountToUSD('COP', 50000);

    expect(mockedAxios.get).toHaveBeenCalledWith(
      'https://converter.test.example/test-cc-key/pair/COP/USD/50000',
    );
    expect(result).toBe(10.13);
  });

  it('propagates axios errors', async () => {
    mockedAxios.get.mockRejectedValue(new Error('API down'));
    await expect(service.exchageAmountToUSD('EUR', 100)).rejects.toThrow('API down');
  });
});
