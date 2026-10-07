# PayPal sandbox setup

Isio runs without any PayPal account (demo mode simulates payments). Follow these steps to switch to the real **PayPal sandbox**, where every payment goes through PayPal's actual APIs with test money.

Menu names in the PayPal developer dashboard may differ slightly from the ones below.

## 1. Get a developer account (5 minutes)

1. Go to [developer.paypal.com](https://developer.paypal.com) and log in with a PayPal account, or sign up for one.
2. The sandbox is free and separate from real money.

## 2. Create a sandbox app

1. In the developer dashboard, open **Apps & Credentials** and choose the **Sandbox** tab.
2. **Create App**: name it `Isio`, type **Merchant**.
3. Copy the **Client ID** and **Secret** into `.env.local`:

   ```
   PAYPAL_ENV="sandbox"
   PAYPAL_CLIENT_ID="your-sandbox-client-id"
   PAYPAL_CLIENT_SECRET="your-sandbox-secret"
   ```

4. Restart `pnpm dev` and open [localhost:3000/api/health](http://localhost:3000/api/health). It should show `"payments": "paypal"`.

## 3. Create test accounts for buyers and creatives

In **Testing Tools → Sandbox Accounts** you'll find a default **Personal** (buyer) and **Business** account.

- **Buyer:** use the Personal account to log in when PayPal asks you to approve a payment.
- **Creatives:** Isio pays each creative directly, so each demo creative needs their own sandbox **Business** account. Create one per creative and put its email in that creative's profile as their PayPal email.
- Check where money landed by logging in to [sandbox.paypal.com](https://www.sandbox.paypal.com) with the creative's sandbox account.

## 4. Webhooks (on a deployed URL)

PayPal can only send webhooks to a public URL, so set these up on your deployment (Vercel/Render preview), not localhost. Locally, Isio confirms payments when the buyer returns from PayPal.

1. In your sandbox app, open **Webhooks → Add Webhook**.
2. URL: `https://<your-deployment>/api/webhooks/paypal`
3. Events: `PAYMENT.CAPTURE.COMPLETED`, `PAYMENT.CAPTURE.DENIED`, `PAYMENT.CAPTURE.REFUNDED`.
4. Copy the **Webhook ID** into your deployment's environment as `PAYPAL_WEBHOOK_ID`. Isio uses it to verify every webhook with PayPal before acting on it.

## 5. Run the spike

`scripts/paypal-spike.ts` checks the assumptions below against the real sandbox: one 1.00 USD order paid directly to a creative's account, approved by the buyer, captured, then a tracking number added. It prints ids, statuses and the payee; never tokens or secrets.

1. Add to `.env.local` the email of a sandbox **Business** account that is not the one your app belongs to (in **Sandbox Accounts**, create one if needed):

   ```
   SPIKE_PAYEE_EMAIL="creative-test@business.example.com"
   ```

2. Run `pnpm paypal:spike`. It creates the order and prints the approval link.
3. Open the link, log in as the sandbox **Personal** account and approve. The redirect to `localhost` may not load; that is expected. Back in the terminal, press Enter.
4. The script captures the order and tries to add tracking, then prints the results.
5. Log in to [sandbox.paypal.com](https://www.sandbox.paypal.com) as the payee account and check the 1.00 USD arrived there, not in the app owner's account.
6. For the Nigerian question, create a sandbox Business account with country **Nigeria**, set `SPIKE_PAYEE_EMAIL` to it and run again.

## 6. What we verified in the sandbox

Filled in from `scripts/paypal-spike.ts` runs. Webhooks are verified separately on a deployed preview, where PayPal can reach the app.

| Question | Result | Date |
|---|---|---|
| Payee-direct order (money lands in the creative's sandbox account) | not yet verified | |
| Approval link type returned (`payer-action` / `approve`) | `payer-action`. With `payment_source.paypal.experience_context` set, create returns status `PAYER_ACTION_REQUIRED` and links `self` and `payer-action` only. No `approve` link. | 2026-10-05 |
| Nigerian sandbox business account as payee | not yet verified | |
| Webhooks delivered for payee-direct captures | not yet verified | |
| Add tracking on payee-direct orders | not yet verified | |

## Useful links

- [Orders v2 API reference](https://developer.paypal.com/docs/api/orders/v2/)
- [Webhooks: verify signature](https://developer.paypal.com/docs/api/webhooks/v1/)
- [Sandbox testing guide](https://developer.paypal.com/tools/sandbox/)
- [PayPal Agent Toolkit (GitHub)](https://github.com/paypal/agent-toolkit/)
- [PayPal AI Hackathon resources](https://paypalaihackathon.devpost.com/resources)
