import { env, modes } from '@/lib/env';
import type { DemoAccount } from '@/types/shared';

/**
 * Shared accounts so a judge can try both sides in one tap. Fictional people,
 * labelled as demo makers on their storefronts. The seed (demo-seed.ts)
 * creates them along with three more makers who have stalls but no sign-in.
 */

export const DEMO_PASSWORD = 'market-day';

export const DEMO_ACCOUNTS: readonly DemoAccount[] = [
  { email: 'tobi@example.com', password: DEMO_PASSWORD, name: 'Tobi', role: 'BUYER', description: 'Buyer in Toronto' },
  { email: 'ese@example.com', password: DEMO_PASSWORD, name: 'Ese', role: 'CREATIVE', description: 'Beadworker in Warri' },
  { email: 'kemi@example.com', password: DEMO_PASSWORD, name: 'Kemi', role: 'CREATIVE', description: 'Adire dyer in Abeokuta' },
];

/** Seeded makers nobody signs in as. Their stalls fill the demo catalog. */
export const DEMO_MAKER_EMAILS: readonly string[] = ['ejiro@example.com', 'amaka@example.com', 'tari@example.com'];

const DEMO_EMAILS: ReadonlySet<string> = new Set([...DEMO_ACCOUNTS.map((a) => a.email), ...DEMO_MAKER_EMAILS]);

export function isDemoEmail(email: string): boolean {
  return DEMO_EMAILS.has(email.toLowerCase());
}

/**
 * Demo accounts exist everywhere except where Isio takes live payments: in
 * demo mode, and on the hosted sandbox demo judges use. Never with live money.
 */
export function demoAccountsEnabled(): boolean {
  return !(modes.payments === 'paypal' && env.PAYPAL_ENV === 'live');
}
