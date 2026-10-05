import { fromPayPalValue, toPayPalValue } from '@/lib/money';

import type { CapturedPayment, CaptureStatus, CreatedPayment, CreatePaymentInput, PaymentProvider } from './types';
import { PaymentError } from './types';

/**
 * PayPal Orders v2 over REST.
 * Docs: https://developer.paypal.com/docs/api/orders/v2/
 *
 * Flow: createPayment → buyer approves at approveUrl → capturePayment.
 * Webhooks (PAYMENT.CAPTURE.COMPLETED etc.) confirm the result server-side;
 * see src/services/commerce/CLAUDE.md for the verification rules.
 */

export interface PayPalConfig {
  clientId: string;
  clientSecret: string;
  env: 'sandbox' | 'live';
  brandName?: string;
  fetchImpl?: typeof fetch; // injectable for tests
}

const BASE_URL = {
  sandbox: 'https://api-m.sandbox.paypal.com',
  live: 'https://api-m.paypal.com',
} as const;

interface PayPalLink {
  href: string;
  rel: string;
  method?: string;
}

interface PayPalOrderResponse {
  id: string;
  status: string;
  links?: PayPalLink[];
  purchase_units?: Array<{
    payments?: {
      captures?: Array<{
        id: string;
        status: string;
        amount: { currency_code: string; value: string };
      }>;
    };
  }>;
}

export function createPayPalProvider(config: PayPalConfig): PaymentProvider {
  const baseUrl = BASE_URL[config.env];
  const doFetch = config.fetchImpl ?? fetch;
  let cachedToken: { value: string; expiresAt: number } | null = null;

  async function accessToken(): Promise<string> {
    if (cachedToken && Date.now() < cachedToken.expiresAt) return cachedToken.value;

    const basic = Buffer.from(`${config.clientId}:${config.clientSecret}`).toString('base64');
    const res = await doFetch(`${baseUrl}/v1/oauth2/token`, {
      method: 'POST',
      headers: {
        Authorization: `Basic ${basic}`,
        'Content-Type': 'application/x-www-form-urlencoded',
      },
      body: 'grant_type=client_credentials',
    });
    if (!res.ok) throw new PaymentError(`PayPal auth failed (${res.status})`, await safeJson(res));

    const json = (await res.json()) as { access_token: string; expires_in: number };
    // Refresh a minute early so a token never expires mid-request.
    cachedToken = { value: json.access_token, expiresAt: Date.now() + (json.expires_in - 60) * 1000 };
    return cachedToken.value;
  }

  async function call<T>(path: string, init: { method: string; body?: unknown; requestId?: string }): Promise<T> {
    const token = await accessToken();
    const res = await doFetch(`${baseUrl}${path}`, {
      method: init.method,
      headers: {
        Authorization: `Bearer ${token}`,
        'Content-Type': 'application/json',
        ...(init.requestId ? { 'PayPal-Request-Id': init.requestId } : {}),
      },
      body: init.body === undefined ? undefined : JSON.stringify(init.body),
    });
    if (!res.ok) throw new PaymentError(`PayPal ${init.method} ${path} failed (${res.status})`, await safeJson(res));
    return (await res.json()) as T;
  }

  return {
    name: 'paypal',

    async createPayment(input: CreatePaymentInput): Promise<CreatedPayment> {
      const order = await call<PayPalOrderResponse>('/v2/checkout/orders', {
        method: 'POST',
        // Idempotency: retrying the same Isio reference never creates a second PayPal order.
        requestId: `create-${input.reference}`,
        body: {
          intent: 'CAPTURE',
          purchase_units: [
            {
              reference_id: input.reference,
              description: input.description.slice(0, 127),
              amount: { currency_code: input.amount.currency, value: toPayPalValue(input.amount) },
              ...(input.payeeEmail ? { payee: { email_address: input.payeeEmail } } : {}),
            },
          ],
          payment_source: {
            paypal: {
              experience_context: {
                brand_name: config.brandName ?? 'Isio',
                user_action: 'PAY_NOW',
                return_url: input.returnUrl,
                cancel_url: input.cancelUrl,
              },
            },
          },
        },
      });

      const approve = order.links?.find((l) => l.rel === 'payer-action' || l.rel === 'approve');
      if (!approve) throw new PaymentError('PayPal did not return an approval link', order);
      return { providerOrderId: order.id, approveUrl: approve.href };
    },

    async capturePayment(providerOrderId: string): Promise<CapturedPayment> {
      const order = await call<PayPalOrderResponse>(
        `/v2/checkout/orders/${encodeURIComponent(providerOrderId)}/capture`,
        { method: 'POST', requestId: `capture-${providerOrderId}` },
      );
      const capture = order.purchase_units?.[0]?.payments?.captures?.[0];
      if (!capture) throw new PaymentError('PayPal capture returned no capture record', order);

      return {
        providerOrderId: order.id,
        captureId: capture.id,
        status: normaliseCaptureStatus(capture.status),
        amount: fromPayPalValue(capture.amount.value),
      };
    },
  };
}

function normaliseCaptureStatus(status: string): CaptureStatus {
  if (status === 'COMPLETED') return 'COMPLETED';
  if (status === 'DECLINED' || status === 'FAILED') return 'DECLINED';
  return 'PENDING'; // PENDING, or anything PayPal adds later: treat as not-yet-paid
}

async function safeJson(res: Response): Promise<unknown> {
  try {
    return await res.json();
  } catch {
    return undefined;
  }
}
