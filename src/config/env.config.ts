import { registerAs } from '@nestjs/config';
import * as Joi from 'joi';

export const EnvValidationSchema = Joi.object({
  OPENAI_API_KEY: Joi.string().required(),
  OPENAI_BASE_URL: Joi.string().required(),
  OPENAI_MODEL: Joi.string().required(),
  AWS_MANIFEST_BUCKET_NAME: Joi.string().required(),
  APP_AWS_REGION: Joi.string().required(),
  IDEMPOTENCY_TABLE: Joi.string().required(),
  CURRENCY_CONVERTER_API_KEY: Joi.string().required(),
  CURRENCY_CONVERTER_API_URL: Joi.string().required(),
  SALES_TABLE: Joi.string().required(),
  CONNECTIONS_TABLE: Joi.string().required(),
  SOCKET_BASE_URL: Joi.string().required(),
});

export const AppEnvsConfig = registerAs('app-envs', () => ({
  openAiKey: process.env.OPENAI_API_KEY!,
  openAiUrl: process.env.OPENAI_BASE_URL!,
  openAiModel: process.env.OPENAI_MODEL!,
  manifestBucketName: process.env.AWS_MANIFEST_BUCKET_NAME!,
  awsRegion: process.env.APP_AWS_REGION!,
  idempotencyTable: process.env.IDEMPOTENCY_TABLE!,
  currencyConverterApiKey: process.env.CURRENCY_CONVERTER_API_KEY!,
  currencyConverterApiUrl: process.env.CURRENCY_CONVERTER_API_URL!,
  salesTable: process.env.SALES_TABLE!,
  connectionsTable: process.env.CONNECTIONS_TABLE!,
  socketBaseUrl: process.env.SOCKET_BASE_URL!,
}));
