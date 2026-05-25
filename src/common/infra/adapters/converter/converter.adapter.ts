import { Inject, Injectable } from '@nestjs/common';
import type { ConfigType } from '@nestjs/config';
import axios from 'axios';
import { AppEnvsConfig } from 'src/config/env.config';
import { MainSaleCurrency } from 'src/modules/ingestion/pseudo-domain/types/sale.types';
import { RoundToTwo } from '../../helpers/rounding';
import { ConverterResponse } from './types/converter.types';

@Injectable()
export class ConverterService {
  constructor(
    @Inject(AppEnvsConfig.KEY)
    private config: ConfigType<typeof AppEnvsConfig>,
  ) {}

  async exchageAmountToUSD(currency: string, amount: number): Promise<number> {
    const url = `${this.config.currencyConverterApiUrl}/${this.config.currencyConverterApiKey}/pair/${currency}/${MainSaleCurrency}/${amount}`;
    const response = await axios.get<ConverterResponse>(url);
    return RoundToTwo(response.data.conversion_result);
  }
}
