import { GoogleGenAI } from '@google/genai';
import { Inject, Injectable, Logger } from '@nestjs/common';
import type { ConfigType } from '@nestjs/config';
import { AppEnvsConfig } from 'src/config/env.config';
import { JsonSchema7Type } from 'zod-to-json-schema';
import z from 'zod/v3';

@Injectable()
export class AiService {
  private ai: GoogleGenAI;
  private readonly logger = new Logger(AiService.name);

  constructor(
    @Inject(AppEnvsConfig.KEY)
    private configService: ConfigType<typeof AppEnvsConfig>,
  ) {
    this.ai = new GoogleGenAI({ apiKey: this.configService.openAiKey });
  }

  async getStructuredOutputAI<T>(
    dataForAI: Array<object>,
    schemaOut: JsonSchema7Type,
    schemaValidator: z.ZodSchema<T>,
  ): Promise<void | T> {
    try {
      const payload = {
        model: this.configService.openAiModel,
        contents: dataForAI,
        config: {
          responseMimeType: 'application/json',
          responseJsonSchema: schemaOut,
        },
      };

      const response = await this.ai.models.generateContent(payload);

      if (!response?.text) return console.warn('No se recibió contenido de texto del modelo', response);

      return schemaValidator.parse(JSON.parse(response.text));
    } catch (err: unknown) {
      return console.error('Hubo un error al llamar a la API de la AI', err);
    }
  }
}
