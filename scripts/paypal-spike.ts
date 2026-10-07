import { createInterface } from 'node:readline/promises';
import { stdin, stdout } from 'node:process';

import { z } from 'zod';

import { env, modes } from '@/lib/env';
import { formatMoney, money } from '@/lib/money';
import { createPayPalProvider } from '@/services/payments/paypal';
import { PaymentError } from '@/services/payments/types';

/**
 * F1 PayPal spike: answers the day-one questions in src/services/commerce/CLAUDE.md
 * against the real sandbox. Results go into docs/PAYPAL_SETUP.md ("What we verified").
 *
 *   pnpm paypal:spike
 *   (= tsx --env-file=.env.local scripts/paypal-spike.ts)
 *
 * Needs in .env.local: PAYPAL_CLIENT_ID, PAYPAL_CLIENT_SECRET and SPIKE_PAYEE_EMAIL
 * (the email of a sandbox *business* account that is not the app's own account).
 * Run it twice to answer question 3: once with a US/UK payee, once with a Nigerian one.
 *
 * Prints ids, statuses, link rels and the payee. Never prints tokens or secrets.
 */

// Spike-only setting, so it stays out of the app's env schema on purpose.
const spikeEnv = z
  .object({ SPIKE_PAYEE_EMAIL: z.email() })
  .safeParse({ SPIKE_PAYEE_EMAIL: process.env.SPIKE_PAYEE_EMAIL });

const SPIKE_AMOUNT = money(100); // 1.00 USD
const SPIKE_TRACKING_NUMBER = 'ISIO-SPIKE-0000001';

interface PayPalLink {
  href: string;
  rel: string;
  method?: string;
}

interface RawOrder {
  id?: string;
  status?: string;
  links?: PayPalLink[];
  purchase_units?: Array<{
    payee?: { email_address?: string; merchant_id?: string };
    payments?: {
      captures?: Array<{
        id: string;
        status: string;
        status_details?: { reason?: string };
        amount?: { currency_code: string; value: string };
        seller_receivable_breakdown?: { net_amount?: { currency_code: string; value: string } };
      }>;
    };
  }>;
}

/**
 * The client exposes only what the app needs (approve URL, capture status). The
 * spike also needs the raw responses (link rels, payee) and a bearer token for an
 * endpoint the client doesn't have (track). A recording fetch gives us both without
 * changing production code.
 */
function recordingFetch() {
  const responses: Array<{ path: string; body: unknown }> = [];
  let bearer: string | null = null;

  const fetchImpl: typeof fetch = async (input, init) => {
    const url = typeof input === 'string' ? input : input instanceof URL ? input.href : input.url;
    const res = await fetch(input, init);

    const auth = new Headers(init?.headers).get('authorization');
    if (auth?.startsWith('Bearer ')) bearer = auth;

    const body = await res.clone().json().catch(() => undefined);
    responses.push({ path: new URL(url).pathname, body });
    return res;
  };

  return {
    fetchImpl,
    last(pathSuffix: string): unknown {
      return responses.filter((r) => r.path.endsWith(pathSuffix)).at(-1)?.body;
    },
    bearer(): string {
      if (!bearer) throw new Error('No PayPal access token has been obtained yet');
      return bearer;
    },
  };
}

async function orderStatus(orderId: string, bearer: string): Promise<string> {
  const res = await fetch(`https://api-m.sandbox.paypal.com/v2/checkout/orders/${encodeURIComponent(orderId)}`, {
    headers: { Authorization: bearer },
  });
  if (!res.ok) return `unknown (HTTP ${res.status})`;
  const body = (await res.json()) as RawOrder;
  return body.status ?? 'unknown';
}

function pretty(value: unknown): string {
  return JSON.stringify(value, null, 2);
}

function fail(message: string): never {
  console.error(`\n✗ ${message}`);
  process.exit(1);
}

