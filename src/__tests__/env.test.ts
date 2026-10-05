import { describe, expect, it } from 'vitest';

import { parseEnv, resolveModes } from '@/lib/env';

describe('mode detection', () => {
  it('runs everything in mock/embedded mode with no credentials', () => {
    expect(resolveModes(parseEnv({}))).toEqual({ payments: 'mock', ai: 'mock', db: 'pglite' });
  });

  it('switches each integration on when its credentials appear', () => {
    const modes = resolveModes(
      parseEnv({
        PAYPAL_CLIENT_ID: 'id',
        PAYPAL_CLIENT_SECRET: 'secret',
        ANTHROPIC_API_KEY: 'key',
        DATABASE_URL: 'postgres://u:p@localhost:5432/isio',
      }),
    );
    expect(modes).toEqual({ payments: 'paypal', ai: 'live', db: 'postgres' });
  });

  it('treats blank values as missing', () => {
    expect(resolveModes(parseEnv({ PAYPAL_CLIENT_ID: '', PAYPAL_CLIENT_SECRET: '  ' })).payments).toBe('mock');
  });

  it('lets an explicit mode override detection', () => {
    const modes = resolveModes(
      parseEnv({ PAYPAL_CLIENT_ID: 'id', PAYPAL_CLIENT_SECRET: 'secret', PAYMENTS_MODE: 'mock' }),
    );
    expect(modes.payments).toBe('mock');
  });
});
