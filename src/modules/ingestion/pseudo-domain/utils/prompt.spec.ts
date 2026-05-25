import { promptInferSale } from './prompt';

describe('promptInferSale', () => {
  it('returns a non-empty prompt with role and task sections', () => {
    const prompt = promptInferSale();
    expect(prompt.length).toBeGreaterThan(100);
    expect(prompt).toContain('ROL');
    expect(prompt).toContain('billId');
    expect(prompt).toContain('currency');
  });
});
