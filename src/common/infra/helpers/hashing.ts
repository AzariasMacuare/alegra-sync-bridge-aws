import crypto from 'crypto';
import { SaleType } from 'src/modules/ingestion/pseudo-domain/types/sale.types';

export function Generatehash(sale: Partial<SaleType>): string {
  const stringToHash = Object.values(sale).join(' ').toLowerCase().trim();
  return crypto.createHash('sha256').update(stringToHash).digest('hex');
}
