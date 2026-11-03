import { formatAmount, formatNaira, roundKobo } from '../src/common/money';

describe('money', () => {
  it('formats naira with kobo', () => {
    expect(formatNaira(12500)).toBe('₦12,500.00');
    expect(formatNaira(1250.5)).toBe('₦1,250.50');
    expect(formatAmount(30000)).toBe('30,000.00');
  });

  it('rounds to the nearest kobo', () => {
    expect(roundKobo(1.005)).toBe(1.01);
    expect(roundKobo(4999.9875)).toBe(4999.99);
  });
});
