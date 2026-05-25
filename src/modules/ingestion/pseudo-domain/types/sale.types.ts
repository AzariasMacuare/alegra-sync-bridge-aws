import z from 'zod/v3';
import { SaleSchema } from '../schemas/sale.schema';

export type SaleType = z.infer<typeof SaleSchema> & { id?: string };

export const MainSaleCurrency = 'USD';
