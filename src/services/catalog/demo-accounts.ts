import { inArray } from 'drizzle-orm';

import { getDb, schema } from '@/db/client';
import { env, modes } from '@/lib/env';
import type { DemoAccount } from '@/types/shared';

import { hashPassword } from './password';

/**
 * Shared accounts so a judge can try both sides in one tap. Fictional people.
 * Creative profiles and listings for them arrive with the seed (F4).
 */

const DEMO_PASSWORD = 'market-day';

export const DEMO_ACCOUNTS: readonly DemoAccount[] = [
  { email: 'tobi@example.com', password: DEMO_PASSWORD, name: 'Tobi', role: 'BUYER', description: 'Buyer in Toronto' },
  { email: 'ese@example.com', password: DEMO_PASSWORD, name: 'Ese', role: 'CREATIVE', description: 'Beadworker in Warri' },
  { email: 'kemi@example.com', password: DEMO_PASSWORD, name: 'Kemi', role: 'CREATIVE', description: 'Adire dyer in Abeokuta' },
];

/**
 * Demo accounts exist everywhere except where Isio takes live payments: in
 * demo mode, and on the hosted sandbox demo judges use. Never with live money.
 */
export function demoAccountsEnabled(): boolean {
  return !(modes.payments === 'paypal' && env.PAYPAL_ENV === 'live');
}

const globalForDemo = globalThis as unknown as { __isioDemoAccounts?: Promise<void> };

/**
 * Create any missing demo accounts. Safe to call on every request: runs once
 * per process (cached on globalThis to survive hot reloads), and retries after a failure.
 */
export function ensureDemoAccounts(): Promise<void> {
  if (!demoAccountsEnabled()) return Promise.resolve();
  globalForDemo.__isioDemoAccounts ??= createMissing().catch((err: unknown) => {
    globalForDemo.__isioDemoAccounts = undefined;
    throw err;
  });
  return globalForDemo.__isioDemoAccounts;
}

async function createMissing(): Promise<void> {
  const db = getDb();
  const emails = DEMO_ACCOUNTS.map((a) => a.email);
  const existing = await db.select({ email: schema.users.email }).from(schema.users).where(inArray(schema.users.email, emails));
  const have = new Set(existing.map((r) => r.email));
  const missing = DEMO_ACCOUNTS.filter((a) => !have.has(a.email));
  if (missing.length === 0) return;

  const passwordHash = await hashPassword(DEMO_PASSWORD);
  await db
    .insert(schema.users)
    .values(missing.map((a) => ({ email: a.email, name: a.name, role: a.role, passwordHash })))
    .onConflictDoNothing({ target: schema.users.email });
}
