import { env, modes } from '@/lib/env';

import { mockPaymentProvider } from './mock';
import { createPayPalProvider } from './paypal';
import type { PaymentProvider } from './types';

let provider: PaymentProvider | null = null;

/** The payment provider for the current mode (mock without PayPal keys). */
export function getPaymentProvider(): PaymentProvider {
  if (provider) return provider;

  if (modes.payments === 'paypal') {
    if (!env.PAYPAL_CLIENT_ID || !env.PAYPAL_CLIENT_SECRET) {
      throw new Error('PAYMENTS_MODE=paypal needs PAYPAL_CLIENT_ID and PAYPAL_CLIENT_SECRET');
    }
    provider = createPayPalProvider({
      clientId: env.PAYPAL_CLIENT_ID,
      clientSecret: env.PAYPAL_CLIENT_SECRET,
      env: env.PAYPAL_ENV,
    });
  } else {
    provider = mockPaymentProvider;
  }
  return provider;
}

export type { CapturedPayment, CreatedPayment, CreatePaymentInput, PaymentProvider } from './types';
export { PaymentError } from './types';