async function main(): Promise<void> {
  console.log('Isio PayPal spike (F1)\n');

  if (modes.payments !== 'paypal' || !env.PAYPAL_CLIENT_ID || !env.PAYPAL_CLIENT_SECRET) {
    fail(
      'PayPal credentials missing. Put PAYPAL_CLIENT_ID and PAYPAL_CLIENT_SECRET in .env.local ' +
        '(docs/PAYPAL_SETUP.md steps 1 to 3) and run again.',
    );
  }
  if (env.PAYPAL_ENV !== 'sandbox') fail('This spike only runs against the sandbox. Set PAYPAL_ENV="sandbox".');
  if (!spikeEnv.success) {
    fail('SPIKE_PAYEE_EMAIL must be the email of a sandbox business account (not the app owner). Set it in .env.local.');
  }
  const payeeEmail = spikeEnv.data.SPIKE_PAYEE_EMAIL;

  const recorder = recordingFetch();
  const provider = createPayPalProvider({
    clientId: env.PAYPAL_CLIENT_ID,
    clientSecret: env.PAYPAL_CLIENT_SECRET,
    env: 'sandbox',
    fetchImpl: recorder.fetchImpl,
  });

  console.log(`Environment: ${env.PAYPAL_ENV}`);
  console.log(`Payee:       ${payeeEmail}`);
  console.log(`Amount:      ${formatMoney(SPIKE_AMOUNT)}\n`);

  // 1. Payee-direct order
  const reference = `SPIKE-${Date.now().toString(36).toUpperCase()}`;
  console.log('1. Creating payee-direct order…');
  const created = await provider.createPayment({
    reference,
    amount: SPIKE_AMOUNT,
    description: 'Isio sandbox spike: payee-direct test',
    payeeEmail,
    returnUrl: `${env.NEXT_PUBLIC_APP_URL}/checkout/return?orderId=${reference}`,
    cancelUrl: `${env.NEXT_PUBLIC_APP_URL}/checkout/cancel?orderId=${reference}`,
  });
  const createRaw = recorder.last('/v2/checkout/orders') as RawOrder | undefined;
  console.log(`   PayPal order id: ${created.providerOrderId}`);
  console.log(`   Order status:    ${createRaw?.status ?? '(unknown)'}`);

  // 2. Approval link type
  const approval = createRaw?.links?.find((l) => l.href === created.approveUrl);
  console.log(`   Link rels:       ${(createRaw?.links ?? []).map((l) => l.rel).join(', ') || '(none)'}`);
  console.log(`\n2. Approval link rel: ${approval?.rel ?? '(not found in links)'}`);
  console.log(`   ${created.approveUrl}\n`);
  console.log('   Open the link, sign in as the sandbox PERSONAL (buyer) account and approve the payment.');
  console.log('   PayPal will redirect to a localhost URL that may not load. That is fine.');

  // Capturing an unapproved order fails with ORDER_NOT_APPROVED, so confirm the
  // approval with PayPal first and let the tester try again if it isn't there yet.
  const rl = createInterface({ input: stdin, output: stdout });
  for (;;) {
    const answer = await rl.question('   Press Enter here once you have approved (or type q to quit)… ');
    if (answer.trim().toLowerCase() === 'q') {
      rl.close();
      fail('Stopped before capture. The order was not captured.');
    }
    const status = await orderStatus(created.providerOrderId, recorder.bearer());
    if (status === 'APPROVED') break;
    console.log(`   PayPal still shows the order as ${status}, not APPROVED.`);
    console.log('   Finish the approval in the browser: log in as the Personal account and click the pay button.');
  }
  rl.close();

  // 3. Capture
  console.log('\n3. Capturing…');
  const captured = await provider.capturePayment(created.providerOrderId);
  const captureRaw = recorder.last('/capture') as RawOrder | undefined;
  const unit = captureRaw?.purchase_units?.[0];
  const rawCapture = unit?.payments?.captures?.[0];
  console.log(`   Capture id:       ${captured.captureId}`);
  console.log(`   Capture status:   ${captured.status} (PayPal: ${rawCapture?.status ?? '?'}${rawCapture?.status_details?.reason ? `, reason ${rawCapture.status_details.reason}` : ''})`);
  console.log(`   Captured amount:  ${formatMoney(captured.amount)}`);
  if (rawCapture?.seller_receivable_breakdown?.net_amount) {
    const net = rawCapture.seller_receivable_breakdown.net_amount;
    console.log(`   Payee net amount: ${net.value} ${net.currency_code}`);
  }
  console.log(`   Payee (response): ${pretty(unit?.payee ?? '(no payee in response)').replace(/\n/g, '\n                     ')}`);
  console.log(`   Payee matches SPIKE_PAYEE_EMAIL: ${unit?.payee?.email_address?.toLowerCase() === payeeEmail.toLowerCase() ? 'yes' : 'NO'}`);

  // 4. Tracking on a payee-direct order
  console.log('\n4. Adding tracking (POST /v2/checkout/orders/{id}/track)…');
  const trackRes = await fetch(
    `https://api-m.sandbox.paypal.com/v2/checkout/orders/${encodeURIComponent(created.providerOrderId)}/track`,
    {
      method: 'POST',
      headers: {
        Authorization: recorder.bearer(),
        'Content-Type': 'application/json',
        'PayPal-Request-Id': `track-${created.providerOrderId}`,
      },
      body: JSON.stringify({
        capture_id: captured.captureId,
        tracking_number: SPIKE_TRACKING_NUMBER,
        carrier: 'OTHER',
        carrier_name_other: 'Isio spike carrier',
        notify_payer: false,
      }),
    },
  );
  const trackBody: unknown = await trackRes.json().catch(() => undefined);
  console.log(`   HTTP ${trackRes.status}`);
  if (trackRes.ok) {
    const trackers = (trackBody as { purchase_units?: Array<{ shipping?: { trackers?: unknown[] } }> })
      .purchase_units?.[0]?.shipping?.trackers;
    console.log(`   Tracking accepted. Trackers on the order: ${trackers?.length ?? 0}`);
    if (trackers) console.log(`   ${pretty(trackers).replace(/\n/g, '\n   ')}`);
  } else {
    // PayPal error bodies carry name, message, details and a debug_id; no secrets.
    console.log(`   Tracking rejected:\n   ${pretty(trackBody).replace(/\n/g, '\n   ')}`);
  }

  console.log('\nNext: log in at https://www.sandbox.paypal.com as the payee and confirm the money landed there,');
  console.log('then fill the "What we verified" table in docs/PAYPAL_SETUP.md.');
  console.log('For question 3, run again with SPIKE_PAYEE_EMAIL set to a Nigerian sandbox business account.');
}

main().catch((err: unknown) => {
  if (err instanceof PaymentError) {
    console.error(`\n✗ ${err.message}`);
    if (err.details !== undefined) console.error(pretty(err.details));
  } else {
    console.error('\n✗', err instanceof Error ? err.message : err);
  }
  process.exit(1);
});
