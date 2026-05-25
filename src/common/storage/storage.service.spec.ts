import { GetObjectCommand, PutObjectCommand, S3Client } from '@aws-sdk/client-s3';
import { getSignedUrl } from '@aws-sdk/s3-request-presigner';
import { Test, TestingModule } from '@nestjs/testing';
import { appEnvsProvider } from 'src/test/test-utils';
import { StorageService } from './storage.service';

jest.mock('@aws-sdk/s3-request-presigner', () => ({
  getSignedUrl: jest.fn().mockResolvedValue('https://signed-url.example'),
}));

jest.mock('@aws-sdk/client-s3', () => {
  const send = jest.fn();
  return {
    S3Client: jest.fn().mockImplementation(() => ({ send })),
    GetObjectCommand: jest.fn((input) => ({ input, type: 'GetObject' })),
    PutObjectCommand: jest.fn((input) => ({ input, type: 'PutObject' })),
    __mockSend: send,
  };
});

const { __mockSend: mockS3Send } = jest.requireMock('@aws-sdk/client-s3') as {
  __mockSend: jest.Mock;
};

describe('StorageService', () => {
  let service: StorageService;

  beforeEach(async () => {
    jest.clearAllMocks();
    const module: TestingModule = await Test.createTestingModule({
      providers: [StorageService, appEnvsProvider],
    }).compile();

    service = module.get<StorageService>(StorageService);
  });

  it('returns file metadata with ingestion key', () => {
    const metadata = service.getFileMetadata({
      transactionId: 'tx-1',
      originalname: 'doc.pdf',
    } as Express.Multer.File & { transactionId: string });

    expect(metadata.key).toContain('ingestion/');
    expect(metadata.key).toContain('tx-1/doc.pdf');
  });

  it('uploads file to S3 with bucket and content type', async () => {
    mockS3Send.mockResolvedValue({ ETag: '"abc"' });
    const file = {
      transactionId: 'tx-1',
      originalname: 'img.png',
      mimetype: 'image/png',
      buffer: Buffer.from('data'),
    } as Express.Multer.File & { transactionId: string };

    await service.uploadFile(file);

    expect(PutObjectCommand).toHaveBeenCalled();
    expect(mockS3Send).toHaveBeenCalled();
  });

  it('uploads manifest as JSON', async () => {
    mockS3Send.mockResolvedValue({});
    await service.uploadManifest({
      transactionId: 'tx-1',
      payload: { foo: 1 },
      attached: [],
    });
    expect(PutObjectCommand).toHaveBeenCalled();
  });

  it('generates signed URL for file', async () => {
    const url = await service.getFileLink({
      transactionId: 'tx-1',
      originalname: 'a.txt',
    } as Express.Multer.File & { transactionId: string });
    expect(getSignedUrl).toHaveBeenCalled();
    expect(url).toBe('https://signed-url.example');
  });

  it('downloads text file from S3', async () => {
    mockS3Send.mockResolvedValue({
      Body: { transformToString: jest.fn().mockResolvedValue('{"ok":true}') },
      ContentType: 'application/json',
    });

    const result = await service.downloadTextFile({ key: 'manifest.json' });
    expect(GetObjectCommand).toHaveBeenCalled();
    expect(result.file).toBe('{"ok":true}');
    expect(result.mimeType).toBe('application/json');
  });

  it('downloads image file as buffer', async () => {
    const bytes = new Uint8Array([1, 2, 3]);
    mockS3Send.mockResolvedValue({
      Body: { transformToByteArray: jest.fn().mockResolvedValue(bytes) },
      ContentType: 'image/png',
    });

    const result = await service.downloadImageFile({ key: 'img.png' });
    expect(result.file).toEqual(Buffer.from(bytes));
    expect(result.mimeType).toBe('image/png');
  });
});
