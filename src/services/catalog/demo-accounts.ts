import { eq, inArray } from 'drizzle-orm';

import { getDb, schema } from '@/db/client';
import { env, modes } from '@/lib/env';
import type { DemoAccount } from '@/types/shared';

import { hashPassword } from './password';

/**
 * Shared accounts so a judge can try both sides in one tap. Fictional people,
 * labelled as demo makers on their storefronts. Listings arrive with the seed (F4).
 */

const DEMO_PASSWORD = 'market-day';

export const DEMO_ACCOUNTS: readonly DemoAccount[] = [
  { email: 'tobi@example.com', password: DEMO_PASSWORD, name: 'Tobi', role: 'BUYER', description: 'Buyer in Toronto' },
  { email: 'ese@example.com', password: DEMO_PASSWORD, name: 'Ese', role: 'CREATIVE', description: 'Beadworker in Warri' },
  { email: 'kemi@example.com', password: DEMO_PASSWORD, name: 'Kemi', role: 'CREATIVE', description: 'Adire dyer in Abeokuta' },
];

/**
 * Storefronts for the demo creatives. Stories stay plain and make no claims
 * about techniques, materials or heritage: they're fictional, so nothing here
 * should read as a fact about a real tradition. PayPal emails stay empty
 * until the seed (F4) assigns sandbox business accounts.
 */
const DEMO_PROFILES: ReadonlyArray<{
  email: string;
  handle: string;
  displayName: string;
  craft: string;
  location: string;
  story: string;
}> = [
  {
    email: 'ese@example.com',
    handle: 'ese',
    displayName: 'Ese',
    craft: 'Beadwork',
    location: 'Warri, Delta State',
    story:
      'I make beaded necklaces, bracelets and bags in my workshop in Warri. Tell me the colours you love and I will make something just for you.',
  },
  {
    email: 'kemi@example.com',
    handle: 'kemi',
    displayName: 'Kemi',
    craft: 'Adire textiles',
    location: 'Abeokuta, Ogun State',
    story:
      'I dye and sew wrappers, scarves and table runners. Every piece is dyed by hand, so no two come out quite the same.',
  },
];

const DEMO_EMAILS: ReadonlySet<string> = new Set(DEMO_ACCOUNTS.map((a) => a.email));

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

// The key carries a version so a dev server that ran an older seed (accounts only) re-runs it.
const globalForDemo = globalThis as unknown as { __isioDemoSeedV2?: Promise<void> };

/**
 * Create any missing demo accounts and storefront profiles. Safe to call on
 * every request: runs once per process (cached on globalThis to survive hot
 * reloads), retries after a failure, and never overwrites a demo profile
 * someone has since edited.
 */
export function ensureDemoAccounts(): Promise<void> {
  if (!demoAccountsEnabled()) return Promise.resolve();
  globalForDemo.__isioDemoSeedV2 ??= seed().catch((err: unknown) => {
    globalForDemo.__isioDemoSeedV2 = undefined;
    throw err;
  });
  return globalForDemo.__isioDemoSeedV2;
}

async function seed(): Promise<void> {
  const db = getDb();
  const emails = DEMO_ACCOUNTS.map((a) => a.email);
  const existing = await db.select({ email: schema.users.email }).from(schema.users).where(inArray(schema.users.email, emails));
  const have = new Set(existing.map((r) => r.email));
  const missing = DEMO_ACCOUNTS.filter((a) => !have.has(a.email));

  if (missing.length > 0) {
    const passwordHash = await hashPassword(DEMO_PASSWORD);
    await db
      .insert(schema.users)
      .values(missing.map((a) => ({ email: a.email, name: a.name, role: a.role, passwordHash })))
      .onConflictDoNothing({ target: schema.users.email });
  }

  for (const profile of DEMO_PROFILES) {
    const [user] = await db.select({ id: schema.users.id }).from(schema.users).where(eq(schema.users.email, profile.email)).limit(1);
    if (!user) continue;
    const { email: _email, ...fields } = profile;
    // Do nothing if the creative already has a profile, or if a real creative already took the handle.
    await db.insert(schema.creativeProfiles).values({ userId: user.id, ...fields }).onConflictDoNothing();
  }
}
