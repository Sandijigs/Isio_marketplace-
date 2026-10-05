import type { Money } from '@/types/shared';

import type { CapturedPayment, CreatedPayment, CreatePaymentInput, PaymentProvider } from './types';
import { PaymentError } from './types';

/**
 * Mock payments: behaves like PayPal from the caller's point of view.
 * The approve URL points at Isio's own /checkout/mock-approve page (built in
 * the checkout feature), which returns the buyer to returnUrl with ?token=<id>.
 */

interface MockOrder {
  amount: Money;
  reference: string;
  captured: boolean;
}

const globalForMock = globalThis as unknown as { __isioMockOrders?: Map<string, MockOrder> };
const orders = (globalForMock.__isioMockOrders ??= new Map<string, MockOrder>());

let counter = 0;
function mockId(prefix: string): string {
  counter += 1;
  return `${prefix}-${Date.now().toString(36).toUpperCase()}-${counter}`;
}

export const mockPaymentProvider: PaymentProvider = {
  name: 'mock',

  async createPayment(input: CreatePaymentInput): Promise<CreatedPayment> {
    const providerOrderId = mockId('MOCK-ORDER');
    orders.set(providerOrderId, { amount: input.amount, reference: input.reference, captured: false });
    const params = new URLSearchParams({
      token: providerOrderId,
      returnUrl: input.returnUrl,
      cancelUrl: input.cancelUrl,
    });
    return { providerOrderId, approveUrl: `/checkout/mock-approve?${params.toString()}` };
  },

  async capturePayment(providerOrderId: string): Promise<CapturedPayment> {
    const order = orders.get(providerOrderId);
    if (!order) throw new PaymentError(`Unknown mock order ${providerOrderId}`);
    if (order.captured) throw new PaymentError(`Mock order ${providerOrderId} already captured`);
    order.captured = true;
    return {
      providerOrderId,
      captureId: mockId('MOCK-CAPTURE'),
      status: 'COMPLETED',
      amount: order.amount,
    };
  },
};
