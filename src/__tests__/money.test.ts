import { describe, expect, it } from 'vitest';

import { addMoney, formatMoney, formatNairaApprox, fromPayPalValue, money, toPayPalValue } from '@/lib/money';

describe('money', () => {
  it('rejects floats and negatives', () => {
    expect(() => money(10.5)).toThrow();
    expect(() => money(-1)).toThrow();
  });

  it('converts cents to PayPal decimal strings without float errors', () => {
    expect(toPayPalValue(money(4500))).toBe('45.00');
    expect(toPayPalValue(money(5))).toBe('0.05');
    expect(toPayPalValue(money(1999))).toBe('19.99');
  });

  it('parses PayPal decimal strings back to cents', () => {
    expect(fromPayPalValue('45.00')).toEqual(money(4500));
    expect(fromPayPalValue('19.9')).toEqual(money(1990));
    expect(fromPayPalValue('7')).toEqual(money(700));
    expect(() => fromPayPalValue('-3.00')).toThrow();
    expect(() => fromPayPalValue('1.234')).toThrow();
  });

  it('round-trips every cent value', () => {
    for (const cents of [0, 1, 99, 100, 101, 123456]) {
      expect(fromPayPalValue(toPayPalValue(money(cents))).cents).toBe(cents);
    }
  });

  it('adds same-currency amounts', () => {
    expect(addMoney(money(4500), money(1200))).toEqual(money(5700));
  });

  it('formats for display', () => {
    expect(formatMoney(money(4500))).toBe('$45.00');
    expect(formatNairaApprox(money(4500), 1500)).toBe('≈ ₦67,500');
  });
});
