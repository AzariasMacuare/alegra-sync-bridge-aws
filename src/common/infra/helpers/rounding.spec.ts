import { RoundToTwo } from './rounding';

describe('RoundToTwo', () => {
  it('rounds to two decimal places', () => {
    expect(RoundToTwo(10.126)).toBe(10.13);
    expect(RoundToTwo(10.124)).toBe(10.12);
  });

  it('keeps integers unchanged', () => {
    expect(RoundToTwo(100)).toBe(100);
  });

  it('handles floating point edge cases', () => {
    expect(RoundToTwo(1.005)).toBe(1.01);
  });
});
