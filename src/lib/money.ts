import type { CurrencyCode, Money } from '@/types/shared';

/** Build a Money value, rejecting floats and negatives at the boundary. */
export function money(cents: number, currency: CurrencyCode = 'USD'): Money {
  if (!Number.isInteger(cents) || cents < 0) {
    throw new Error(`Money must be a non-negative integer number of cents, got ${cents}`);
  }
  return { cents, currency };
}

export function addMoney(a: Money, b: Money): Money {
  if (a.currency !== b.currency) throw new Error('Cannot add different currencies');
  return money(a.cents + b.cents, a.currency);
}

/** Cents → PayPal decimal string ("45.00"). Integer maths only, no floats. */
export function toPayPalValue(m: Money): string {
  const whole = Math.floor(m.cents / 100);
  const fraction = String(m.cents % 100).padStart(2, '0');
  return `${whole}.${fraction}`;
}

/** PayPal decimal string ("45.00" or "45") → Money. */
export function fromPayPalValue(value: string, currency: CurrencyCode = 'USD'): Money {
  const match = /^(\d+)(?:\.(\d{1,2}))?$/.exec(value.trim());
  if (!match) throw new Error(`Not a valid PayPal amount: "${value}"`);
  const whole = Number(match[1]);
  const fraction = Number((match[2] ?? '0').padEnd(2, '0'));
  return money(whole * 100 + fraction, currency);
}

/** "$45.00" */
export function formatMoney(m: Money): string {
  return new Intl.NumberFormat('en-US', { style: 'currency', currency: m.currency }).format(
    m.cents / 100,
  );
}

/** Approximate naira for display only (e.g. "≈ ₦67,500"). Never use for charging. */
export function formatNairaApprox(m: Money, usdToNgnRate: number): string {
  const naira = Math.round((m.cents / 100) * usdToNgnRate);
  return `≈ ₦${new Intl.NumberFormat('en-NG').format(naira)}`;
}
