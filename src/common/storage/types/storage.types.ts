export type FileWithTransactionId = Express.Multer.File & { transactionId: string };

export type ManifestStorage = {
  transactionId: string;
  payload: unknown;
  attached: MetadataFileStoraged[];
};

export type MetadataFileStoraged = {
  key: string;
};

export type FileDownloadedOutput<T = string | Buffer> = {
  file?: T | null;
  mimeType?: string;
};
