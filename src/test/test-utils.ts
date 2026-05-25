import { AppEnvsConfig } from 'src/config/env.config';

export const mockAppEnvs = {
  openAiKey: 'test-openai-key',
  openAiUrl: 'https://api.test.example',
  openAiModel: 'gemini-test-model',
  manifestBucketName: 'test-manifest-bucket',
  awsRegion: 'us-east-1',
  idempotencyTable: 'test-idempotency',
  currencyConverterApiKey: 'test-cc-key',
  currencyConverterApiUrl: 'https://converter.test.example',
  salesTable: 'test-sales',
  connectionsTable: 'test-connections',
  socketBaseUrl: 'wss://abc123.execute-api.us-east-1.amazonaws.com/prod',
};

export const appEnvsProvider = {
  provide: AppEnvsConfig.KEY,
  useValue: mockAppEnvs,
};

export const setTestEnvVars = (): void => {
  process.env.OPENAI_API_KEY = mockAppEnvs.openAiKey;
  process.env.OPENAI_BASE_URL = mockAppEnvs.openAiUrl;
  process.env.OPENAI_MODEL = mockAppEnvs.openAiModel;
  process.env.AWS_MANIFEST_BUCKET_NAME = mockAppEnvs.manifestBucketName;
  process.env.APP_AWS_REGION = mockAppEnvs.awsRegion;
  process.env.IDEMPOTENCY_TABLE = mockAppEnvs.idempotencyTable;
  process.env.CURRENCY_CONVERTER_API_KEY = mockAppEnvs.currencyConverterApiKey;
  process.env.CURRENCY_CONVERTER_API_URL = mockAppEnvs.currencyConverterApiUrl;
  process.env.SALES_TABLE = mockAppEnvs.salesTable;
  process.env.CONNECTIONS_TABLE = mockAppEnvs.connectionsTable;
  process.env.SOCKET_BASE_URL = mockAppEnvs.socketBaseUrl;
};
