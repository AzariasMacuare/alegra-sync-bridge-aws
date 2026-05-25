import { Test, TestingModule } from '@nestjs/testing';
import { appEnvsProvider } from 'src/test/test-utils';
import { SaleSchema } from '../../pseudo-domain/schemas/sale.schema';
import { AiService } from './ai.service';

const generateContent = jest.fn();

jest.mock('@google/genai', () => ({
  GoogleGenAI: jest.fn().mockImplementation(() => ({
    models: { generateContent },
  })),
}));

describe('AiService', () => {
  let service: AiService;

  beforeEach(async () => {
    jest.clearAllMocks();
    const module: TestingModule = await Test.createTestingModule({
      providers: [AiService, appEnvsProvider],
    }).compile();

    service = module.get<AiService>(AiService);
  });

  const validSale = {
    country: 'Colombia',
    price: 100,
    currency: 'COP',
    location: 'Store',
    category: 'Otros',
    billId: 'B-1',
  };

  it('parses structured JSON from model response', async () => {
    generateContent.mockResolvedValue({ text: JSON.stringify(validSale) });

    const result = await service.getStructuredOutputAI(
      [{ text: 'prompt' }],
      {},
      SaleSchema,
    );

    expect(generateContent).toHaveBeenCalledWith(
      expect.objectContaining({
        model: 'gemini-test-model',
        contents: [{ text: 'prompt' }],
      }),
    );
    expect(result).toEqual(validSale);
  });

  it('returns undefined when model returns no text', async () => {
    const warnSpy = jest.spyOn(console, 'warn').mockImplementation();
    generateContent.mockResolvedValue({ text: undefined });

    const result = await service.getStructuredOutputAI([], {}, SaleSchema);

    expect(result).toBeUndefined();
    warnSpy.mockRestore();
  });

  it('logs error and returns undefined on API failure', async () => {
    const errorSpy = jest.spyOn(console, 'error').mockImplementation();
    generateContent.mockRejectedValue(new Error('quota exceeded'));

    const result = await service.getStructuredOutputAI([], {}, SaleSchema);

    expect(result).toBeUndefined();
    errorSpy.mockRestore();
  });
});
