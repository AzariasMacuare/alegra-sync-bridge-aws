import { Generatehash } from './hashing';

describe('Generatehash', () => {
  it('returns a deterministic sha256 hex for the same sale fields', () => {
    const sale = { billId: 'INV-001' };
    expect(Generatehash(sale)).toBe(Generatehash({ billId: 'INV-001' }));
    expect(Generatehash(sale)).toMatch(/^[a-f0-9]{64}$/);
  });

  it('produces different hashes for different bill ids', () => {
    expect(Generatehash({ billId: 'A' })).not.toBe(Generatehash({ billId: 'B' }));
  });

  it('is case-insensitive on joined values', () => {
    expect(Generatehash({ billId: 'ABC' })).toBe(Generatehash({ billId: 'abc' }));
  });
});
