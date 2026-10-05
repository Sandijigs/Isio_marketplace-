import { z } from 'zod';

/**
 * Environment, validated once. Every integration has a MOCK mode so the app
 * runs with zero credentials (judges and contributors can `pnpm dev` and go).
 *
 *   no DATABASE_URL            → embedded PGlite Postgres in ./.data/isio
 *   no PAYPAL_CLIENT_ID/SECRET → mock payments (simulated approve + capture)
 *   no ANTHROPIC_API_KEY       → mock AI (deterministic, realistic drafts)
 *
 * PAYMENTS_MODE / AI_MODE can force a mode explicitly.
 */

const optionalString = z
  .string()
  .optional()
  .transform((v) => (v && v.trim() !== '' ? v : undefined));

const envSchema = z.object({
  NODE_ENV: z.enum(['development', 'test', 'production']).default('development'),
  NEXT_PUBLIC_APP_URL: z.url().default('http://localhost:3000'),

  DATABASE_URL: optionalString,
  PGLITE_DIR: z.string().default('./.data/isio'),

  PAYMENTS_MODE: z.enum(['mock', 'paypal']).optional(),
  PAYPAL_ENV: z.enum(['sandbox', 'live']).default('sandbox'),
  PAYPAL_CLIENT_ID: optionalString,
  PAYPAL_CLIENT_SECRET: optionalString,
  PAYPAL_WEBHOOK_ID: optionalString,

  AI_MODE: z.enum(['mock', 'live']).optional(),
  ANTHROPIC_API_KEY: optionalString,
  AI_MODEL: z.string().default('claude-sonnet-5'),

  SESSION_SECRET: optionalString,

  /** Display-only USD→NGN rate for "≈ ₦" hints. Never used for charging. */
  DEMO_USD_NGN_RATE: z.coerce.number().positive().default(1500),
});

export type Env = z.infer<typeof envSchema>;

export function parseEnv(source: Record<string, string | undefined>): Env {
  return envSchema.parse(source);
}

export const env: Env = parseEnv(process.env);

export type PaymentsMode = 'mock' | 'paypal';
export type AiMode = 'mock' | 'live';
export type DbMode = 'pglite' | 'postgres';

export function resolveModes(e: Env): { payments: PaymentsMode; ai: AiMode; db: DbMode } {
  const hasPayPal = Boolean(e.PAYPAL_CLIENT_ID && e.PAYPAL_CLIENT_SECRET);
  const hasAi = Boolean(e.ANTHROPIC_API_KEY);
  return {
    payments: e.PAYMENTS_MODE ?? (hasPayPal ? 'paypal' : 'mock'),
    ai: e.AI_MODE ?? (hasAi ? 'live' : 'mock'),
    db: e.DATABASE_URL ? 'postgres' : 'pglite',
  };
}

export const modes = resolveModes(env);
