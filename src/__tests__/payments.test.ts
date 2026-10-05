import { describe, expect, it, vi } from 'vitest';

import { money } from '@/lib/money';
import { mockPaymentProvider } from '@/services/payments/mock';
import { createPayPalProvider } from '@/services/payments/paypal';
import { PaymentError } from '@/services/payments/types';

const input = {
  reference: 'ISIO-ORDER-1',
  amount: money(4500),
  description: 'Coral bead necklace by Ese',
  payeeEmail: 'ese@example.com',
  returnUrl: 'http://localhost:3000/checkout/return',
  cancelUrl: 'http://localhost:3000/checkout/cancel',
};

describe('mock payments', () => {
  it('creates, then captures exactly once', async () => {
    const created = await mockPaymentProvider.createPayment(input);
    expect(created.approveUrl).toContain('/checkout/mock-approve?token=');

    const captured = await mockPaymentProvider.capturePayment(created.providerOrderId);
    expect(captured.status).toBe('COMPLETED');
    expect(captured.amount).toEqual(money(4500));

    await expect(mockPaymentProvider.capturePayment(created.providerOrderId)).rejects.toBeInstanceOf(PaymentError);
  });
});

function jsonResponse(body: unknown, status = 200): Response {
  return new Response(JSON.stringify(body), { status, headers: { 'Content-Type': 'application/json' } });
}

describe('PayPal Orders v2 client', () => {
  function setup(responses: Response[]) {
    const fetchImpl = vi.fn<typeof fetch>();
    for (const r of responses) fetchImpl.mockResolvedValueOnce(r);
    const provider = createPayPalProvider({ clientId: 'cid', clientSecret: 'secret', env: 'sandbox', fetchImpl });
    return { provider, fetchImpl };
  }

  const token = () => jsonResponse({ access_token: 'tok', expires_in: 32400 });

  it('creates an order paid directly to the creative', async () => {
    const { provider, fetchImpl } = setup([
      token(),
      jsonResponse({
        id: 'PP-ORDER-1',
        status: 'PAYER_ACTION_REQUIRED',
        links: [{ rel: 'payer-action', href: 'https://www.sandbox.paypal.com/checkoutnow?token=PP-ORDER-1' }],
      }),
    ]);

    const created = await provider.createPayment(input);
    expect(created).toEqual({
      providerOrderId: 'PP-ORDER-1',
      approveUrl: 'https://www.sandbox.paypal.com/checkoutnow?token=PP-ORDER-1',
    });

    const [authUrl, authInit] = fetchImpl.mock.calls[0]!;
    expect(authUrl).toBe('https://api-m.sandbox.paypal.com/v1/oauth2/token');
    expect(authInit?.body).toBe('grant_type=client_credentials');

    const [orderUrl, orderInit] = fetchImpl.mock.calls[1]!;
    expect(orderUrl).toBe('https://api-m.sandbox.paypal.com/v2/checkout/orders');
    const headers = orderInit?.headers as Record<string, string>;
    expect(headers['PayPal-Request-Id']).toBe('create-ISIO-ORDER-1');
    const body = JSON.parse(String(orderInit?.body));
    expect(body.intent).toBe('CAPTURE');
    expect(body.purchase_units[0].amount).toEqual({ currency_code: 'USD', value: '45.00' });
    expect(body.purchase_units[0].payee).toEqual({ email_address: 'ese@example.com' });
    expect(body.payment_source.paypal.experience_context.return_url).toBe(input.returnUrl);
  });

  it('reuses the access token across calls', async () => {
    const { provider, fetchImpl } = setup([
      token(),
      jsonResponse({ id: 'A', status: 'CREATED', links: [{ rel: 'approve', href: 'https://x/a' }] }),
      jsonResponse({ id: 'B', status: 'CREATED', links: [{ rel: 'approve', href: 'https://x/b' }] }),
    ]);
    await provider.createPayment(input);
    await provider.createPayment({ ...input, reference: 'ISIO-ORDER-2' });
    const authCalls = fetchImpl.mock.calls.filter(([url]) => String(url).endsWith('/v1/oauth2/token'));
    expect(authCalls).toHaveLength(1);
  });

  it('captures and normalises the result', async () => {
    const { provider } = setup([
      token(),
      jsonResponse({
        id: 'PP-ORDER-1',
        status: 'COMPLETED',
        purchase_units: [
          { payments: { captures: [{ id: 'CAP-1', status: 'COMPLETED', amount: { currency_code: 'USD', value: '45.00' } }] } },
        ],
      }),
    ]);
    const captured = await provider.capturePayment('PP-ORDER-1');
    expect(captured).toEqual({ providerOrderId: 'PP-ORDER-1', captureId: 'CAP-1', status: 'COMPLETED', amount: money(4500) });
  });

  it('surfaces PayPal errors as PaymentError', async () => {
    const { provider } = setup([token(), jsonResponse({ name: 'UNPROCESSABLE_ENTITY' }, 422)]);
    await expect(provider.capturePayment('PP-ORDER-1')).rejects.toBeInstanceOf(PaymentError);
  });
});
