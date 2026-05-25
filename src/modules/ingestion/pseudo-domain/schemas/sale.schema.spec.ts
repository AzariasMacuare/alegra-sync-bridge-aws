import { SaleSchema, StructuredOut } from './sale.schema';

describe('SaleSchema', () => {
  const validSale = {
    country: 'Colombia',
    price: 15000.5,
    currency: 'COP',
    location: 'Café Central',
    category: 'Alimentación y Bebidas',
    billId: 'FAC-123',
  };

  it('accepts a valid sale object', () => {
    expect(SaleSchema.parse(validSale)).toEqual(validSale);
  });

  it('rejects currency codes that are not 3 characters', () => {
    expect(() => SaleSchema.parse({ ...validSale, currency: 'US' })).toThrow();
    expect(() => SaleSchema.parse({ ...validSale, currency: 'USDD' })).toThrow();
  });

  it('rejects missing required fields', () => {
    const { billId: _, ...incomplete } = validSale;
    expect(() => SaleSchema.parse(incomplete)).toThrow();
  });

  it('exports JSON schema for structured AI output', () => {
    expect(StructuredOut.sale).toBeDefined();
    expect(StructuredOut.sale).toHaveProperty('type');
  });
});
