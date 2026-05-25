import { zodToJsonSchema } from 'zod-to-json-schema';
import { z } from 'zod/v3';

export const SaleSchema = z.object({
  country: z.string().describe('País detectado en la data'),
  price: z.number().describe('Monto total de la transacción'),
  currency: z.string().min(3).max(3).describe('Moneda en la que fué hecha la transacción'),
  location: z.string().describe('Nombre del comercio o lugar'),
  category: z.string().describe('Categoría contable sugerida'),
  billId: z.string().describe('Unique Transaction Id'),
});

export const StructuredOut = {
  sale: zodToJsonSchema(SaleSchema),
};
