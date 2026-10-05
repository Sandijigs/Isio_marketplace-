import type { Money } from '@/types/shared';

/**
 * The only payment interface the rest of Isio talks to. Two implementations:
 *   - mock:   simulated approve + capture, no network (default without keys)
 *   - paypal: PayPal Orders v2 REST API (sandbox or live)
 */

export interface CreatePaymentInput {
  /** Isio's own order/commission id. Sent to PayPal as reference_id. */
  reference: string;
  amount: Money;
  description: string;
  /**
   * The creative's PayPal email. When set, PayPal pays the creative directly
   * (Isio never holds the money). Verify payee support in the sandbox spike.
   */
  payeeEmail?: string;
  returnUrl: string;
  cancelUrl: string;
}

export interface CreatedPayment {
  providerOrderId: string;
  /** Where to send the buyer to approve the payment. */
  approveUrl: string;
}

export type CaptureStatus = 'COMPLETED' | 'PENDING' | 'DECLINED';

export interface CapturedPayment {
  providerOrderId: string;
  captureId: string;
  status: CaptureStatus;
  amount: Money;
}

export interface PaymentProvider {
  readonly name: 'mock' | 'paypal';
  createPayment(input: CreatePaymentInput): Promise<CreatedPayment>;
  capturePayment(providerOrderId: string): Promise<CapturedPayment>;
}

export class PaymentError extends Error {
  constructor(
    message: string,
    readonly details?: unknown,
  ) {
    super(message);
    this.name = 'PaymentError';
  }
}
