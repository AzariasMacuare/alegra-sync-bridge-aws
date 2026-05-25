import { getIngestionFilePath, getIngestionManifestPath } from './utils';

describe('storage path utils', () => {
  const fixedDate = new Date('2026-05-21T12:00:00.000Z');

  beforeEach(() => {
    jest.useFakeTimers();
    jest.setSystemTime(fixedDate);
  });

  afterEach(() => {
    jest.useRealTimers();
  });

  it('builds file path with transaction id and original name', () => {
    const path = getIngestionFilePath({
      transactionId: '01HX',
      originalname: 'receipt.jpg',
    } as Express.Multer.File & { transactionId: string });

    expect(path).toBe('ingestion/2026-05-21/files/01HX/receipt.jpg');
  });

  it('builds manifest path with transaction id', () => {
    const path = getIngestionManifestPath({
      transactionId: '01HX',
      payload: '{}',
      attached: [],
    });

    expect(path).toBe('ingestion/2026-05-21/manifests/01HX-manifest.json');
  });
});
